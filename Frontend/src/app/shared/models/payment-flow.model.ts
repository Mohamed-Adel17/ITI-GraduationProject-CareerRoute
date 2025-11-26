/**
 * Payment Flow Models
 *
 * This file contains TypeScript interfaces and enums for managing the payment flow state
 * across different payment methods (Stripe, Paymob Card, Paymob Wallet).
 */

import { PaymentProvider, PaymobPaymentMethod } from './payment.model';

/**
 * Payment Flow Status Enum
 * Represents the current state of the payment process
 */
export enum PaymentFlowStatus {
  SelectingMethod = 'selecting-method',
  CreatingIntent = 'creating-intent',
  ProcessingPayment = 'processing-payment',
  ConfirmingPayment = 'confirming-payment',
  Success = 'success',
  Failed = 'failed'
}

/**
 * Payment Flow State
 * Manages the complete state of a payment transaction
 */
export interface PaymentFlowState {
  sessionId: string;
  amount: number;
  paymentProvider?: PaymentProvider;
  paymobPaymentMethod?: PaymobPaymentMethod;
  paymentIntentId?: string;
  clientSecret?: string;
  status: PaymentFlowStatus;
  errorMessage?: string;
}

/**
 * Paymob Wallet Request
 * Request body for Paymob wallet payment initiation
 */
export interface PaymobWalletRequest {
  payment_token: string;
  source: {
    identifier: string;
    subtype: 'WALLET';
  };
}

/**
 * Paymob Wallet Response
 * Response from Paymob wallet payment API
 */
export interface PaymobWalletResponse {
  redirect_url: string | null;
}

/**
 * Stripe Payment Result
 * Result from Stripe payment confirmation
 */
export interface StripePaymentResult {
  success: boolean;
  paymentIntent?: any;
  error?: string;
}

/**
 * Payment Method Selection
 * Data emitted when user selects a payment method
 */
export interface PaymentMethodSelection {
  provider: PaymentProvider;
  paymobMethod?: PaymobPaymentMethod;
}
