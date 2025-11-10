import { Component, OnInit, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { MentorService } from '../../../core/services/mentor.service';
import { NotificationService } from '../../../core/services/notification.service';
import { 
  Mentor, 
  MentorProfileUpdate, 
  MentorApplication,
  MentorCategory,
  validatePricing 
} from '../../../shared/models/mentor.model';
import { RatingDisplayComponent } from '../../../shared/rating-display/rating-display';

/**
 * MentorProfileFormComponent
 *
 * Form component for creating and editing mentor profiles.
 * Handles mentor-specific fields: bio, expertise, rates, experience, and certifications.
 *
 * Features:
 * - Create new mentor profile (application)
 * - Edit existing mentor profile
 * - Real-time form validation
 * - Pricing validation with business rules
 * - Expertise tags management
 * - Category selection
 * - Rich text bio editor
 * - Responsive design
 * - Accessibility support
 *
 * @remarks
 * - Can be used in both create and edit modes
 * - Validates pricing according to business rules ($20-$500)
 * - Ensures 60-min rate is higher than 30-min rate
 * - Supports comma-separated or array expertise tags
 * - Integrates with MentorService for API calls
 */
@Component({
  selector: 'app-mentor-profile-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RatingDisplayComponent],
  templateUrl: './mentor-profile-form.component.html',
  styleUrls: ['./mentor-profile-form.component.css']
})
export class MentorProfileFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly mentorService = inject(MentorService);
  private readonly notificationService = inject(NotificationService);

  // Input: Existing mentor profile for edit mode
  @Input() mentor: Mentor | null = null;

  // Input: Available categories for selection
  @Input() categories: MentorCategory[] = [];

  // Input: Form mode (create or edit)
  @Input() mode: 'create' | 'edit' = 'create';

  // Output: Form submission event
  @Output() formSubmit = new EventEmitter<MentorProfileUpdate | MentorApplication>();

  // Output: Form cancellation event
  @Output() formCancel = new EventEmitter<void>();

  // Form group
  mentorForm!: FormGroup;

  // Component state
  isSubmitting = false;
  showPricingHelp = false;
  expertiseTagsInput = '';

  // Pricing constraints
  readonly MIN_PRICE = 20;
  readonly MAX_PRICE = 500;
  readonly MIN_BIO_LENGTH = 100;
  readonly MAX_BIO_LENGTH = 2000;
  readonly MIN_EXPERIENCE = 0;
  readonly MAX_EXPERIENCE = 50;

  ngOnInit(): void {
    this.initializeForm();
    if (this.mentor) {
      this.populateForm(this.mentor);
    }
  }

  /**
   * Initialize the reactive form with validators
   */
  private initializeForm(): void {
    this.mentorForm = this.fb.group({
      bio: [
        '',
        [
          Validators.required,
          Validators.minLength(this.MIN_BIO_LENGTH),
          Validators.maxLength(this.MAX_BIO_LENGTH)
        ]
      ],
      expertiseTags: [
        '',
        [Validators.required, this.expertiseTagsValidator.bind(this)]
      ],
      yearsOfExperience: [
        0,
        [
          Validators.required,
          Validators.min(this.MIN_EXPERIENCE),
          Validators.max(this.MAX_EXPERIENCE)
        ]
      ],
      certifications: [''],
      rate30Min: [
        this.MIN_PRICE,
        [
          Validators.required,
          Validators.min(this.MIN_PRICE),
          Validators.max(this.MAX_PRICE)
        ]
      ],
      rate60Min: [
        this.MIN_PRICE * 1.8,
        [
          Validators.required,
          Validators.min(this.MIN_PRICE),
          Validators.max(this.MAX_PRICE)
        ]
      ],
      categoryIds: [[], [Validators.required, Validators.minLength(1)]],
      isAvailable: [true]
    }, {
      validators: [this.pricingValidator.bind(this)]
    });

    // Watch for rate changes to validate pricing
    this.mentorForm.get('rate30Min')?.valueChanges.subscribe(() => {
      this.mentorForm.get('rate60Min')?.updateValueAndValidity({ emitEvent: false });
    });
  }

  /**
   * Populate form with existing mentor data
   */
  private populateForm(mentor: Mentor): void {
    const expertiseTags = Array.isArray(mentor.expertiseTags)
      ? mentor.expertiseTags.join(', ')
      : mentor.expertiseTags;

    this.mentorForm.patchValue({
      bio: mentor.bio,
      expertiseTags: expertiseTags,
      yearsOfExperience: mentor.yearsOfExperience,
      certifications: mentor.certifications || '',
      rate30Min: mentor.rate30Min,
      rate60Min: mentor.rate60Min,
      categoryIds: mentor.categoryIds || [],
      isAvailable: mentor.isAvailable ?? true
    });

    this.expertiseTagsInput = expertiseTags;
  }

  /**
   * Custom validator for expertise tags
   */
  private expertiseTagsValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return { required: true };

    const tags = this.parseExpertiseTags(value);
    
    if (tags.length === 0) {
      return { noTags: true };
    }

    if (tags.length < 2) {
      return { minTags: { required: 2, actual: tags.length } };
    }

    if (tags.length > 20) {
      return { maxTags: { max: 20, actual: tags.length } };
    }

    // Check for empty tags
    if (tags.some(tag => tag.trim().length === 0)) {
      return { emptyTag: true };
    }

    // Check tag length
    const tooLongTags = tags.filter(tag => tag.length > 50);
    if (tooLongTags.length > 0) {
      return { tagTooLong: { max: 50, tags: tooLongTags } };
    }

    return null;
  }

  /**
   * Custom validator for pricing logic
   */
  private pricingValidator(group: AbstractControl): ValidationErrors | null {
    const rate30Min = group.get('rate30Min')?.value;
    const rate60Min = group.get('rate60Min')?.value;

    if (!rate30Min || !rate60Min) return null;

    const validation = validatePricing(rate30Min, rate60Min);
    
    if (!validation.valid) {
      return { pricingInvalid: { errors: validation.errors } };
    }

    return null;
  }

  /**
   * Parse expertise tags from string input
   */
  private parseExpertiseTags(input: string): string[] {
    if (!input) return [];
    return input
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
  }

  /**
   * Get expertise tags as array
   */
  getExpertiseTags(): string[] {
    const value = this.mentorForm.get('expertiseTags')?.value;
    return this.parseExpertiseTags(value);
  }

  /**
   * Toggle category selection
   */
  toggleCategory(categoryId: number): void {
    const categoryIds = this.mentorForm.get('categoryIds')?.value || [];
    const index = categoryIds.indexOf(categoryId);

    if (index > -1) {
      categoryIds.splice(index, 1);
    } else {
      categoryIds.push(categoryId);
    }

    this.mentorForm.patchValue({ categoryIds });
  }

  /**
   * Check if category is selected
   */
  isCategorySelected(categoryId: number): boolean {
    const categoryIds = this.mentorForm.get('categoryIds')?.value || [];
    return categoryIds.includes(categoryId);
  }

  /**
   * Calculate suggested 60-min rate based on 30-min rate
   */
  getSuggestedRate60Min(): number {
    const rate30Min = this.mentorForm.get('rate30Min')?.value || this.MIN_PRICE;
    return Math.round(rate30Min * 1.8);
  }

  /**
   * Apply suggested 60-min rate
   */
  applySuggestedRate(): void {
    const suggested = this.getSuggestedRate60Min();
    this.mentorForm.patchValue({ rate60Min: suggested });
  }

  /**
   * Get character count for bio
   */
  getBioCharCount(): number {
    return this.mentorForm.get('bio')?.value?.length || 0;
  }

  /**
   * Get remaining characters for bio
   */
  getBioRemainingChars(): number {
    return this.MAX_BIO_LENGTH - this.getBioCharCount();
  }

  /**
   * Check if bio is approaching limit
   */
  isBioNearLimit(): boolean {
    return this.getBioRemainingChars() < 100;
  }

  /**
   * Get form control for template access
   */
  getControl(name: string): AbstractControl | null {
    return this.mentorForm.get(name);
  }

  /**
   * Check if field has error
   */
  hasError(fieldName: string, errorType?: string): boolean {
    const control = this.getControl(fieldName);
    if (!control) return false;

    if (errorType) {
      return control.hasError(errorType) && (control.dirty || control.touched);
    }

    return control.invalid && (control.dirty || control.touched);
  }

  /**
   * Get error message for field
   */
  getErrorMessage(fieldName: string): string {
    const control = this.getControl(fieldName);
    if (!control || !control.errors) return '';

    const errors = control.errors;

    // Bio errors
    if (fieldName === 'bio') {
      if (errors['required']) return 'Bio is required';
      if (errors['minlength']) {
        return `Bio must be at least ${this.MIN_BIO_LENGTH} characters (currently ${this.getBioCharCount()})`;
      }
      if (errors['maxlength']) return `Bio cannot exceed ${this.MAX_BIO_LENGTH} characters`;
    }

    // Expertise tags errors
    if (fieldName === 'expertiseTags') {
      if (errors['required']) return 'Expertise tags are required';
      if (errors['noTags']) return 'Please enter at least one expertise tag';
      if (errors['minTags']) return `Please enter at least ${errors['minTags'].required} expertise tags`;
      if (errors['maxTags']) return `Maximum ${errors['maxTags'].max} expertise tags allowed`;
      if (errors['emptyTag']) return 'Tags cannot be empty';
      if (errors['tagTooLong']) return 'Each tag must be 50 characters or less';
    }

    // Experience errors
    if (fieldName === 'yearsOfExperience') {
      if (errors['required']) return 'Years of experience is required';
      if (errors['min']) return `Minimum ${this.MIN_EXPERIENCE} years`;
      if (errors['max']) return `Maximum ${this.MAX_EXPERIENCE} years`;
    }

    // Rate errors
    if (fieldName === 'rate30Min' || fieldName === 'rate60Min') {
      if (errors['required']) return 'Rate is required';
      if (errors['min']) return `Minimum rate is $${this.MIN_PRICE}`;
      if (errors['max']) return `Maximum rate is $${this.MAX_PRICE}`;
    }

    // Category errors
    if (fieldName === 'categoryIds') {
      if (errors['required']) return 'Please select at least one category';
      if (errors['minlength']) return 'Please select at least one category';
    }

    return 'Invalid value';
  }

  /**
   * Get pricing validation errors
   */
  getPricingErrors(): string[] {
    const formErrors = this.mentorForm.errors;
    if (formErrors && formErrors['pricingInvalid']) {
      return formErrors['pricingInvalid'].errors;
    }
    return [];
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    if (this.mentorForm.invalid) {
      this.mentorForm.markAllAsTouched();
      this.notificationService.error('Please fix all validation errors before submitting');
      return;
    }

    this.isSubmitting = true;

    const formValue = this.mentorForm.value;
    const data: MentorProfileUpdate | MentorApplication = {
      bio: formValue.bio,
      expertiseTags: this.parseExpertiseTags(formValue.expertiseTags),
      yearsOfExperience: formValue.yearsOfExperience,
      certifications: formValue.certifications || undefined,
      rate30Min: formValue.rate30Min,
      rate60Min: formValue.rate60Min,
      categoryIds: formValue.categoryIds,
      isAvailable: formValue.isAvailable
    };

    this.formSubmit.emit(data);
  }

  /**
   * Handle form cancellation
   */
  onCancel(): void {
    this.formCancel.emit();
  }

  /**
   * Reset form to initial state
   */
  resetForm(): void {
    this.mentorForm.reset({
      bio: '',
      expertiseTags: '',
      yearsOfExperience: 0,
      certifications: '',
      rate30Min: this.MIN_PRICE,
      rate60Min: this.MIN_PRICE * 1.8,
      categoryIds: [],
      isAvailable: true
    });
    this.isSubmitting = false;
  }

  /**
   * Set submitting state (called by parent component)
   */
  setSubmitting(submitting: boolean): void {
    this.isSubmitting = submitting;
  }

  rating: number = 4.5;          
  totalReviews: number = 20;     
}

