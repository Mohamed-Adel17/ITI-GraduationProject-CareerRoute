/**
 * Payment Models
 *
 * This file contains TypeScript interfaces and enums for payment processing,
 * including payment intents, confirmations, and payment history.
 *
 * Based on: Session-Payment-Endpoints.md
 */

// ===========================
// Enums
// ===========================

/**
 * Payment Status Enum
 * Represents the state of a payment transaction
 */
export enum PaymentStatus {
  Pending = 'Pending',             // Payment created, awaiting processing
  Authorized = 'Authorized',       // Payment authorized but not captured
  Captured = 'Captured',           // Payment successfully captured
  Refunded = 'Refunded',           // Payment refunded to user
  Failed = 'Failed'                // Payment failed
}

/**
 * Payment Provider Enum
 * Supported payment gateway providers
 * Values match backend API contract (integer enum)
 */
export enum PaymentProvider {
  Stripe = 'Stripe',   // 1: Stripe (international, USD)
  Paymob = 'Paymob'    // 2: Paymob (Egypt, EGP)
}

/**
 * Paymob Payment Method Enum
 * Payment methods available for Paymob
 * Values match backend API contract (integer enum)
 */
export enum PaymobPaymentMethod {
  Card = 1,      // 1: Credit/Debit card
  EWallet = 2    // 2: E-wallet (Vodafone Cash, etc.)
}

/**
 * Refund Status Enum
 * Status of refund processing
 */
export enum RefundStatus {
  Processing = 'Processing',  // Refund initiated
  Completed = 'Completed',    // Refund completed
  Failed = 'Failed'           // Refund failed
}

// ===========================
// Core Interfaces
// ===========================

/**
 * Payment Interface
 * Complete payment entity with all details
 * Based on PaymentDto from backend
 */
export interface Payment {
  id: string;                          // Payment GUID
  sessionId: string;                   // Associated session GUID
  amount: number;                      // Total payment amount
  platformCommission: number;          // 15% commission to platform
  mentorPayoutAmount: number;          // Amount paid to mentor (85%)
  paymentProvider: PaymentProvider;    // Stripe or Paymob
  status: PaymentStatus;               // Current payment status
  transactionId: string;               // External transaction ID from provider
  refundAmount?: number | null;        // Refunded amount (if refunded)
  refundedAt?: string | null;          // ISO 8601 datetime of refund
  paidAt?: string | null;              // ISO 8601 datetime when paid
  createdAt: string;                   // ISO 8601 datetime
  updatedAt: string;                   // ISO 8601 datetime
}

/**
 * Payment Summary
 * Lightweight payment info for lists
 */
export interface PaymentSummary {
  id: string;
  sessionId: string;
  amount: number;
  paymentProvider: PaymentProvider;
  status: PaymentStatus;
  transactionId: string;
  paidAt?: string | null;
}

/**
 * Payment History Item
 * Payment information for history lists
 * Based on payment history endpoint response
 */
export interface PaymentHistoryItem {
  id: string;
  sessionId: string;
  mentorName: string;
  sessionTopic?: string | null;
  amount: number;
  paymentProvider: PaymentProvider;   // Stripe (USD) or Paymob (EGP)
  paymentMethod: string;              // Visa, Mastercard, Meeza, etc.
  status: PaymentStatus;
  transactionId: string;
  paidAt?: string | null;
  refundAmount?: number | null;
  refundedAt?: string | null;
}

// ===========================
// Request/Response DTOs
// ===========================

/**
 * Create Payment Intent Request
 * Request body for POST /api/payments/create-intent
 */
export interface CreatePaymentIntentRequest {
  sessionId: string;                             // Required: Session GUID
  paymentProvider: PaymentProvider;              // Required: Stripe or Paymob
  paymobPaymentMethod?: PaymobPaymentMethod;     // Required when provider = Paymob
}

/**
 * Payment Intent Response
 * Response after creating a payment intent
 */
export interface PaymentIntentResponse {
  paymentIntentId: string;           // Payment intent ID from Stripe/Paymob
  clientSecret: string;              // Client secret for frontend payment completion
  amount: number;                    // Payment amount
  currency: string;                  // USD for Stripe, EGP for Paymob
  sessionId: string;                 // Associated session GUID
  paymentProvider: PaymentProvider;  // Stripe or Paymob
  status: string;                    // Payment intent status (RequiresPaymentMethod, etc.)
}

/**
 * Confirm Payment Request
 * Request body for POST /api/payments/confirm
 */
export interface ConfirmPaymentRequest {
  paymentIntentId: string;  // Required: Payment intent ID from Stripe/Paymob
  sessionId: string;        // Required: Session GUID
}

/**
 * Session Info in Payment Confirmation
 * Nested session data in payment confirmation response
 */
export interface PaymentSessionInfo {
  id: string;
  status: string;                      // "Confirmed" after payment
  videoConferenceLink: string;
  scheduledStartTime: string;
}

/**
 * Payment Confirmation Response
 * Response after confirming payment
 */
export interface PaymentConfirmationResponse {
  paymentId: string;
  sessionId: string;
  amount: number;
  platformCommission: number;
  mentorPayoutAmount: number;
  paymentProvider: PaymentProvider;
  status: PaymentStatus;               // "Captured"
  transactionId: string;
  paidAt: string;
  session: PaymentSessionInfo;         // Confirmed session details
}

/**
 * Payment History Summary
 * Summary statistics for payment history
 */
export interface PaymentHistorySummary {
  totalSpent: number;      // Total amount spent
  totalRefunded: number;   // Total amount refunded
  netSpent: number;        // Net amount (totalSpent - totalRefunded)
}

// ===========================
// Paginated Responses
// ===========================

/**
 * Pagination Metadata
 * Standard pagination information
 */
export interface PaginationMetadata {
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Payment History Response
 * Response for GET /api/payments/history
 */
export interface PaymentHistoryResponse {
  payments: PaymentHistoryItem[];
  paginationMetadata: PaginationMetadata;  // Backend returns 'paginationMetadata' not 'pagination'
  summary: PaymentHistorySummary;
}

/**
 * Payment History Query Params
 * Query parameters for GET /api/payments/history
 */
export interface PaymentHistoryParams {
  page?: number;           // Page number (default: 1)
  pageSize?: number;       // Items per page (default: 10, max: 50)
  status?: PaymentStatus;  // Filter by payment status
}

// ===========================
// Helper Functions
// ===========================

/**
 * Format payment status for display
 */
export function formatPaymentStatus(status: PaymentStatus): string {
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
 * Get payment status badge color for UI
 */
export function getPaymentStatusColor(status: PaymentStatus): string {
  const colorMap: Record<PaymentStatus, string> = {
    [PaymentStatus.Pending]: 'yellow',
    [PaymentStatus.Authorized]: 'blue',
    [PaymentStatus.Captured]: 'green',
    [PaymentStatus.Refunded]: 'gray',
    [PaymentStatus.Failed]: 'red'
  };
  return colorMap[status] || 'gray';
}

/**
 * Format payment provider for display
 */
export function formatPaymentProvider(provider: PaymentProvider): string {
  const providerMap: Record<PaymentProvider, string> = {
    [PaymentProvider.Stripe]: 'Stripe',
    [PaymentProvider.Paymob]: 'Paymob'
  };
  return providerMap[provider] || 'Unknown';
}

/**
 * Get currency for payment provider
 */
export function getProviderCurrency(provider: PaymentProvider): string {
  const currencyMap: Record<PaymentProvider, string> = {
    [PaymentProvider.Stripe]: 'USD',
    [PaymentProvider.Paymob]: 'EGP'
  };
  return currencyMap[provider] || 'USD';
}

/**
 * Format payment amount with currency
 */
export function formatPaymentAmount(amount: number, provider: PaymentProvider): string {
  const currency = getProviderCurrency(provider);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
}

/**
 * Calculate platform commission (15%)
 */
export function calculatePlatformCommission(amount: number): number {
  return amount * 0.15;
}

/**
 * Calculate mentor payout (85%)
 */
export function calculateMentorPayout(amount: number): number {
  return amount * 0.85;
}

/**
 * Format datetime for display
 */
export function formatPaymentDateTime(isoString: string | null | undefined): string {
  if (!isoString) {
    return 'N/A';
  }

  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Check if payment is refundable
 */
export function isRefundable(payment: Payment | PaymentSummary): boolean {
  return payment.status === PaymentStatus.Captured;
}

/**
 * Check if payment is successful
 */
export function isPaymentSuccessful(payment: Payment | PaymentSummary): boolean {
  return payment.status === PaymentStatus.Captured || payment.status === PaymentStatus.Authorized;
}

/**
 * Check if payment is pending
 */
export function isPaymentPending(payment: Payment | PaymentSummary): boolean {
  return payment.status === PaymentStatus.Pending;
}

/**
 * Check if payment is failed
 */
export function isPaymentFailed(payment: Payment | PaymentSummary): boolean {
  return payment.status === PaymentStatus.Failed;
}

/**
 * Sort payments by date (Payment array)
 */
export function sortPaymentsByDate(
  payments: Payment[],
  ascending: boolean = false
): Payment[] {
  return [...payments].sort((a, b) => {
    const dateA = new Date(a.paidAt || a.createdAt || 0).getTime();
    const dateB = new Date(b.paidAt || b.createdAt || 0).getTime();
    return ascending ? dateA - dateB : dateB - dateA;
  });
}

/**
 * Sort payment history items by date
 */
export function sortPaymentHistoryByDate(
  payments: PaymentHistoryItem[],
  ascending: boolean = false
): PaymentHistoryItem[] {
  return [...payments].sort((a, b) => {
    const dateA = new Date(a.paidAt || 0).getTime();
    const dateB = new Date(b.paidAt || 0).getTime();
    return ascending ? dateA - dateB : dateB - dateA;
  });
}

/**
 * Filter payments by status (Payment array)
 */
export function filterPaymentsByStatus(
  payments: Payment[],
  status: PaymentStatus
): Payment[] {
  return payments.filter(payment => payment.status === status);
}

/**
 * Filter payment history items by status
 */
export function filterPaymentHistoryByStatus(
  payments: PaymentHistoryItem[],
  status: PaymentStatus
): PaymentHistoryItem[] {
  return payments.filter(payment => payment.status === status);
}

/**
 * Get total spent from payment history
 */
export function calculateTotalSpent(payments: PaymentHistoryItem[]): number {
  return payments
    .filter(p => p.status === PaymentStatus.Captured)
    .reduce((sum, p) => sum + p.amount, 0);
}

/**
 * Get total refunded from payment history
 */
export function calculateTotalRefunded(payments: PaymentHistoryItem[]): number {
  return payments
    .filter(p => p.status === PaymentStatus.Refunded && p.refundAmount !== null)
    .reduce((sum, p) => sum + (p.refundAmount || 0), 0);
}

/**
 * Get net spent (total - refunds)
 */
export function calculateNetSpent(payments: PaymentHistoryItem[]): number {
  const totalSpent = calculateTotalSpent(payments);
  const totalRefunded = calculateTotalRefunded(payments);
  return totalSpent - totalRefunded;
}

/**
 * Format refund status for display
 */
export function formatRefundStatus(status: RefundStatus): string {
  const statusMap: Record<RefundStatus, string> = {
    [RefundStatus.Processing]: 'Processing',
    [RefundStatus.Completed]: 'Completed',
    [RefundStatus.Failed]: 'Failed'
  };
  return statusMap[status] || status;
}

/**
 * Get refund status badge color for UI
 */
export function getRefundStatusColor(status: RefundStatus): string {
  const colorMap: Record<RefundStatus, string> = {
    [RefundStatus.Processing]: 'yellow',
    [RefundStatus.Completed]: 'green',
    [RefundStatus.Failed]: 'red'
  };
  return colorMap[status] || 'gray';
}

// ===========================
// Type Guards
// ===========================

/**
 * Type guard to check if object is a Payment
 */
export function isPayment(obj: any): obj is Payment {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.sessionId === 'string' &&
    typeof obj.amount === 'number' &&
    typeof obj.platformCommission === 'number' &&
    typeof obj.mentorPayoutAmount === 'number' &&
    typeof obj.paymentProvider === 'string' &&
    typeof obj.status === 'string' &&
    typeof obj.transactionId === 'string' &&
    typeof obj.createdAt === 'string'
  );
}

/**
 * Type guard to check if object is a PaymentSummary
 */
export function isPaymentSummary(obj: any): obj is PaymentSummary {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.sessionId === 'string' &&
    typeof obj.amount === 'number' &&
    typeof obj.paymentProvider === 'string' &&
    typeof obj.status === 'string'
  );
}

/**
 * Type guard to check if object is a PaymentHistoryItem
 */
export function isPaymentHistoryItem(obj: any): obj is PaymentHistoryItem {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.sessionId === 'string' &&
    typeof obj.mentorName === 'string' &&
    typeof obj.amount === 'number' &&
    typeof obj.paymentMethod === 'string' &&
    typeof obj.status === 'string'
  );
}

/**
 * Validate create payment intent request
 */
export function validateCreatePaymentIntentRequest(
  request: Partial<CreatePaymentIntentRequest>
): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  if (!request.sessionId || request.sessionId.trim() === '') {
    errors['sessionId'] = 'Session ID is required';
  }

  if (!request.paymentProvider) {
    errors['paymentProvider'] = 'Payment provider is required';
  }

  if (
    request.paymentProvider === PaymentProvider.Paymob &&
    !request.paymobPaymentMethod
  ) {
    errors['paymobPaymentMethod'] = 'Payment method is required for Paymob';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validate confirm payment request
 */
export function validateConfirmPaymentRequest(
  request: Partial<ConfirmPaymentRequest>
): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  if (!request.paymentIntentId || request.paymentIntentId.trim() === '') {
    errors['paymentIntentId'] = 'Payment intent ID is required';
  }

  if (!request.sessionId || request.sessionId.trim() === '') {
    errors['sessionId'] = 'Session ID is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validate payment history params
 */
export function validatePaymentHistoryParams(
  params: Partial<PaymentHistoryParams>
): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  if (params.page !== undefined && (params.page < 1 || !Number.isInteger(params.page))) {
    errors['page'] = 'Page must be a positive integer';
  }

  if (
    params.pageSize !== undefined &&
    (params.pageSize < 1 || params.pageSize > 50 || !Number.isInteger(params.pageSize))
  ) {
    errors['pageSize'] = 'Page size must be between 1 and 50';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}
