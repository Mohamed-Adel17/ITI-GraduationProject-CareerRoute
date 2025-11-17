import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { MentorService } from '../../../core/services/mentor.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import {
  Mentor,
  getMentorFullName,
  formatRating,
  formatSessionCount,
  getPriceRange,
  getExpertiseTagsString,
  isApproved,
  isPendingApproval,
  isRejected,
  getApprovalStatusColor,
  getApprovalStatusText
} from '../../../shared/models/mentor.model';
import { getUserInitials } from '../../../shared/models/user.model';

/**
 * MentorProfileComponent
 *
 * @description
 * Displays the authenticated mentor's profile information in read-only mode.
 * Provides a link to edit the profile.
 *
 * Features:
 * - Display mentor personal and professional information
 * - Show profile picture or initials fallback
 * - Display expertise tags as Skill tags (from Skills system)
 * - Display categories/specializations
 * - Show pricing information (30-min and 60-min rates)
 * - Display ratings, reviews, and session statistics
 * - Show approval status (Pending, Approved, Rejected)
 * - Show availability status
 * - Link to edit profile page
 * - Loading state while fetching data
 * - Error handling with user feedback
 *
 * @remarks
 * - Uses GET /api/mentors/me endpoint via MentorService
 * - Works for pending mentors (before admin approval)
 * - Does NOT require Mentor role
 * - expertiseTags are Skill objects with full category information
 * - Timestamps are ISO 8601 strings from API
 * - Based on Mentor-Endpoints.md contract (Endpoint #7)
 *
 * @example
 * Route: /mentor/profile
 */
@Component({
  selector: 'app-mentor-profile',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './mentor-profile.component.html',
  styleUrls: ['./mentor-profile.component.css']
})
export class MentorProfileComponent implements OnInit, OnDestroy {
  mentor: Mentor | null = null;
  loading: boolean = true;
  error: string | null = null;

  private subscription?: Subscription;

  constructor(
    private mentorService: MentorService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadMentorProfile();
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  /**
   * Load the current mentor's profile from the API
   *
   * @remarks
   * Uses GET /api/mentors/me endpoint via MentorService.getCurrentMentorProfile()
   * This endpoint extracts user ID from JWT token on backend
   * Works for pending mentors (before approval)
   */
  private loadMentorProfile(): void {
    this.loading = true;
    this.error = null;

    this.subscription = this.mentorService.getCurrentMentorProfile().subscribe({
      next: (mentor) => {
        this.mentor = mentor;
        this.loading = false;

        // Defensive check: If mentor is pending, redirect to application-pending page
        // The guard should already handle this, but this is an extra safety measure
        if (this.isPendingApproval()) {
          console.warn('Mentor profile is pending approval - redirecting to application-pending page');
          this.router.navigate(['/mentor/application-pending']);
        } else if (this.isRejected()) {
          console.warn('Mentor profile was rejected - redirecting to application-pending page');
          this.router.navigate(['/mentor/application-pending']);
        }
      },
      error: (err) => {
        this.error = 'Failed to load mentor profile';
        this.loading = false;

        // If 404 Not Found, redirect to application form
        if (err.status === 404) {
          // Set localStorage flag to allow access to application form
          localStorage.setItem('pendingMentorApplication', 'true');
          this.notificationService.warning(
            'Please complete your mentor application first.',
            'Application Required'
          );
          this.router.navigate(['/user/apply-mentor']);
        } else {
          this.notificationService.error('Could not load your mentor profile. Please try again.', 'Error');
        }

        console.error('Error loading mentor profile:', err);
      }
    });
  }

  /**
   * Get mentor's full name for display
   */
  getMentorFullName(): string {
    return this.mentor ? getMentorFullName(this.mentor) : '';
  }

  /**
   * Get mentor's initials for avatar fallback
   */
  getMentorInitials(): string {
    if (!this.mentor) return '??';
    return getUserInitials({
      firstName: this.mentor.firstName,
      lastName: this.mentor.lastName
    } as any);
  }

  /**
   * Check if mentor has a profile picture
   */
  hasProfilePicture(): boolean {
    return !!this.mentor?.profilePictureUrl;
  }

  /**
   * Get formatted rating display
   */
  getFormattedRating(): string {
    if (!this.mentor) return 'No ratings yet';
    return formatRating(this.mentor);
  }

  /**
   * Get formatted session count
   */
  getFormattedSessionCount(): string {
    if (!this.mentor) return '0 sessions completed';
    return formatSessionCount(this.mentor.totalSessionsCompleted);
  }

  /**
   * Get price range display
   */
  getPriceRangeDisplay(): string {
    if (!this.mentor) return 'N/A';
    return getPriceRange(this.mentor);
  }

  /**
   * Get expertise tags as comma-separated string
   */
  getExpertiseTagsDisplay(): string {
    if (!this.mentor) return '';
    return getExpertiseTagsString(this.mentor);
  }

  /**
   * Check if mentor has expertise tags
   */
  hasExpertiseTags(): boolean {
    return !!this.mentor?.expertiseTags && this.mentor.expertiseTags.length > 0;
  }

  /**
   * Check if mentor has categories
   */
  hasCategories(): boolean {
    return !!this.mentor?.categories && this.mentor.categories.length > 0;
  }

  /**
   * Check if mentor has certifications
   */
  hasCertifications(): boolean {
    return !!this.mentor?.certifications && this.mentor.certifications.trim().length > 0;
  }

  /**
   * Check if mentor has bio
   */
  hasBio(): boolean {
    return !!this.mentor?.bio && this.mentor.bio.trim().length > 0;
  }

  /**
   * Check if mentor is approved
   */
  isApproved(): boolean {
    return this.mentor ? isApproved(this.mentor) : false;
  }

  /**
   * Check if mentor is pending approval
   */
  isPendingApproval(): boolean {
    return this.mentor ? isPendingApproval(this.mentor) : false;
  }

  /**
   * Check if mentor is rejected
   */
  isRejected(): boolean {
    return this.mentor ? isRejected(this.mentor) : false;
  }

  /**
   * Get approval status color for badge
   */
  getApprovalStatusColor(): string {
    if (!this.mentor) return 'secondary';
    return getApprovalStatusColor(this.mentor.approvalStatus);
  }

  /**
   * Get approval status text
   */
  getApprovalStatusText(): string {
    if (!this.mentor) return 'Unknown';
    return getApprovalStatusText(this.mentor.approvalStatus);
  }

  /**
   * Reload profile data
   */
  refreshProfile(): void {
    this.loadMentorProfile();
  }
}
