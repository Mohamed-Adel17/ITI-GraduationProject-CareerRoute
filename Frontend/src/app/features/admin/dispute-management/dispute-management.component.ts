import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminNavComponent } from '../../../shared/components/admin-nav/admin-nav.component';
import { DisputeService } from '../../../core/services/dispute.service';
import { NotificationService } from '../../../core/services/notification.service';
import { MentorService } from '../../../core/services/mentor.service';
import {
  AdminDisputeDto,
  AdminDisputeFilterDto,
  AdminDisputeListResponse,
  DisputeStatus,
  DisputeReason,
  DisputeResolution,
  ResolveDisputeDto,
  DisputePaginationMetadata,
  getDisputeStatusColor,
  getDisputeStatusText,
  getDisputeReasonText,
  getResolutionText,
  canResolveDispute
} from '../../../shared/models/dispute.model';

@Component({
  selector: 'app-dispute-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AdminNavComponent],
  templateUrl: './dispute-management.component.html',
  styleUrl: './dispute-management.component.css'
})
export class DisputeManagementComponent implements OnInit {
  private readonly disputeService = inject(DisputeService);
  private readonly notificationService = inject(NotificationService);
  private readonly mentorService = inject(MentorService);

  disputes: AdminDisputeDto[] = [];
  pagination: DisputePaginationMetadata | null = null;
  loading = false;
  resolvingId: string | null = null;

  // Resolve modal state
  showResolveModal = false;
  selectedDispute: AdminDisputeDto | null = null;
  resolveForm: ResolveDisputeDto = {
    resolution: DisputeResolution.NoRefund,
    refundAmount: undefined,
    adminNotes: ''
  };

  // Badge counts
  pendingMentorCount = 0;

  filters: AdminDisputeFilterDto = {
    page: 1,
    pageSize: 10,
    sortBy: 'createdAt',
    sortDescending: true,
    status: '',
    reason: ''
  };

  readonly statuses = Object.values(DisputeStatus);
  readonly reasons = Object.values(DisputeReason);
  readonly resolutions = Object.values(DisputeResolution);
  readonly canResolveDispute = canResolveDispute;
  readonly DisputeResolution = DisputeResolution;

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.closeResolveModal();
  }

  ngOnInit(): void {
    this.loadDisputes();
    this.loadPendingMentorCount();
  }

  loadPendingMentorCount(): void {
    this.mentorService.getPendingMentorApplications().subscribe({
      next: (apps) => this.pendingMentorCount = apps.length,
      error: () => this.pendingMentorCount = 0
    });
  }

  loadDisputes(): void {
    this.loading = true;
    this.disputeService.getAdminDisputes(this.filters).subscribe({
      next: (response: AdminDisputeListResponse) => {
        this.disputes = response.disputes;
        this.pagination = response.pagination;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading disputes', error);
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    this.filters.page = 1;
    this.loadDisputes();
  }

  clearFilters(): void {
    this.filters = {
      page: 1,
      pageSize: 10,
      sortBy: 'createdAt',
      sortDescending: true,
      status: '',
      reason: ''
    };
    this.loadDisputes();
  }

  changePage(page: number): void {
    if (!this.pagination) return;
    if (page < 1 || page > this.pagination.totalPages) return;
    this.filters.page = page;
    this.loadDisputes();
  }

  openResolveModal(dispute: AdminDisputeDto): void {
    if (!canResolveDispute(dispute.status)) return;
    this.selectedDispute = dispute;
    this.resolveForm = {
      resolution: DisputeResolution.NoRefund,
      refundAmount: undefined,
      adminNotes: ''
    };
    this.showResolveModal = true;
  }

  closeResolveModal(): void {
    this.showResolveModal = false;
    this.selectedDispute = null;
  }

  submitResolve(): void {
    if (!this.selectedDispute) return;

    // Validate refund amount for refund resolutions
    if (this.resolveForm.resolution !== DisputeResolution.NoRefund) {
      if (!this.resolveForm.refundAmount || this.resolveForm.refundAmount <= 0) {
        this.notificationService.error('Please enter a valid refund amount');
        return;
      }
      if (this.resolveForm.refundAmount > this.selectedDispute.sessionPrice) {
        this.notificationService.error('Refund amount cannot exceed session price');
        return;
      }
    }

    this.resolvingId = this.selectedDispute.id;
    const dto: ResolveDisputeDto = {
      resolution: this.resolveForm.resolution,
      refundAmount: this.resolveForm.resolution !== DisputeResolution.NoRefund
        ? this.resolveForm.refundAmount
        : undefined,
      adminNotes: this.resolveForm.adminNotes || undefined
    };

    this.disputeService.resolveDispute(this.selectedDispute.id, dto).subscribe({
      next: () => {
        this.notificationService.success('Dispute resolved successfully');
        this.resolvingId = null;
        this.closeResolveModal();
        this.loadDisputes();
      },
      error: (error) => {
        console.error('Error resolving dispute', error);
        this.resolvingId = null;
      }
    });
  }

  setFullRefund(): void {
    if (this.selectedDispute) {
      this.resolveForm.resolution = DisputeResolution.FullRefund;
      this.resolveForm.refundAmount = this.selectedDispute.sessionPrice;
    }
  }

  statusText(status: DisputeStatus): string {
    return getDisputeStatusText(status);
  }

  statusColor(status: DisputeStatus): string {
    return getDisputeStatusColor(status);
  }

  reasonText(reason: DisputeReason): string {
    return getDisputeReasonText(reason);
  }

  resolutionText(resolution: DisputeResolution): string {
    return getResolutionText(resolution);
  }

  formatCurrency(amount: number): string {
    return `${amount.toFixed(2)} EGP`;
  }

  trackByDispute(_: number, dispute: AdminDisputeDto): string {
    return dispute.id;
  }
}
