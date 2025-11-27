import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PaymentMethodSelectionComponent } from '../../../features/mentors/mentor-detail/payment-method-selection/payment-method-selection.component';
import { StripePaymentComponent } from '../../../features/payment/stripe-payment/stripe-payment.component';
import { PaymobCardPaymentComponent } from '../../../features/payment/paymob-card-payment/paymob-card-payment.component';
import { PaymobWalletPaymentComponent } from '../../../features/payment/paymob-wallet-payment/paymob-wallet-payment.component';
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
export class SessionPaymentModalComponent implements OnInit {
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
  showPaymentMethodSelection: boolean = true;
  showStripePayment: boolean = false;
  showPaymobCardPayment: boolean = false;
  showPaymobWalletPayment: boolean = false;

  // Expose enums to template
  readonly PaymentProvider = PaymentProvider;
  readonly PaymobPaymentMethod = PaymobPaymentMethod;

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Reset state when modal opens
    if (this.isOpen) {
      this.resetPaymentFlow();
    }
  }

  /**
   * Reset payment flow to initial state
   */
  resetPaymentFlow(): void {
    this.showPaymentMethodSelection = true;
    this.showStripePayment = false;
    this.showPaymobCardPayment = false;
    this.showPaymobWalletPayment = false;
  }

  /**
   * Get mentor name for display
   */
  get mentorName(): string {
    return `${this.session.mentorFirstName} ${this.session.mentorLastName}`;
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
    // Reset to payment method selection to allow retry
    this.resetPaymentFlow();
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
    // Go back to payment method selection
    this.resetPaymentFlow();
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
