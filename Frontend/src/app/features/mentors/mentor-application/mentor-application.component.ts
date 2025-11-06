import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MentorProfileFormComponent } from '../mentor-profile/mentor-profile-form.component';
import { MentorService } from '../../../core/services/mentor.service';
import { NotificationService } from '../../../core/services/notification.service';
import { CategoryService } from '../../../core/services/category.service';
import { MentorApplication, MentorCategory } from '../../../shared/models/mentor.model';

/**
 * MentorApplicationComponent
 *
 * Page component for mentor application (applying to become a mentor).
 * Wraps MentorProfileFormComponent in create mode and handles form submission.
 *
 * Route: /user/apply-mentor
 * Guard: authGuard (requires authentication)
 * Access: Any authenticated user can apply
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

        <!-- Loading state -->
        <div *ngIf="isLoadingCategories" class="flex justify-center items-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p class="ml-4 text-gray-600 dark:text-gray-400">Loading categories...</p>
        </div>

        <!-- Form Component -->
        <app-mentor-profile-form
          *ngIf="!isLoadingCategories"
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
export class MentorApplicationComponent implements OnInit {
  categories: MentorCategory[] = [];
  isLoadingCategories = false;

  constructor(
    private mentorService: MentorService,
    private notificationService: NotificationService,
    private categoryService: CategoryService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  /**
   * Load categories from the backend
   * Categories are unified - same list used for both user interests and mentor specializations
   */
  private loadCategories(): void {
    this.isLoadingCategories = true;

    this.categoryService.getAllCategories().subscribe({
      next: (categories) => {
        // Map backend Category to MentorCategory interface
        this.categories = categories.map(cat => ({
          id: parseInt(cat.id, 10) || 0, // Convert string ID to number
          name: cat.name,
          description: cat.description,
          iconUrl: cat.icon
        }));
        this.isLoadingCategories = false;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.notificationService.error('Failed to load categories. Please try again.');
        this.isLoadingCategories = false;

        // Fallback to empty array on error
        this.categories = [];
      }
    });
  }

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
