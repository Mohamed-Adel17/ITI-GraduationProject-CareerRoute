import { Component, OnInit, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors, FormsModule } from '@angular/forms';
import { MentorService } from '../../../core/services/mentor.service';
import { NotificationService } from '../../../core/services/notification.service';
import {
  Mentor,
  MentorProfileUpdate,
  MentorApplication,
  CreatePreviousWork,
  validatePricing
} from '../../../shared/models/mentor.model';
import { Skill } from '../../../shared/models/skill.model';
import { Category } from '../../../shared/models/category.model';

/**
 * MentorProfileFormComponent
 *
 * Form component for creating and editing mentor profiles.
 * Handles mentor-specific fields: bio, rates, experience, certifications, expertise tags, and categories.
 *
 * Features:
 * - Create new mentor profile (application) with expertise tags and categories
 * - Edit existing mentor profile with expertise tags
 * - Real-time form validation
 * - Pricing validation with business rules (min 0, max 10000)
 * - Multi-select expertise tags (Skill selection) - available in both modes
 * - Multi-select categories - available in both modes
 * - Responsive design
 * - Accessibility support
 *
 * @remarks
 * - Can be used in both create and edit modes
 * - According to updated API contract:
 *   - CREATE mode: Requires expertiseTagIds and categoryIds (array of IDs)
 *   - EDIT mode: Supports expertiseTagIds (array of skill IDs)
 * - Validates pricing: rate60Min must be higher than rate30Min
 * - Bio: min 50 chars, max 1000 chars
 * - Expertise tags: At least one required
 * - Categories: At least one required
 * - Integrates with MentorService for API calls
 */
@Component({
  selector: 'app-mentor-profile-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './mentor-profile-form.component.html',
  styleUrls: ['./mentor-profile-form.component.css']
})
export class MentorProfileFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly mentorService = inject(MentorService);
  private readonly notificationService = inject(NotificationService);

  // Input: Existing mentor profile for edit mode
  @Input() mentor: Mentor | null = null;

  // Input: Available skills for expertise tags selection (required in both modes)
  @Input() skills: Skill[] = [];

  // Input: Available categories for category selection (required in both modes)
  @Input() categories: Category[] = [];

  // Input: Form mode (create or edit)
  @Input() mode: 'create' | 'edit' = 'create';

  // Input: Submitting state (controlled by parent)
  @Input() isSubmitting = false;

  // Output: Form submission event
  @Output() formSubmit = new EventEmitter<MentorProfileUpdate | MentorApplication>();

  // Output: Form cancellation event
  @Output() formCancel = new EventEmitter<void>();

  // Form group
  mentorForm!: FormGroup;

  // Component state
  showPricingHelp = false;
  selectedCv: File | null = null;

  // Previous work state
  previousWorks: CreatePreviousWork[] = [];
  showAddWorkForm = false;
  newWork: CreatePreviousWork = { companyName: '', jobTitle: '', startDate: '' };

  // Pricing constraints (from API contract)
  readonly MIN_PRICE = 50; // Minimum session rate
  readonly MAX_PRICE = 10000;
  readonly MIN_BIO_LENGTH = 50; // API: min 50, max 1000
  readonly MAX_BIO_LENGTH = 1000;
  readonly MIN_EXPERIENCE = 1;
  readonly MAX_EXPERIENCE = 60;

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
    const formConfig: any = {
      headline: ['', [Validators.maxLength(150)]],
      bio: [
        '',
        [
          Validators.required,
          Validators.minLength(this.MIN_BIO_LENGTH),
          Validators.maxLength(this.MAX_BIO_LENGTH)
        ]
      ],
      linkedInUrl: ['', [this.linkedInValidator]],
      gitHubUrl: ['', [this.gitHubValidator]],
      websiteUrl: ['', [Validators.pattern(/^https?:\/\/.+/)]],
      expertiseTagIds: [
        [],
        [Validators.required] // Required in both create and edit modes
      ],
      yearsOfExperience: [
        1,
        [
          Validators.required,
          Validators.min(this.MIN_EXPERIENCE),
          Validators.max(this.MAX_EXPERIENCE)
        ]
      ],
      certifications: [''],
      rate30Min: [
        50, // Default suggested rate
        [
          Validators.required,
          Validators.min(this.MIN_PRICE),
          Validators.max(this.MAX_PRICE)
        ]
      ],
      rate60Min: [
        90, // Default suggested rate (1.8x of 50)
        [
          Validators.required,
          Validators.min(this.MIN_PRICE),
          Validators.max(this.MAX_PRICE)
        ]
      ],
      categoryIds: [
        [],
        [Validators.required] // Required in both create and edit modes
      ]
    };

    this.mentorForm = this.fb.group(formConfig, {
      validators: [this.pricingValidator.bind(this)]
    });

    // Watch for rate changes to validate pricing
    this.mentorForm.get('rate30Min')?.valueChanges.subscribe(() => {
      this.mentorForm.get('rate60Min')?.updateValueAndValidity({ emitEvent: false });
    });
  }

  /**
   * Populate form with existing mentor data (edit mode only)
   */
  private populateForm(mentor: Mentor): void {
    const formData: any = {
      headline: mentor.headline || '',
      bio: mentor.bio,
      linkedInUrl: mentor.linkedInUrl || '',
      gitHubUrl: mentor.gitHubUrl || '',
      websiteUrl: mentor.websiteUrl || '',
      expertiseTagIds: mentor.expertiseTags ? mentor.expertiseTags.map(skill => skill.id) : [],
      yearsOfExperience: mentor.yearsOfExperience,
      certifications: mentor.certifications || '',
      rate30Min: mentor.rate30Min,
      rate60Min: mentor.rate60Min,
      categoryIds: mentor.categories ? mentor.categories.map(cat => cat.id) : []
    };

    this.mentorForm.patchValue(formData);
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
   * Custom validator for LinkedIn URL
   */
  private linkedInValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    
    const url = control.value.toLowerCase();
    if (!url.includes('linkedin.com')) {
      return { invalidLinkedIn: { message: 'Must be a valid LinkedIn URL (linkedin.com)' } };
    }
    
    if (!url.match(/^https?:\/\//)) {
      return { invalidUrl: { message: 'URL must start with http:// or https://' } };
    }
    
    return null;
  }

  /**
   * Custom validator for GitHub URL
   */
  private gitHubValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    
    const url = control.value.toLowerCase();
    if (!url.includes('github.com')) {
      return { invalidGitHub: { message: 'Must be a valid GitHub URL (github.com)' } };
    }
    
    if (!url.match(/^https?:\/\//)) {
      return { invalidUrl: { message: 'URL must start with http:// or https://' } };
    }
    
    return null;
  }

  /**
   * Toggle skill selection (available in both create and edit modes)
   */
  toggleSkill(skillId: number): void {
    const expertiseTagIds = this.mentorForm.get('expertiseTagIds')?.value || [];
    const index = expertiseTagIds.indexOf(skillId);

    if (index > -1) {
      expertiseTagIds.splice(index, 1);
    } else {
      expertiseTagIds.push(skillId);
    }

    this.mentorForm.patchValue({ expertiseTagIds });
  }

  /**
   * Check if skill is selected (available in both create and edit modes)
   */
  isSkillSelected(skillId: number): boolean {
    const expertiseTagIds = this.mentorForm.get('expertiseTagIds')?.value || [];
    return expertiseTagIds.includes(skillId);
  }

  /**
   * Get selected skills (available in both create and edit modes)
   */
  getSelectedSkills(): Skill[] {
    const expertiseTagIds = this.mentorForm.get('expertiseTagIds')?.value || [];
    return this.skills.filter(skill => expertiseTagIds.includes(skill.id));
  }

  /**
   * Toggle category selection (available in both create and edit modes)
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
   * Check if category is selected (available in both create and edit modes)
   */
  isCategorySelected(categoryId: number): boolean {
    const categoryIds = this.mentorForm.get('categoryIds')?.value || [];
    return categoryIds.includes(categoryId);
  }

  /**
   * Get selected categories (available in both create and edit modes)
   */
  getSelectedCategories(): Category[] {
    const categoryIds = this.mentorForm.get('categoryIds')?.value || [];
    return this.categories.filter(cat => categoryIds.includes(cat.id));
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
   * Handle CV file selection
   */
  onCvSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (file.type !== 'application/pdf') {
        this.notificationService.error('Please select a PDF file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        this.notificationService.error('CV file must be less than 5MB');
        return;
      }
      this.selectedCv = file;
    }
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
    if (fieldName === 'expertiseTagIds') {
      if (errors['required']) return 'Please select at least one expertise tag';
    }

    // Category errors
    if (fieldName === 'categoryIds') {
      if (errors['required']) return 'Please select at least one category';
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

    // LinkedIn URL errors
    if (fieldName === 'linkedInUrl') {
      if (errors['invalidLinkedIn']) return errors['invalidLinkedIn'].message;
      if (errors['invalidUrl']) return errors['invalidUrl'].message;
    }

    // GitHub URL errors
    if (fieldName === 'gitHubUrl') {
      if (errors['invalidGitHub']) return errors['invalidGitHub'].message;
      if (errors['invalidUrl']) return errors['invalidUrl'].message;
    }

    // Website URL errors
    if (fieldName === 'websiteUrl') {
      if (errors['pattern']) return 'Must be a valid URL starting with http:// or https://';
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

    const formValue = this.mentorForm.value;

    if (this.mode === 'create') {
      // Create mode: MentorApplication (now includes expertise tags and categories)
      const data: MentorApplication = {
        headline: formValue.headline || undefined,
        bio: formValue.bio,
        expertiseTagIds: formValue.expertiseTagIds,
        yearsOfExperience: formValue.yearsOfExperience,
        certifications: formValue.certifications || undefined,
        rate30Min: formValue.rate30Min,
        rate60Min: formValue.rate60Min,
        categoryIds: formValue.categoryIds,
        linkedInUrl: formValue.linkedInUrl || undefined,
        gitHubUrl: formValue.gitHubUrl || undefined,
        websiteUrl: formValue.websiteUrl || undefined,
        cv: this.selectedCv || undefined,
        previousWorks: this.previousWorks.length > 0 ? this.previousWorks : undefined
      };
      this.formSubmit.emit(data);
    } else {
      // Edit mode: MentorProfileUpdate (with optional expertise tags)
      const data: MentorProfileUpdate = {
        headline: formValue.headline || undefined,
        bio: formValue.bio,
        yearsOfExperience: formValue.yearsOfExperience,
        certifications: formValue.certifications || undefined,
        rate30Min: formValue.rate30Min,
        rate60Min: formValue.rate60Min,
        expertiseTagIds: formValue.expertiseTagIds,
        linkedInUrl: formValue.linkedInUrl || undefined,
        gitHubUrl: formValue.gitHubUrl || undefined,
        websiteUrl: formValue.websiteUrl || undefined
      };
      this.formSubmit.emit(data);
    }
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
    const resetData: any = {
      headline: '',
      bio: '',
      expertiseTagIds: [],
      yearsOfExperience: 1,
      certifications: '',
      rate30Min: 50,
      rate60Min: 90,
      categoryIds: []
    };

    this.mentorForm.reset(resetData);
    this.previousWorks = [];
    this.isSubmitting = false;
  }

  /**
   * Set submitting state (called by parent component)
   */
  setSubmitting(submitting: boolean): void {
    this.isSubmitting = submitting;
  }

  /**
   * Add a previous work entry
   */
  addPreviousWork(): void {
    if (!this.newWork.jobTitle || !this.newWork.companyName || !this.newWork.startDate) {
      this.notificationService.warning('Please fill in job title, company name, and start date');
      return;
    }
    const today = this.today;
    if (this.newWork.startDate < '1960-01-01' || this.newWork.startDate > today) {
      this.notificationService.warning('Start date must be between 1960 and today');
      return;
    }
    if (this.newWork.endDate && (this.newWork.endDate < this.newWork.startDate || this.newWork.endDate > today)) {
      this.notificationService.warning('End date must be between start date and today');
      return;
    }
    this.previousWorks.push({ ...this.newWork });
    this.previousWorks.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    this.newWork = { companyName: '', jobTitle: '', startDate: '' };
    this.showAddWorkForm = false;
  }

  get today(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Remove a previous work entry
   */
  removePreviousWork(index: number): void {
    this.previousWorks.splice(index, 1);
  }

  /**
   * Cancel adding work
   */
  cancelAddWork(): void {
    this.newWork = { companyName: '', jobTitle: '', startDate: '' };
    this.showAddWorkForm = false;
  }
}
