import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MentorProfileFormComponent } from '../mentor-profile/mentor-profile-form.component';
import { MentorService } from '../../../core/services/mentor.service';
import { NotificationService } from '../../../core/services/notification.service';
import { MentorApplication, MentorProfileUpdate } from '../../../shared/models/mentor.model';

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
 * - According to API contract (Endpoint #7 POST /api/mentors), mentor application does NOT include:
 *   - expertiseTags/expertiseTagIds (added later after approval via PATCH /api/mentors/{id})
 *   - categories (handled by backend based on skills)
 * - Application starts with approvalStatus: "Pending"
 * - After admin approval, mentor can add expertise tags
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

        <!-- Form Component -->
        <app-mentor-profile-form
          [mode]="'create'"
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
  constructor(
    private mentorService: MentorService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // No initialization needed - form is ready to use
  }

  /**
   * Handle form submission
   * @param data - Form data (will be MentorApplication since mode is 'create')
   */
  onSubmit(data: MentorApplication | MentorProfileUpdate): void {
    // In create mode, the form always emits MentorApplication
    // Type guard to ensure we have the right type
    if (this.isMentorApplication(data)) {
      this.mentorService.applyToBecomeMentor(data).subscribe({
        next: (mentor) => {
          this.notificationService.success(
            'Application submitted successfully! Your application is pending approval.',
            'Application Submitted'
          );
          // Navigate to user dashboard or profile page
          this.router.navigate(['/user/dashboard']);
        },
        error: (error) => {
          // errorInterceptor handles most errors, but we can add custom handling here
          if (error.status === 400 && error.error?.message?.includes('already have a mentor profile')) {
            this.notificationService.error('You already have a mentor profile.');
          } else {
            this.notificationService.error('Failed to submit application. Please try again.');
          }
        }
      });
    } else {
      // This should never happen in create mode, but handle gracefully
      console.error('Invalid data type received in create mode');
      this.notificationService.error('Invalid form data. Please try again.');
    }
  }

  /**
   * Type guard to check if data is MentorApplication
   * @param data - Form data to check
   * @returns true if data is MentorApplication (has required fields, no expertiseTagIds)
   */
  private isMentorApplication(data: MentorApplication | MentorProfileUpdate): data is MentorApplication {
    // MentorApplication has all required fields and no expertiseTagIds
    return (
      'bio' in data &&
      'yearsOfExperience' in data &&
      'rate30Min' in data &&
      'rate60Min' in data &&
      !('expertiseTagIds' in data)
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
