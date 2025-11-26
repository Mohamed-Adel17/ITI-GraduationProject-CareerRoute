import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentProvider, PaymobPaymentMethod } from '../../../../shared/models/payment.model';
import { PaymentMethodSelection } from '../../../../shared/models/payment-flow.model';

/**
 * PaymentMethodSelectionComponent
 *
 * @description
 * Modal component for selecting payment method after booking confirmation.
 * Displays three payment options: Stripe, Paymob Card, and Paymob Wallet.
 *
 * Features:
 * - Display payment provider options with icons and descriptions
 * - Show currency information (USD for Stripe, EGP for Paymob)
 * - Validate user selection
 * - Emit selected payment method to parent component
 */
@Component({
  selector: 'app-payment-method-selection',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment-method-selection.component.html',
  styleUrls: []
})
export class PaymentMethodSelectionComponent {
  /**
   * Whether the modal is visible
   */
  @Input() isOpen: boolean = false;

  /**
   * Session ID from booking response
   */
  @Input() sessionId: string = '';

  /**
   * Session price
   */
  @Input() amount: number = 0;

  /**
   * Mentor name for display
   */
  @Input() mentorName: string = '';

  /**
   * Event emitted when payment method is selected
   */
  @Output() paymentMethodSelected = new EventEmitter<PaymentMethodSelection>();

  /**
   * Event emitted when modal should be closed
   */
  @Output() closeModal = new EventEmitter<void>();

  // Expose enums to template
  readonly PaymentProvider = PaymentProvider;
  readonly PaymobPaymentMethod = PaymobPaymentMethod;

  /**
   * Select Stripe as payment method
   */
  selectStripe(): void {
    this.paymentMethodSelected.emit({
      provider: PaymentProvider.Stripe
    });
  }

  /**
   * Select Paymob Card as payment method
   */
  selectPaymobCard(): void {
    this.paymentMethodSelected.emit({
      provider: PaymentProvider.Paymob,
      paymobMethod: PaymobPaymentMethod.Card
    });
  }

  /**
   * Select Paymob Wallet as payment method
   */
  selectPaymobWallet(): void {
    this.paymentMethodSelected.emit({
      provider: PaymentProvider.Paymob,
      paymobMethod: PaymobPaymentMethod.EWallet
    });
  }

  /**
   * Close the modal
   */
  onClose(): void {
    this.closeModal.emit();
  }
}
