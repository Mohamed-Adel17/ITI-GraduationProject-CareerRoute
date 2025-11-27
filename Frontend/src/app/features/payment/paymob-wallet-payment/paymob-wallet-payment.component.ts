import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment.development';
import { PaymentService } from '../../../core/services/payment.service';
import {
  CreatePaymentIntentRequest,
  PaymentProvider,
  PaymobPaymentMethod,
  ConfirmPaymentRequest,
  PaymentConfirmationResponse
} from '../../../shared/models/payment.model';
import { PaymentFlowStatus } from '../../../shared/models/payment-flow.model';
import { interval, Subscription } from 'rxjs';
import { takeWhile } from 'rxjs/operators';

/**
 * Paymob Wallet Request Interface
 */
interface PaymobWalletRequest {
  payment_token: string;
  source: {
    identifier: string;
    subtype: 'WALLET';
  };
}

/**
 * Paymob Wallet Response Interface
 * Based on Paymob API contract
 */
interface PaymobWalletResponse {
  redirect_url: string | null;
  id?: number;
  pending?: boolean;
  success?: boolean;
}

/**
 * PaymobWalletPaymentComponent
 *
 * @description
 * Component for processing Paymob wallet payments (Vodafone Cash, etc.).
 * Handles the complete Paymob wallet payment flow from intent creation to confirmation.
 *
 * Features:
 * - Create payment intent via backend
 * - Collect mobile wallet number
 * - Initiate wallet payment via Paymob API
 * - Show pending approval screen
 * - Poll for payment status or use SignalR
 * - Confirm payment after successful processing
 * - Handle errors and retry logic
 *
 * Flow:
 * 1. Create payment intent with Paymob EWallet method
 * 2. Get clientSecret (payment token)
 * 3. Show mobile number input form
 * 4. User enters mobile wallet number
 * 5. Call Paymob API to initiate payment
 * 6. User receives OTP on mobile
 * 7. Show "Pending Approval" screen
 * 8. Poll backend or wait for webhook confirmation
 * 9. On success → Confirm payment
 * 10. Show success and redirect
 */
@Component({
  selector: 'app-paymob-wallet-payment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './paymob-wallet-payment.component.html',
  styleUrls: []
})
export class PaymobWalletPaymentComponent implements OnInit, OnDestroy {
  private readonly paymentService = inject(PaymentService);
  private readonly http = inject(HttpClient);

  /**
   * Session ID to pay for
   */
  @Input() sessionId: string = '';

  /**
   * Payment amount
   */
  @Input() amount: number = 0;

  /**
   * Mentor name for display
   */
  @Input() mentorName: string = '';

  /**
   * Event emitted when payment is successful
   */
  @Output() paymentSuccess = new EventEmitter<PaymentConfirmationResponse>();

  /**
   * Event emitted when payment fails
   */
  @Output() paymentFailed = new EventEmitter<string>();

  /**
   * Event emitted when user cancels payment
   */
  @Output() paymentCancelled = new EventEmitter<void>();

  // Payment state
  paymentIntentId: string | null = null;
  clientSecret: string | null = null;
  currentStatus: PaymentFlowStatus = PaymentFlowStatus.CreatingIntent;
  errorMessage: string | null = null;

  // Mobile wallet input
  mobileNumber: string = '';
  mobileNumberError: string | null = null;
  isSubmitting: boolean = false;

  // Polling state
  pollingSubscription: Subscription | null = null;
  private pollingStartTime: number = 0;
  private readonly POLLING_INTERVAL_MS = 3000; // Poll every 3 seconds
  private readonly POLLING_TIMEOUT_MS = 300000; // 5 minutes timeout
  remainingTime: number = 300; // 5 minutes in seconds

  // Expose enum to template
  readonly PaymentFlowStatus = PaymentFlowStatus;

  async ngOnInit(): Promise<void> {
    await this.initializePayment();
  }

  ngOnDestroy(): void {
    // Stop polling
    this.stopPolling();
  }

  /**
   * Initialize the payment flow
   */
  private async initializePayment(): Promise<void> {
    try {
      this.currentStatus = PaymentFlowStatus.CreatingIntent;
      this.errorMessage = null;

      // Step 1: Create payment intent
      await this.createPaymentIntent();

      // Step 2: Show mobile input form
      this.currentStatus = PaymentFlowStatus.ProcessingPayment;
    } catch (error: any) {
      this.handleError(error);
    }
  }

  /**
   * Create payment intent via backend
   */
  private async createPaymentIntent(): Promise<void> {
    const request: CreatePaymentIntentRequest = {
      sessionId: this.sessionId,
      paymentProvider: PaymentProvider.Paymob,
      paymobPaymentMethod: PaymobPaymentMethod.EWallet
    };

    console.log('Creating Paymob wallet payment intent:', request);

    return new Promise((resolve, reject) => {
      this.paymentService.createPaymentIntent(request).subscribe({
        next: (response) => {
          this.paymentIntentId = response.paymentIntentId;
          this.clientSecret = response.clientSecret;
          console.log('Paymob wallet payment intent created:', this.paymentIntentId);
          console.log('Client secret (payment token):', this.clientSecret);
          resolve();
        },
        error: (error) => {
          console.error('Paymob wallet payment intent creation failed:', error);
          reject(error);
        }
      });
    });
  }

  /**
   * Validate mobile number
   */
  validateMobileNumber(): boolean {
    this.mobileNumberError = null;

    // Remove any spaces or special characters
    const cleanNumber = this.mobileNumber.replace(/\s+/g, '').replace(/[^0-9]/g, '');

    // Egyptian mobile number validation
    // Format: 01XXXXXXXXX (11 digits starting with 01)
    const egyptianMobileRegex = /^01[0-2,5]{1}[0-9]{8}$/;

    if (!cleanNumber) {
      this.mobileNumberError = 'Mobile number is required';
      return false;
    }

    if (!egyptianMobileRegex.test(cleanNumber)) {
      this.mobileNumberError = 'Please enter a valid Egyptian mobile number (e.g., 01012345678)';
      return false;
    }

    // Update mobile number with cleaned version
    this.mobileNumber = cleanNumber;
    return true;
  }

  /**
   * Submit mobile number and initiate wallet payment
   */
  async submitMobileNumber(): Promise<void> {
    if (!this.validateMobileNumber()) {
      return;
    }

    if (!this.clientSecret) {
      this.handleError('Payment token not available');
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;

    try {
      // Call Paymob API to initiate wallet payment
      await this.initiateWalletPayment();

      // Start polling for payment status
      this.startPolling();
    } catch (error: any) {
      this.handleError(error);
      this.isSubmitting = false;
    }
  }

  /**
   * Initiate wallet payment via Paymob API
   * Paymob returns a redirect_url for OTP verification
   */
  private async initiateWalletPayment(): Promise<void> {
    const paymobApiUrl = environment.payment.paymob.apiUrl;
    const walletRequest: PaymobWalletRequest = {
      payment_token: this.clientSecret!,
      source: {
        identifier: this.mobileNumber,
        subtype: 'WALLET'
      }
    };

    console.log('Initiating Paymob wallet payment:', walletRequest);

    return new Promise((resolve, reject) => {
      this.http.post<PaymobWalletResponse>(`${paymobApiUrl}/payments/pay`, walletRequest).subscribe({
        next: (response) => {
          console.log('Paymob wallet payment response:', response);
          
          // Check if we have a redirect URL for OTP verification
          if (response.redirect_url) {
            console.log('Redirecting to Paymob OTP page:', response.redirect_url);
            // Redirect user to Paymob OTP page
            window.location.href = response.redirect_url;
            resolve();
          } else if (response.success) {
            // Payment already successful (unlikely but possible)
            this.handlePaymentSuccess();
            resolve();
          } else {
            // No redirect URL and not successful - show pending screen
            // User will receive OTP on mobile and we poll for status
            console.log('No redirect URL, waiting for OTP approval on mobile');
            this.isSubmitting = false;
            resolve();
          }
        },
        error: (error) => {
          console.error('Paymob wallet payment initiation failed:', error);
          // Extract error detail from Paymob response
          const errorMessage = error?.error?.detail || error?.error?.message || 'Payment initiation failed';
          reject(errorMessage);
        }
      });
    });
  }

  /**
   * Start polling for payment status
   */
  private startPolling(): void {
    this.pollingStartTime = Date.now();
    this.remainingTime = Math.floor(this.POLLING_TIMEOUT_MS / 1000);

    // Update remaining time every second
    const timerInterval = setInterval(() => {
      const elapsed = Date.now() - this.pollingStartTime;
      this.remainingTime = Math.floor((this.POLLING_TIMEOUT_MS - elapsed) / 1000);
      
      if (this.remainingTime <= 0) {
        clearInterval(timerInterval);
      }
    }, 1000);

    // Poll for payment status
    this.pollingSubscription = interval(this.POLLING_INTERVAL_MS)
      .pipe(
        takeWhile(() => {
          const elapsed = Date.now() - this.pollingStartTime;
          return elapsed < this.POLLING_TIMEOUT_MS;
        })
      )
      .subscribe({
        next: async () => {
          await this.checkPaymentStatus();
        },
        complete: () => {
          clearInterval(timerInterval);
          // Timeout reached
          if (this.currentStatus !== PaymentFlowStatus.Success) {
            this.handleError('Payment timeout. Please try again or check your mobile wallet.');
          }
        }
      });
  }

  /**
   * Stop polling
   */
  private stopPolling(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = null;
    }
  }

  /**
   * Check payment status by attempting to confirm
   * The backend will check with Paymob if payment is complete
   */
  private async checkPaymentStatus(): Promise<void> {
    if (!this.paymentIntentId) {
      return;
    }

    // Try to confirm payment
    // If payment is not yet complete, backend will return an error
    // If payment is complete, confirmation will succeed
    const request: ConfirmPaymentRequest = {
      paymentIntentId: this.paymentIntentId,
      sessionId: this.sessionId
    };

    this.paymentService.confirmPayment(request).subscribe({
      next: (response) => {
        // Payment confirmed successfully
        this.stopPolling();
        this.handlePaymentSuccess();
        this.currentStatus = PaymentFlowStatus.Success;
        console.log('Paymob wallet payment confirmed:', response);
        this.paymentSuccess.emit(response);
      },
      error: (error) => {
        // Payment not yet complete or failed
        // Continue polling unless it's a permanent failure
        if (error?.status === 402 || error?.error?.message?.includes('failed')) {
          // Payment failed permanently
          this.stopPolling();
          this.handleError(error);
        }
        // Otherwise, continue polling
      }
    });
  }

  /**
   * Handle successful payment
   */
  private handlePaymentSuccess(): void {
    this.stopPolling();
    this.currentStatus = PaymentFlowStatus.Success;
  }

  /**
   * Handle payment errors
   */
  private handleError(error: any): void {
    this.currentStatus = PaymentFlowStatus.Failed;
    this.stopPolling();
    
    let message: string;
    if (typeof error === 'string') {
      message = error;
    } else if (error?.error?.message) {
      message = error.error.message;
    } else if (error?.message) {
      message = error.message;
    } else {
      message = 'An unexpected error occurred. Please try again.';
    }

    this.errorMessage = message;
    console.error('Paymob wallet payment error:', error);
    this.paymentFailed.emit(message);
  }

  /**
   * Retry payment after error
   */
  retryPayment(): void {
    this.errorMessage = null;
    this.mobileNumber = '';
    this.mobileNumberError = null;
    this.initializePayment();
  }

  /**
   * Cancel payment
   */
  cancelPayment(): void {
    this.stopPolling();
    this.paymentCancelled.emit();
  }

  /**
   * Get formatted amount for display
   */
  getFormattedAmount(): string {
    return this.paymentService.formatAmount(this.amount, PaymentProvider.Paymob);
  }

  /**
   * Format remaining time for display
   */
  getFormattedRemainingTime(): string {
    const minutes = Math.floor(this.remainingTime / 60);
    const seconds = this.remainingTime % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}
