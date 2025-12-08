import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { BalanceService } from '../../../core/services/balance.service';
import { PayoutService } from '../../../core/services/payout.service';
import { NotificationService } from '../../../core/services/notification.service';
import { MentorService } from '../../../core/services/mentor.service';
import { MentorBalance, formatCurrency, getTotalBalance } from '../../../shared/models/balance.model';
import {
  Payout,
  MentorPayoutHistoryResponse,
  PayoutStatus,
  getPayoutStatusColor,
  getPayoutStatusText
} from '../../../shared/models/payout.model';

@Component({
  selector: 'app-mentor-payout',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payout.component.html',
  styleUrl: './payout.component.css'
})
export class MentorPayoutComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly balanceService = inject(BalanceService);
  private readonly payoutService = inject(PayoutService);
  private readonly notificationService = inject(NotificationService);
  private readonly mentorService = inject(MentorService);

  balance: MentorBalance | null = null;
  history: MentorPayoutHistoryResponse | null = null;

  balanceLoading = false;
  historyLoading = false;
  requestingPayout = false;

  payoutAmount = '';
  payoutError = '';
  showConfirmDialog = false;

  // Filter
  statusFilter: PayoutStatus | '' = '';
  readonly PayoutStatus = PayoutStatus;

  currentPage = 1;
  pageSize = 10;
  private mentorId: string | null = null;

  /** Close dialog on Escape key */
  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.showConfirmDialog) {
      this.showConfirmDialog = false;
    }
  }

  ngOnInit(): void {
    this.loadAll();
  }

  /** Get filtered payouts */
  get filteredPayouts(): Payout[] {
    if (!this.history?.payouts) return [];
    if (!this.statusFilter) return this.history.payouts;
    return this.history.payouts.filter(p => p.status === this.statusFilter);
  }

  /** Fill max available amount */
  requestMax(): void {
    if (this.availableBalance < 250) {
      this.payoutError = 'Available balance is below minimum payout (250 EGP).';
      return;
    }
    this.payoutAmount = this.availableBalance.toString();
    this.payoutError = '';
  }

  /** Show confirmation dialog */
  confirmPayout(): void {
    this.payoutError = '';

    const amount = Number(this.payoutAmount);

    if (Number.isNaN(amount) || amount <= 0) {
      this.payoutError = 'Enter a payout amount greater than zero.';
      return;
    }

    if (amount < 250) {
      this.payoutError = 'Minimum payout amount is 250 EGP.';
      return;
    }

    if (amount > this.availableBalance) {
      this.payoutError = 'Amount exceeds available balance.';
      return;
    }

    this.showConfirmDialog = true;
  }

  /** Convenience getters for template */
  get availableBalance(): number {
    return this.balance?.availableBalance ?? 0;
  }

  get pendingBalance(): number {
    return this.balance?.pendingBalance ?? 0;
  }

  get totalEarnings(): number {
    return this.balance?.totalEarnings ?? 0;
  }

  get totalBalance(): number {
    return getTotalBalance(this.balance);
  }

  loadAll(): void {
    const mentorId = this.authService.getMentorId();

    if (mentorId) {
      this.mentorId = mentorId;
      this.loadBalance(mentorId);
      this.loadHistory(mentorId);
      return;
    }

    this.resolveMentorId();
  }

  private resolveMentorId(): void {
    this.balanceLoading = true;
    this.historyLoading = true;

    this.mentorService.getCurrentMentorProfile().subscribe({
      next: (mentor) => {
        this.mentorId = mentor.id;
        this.loadBalance(mentor.id);
        this.loadHistory(mentor.id);
      },
      error: (error) => {
        this.balanceLoading = false;
        this.historyLoading = false;
        this.notificationService.error('Mentor profile not found. Please re-login.', 'Payouts');
        console.error('Unable to resolve mentor profile for payouts', error);
      }
    });
  }

  private loadBalance(mentorId: string): void {
    this.balanceLoading = true;

    this.balanceService.getMentorBalance(mentorId).subscribe({
      next: (balance) => {
        this.balance = balance;
        this.balanceLoading = false;
      },
      error: (error) => {
        console.error('Error loading mentor balance', error);
        this.balanceLoading = false;
      }
    });
  }

  private loadHistory(mentorId: string): void {
    this.historyLoading = true;

    this.payoutService.getMentorPayoutHistory(mentorId, {
      page: this.currentPage,
      pageSize: this.pageSize
    }).subscribe({
      next: (history) => {
        this.history = history;
        this.historyLoading = false;
      },
      error: (error) => {
        console.error('Error loading payout history', error);
        this.historyLoading = false;
      }
    });
  }

  /** Submit payout request (called after confirmation) */
  submitPayoutRequest(): void {
    this.showConfirmDialog = false;

    const mentorId = this.mentorId || this.authService.getMentorId();
    if (!mentorId) {
      this.notificationService.error('Mentor profile not found. Please re-login.', 'Payouts');
      return;
    }

    const amount = Number(this.payoutAmount);
    this.requestingPayout = true;

    this.payoutService.requestPayout(mentorId, { amount }).subscribe({
      next: (payout) => {
        this.notificationService.success(
          `Payout request for ${formatCurrency(payout.amount)} submitted successfully`,
          'Payout Requested'
        );

        this.payoutAmount = '';
        this.payoutError = '';
        this.requestingPayout = false;
        this.loadAll();
      },
      error: (error) => {
        console.error('Error requesting payout', error);
        this.payoutError = this.extractErrorMessage(error);
        this.requestingPayout = false;
      }
    });
  }

  /** Pagination change */
  changePage(page: number): void {
    if (!this.history?.pagination) return;

    if (page < 1 || page > this.history.pagination.totalPages) return;
    this.currentPage = page;
    const mentorId = this.mentorId || this.authService.getMentorId();
    if (!mentorId) return;
    this.loadHistory(mentorId);
  }

  formatAmount(amount: number): string {
    return formatCurrency(amount);
  }

  statusText(status: PayoutStatus): string {
    return getPayoutStatusText(status);
  }

  statusColor(status: PayoutStatus): string {
    return getPayoutStatusColor(status);
  }

  trackByPayout(_: number, payout: Payout): string {
    return payout.id;
  }

  private extractErrorMessage(error: any): string {
    if (error.errors) {
      const messages = Object.values(error.errors).flat();
      if (messages.length > 0) return messages.join('; ');
    }
    return error.message || 'Failed to submit payout request';
  }
}
