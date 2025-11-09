import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subscription, forkJoin } from 'rxjs';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { CategoryService } from '../../../core/services/category.service';
import { User, UserProfileUpdate } from '../../../shared/models/user.model';

/**
 * EditProfileComponent
 *
 * @description
 * Allows authenticated users to edit their profile information using reactive forms.
 * Supports updating personal info, career interests (as array), and career goals.
 *
 * Features:
 * - Reactive forms with validation
 * - Pre-populated with current user data
 * - Multi-select career interests support (loaded from backend via CategoryService)
 * - Form validation feedback
 * - Save changes to backend API
 * - Cancel and return to profile view
 * - Success/error notifications
 * - Loading state during save
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
  loading: boolean = true;
  saving: boolean = false;
  error: string | null = null;

  // Career interests loaded from backend
  availableInterests: string[] = [];

  // Selected interests tracking
  selectedInterests: Set<string> = new Set();

  private subscription?: Subscription;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private authService: AuthService,
    private categoryService: CategoryService,
    private notificationService: NotificationService,
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
   */
  private initializeForm(): void {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      phoneNumber: ['', [Validators.pattern(/^[\d\s\-\+\(\)]+$/)]],
      profilePictureUrl: ['', [Validators.pattern(/^https?:\/\/.+/)]],
      careerGoals: ['', [Validators.maxLength(500)]]
    });
  }

  /**
   * Load user profile and career interests data
   * Uses forkJoin to load both in parallel for better performance
   */
  private loadData(): void {
    this.loading = true;
    this.error = null;

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.error = 'User not authenticated';
      this.loading = false;
      this.notificationService.error('Please log in to edit your profile', 'Authentication Required');
      this.router.navigate(['/auth/login']);
      return;
    }

    // Load user profile and category names in parallel
    this.subscription = forkJoin({
      user: this.userService.getUserProfile(currentUser.id),
      interests: this.categoryService.getCategoryNames()
    }).subscribe({
      next: (result) => {
        this.user = result.user;
        this.availableInterests = result.interests;
        this.populateForm(result.user);
        this.loading = false;
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
   * Populate form with current user data
   */
  private populateForm(user: User): void {
    this.profileForm.patchValue({
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber || '',
      profilePictureUrl: user.profilePictureUrl || '',
      careerGoals: user.careerGoals || ''
    });

    // Initialize selected interests
    if (user.careerInterests && user.careerInterests.length > 0) {
      this.selectedInterests = new Set(user.careerInterests);
    }
  }

  /**
   * Toggle career interest selection
   */
  toggleInterest(interest: string): void {
    if (this.selectedInterests.has(interest)) {
      this.selectedInterests.delete(interest);
    } else {
      this.selectedInterests.add(interest);
    }
  }

  /**
   * Check if an interest is selected
   */
  isInterestSelected(interest: string): boolean {
    return this.selectedInterests.has(interest);
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
   * Submit form and save profile updates
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

    const updateData: UserProfileUpdate = {
      firstName: this.profileForm.value.firstName,
      lastName: this.profileForm.value.lastName,
      phoneNumber: this.profileForm.value.phoneNumber || undefined,
      profilePictureUrl: this.profileForm.value.profilePictureUrl || undefined,
      careerInterests: Array.from(this.selectedInterests),
      careerGoals: this.profileForm.value.careerGoals || undefined
    };

    this.userService.updateCurrentUserProfile(updateData).subscribe({
      next: (updatedUser) => {
        this.saving = false;
        this.notificationService.success('Your profile has been updated successfully!', 'Profile Updated');
        this.router.navigate(['/user/profile']);
      },
      error: (err) => {
        this.saving = false;
        this.notificationService.error('Failed to update profile. Please try again.', 'Update Failed');
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
      }
    }
  }
}
