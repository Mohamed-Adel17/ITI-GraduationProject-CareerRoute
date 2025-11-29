import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { SessionService } from '../../../core/services/session.service';
import { NotificationService } from '../../../core/services/notification.service';
import {
  SessionSummary,
  RescheduleRequest,
  formatSessionDateTime,
  validateRescheduleRequest
} from '../../models/session.model';

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

  constructor(
    private fb: FormBuilder,
    private sessionService: SessionService,
    private notificationService: NotificationService
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
    if (this.rescheduleForm.invalid) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.rescheduleForm.controls).forEach(key => {
        this.rescheduleForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isSubmitting = true;
    this.rescheduleForm.disable();
    const formValue = this.rescheduleForm.getRawValue();
    
    // Convert local datetime to ISO 8601 UTC
    const newTime = new Date(formValue.newScheduledStartTime);
    const request: RescheduleRequest = {
      newScheduledStartTime: newTime.toISOString(),
      reason: formValue.reason.trim()
    };

    this.sessionService.rescheduleSession(this.session.id, request).subscribe({
      next: (response) => {
        this.notificationService.success(
          'Reschedule request submitted successfully. Waiting for mentor approval.',
          'Request Sent'
        );
        this.onRescheduleSuccess.emit();
        this.close();
      },
      error: () => {
        // Error handled by global error interceptor
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
