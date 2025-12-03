import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentService } from '../../../core/services/payment.service';
import {
    PaymentHistoryItem,
    PaymentHistoryResponse,
    PaymentHistorySummary,
    PaymentStatus,
    PaginationMetadata,
    formatPaymentDateTime,
    getPaymentStatusColor
} from '../../../shared/models/payment.model';

/**
 * PaymentHistoryComponent
 *
 * Displays a user's payment transaction history with pagination and filtering.
 *
 * Features:
 * - Paginated payment list (10 items per page)
 * - Payment summary cards (total spent USD/EGP, refunded, net)
 * - Status filtering (optional)
 * - Responsive table layout
 * - Loading and error states
 * - Status badges with color coding
 *
 * API: GET /api/payments/history
 */
@Component({
    selector: 'app-payment-history',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './payment-history.component.html',
    styleUrl: './payment-history.component.scss'
})
export class PaymentHistoryComponent implements OnInit {
    private readonly paymentService = inject(PaymentService);

    // Payment data
    payments: PaymentHistoryItem[] = [];
    summary: PaymentHistorySummary | null = null;

    // Pagination
    currentPage: number = 1;
    pageSize: number = 10;
    pagination: PaginationMetadata | null = null;

    // UI state
    isLoading: boolean = false;
    errorMessage: string | null = null;

    // Filtering (optional)
    selectedStatus: PaymentStatus | null = null;
    PaymentStatus = PaymentStatus; // Expose enum to template
    Math = Math; // Expose Math to template for min/max calculations

    // Calculated summaries by currency
    totalSpentUSD: number = 0;
    totalSpentEGP: number = 0;
    totalRefundedUSD: number = 0;
    totalRefundedEGP: number = 0;
    netSpentUSD: number = 0;
    netSpentEGP: number = 0;

    // Combined net spent in EGP (USD converted at 1:50 rate)
    combinedNetSpentEGP: number = 0;

    // Currency conversion rate
    private readonly USD_TO_EGP_RATE = 50;

    ngOnInit(): void {
        this.loadPaymentHistory();
        this.loadAllPaymentsForSummary();
    }

    /**
     * Load payment history from API
     */
    loadPaymentHistory(): void {
        this.isLoading = true;
        this.errorMessage = null;

        const params = {
            page: this.currentPage,
            pageSize: this.pageSize,
            ...(this.selectedStatus && { status: this.selectedStatus })
        };

        this.paymentService.getPaymentHistory(params).subscribe({
            next: (response: PaymentHistoryResponse) => {
                this.payments = response.payments;
                this.pagination = response.paginationMetadata;
                this.summary = response.summary;
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error loading payment history:', error);

                // If 404, it means no payment history exists yet - this is not an error
                if (error.status === 404) {
                    this.payments = [];
                    this.summary = null;
                    this.errorMessage = null; // Don't show error for empty history
                } else {
                    // Only show error for actual errors (not 404)
                    this.errorMessage = 'Failed to load payment history. Please try again.';
                    this.payments = [];
                    this.summary = null;
                }

                this.isLoading = false;
            }
        });
    }

    /**
     * Load all payments to calculate accurate global totals by currency
     * This is a client-side workaround since backend doesn't support multi-currency summary
     */
    loadAllPaymentsForSummary(): void {
        // Fetch a large page to get all records for summary calculation
        const params = {
            page: 1,
            pageSize: 1000, // Large enough to cover all payments for now
            ...(this.selectedStatus && { status: this.selectedStatus })
        };

        this.paymentService.getPaymentHistory(params).subscribe({
            next: (response: PaymentHistoryResponse) => {
                this.calculateCurrencyTotals(response.payments);
            },
            error: (error) => {
                // Silently handle errors for summary calculation
                // If there are no payments, just keep totals at 0
                console.log('No payment history available for summary calculation');
                this.calculateCurrencyTotals([]);
            }
        });
    }

    /**
     * Calculate totals split by currency from full payment list
     * Also calculates refunds and net spent per currency, plus combined net spent in EGP
     */
    private calculateCurrencyTotals(allPayments: PaymentHistoryItem[]): void {
        // Reset all totals
        this.totalSpentUSD = 0;
        this.totalSpentEGP = 0;
        this.totalRefundedUSD = 0;
        this.totalRefundedEGP = 0;

        allPayments.forEach(payment => {
            const isUSD = (payment as any).paymentProvider === 'Stripe';

            // Count successful payments (Captured)
            if (payment.status === PaymentStatus.Captured) {
                if (isUSD) {
                    this.totalSpentUSD += payment.amount;
                } else {
                    this.totalSpentEGP += payment.amount;
                }
            }

            // Count refunds
            if (payment.status === PaymentStatus.Refunded && payment.refundAmount) {
                if (isUSD) {
                    this.totalRefundedUSD += payment.refundAmount;
                } else {
                    this.totalRefundedEGP += payment.refundAmount;
                }
            }
        });

        // Calculate net spent per currency
        this.netSpentUSD = this.totalSpentUSD - this.totalRefundedUSD;
        this.netSpentEGP = this.totalSpentEGP - this.totalRefundedEGP;

        // Calculate combined net spent in EGP (convert USD to EGP at 1:50 rate)
        this.combinedNetSpentEGP = (this.netSpentUSD * this.USD_TO_EGP_RATE) + this.netSpentEGP;
    }

    /**
     * Handle page change
     */
    onPageChange(page: number): void {
        if (page < 1 || (this.pagination && page > this.pagination.totalPages)) {
            return;
        }
        this.currentPage = page;
        this.loadPaymentHistory();
    }

    /**
     * Handle status filter change
     */
    onStatusFilter(status: PaymentStatus | null): void {
        this.selectedStatus = status;
        this.currentPage = 1; // Reset to first page
        this.loadPaymentHistory();
        this.loadAllPaymentsForSummary(); // Recalculate totals for new filter
    }

    /**
     * Format date for display
     */
    formatDate(dateString: string | null | undefined): string {
        return formatPaymentDateTime(dateString);
    }

    /**
     * Format amount with currency based on payment provider
     * Stripe payments are in USD, Paymob payments are in EGP
     */
    formatAmount(payment: PaymentHistoryItem | { amount: number, paymentProvider?: string } | number): string {
        // Handle both payment object and plain number for backward compatibility
        let amount: number;
        let currency: string;

        if (typeof payment === 'number') {
            // For summary cards - assume EGP as default
            amount = payment;
            currency = 'EGP';
        } else {
            // For individual payments - detect currency from provider
            amount = (payment as any).amount;
            // Stripe uses USD, Paymob uses EGP
            currency = (payment as any).paymentProvider === 'Stripe' ? 'USD' : 'EGP';
        }

        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(amount);
    }

    /**
     * Format refund amount with currency
     */
    formatRefundAmount(payment: PaymentHistoryItem): string {
        if (!payment.refundAmount) return '';

        // Use the same currency logic as formatAmount
        const currency = (payment as any).paymentProvider === 'Stripe' ? 'USD' : 'EGP';

        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(payment.refundAmount);
    }

    /**
     * Get status text for display
     */
    getStatusText(status: PaymentStatus): string {
        return this.paymentService.getStatusText(status);
    }

    /**
     * Get Tailwind CSS classes for status badge
     */
    getStatusBadgeClass(status: PaymentStatus): string {
        const color = getPaymentStatusColor(status);
        const baseClasses = 'inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold';

        const colorMap: Record<string, string> = {
            'green': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
            'yellow': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
            'blue': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
            'gray': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
            'red': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
        };

        return `${baseClasses} ${colorMap[color] || colorMap['gray']}`;
    }

    /**
     * Check if there are payments to display
     */
    get hasPayments(): boolean {
        return this.payments.length > 0;
    }

    /**
     * Check if pagination is needed
     */
    get showPagination(): boolean {
        return this.pagination !== null && this.pagination.totalPages > 1;
    }

    /**
     * Get page numbers for pagination
     */
    get pageNumbers(): number[] {
        if (!this.pagination) return [];
        return Array.from({ length: this.pagination.totalPages }, (_, i) => i + 1);
    }
}
