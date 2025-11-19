import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MentorService } from '../../../core/services/mentor.service';
import { NotificationService } from '../../../core/services/notification.service';
import { MentorListItem, RejectMentorRequest } from '../../../shared/models/mentor.model';
import { MentorApplicationCardComponent } from '../components/mentor-application-card/mentor-application-card.component';
import { RejectMentorDialogComponent } from '../components/reject-mentor-dialog/reject-mentor-dialog.component';

/**
 * MentorApprovalsComponent
 *
 * Admin dashboard component for reviewing and managing pending mentor applications.
 *
 * Features:
 * - Fetches and displays all pending mentor applications
 * - Displays applications in a responsive card grid layout
 * - Allows admins to approve applications (single-click action)
 * - Allows admins to reject applications (with reason via modal)
 * - Shows loading state while fetching data
 * - Shows empty state when no pending applications
 * - Automatically refreshes list after approve/reject actions
 * - Removes approved/rejected applications from list immediately
 *
 * Route: /admin/mentor-approvals
 * Guard: Protected by adminRoleGuard (Admin role required)
 *
 * @remarks
 * - Uses MentorService.getPendingMentorApplications() to fetch data
 * - Uses MentorService.approveMentorApplication() for approvals
 * - Uses MentorService.rejectMentorApplication() for rejections
 * - Error handling delegated to errorInterceptor
 * - Success/error notifications via NotificationService
 *
 * @example
 * ```typescript
 * // Route configuration in admin.routes.ts:
 * {
 *   path: 'mentor-approvals',
 *   component: MentorApprovalsComponent,
 *   title: 'Mentor Approvals - Admin'
 * }
 * ```
 */
@Component({
  selector: 'app-mentor-approvals',
  standalone: true,
  imports: [
    CommonModule,
    MentorApplicationCardComponent,
    RejectMentorDialogComponent
  ],
  templateUrl: './mentor-approvals.component.html',
  styleUrl: './mentor-approvals.component.css'
})
export class MentorApprovalsComponent implements OnInit {
  // Services
  private readonly mentorService = inject(MentorService);
  private readonly notificationService = inject(NotificationService);

  // Component state
  applications: MentorListItem[] = [];
  loading = false;

  // Rejection dialog state
  showRejectDialog = false;
  selectedMentorId: string | null = null;
  selectedMentorName: string | null = null;

  ngOnInit(): void {
    this.loadPendingApplications();
  }

  /**
   * Fetch pending mentor applications from API
   *
   * Sets loading state, fetches data, handles success/error
   */
  private loadPendingApplications(): void {
    this.loading = true;

    this.mentorService.getPendingMentorApplications().subscribe({
      next: (applications) => {
        this.applications = applications;
        this.loading = false;
        console.log(`📋 Loaded ${applications.length} pending applications`);
      },
      error: (error) => {
        this.loading = false;
        // Error notification handled by errorInterceptor
        console.error('❌ Error loading pending applications:', error);
      }
    });
  }

  /**
   * Handle approve action from card component
   *
   * Single-click approval without confirmation dialog
   * Removes application from list immediately after success
   *
   * @param mentorId - ID of mentor to approve
   */
  onApprove(mentorId: string): void {
    const mentor = this.applications.find(app => app.id === mentorId);
    const mentorName = mentor?.fullName || 'Mentor';

    this.mentorService.approveMentorApplication(mentorId).subscribe({
      next: () => {
        // Show success notification
        this.notificationService.success(
          `${mentorName}'s application has been approved!`,
          'Mentor Approved'
        );

        // Remove from list immediately
        this.applications = this.applications.filter(app => app.id !== mentorId);

        console.log(`✅ Approved mentor: ${mentorName} (${mentorId})`);
      },
      error: (error) => {
        // Error notification handled by errorInterceptor
        console.error('❌ Error approving mentor:', error);
      }
    });
  }

  /**
   * Handle reject action from card component
   *
   * Opens rejection dialog to collect reason
   *
   * @param mentorId - ID of mentor to reject
   */
  onReject(mentorId: string): void {
    const mentor = this.applications.find(app => app.id === mentorId);

    this.selectedMentorId = mentorId;
    this.selectedMentorName = mentor?.fullName || 'Mentor';
    this.showRejectDialog = true;
  }

  /**
   * Handle rejection confirmation from dialog
   *
   * Submits rejection with reason to API
   * Removes application from list immediately after success
   *
   * @param reason - Rejection reason from dialog
   */
  onRejectConfirm(reason: string): void {
    if (!this.selectedMentorId) {
      return;
    }

    const request: RejectMentorRequest = { reason };
    const mentorName = this.selectedMentorName || 'Mentor';

    this.mentorService.rejectMentorApplication(this.selectedMentorId, request).subscribe({
      next: () => {
        // Show success notification
        this.notificationService.success(
          `${mentorName}'s application has been rejected`,
          'Application Rejected'
        );

        // Remove from list immediately
        this.applications = this.applications.filter(
          app => app.id !== this.selectedMentorId
        );

        console.log(`❌ Rejected mentor: ${mentorName} (${this.selectedMentorId})`);
        console.log(`📝 Reason: ${reason}`);

        // Close dialog and reset state
        this.closeRejectDialog();
      },
      error: (error) => {
        // Error notification handled by errorInterceptor
        console.error('❌ Error rejecting mentor:', error);

        // Close dialog even on error
        this.closeRejectDialog();
      }
    });
  }

  /**
   * Handle rejection dialog cancellation
   *
   * Closes dialog and resets selection state
   */
  onRejectCancel(): void {
    this.closeRejectDialog();
  }

  /**
   * Close rejection dialog and reset selection state
   */
  private closeRejectDialog(): void {
    this.showRejectDialog = false;
    this.selectedMentorId = null;
    this.selectedMentorName = null;
  }

  /**
   * Refresh the pending applications list
   *
   * Manually triggers data reload (useful after actions)
   */
  refreshList(): void {
    this.loadPendingApplications();
  }

  /**
   * TrackBy function for ngFor performance optimization
   *
   * @param index - Array index
   * @param item - Mentor application item
   * @returns Unique identifier for the item
   */
  trackByMentorId(index: number, item: MentorListItem): string {
    return item.id;
  }
}
