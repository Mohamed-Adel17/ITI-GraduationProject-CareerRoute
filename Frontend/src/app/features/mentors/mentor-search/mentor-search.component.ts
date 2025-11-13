import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MentorSearchStateService } from '../services/mentor-search-state.service';
import { CategoryService } from '../../../core/services/category.service';
import { MentorListComponent } from '../mentor-list/mentor-list.component';
import { FiltersPanelComponent } from '../filters-panel/filters-panel.component';
import { MentorListItem, MentorSearchParams } from '../../../shared/models/mentor.model';
import { PaginationMetadata } from '../../../shared/models/mentor.model';
import { Category } from '../../../shared/models/category.model';

/**
 * MentorSearchComponent
 *
 * @description
 * Main search page that orchestrates the mentor discovery interface.
 * Coordinates search bar, filters panel, and mentor results list using centralized state management.
 *
 * Features:
 * - Search input with debounce (handled by SearchState service)
 * - Toggle filters panel (mobile: slide-in drawer, desktop: sidebar)
 * - Display active filter count badge
 * - Show result count ("Showing 24 of 156 mentors")
 * - Responsive layout (sidebar on desktop, drawer on mobile)
 * - Loading states for all sections
 * - Empty state when no results
 * - URL synchronization for shareable searches
 * - Integration with MentorSearchStateService for reactive state
 *
 * @remarks
 * - Route: `/mentors/search` or `/mentors`
 * - Uses MentorSearchStateService for centralized state management
 * - Integrates FiltersPanelComponent for filters
 * - Integrates MentorListComponent for results display
 * - Part of US2 - Browse and Search for Mentors
 * - All search logic delegated to MentorSearchStateService
 *
 * @example
 * ```typescript
 * // Route configuration
 * {
 *   path: 'mentors',
 *   component: MentorSearchComponent
 * }
 * ```
 */
@Component({
  selector: 'app-mentor-search',
  standalone: true,
  imports: [
    CommonModule,
    MentorListComponent,
    FiltersPanelComponent
  ],
  templateUrl: './mentor-search.component.html',
  styleUrls: ['./mentor-search.component.css']
})
export class MentorSearchComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Component state from observables
  mentors: MentorListItem[] = [];
  pagination: PaginationMetadata | null = null;
  totalCount: number = 0;
  currentPage: number = 1;
  pageSize: number = 12;
  loading: boolean = false;
  error: string | null = null;
  searchQuery: string = '';
  currentFilters: MentorSearchParams = {};

  // Categories for filters
  categories: Category[] = [];
  categoriesLoading: boolean = false;

  // UI state
  filtersOpen: boolean = false;
  activeFilterCount: number = 0;

  constructor(
    public searchState: MentorSearchStateService,
    private categoryService: CategoryService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Load categories for filter dropdown
    this.loadCategories();

    // Subscribe to search state observables
    this.subscribeToSearchState();

    // Initialize search state with URL synchronization
    this.searchState.initialize(true);

    // Check if there's a category filter from route params (e.g., from category page)
    this.checkCategoryFromRoute();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load categories for filter dropdown
   */
  private loadCategories(): void {
    this.categoriesLoading = true;
    this.categoryService.getAllCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (categories) => {
          this.categories = categories;
          this.categoriesLoading = false;
        },
        error: (error) => {
          console.error('Failed to load categories:', error);
          this.categoriesLoading = false;
        }
      });
  }

  /**
   * Subscribe to all search state observables
   */
  private subscribeToSearchState(): void {
    // Subscribe to search results
    this.searchState.searchResults$
      .pipe(takeUntil(this.destroy$))
      .subscribe(mentors => {
        this.mentors = mentors;
      });

    // Subscribe to pagination
    this.searchState.pagination$
      .pipe(takeUntil(this.destroy$))
      .subscribe(pagination => {
        this.pagination = pagination;
      });

    // Subscribe to total count
    this.searchState.totalCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => {
        this.totalCount = count;
      });

    // Subscribe to current page
    this.searchState.currentPage$
      .pipe(takeUntil(this.destroy$))
      .subscribe(page => {
        this.currentPage = page;
      });

    // Subscribe to page size
    this.searchState.pageSize$
      .pipe(takeUntil(this.destroy$))
      .subscribe(size => {
        this.pageSize = size;
      });

    // Subscribe to loading state
    this.searchState.isLoading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.loading = loading;
      });

    // Subscribe to error state
    this.searchState.error$
      .pipe(takeUntil(this.destroy$))
      .subscribe(error => {
        this.error = error;
      });

    // Subscribe to query (for search input binding)
    this.searchState.query$
      .pipe(takeUntil(this.destroy$))
      .subscribe(query => {
        this.searchQuery = query;
      });

    // Subscribe to filters (for filter count and initial values)
    this.searchState.filters$
      .pipe(takeUntil(this.destroy$))
      .subscribe(filters => {
        this.currentFilters = filters;
        this.activeFilterCount = this.searchState.getActiveFilterCount();
      });
  }

  /**
   * Check if there's a category ID in route params (from category page navigation)
   */
  private checkCategoryFromRoute(): void {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const categoryId = params['categoryId'];
        if (categoryId) {
          this.searchState.setFilters({ ...this.currentFilters, categoryId: +categoryId });
        }
      });
  }

  // ==================== Event Handlers ====================

  /**
   * Handle search input changes
   */
  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchState.setQuery(input.value);
  }

  /**
   * Handle filters change from FiltersPanelComponent
   */
  onFiltersChange(filters: MentorSearchParams): void {
    this.searchState.setFilters(filters);
    // Close filters panel on mobile after applying
    if (this.isMobileView()) {
      this.filtersOpen = false;
    }
  }

  /**
   * Handle page change from PaginationComponent
   */
  onPageChange(page: number): void {
    this.searchState.setPage(page);
    // Scroll to top on page change
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Handle page size change
   */
  onPageSizeChange(pageSize: number): void {
    this.searchState.setPageSize(pageSize);
  }

  /**
   * Toggle filters panel (mobile)
   */
  toggleFilters(): void {
    this.filtersOpen = !this.filtersOpen;
  }

  /**
   * Close filters panel (mobile)
   */
  closeFilters(): void {
    this.filtersOpen = false;
  }

  /**
   * Reset all filters to default
   */
  resetFilters(): void {
    this.searchState.reset();
  }

  /**
   * Refresh search results (clears cache)
   */
  refreshResults(): void {
    this.searchState.refresh();
  }

  // ==================== Utility Methods ====================

  /**
   * Check if current view is mobile (for responsive UI)
   */
  isMobileView(): boolean {
    return window.innerWidth < 768; // Tailwind md breakpoint
  }

  /**
   * Get display text for result count
   */
  getResultCountText(): string {
    if (this.loading) {
      return 'Loading...';
    }

    if (this.totalCount === 0) {
      return 'No mentors found';
    }

    const start = (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage * this.pageSize, this.totalCount);

    if (this.totalCount === 1) {
      return '1 mentor found';
    }

    return `Showing ${start}-${end} of ${this.totalCount} mentors`;
  }

  /**
   * Check if any filters are active
   */
  hasActiveFilters(): boolean {
    return this.searchState.hasActiveFilters();
  }

  /**
   * Get active filter count for badge
   */
  getActiveFilterCount(): number {
    return this.activeFilterCount;
  }

  /**
   * Clear search query
   */
  clearSearch(): void {
    this.searchState.setQuery('');
  }
}
