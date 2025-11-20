import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

/**
 * RejectMentorDialogComponent
 *
 * Modal dialog for collecting rejection reason when admin rejects a mentor application.
 *
 * Features:
 * - Full-screen modal overlay with centered dialog
 * - Reactive form with validation
 * - Rejection reason textarea (required, 10-500 chars)
 * - Real-time character counter
 * - Validation error messages
 * - Confirm button disabled until form is valid
 * - Backdrop click closes dialog (cancels action)
 * - Escape key closes dialog
 * - Focus management
 *
 * @remarks
 * - Child component of MentorApprovalsComponent
 * - Emits events to parent for confirm/cancel actions
 * - Does not handle API calls directly
 * - Uses Tailwind CSS for all styling
 * - Form resets when dialog opens/closes
 *
 * @example
 * ```html
 * <app-reject-mentor-dialog
 *   *ngIf="showDialog"
 *   [visible]="showDialog"
 *   [mentorName]="selectedMentorName"
 *   (confirm)="onRejectConfirm($event)"
 *   (cancel)="onRejectCancel()">
 * </app-reject-mentor-dialog>
 * ```
 */
@Component({
  selector: 'app-reject-mentor-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reject-mentor-dialog.component.html',
  styleUrl: './reject-mentor-dialog.component.css'
})
export class RejectMentorDialogComponent implements OnInit, OnChanges {
  /**
   * Controls dialog visibility
   */
  @Input({ required: true }) visible = false;

  /**
   * Mentor name to display in dialog
   */
  @Input({ required: true }) mentorName = '';

  /**
   * Emits rejection reason when confirmed
   */
  @Output() confirm = new EventEmitter<string>();

  /**
   * Emits when dialog is cancelled
   */
  @Output() cancel = new EventEmitter<void>();

  /**
   * Reactive form for rejection reason
   */
  rejectForm!: FormGroup;

  /**
   * Minimum reason length
   */
  readonly MIN_REASON_LENGTH = 10;

  /**
   * Maximum reason length
   */
  readonly MAX_REASON_LENGTH = 500;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Reset form when dialog opens
    if (changes['visible'] && changes['visible'].currentValue === true) {
      this.resetForm();
    }
  }

  /**
   * Initialize reactive form with validation
   */
  private initializeForm(): void {
    this.rejectForm = this.fb.group({
      reason: [
        '',
        [
          Validators.required,
          Validators.minLength(this.MIN_REASON_LENGTH),
          Validators.maxLength(this.MAX_REASON_LENGTH)
        ]
      ]
    });
  }

  /**
   * Reset form to initial state
   */
  private resetForm(): void {
    if (this.rejectForm) {
      this.rejectForm.reset();
    }
  }

  /**
   * Handle confirm button click
   *
   * Emits confirm event with reason if form is valid
   */
  onConfirm(): void {
    if (this.rejectForm.valid) {
      const reason = this.rejectForm.value.reason.trim();
      this.confirm.emit(reason);
    }
  }

  /**
   * Handle cancel button click
   *
   * Emits cancel event and resets form
   */
  onCancel(): void {
    this.cancel.emit();
    this.resetForm();
  }

  /**
   * Handle backdrop click (click outside dialog)
   *
   * Closes dialog like cancel
   */
  onBackdropClick(event: MouseEvent): void {
    // Only close if clicking the backdrop itself, not its children
    if (event.target === event.currentTarget) {
      this.onCancel();
    }
  }

  /**
   * Handle Escape key press
   *
   * Closes dialog like cancel
   */
  onEscapeKey(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.onCancel();
    }
  }

  /**
   * Get current character count
   *
   * @returns Number of characters in reason field
   */
  get characterCount(): number {
    const reason = this.rejectForm.get('reason')?.value || '';
    return reason.length;
  }

  /**
   * Check if reason field has error and is touched/dirty
   *
   * @returns True if field should show error
   */
  get showReasonError(): boolean {
    const reasonControl = this.rejectForm.get('reason');
    return !!(reasonControl?.invalid && (reasonControl?.touched || reasonControl?.dirty));
  }

  /**
   * Check if reason is required error
   *
   * @returns True if required error
   */
  get hasRequiredError(): boolean {
    return this.rejectForm.get('reason')?.hasError('required') ?? false;
  }

  /**
   * Check if reason is too short
   *
   * @returns True if minlength error
   */
  get hasMinLengthError(): boolean {
    return this.rejectForm.get('reason')?.hasError('minlength') ?? false;
  }

  /**
   * Check if reason is too long
   *
   * @returns True if maxlength error
   */
  get hasMaxLengthError(): boolean {
    return this.rejectForm.get('reason')?.hasError('maxlength') ?? false;
  }
}
