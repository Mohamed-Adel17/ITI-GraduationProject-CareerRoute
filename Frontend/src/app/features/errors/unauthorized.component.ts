import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

/**
 * UnauthorizedComponent (401/403 Error Page)
 *
 * Displays a user-friendly unauthorized/forbidden error page when a user
 * lacks permissions to access a resource.
 *
 * Features:
 * - Different messages for authenticated vs unauthenticated users
 * - Conditional action buttons based on authentication status
 * - Visual lock icon and clear messaging
 * - Responsive design with dark mode support
 * - Navigation options (Login, Home, Back)
 *
 * Route: /errors/unauthorized
 * Access: Public (no guard)
 *
 * Triggered when:
 * - User tries to access role-restricted route without permission
 * - Role guards (adminRoleGuard, mentorRoleGuard) deny access
 * - API returns 401/403 responses
 * - Manual navigation for permission errors
 */
@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4 py-12">
      <div class="max-w-2xl w-full text-center">
        <!-- Lock Icon/Illustration -->
        <div class="mb-8">
          <svg class="mx-auto h-48 w-48 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        <!-- Error Code -->
        <h1 class="text-8xl sm:text-9xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
          {{ isAuthenticated ? '403' : '401' }}
        </h1>

        <!-- Error Title -->
        <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          {{ isAuthenticated ? 'Access Denied' : 'Authentication Required' }}
        </h2>

        <!-- Error Description (Changes based on auth status) -->
        <p class="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
          <ng-container *ngIf="isAuthenticated; else notAuthenticated">
            You don't have the necessary permissions to access this resource. If you believe this is a mistake, please contact support.
          </ng-container>
          <ng-template #notAuthenticated>
            You need to log in to access this page. Please sign in with your account or create a new one to continue.
          </ng-template>
        </p>

        <!-- Permission Info Box (Only for authenticated users) -->
        <div *ngIf="isAuthenticated" class="mb-8 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 max-w-md mx-auto">
          <div class="flex items-start">
            <svg class="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            <div class="text-left">
              <p class="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                Insufficient Permissions
              </p>
              <p class="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                This page requires special permissions. Contact your administrator if you need access.
              </p>
            </div>
          </div>
        </div>

        <!-- Login Info Box (Only for unauthenticated users) -->
        <div *ngIf="!isAuthenticated" class="mb-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 max-w-md mx-auto">
          <p class="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
            To access this page, you need to:
          </p>
          <ul class="text-sm text-blue-600 dark:text-blue-400 space-y-1 text-left">
            <li class="flex items-center">
              <svg class="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              Sign in with your account
            </li>
            <li class="flex items-center">
              <svg class="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              Or create a new account
            </li>
            <li class="flex items-center">
              <svg class="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              Then return to this page
            </li>
          </ul>
        </div>

        <!-- Action Buttons (Different for authenticated vs unauthenticated) -->
        <div class="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
          <!-- Unauthenticated User Buttons -->
          <ng-container *ngIf="!isAuthenticated">
            <!-- Login Button -->
            <a
              [routerLink]="['/auth/login']"
              [queryParams]="{ returnUrl: currentUrl }"
              class="inline-flex items-center px-6 py-3 border border-transparent rounded-lg text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900 transition-colors duration-200 shadow-sm"
            >
              <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Log In
            </a>

            <!-- Register Button -->
            <a
              routerLink="/auth/register"
              class="inline-flex items-center px-6 py-3 border border-transparent rounded-lg text-base font-medium text-white bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-900 transition-colors duration-200 shadow-sm"
            >
              <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Create Account
            </a>
          </ng-container>

          <!-- Authenticated User Buttons -->
          <ng-container *ngIf="isAuthenticated">
            <!-- Go Back Button -->
            <button
              (click)="goBack()"
              class="inline-flex items-center px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-base font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900 transition-colors duration-200 shadow-sm"
            >
              <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Go Back
            </button>

            <!-- Dashboard Button (Role-specific) -->
            <a
              [routerLink]="dashboardRoute"
              class="inline-flex items-center px-6 py-3 border border-transparent rounded-lg text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900 transition-colors duration-200 shadow-sm"
            >
              <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              {{ dashboardLabel }}
            </a>
          </ng-container>

          <!-- Browse Mentors Button (Always visible) -->
          <a
            routerLink="/public/mentors"
            class="inline-flex items-center px-6 py-3 border border-transparent rounded-lg text-base font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 dark:focus:ring-offset-gray-900 transition-colors duration-200 shadow-sm"
          >
            <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Browse Mentors
          </a>
        </div>

        <!-- Contact Support Link -->
        <div class="text-sm text-gray-500 dark:text-gray-400">
          Need help or think this is a mistake?
          <a href="mailto:support@careerroute.com" class="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-medium ml-1">
            Contact Support
          </a>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class UnauthorizedComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly location = inject(Location);
  private readonly router = inject(Router);

  // Component state
  isAuthenticated = false;
  currentUrl = '';
  dashboardRoute = '/';
  dashboardLabel = 'Go to Home';

  ngOnInit(): void {
    // Check authentication status
    this.isAuthenticated = this.authService.isAuthenticated();

    // Store current URL for return after login
    this.currentUrl = this.router.url;

    // Determine appropriate dashboard route based on user role
    if (this.isAuthenticated) {
      this.setDashboardRoute();
    }
  }

  /**
   * Set the appropriate dashboard route based on user role
   */
  private setDashboardRoute(): void {
    if (this.authService.isAdmin()) {
      this.dashboardRoute = '/admin/dashboard';
      this.dashboardLabel = 'Go to Admin Dashboard';
    } else if (this.authService.isMentor()) {
      this.dashboardRoute = '/mentor/dashboard';
      this.dashboardLabel = 'Go to Mentor Dashboard';
    } else {
      this.dashboardRoute = '/user/dashboard';
      this.dashboardLabel = 'Go to Dashboard';
    }
  }

  /**
   * Navigate back to previous page in browser history
   * If no history, navigate to home page as fallback
   */
  goBack(): void {
    // Check if there's history to go back to
    if (window.history.length > 1) {
      this.location.back();
    } else {
      // No history, navigate to home as fallback
      this.router.navigate(['/']);
    }
  }
}
