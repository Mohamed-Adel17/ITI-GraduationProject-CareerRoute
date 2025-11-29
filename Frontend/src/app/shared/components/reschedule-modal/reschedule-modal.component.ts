import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { SessionService } from '../../../core/services/session.service';
import { NotificationService } from '../../../core/services/notification.service';
import { TimeslotService } from '../../../core/services/timeslot.service';
import {
  SessionSummary,
  RescheduleRequest,
  formatSessionDateTime,
  validateRescheduleRequest
} from '../../models/session.model';
import { AvailableSlot, formatSlotDate, formatSlotTime } from '../../models/timeslot.model';

/**
 * RescheduleModalComponent
 *
 * Modal component for requesting session reschedule.
 * Allows users to select a new date/time and provide a reason for rescheduling.
 *
 * Features:
 * - Date/time picker for new session time
 * - Validation: Must be >24 hours in future
 * - Reason textarea (min 10 chars, max 500 chars)
 * - Display original session time
 * - Submit calls SessionService.rescheduleSession()
 *
 * @example
 * ```html
 * <app-reschedule-modal
 *   [session]="selectedSession"
 *   [isOpen]="showRescheduleModal"
 *   (onClose)="handleClose()"
 *   (onRescheduleSuccess)="handleSuccess()">
 * </app-reschedule-modal>
 * ```
 */
@Component({
  selector: 'app-reschedule-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reschedule-modal.component.html',
  styleUrl: './reschedule-modal.component.css'
})
export class RescheduleModalComponent implements OnChanges {
  /**
   * Session to reschedule
   */
  @Input({ required: true }) session!: SessionSummary;

  /**
   * Modal visibility
   */
  @Input() isOpen: boolean = false;

  /**
   * User role - determines if slot picker (mentee) or datetime picker (mentor) is shown
   */
  @Input() userRole: 'mentee' | 'mentor' = 'mentee';

  /**
   * Emitted when modal should close
   */
  @Output() onClose = new EventEmitter<void>();

  /**
   * Emitted when reschedule request succeeds
   */
  @Output() onRescheduleSuccess = new EventEmitter<void>();

  rescheduleForm: FormGroup;
  isSubmitting: boolean = false;
  minDateTime: string = '';

  // Slot picker for mentee
  availableSlots: AvailableSlot[] = [];
  isLoadingSlots: boolean = false;
  selectedSlot: AvailableSlot | null = null;

  constructor(
    private fb: FormBuilder,
    private sessionService: SessionService,
    private notificationService: NotificationService,
    private timeslotService: TimeslotService
  ) {
    this.rescheduleForm = this.fb.group({
      newScheduledStartTime: ['', [Validators.required, this.futureTimeValidator.bind(this)]],
      reason: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]]
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Reset form and set minimum date/time when modal opens
    if (changes['isOpen'] && this.isOpen) {
      this.setMinDateTime();
      this.rescheduleForm.reset();
      this.isSubmitting = false;
      this.selectedSlot = null;

      // Load available slots for mentee
      if (this.userRole === 'mentee' && this.session?.mentorId) {
        this.loadAvailableSlots();
      }
    }
  }

  /**
   * Set minimum allowed date/time (24 hours from now)
   */
  private setMinDateTime(): void {
    const now = new Date();
    const minDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
    this.minDateTime = this.formatDateTimeLocal(minDate);
  }

  /**
   * Load available slots for the mentor (mentee mode only)
   */
  private loadAvailableSlots(): void {
    this.isLoadingSlots = true;
    this.timeslotService.getAvailableSlots(this.session.mentorId).subscribe({
      next: (response) => {
        this.availableSlots = response.data.availableSlots;
        this.isLoadingSlots = false;
      },
      error: () => {
        this.availableSlots = [];
        this.isLoadingSlots = false;
      }
    });
  }

  /**
   * Select a slot (mentee mode)
   */
  selectSlot(slot: AvailableSlot): void {
    this.selectedSlot = slot;
  }

  /**
   * Format slot for display
   */
  formatSlotDisplay(slot: AvailableSlot): string {
    return `${formatSlotDate(slot.startDateTime)} - ${formatSlotTime(slot)} (${slot.durationMinutes} min)`;
  }

  /**
   * Format date for datetime-local input
   */
  private formatDateTimeLocal(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  /**
   * Custom validator for future time (must be >24h from now)
   */
  private futureTimeValidator(control: any): { [key: string]: any } | null {
    if (!control.value) return null;

    const selectedTime = new Date(control.value);
    const now = new Date();
    const hoursUntil = (selectedTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntil < 24) {
      return { 'futureTime': 'New time must be at least 24 hours in the future' };
    }

    return null;
  }

  /**
   * Get formatted original session date/time
   */
  get originalDateTime(): string {
    return formatSessionDateTime(this.session.scheduledStartTime);
  }

  /**
   * Get participant name (mentor for mentee, mentee for mentor)
   */
  get participantName(): string {
    return `${this.session.mentorFirstName} ${this.session.mentorLastName}`;
  }

  /**
   * Check if form can be submitted
   */
  get canSubmit(): boolean {
    const reasonValid = this.rescheduleForm.get('reason')?.valid;
    if (this.userRole === 'mentee') {
      return !!this.selectedSlot && !!reasonValid;
    }
    return this.rescheduleForm.valid;
  }

  /**
   * Check if form control has error
   */
  hasError(controlName: string, errorName: string): boolean {
    const control = this.rescheduleForm.get(controlName);
    return !!(control && control.hasError(errorName) && (control.dirty || control.touched));
  }

  /**
   * Get error message for form control
   */
  getErrorMessage(controlName: string): string {
    const control = this.rescheduleForm.get(controlName);
    if (!control || !control.errors) return '';

    if (control.hasError('required')) {
      return controlName === 'newScheduledStartTime' ? 'New date and time is required' : 'Reason is required';
    }
    if (control.hasError('minlength')) {
      return 'Reason must be at least 10 characters';
    }
    if (control.hasError('maxlength')) {
      return 'Reason cannot exceed 500 characters';
    }
    if (control.hasError('futureTime')) {
      return control.errors['futureTime'];
    }
    return '';
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    // For mentee: require slot selection
    if (this.userRole === 'mentee') {
      if (!this.selectedSlot) {
        this.notificationService.error('Please select an available time slot', 'Slot Required');
        return;
      }
      const reason = this.rescheduleForm.get('reason')?.value?.trim();
      if (!reason || reason.length < 10) {
        this.rescheduleForm.get('reason')?.markAsTouched();
        return;
      }

      this.isSubmitting = true;
      this.rescheduleForm.disable();
      const request: RescheduleRequest = {
        newScheduledStartTime: this.selectedSlot.startDateTime,
        reason: reason,
        slotId: this.selectedSlot.id
      };

      this.submitReschedule(request);
      return;
    }

    // For mentor: use datetime picker
    if (this.rescheduleForm.invalid) {
      Object.keys(this.rescheduleForm.controls).forEach(key => {
        this.rescheduleForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isSubmitting = true;
    this.rescheduleForm.disable();
    const formValue = this.rescheduleForm.getRawValue();
    const newTime = new Date(formValue.newScheduledStartTime);
    const request: RescheduleRequest = {
      newScheduledStartTime: newTime.toISOString(),
      reason: formValue.reason.trim()
    };

    this.submitReschedule(request);
  }

  private submitReschedule(request: RescheduleRequest): void {
    const waitingFor = this.userRole === 'mentee' ? 'mentor' : 'mentee';
    this.sessionService.rescheduleSession(this.session.id, request).subscribe({
      next: () => {
        this.notificationService.success(
          `Reschedule request submitted successfully. Waiting for ${waitingFor} approval.`,
          'Request Sent'
        );
        this.onRescheduleSuccess.emit();
        this.close();
      },
      error: () => {
        this.isSubmitting = false;
        this.rescheduleForm.enable();
      }
    });
  }

  /**
   * Close modal
   */
  close(): void {
    if (!this.isSubmitting) {
      this.rescheduleForm.reset();
      this.onClose.emit();
    }
  }

  /**
   * Handle backdrop click
   */
  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  /**
   * Handle escape key
   */
  onEscapeKey(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.close();
    }
  }
}
