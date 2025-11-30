import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { loadStripe, Stripe, StripeElements, StripeCardElement } from '@stripe/stripe-js';
import { environment } from '../../../../environments/environment.development';
import { PaymentService } from '../../../core/services/payment.service';
import {
  CreatePaymentIntentRequest,
  PaymentProvider,
  ConfirmPaymentRequest,
  PaymentConfirmationResponse
} from '../../../shared/models/payment.model';
import { PaymentFlowStatus } from '../../../shared/models/payment-flow.model';
import { NotificationService } from '../../../core/services/notification.service';

/**
 * StripePaymentComponent
 *
 * @description
 * Component for processing Stripe card payments with 3D Secure support.
 * Handles the complete Stripe payment flow from intent creation to confirmation.
 *
 * Features:
 * - Initialize Stripe.js and create card elements
 * - Create payment intent via backend
 * - Handle card input and validation
 * - Process payment with 3D Secure authentication
 * - Confirm payment after successful processing
 * - Handle errors and retry logic
 */
@Component({
  selector: 'app-stripe-payment',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stripe-payment.component.html',
  styleUrls: []
})
export class StripePaymentComponent implements OnInit, OnDestroy {
  private readonly paymentService = inject(PaymentService);
  private readonly notificationService = inject(NotificationService);

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

  // Stripe instances
  private stripe: Stripe | null = null;
  private elements: StripeElements | null = null;
  private cardElement: StripeCardElement | null = null;

  // Payment state
  paymentIntentId: string | null = null;
  clientSecret: string | null = null;
  currentStatus: PaymentFlowStatus = PaymentFlowStatus.CreatingIntent;
  errorMessage: string | null = null;
  isProcessing: boolean = false;

  // EGP to USD conversion rate (same as backend)
  private readonly EGP_TO_USD_RATE = 50;

  // Get amount in USD for Stripe
  get amountInUSD(): number {
    return Math.round((this.amount / this.EGP_TO_USD_RATE) * 100) / 100;
  }

  // Expose enum to template
  readonly PaymentFlowStatus = PaymentFlowStatus;

  async ngOnInit(): Promise<void> {
    await this.initializePayment();
  }

  ngOnDestroy(): void {
    // Cleanup Stripe elements
    if (this.cardElement) {
      this.cardElement.destroy();
    }
  }

  /**
   * Initialize the payment flow
   */
  private async initializePayment(): Promise<void> {
    try {
      this.currentStatus = PaymentFlowStatus.CreatingIntent;
      this.errorMessage = null;

      // Validate minimum amount for Stripe
      const STRIPE_MINIMUM_AMOUNT = 0.50;
      if (this.amount < STRIPE_MINIMUM_AMOUNT) {
        throw new Error(
          `Stripe requires a minimum payment of $${STRIPE_MINIMUM_AMOUNT.toFixed(2)} USD. ` +
          `The session amount ($${this.amount.toFixed(2)}) is below this minimum. ` +
          `Please contact support or choose a different payment method.`
        );
      }

      // Step 1: Create payment intent
      await this.createPaymentIntent();

      // Step 2: Initialize Stripe
      await this.initializeStripe();

      // Step 3: Create card element
      this.createCardElement();

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
      paymentProvider: PaymentProvider.Stripe
    };

    return new Promise((resolve, reject) => {
      this.paymentService.createPaymentIntent(request).subscribe({
        next: (response) => {
          this.paymentIntentId = response.paymentIntentId;
          this.clientSecret = response.clientSecret;
          resolve();
        },
        error: (error) => {
          console.error('Payment intent creation failed:', error);
          reject(error);
        }
      });
    });
  }

  /**
   * Initialize Stripe.js
   */
  private async initializeStripe(): Promise<void> {
    const publishableKey = environment.payment.stripe.publishableKey;
    
    if (!publishableKey || publishableKey.includes('PLACEHOLDER')) {
      throw new Error('Stripe publishable key is not configured. Please update environment.development.ts');
    }

    this.stripe = await loadStripe(publishableKey);
    
    if (!this.stripe) {
      throw new Error('Failed to initialize Stripe');
    }

    this.elements = this.stripe.elements();
  }

  /**
   * Create Stripe card element
   */
  private createCardElement(): void {
    if (!this.elements) {
      throw new Error('Stripe elements not initialized');
    }

    // Create card element
    this.cardElement = this.elements.create('card', {
      style: {
        base: {
          fontSize: '16px',
          color: '#32325d',
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          '::placeholder': {
            color: '#aab7c4'
          }
        },
        invalid: {
          color: '#fa755a',
          iconColor: '#fa755a'
        }
      },
      hidePostalCode: false
    });

    // Mount card element to DOM
    setTimeout(() => {
      const cardElementContainer = document.getElementById('card-element');
      if (cardElementContainer && this.cardElement) {
        this.cardElement.mount('#card-element');
        
        // Listen for card element changes
        this.cardElement.on('change', (event) => {
          if (event.error) {
            this.errorMessage = event.error.message;
          } else {
            this.errorMessage = null;
          }
        });
      }
    }, 100);
  }

  /**
   * Process payment with Stripe
   */
  async processPayment(): Promise<void> {
    if (!this.stripe || !this.cardElement || !this.clientSecret) {
      this.errorMessage = 'Payment system not ready. Please try again.';
      return;
    }

    this.isProcessing = true;
    this.errorMessage = null;

    try {
      // Confirm card payment with Stripe
      const { error, paymentIntent } = await this.stripe.confirmCardPayment(this.clientSecret, {
        payment_method: {
          card: this.cardElement
        }
      });

      if (error) {
        // Payment failed
        this.handleError(error.message || 'Payment failed');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment successful - confirm with backend
        await this.confirmPayment();
      } else {
        this.handleError('Payment was not completed. Please try again.');
      }
    } catch (error: any) {
      this.handleError(error);
    } finally {
      this.isProcessing = false;
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
          // console.log('Payment confirmed:', response);
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
    } else if (error?.errors?.stripe_error && Array.isArray(error.errors.stripe_error)) {
      // Handle Stripe-specific validation errors from backend
      message = error.errors.stripe_error.join(', ');
    } else if (error?.error?.message) {
      message = error.error.message;
    } else if (error?.message) {
      message = error.message;
    } else {
      message = 'An unexpected error occurred. Please try again.';
    }

    this.errorMessage = message;
    console.error('Payment error:', error);
    this.paymentFailed.emit(message);
  }

  /**
   * Retry payment after error
   */
  retryPayment(): void {
    this.errorMessage = null;
    this.currentStatus = PaymentFlowStatus.ProcessingPayment;
  }

  /**
   * Cancel payment
   */
  cancelPayment(): void {
    this.paymentCancelled.emit();
  }
}
