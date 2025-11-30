import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MentorService } from '../../../core/services/mentor.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { Mentor, MentorApprovalStatus } from '../../../shared/models/mentor.model';

/**
 * ApplicationPendingComponent
 *
 * Displays pending mentor application status for users who have submitted
 * their mentor application but are waiting for admin approval.
 *
 * Features:
 * - Fetches mentor profile via GET /api/mentors/me
 * - Displays application submitted date
 * - Shows current approval status (Pending/Rejected)
 * - Displays mentor profile summary (bio, expertise, rates)
 * - Shows next steps and estimated review timeline
 * - Link to edit application (prepopulated form)
 * - Link to dashboard
 * - Handles rejected applications with reason display
 * - Responsive design with Tailwind CSS
 * - Dark mode support
 *
 * Guard: pendingMentorGuard (allows both pending and approved mentors)
 * Route: /mentor/application-pending
 *
 * @example
 * ```html
 * <app-application-pending></app-application-pending>
 * ```
 */
@Component({
  selector: 'app-application-pending',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './application-pending.component.html',
  styleUrls: ['./application-pending.css']
})
export class ApplicationPendingComponent implements OnInit {
  /** Loading state during API call */
  loading = true;

  /** Mentor profile data */
  mentorProfile: Mentor | null = null;

  /** Error message if fetch fails */
  errorMessage: string | null = null;

  /** Approval status enum for template access */
  MentorApprovalStatus = MentorApprovalStatus;

  constructor(
    private mentorService: MentorService,
    private notificationService: NotificationService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadMentorProfile();
  }


  /**
   * Fetch mentor's own profile from API
   */
  private loadMentorProfile(): void {
    // console.log('Loading mentor profile...');
    this.loading = true;
    this.errorMessage = null;

    this.mentorService.getCurrentMentorProfile().subscribe({
      next: (mentor) => {
        // console.log('Mentor profile loaded:', mentor);
        // console.log('Approval status:', mentor.approvalStatus);
        // console.log('Is Pending?', mentor.approvalStatus === MentorApprovalStatus.Pending);
        // console.log('Is Approved?', mentor.approvalStatus === MentorApprovalStatus.Approved);
        // console.log('Is Rejected?', mentor.approvalStatus === MentorApprovalStatus.Rejected);
        // console.log('MentorApprovalStatus enum:', MentorApprovalStatus);

        this.mentorProfile = mentor;
        this.loading = false;

        // If mentor is approved, refresh token to get Mentor role, then redirect
        if (mentor.approvalStatus === MentorApprovalStatus.Approved) {
          this.notificationService.success(
            'Your application has been approved!',
            'Congratulations!'
          );
          this.authService.refreshToken().subscribe({
            next: () => this.router.navigate(['/mentor/profile']),
            error: () => this.router.navigate(['/mentor/profile'])
          });
        }
      },
      error: (error) => {
        console.error('Failed to load mentor profile:', error);
        this.errorMessage = error.message || 'Failed to load application status. Please try again.';
        this.loading = false;

        // If no mentor profile found, redirect to application form
        if (error.status === 404) {
          this.notificationService.warning(
            'Please complete your mentor application first.',
            'Application Required'
          );
          this.router.navigate(['/user/apply-mentor']);
        }
      }
    });
  }

  /**
   * Navigate to edit application form
   */
  editApplication(): void {
    this.router.navigate(['/user/apply-mentor']);
  }

  /**
   * Navigate to user dashboard
   */
  goToDashboard(): void {
    this.router.navigate(['/']);
  }

  /**
   * Get formatted submission date
   */
  getFormattedDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Get days since submission
   */
  getDaysSinceSubmission(): number {
    if (!this.mentorProfile) return 0;

    const submissionDate = new Date(this.mentorProfile.createdAt);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - submissionDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  }
}
