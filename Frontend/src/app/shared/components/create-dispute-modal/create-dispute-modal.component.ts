import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DisputeService } from '../../../core/services/dispute.service';
import { NotificationService } from '../../../core/services/notification.service';
import {
  DisputeReason,
  CreateDisputeDto,
  DisputeDto,
  getDisputeReasonText
} from '../../models/dispute.model';

/**
 * CreateDisputeModalComponent
 *
 * Modal for mentees to create disputes for completed sessions.
 * Validates that description is required when reason is "Other".
 */
@Component({
  selector: 'app-create-dispute-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-dispute-modal.component.html',
  styleUrl: './create-dispute-modal.component.css'
})
export class CreateDisputeModalComponent implements OnChanges {
  @Input({ required: true }) sessionId!: string;
  @Input() sessionPrice: number = 0;
  @Input() isOpen: boolean = false;

  @Output() onClose = new EventEmitter<void>();
  @Output() onDisputeCreated = new EventEmitter<DisputeDto>();

  disputeForm: FormGroup;
  isSubmitting = false;

  readonly reasons = Object.values(DisputeReason);
  readonly getReasonText = getDisputeReasonText;

  constructor(
    private fb: FormBuilder,
    private disputeService: DisputeService,
    private notificationService: NotificationService
  ) {
    this.disputeForm = this.fb.group({
      reason: [DisputeReason.MentorNoShow, Validators.required],
      description: ['', Validators.maxLength(1000)]
    });

    // Add conditional validation for description when reason is "Other"
    this.disputeForm.get('reason')?.valueChanges.subscribe(reason => {
      const descControl = this.disputeForm.get('description');
      if (reason === DisputeReason.Other) {
        descControl?.setValidators([Validators.required, Validators.maxLength(1000)]);
      } else {
        descControl?.setValidators([Validators.maxLength(1000)]);
      }
      descControl?.updateValueAndValidity();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      this.disputeForm.reset({ reason: DisputeReason.MentorNoShow, description: '' });
      this.isSubmitting = false;
    }
  }

  get isOtherReason(): boolean {
    return this.disputeForm.get('reason')?.value === DisputeReason.Other;
  }

  hasError(controlName: string, errorName: string): boolean {
    const control = this.disputeForm.get(controlName);
    return !!(control && control.hasError(errorName) && (control.dirty || control.touched));
  }

  onSubmit(): void {
    if (this.disputeForm.invalid) {
      Object.keys(this.disputeForm.controls).forEach(key => {
        this.disputeForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isSubmitting = true;
    const dto: CreateDisputeDto = {
      reason: this.disputeForm.value.reason,
      description: this.disputeForm.value.description?.trim() || undefined
    };

    this.disputeService.createDispute(this.sessionId, dto).subscribe({
      next: (dispute) => {
        this.notificationService.success('Dispute submitted successfully. Our team will review it shortly.');
        this.onDisputeCreated.emit(dispute);
        this.close();
      },
      error: () => {
        this.isSubmitting = false;
      }
    });
  }

  close(): void {
    if (!this.isSubmitting) {
      this.disputeForm.reset();
      this.onClose.emit();
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }
}
