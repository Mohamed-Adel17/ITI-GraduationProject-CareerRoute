import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentMethodSelectionComponent } from '../../../features/mentors/mentor-detail/payment-method-selection/payment-method-selection.component';
import { StripePaymentComponent } from '../../../features/payment/stripe-payment/stripe-payment.component';
import { PaymobCardPaymentComponent } from '../../../features/payment/paymob-card-payment/paymob-card-payment.component';
import { PaymobWalletPaymentComponent } from '../../../features/payment/paymob-wallet-payment/paymob-wallet-payment.component';
import { PaymentService } from '../../../core/services/payment.service';
import { PaymentMethodSelection } from '../../models/payment-flow.model';
import { PaymentProvider, PaymobPaymentMethod } from '../../models/payment.model';
import { SessionSummary } from '../../models/session.model';

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
export class SessionPaymentModalComponent implements OnInit, OnChanges {
  private readonly paymentService = inject(PaymentService);

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

  // Expose enums to template
  readonly PaymentProvider = PaymentProvider;
  readonly PaymobPaymentMethod = PaymobPaymentMethod;

  ngOnInit(): void {
    if (this.isOpen && this.session) {
      this.initializePaymentFlow();
    }
  }

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

    // Get session price from session
    this.sessionPrice = this.session.price || 0;

    // Check if session already has a payment intent by trying to create one
    // Backend will return existing intent if one exists
    if (this.session.id) {
      try {
        const paymentInfo = await this.checkExistingPayment();
        
        if (paymentInfo && paymentInfo.paymentProvider) {
          // Payment intent exists - go directly to the payment component
          // Also update price from payment response if available
          if (paymentInfo.amount) {
            this.sessionPrice = paymentInfo.amount;
          }
          this.hasExistingPaymentIntent = true;
          this.isLoading = false;
          this.showPaymentComponentForProvider(paymentInfo.paymentProvider, paymentInfo.paymobPaymentMethod);
          return;
        }
      } catch (error) {
        // No existing payment or error - show method selection
        console.log('No existing payment intent, showing method selection');
      }
    }

    // No existing payment - show method selection
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
  private showPaymentComponentForProvider(provider: PaymentProvider, paymobMethod?: PaymobPaymentMethod): void {
    this.showPaymentMethodSelection = false;
    
    if (provider === PaymentProvider.Stripe) {
      this.showStripePayment = true;
    } else if (provider === PaymentProvider.Paymob) {
      if (paymobMethod === PaymobPaymentMethod.EWallet) {
        this.showPaymobWalletPayment = true;
      } else {
        // Default to card for Paymob
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
    // Reset to payment method selection to allow retry with different method
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
