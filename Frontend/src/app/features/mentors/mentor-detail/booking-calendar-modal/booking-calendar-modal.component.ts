import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  AvailableSlot,
  formatSlotTime,
  formatSlotDuration,
  formatSlotDate
} from '../../../../shared/models/timeslot.model';
import { BookingRules } from '../../../../shared/models/booking.model';
import { SessionService } from '../../../../core/services/session.service';
import { BookSessionRequest, BookSessionResponse } from '../../../../shared/models/session.model';
import { PaymentMethodSelectionComponent } from '../payment-method-selection/payment-method-selection.component';
import { PaymentMethodSelection } from '../../../../shared/models/payment-flow.model';

/**
 * Interface for a single day in the week view calendar
 */
interface WeekDay {
  date: Date;
  dayName: string;
  dayNumber: number;
  monthName: string;
  isToday: boolean;
  isPast: boolean;
  slots: AvailableSlot[];
}

/**
 * Interface for storing booking intent before session creation
 * This allows deferring session creation until payment method is selected
 */
interface BookingIntent {
  slot: AvailableSlot;
  topic?: string;
  notes?: string;
}

/**
 * BookingCalendarModalComponent
 *
 * @description
 * Full-width modal with a week view calendar for selecting time slots.
 * Displays available slots for a mentor with week navigation,
 * and includes the booking form for completing the booking.
 *
 * Features:
 * - Week view calendar (7 days at a time)
 * - Week navigation (previous/next week buttons)
 * - Today indicator with visual highlight
 * - Full slot details (time, duration, price)
 * - Integrated booking form with topic and notes fields
 * - Responsive design with dark mode support
 *
 * @remarks
 * This component is used within the MentorDetailComponent to provide
 * a better UX for selecting time slots compared to the grid layout.
 */
@Component({
  selector: 'app-booking-calendar-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PaymentMethodSelectionComponent],
  templateUrl: './booking-calendar-modal.component.html',
  styleUrls: ['./booking-calendar-modal.component.css']
})
export class BookingCalendarModalComponent implements OnInit, OnChanges {
  /**
   * All available slots for the mentor
   */
  @Input() availableSlots: AvailableSlot[] = [];

  /**
   * Whether the modal is visible
   */
  @Input() isOpen: boolean = false;

  /**
   * Mentor name for display in the modal header
   */
  @Input() mentorName: string = '';

  /**
   * Event emitted when modal should be closed
   */
  @Output() closeModal = new EventEmitter<void>();

  /**
   * Event emitted when booking is confirmed and payment method selected
   * Emits session details and payment method selection
   */
  @Output() bookingConfirmed = new EventEmitter<{
    session: BookSessionResponse;
    paymentMethod: PaymentMethodSelection;
  }>();

  // Services
  private readonly sessionService = inject(SessionService);
  private readonly formBuilder = inject(FormBuilder);

  // Week view state
  currentWeekStart: Date = new Date();
  weekDays: WeekDay[] = [];
  selectedDayIndex: number = 0;

  // Selection and form state
  selectedSlot: AvailableSlot | null = null;
  bookingForm!: FormGroup;
  showBookingForm: boolean = false;

  // Session creation state
  createdSession: BookSessionResponse | null = null;
  isSubmitting: boolean = false;
  submissionError: string | null = null;

  // Payment method selection state
  showPaymentMethodSelection: boolean = false;

  // Deferred booking state - stores intent before session creation
  // Session is only created after payment method is selected
  bookingIntent: BookingIntent | null = null;
  pendingPaymentMethod: PaymentMethodSelection | null = null;
  isCreatingSession: boolean = false;
  sessionCreationError: string | null = null;

  // Booking rules for validation
  readonly BookingRules = BookingRules;

  constructor() {
    this.initializeBookingForm();
  }

  /**
   * Normalizes a datetime string to ensure it's treated as UTC
   * Backend sometimes returns datetime without 'Z' suffix
   */
  private normalizeUtcDateTime(dateTimeString: string): string {
    if (dateTimeString.endsWith('Z') || dateTimeString.includes('+') || dateTimeString.match(/.*-\d{2}:\d{2}$/)) {
      return dateTimeString;
    }
    return dateTimeString + 'Z';
  }

  ngOnInit(): void {
    this.initializeWeek();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['availableSlots'] && this.availableSlots) {
      this.generateWeekView();
      this.autoSelectDay();
    }
    if (changes['isOpen'] && this.isOpen) {
      // Reset state when modal opens
      this.selectedSlot = null;
      this.showBookingForm = false;
      this.bookingForm.reset();
      this.initializeWeek();
      this.autoSelectDay();
    }
  }

  /**
   * Auto-select today or first day with slots
   */
  private autoSelectDay(): void {
    // Try to select today first
    const todayIndex = this.weekDays.findIndex(d => d.isToday);
    if (todayIndex >= 0 && this.weekDays[todayIndex].slots.length > 0) {
      this.selectedDayIndex = todayIndex;
      return;
    }
    // Otherwise select first day with slots
    const firstWithSlots = this.weekDays.findIndex(d => d.slots.length > 0);
    this.selectedDayIndex = firstWithSlots >= 0 ? firstWithSlots : 0;
  }

  /**
   * Initialize the booking form with validators
   */
  private initializeBookingForm(): void {
    this.bookingForm = this.formBuilder.group({
      topic: ['', [Validators.maxLength(BookingRules.TOPIC_MAX_LENGTH)]],
      notes: ['', [Validators.maxLength(BookingRules.NOTES_MAX_LENGTH)]]
    });
  }

  /**
   * Initialize the week view starting from the current week
   */
  private initializeWeek(): void {
    const today = new Date();
    // Set to start of current week (Sunday)
    const dayOfWeek = today.getDay();
    this.currentWeekStart = new Date(today);
    this.currentWeekStart.setDate(today.getDate() - dayOfWeek);
    this.currentWeekStart.setHours(0, 0, 0, 0);
    this.generateWeekView();
  }

  /**
   * Generate the week view with 7 days
   */
  generateWeekView(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    this.weekDays = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(this.currentWeekStart);
      date.setDate(this.currentWeekStart.getDate() + i);

      // Filter slots for this day
      const daySlots = this.availableSlots.filter(slot => {
        const slotDate = new Date(this.normalizeUtcDateTime(slot.startDateTime));
        return slotDate.toDateString() === date.toDateString();
      }).sort((a, b) => {
        return new Date(this.normalizeUtcDateTime(a.startDateTime)).getTime() - new Date(this.normalizeUtcDateTime(b.startDateTime)).getTime();
      });

      this.weekDays.push({
        date,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: date.getDate(),
        monthName: date.toLocaleDateString('en-US', { month: 'short' }),
        isToday: date.toDateString() === today.toDateString(),
        isPast: date < today,
        slots: daySlots
      });
    }
  }

  /**
   * Navigate to the previous week
   */
  previousWeek(): void {
    this.currentWeekStart.setDate(this.currentWeekStart.getDate() - 7);
    this.generateWeekView();
  }

  /**
   * Navigate to the next week
   */
  nextWeek(): void {
    this.currentWeekStart.setDate(this.currentWeekStart.getDate() + 7);
    this.generateWeekView();
  }

  /**
   * Navigate to the current week
   */
  goToToday(): void {
    this.initializeWeek();
  }

  /**
   * Get formatted week range for display (e.g., "Nov 18 - Nov 24, 2024")
   */
  getWeekRange(): string {
    const endDate = new Date(this.currentWeekStart);
    endDate.setDate(this.currentWeekStart.getDate() + 6);

    const startMonth = this.currentWeekStart.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' });
    const year = endDate.getFullYear();

    if (startMonth === endMonth) {
      return `${startMonth} ${this.currentWeekStart.getDate()} - ${endDate.getDate()}, ${year}`;
    } else {
      return `${startMonth} ${this.currentWeekStart.getDate()} - ${endMonth} ${endDate.getDate()}, ${year}`;
    }
  }

  /**
   * Check if the current week contains today
   */
  isCurrentWeek(): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekEnd = new Date(this.currentWeekStart);
    weekEnd.setDate(this.currentWeekStart.getDate() + 6);
    return today >= this.currentWeekStart && today <= weekEnd;
  }

  /**
   * Check if we can navigate to previous week
   * (Prevent navigating to past weeks before today)
   */
  canGoPrevious(): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.currentWeekStart > today;
  }

  /**
   * Select a time slot
   */
  selectSlot(slot: AvailableSlot): void {
    this.selectedSlot = slot;
    this.showBookingForm = true;
  }

  /**
   * Select a day to view its slots
   */
  selectDay(index: number): void {
    this.selectedDayIndex = index;
  }

  /**
   * Get the currently selected day
   */
  get selectedDay(): WeekDay | null {
    return this.weekDays[this.selectedDayIndex] || null;
  }

  /**
   * Cancel slot selection and go back to calendar view
   */
  cancelSelection(): void {
    this.selectedSlot = null;
    this.showBookingForm = false;
    this.bookingForm.reset();
  }

  /**
   * Submit the booking - stores booking intent and shows payment method selection
   * Session is NOT created here - it's deferred until payment method is selected
   * This prevents orphan sessions when users close the modal without selecting payment
   */
  submitBooking(): void {
    if (!this.selectedSlot) return;

    if (this.bookingForm.invalid) {
      return;
    }

    // Store booking intent instead of creating session
    this.bookingIntent = {
      slot: this.selectedSlot,
      topic: this.bookingForm.value.topic?.trim() || undefined,
      notes: this.bookingForm.value.notes?.trim() || undefined
    };

    // Clear any previous errors
    this.sessionCreationError = null;

    // Show payment method selection modal
    this.showPaymentMethodSelection = true;
  }

  /**
   * Handle payment method selection - NOW creates the session
   * Session creation is deferred until this point to prevent orphan sessions
   */
  onPaymentMethodSelected(paymentMethod: PaymentMethodSelection): void {
    if (!this.bookingIntent) return;

    // Store the selected payment method
    this.pendingPaymentMethod = paymentMethod;

    // Now create the session
    this.createSessionAndProceed();
  }

  /**
   * Create session via API and proceed to payment
   * Called only after payment method is selected
   */
  private createSessionAndProceed(): void {
    if (!this.bookingIntent || !this.pendingPaymentMethod) return;

    this.isCreatingSession = true;
    this.sessionCreationError = null;

    const request: BookSessionRequest = {
      timeSlotId: this.bookingIntent.slot.id,
      topic: this.bookingIntent.topic,
      notes: this.bookingIntent.notes
    };

    this.sessionService.bookSession(request).subscribe({
      next: (session) => {
        // console.log('Session created:', session);
        this.createdSession = session;
        this.isCreatingSession = false;

        // Emit booking confirmed event with session and payment method
        this.bookingConfirmed.emit({
          session: session,
          paymentMethod: this.pendingPaymentMethod!
        });

        // Close both modals
        this.showPaymentMethodSelection = false;
        this.onClose();
      },
      error: (error) => {
        console.error('Session creation failed:', error);
        this.isCreatingSession = false;
        this.sessionCreationError = error?.error?.message || 'Failed to create session. Please try again.';
      }
    });
  }

  /**
   * Retry session creation after an error
   */
  retrySessionCreation(): void {
    this.createSessionAndProceed();
  }

  /**
   * Close payment method selection modal and return to booking form
   * Preserves booking intent so user can go back and modify or try again
   */
  closePaymentMethodSelection(): void {
    this.showPaymentMethodSelection = false;
    // Clear pending payment method but keep booking intent
    this.pendingPaymentMethod = null;
    this.sessionCreationError = null;
    this.isCreatingSession = false;
    // User returns to booking form with their data preserved
    // bookingIntent and form values are kept intact
  }

  /**
   * Close the modal and reset all booking state
   * Ensures no orphan data is left when modal is closed
   */
  onClose(): void {
    // Reset all booking state
    this.selectedSlot = null;
    this.showBookingForm = false;
    this.bookingForm.reset();
    
    // Reset deferred booking state
    this.bookingIntent = null;
    this.pendingPaymentMethod = null;
    this.isCreatingSession = false;
    this.sessionCreationError = null;
    
    // Reset session state
    this.createdSession = null;
    this.isSubmitting = false;
    this.submissionError = null;
    
    // Reset payment method selection
    this.showPaymentMethodSelection = false;
    
    // Emit close event
    this.closeModal.emit();
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
   * Format date for display
   */
  formatDate(dateString: string): string {
    return formatSlotDate(dateString);
  }

  /**
   * Get only the start time (e.g., "10:00 AM")
   */
  getStartTime(slot: AvailableSlot): string {
    const date = new Date(this.normalizeUtcDateTime(slot.startDateTime));
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  /**
   * Check if a slot is currently selected
   */
  isSlotSelected(slot: AvailableSlot): boolean {
    return this.selectedSlot?.id === slot.id;
  }

  /**
   * Get total available slots count
   */
  getTotalSlotsCount(): number {
    return this.availableSlots.length;
  }

  /**
   * Get slots count for current week
   */
  getWeekSlotsCount(): number {
    return this.weekDays.reduce((total, day) => total + day.slots.length, 0);
  }

  /**
   * Check if booking form has topic error
   */
  hasTopicError(): boolean {
    const topicControl = this.bookingForm.get('topic');
    return !!(topicControl?.invalid && topicControl?.touched);
  }

  /**
   * Check if booking form has notes error
   */
  hasNotesError(): boolean {
    const notesControl = this.bookingForm.get('notes');
    return !!(notesControl?.invalid && notesControl?.touched);
  }

  /**
   * Get topic character count
   */
  getTopicCharCount(): number {
    return this.bookingForm.get('topic')?.value?.length || 0;
  }

  /**
   * Get notes character count
   */
  getNotesCharCount(): number {
    return this.bookingForm.get('notes')?.value?.length || 0;
  }
}
