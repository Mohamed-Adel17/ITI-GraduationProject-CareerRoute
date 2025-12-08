/**
 * Mentor Balance Models
 *
 * Represents mentor financial balances returned by the backend.
 */
export interface MentorBalance {
  mentorId: string;
  availableBalance: number;
  pendingBalance: number;
  totalEarnings: number;
  lastUpdated: string;
}

/**
 * Convenience response shape for balance endpoint
 */
export interface BalanceResponse {
  mentorBalance: MentorBalance;
}

/**
 * Format currency for display (EGP for Egypt market)
 */
export function formatCurrency(amount: number, currency: string = 'EGP'): string {
  return new Intl.NumberFormat('en-EG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Calculate total balance (available + pending)
 */
export function getTotalBalance(balance: MentorBalance | null): number {
  if (!balance) return 0;
  return balance.availableBalance + balance.pendingBalance;
}
