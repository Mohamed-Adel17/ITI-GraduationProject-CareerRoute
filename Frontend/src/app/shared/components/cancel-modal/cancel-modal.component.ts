import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { SessionService } from '../../../core/services/session.service';
import { NotificationService } from '../../../core/services/notification.service';
import {
  SessionSummary,
  CancelRequest,
  calculateRefundAmount,
  formatSessionDateTime,
  formatSessionPrice
} from '../../models/session.model';

/**
 * CancelModalComponent
 *
 * Modal component for cancelling sessions with refund calculation display.
 * Shows refund policy based on hours until session and requires cancellation reason.
 *
 * Features:
 * - Display session details (mentor/mentee, time, topic)
 * - Calculate and display refund amount based on cancellation policy:
 *   - >48 hours: 100% refund
 *   - 24-48 hours: 50% refund
 *   - <24 hours: 0% refund
 * - Reason textarea (min 10 chars, max 500 chars)
 * - Confirmation checkbox
 * - Submit calls SessionService.cancelSession()
 *
 * @example
 * ```html
 * <app-cancel-modal
 *   [session]="selectedSession"
 *   [isOpen]="showCancelModal"
 *   (onClose)="handleClose()"
 *   (onCancelSuccess)="handleSuccess()">
 * </app-cancel-modal>
 * ```
 */
@Component({
  selector: 'app-cancel-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './cancel-modal.component.html',
  styleUrl: './cancel-modal.component.css'
})
export class CancelModalComponent implements OnChanges {
  /**
   * Session to cancel
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
   * Emitted when cancellation succeeds
   */
  @Output() onCancelSuccess = new EventEmitter<void>();

  cancelForm: FormGroup;
  isSubmitting: boolean = false;

  constructor(
    private fb: FormBuilder,
    private sessionService: SessionService,
    private notificationService: NotificationService
  ) {
    this.cancelForm = this.fb.group({
      reason: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      confirmed: [false, Validators.requiredTrue]
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Reset form when modal opens
    if (changes['isOpen'] && this.isOpen) {
      this.cancelForm.reset();
      this.isSubmitting = false;
    }
  }

  /**
   * Get refund information based on hours until session
   */
  get refundInfo(): { amount: number; percentage: number } {
    const hoursUntil = this.session.hoursUntilSession || 0;
    return calculateRefundAmount(this.session.price, hoursUntil);
  }

  /**
   * Get formatted session date/time
   */
  get formattedDateTime(): string {
    return formatSessionDateTime(this.session.scheduledStartTime);
  }

  /**
   * Get formatted refund amount
   */
  get formattedRefundAmount(): string {
    return formatSessionPrice(this.refundInfo.amount);
  }

  /**
   * Get formatted session price
   */
  get formattedPrice(): string {
    return formatSessionPrice(this.session.price);
  }

  /**
   * Get participant name (mentor for mentee, mentee for mentor)
   */
  get participantName(): string {
    return `${this.session.mentorFirstName} ${this.session.mentorLastName}`;
  }

  /**
   * Get refund policy message
   */
  get refundPolicyMessage(): string {
    const hours = this.session.hoursUntilSession || 0;
    if (hours > 48) {
      return 'You will receive a 100% refund.';
    } else if (hours >= 24) {
      return 'You will receive a 50% refund.';
    } else {
      return 'No refund available for cancellations within 24 hours.';
    }
  }

  /**
   * Get refund policy color class
   */
  get refundPolicyColorClass(): string {
    const hours = this.session.hoursUntilSession || 0;
    if (hours > 48) {
      return 'text-green-600';
    } else if (hours >= 24) {
      return 'text-yellow-600';
    } else {
      return 'text-red-600';
    }
  }

  /**
   * Check if form control has error
   */
  hasError(controlName: string, errorName: string): boolean {
    const control = this.cancelForm.get(controlName);
    return !!(control && control.hasError(errorName) && (control.dirty || control.touched));
  }

  /**
   * Get error message for form control
   */
  getErrorMessage(controlName: string): string {
    const control = this.cancelForm.get(controlName);
    if (!control || !control.errors) return '';

    if (control.hasError('required')) {
      return controlName === 'reason' ? 'Cancellation reason is required' : 'You must confirm cancellation';
    }
    if (control.hasError('minlength')) {
      return 'Reason must be at least 10 characters';
    }
    if (control.hasError('maxlength')) {
      return 'Reason cannot exceed 500 characters';
    }
    return '';
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    if (this.cancelForm.invalid) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.cancelForm.controls).forEach(key => {
        this.cancelForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isSubmitting = true;
    const request: CancelRequest = {
      reason: this.cancelForm.value.reason.trim()
    };

    this.sessionService.cancelSession(this.session.id, request).subscribe({
      next: (response) => {
        this.notificationService.success(
          `Session cancelled successfully. Refund: ${formatSessionPrice(response.refundAmount)} (${response.refundPercentage}%)`,
          'Session Cancelled'
        );
        this.onCancelSuccess.emit();
        this.close();
      },
      error: () => {
        // Error handled by global error interceptor
        this.isSubmitting = false;
      }
    });
  }

  /**
   * Close modal
   */
  close(): void {
    if (!this.isSubmitting) {
      this.cancelForm.reset();
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
