import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { CategoryService } from '../../../core/services/category.service';
import { AuthService } from '../../../core/services/auth.service';
import { Category } from '../../../shared/models/category.model';

/**
 * HomeComponent - Landing Page
 *
 * Main landing page for CareerRoute platform.
 * Displays hero section with value proposition and call-to-action buttons.
 *
 * Sections (Phase 1 - MVP):
 * - Hero Section: Background image, headline, CTAs, trust indicators
 * - How It Works: 3-step process explanation
 * - Browse Categories: Top 8 categories linking to /categories
 * - Final CTA: Conversion section before footer
 *
 * Future sections (Phase 2):
 * - Featured Mentors
 * - Stats Banner
 * - Why Choose CareerRoute
 * - Testimonials
 *
 * User Journeys:
 * 1. Browse Mentors → /mentors (search/filter)
 * 2. Explore Categories → /categories (category grid)
 *
 * Access: Public (no authentication required)
 * Guards: None
 */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly categoryService = inject(CategoryService);
  private readonly authService = inject(AuthService);
  private destroy$ = new Subject<void>();

  /**
   * Trust indicators displayed in hero section
   */
  trustIndicators = {
    mentors: '1,000+',
    sessions: '10,000+',
    rating: '4.8',
    specializations: '50+'
  };

  /**
   * Top categories to display on home page (limited to 8)
   */
  topCategories: Category[] = [];

  /**
   * Loading state for categories
   */
  categoriesLoading = false;

  /**
   * Whether to show mentor application reminder banner
   * Only shown for authenticated users who started mentor registration but didn't complete application
   */
  showMentorApplicationBanner = false;

  ngOnInit(): void {
    this.loadTopCategories();
    this.checkPendingMentorApplication();

    // Subscribe to auth state changes to update banner visibility
    this.authService.authState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.checkPendingMentorApplication();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load top 8 categories for home page display
   */
  private loadTopCategories(): void {
    this.categoriesLoading = true;
    this.categoryService.getAllCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (categories) => {
          // Take first 8 active categories
          this.topCategories = categories
            .filter(cat => cat.isActive)
            .slice(0, 8);
          this.categoriesLoading = false;
        },
        error: (error) => {
          console.error('Error loading categories:', error);
          this.categoriesLoading = false;
        }
      });
  }

  /**
   * Navigate to browse mentors page
   * Public access, no authentication required
   */
  browseMentors(): void {
    this.router.navigate(['/mentors']);
  }

  /**
   * Navigate to categories page
   * Public access, no authentication required
   */
  exploreCategories(): void {
    this.router.navigate(['/categories']);
  }

  /**
   * Navigate to category mentors page
   * @param categoryId - Category ID to view mentors for
   */
  viewCategory(categoryId: number): void {
    this.router.navigate(['/categories', categoryId, 'mentors']);
  }

  /**
   * Get mentor count display text
   * @param count - Number of mentors
   * @returns Formatted string with mentor count
   */
  getMentorCountText(count: number | null | undefined): string {
    if (!count || count === 0) {
      return 'No mentors';
    }
    return count === 1 ? '1 mentor' : `${count} mentors`;
  }

  /**
   * Check if user has pending mentor application to show reminder banner
   * Only shown if:
   * - User is authenticated
   * - User has pendingMentorApplication flag in localStorage
   *
   * The flag is set when user registers as mentor and is removed when:
   * - User completes application (mentor-application component)
   * - User dismisses banner
   * - User logs in as regular user (cleaned up in login component)
   *
   * Note: We don't check isMentor flag here because it's set during registration,
   * not after application submission. The flag is the source of truth for "needs to apply".
   */
  private checkPendingMentorApplication(): void {
    // Check if user is authenticated
    if (!this.authService.isAuthenticated()) {
      this.showMentorApplicationBanner = false;
      return;
    }

    // Check localStorage for pending mentor application flag
    const pendingMentorApplication = localStorage.getItem('pendingMentorApplication');

    // Show banner only if flag exists
    this.showMentorApplicationBanner = pendingMentorApplication === 'true';
  }

  /**
   * Navigate to mentor application form
   */
  applyAsMentor(): void {
    this.router.navigate(['/user/apply-mentor']);
  }

  /**
   * Dismiss mentor application banner
   * Removes the pendingMentorApplication flag from localStorage
   */
  dismissMentorApplicationBanner(): void {
    localStorage.removeItem('pendingMentorApplication');
    this.showMentorApplicationBanner = false;
  }
}
