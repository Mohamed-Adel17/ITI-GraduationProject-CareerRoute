import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentMethodSelectionComponent } from '../../../features/mentors/mentor-detail/payment-method-selection/payment-method-selection.component';
import { StripePaymentComponent } from '../../../features/payment/stripe-payment/stripe-payment.component';
import { PaymobCardPaymentComponent } from '../../../features/payment/paymob-card-payment/paymob-card-payment.component';
import { PaymobWalletPaymentComponent } from '../../../features/payment/paymob-wallet-payment/paymob-wallet-payment.component';
import { PaymentService } from '../../../core/services/payment.service';
import { NotificationService } from '../../../core/services/notification.service';
import { PaymentMethodSelection } from '../../models/payment-flow.model';
import { PaymentProvider, PaymobPaymentMethod } from '../../models/payment.model';
import { SessionSummary, SessionStatus } from '../../models/session.model';

/**
 * SessionPaymentModalComponent
 *
 * Modal component for handling payment for pending sessions.
 * Integrates payment method selection and payment processing components.
 *
 * Features:
 * - Check for existing payment intent and skip method selection if exists
 * - Payment method selection (Stripe, Paymob Card, Paymob Wallet)
 * - Conditional rendering of payment components based on selection
 * - Success/failure handling
 * - Modal close functionality
 */
@Component({
  selector: 'app-session-payment-modal',
  standalone: true,
  imports: [
    CommonModule,
    PaymentMethodSelectionComponent,
    StripePaymentComponent,
    PaymobCardPaymentComponent,
    PaymobWalletPaymentComponent
  ],
  templateUrl: './session-payment-modal.component.html',
  styleUrls: []
})
export class SessionPaymentModalComponent implements OnChanges {
  private readonly paymentService = inject(PaymentService);
  private readonly notificationService = inject(NotificationService);

  /**
   * Whether the modal is visible
   */
  @Input() isOpen: boolean = false;

  /**
   * Session to pay for
   */
  @Input() session!: SessionSummary;

  /**
   * Event emitted when modal should be closed
   */
  @Output() closeModal = new EventEmitter<void>();

  /**
   * Event emitted when payment is successful
   */
  @Output() paymentSuccess = new EventEmitter<void>();

  // Payment flow state
  isLoading: boolean = false;
  showPaymentMethodSelection: boolean = false;
  showStripePayment: boolean = false;
  showPaymobCardPayment: boolean = false;
  showPaymobWalletPayment: boolean = false;

  // Track if we have an existing payment intent (to prevent method change on cancel)
  hasExistingPaymentIntent: boolean = false;

  // Session details with price
  sessionPrice: number = 0;

  // Payment intent details from API
  existingClientSecret: string = '';
  existingPaymentIntentId: string = '';

  // Expose enums to template
  readonly PaymentProvider = PaymentProvider;
  readonly PaymobPaymentMethod = PaymobPaymentMethod;


  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen && this.session) {
      this.initializePaymentFlow();
    }
  }

  /**
   * Initialize payment flow - check for existing payment intent
   */
  private async initializePaymentFlow(): Promise<void> {
    this.isLoading = true;
    this.resetPaymentFlow();
    this.hasExistingPaymentIntent = false;

    // Validate session status - only allow payment for Pending sessions
    if (this.session.status !== SessionStatus.Pending) {
      this.isLoading = false;
      this.onClose();
      return;
    }

    this.sessionPrice = this.session.price || 0;

    if (this.session.id) {
      try {
        const paymentInfo = await this.checkExistingPayment();
        if (paymentInfo && paymentInfo.paymentProvider) {
          this.existingClientSecret = paymentInfo.clientSecret || '';
          this.existingPaymentIntentId = paymentInfo.paymentIntentId || '';
          this.hasExistingPaymentIntent = true;
          this.isLoading = false;
          this.showPaymentComponentForProvider(paymentInfo.paymentProvider, paymentInfo.paymobPaymentMethod);
          return;
        }
      } catch (error: any) {
        // Rate limit - show notification and close modal
        if (error?.status === 429) {
          this.notificationService.warning('Too many requests. Please wait a moment and try again.', 'Rate Limit');
          this.isLoading = false;
          this.onClose();
          return;
        }
        // Other errors - continue to method selection
      }
    }

    this.isLoading = false;
    this.showPaymentMethodSelection = true;
  }

  /**
   * Check if there's an existing payment intent for this session
   * Backend returns existing intent if one exists, or creates new one
   */
  private checkExistingPayment(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.paymentService.createPaymentIntent({
        sessionId: this.session.id,
        paymentProvider: PaymentProvider.Stripe // Default, backend will return existing if any
      }).subscribe({
        next: (response) => {
          resolve({
            clientSecret: response.clientSecret,
            paymentIntentId: response.paymentIntentId,
            paymentProvider: response.paymentProvider,
            paymobPaymentMethod: (response as any).paymobPaymentMethod,
            amount: response.amount
          });
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  }

  /**
   * Show the appropriate payment component based on provider
   */
  private showPaymentComponentForProvider(provider: PaymentProvider | string | number, paymobMethod?: PaymobPaymentMethod | number): void {
    this.showPaymentMethodSelection = false;
    const isStripe = provider === PaymentProvider.Stripe || provider === 'Stripe' || provider === 1;
    const isPaymob = provider === PaymentProvider.Paymob || provider === 'Paymob' || provider === 2;
    if (isStripe) {
      this.showStripePayment = true;
    } else if (isPaymob) {
      if (paymobMethod === PaymobPaymentMethod.EWallet || paymobMethod === 2) {
        this.showPaymobWalletPayment = true;
      } else {
        this.showPaymobCardPayment = true;
      }
    }
  }

  /**
   * Reset payment flow to initial state
   */
  resetPaymentFlow(): void {
    this.showPaymentMethodSelection = false;
    this.showStripePayment = false;
    this.showPaymobCardPayment = false;
    this.showPaymobWalletPayment = false;
  }

  /**
   * Get mentor name for display
   */
  get mentorName(): string {
    return `${this.session?.mentorFirstName || ''} ${this.session?.mentorLastName || ''}`.trim();
  }

  /**
   * Get session price for display
   */
  get displayPrice(): number {
    return this.sessionPrice || this.session?.price || 0;
  }

  /**
   * Handle payment method selection
   */
  onPaymentMethodSelected(selection: PaymentMethodSelection): void {
    this.showPaymentMethodSelection = false;

    if (selection.provider === PaymentProvider.Stripe) {
      this.showStripePayment = true;
    } else if (selection.provider === PaymentProvider.Paymob) {
      if (selection.paymobMethod === PaymobPaymentMethod.Card) {
        this.showPaymobCardPayment = true;
      } else if (selection.paymobMethod === PaymobPaymentMethod.EWallet) {
        this.showPaymobWalletPayment = true;
      }
    }
  }

  /**
   * Handle payment success
   */
  onPaymentSuccess(): void {
    this.paymentSuccess.emit();
    this.onClose();
  }

  /**
   * Handle payment failure
   */
  onPaymentFailure(error: any): void {
    console.error('Payment failed:', error);
    
    // If there's an existing payment intent, don't reset to method selection
    // Let the payment component show its failed state with retry option
    if (this.hasExistingPaymentIntent) {
      return;
    }
    
    // Otherwise, reset to payment method selection to allow retry with different method
    this.resetPaymentFlow();
    this.showPaymentMethodSelection = true;
  }

  /**
   * Handle payment method selection modal close
   */
  onPaymentMethodSelectionClose(): void {
    this.onClose();
  }

  /**
   * Handle payment component close (back button)
   */
  onPaymentComponentClose(): void {
    // If there's an existing payment intent, close the modal entirely
    // (don't allow changing payment method for existing intents)
    if (this.hasExistingPaymentIntent) {
      this.onClose();
      return;
    }
    
    // Otherwise, go back to payment method selection
    this.resetPaymentFlow();
    this.showPaymentMethodSelection = true;
  }

  /**
   * Close the modal
   */
  onClose(): void {
    this.resetPaymentFlow();
    this.closeModal.emit();
  }

  /**
   * Handle backdrop click
   */
  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }
}
