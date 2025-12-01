import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Observable, Subject, takeUntil } from 'rxjs';
import { CategoryService } from '../../../core/services/category.service';
import { Category } from '../../../shared/models/category.model';

/**
 * CategoryBrowseComponent
 *
 * Displays categories in a responsive grid layout for browsing mentors by specialization.
 * This component is part of User Story 2 - Browse and Search for Mentors.
 *
 * Features:
 * - Grid view of all available categories
 * - Shows category icon, name, description, and mentor count
 * - Responsive design (mobile, tablet, desktop)
 * - Loading states and error handling
 * - Navigation to category mentor lists
 * - Follows CareerRoute-MVP-Design specifications
 *
 * @example
 * ```html
 * <app-category-browse></app-category-browse>
 * ```
 *
 * @remarks
 * - Uses CategoryService for data fetching
 * - Categories are cached for performance
 * - Integrates with existing routing system
 * - Part of US2 implementation (Task T095)
 * - Styled with Tailwind CSS and primary color #1193d4
 */
@Component({
  selector: 'app-category-browse',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './category-browse.component.html',
  styleUrls: ['./category-browse.component.css']
})
export class CategoryBrowseComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly categoryService = inject(CategoryService);

  // Observable streams
  categories$: Observable<Category[]> = new Observable<Category[]>();
  loading$: Observable<boolean> = new Observable<boolean>();

  // Component state
  categories: Category[] = [];
  loading: boolean = false;
  error: string | null = null;

  // Private subjects for cleanup
  private destroy$ = new Subject<void>();

  constructor() {
    // Initialize observables from service
    this.categories$ = this.categoryService.categories$;
    this.loading$ = this.categoryService.loading$;
  }

  ngOnInit(): void {
    this.loadCategories();
    this.subscribeToDataStreams();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load categories from the service
   * Uses cached data if available
   */
  private loadCategories(): void {
    this.categoryService.getAllCategories().subscribe({
      error: (error) => {
        console.error('Error loading categories:', error);
        this.error = 'Failed to load categories. Please try again.';
      }
    });
  }

  /**
   * Subscribe to data streams from CategoryService
   */
  private subscribeToDataStreams(): void {
    this.categories$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (categories) => {
        this.categories = categories;
      }
    });

    this.loading$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (loading) => {
        this.loading = loading;
      }
    });
  }

  /**
   * Navigate to the mentor list for a specific category
   * @param category - The category to browse mentors for
   */
  onCategoryClick(category: Category): void {
    if (!category?.id) {
      console.error('Invalid category selected');
      return;
    }

    // Navigate to mentor list with category filter
    this.router.navigate(['/mentors'], {
      queryParams: {
        categoryId: category.id,
        categoryName: category.name
      }
    });
  }

  /**
   * Refresh categories from the API
   * Forces a reload bypassing cache
   */
  refreshCategories(): void {
    this.error = null;
    this.categoryService.refreshCategories().subscribe({
      error: (error) => {
        console.error('Error refreshing categories:', error);
        this.error = 'Failed to refresh categories. Please try again.';
      }
    });
  }

  /**
   * Get display icon for category
   * Falls back to default icon if none provided
   * @param category - Category to get icon for
   * @returns Icon string (emoji or default)
   */
  getCategoryIcon(category: Category): string {
    return category.iconUrl || '📚';
  }

  /**
   * Get mentor count text for display
   * @param category - Category to get mentor count for
   * @returns Formatted mentor count string
   */
  getMentorCountText(category: Category): string {
    const count = category.mentorCount || 0;
    if (count === 0) {
      return 'No mentors available';
    } else if (count === 1) {
      return '1 mentor available';
    } else {
      return `${count} mentors available`;
    }
  }

  /**
   * Navigate to browse all mentors page
   */
  onBrowseAllMentors(): void {
    this.router.navigate(['/mentors']);
  }

  /**
   * Track categories by ID for ngFor optimization
   * @param index - Array index
   * @param category - Category object
   * @returns Category ID
   */
  trackByCategoryId(index: number, category: Category): number {
    return category.id;
  }
}
