import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
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

/**
 * PaymobCardPaymentComponent
 *
 * @description
 * Component for processing Paymob card payments via iframe.
 * Handles the complete Paymob card payment flow from intent creation to confirmation.
 *
 * Features:
 * - Create payment intent via backend
 * - Display Paymob iframe for card input
 * - Handle iframe callback and redirect
 * - Confirm payment after successful processing
 * - Handle errors and retry logic
 *
 * Flow:
 * 1. Create payment intent with Paymob Card method
 * 2. Get clientSecret (payment token)
 * 3. Build Paymob iframe URL
 * 4. Display iframe in modal
 * 5. User enters card details in Paymob iframe
 * 6. Paymob processes payment and redirects to callback URL
 * 7. Frontend detects callback URL load
 * 8. Call confirm endpoint
 * 9. Show success and redirect
 */
@Component({
  selector: 'app-paymob-card-payment',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './paymob-card-payment.component.html',
  styleUrls: []
})
export class PaymobCardPaymentComponent implements OnInit, OnDestroy {
  private readonly paymentService = inject(PaymentService);
  private readonly sanitizer = inject(DomSanitizer);

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
   * Optional: Pre-fetched client secret (skip API call if provided)
   */
  @Input() existingClientSecret: string = '';

  /**
   * Optional: Pre-fetched payment intent ID
   */
  @Input() existingPaymentIntentId: string = '';

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
  iframeUrl: SafeResourceUrl | null = null;
  currentStatus: PaymentFlowStatus = PaymentFlowStatus.CreatingIntent;
  errorMessage: string | null = null;
  isIframeLoading: boolean = true;

  // Expose enum to template
  readonly PaymentFlowStatus = PaymentFlowStatus;

  // Message listener for iframe communication
  private messageListener: ((event: MessageEvent) => void) | null = null;

  async ngOnInit(): Promise<void> {
    await this.initializePayment();
  }

  ngOnDestroy(): void {
    // Remove message listener
    if (this.messageListener) {
      window.removeEventListener('message', this.messageListener);
    }
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

      // Step 2: Build iframe URL
      this.buildIframeUrl();

      // Step 3: Setup message listener for iframe callback
      this.setupMessageListener();

      this.currentStatus = PaymentFlowStatus.ProcessingPayment;
    } catch (error: any) {
      this.handleError(error);
    }
  }

  /**
   * Create payment intent via backend
   */
  private async createPaymentIntent(): Promise<void> {
    // Use existing values if provided (skip API call)
    if (this.existingClientSecret && this.existingPaymentIntentId) {
      this.clientSecret = this.existingClientSecret;
      this.paymentIntentId = this.existingPaymentIntentId;
      return;
    }

    const request: CreatePaymentIntentRequest = {
      sessionId: this.sessionId,
      paymentProvider: PaymentProvider.Paymob,
      paymobPaymentMethod: PaymobPaymentMethod.Card
    };

    return new Promise((resolve, reject) => {
      this.paymentService.createPaymentIntent(request).subscribe({
        next: (response) => {
          this.paymentIntentId = response.paymentIntentId;
          this.clientSecret = response.clientSecret;
          resolve();
        },
        error: (error) => {
          console.error('Paymob payment intent creation failed:', error);
          reject(error);
        }
      });
    });
  }

  /**
   * Build Paymob iframe URL
   */
  private buildIframeUrl(): void {
    if (!this.clientSecret) {
      throw new Error('Client secret not available');
    }

    const iframeId = environment.payment.paymob.iframeId;
    
    if (!iframeId || iframeId === 'PLACEHOLDER') {
      throw new Error('Paymob iframe ID is not configured. Please update environment.development.ts');
    }

    // Build Paymob iframe URL
    // Format: https://accept.paymob.com/api/acceptance/iframes/{iframe_id}?payment_token={clientSecret}
    const url = `https://accept.paymob.com/api/acceptance/iframes/${iframeId}?payment_token=${this.clientSecret}`;
    
    // console.log('Paymob iframe URL:', url);
    
    // Sanitize URL for iframe
    this.iframeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  /**
   * Setup message listener for iframe communication
   * Listens for messages from Paymob iframe about payment status
   */
  private setupMessageListener(): void {
    this.messageListener = (event: MessageEvent) => {
      // Verify message origin is from Paymob
      if (!event.origin.includes('paymob.com') && !event.origin.includes('accept.paymob.com')) {
        return;
      }

      // console.log('Received message from Paymob iframe:', event.data);

      // Handle different message types
      if (event.data && typeof event.data === 'object') {
        if (event.data.type === 'payment_success' || event.data.success === true) {
          // Payment successful
          this.handlePaymentSuccess();
        } else if (event.data.type === 'payment_failed' || event.data.success === false) {
          // Payment failed
          this.handleError(event.data.message || 'Payment failed');
        }
      }
    };

    window.addEventListener('message', this.messageListener);
  }

  /**
   * Handle iframe load event
   */
  onIframeLoad(): void {
    this.isIframeLoading = false;
    // console.log('Paymob iframe loaded successfully');
  }

  /**
   * Handle successful payment from iframe
   */
  private async handlePaymentSuccess(): Promise<void> {
    try {
      await this.confirmPayment();
    } catch (error: any) {
      this.handleError(error);
    }
  }

  /**
   * Confirm payment with backend
   */
  private async confirmPayment(): Promise<void> {
    if (!this.paymentIntentId) {
      this.handleError('Payment intent ID not found');
      return;
    }

    this.currentStatus = PaymentFlowStatus.ConfirmingPayment;

    const request: ConfirmPaymentRequest = {
      paymentIntentId: this.paymentIntentId,
      sessionId: this.sessionId
    };

    return new Promise((resolve, reject) => {
      this.paymentService.confirmPayment(request).subscribe({
        next: (response) => {
          this.currentStatus = PaymentFlowStatus.Success;
          // console.log('Paymob payment confirmed:', response);
          this.paymentSuccess.emit(response);
          resolve();
        },
        error: (error) => {
          this.handleError(error);
          reject(error);
        }
      });
    });
  }

  /**
   * Handle payment errors
   */
  private handleError(error: any): void {
    this.currentStatus = PaymentFlowStatus.Failed;
    
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
    console.error('Paymob payment error:', error);
    this.paymentFailed.emit(message);
  }

  /**
   * Retry payment after error
   */
  retryPayment(): void {
    this.errorMessage = null;
    this.isIframeLoading = true;
    this.initializePayment();
  }

  /**
   * Cancel payment
   */
  cancelPayment(): void {
    this.paymentCancelled.emit();
  }

  /**
   * Get formatted amount for display
   */
  getFormattedAmount(): string {
    return this.paymentService.formatAmount(this.amount, PaymentProvider.Paymob);
  }
}
