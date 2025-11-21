import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CreateTimeSlot, TIMESLOT_RULES } from '../../../../shared/models/timeslot.model';

@Component({
  selector: 'app-create-slot-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-slot-dialog.html',
  styleUrl: './create-slot-dialog.css'
})
export class CreateSlotDialogComponent {
  @Output() closeDialog = new EventEmitter<void>();
  @Output() createSlot = new EventEmitter<CreateTimeSlot>();

  slotForm: FormGroup;
  submitting: boolean = false;
  minDateTime: string;

  constructor(private formBuilder: FormBuilder) {
    // Set minimum date/time to 24 hours from now
    const minDate = new Date();
    minDate.setHours(minDate.getHours() + TIMESLOT_RULES.MIN_ADVANCE_HOURS);
    this.minDateTime = this.formatDateTimeLocal(minDate);

    this.slotForm = this.formBuilder.group({
      startDateTime: ['', Validators.required],
      durationMinutes: [60, Validators.required]
    });
  }

  onSubmit(): void {
    if (this.slotForm.invalid) {
      return;
    }

    const formValue = this.slotForm.value;
    const slot: CreateTimeSlot = {
      startDateTime: new Date(formValue.startDateTime).toISOString(),
      durationMinutes: parseInt(formValue.durationMinutes)
    };

    this.createSlot.emit(slot);
  }

  onCancel(): void {
    this.closeDialog.emit();
  }

  private formatDateTimeLocal(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }
}
