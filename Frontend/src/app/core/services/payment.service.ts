import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment.development';
import {
  Payment,
  PaymentSummary,
  PaymentHistoryItem,
  CreatePaymentIntentRequest,
  PaymentIntentResponse,
  ConfirmPaymentRequest,
  PaymentConfirmationResponse,
  PaymentHistoryResponse,
  PaymentHistoryParams,
  PaymentProvider,
  PaymentStatus
} from '../../shared/models/payment.model';
import { ApiResponse, unwrapResponse } from '../../shared/models/api-response.model';

/**
 * PaymentService
 *
 * Service for managing payment operations in the Career Route application.
 * Handles payment intent creation, payment confirmation, and payment history retrieval.
 *
 * Features:
 * - Create payment intents for sessions (POST /api/payments/create-intent)
 * - Confirm payments after processing (POST /api/payments/confirm)
 * - Get payment history with filtering (GET /api/payments/history)
 * - Support for multiple payment providers (Stripe, Paymob)
 * - Automatic commission calculation (15% platform fee)
 * - Token management handled by authInterceptor
 * - Error handling done globally by errorInterceptor
 *
 * Payment Flow:
 * 1. User books session → Session created with status "Pending"
 * 2. Create payment intent → Get clientSecret for frontend payment
 * 3. User completes payment with Stripe/Paymob → Frontend handles payment UI
 * 4. Confirm payment → Session status changes to "Confirmed", video link generated
 * 5. Session completed → Payment held for 72 hours, then released to mentor
 *
 * Business Rules:
 * - Platform commission: 15% of session price
 * - Mentor payout: 85% of session price
 * - Payment providers: Stripe (USD), Paymob (EGP)
 * - Payment intent expires after 24 hours if not completed
 * - Payment held for 72 hours post-session before release
 * - Refund policy: >48h = 100%, 24-48h = 50%, <24h = 0%
 *
 * @remarks
 * - All endpoints require authentication (Bearer token)
 * - Based on Session-Payment-Endpoints.md contract
 * - Error handling is done globally by errorInterceptor
 * - Components only need to handle success cases
 * - Webhook endpoints are handled by backend only (not exposed to frontend)
 *
 * @example
 * ```typescript
 * // Create payment intent for a session
 * const request: CreatePaymentIntentRequest = {
 *   sessionId: 'session-guid-123',
 *   paymentProvider: PaymentProvider.Stripe,
 *   paymobPaymentMethod: undefined // Only required for Paymob
 * };
 * this.paymentService.createPaymentIntent(request).subscribe({
 *   next: (response) => {
 *     console.log('Payment Intent ID:', response.paymentIntentId);
 *     console.log('Client Secret:', response.clientSecret);
 *     console.log('Amount:', response.amount, response.currency);
 *     // Use clientSecret with Stripe.js or Paymob SDK
 *   }
 * });
 *
 * // Confirm payment after user completes payment
 * const confirmRequest: ConfirmPaymentRequest = {
 *   paymentIntentId: 'pi_3AbcDefGhiJkLmNoPqRsTuVw',
 *   sessionId: 'session-guid-123'
 * };
 * this.paymentService.confirmPayment(confirmRequest).subscribe({
 *   next: (response) => {
 *     console.log('Payment confirmed!');
 *     console.log('Session status:', response.session.status); // "Confirmed"
 *     console.log('Video link:', response.session.videoConferenceLink);
 *     this.notificationService.success('Payment successful!', 'Success');
 *   }
 * });
 *
 * // Get payment history
 * this.paymentService.getPaymentHistory({ page: 1, pageSize: 10 }).subscribe({
 *   next: (response) => {
 *     this.payments = response.payments;
 *     console.log('Total spent:', response.summary.totalSpent);
 *     console.log('Total refunded:', response.summary.totalRefunded);
 *   }
 * });
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private readonly http = inject(HttpClient);

  // API endpoints
  private readonly API_URL = environment.apiUrl;
  private readonly PAYMENTS_URL = `${this.API_URL}/payments`;

  // ==================== Create Payment Intent ====================

  /**
   * Create a payment intent for a session
   *
   * @param request - Payment intent request with sessionId and payment provider
   * @returns Observable of PaymentIntentResponse with clientSecret
   *
   * @remarks
   * - Endpoint: POST /api/payments/create-intent
   * - Requires authentication (User/mentee role)
   * - Session must be in "Pending" status
   * - Creates payment intent via Stripe or Paymob API
   * - Returns clientSecret for frontend to complete payment
   * - Payment intent expires after 24 hours if not completed
   * - Currency: USD for Stripe, EGP for Paymob
   * - Amount includes full session price (platform commission calculated on confirmation)
   * - Paymob requires paymobPaymentMethod (Card or EWallet)
   * - Returns 400 if session already has payment or validation fails
   * - Returns 404 if session not found
   *
   * @example
   * ```typescript
   * // Create payment intent with Stripe
   * const request: CreatePaymentIntentRequest = {
   *   sessionId: 'session-guid',
   *   paymentProvider: PaymentProvider.Stripe
   * };
   * this.paymentService.createPaymentIntent(request).subscribe({
   *   next: (response) => {
   *     // Use response.clientSecret with Stripe.js
   *     const stripe = Stripe(stripePublicKey);
   *     stripe.confirmCardPayment(response.clientSecret, {
   *       payment_method: { card: cardElement }
   *     });
   *   }
   * });
   *
   * // Create payment intent with Paymob
   * const paymobRequest: CreatePaymentIntentRequest = {
   *   sessionId: 'session-guid',
   *   paymentProvider: PaymentProvider.Paymob,
   *   paymobPaymentMethod: PaymobPaymentMethod.Card
   * };
   * this.paymentService.createPaymentIntent(paymobRequest).subscribe({
   *   next: (response) => {
   *     console.log('Amount:', response.amount, response.currency); // EGP
   *     // Use response.clientSecret with Paymob SDK
   *   }
   * });
   * ```
   */
  createPaymentIntent(request: CreatePaymentIntentRequest): Observable<PaymentIntentResponse> {
    return this.http
      .post<ApiResponse<PaymentIntentResponse>>(`${this.PAYMENTS_URL}/create-intent`, request)
      .pipe(map(response => unwrapResponse(response)));
  }

  // ==================== Confirm Payment ====================

  /**
   * Confirm payment after user completes payment with provider
   *
   * @param request - Confirmation request with paymentIntentId and sessionId
   * @returns Observable of PaymentConfirmationResponse with session details
   *
   * @remarks
   * - Endpoint: POST /api/payments/confirm
   * - Requires authentication (User/mentee role)
   * - Verifies payment intent status with Stripe/Paymob
   * - Validates payment amount matches session price
   * - Calculates 15% platform commission
   * - Updates payment status to "Captured"
   * - Updates session status to "Confirmed"
   * - Generates video conference link (Zoom meeting)
   * - Sends confirmation emails to mentee and mentor
   * - Schedules automated reminder notifications (24h and 1h before)
   * - Returns 400 if payment already processed
   * - Returns 402 if payment failed
   * - Returns 404 if payment intent or session not found
   *
   * @example
   * ```typescript
   * const request: ConfirmPaymentRequest = {
   *   paymentIntentId: 'pi_3AbcDefGhiJkLmNoPqRsTuVw',
   *   sessionId: 'session-guid-123'
   * };
   * this.paymentService.confirmPayment(request).subscribe({
   *   next: (response) => {
   *     console.log('Payment ID:', response.paymentId);
   *     console.log('Amount:', response.amount);
   *     console.log('Platform commission:', response.platformCommission);
   *     console.log('Mentor payout:', response.mentorPayoutAmount);
   *     console.log('Session status:', response.session.status); // "Confirmed"
   *     console.log('Video link:', response.session.videoConferenceLink);
   *     console.log('Scheduled start:', response.session.scheduledStartTime);
   *
   *     this.notificationService.success('Payment successful! Your session is confirmed.', 'Success');
   *     this.router.navigate(['/sessions', response.sessionId]);
   *   }
   * });
   * ```
   */
  confirmPayment(request: ConfirmPaymentRequest): Observable<PaymentConfirmationResponse> {
    return this.http
      .post<ApiResponse<PaymentConfirmationResponse>>(`${this.PAYMENTS_URL}/confirm`, request)
      .pipe(map(response => unwrapResponse(response)));
  }

  // ==================== Get Payment History ====================

  /**
   * Get payment history for current user with filtering and pagination
   *
   * @param params - Query parameters (page, pageSize, status filter)
   * @returns Observable of PaymentHistoryResponse with payments and summary
   *
   * @remarks
   * - Endpoint: GET /api/payments/history
   * - Requires authentication
   * - Returns payments where user is mentee
   * - Optional status filter: Pending, Captured, Refunded, Failed
   * - Ordered by paidAt DESC (most recent first)
   * - Includes summary statistics (totalSpent, totalRefunded, netSpent)
   * - Default pagination: page=1, pageSize=10
   * - Max pageSize: 50
   * - Returns 401 if not authenticated
   * - Returns 404 if no payment history found
   *
   * @example
   * ```typescript
   * // Get all payments with pagination
   * this.paymentService.getPaymentHistory({ page: 1, pageSize: 10 }).subscribe({
   *   next: (response) => {
   *     this.payments = response.payments;
   *     this.pagination = response.pagination;
   *     console.log('Total payments:', response.pagination.totalCount);
   *     console.log('Total spent:', response.summary.totalSpent);
   *     console.log('Total refunded:', response.summary.totalRefunded);
   *     console.log('Net spent:', response.summary.netSpent);
   *   }
   * });
   *
   * // Filter by status
   * this.paymentService.getPaymentHistory({
   *   page: 1,
   *   pageSize: 20,
   *   status: PaymentStatus.Captured
   * }).subscribe({
   *   next: (response) => {
   *     this.successfulPayments = response.payments;
   *   }
   * });
   *
   * // Get refunded payments
   * this.paymentService.getPaymentHistory({
   *   status: PaymentStatus.Refunded
   * }).subscribe({
   *   next: (response) => {
   *     this.refundedPayments = response.payments;
   *     response.payments.forEach(payment => {
   *       console.log('Refund amount:', payment.refundAmount);
   *       console.log('Refunded at:', payment.refundedAt);
   *     });
   *   }
   * });
   * ```
   */
  getPaymentHistory(params?: PaymentHistoryParams): Observable<PaymentHistoryResponse> {
    let httpParams = new HttpParams();

    if (params) {
      if (params.page !== undefined) {
        httpParams = httpParams.set('page', params.page.toString());
      }
      if (params.pageSize !== undefined) {
        httpParams = httpParams.set('pageSize', params.pageSize.toString());
      }
      if (params.status !== undefined) {
        httpParams = httpParams.set('status', params.status);
      }
    }

    return this.http
      .get<ApiResponse<PaymentHistoryResponse>>(`${this.PAYMENTS_URL}/history`, { params: httpParams })
      .pipe(map(response => unwrapResponse(response)));
  }

  // ==================== Helper Methods ====================

  /**
   * Calculate platform commission (15%)
   *
   * @param amount - Total payment amount
   * @returns Platform commission amount
   *
   * @example
   * ```typescript
   * const amount = 100;
   * const commission = this.paymentService.calculatePlatformCommission(amount);
   * console.log('Commission:', commission); // 15
   * ```
   */
  calculatePlatformCommission(amount: number): number {
    return amount * 0.15;
  }

  /**
   * Calculate mentor payout (85%)
   *
   * @param amount - Total payment amount
   * @returns Mentor payout amount
   *
   * @example
   * ```typescript
   * const amount = 100;
   * const payout = this.paymentService.calculateMentorPayout(amount);
   * console.log('Mentor receives:', payout); // 85
   * ```
   */
  calculateMentorPayout(amount: number): number {
    return amount * 0.85;
  }

  /**
   * Get currency for payment provider
   *
   * @param provider - Payment provider (Stripe or Paymob)
   * @returns Currency code (USD or EGP)
   *
   * @example
   * ```typescript
   * const currency = this.paymentService.getCurrency(PaymentProvider.Stripe);
   * console.log('Currency:', currency); // "USD"
   *
   * const egyptCurrency = this.paymentService.getCurrency(PaymentProvider.Paymob);
   * console.log('Currency:', egyptCurrency); // "EGP"
   * ```
   */
  getCurrency(provider: PaymentProvider): string {
    const currencyMap: Record<PaymentProvider, string> = {
      [PaymentProvider.Stripe]: 'USD',
      [PaymentProvider.Paymob]: 'EGP'
    };
    return currencyMap[provider] || 'USD';
  }

  /**
   * Check if payment is successful (Captured or Authorized)
   *
   * @param status - Payment status
   * @returns True if payment is successful
   *
   * @example
   * ```typescript
   * const isSuccess = this.paymentService.isPaymentSuccessful(PaymentStatus.Captured);
   * console.log('Is successful:', isSuccess); // true
   * ```
   */
  isPaymentSuccessful(status: PaymentStatus): boolean {
    return status === PaymentStatus.Captured || status === PaymentStatus.Authorized;
  }

  /**
   * Check if payment is pending
   *
   * @param status - Payment status
   * @returns True if payment is pending
   *
   * @example
   * ```typescript
   * const isPending = this.paymentService.isPaymentPending(PaymentStatus.Pending);
   * console.log('Is pending:', isPending); // true
   * ```
   */
  isPaymentPending(status: PaymentStatus): boolean {
    return status === PaymentStatus.Pending;
  }

  /**
   * Check if payment failed
   *
   * @param status - Payment status
   * @returns True if payment failed
   *
   * @example
   * ```typescript
   * const hasFailed = this.paymentService.isPaymentFailed(PaymentStatus.Failed);
   * console.log('Has failed:', hasFailed); // true
   * ```
   */
  isPaymentFailed(status: PaymentStatus): boolean {
    return status === PaymentStatus.Failed;
  }

  /**
   * Check if payment is refundable (must be Captured)
   *
   * @param status - Payment status
   * @returns True if payment can be refunded
   *
   * @example
   * ```typescript
   * const canRefund = this.paymentService.isRefundable(PaymentStatus.Captured);
   * console.log('Can refund:', canRefund); // true
   * ```
   */
  isRefundable(status: PaymentStatus): boolean {
    return status === PaymentStatus.Captured;
  }

  /**
   * Format payment amount with currency
   *
   * @param amount - Payment amount
   * @param provider - Payment provider (for currency)
   * @returns Formatted amount string
   *
   * @example
   * ```typescript
   * const formatted = this.paymentService.formatAmount(45.00, PaymentProvider.Stripe);
   * console.log(formatted); // "$45.00"
   *
   * const egyptFormatted = this.paymentService.formatAmount(500, PaymentProvider.Paymob);
   * console.log(egyptFormatted); // "EGP 500.00"
   * ```
   */
  formatAmount(amount: number, provider: PaymentProvider): string {
    const currency = this.getCurrency(provider);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  /**
   * Calculate payment breakdown (total, commission, payout)
   *
   * @param amount - Total payment amount
   * @returns Object with total, commission, and payout amounts
   *
   * @example
   * ```typescript
   * const breakdown = this.paymentService.calculatePaymentBreakdown(100);
   * console.log('Total:', breakdown.total); // 100
   * console.log('Platform commission:', breakdown.commission); // 15
   * console.log('Mentor payout:', breakdown.payout); // 85
   * ```
   */
  calculatePaymentBreakdown(amount: number): {
    total: number;
    commission: number;
    payout: number;
  } {
    return {
      total: amount,
      commission: this.calculatePlatformCommission(amount),
      payout: this.calculateMentorPayout(amount)
    };
  }

  /**
   * Get payment status display text
   *
   * @param status - Payment status
   * @returns Human-readable status text
   *
   * @example
   * ```typescript
   * const text = this.paymentService.getStatusText(PaymentStatus.Captured);
   * console.log(text); // "Completed"
   * ```
   */
  getStatusText(status: PaymentStatus): string {
    const statusMap: Record<PaymentStatus, string> = {
      [PaymentStatus.Pending]: 'Pending',
      [PaymentStatus.Authorized]: 'Authorized',
      [PaymentStatus.Captured]: 'Completed',
      [PaymentStatus.Refunded]: 'Refunded',
      [PaymentStatus.Failed]: 'Failed'
    };
    return statusMap[status] || status;
  }

  /**
   * Get payment provider display name
   *
   * @param provider - Payment provider
   * @returns Human-readable provider name
   *
   * @example
   * ```typescript
   * const name = this.paymentService.getProviderName(PaymentProvider.Stripe);
   * console.log(name); // "Stripe"
   * ```
   */
  getProviderName(provider: PaymentProvider): string {
    const providerMap: Record<PaymentProvider, string> = {
      [PaymentProvider.Stripe]: 'Stripe',
      [PaymentProvider.Paymob]: 'Paymob'
    };
    return providerMap[provider] || provider;
  }
}
