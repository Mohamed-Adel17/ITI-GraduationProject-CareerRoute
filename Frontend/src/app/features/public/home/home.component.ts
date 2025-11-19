import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { CategoryService } from '../../../core/services/category.service';
import { AuthService } from '../../../core/services/auth.service';
import { Category } from '../../../shared/models/category.model';
import { UserRole } from '../../../shared/models/user.model';

/**
 * HomeComponent - Landing Page
 *
 * Main landing page for CareerRoute platform.
 * Displays hero section with value proposition and call-to-action buttons.
 *
 * Sections (Phase 1 - MVP):
 * - Hero Section: Background image, headline, CTAs, trust indicators
 * - How It Works: 3-step process explanation
 * - Browse Categories: Top 8 categories linking to /mentors with category filter
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
 * 2. Browse All Categories → /categories (category grid)
 * 3. View Category Mentors → /mentors?categoryId={id}&categoryName={name}
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
   * Determines whether to show the "Become a Mentor" button
   * Shows if user is authenticated AND (has isMentor flag OR doesn't have Mentor role yet)
   * Hides if user is not authenticated OR already has Mentor role (approved)
   */
  get showBecomeAMentorButton(): boolean {
    // Only show for authenticated users
    if (!this.authService.isAuthenticated()) {
      return false;
    }

    const user = this.authService.getCurrentUser();
    if (!user) {
      return false;
    }

    // Show button if:
    // 1. User has isMentor flag (registered as mentor but not submitted application OR submitted but not approved)
    // 2. User doesn't have Mentor role yet (not approved)
    const hasIsMentorFlag = this.authService.isMentor();
    const hasMentorRole = this.authService.hasRole(UserRole.Mentor);

    // Show if user is a mentor (isMentor=true) but not approved yet (no Mentor role)
    return hasIsMentorFlag && !hasMentorRole;
  }

  ngOnInit(): void {
    this.loadTopCategories();
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
   * Navigate to mentor application page
   * Requires authentication (protected by authGuard on route)
   */
  becomeMentor(): void {
    this.router.navigate(['/user/apply-mentor']);
  }

  /**
   * Navigate to categories page
   * Public access, no authentication required
   */
  exploreCategories(): void {
    this.router.navigate(['/categories']);
  }

  /**
   * Navigate to mentor list with category filter
   * @param category - Category to view mentors for
   */
  viewCategory(category: Category): void {
    if (!category?.id) {
      console.error('Invalid category selected');
      return;
    }

    // Navigate to mentor list with category filter
    this.router.navigate(['/mentors'], {
      queryParams: {
        categoryId: category.id,
      }
    });
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
}
