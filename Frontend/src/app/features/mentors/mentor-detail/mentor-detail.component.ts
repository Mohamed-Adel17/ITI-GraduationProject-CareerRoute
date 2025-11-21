import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { MentorService } from '../../../core/services/mentor.service';
import { TimeslotService } from '../../../core/services/timeslot.service';
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
import {
  AvailableSlot,
  AvailableSlotsResponse,
  formatSlotTime,
  formatSlotDuration,
  groupSlotsByDate,
  formatSlotDate,
  TIMESLOT_ERROR_MESSAGES
} from '../../../shared/models/timeslot.model';
import { BookSessionRequest, BookingRules } from '../../../shared/models/booking.model';

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
  imports: [CommonModule, RouterLink, ReactiveFormsModule, RatingDisplay],
  templateUrl: './mentor-detail.component.html',
  styleUrls: ['./mentor-detail.component.css']
})
export class MentorDetailComponent implements OnInit, OnDestroy {
  mentor: MentorDetail | null = null;
  loading: boolean = true;
  notFound: boolean = false;
  error: string | null = null;

  // Timeslot booking properties
  availableSlots: AvailableSlot[] = [];
  groupedSlots: Map<string, AvailableSlot[]> = new Map();
  loadingSlots: boolean = false;
  slotsError: string | null = null;
  selectedSlot: AvailableSlot | null = null;
  bookingForm!: FormGroup;
  submittingBooking: boolean = false;

  private subscription?: Subscription;
  private slotsSubscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private formBuilder: FormBuilder,
    private mentorService: MentorService,
    private timeslotService: TimeslotService,
    private notificationService: NotificationService
  ) {
    this.initializeBookingForm();
  }

  ngOnInit(): void {
    // Get mentor ID from route params
    const mentorId = this.route.snapshot.paramMap.get('id');

    if (!mentorId) {
      this.notFound = true;
      this.loading = false;
      return;
    }

    this.loadMentorProfile(mentorId);
    this.loadAvailableSlots(mentorId);
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    if (this.slotsSubscription) {
      this.slotsSubscription.unsubscribe();
    }
  }

  /**
   * Initialize booking form with validators
   */
  private initializeBookingForm(): void {
    this.bookingForm = this.formBuilder.group({
      topic: ['', [Validators.maxLength(BookingRules.TOPIC_MAX_LENGTH)]],
      notes: ['', [Validators.maxLength(BookingRules.NOTES_MAX_LENGTH)]]
    });
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

  // ==========================================================================
  // TIMESLOT BOOKING METHODS
  // ==========================================================================

  /**
   * Load available time slots for the mentor
   */
  private loadAvailableSlots(mentorId: string): void {
    this.loadingSlots = true;
    this.slotsError = null;

    this.slotsSubscription = this.timeslotService.getAvailableSlots(mentorId).subscribe({
      next: (response) => {
        this.availableSlots = response.data.availableSlots;
        this.groupedSlots = groupSlotsByDate(this.availableSlots);
        this.loadingSlots = false;
      },
      error: (err) => {
        this.loadingSlots = false;
        if (err.status === 404) {
          // No slots available - this is not an error, just empty state
          this.availableSlots = [];
          this.groupedSlots = new Map();
        } else {
          this.slotsError = TIMESLOT_ERROR_MESSAGES.NETWORK_ERROR;
          console.error('Error loading available slots:', err);
        }
      }
    });
  }

  /**
   * Select a time slot for booking
   */
  selectSlot(slot: AvailableSlot): void {
    this.selectedSlot = slot;
    // Reset form when selecting a new slot
    this.bookingForm.reset();
  }

  /**
   * Cancel slot selection and hide booking form
   */
  cancelSelection(): void {
    this.selectedSlot = null;
    this.bookingForm.reset();
  }

  /**
   * Confirm booking and create session
   */
  confirmBooking(): void {
    if (!this.selectedSlot || !this.mentor) {
      return;
    }

    if (this.bookingForm.invalid) {
      this.notificationService.error('Please check your form for errors', 'Validation Error');
      return;
    }

    const request: BookSessionRequest = {
      timeSlotId: this.selectedSlot.id,
      topic: this.bookingForm.value.topic?.trim() || undefined,
      notes: this.bookingForm.value.notes?.trim() || undefined
    };

    this.submittingBooking = true;

    // TODO: Replace with actual SessionService when implemented
    // For now, we'll simulate the booking flow
    // this.sessionService.bookSession(request).subscribe({ ... });

    // Temporary: Navigate to user area (will be replaced with actual booking API call)
    setTimeout(() => {
      this.submittingBooking = false;
      this.notificationService.success(
        'Session booked successfully! Redirecting to payment...',
        'Booking Confirmed'
      );
      // In real implementation, navigate to payment with sessionId
      // this.router.navigate(['/user/payment'], { queryParams: { sessionId: response.data.id }});
      this.router.navigate(['/user/sessions']); // Temporary
    }, 1000);
  }

  /**
   * Retry loading slots after error
   */
  retryLoadSlots(): void {
    const mentorId = this.route.snapshot.paramMap.get('id');
    if (mentorId) {
      this.loadAvailableSlots(mentorId);
    }
  }

  /**
   * Format slot time using helper function
   */
  formatTime(slot: AvailableSlot): string {
    return formatSlotTime(slot);
  }

  /**
   * Format slot duration using helper function
   */
  formatDuration(minutes: number): string {
    return formatSlotDuration(minutes);
  }

  /**
   * Format date for slot group headers
   */
  formatDate(dateString: string): string {
    return formatSlotDate(dateString);
  }

  /**
   * Check if there are any available slots
   */
  hasAvailableSlots(): boolean {
    return this.availableSlots.length > 0;
  }

  /**
   * Get array of grouped slots for template iteration
   * (Angular's keyvalue pipe requires array conversion for Map)
   */
  getGroupedSlotsArray(): Array<{ key: string; value: AvailableSlot[] }> {
    return Array.from(this.groupedSlots.entries()).map(([key, value]) => ({ key, value }));
  }

  /**
   * Check if booking form topic field has error
   */
  hasTopicError(): boolean {
    const topicControl = this.bookingForm.get('topic');
    return !!(topicControl?.invalid && topicControl?.touched);
  }

  /**
   * Check if booking form notes field has error
   */
  hasNotesError(): boolean {
    const notesControl = this.bookingForm.get('notes');
    return !!(notesControl?.invalid && notesControl?.touched);
  }

  /**
   * Get topic character count for display
   */
  getTopicCharCount(): number {
    return this.bookingForm.get('topic')?.value?.length || 0;
  }

  /**
   * Get notes character count for display
   */
  getNotesCharCount(): number {
    return this.bookingForm.get('notes')?.value?.length || 0;
  }
}
