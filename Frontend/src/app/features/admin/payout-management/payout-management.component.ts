import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PayoutService } from '../../../core/services/payout.service';
import { NotificationService } from '../../../core/services/notification.service';
import { MentorService } from '../../../core/services/mentor.service';
import {
  AdminPayoutFilterDto,
  AdminPayoutListResponse,
  Payout,
  PayoutStatus,
  getPayoutStatusColor,
  getPayoutStatusText,
  isPayoutCancellable,
  isPayoutProcessable
} from '../../../shared/models/payout.model';
import { PaginationMetadata } from '../../../shared/models/payment.model';
import { formatCurrency } from '../../../shared/models/balance.model';

@Component({
  selector: 'app-payout-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './payout-management.component.html',
  styleUrl: './payout-management.component.css'
})
export class PayoutManagementComponent implements OnInit {
  private readonly payoutService = inject(PayoutService);
  private readonly notificationService = inject(NotificationService);
  private readonly mentorService = inject(MentorService);

  payouts: Payout[] = [];
  pagination: PaginationMetadata | null = null;
  loading = false;
  processingId: string | null = null;
  cancellingId: string | null = null;

  // Confirmation dialog
  showConfirmDialog = false;
  confirmAction: 'process' | 'cancel' | null = null;
  confirmPayout: Payout | null = null;

  // Pending mentor count for badge
  pendingMentorCount = 0;

  filters: AdminPayoutFilterDto = {
    page: 1,
    pageSize: 10,
    sortBy: 'requestedAt',
    sortDescending: true,
    status: ''
  };

  readonly statuses = Object.values(PayoutStatus);
  readonly isPayoutProcessable = isPayoutProcessable;
  readonly isPayoutCancellable = isPayoutCancellable;

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.closeConfirmDialog();
  }

  ngOnInit(): void {
    this.loadPayouts();
    this.loadPendingMentorCount();
  }

  loadPendingMentorCount(): void {
    this.mentorService.getPendingMentorApplications().subscribe({
      next: (apps) => this.pendingMentorCount = apps.length,
      error: () => this.pendingMentorCount = 0
    });
  }

  loadPayouts(): void {
    this.loading = true;

    this.payoutService.getAdminPayouts(this.filters).subscribe({
      next: (response: AdminPayoutListResponse) => {
        this.payouts = response.payouts;
        this.pagination = response.pagination;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading payouts', error);
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    this.filters.page = 1;
    this.loadPayouts();
  }

  clearFilters(): void {
    this.filters = {
      page: 1,
      pageSize: 10,
      sortBy: 'requestedAt',
      sortDescending: true,
      status: ''
    };
    this.loadPayouts();
  }

  changePage(page: number): void {
    if (!this.pagination) return;
    if (page < 1 || page > this.pagination.totalPages) return;
    this.filters.page = page;
    this.loadPayouts();
  }

  openProcessDialog(payout: Payout): void {
    if (!isPayoutProcessable(payout.status)) return;
    this.confirmAction = 'process';
    this.confirmPayout = payout;
    this.showConfirmDialog = true;
  }

  openCancelDialog(payout: Payout): void {
    if (!isPayoutCancellable(payout.status)) return;
    this.confirmAction = 'cancel';
    this.confirmPayout = payout;
    this.showConfirmDialog = true;
  }

  closeConfirmDialog(): void {
    this.showConfirmDialog = false;
    this.confirmAction = null;
    this.confirmPayout = null;
  }

  confirmDialogAction(): void {
    if (!this.confirmPayout) return;

    if (this.confirmAction === 'process') {
      this.processPayout(this.confirmPayout);
    } else if (this.confirmAction === 'cancel') {
      this.cancelPayout(this.confirmPayout);
    }
    this.closeConfirmDialog();
  }

  private processPayout(payout: Payout): void {
    this.processingId = payout.id;

    this.payoutService.processPayout(payout.id).subscribe({
      next: () => {
        this.notificationService.success(
          `Payout ${formatCurrency(payout.amount)} processed successfully`,
          'Payout Processed'
        );
        this.processingId = null;
        this.loadPayouts();
      },
      error: (error) => {
        console.error('Error processing payout', error);
        this.processingId = null;
      }
    });
  }

  private cancelPayout(payout: Payout): void {
    this.cancellingId = payout.id;

    this.payoutService.cancelPayout(payout.id).subscribe({
      next: () => {
        this.notificationService.success('Payout cancelled.', 'Payout Updated');
        this.cancellingId = null;
        this.loadPayouts();
      },
      error: (error) => {
        console.error('Error cancelling payout', error);
        this.cancellingId = null;
      }
    });
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
}
