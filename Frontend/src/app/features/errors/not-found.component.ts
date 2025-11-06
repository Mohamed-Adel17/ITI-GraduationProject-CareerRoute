import { Component, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

/**
 * NotFoundComponent (404 Error Page)
 *
 * Displays a user-friendly 404 error page when a resource or route is not found.
 *
 * Features:
 * - Clear 404 error message with visual icon
 * - Helpful navigation options (Home, Browse Mentors, Go Back)
 * - Search suggestions
 * - Responsive design with dark mode support
 * - No authentication required (public page)
 *
 * Route: /errors/not-found
 * Access: Public (no guard)
 *
 * Triggered when:
 * - User navigates to non-existent URL
 * - Wildcard route catches unmatched paths
 * - Resource not found from API
 * - Guards redirect to error page
 */
@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4 py-12">
      <div class="max-w-2xl w-full text-center">
        <!-- 404 Icon/Illustration -->
        <div class="mb-8">
          <svg class="mx-auto h-48 w-48 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <!-- Error Code -->
        <h1 class="text-9xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
          404
        </h1>

        <!-- Error Title -->
        <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Page Not Found
        </h2>

        <!-- Error Description -->
        <p class="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
          Sorry, we couldn't find the page you're looking for. It might have been moved, deleted, or never existed.
        </p>

        <!-- Suggestions -->
        <div class="mb-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 max-w-md mx-auto">
          <p class="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
            Here are some helpful links instead:
          </p>
          <ul class="text-sm text-blue-600 dark:text-blue-400 space-y-1 text-left">
            <li class="flex items-center">
              <svg class="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              Check the URL for typos
            </li>
            <li class="flex items-center">
              <svg class="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              Return to the homepage
            </li>
            <li class="flex items-center">
              <svg class="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              Browse available mentors
            </li>
          </ul>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
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

          <!-- Home Button -->
          <a
            routerLink="/"
            class="inline-flex items-center px-6 py-3 border border-transparent rounded-lg text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900 transition-colors duration-200 shadow-sm"
          >
            <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Go to Home
          </a>

          <!-- Browse Mentors Button -->
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
          Still need help?
          <a href="mailto:support@careerroute.com" class="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-medium ml-1">
            Contact Support
          </a>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class NotFoundComponent {
  private readonly location = inject(Location);
  private readonly router = inject(Router);

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
