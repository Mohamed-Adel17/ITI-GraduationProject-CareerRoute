import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MentorService } from '../../../core/services/mentor.service';
import { PayoutService } from '../../../core/services/payout.service';
import { DisputeService } from '../../../core/services/dispute.service';
import { PayoutStatus } from '../../../shared/models/payout.model';
import { DisputeStatus } from '../../../shared/models/dispute.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-dashboard.component.html'
})
export class AdminDashboardComponent implements OnInit {
  pendingApprovals = 0;
  pendingPayouts = 0;
  openDisputes = 0;
  loading = true;

  constructor(
    private mentorService: MentorService,
    private payoutService: PayoutService,
    private disputeService: DisputeService
  ) {}

  ngOnInit(): void {
    this.loadStats();
  }

  private loadStats(): void {
    forkJoin({
      mentors: this.mentorService.getPendingMentorApplications().pipe(catchError(() => of([]))),
      payouts: this.payoutService.getAdminPayouts({ status: PayoutStatus.Pending, page: 1, pageSize: 1 }).pipe(catchError(() => of({ payouts: [], pagination: null }))),
      disputes: this.disputeService.getAdminDisputes({ status: DisputeStatus.Pending, page: 1, pageSize: 1 }).pipe(catchError(() => of({ disputes: [], pagination: null })))
    }).subscribe({
      next: (result) => {
        this.pendingApprovals = result.mentors.length;
        this.pendingPayouts = result.payouts.pagination?.totalCount || 0;
        this.openDisputes = result.disputes.pagination?.totalCount || 0;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }
}
