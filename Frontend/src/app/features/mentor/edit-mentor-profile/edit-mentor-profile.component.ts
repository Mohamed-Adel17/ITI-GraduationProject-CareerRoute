import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { MentorService } from '../../../core/services/mentor.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { SkillService } from '../../../core/services/skill.service';
import { CategoryService } from '../../../core/services/category.service';
import { Mentor, MentorProfileUpdate } from '../../../shared/models/mentor.model';
import { Skill } from '../../../shared/models/skill.model';
import { Category } from '../../../shared/models/category.model';

/**
 * EditMentorProfileComponent
 *
 * @description
 * Allows authenticated mentors to edit their mentor profile information using reactive forms.
 * Supports updating personal info, professional details, expertise tags, categories, and pricing.
 *
 * Features:
 * - Reactive forms with validation
 * - Pre-populated with current mentor data
 * - Expertise tags multi-select with skill IDs
 * - Categories multi-select (1-5 categories)
 * - Form validation feedback
 * - Save changes to backend API via PATCH /api/mentors/me
 * - Cancel and return to profile view
 * - Success/error notifications
 * - Loading state during save
 * - Toggle availability status
 *
 * @remarks
 * - Based on Mentor-Endpoints.md contract (Endpoint #9: PATCH /api/mentors/me)
 * - Uses GET /api/mentors/me to load mentor profile
 * - Uses GET /api/skills to load available skills for expertise tags
 * - Uses GET /api/categories to load available categories
 * - Uses PATCH /api/mentors/me to update profile (including expertiseTagIds and categoryIds)
 * - Updates both user-related fields and mentor-specific fields
 * - All update fields are optional (PATCH semantics)
 * - Works for pending mentors (before admin approval)
 *
 * @example
 * Route: /mentor/profile/edit
 */
@Component({
  selector: 'app-edit-mentor-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './edit-mentor-profile.component.html',
  styleUrls: ['./edit-mentor-profile.component.css']
})
export class EditMentorProfileComponent implements OnInit, OnDestroy {
  profileForm!: FormGroup;
  mentor: Mentor | null = null;
  availableSkills: Skill[] = [];
  availableCategories: Category[] = [];
  selectedSkillIds: number[] = [];
  selectedCategoryIds: number[] = [];
  loading: boolean = true;
  saving: boolean = false;
  error: string | null = null;

  private subscription?: Subscription;

  constructor(
    private fb: FormBuilder,
    private mentorService: MentorService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private skillService: SkillService,
    private categoryService: CategoryService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadData();
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  /**
   * Initialize the reactive form with validation rules
   *
   * @remarks
   * Includes both user-related fields and mentor-specific fields
   */
  private initializeForm(): void {
    this.profileForm = this.fb.group({
      // User-related fields
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      phoneNumber: ['', [Validators.pattern(/^[\d\s\-\+\(\)]+$/)]],
      profilePictureUrl: ['', [Validators.pattern(/^https?:\/\/.+/)]],

      // Mentor-specific fields
      bio: ['', [Validators.required, Validators.minLength(50), Validators.maxLength(1000)]],
      yearsOfExperience: [0, [Validators.required, Validators.min(0)]],
      certifications: ['', [Validators.maxLength(500)]],
      rate30Min: [0, [Validators.required, Validators.min(0), Validators.max(10000)]],
      rate60Min: [0, [Validators.required, Validators.min(0), Validators.max(10000)]],
      isAvailable: [true]
    });
  }

  /**
   * Load mentor profile data
   *
   * @remarks
   * - Loads mentor profile via GET /api/mentors/me (critical)
   * - Attempts to load skills and categories separately (non-blocking)
   * - Profile loads even if skills/categories endpoints are not available
   * - Expertise tags and categories are editable via multi-select if available
   *
   * No authentication check needed here because:
   * - Route is protected by mentorRoleGuard or authGuard
   * - API calls require authentication (401 handled by errorInterceptor)
   */
  private loadData(): void {
    this.loading = true;
    this.error = null;

    // Load mentor profile (critical - must succeed)
    this.subscription = this.mentorService.getCurrentMentorProfile().subscribe({
      next: (mentor) => {
        this.mentor = mentor;

        // Extract selected skill IDs from mentor's expertise tags
        this.selectedSkillIds = mentor.expertiseTags?.map(skill => skill.id) || [];

        // Extract selected category IDs from mentor's categories
        this.selectedCategoryIds = mentor.categories?.map(category => category.id) || [];

        this.populateForm(mentor);
        this.loading = false;

        // Try to load skills and categories (non-critical - optional)
        this.loadSkillsIfAvailable();
        this.loadCategoriesIfAvailable();
      },
      error: (err) => {
        this.error = 'Failed to load mentor profile data';
        this.loading = false;
        this.notificationService.error('Could not load your mentor profile. Please try again.', 'Error');
        console.error('Error loading mentor profile data:', err);
      }
    });
  }

  /**
   * Load available skills for expertise tags selection
   *
   * @remarks
   * - Non-blocking operation (profile still works if this fails)
   * - Skills endpoint may not be implemented yet on backend
   * - Silently fails if endpoint is unavailable
   * - Mentor can still edit other profile fields without skills
   */
  private loadSkillsIfAvailable(): void {
    this.skillService.getAllSkills().subscribe({
      next: (skills) => {
        this.availableSkills = skills;
      },
      error: (err) => {
        // Skills endpoint not ready - silently fail
        console.warn('Skills endpoint not available yet. Expertise tags selection disabled.', err);
        this.availableSkills = []; // Ensure it's empty array, not undefined
      }
    });
  }

  /**
   * Load available categories for category selection
   *
   * @remarks
   * - Non-blocking operation (profile still works if this fails)
   * - Categories endpoint may not be implemented yet on backend
   * - Silently fails if endpoint is unavailable
   * - Mentor can still edit other profile fields without categories
   */
  private loadCategoriesIfAvailable(): void {
    this.categoryService.getAllCategories().subscribe({
      next: (categories) => {
        this.availableCategories = categories;
      },
      error: (err) => {
        // Categories endpoint not ready - silently fail
        console.warn('Categories endpoint not available yet. Category selection disabled.', err);
        this.availableCategories = []; // Ensure it's empty array, not undefined
      }
    });
  }

  /**
   * Populate form with current mentor data
   *
   * @remarks
   * Updates all editable fields including selected expertise tag IDs and category IDs
   */
  private populateForm(mentor: Mentor): void {
    this.profileForm.patchValue({
      // User-related fields
      firstName: mentor.firstName,
      lastName: mentor.lastName,
      phoneNumber: mentor.email || '', // Note: email is not editable, using as placeholder
      profilePictureUrl: mentor.profilePictureUrl || '',

      // Mentor-specific fields
      bio: mentor.bio || '',
      yearsOfExperience: mentor.yearsOfExperience || 0,
      certifications: mentor.certifications || '',
      rate30Min: mentor.rate30Min || 0,
      rate60Min: mentor.rate60Min || 0,
      isAvailable: mentor.isAvailable !== undefined ? mentor.isAvailable : true
    });
  }

  /**
   * Toggle skill selection for expertise tags
   *
   * @param skillId - Skill ID to toggle
   */
  toggleSkill(skillId: number): void {
    const index = this.selectedSkillIds.indexOf(skillId);
    if (index > -1) {
      // Remove skill
      this.selectedSkillIds.splice(index, 1);
    } else {
      // Add skill
      this.selectedSkillIds.push(skillId);
    }
    // Mark form as dirty
    this.profileForm.markAsDirty();
  }

  /**
   * Check if skill is selected
   *
   * @param skillId - Skill ID to check
   * @returns True if skill is selected
   */
  isSkillSelected(skillId: number): boolean {
    return this.selectedSkillIds.includes(skillId);
  }

  /**
   * Toggle category selection
   *
   * @param categoryId - Category ID to toggle
   */
  toggleCategory(categoryId: number): void {
    const index = this.selectedCategoryIds.indexOf(categoryId);
    if (index > -1) {
      // Remove category
      this.selectedCategoryIds.splice(index, 1);
    } else {
      // Add category (max 5 categories)
      if (this.selectedCategoryIds.length < 5) {
        this.selectedCategoryIds.push(categoryId);
      } else {
        this.notificationService.warning('You can select up to 5 categories', 'Category Limit');
      }
    }
    // Mark form as dirty
    this.profileForm.markAsDirty();
  }

  /**
   * Check if category is selected
   *
   * @param categoryId - Category ID to check
   * @returns True if category is selected
   */
  isCategorySelected(categoryId: number): boolean {
    return this.selectedCategoryIds.includes(categoryId);
  }

  /**
   * Group available skills by category
   *
   * @returns Map of category names to skill arrays
   */
  getSkillsByCategory(): Map<string, Skill[]> {
    return this.skillService.groupSkillsByCategory(this.availableSkills);
  }

  /**
   * Get form control for template access
   */
  get f() {
    return this.profileForm.controls;
  }

  /**
   * Check if form field has error
   */
  hasError(fieldName: string, errorType: string): boolean {
    const field = this.profileForm.get(fieldName);
    return !!(field && field.hasError(errorType) && (field.dirty || field.touched));
  }

  /**
   * Submit form and save mentor profile updates
   *
   * @remarks
   * Uses PATCH /api/mentors/me endpoint via MentorService.updateCurrentMentorProfile()
   * Sends all editable fields including expertiseTagIds and categoryIds arrays
   * Empty expertiseTagIds array clears all expertise tags
   * Updates both user-related and mentor-specific fields
   */
  onSubmit(): void {
    if (this.profileForm.invalid) {
      this.notificationService.warning('Please fix the form errors before saving', 'Invalid Form');
      // Mark all fields as touched to show validation errors
      Object.keys(this.profileForm.controls).forEach(key => {
        this.profileForm.get(key)?.markAsTouched();
      });
      return;
    }

    // Validate pricing logic
    const rate30Min = this.profileForm.value.rate30Min;
    const rate60Min = this.profileForm.value.rate60Min;
    if (rate60Min <= rate30Min) {
      this.notificationService.warning('60-minute rate must be higher than 30-minute rate', 'Invalid Pricing');
      return;
    }

    // Validate category selection (1-5 categories)
    if (this.selectedCategoryIds.length === 0) {
      this.notificationService.warning('Please select at least 1 category', 'Categories Required');
      return;
    }

    this.saving = true;

    // Prepare update data with all fields
    const updateData: MentorProfileUpdate = {
      // User-related fields
      firstName: this.profileForm.value.firstName,
      lastName: this.profileForm.value.lastName,

      // Mentor-specific fields
      bio: this.profileForm.value.bio,
      yearsOfExperience: this.profileForm.value.yearsOfExperience,
      rate30Min: this.profileForm.value.rate30Min,
      rate60Min: this.profileForm.value.rate60Min,
      isAvailable: this.profileForm.value.isAvailable,
      expertiseTagIds: this.selectedSkillIds, // Include expertise tag IDs
      categoryIds: this.selectedCategoryIds // Include category IDs
    };

    // Add optional fields only if they have values
    if (this.profileForm.value.phoneNumber) {
      updateData.phoneNumber = this.profileForm.value.phoneNumber;
    }
    if (this.profileForm.value.profilePictureUrl) {
      updateData.profilePictureUrl = this.profileForm.value.profilePictureUrl;
    }
    if (this.profileForm.value.certifications) {
      updateData.certifications = this.profileForm.value.certifications;
    }

    this.mentorService.updateCurrentMentorProfile(updateData).subscribe({
      next: (updatedMentor) => {
        this.saving = false;
        this.notificationService.success('Your mentor profile has been updated successfully!', 'Profile Updated');
        this.router.navigate(['/mentor/profile']);
      },
      error: (err) => {
        this.saving = false;
        this.notificationService.error(err.message || 'Failed to update mentor profile. Please try again.', 'Update Failed');
        console.error('Error updating mentor profile:', err);
      }
    });
  }

  /**
   * Cancel editing and return to mentor profile view
   */
  onCancel(): void {
    if (this.profileForm.dirty) {
      if (confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        this.router.navigate(['/mentor/profile']);
      }
    } else {
      this.router.navigate(['/mentor/profile']);
    }
  }

  /**
   * Reset form to original values
   */
  onReset(): void {
    if (confirm('Are you sure you want to reset all changes?')) {
      if (this.mentor) {
        this.selectedSkillIds = this.mentor.expertiseTags?.map(skill => skill.id) || [];
        this.selectedCategoryIds = this.mentor.categories?.map(category => category.id) || [];
        this.populateForm(this.mentor);
        this.profileForm.markAsPristine();
      }
    }
  }
}
