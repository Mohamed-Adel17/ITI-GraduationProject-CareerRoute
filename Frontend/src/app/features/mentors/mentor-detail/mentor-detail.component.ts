import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { MentorService } from '../../../core/services/mentor.service';
import { TimeslotService } from '../../../core/services/timeslot.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { SessionService } from '../../../core/services/session.service';
import { RatingDisplay } from '../../../shared/components/rating-display/rating-display';
import { BookingCalendarModalComponent } from './booking-calendar-modal/booking-calendar-modal.component';
import { StripePaymentComponent } from '../../payment/stripe-payment/stripe-payment.component';
import { PaymobCardPaymentComponent } from '../../payment/paymob-card-payment/paymob-card-payment.component';
import { PaymobWalletPaymentComponent } from '../../payment/paymob-wallet-payment/paymob-wallet-payment.component';
import { PaymentMethodSelectionComponent } from './payment-method-selection/payment-method-selection.component';
import { PaymentProvider, PaymobPaymentMethod } from '../../../shared/models/payment.model';
import { PaymentMethodSelection } from '../../../shared/models/payment-flow.model';
import { MentorReviewsSectionComponent } from './mentor-reviews-section/mentor-reviews-section';
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
  imports: [CommonModule, RouterLink, ReactiveFormsModule, RatingDisplay, BookingCalendarModalComponent, StripePaymentComponent, PaymobCardPaymentComponent, PaymobWalletPaymentComponent, MentorReviewsSectionComponent],
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

  // Calendar modal state
  showCalendarModal: boolean = false;

  // Payment processing state
  showPaymentModal: boolean = false;
  currentSession: any = null;
  selectedPaymentMethod: PaymentMethodSelection | null = null;

  // Expose enums to template
  readonly PaymentProvider = PaymentProvider;
  readonly PaymobPaymentMethod = PaymobPaymentMethod;

  // User role state for booking permissions
  canBook: boolean = false;
  isLoggedIn: boolean = false;

  private subscription?: Subscription;
  private slotsSubscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private formBuilder: FormBuilder,
    private mentorService: MentorService,
    private timeslotService: TimeslotService,
    private notificationService: NotificationService,
    private authService: AuthService,
    private sessionService: SessionService
  ) {
    this.initializeBookingForm();
    this.checkBookingPermissions();
  }

  /**
   * Check if the current user can book sessions
   * Only mentees (users who are not mentors and not admins) can book
   */
  private checkBookingPermissions(): void {
    this.isLoggedIn = this.authService.isAuthenticated();

    if (this.isLoggedIn) {
      const isMentor = this.authService.isMentor();
      const isAdmin = this.authService.isAdmin();

      // User can book only if they are NOT a mentor AND NOT an admin
      this.canBook = !isMentor && !isAdmin;
    } else {
      // Not logged in users cannot book
      this.canBook = false;
    }
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
  // CALENDAR MODAL METHODS
  // ==========================================================================

  /**
   * Open the calendar modal for booking
   * Only allows mentees (non-mentor, non-admin users) to book
   */
  openCalendarModal(): void {
    // Check if user is logged in
    if (!this.isLoggedIn) {
      this.notificationService.warning(
        'Please log in to book a session',
        'Login Required'
      );
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: this.router.url }
      });
      return;
    }

    // Check if user can book (is a mentee)
    if (!this.canBook) {
      if (this.authService.isAdmin()) {
        this.notificationService.info(
          'Administrators cannot book mentorship sessions',
          'Booking Restricted'
        );
      } else if (this.authService.isMentor()) {
        this.notificationService.info(
          'Mentors cannot book sessions. Please use a mentee account to book.',
          'Booking Restricted'
        );
      }
      return;
    }

    this.showCalendarModal = true;
  }

  /**
   * Close the calendar modal
   */
  closeCalendarModal(): void {
    this.showCalendarModal = false;
  }

  /**
   * Handle booking confirmation from calendar modal
   * Receives session details and selected payment method
   */
  handleBookingConfirm(data: { session: any; paymentMethod: PaymentMethodSelection }): void {
    if (!this.mentor) return;

    // Double-check booking permissions
    if (!this.canBook) {
      this.notificationService.error(
        'You do not have permission to book sessions',
        'Booking Denied'
      );
      this.showCalendarModal = false;
      return;
    }

    // console.log('Booking confirmed:', data);
    // console.log('Session:', data.session);
    // console.log('Payment method:', data.paymentMethod);

    // Close calendar modal
    this.showCalendarModal = false;

    // Store session and payment method
    this.currentSession = data.session;
    this.selectedPaymentMethod = data.paymentMethod;

    // Show payment modal based on provider
    if (data.paymentMethod.provider === PaymentProvider.Stripe) {
      this.showPaymentModal = true;
    } else if (data.paymentMethod.provider === PaymentProvider.Paymob) {
      this.showPaymentModal = true;
    }
  }

  /**
   * Handle successful payment
   */
  handlePaymentSuccess(response: any): void {
    // console.log('Payment successful:', response);
    this.showPaymentModal = false;
    // Navigate to session details or sessions list
    this.router.navigate(['/user/sessions']);
  }

  /**
   * Handle payment failure
   */
  handlePaymentFailure(error: string): void {
    console.error('Payment failed:', error);
    this.notificationService.error(
      error || 'Payment failed. Please try again.',
      'Payment Failed'
    );
    if (this.mentor) {
      this.loadAvailableSlots(this.mentor.id);
    }
  }

  /**
   * Handle payment cancellation
   */
  handlePaymentCancel(): void {
    this.showPaymentModal = false;
    this.notificationService.info(
      'Payment cancelled. Your session is still pending payment.',
      'Payment Cancelled',
      5000,
      'user/sessions'
    );
    if (this.mentor) {
      this.loadAvailableSlots(this.mentor.id);
    }
  }

  // ==========================================================================
  // TEST BOOKING (Demo purposes)
  // ==========================================================================

  isBookingTest: boolean = false;
  showTestBookingForm: boolean = false;
  showTestPaymentMethodSelection: boolean = false;
  testBookingTopic: string = '';
  testBookingNotes: string = '';

  /**
   * Open test booking form (step 1)
   */
  bookTestSession(): void {
    if (!this.mentor || !this.canBook) return;

    if (!this.authService.getCurrentUser()?.id) {
      this.notificationService.warning('Please log in to book a session', 'Login Required');
      return;
    }

    this.testBookingTopic = '';
    this.testBookingNotes = '';
    this.showTestBookingForm = true;
  }

  /**
   * Submit test booking form and create session (step 2)
   */
  submitTestBooking(): void {
    if (!this.mentor) return;

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser?.id) return;

    this.isBookingTest = true;
    this.showTestBookingForm = false;

    this.sessionService.seedTestSession(
      this.mentor.id,
      currentUser.id,
      5,
      60,
      this.testBookingTopic || undefined,
      this.testBookingNotes || undefined
    ).subscribe({
      next: (response) => {
        this.isBookingTest = false;
        this.currentSession = {
          id: response.sessionId,
          price: response.price,
          mentorFirstName: this.mentor?.firstName,
          mentorLastName: this.mentor?.lastName,
          topic: this.testBookingTopic || undefined,
          notes: this.testBookingNotes || undefined
        };
        this.showTestPaymentMethodSelection = true;
      },
      error: (err) => {
        this.isBookingTest = false;
        console.error('Test booking failed:', err);
      }
    });
  }

  /**
   * Close test booking form
   */
  closeTestBookingForm(): void {
    this.showTestBookingForm = false;
  }

  /**
   * Handle payment method selection for test booking
   */
  onTestPaymentMethodSelected(selection: PaymentMethodSelection): void {
    this.showTestPaymentMethodSelection = false;
    this.selectedPaymentMethod = selection;
    this.showPaymentModal = true;
  }

  /**
   * Close test payment method selection modal
   */
  closeTestPaymentMethodSelection(): void {
    this.showTestPaymentMethodSelection = false;
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

    // Check booking permissions
    if (!this.canBook) {
      this.notificationService.error(
        'You do not have permission to book sessions',
        'Booking Denied'
      );
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

    this.sessionService.bookSession(request).subscribe({
      next: (response) => {
        this.submittingBooking = false;
        // this.notificationService.success(
        //   'Session booked successfully! Please proceed to payment to confirm your booking.',
        //   'Booking Created'
        // );
        // Navigate to payment page with sessionId
        // TODO: Update route when payment page is implemented
        this.router.navigate(['/user/sessions'], {
          queryParams: { sessionId: response.id, action: 'payment' }
        });
      },
      error: (err) => {
        this.submittingBooking = false;
        // Error is handled by errorInterceptor, but we can add specific handling here
        console.error('Error booking session:', err);
      }
    });
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
