import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SessionService } from '../../../core/services/session.service';
import { NotificationService } from '../../../core/services/notification.service';
import { RescheduleDetails } from '../../../shared/models/session.model';

type PageStatus = 'loading' | 'loaded' | 'processing' | 'success' | 'error' | 'not-found' | 'already-processed';

@Component({
  selector: 'app-reschedule-review',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reschedule-review.component.html'
})
export class RescheduleReviewComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private sessionService = inject(SessionService);
  private notificationService = inject(NotificationService);

  rescheduleId = '';
  rescheduleDetails: RescheduleDetails | null = null;
  status: PageStatus = 'loading';
  errorMessage = '';
  resultMessage = '';
  isApproved = false;

  ngOnInit(): void {
    this.rescheduleId = this.route.snapshot.params['rescheduleId'];
    this.loadRescheduleDetails();
  }

  loadRescheduleDetails(): void {
    this.status = 'loading';
    this.sessionService.getRescheduleDetails(this.rescheduleId).subscribe({
      next: (details) => {
        this.rescheduleDetails = details;
        if (details.status !== 'Pending') {
          this.status = 'already-processed';
          this.isApproved = details.status === 'Approved';
        } else {
          this.status = 'loaded';
        }
      },
      error: (err) => {
        if (err.status === 404) {
          this.status = 'not-found';
          this.errorMessage = 'This reschedule request was not found or has expired.';
        } else if (err.status === 401 || err.status === 403) {
          this.router.navigate(['/auth/login'], { queryParams: { returnUrl: this.router.url } });
        } else {
          this.status = 'error';
          this.errorMessage = 'Unable to load reschedule details. Please try again.';
        }
      }
    });
  }

  approve(): void {
    if (!confirm(`Are you sure you want to approve this reschedule? The session will be moved to ${this.formatDateTime(this.rescheduleDetails?.newScheduledStartTime)}.`)) {
      return;
    }
    this.status = 'processing';
    this.sessionService.approveReschedule(this.rescheduleId).subscribe({
      next: (response) => {
        this.status = 'success';
        this.isApproved = true;
        this.resultMessage = `Reschedule approved! The session has been updated to ${this.formatDateTime(response.requestedStartTime)}.`;
        this.notificationService.success('Reschedule approved!', 'Success');
      },
      error: (err) => this.handleError(err)
    });
  }

  reject(): void {
    if (!confirm(`Are you sure you want to reject this reschedule? The session will remain at ${this.formatDateTime(this.rescheduleDetails?.originalStartTime)}.`)) {
      return;
    }
    this.status = 'processing';
    this.sessionService.rejectReschedule(this.rescheduleId).subscribe({
      next: (response) => {
        this.status = 'success';
        this.isApproved = false;
        this.resultMessage = `Reschedule rejected. The session remains at ${this.formatDateTime(response.originalStartTime)}.`;
        this.notificationService.info('Reschedule rejected', 'Info');
      },
      error: (err) => this.handleError(err)
    });
  }

  private handleError(err: any): void {
    if (err.status === 409) {
      this.status = 'already-processed';
      this.errorMessage = 'This reschedule request has already been processed.';
    } else {
      this.status = 'error';
      this.errorMessage = err.error?.message || 'Unable to process request. Please try again.';
    }
  }

  goToSessions(): void {
    this.router.navigate(['/user/sessions']);
  }

  formatDateTime(isoString?: string): string {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }
}
