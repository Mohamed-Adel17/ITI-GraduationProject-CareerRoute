import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { MentorService } from '../../../core/services/mentor.service';
import { NotificationService } from '../../../core/services/notification.service';
import { RatingDisplay } from '../../../shared/components/rating-display/rating-display';
import {
  MentorDetail,
  getMentorFullName,
  getExpertiseTags,
  formatPrice,
  getPriceRange,
  formatSessionCount
} from '../../../shared/models/mentor.model';

/**
 * MentorDetailComponent
 *
 * @description
 * Full mentor profile page displaying comprehensive mentor information
 * including bio, expertise, reviews, pricing, and availability.
 *
 * Features:
 * - Get mentor ID from route params
 * - Display full mentor profile with all details
 * - Show professional background, bio, and education/certifications
 * - Display expertise tags/badges
 * - Show reviews preview with rating-display component
 * - Display availability calendar/times preview
 * - "Book Session" button (links to booking flow)
 * - Back button to navigate to previous page
 * - Loading state while fetching data
 * - 404 error handling if mentor not found
 * - Responsive design with Tailwind CSS
 *
 * @remarks
 * - Uses GET /api/mentors/{id} endpoint via MentorService
 * - Public route (no authentication required)
 * - Only approved mentors are returned by the API
 * - Reviews are limited to 5 most recent
 * - Availability preview shows next 7 days
 * - Based on Mentor-Endpoints.md contract
 *
 * @example
 * Route: /mentors/:id
 */
@Component({
  selector: 'app-mentor-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, RatingDisplay],
  templateUrl: './mentor-detail.component.html',
  styleUrls: ['./mentor-detail.component.css']
})
export class MentorDetailComponent implements OnInit, OnDestroy {
  mentor: MentorDetail | null = null;
  loading: boolean = true;
  notFound: boolean = false;
  error: string | null = null;

  private subscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private mentorService: MentorService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    // Get mentor ID from route params
    const mentorId = this.route.snapshot.paramMap.get('id');

    if (!mentorId) {
      this.notFound = true;
      this.loading = false;
      return;
    }

    this.loadMentorProfile(mentorId);
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  /**
   * Load mentor profile from API
   *
   * @param mentorId - The mentor ID from route params
   *
   * @remarks
   * Uses GET /api/mentors/{id} endpoint
   * Returns 404 if mentor not found or not approved
   */
  private loadMentorProfile(mentorId: string): void {
    this.loading = true;
    this.error = null;
    this.notFound = false;

    this.subscription = this.mentorService.getMentorById(mentorId).subscribe({
      next: (mentor) => {
        this.mentor = mentor;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;

        // Handle 404 specifically
        if (err.status === 404) {
          this.notFound = true;
        } else {
          this.error = 'Failed to load mentor profile';
          this.notificationService.error('Could not load mentor profile. Please try again.', 'Error');
        }

        console.error('Error loading mentor profile:', err);
      }
    });
  }

  /**
   * Navigate back to previous page or mentors list
   */
  goBack(): void {
    // Use browser history if available, otherwise go to mentors list
    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.router.navigate(['/mentors']);
    }
  }

  /**
   * Navigate to booking page for this mentor
   */
  bookSession(): void {
    if (this.mentor) {
      this.router.navigate(['/user/booking'], {
        queryParams: { mentorId: this.mentor.id }
      });
    }
  }

  /**
   * Get mentor's full name
   */
  getMentorName(): string {
    return this.mentor ? getMentorFullName(this.mentor) : '';
  }

  /**
   * Get expertise tags as string array
   */
  getExpertiseTags(): string[] {
    return this.mentor ? getExpertiseTags(this.mentor) : [];
  }

  /**
   * Get formatted price range
   */
  getPriceRange(): string {
    return this.mentor ? getPriceRange(this.mentor) : '';
  }

  /**
   * Get formatted 30-min rate
   */
  getRate30Min(): string {
    return this.mentor ? formatPrice(this.mentor.rate30Min) : '';
  }

  /**
   * Get formatted 60-min rate
   */
  getRate60Min(): string {
    return this.mentor ? formatPrice(this.mentor.rate60Min) : '';
  }

  /**
   * Get formatted session count
   */
  getSessionCount(): string {
    return this.mentor ? formatSessionCount(this.mentor.totalSessionsCompleted) : '';
  }

  /**
   * Check if mentor has reviews
   */
  hasReviews(): boolean {
    return !!this.mentor?.recentReviews && this.mentor.recentReviews.length > 0;
  }

  /**
   * Check if mentor has availability
   */
  hasAvailability(): boolean {
    return !!this.mentor?.availabilityPreview?.hasAvailability;
  }

  /**
   * Get next available slot formatted
   */
  getNextAvailableSlot(): string {
    if (!this.mentor?.availabilityPreview?.nextAvailableSlot) {
      return 'Not available';
    }

    const date = new Date(this.mentor.availabilityPreview.nextAvailableSlot);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  /**
   * Get total slots in next 7 days
   */
  getTotalSlotsNext7Days(): number {
    return this.mentor?.availabilityPreview?.totalSlotsNext7Days || 0;
  }

  /**
   * Format review date
   */
  formatReviewDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Get reviewer display name (first name + last initial)
   */
  getReviewerName(firstName: string, lastNameInitial: string): string {
    return `${firstName} ${lastNameInitial}`;
  }

  /**
   * Check if mentor has certifications
   */
  hasCertifications(): boolean {
    return !!this.mentor?.certifications && this.mentor.certifications.trim().length > 0;
  }

  /**
   * Check if mentor has categories
   */
  hasCategories(): boolean {
    return !!this.mentor?.categories && this.mentor.categories.length > 0;
  }

  /**
   * Check if mentor is verified
   */
  isVerified(): boolean {
    return !!this.mentor?.isVerified;
  }

  /**
   * Get completion rate as percentage string
   */
  getCompletionRate(): string {
    if (!this.mentor?.completionRate) return 'N/A';
    return `${this.mentor.completionRate.toFixed(0)}%`;
  }

  /**
   * Get response time display
   */
  getResponseTime(): string {
    return this.mentor?.responseTime || 'Not specified';
  }
}
