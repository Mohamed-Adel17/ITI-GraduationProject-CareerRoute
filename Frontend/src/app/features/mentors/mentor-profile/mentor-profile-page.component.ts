import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MentorProfileFormComponent } from './mentor-profile-form.component';
import { MentorService } from '../../../core/services/mentor.service';
import { NotificationService } from '../../../core/services/notification.service';
import { MentorApplication, MentorCategory } from '../../../shared/models/mentor.model';

/**
 * MentorProfilePageComponent
 * 
 * Page wrapper for the MentorProfileFormComponent
 * Handles form submission and provides mock data for testing
 */
@Component({
  selector: 'app-mentor-profile-page',
  standalone: true,
  imports: [CommonModule, MentorProfileFormComponent],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div class="container mx-auto px-4">
        <!-- Optional: Add a page header -->
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
          [categories]="categories"
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
export class MentorProfilePageComponent {
  categories: MentorCategory[] = [
    { id: 1, name: 'Software Development', description: 'Web, mobile, and desktop development' },
    { id: 2, name: 'Data Science', description: 'Machine learning, AI, and analytics' },
    { id: 3, name: 'DevOps', description: 'CI/CD, cloud infrastructure, and automation' },
    { id: 4, name: 'UI/UX Design', description: 'User interface and user experience design' },
    { id: 5, name: 'Product Management', description: 'Product strategy and development' },
    { id: 6, name: 'Career Coaching', description: 'Career guidance and professional development' }
  ];

  constructor(
    private mentorService: MentorService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  onSubmit(data: MentorApplication): void {
    console.log('Form submitted:', data);
    
    // Call the real service
    this.mentorService.applyToBecomeMentor(data).subscribe({
      next: (mentor) => {
        console.log('Success:', mentor);
        this.notificationService.success('Application submitted successfully!');
      },
      error: (error) => {
        console.error('Error:', error);
        this.notificationService.error('Failed to submit application');
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/']);
  }
}
