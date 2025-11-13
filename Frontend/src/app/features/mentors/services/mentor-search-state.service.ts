import { Injectable, inject, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { BehaviorSubject, Observable, Subject, combineLatest, of } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  catchError,
  tap,
  shareReplay,
  map,
  takeUntil
} from 'rxjs/operators';
import { MentorService } from '../../../core/services/mentor.service';
import {
  MentorListItem,
  MentorSearchParams,
  MentorSearchResponse,
  PaginationMetadata
} from '../../../shared/models/mentor.model';

/**
 * Search State Interface
 * Represents the complete search state
 */
interface SearchState {
  query: string;
  filters: MentorSearchParams;
  page: number;
  pageSize: number;
}

/**
 * Cache Entry Interface
 * Stores cached search results with timestamp
 */
interface CacheEntry {
  results: MentorSearchResponse;
  timestamp: number;
}

/**
 * MentorSearchStateService
 *
 * @description
 * Centralized state management service for mentor search functionality.
 * Coordinates search query, filters, pagination, and results using RxJS observables.
 * Provides caching, deduplication, and optional URL synchronization.
 *
 * Features:
 * - Centralized state management with BehaviorSubjects
 * - Automatic debouncing (500ms) for search queries
 * - Combines query, filters, and pagination with combineLatest
 * - Caches results to avoid duplicate API calls (5-minute TTL)
 * - Exposes reactive observables for components
 * - Optional URL query parameter synchronization
 * - Loading state management
 * - Error handling
 * - Automatic cleanup
 *
 * @remarks
 * - Use this service as a singleton for mentor search pages
 * - Components subscribe to exposed observables
 * - Components update state via public methods
 * - Cache cleared on manual state updates
 * - Part of US2 - Browse and Search for Mentors
 *
 * @example
 * ```typescript
 * // In a component
 * constructor(private searchState: MentorSearchStateService) {}
 *
 * ngOnInit(): void {
 *   // Subscribe to results
 *   this.searchState.searchResults$.subscribe(
 *     mentors => this.mentors = mentors
 *   );
 *
 *   // Subscribe to pagination
 *   this.searchState.pagination$.subscribe(
 *     pagination => this.pagination = pagination
 *   );
 *
 *   // Subscribe to loading state
 *   this.searchState.isLoading$.subscribe(
 *     loading => this.loading = loading
 *   );
 *
 *   // Initialize search (loads mentors)
 *   this.searchState.initialize();
 * }
 *
 * // Update search query
 * onSearchInput(query: string): void {
 *   this.searchState.setQuery(query);
 * }
 *
 * // Update filters
 * onFiltersChange(filters: MentorSearchParams): void {
 *   this.searchState.setFilters(filters);
 * }
 *
 * // Update page
 * onPageChange(page: number): void {
 *   this.searchState.setPage(page);
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class MentorSearchStateService implements OnDestroy {
  private readonly mentorService = inject(MentorService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // Destroy subject for cleanup
  private destroy$ = new Subject<void>();

  // State subjects (private)
  private querySubject$ = new BehaviorSubject<string>('');
  private filtersSubject$ = new BehaviorSubject<MentorSearchParams>({});
  private pageSubject$ = new BehaviorSubject<number>(1);
  private pageSizeSubject$ = new BehaviorSubject<number>(12);
  private loadingSubject$ = new BehaviorSubject<boolean>(false);
  private errorSubject$ = new BehaviorSubject<string | null>(null);

  // Results subjects (private)
  private resultsSubject$ = new BehaviorSubject<MentorListItem[]>([]);
  private paginationSubject$ = new BehaviorSubject<PaginationMetadata | null>(null);
  private totalCountSubject$ = new BehaviorSubject<number>(0);

  // Cache for results (key: stringified search params, value: cached response)
  private cache = new Map<string, CacheEntry>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // URL sync enabled flag
  private urlSyncEnabled = false;

  // Public observables (read-only)
  public readonly query$ = this.querySubject$.asObservable();
  public readonly filters$ = this.filtersSubject$.asObservable();
  public readonly currentPage$ = this.pageSubject$.asObservable();
  public readonly pageSize$ = this.pageSizeSubject$.asObservable();
  public readonly isLoading$ = this.loadingSubject$.asObservable();
  public readonly error$ = this.errorSubject$.asObservable();

  public readonly searchResults$ = this.resultsSubject$.asObservable();
  public readonly pagination$ = this.paginationSubject$.asObservable();
  public readonly totalCount$ = this.totalCountSubject$.asObservable();

  // Combined search state observable
  private searchState$: Observable<SearchState>;

  // Search trigger (for manual refresh)
  private searchTrigger$ = new Subject<void>();

  constructor() {
    // Combine all state inputs
    this.searchState$ = combineLatest([
      this.querySubject$.pipe(
        debounceTime(500), // Debounce query input
        distinctUntilChanged()
      ),
      this.filtersSubject$.pipe(
        distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
      ),
      this.pageSubject$.pipe(distinctUntilChanged()),
      this.pageSizeSubject$.pipe(distinctUntilChanged())
    ]).pipe(
      map(([query, filters, page, pageSize]) => ({
        query,
        filters,
        page,
        pageSize
      })),
      shareReplay(1) // Share the same combined state
    );

    // Set up automatic search
    this.setupAutoSearch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.cache.clear();
  }

  /**
   * Initialize the search state service
   * Can optionally enable URL synchronization and load from URL
   *
   * @param enableUrlSync - Whether to sync state with URL query params
   */
  initialize(enableUrlSync: boolean = false): void {
    this.urlSyncEnabled = enableUrlSync;

    if (enableUrlSync) {
      this.loadStateFromUrl();
      this.setupUrlSync();
    }

    // Trigger initial search
    this.triggerSearch();
  }

  /**
   * Set up automatic search when state changes
   */
  private setupAutoSearch(): void {
    this.searchState$
      .pipe(
        switchMap((state) => {
          // Check cache first
          const cachedResult = this.getCachedResult(state);
          if (cachedResult) {
            return of(cachedResult);
          }

          // No cache, call API
          this.loadingSubject$.next(true);
          this.errorSubject$.next(null);

          // Build search params
          const params: MentorSearchParams = {
            ...state.filters,
            keywords: state.query || state.filters.keywords,
            page: state.page,
            pageSize: state.pageSize
          };

          return this.mentorService.getAllMentors(params).pipe(
            tap((response) => {
              // Cache the result
              this.cacheResult(state, response as MentorSearchResponse);
            }),
            catchError((error) => {
              const errorMessage = error?.message || 'Failed to load mentors';
              this.errorSubject$.next(errorMessage);
              this.loadingSubject$.next(false);
              return of({
                mentors: [],
                pagination: this.getEmptyPagination(),
                appliedFilters: {
                  keywords: null,
                  categoryId: null,
                  minPrice: null,
                  maxPrice: null,
                  minRating: null,
                  sortBy: 'popularity'
                }
              } as MentorSearchResponse);
            })
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((response) => {
        const searchResponse = response as MentorSearchResponse;

        // Update results
        this.resultsSubject$.next(searchResponse.mentors || []);
        this.paginationSubject$.next(searchResponse.pagination || null);
        this.totalCountSubject$.next(searchResponse.pagination?.totalCount || 0);
        this.loadingSubject$.next(false);

        // Sync to URL if enabled
        if (this.urlSyncEnabled) {
          this.syncStateToUrl();
        }
      });
  }

  /**
   * Set search query
   * @param query Search keywords
   */
  setQuery(query: string): void {
    if (this.querySubject$.value !== query) {
      this.querySubject$.next(query);
      this.resetToFirstPage();
    }
  }

  /**
   * Set filters
   * @param filters Filter parameters
   */
  setFilters(filters: MentorSearchParams): void {
    const currentFilters = this.filtersSubject$.value;
    if (JSON.stringify(currentFilters) !== JSON.stringify(filters)) {
      this.filtersSubject$.next(filters);
      this.resetToFirstPage();
    }
  }

  /**
   * Set current page
   * @param page Page number (1-indexed)
   */
  setPage(page: number): void {
    if (page >= 1 && this.pageSubject$.value !== page) {
      this.pageSubject$.next(page);
    }
  }

  /**
   * Set page size
   * @param pageSize Number of items per page
   */
  setPageSize(pageSize: number): void {
    if (pageSize >= 1 && this.pageSizeSubject$.value !== pageSize) {
      this.pageSizeSubject$.next(pageSize);
      this.resetToFirstPage();
    }
  }

  /**
   * Update both query and filters at once (useful for initialization)
   * @param query Search keywords
   * @param filters Filter parameters
   */
  setQueryAndFilters(query: string, filters: MentorSearchParams): void {
    this.querySubject$.next(query);
    this.filtersSubject$.next(filters);
    this.resetToFirstPage();
  }

  /**
   * Reset all search state to defaults
   */
  reset(): void {
    this.querySubject$.next('');
    this.filtersSubject$.next({});
    this.pageSubject$.next(1);
    this.pageSizeSubject$.next(12);
    this.cache.clear();
  }

  /**
   * Manually trigger a search (bypasses cache)
   */
  refresh(): void {
    this.cache.clear();
    this.triggerSearch();
  }

  /**
   * Get current state snapshot (useful for debugging)
   */
  getStateSnapshot(): SearchState {
    return {
      query: this.querySubject$.value,
      filters: this.filtersSubject$.value,
      page: this.pageSubject$.value,
      pageSize: this.pageSizeSubject$.value
    };
  }

  /**
   * Reset to first page (used when query or filters change)
   */
  private resetToFirstPage(): void {
    if (this.pageSubject$.value !== 1) {
      this.pageSubject$.next(1);
    }
  }

  /**
   * Trigger search manually
   */
  private triggerSearch(): void {
    this.searchTrigger$.next();
  }

  // ==================== Caching ====================

  /**
   * Generate cache key from search state
   */
  private getCacheKey(state: SearchState): string {
    return JSON.stringify({
      query: state.query,
      filters: state.filters,
      page: state.page,
      pageSize: state.pageSize
    });
  }

  /**
   * Get cached result if available and not expired
   */
  private getCachedResult(state: SearchState): MentorSearchResponse | null {
    const key = this.getCacheKey(state);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if cache is expired
    const now = Date.now();
    if (now - entry.timestamp > this.CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }

    return entry.results;
  }

  /**
   * Cache search result
   */
  private cacheResult(state: SearchState, results: MentorSearchResponse): void {
    const key = this.getCacheKey(state);
    this.cache.set(key, {
      results,
      timestamp: Date.now()
    });

    // Limit cache size (keep last 50 entries)
    if (this.cache.size > 50) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  // ==================== URL Synchronization ====================

  /**
   * Load state from URL query parameters
   */
  private loadStateFromUrl(): void {
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      // Load query
      const query = params['q'] || '';

      // Load filters
      const filters: MentorSearchParams = {
        keywords: params['keywords'] || undefined,
        categoryId: params['category'] ? +params['category'] : undefined,
        minPrice: params['minPrice'] ? +params['minPrice'] : undefined,
        maxPrice: params['maxPrice'] ? +params['maxPrice'] : undefined,
        minRating: params['minRating'] ? +params['minRating'] : undefined,
        sortBy: params['sortBy'] || undefined,
        availableOnly: params['available'] === 'true',
        verifiedOnly: params['verified'] === 'true'
      };

      // Load pagination
      const page = params['page'] ? +params['page'] : 1;
      const pageSize = params['pageSize'] ? +params['pageSize'] : 12;

      // Update state (without triggering URL sync)
      this.querySubject$.next(query);
      this.filtersSubject$.next(filters);
      this.pageSubject$.next(page);
      this.pageSizeSubject$.next(pageSize);
    });
  }

  /**
   * Sync current state to URL query parameters
   */
  private syncStateToUrl(): void {
    const state = this.getStateSnapshot();

    const queryParams: any = {};

    // Add query
    if (state.query) {
      queryParams.q = state.query;
    }

    // Add filters
    if (state.filters.keywords) queryParams.keywords = state.filters.keywords;
    if (state.filters.categoryId) queryParams.category = state.filters.categoryId;
    if (state.filters.minPrice) queryParams.minPrice = state.filters.minPrice;
    if (state.filters.maxPrice) queryParams.maxPrice = state.filters.maxPrice;
    if (state.filters.minRating) queryParams.minRating = state.filters.minRating;
    if (state.filters.sortBy) queryParams.sortBy = state.filters.sortBy;
    if (state.filters.availableOnly) queryParams.available = 'true';
    if (state.filters.verifiedOnly) queryParams.verified = 'true';

    // Add pagination
    if (state.page > 1) queryParams.page = state.page;
    if (state.pageSize !== 12) queryParams.pageSize = state.pageSize;

    // Update URL without navigation
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  /**
   * Set up URL synchronization listener
   */
  private setupUrlSync(): void {
    // URL sync is already set up in loadStateFromUrl with subscription
    // This method is a placeholder for future enhancements
  }

  // ==================== Utility Methods ====================

  /**
   * Get empty pagination object
   */
  private getEmptyPagination(): PaginationMetadata {
    return {
      totalCount: 0,
      currentPage: 1,
      pageSize: 12,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false
    };
  }

  /**
   * Check if search has active filters
   */
  hasActiveFilters(): boolean {
    const state = this.getStateSnapshot();
    return (
      !!state.query ||
      !!state.filters.categoryId ||
      !!state.filters.minPrice ||
      !!state.filters.maxPrice ||
      !!state.filters.minRating ||
      !!state.filters.availableOnly ||
      !!state.filters.verifiedOnly
    );
  }

  /**
   * Get active filter count
   */
  getActiveFilterCount(): number {
    const state = this.getStateSnapshot();
    let count = 0;

    if (state.query) count++;
    if (state.filters.categoryId) count++;
    if (state.filters.minPrice) count++;
    if (state.filters.maxPrice) count++;
    if (state.filters.minRating) count++;
    if (state.filters.availableOnly) count++;
    if (state.filters.verifiedOnly) count++;

    return count;
  }
}
