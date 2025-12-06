import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MentorProfileFormComponent } from '../mentor-profile/mentor-profile-form.component';
import { MentorService } from '../../../core/services/mentor.service';
import { SkillService } from '../../../core/services/skill.service';
import { CategoryService } from '../../../core/services/category.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { MentorApplication, MentorProfileUpdate } from '../../../shared/models/mentor.model';
import { Skill } from '../../../shared/models/skill.model';
import { Category } from '../../../shared/models/category.model';
import { forkJoin } from 'rxjs';

/**
 * MentorApplicationComponent
 *
 * Page component for mentor application (applying to become a mentor).
 * Wraps MentorProfileFormComponent in create mode and handles form submission.
 *
 * Route: /user/apply-mentor
 * Guard: authGuard (requires authentication)
 * Access: Any authenticated user can apply
 *
 * @remarks
 * - According to updated API contract (Endpoint #7 POST /api/mentors), mentor application now REQUIRES:
 *   - expertiseTagIds: Array of skill IDs (required)
 *   - categoryIds: Array of category IDs (required)
 * - Application starts with approvalStatus: "Pending"
 * - Skills and categories are loaded from SkillService and CategoryService
 */
@Component({
  selector: 'app-mentor-application',
  standalone: true,
  imports: [CommonModule, MentorProfileFormComponent],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div class="container mx-auto px-4">
        <!-- Page header -->
        <div class="mb-8 text-center">
          <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Become a Mentor
          </h1>
          <p class="text-lg text-gray-600 dark:text-gray-400">
            Share your expertise and help others grow their careers
          </p>
        </div>

        <!-- Loading State -->
        <div *ngIf="isLoading" class="flex justify-center items-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <span class="ml-3 text-gray-600 dark:text-gray-400">Loading application form...</span>
        </div>

        <!-- Error State -->
        <div *ngIf="loadError" class="max-w-2xl mx-auto p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <h3 class="text-lg font-semibold text-red-900 dark:text-red-300 mb-2">Unable to Load Application Form</h3>
          <p class="text-sm text-red-800 dark:text-red-400 mb-4">{{ loadError }}</p>
          <button
            (click)="loadData()"
            class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
            Try Again
          </button>
        </div>

        <!-- Form Component -->
        <app-mentor-profile-form
          *ngIf="!isLoading && !loadError"
          [mode]="'create'"
          [skills]="skills"
          [categories]="categories"
          [isSubmitting]="isSubmitting"
          (formSubmit)="onSubmit($event)"
          (formCancel)="onCancel()">
        </app-mentor-profile-form>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
    }
  `]
})
export class MentorApplicationComponent implements OnInit {
  // Data for form
  skills: Skill[] = [];
  categories: Category[] = [];

  // Loading state
  isLoading = false;
  isSubmitting = false;
  loadError: string | null = null;

  constructor(
    private mentorService: MentorService,
    private skillService: SkillService,
    private categoryService: CategoryService,
    private notificationService: NotificationService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Refresh token first to get latest user state, then check profile
    this.authService.refreshToken().subscribe({
      next: () => this.checkExistingProfile(),
      error: () => this.checkExistingProfile()
    });
  }

  /**
   * Check if user already has a mentor profile
   * If profile exists, redirect to application-pending page
   */
  private checkExistingProfile(): void {
    this.mentorService.getCurrentMentorProfile().subscribe({
      next: (profile) => {
        // User already has a mentor profile - redirect to pending page
        // console.log('User already has mentor profile, redirecting to pending page');
        this.notificationService.info(
          'You have already submitted your mentor application.',
          'Application Submitted'
        );
        this.router.navigate(['/mentor/application-pending']);
      },
      error: (error) => {
        // If 404, user doesn't have profile yet - allow them to apply
        if (error.status === 404) {
          // console.log('No existing mentor profile found, loading application form');
          this.loadData();
        } else {
          // Other errors - show error and load form anyway
          console.error('Error checking existing profile:', error);
          this.loadData();
        }
      }
    });
  }

  /**
   * Load skills and categories from services
   */
  loadData(): void {
    this.isLoading = true;
    this.loadError = null;

    // Load skills and categories in parallel using forkJoin
    forkJoin({
      skills: this.skillService.getAllSkills(),
      categories: this.categoryService.getAllCategories()
    }).subscribe({
      next: ({ skills, categories }) => {
        this.skills = skills;
        this.categories = categories;
        this.isLoading = false;

        // Warn if no data available
        if (this.skills.length === 0) {
          this.notificationService.warning('No skills available. Please contact support.');
        }
        if (this.categories.length === 0) {
          this.notificationService.warning('No categories available. Please contact support.');
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.loadError = 'Failed to load application data. Please try again.';
        console.error('Error loading skills and categories:', error);
      }
    });
  }

  /**
   * Handle form submission
   * @param data - Form data (will be MentorApplication since mode is 'create')
   */
  onSubmit(data: MentorApplication | MentorProfileUpdate): void {
    // In create mode, the form always emits MentorApplication
    // Type guard to ensure we have the right type
    if (this.isMentorApplication(data)) {
      this.isSubmitting = true;
      this.mentorService.applyToBecomeMentor(data).subscribe({
        next: () => {
          this.notificationService.success(
            'Application submitted successfully! Your application is pending approval.',
            'Application Submitted'
          );

          // Refresh token to get updated JWT with isMentor flag, then navigate
          this.authService.refreshToken().subscribe({
            next: () => this.router.navigate(['/mentor/application-pending']),
            error: () => this.router.navigate(['/'])
          });
        },
        error: (error) => {
          this.isSubmitting = false;
          if (error.status === 409) {
            this.notificationService.error(
              'You have a previous application. Please contact support to re-apply.',
              'Application Exists'
            );
          } else {
            this.notificationService.error('Failed to submit application. Please try again.');
          }
        }
      });
    } else {
      console.error('Invalid data type received in create mode');
      this.notificationService.error('Invalid form data. Please try again.');
    }
  }

  /**
   * Type guard to check if data is MentorApplication
   * @param data - Form data to check
   * @returns true if data is MentorApplication (has all required fields including expertiseTagIds and categoryIds)
   */
  private isMentorApplication(data: MentorApplication | MentorProfileUpdate): data is MentorApplication {
    // MentorApplication has all required fields including expertiseTagIds and categoryIds
    return (
      'bio' in data &&
      'expertiseTagIds' in data &&
      'yearsOfExperience' in data &&
      'rate30Min' in data &&
      'rate60Min' in data &&
      'categoryIds' in data
    );
  }

  /**
   * Handle form cancellation
   * Navigate back to home page
   */
  onCancel(): void {
    this.router.navigate(['/']);
  }

}
