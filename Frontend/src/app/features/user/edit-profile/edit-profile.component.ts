import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { SkillService } from '../../../core/services/skill.service';
import { User, UserProfileUpdate } from '../../../shared/models/user.model';
import { Skill } from '../../../shared/models/skill.model';

/**
 * EditProfileComponent
 *
 * @description
 * Allows authenticated users to edit their profile information using reactive forms.
 * Supports updating personal info, career interests, and career goals.
 *
 * Features:
 * - Reactive forms with validation
 * - Pre-populated with current user data
 * - Career interests multi-select with skill IDs
 * - Form validation feedback
 * - Save changes to backend API via PATCH /api/users/me
 * - Cancel and return to profile view
 * - Success/error notifications
 * - Loading state during save
 *
 * @remarks
 * - Based on User-Profile-Endpoints.md contract
 * - Uses GET /api/users/me to load profile
 * - Uses GET /api/skills to load available skills
 * - Uses PATCH /api/users/me to update profile (including careerInterestIds)
 * - careerInterests are now managed directly via careerInterestIds field in profile update
 * - All update fields are optional (PATCH semantics)
 *
 * @example
 * Route: /user/profile/edit
 */
@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.css']
})
export class EditProfileComponent implements OnInit, OnDestroy {
  profileForm!: FormGroup;
  user: User | null = null;
  availableSkills: Skill[] = [];
  selectedSkillIds: number[] = [];
  loading: boolean = true;
  saving: boolean = false;
  error: string | null = null;
  selectedFile: File | null = null;
  imagePreview: string | null = null;

  private subscription?: Subscription;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private skillService: SkillService,
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
   * Matches backend UpdateUserValidator rules
   */
  private initializeForm(): void {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      phoneNumber: ['', [Validators.pattern(/^\+?[0-9]{10,15}$/)]],
      profilePictureUrl: ['', [Validators.maxLength(200), Validators.pattern(/\.(jpg|jpeg|png)$/i)]],
      careerGoals: ['', [Validators.maxLength(500)]]
    });
  }

  /**
   * Load user profile data
   *
   * @remarks
   * - Loads user profile via GET /api/users/me (critical)
   * - Attempts to load skills separately (non-blocking)
   * - Profile loads even if skills endpoint is not available
   * - Career interests are editable via multi-select if skills are available
   *
   * No authentication check needed here because:
   * - Route is protected by authGuard
   * - API calls require authentication (401 handled by errorInterceptor)
   */
  private loadData(): void {
    this.loading = true;
    this.error = null;

    // Load user profile (critical - must succeed)
    this.subscription = this.userService.getCurrentUserProfile().subscribe({
      next: (user) => {
        this.user = user;

        // Extract selected skill IDs from user's career interests
        this.selectedSkillIds = user.careerInterests?.map(skill => skill.id) || [];

        this.populateForm(user);
        this.loading = false;

        // Try to load skills (non-critical - optional)
        this.loadSkillsIfAvailable();
      },
      error: (err) => {
        this.error = 'Failed to load profile data';
        this.loading = false;
        this.notificationService.error('Could not load your profile. Please try again.', 'Error');
        console.error('Error loading profile data:', err);
      }
    });
  }

  /**
   * Load available skills for career interests selection
   *
   * @remarks
   * - Non-blocking operation (profile still works if this fails)
   * - Skills endpoint may not be implemented yet on backend
   * - Silently fails if endpoint is unavailable
   * - User can still edit other profile fields without skills
   */
  private loadSkillsIfAvailable(): void {
    this.skillService.getAllSkills().subscribe({
      next: (skills) => {
        this.availableSkills = skills;
      },
      error: (err) => {
        // Skills endpoint not ready - silently fail
        // User can still edit firstName, lastName, phoneNumber, careerGoals
        console.warn('Skills endpoint not available yet. Career interests selection disabled.', err);
        this.availableSkills = []; // Ensure it's empty array, not undefined
      }
    });
  }

  /**
   * Populate form with current user data
   *
   * @remarks
   * Updates all editable fields including selected career interest IDs
   */
  private populateForm(user: User): void {
    this.profileForm.patchValue({
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber || '',
      // profilePicture is handled separately via file input
      careerGoals: user.careerGoals || ''
    });
  }

  /**
   * Toggle skill selection
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

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  /**
   * Submit form and save profile updates
   *
   * @remarks
   * Uses PATCH /api/users/me endpoint via UserService.updateCurrentUserProfile()
   * Sends all editable fields including careerInterestIds array
   * Empty careerInterestIds array clears all career interests
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

    this.saving = true;

    // Prepare update data with all fields
    const updateData: UserProfileUpdate = {
      firstName: this.profileForm.value.firstName,
      lastName: this.profileForm.value.lastName,
      careerInterestIds: this.selectedSkillIds // Include career interest IDs
    };

    // Add optional fields only if they have values
    if (this.profileForm.value.phoneNumber) {
      updateData.phoneNumber = this.profileForm.value.phoneNumber;
    }
    if (this.selectedFile) {
      updateData.profilePicture = this.selectedFile;
    }
    if (this.profileForm.value.careerGoals) {
      updateData.careerGoals = this.profileForm.value.careerGoals;
    }

    this.userService.updateCurrentUserProfile(updateData).subscribe({
      next: (updatedUser) => {
        this.saving = false;
        this.notificationService.success('Your profile has been updated successfully!', 'Profile Updated');
        this.router.navigate(['/user/profile']);
      },
      error: (err) => {
        this.saving = false;
        this.notificationService.error(err.message || 'Failed to update profile. Please try again.', 'Update Failed');
        console.error('Error updating profile:', err);
      }
    });
  }

  /**
   * Cancel editing and return to profile view
   */
  onCancel(): void {
    if (this.profileForm.dirty) {
      if (confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        this.router.navigate(['/user/profile']);
      }
    } else {
      this.router.navigate(['/user/profile']);
    }
  }

  /**
   * Reset form to original values
   */
  onReset(): void {
    if (confirm('Are you sure you want to reset all changes?')) {
      if (this.user) {
        this.populateForm(this.user);
        this.selectedFile = null;
        this.imagePreview = null;
      }
    }
  }
}
