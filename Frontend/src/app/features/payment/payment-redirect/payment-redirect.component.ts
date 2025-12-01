import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { PaymentService } from '../../../core/services/payment.service';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import {
  ConfirmPaymentRequest,
  PaymentConfirmationResponse,
  PaymentProvider
} from '../../../shared/models/payment.model';

/**
 * Verification Status Enum
 * Represents the current state of payment verification
 */
export enum VerificationStatus {
  Pending = 'pending',
  Success = 'success',
  Failed = 'failed'
}

/**
 * Session Details Interface
 * Contains session information displayed after successful verification
 */
export interface SessionDetails {
  id: string;
  mentorName: string;
  scheduledStartTime: string;
  videoConferenceLink: string;
  status: string;
}

/**
 * Payment Details Response Interface
 * Response from GET /api/payments/{paymentId}
 */
export interface PaymentDetailsResponse {
  id: string;
  sessionId: string;
  mentorName: string;
  sessionTopic: string | null;
  amount: number;
  paymentProvider: number;
  status: number;
  transactionId: string;
  paidAt: string | null;
  refundAmount: number | null;
  refundedAt: string | null;
}

/**
 * PaymentRedirectComponent
 *
 * @description
 * Component for handling Paymob payment redirect verification.
 * Displays pending status while verifying payment, then shows success or failure state.
 *
 * Flow:
 * 1. Extract payment intent ID from 'order' query parameter
 * 2. Call GET /api/payments/{paymentId} to get session ID
 * 3. Call POST /api/payments/confirm to confirm payment
 * 4. Display success with session details or failure with error message
 */
@Component({
  selector: 'app-payment-redirect',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  templateUrl: './payment-redirect.component.html',
  styleUrls: ['./payment-redirect.component.css']
})
export class PaymentRedirectComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly paymentService = inject(PaymentService);

  // State properties
  verificationStatus: VerificationStatus = VerificationStatus.Pending;
  paymentIntentId: string | null = null;
  sessionId: string | null = null;
  errorMessage: string | null = null;
  sessionDetails: SessionDetails | null = null;
  mentorName: string | null = null;
  amount: number = 0;

  // Expose enum to template
  readonly VerificationStatus = VerificationStatus;

  ngOnInit(): void {
    this.paymentIntentId = this.extractPaymentIntentId();
    
    if (!this.paymentIntentId) {
      this.verificationStatus = VerificationStatus.Failed;
      this.errorMessage = 'Invalid payment reference. Please try booking again.';
      return;
    }

    this.verifyPayment();
  }

  /**
   * Extract payment intent ID from query parameter
   * Paymob may send different parameters depending on the payment method:
   * - 'order' - Order ID (most common)
   * - 'id' - Transaction ID
   * - 'merchant_order_id' - Merchant order ID
   * @returns Payment intent ID or null if invalid
   */
  extractPaymentIntentId(): string | null {
    // Try different query parameters that Paymob might send
    const orderId = this.route.snapshot.queryParamMap.get('order');
    const id = this.route.snapshot.queryParamMap.get('id');
    const merchantOrderId = this.route.snapshot.queryParamMap.get('merchant_order_id');
    
    
    // Try order first, then id, then merchant_order_id
    const paymentId = orderId || id || merchantOrderId;
    
    if (!paymentId || paymentId.trim() === '') {
      console.error('No valid payment ID found in query parameters');
      return null;
    }
    
    return paymentId.trim();
  }

  /**
   * Verify payment by calling backend APIs
   */
  async verifyPayment(): Promise<void> {
    if (!this.paymentIntentId) {
      return;
    }

    try {
      // Step 1: Get payment details to retrieve session ID
      const paymentDetails = await this.getPaymentDetails(this.paymentIntentId);
      this.sessionId = paymentDetails.sessionId;
      this.mentorName = paymentDetails.mentorName;
      this.amount = paymentDetails.amount;

      // Step 2: Confirm payment
      const confirmation = await this.confirmPayment(this.paymentIntentId, this.sessionId);
      
      // Step 3: Store session details and update status
      this.sessionDetails = {
        id: confirmation.session.id,
        mentorName: this.mentorName || 'Mentor',
        scheduledStartTime: confirmation.session.scheduledStartTime,
        videoConferenceLink: confirmation.session.videoConferenceLink,
        status: confirmation.session.status
      };
      
      this.verificationStatus = VerificationStatus.Success;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get payment details from backend
   * @param paymentId Payment intent ID
   * @returns Payment details response
   */
  private getPaymentDetails(paymentId: string): Promise<PaymentDetailsResponse> {
    return new Promise((resolve, reject) => {
      this.paymentService.getPaymentById(paymentId).subscribe({
        next: (response) => resolve(response),
        error: (error) => reject(error)
      });
    });
  }

  /**
   * Confirm payment with backend
   * @param paymentIntentId Payment intent ID
   * @param sessionId Session ID
   * @returns Payment confirmation response
   */
  private confirmPayment(paymentIntentId: string, sessionId: string): Promise<PaymentConfirmationResponse> {
    const request: ConfirmPaymentRequest = {
      paymentIntentId,
      sessionId
    };

    return new Promise((resolve, reject) => {
      this.paymentService.confirmPayment(request).subscribe({
        next: (response) => resolve(response),
        error: (error) => reject(error)
      });
    });
  }

  /**
   * Extract error message from HTTP error response
   * @param error Error object
   * @returns User-friendly error message
   */
  private extractErrorMessage(error: any): string {
    if (error instanceof HttpErrorResponse) {
      if (error.error?.message) {
        return error.error.message;
      }
      if (error.status === 0) {
        return 'Unable to verify payment. Please check your connection.';
      }
      if (error.status >= 500) {
        return 'An unexpected error occurred. Please try again later.';
      }
    }
    
    if (typeof error === 'string') {
      return error;
    }
    
    if (error?.message) {
      return error.message;
    }
    
    return 'Payment verification failed. Please try again.';
  }

  /**
   * Handle errors during verification
   * @param error Error object
   */
  private handleError(error: any): void {
    console.error('Payment verification error:', error);
    this.verificationStatus = VerificationStatus.Failed;
    this.errorMessage = this.extractErrorMessage(error);
  }

  /**
   * Navigate to session details page
   */
  navigateToSession(): void {
    if (this.sessionDetails?.id) {
      this.router.navigate(['/user/sessions', this.sessionDetails.id]);
    }
  }

  /**
   * Navigate to mentors browse page
   */
  navigateToMentors(): void {
    this.router.navigate(['/mentors']);
  }

  /**
   * Format scheduled time for display
   * @param isoString ISO date string
   * @returns Formatted date string
   */
  formatScheduledTime(isoString: string): string {
    if (!isoString) return 'N/A';
    
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Format amount for display
   * @returns Formatted amount string
   */
  getFormattedAmount(): string {
    return this.paymentService.formatAmount(this.amount, PaymentProvider.Paymob);
  }
}
