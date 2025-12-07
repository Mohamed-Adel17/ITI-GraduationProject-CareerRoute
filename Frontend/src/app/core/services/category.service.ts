import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, map, shareReplay, take } from 'rxjs/operators';
import { environment } from '../../../environments/environment.development';
import {
  Category,
  CategorySummary,
  CategoryMentorsResponse,
  CategoryMentorsParams,
  sortCategories,
  getActiveCategories,
  getCategoryNames
} from '../../shared/models/category.model';
import { ApiResponse, unwrapResponse } from '../../shared/models/api-response.model';

/**
 * CategoryService
 *
 * Service for managing categories in the Career Route application.
 * Categories represent unified areas of expertise used for both user career interests
 * and mentor specializations, simplifying the matching process.
 *
 * Features:
 * - Get all categories (unified system)
 * - Get single category by ID
 * - Get mentors by category with filtering and pagination
 * - Category caching for performance
 * - Integration with backend API
 *
 * @remarks
 * - Categories are cached after first fetch
 * - All endpoints are public (no authentication required)
 * - Cache can be refreshed by calling refreshCategories()
 * - Same categories used for both user interests and mentor specializations
 * - Error handling is done globally by errorInterceptor
 * - Uses shared unwrapResponse utility from api-response.model.ts
 * - Based on Category-Endpoints.md contract (endpoints 1, 2, 6)
 *
 * @example
 * ```typescript
 * // In a component
 * constructor(private categoryService: CategoryService) {}
 *
 * // Get all categories - errors handled automatically
 * this.categoryService.getAllCategories().subscribe(
 *   (categories) => this.availableCategories = categories
 * );
 *
 * // Get single category
 * this.categoryService.getCategoryById(1).subscribe(
 *   (category) => this.category = category
 * );
 *
 * // Get mentors by category
 * this.categoryService.getMentorsByCategory(1, { page: 1, minRating: 4.0 }).subscribe({
 *   next: (response) => {
 *     this.mentors = response.mentors;
 *     this.pagination = response.pagination;
 *   }
 * });
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private readonly http = inject(HttpClient);

  // API endpoints
  private readonly API_URL = environment.apiUrl;
  private readonly CATEGORIES_URL = `${this.API_URL}/categories`;

  // Categories cache
  private categoriesSubject = new BehaviorSubject<Category[]>([]);
  public categories$ = this.categoriesSubject.asObservable();

  // Loading state
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  // Cache flag to track if categories have been loaded
  private categoriesLoaded = false;

  // Cached observable for sharing data across multiple subscribers
  private categoriesCache$?: Observable<Category[]>;

  // ==================== Get Categories ====================

  /**
   * Get all categories
   *
   * @param forceRefresh - Force reload from API, ignoring cache
   * @returns Observable of all categories
   *
   * @remarks
   * - Returns cached categories if available
   * - Use forceRefresh=true to reload from API
   * - Categories are sorted by displayOrder and name
   * - Only returns active categories by default
   */
  getAllCategories(forceRefresh: boolean = false): Observable<Category[]> {
    // Return cached categories if available and not forcing refresh
    if (this.categoriesLoaded && !forceRefresh) {
      return this.categories$.pipe(take(1));
    }

    // If already loading, reuse the existing observable
    if (this.categoriesCache$ && !forceRefresh) {
      return this.categoriesCache$;
    }

    // Load categories from API
    this.loadingSubject.next(true);

    this.categoriesCache$ = this.http.get<ApiResponse<Category[]>>(
      this.CATEGORIES_URL
    ).pipe(
      map(response => unwrapResponse(response)),
      map(categories => {
        // Filter active categories and sort them
        const activeCategories = getActiveCategories(categories);
        return sortCategories(activeCategories);
      }),
      tap(categories => {
        this.categoriesSubject.next(categories);
        this.categoriesLoaded = true;
        this.loadingSubject.next(false);
      }),
      shareReplay(1) // Share the result with all subscribers
    );

    return this.categoriesCache$;
  }

  /**
   * Get category names only
   * Returns just the names as strings for simple use cases
   *
   * @param forceRefresh - Force reload from API
   * @returns Observable of category names
   *
   * @remarks
   * - Returns array of strings (category names)
   * - Useful for dropdowns and multi-select
   * - Maintains sort order
   */
  getCategoryNames(forceRefresh: boolean = false): Observable<string[]> {
    return this.getAllCategories(forceRefresh).pipe(
      map(categories => getCategoryNames(categories))
    );
  }

  /**
   * Get cached categories (synchronous)
   *
   * @returns Current categories from cache
   *
   * @remarks
   * - Returns immediately without API call
   * - Returns empty array if not loaded yet
   * - Use getAllCategories() to fetch from API first
   */
  getCachedCategories(): Category[] {
    return this.categoriesSubject.value;
  }

  /**
   * Get cached category names (synchronous)
   *
   * @returns Array of category names from cache
   *
   * @remarks
   * - Returns immediately without API call
   * - Returns empty array if not loaded yet
   */
  getCachedCategoryNames(): string[] {
    return getCategoryNames(this.categoriesSubject.value);
  }

  // ==================== Get Single Category ====================

  /**
   * Get a single category by ID
   *
   * @param categoryId - Category ID to fetch
   * @returns Observable of category
   *
   * @remarks
   * - Endpoint: GET /api/categories/{id}
   * - Public endpoint (no authentication required)
   * - Returns 404 if category doesn't exist or is inactive
   *
   * @example
   * ```typescript
   * this.categoryService.getCategoryById(1).subscribe({
   *   next: (category) => console.log('Category:', category),
   *   error: (error) => console.error('Error:', error)
   * });
   * ```
   */
  getCategoryById(categoryId: number): Observable<Category> {
    return this.http.get<ApiResponse<Category>>(
      `${this.CATEGORIES_URL}/${categoryId}`
    ).pipe(
      map(response => unwrapResponse(response))
    );
  }

  // ==================== Get Mentors by Category ====================

  /**
   * Get mentors in a specific category with filtering and pagination
   *
   * @param categoryId - Category ID
   * @param params - Query parameters for filtering, sorting, and pagination
   * @returns Observable of category mentors response
   *
   * @remarks
   * - Endpoint: GET /api/categories/{id}/mentors
   * - Public endpoint (no authentication required)
   * - Only returns approved and available mentors
   * - Supports pagination (default 10 per page, max 50)
   * - Default sort: rating (highest first)
   * - Returns 404 if category doesn't exist
   *
   * @example
   * ```typescript
   * this.categoryService.getMentorsByCategory(1, {
   *   page: 1,
   *   pageSize: 10,
   *   sortBy: 'rating',
   *   minRating: 4.0,
   *   keywords: 'react'
   * }).subscribe({
   *   next: (response) => {
   *     this.mentors = response.mentors;
   *     this.pagination = response.pagination;
   *     this.category = response.category;
   *   },
   *   error: (error) => console.error('Error:', error)
   * });
   * ```
   */
  getMentorsByCategory(
    categoryId: number,
    params?: CategoryMentorsParams
  ): Observable<CategoryMentorsResponse> {
    // Build query parameters
    let httpParams = new HttpParams();

    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.pageSize) httpParams = httpParams.set('pageSize', params.pageSize.toString());
      if (params.sortBy) httpParams = httpParams.set('sortBy', params.sortBy);
      if (params.sortOrder) httpParams = httpParams.set('sortOrder', params.sortOrder);
      if (params.minPrice !== undefined) httpParams = httpParams.set('minPrice', params.minPrice.toString());
      if (params.maxPrice !== undefined) httpParams = httpParams.set('maxPrice', params.maxPrice.toString());
      if (params.minRating !== undefined) httpParams = httpParams.set('minRating', params.minRating.toString());
      if (params.keywords) httpParams = httpParams.set('keywords', params.keywords);
    }

    return this.http.get<ApiResponse<CategoryMentorsResponse>>(
      `${this.CATEGORIES_URL}/${categoryId}/mentors`,
      { params: httpParams }
    ).pipe(
      map(response => unwrapResponse(response))
    );
  }

  // ==================== Helper Methods ====================

  /**
   * Refresh categories from API
   *
   * @remarks
   * - Forces reload from API
   * - Clears cache before loading
   * - Use when you need fresh data
   */
  refreshCategories(): Observable<Category[]> {
    this.categoriesLoaded = false;
    this.categoriesCache$ = undefined;
    return this.getAllCategories(true);
  }

  /**
   * Clear categories cache
   *
   * @remarks
   * - Clears all cached categories
   * - Next getAllCategories() will fetch from API
   */
  clearCache(): void {
    this.categoriesSubject.next([]);
    this.categoriesLoaded = false;
    this.categoriesCache$ = undefined;
  }

  /**
   * Check if categories are loaded
   *
   * @returns True if categories have been loaded from API
   */
  areCategoriesLoaded(): boolean {
    return this.categoriesLoaded;
  }

  // ==================== Admin CRUD Operations ====================

  /**
   * Get all categories including inactive (Admin only)
   * Note: Requires backend to support ?includeInactive=true parameter
   */
  getAllCategoriesForAdmin(): Observable<Category[]> {
    return this.http.get<ApiResponse<Category[]>>(
      `${this.CATEGORIES_URL}?includeInactive=true`
    ).pipe(
      map(response => unwrapResponse(response))
    );
  }

  /**
   * Create a new category (Admin only)
   */
  createCategory(data: { name: string; description?: string; iconUrl?: string }): Observable<Category> {
    return this.http.post<ApiResponse<Category>>(this.CATEGORIES_URL, data).pipe(
      map(response => unwrapResponse(response)),
      tap(() => this.refreshCategories())
    );
  }

  /**
   * Update a category (Admin only)
   */
  updateCategory(id: number, data: { name?: string; description?: string; iconUrl?: string; isActive?: boolean }): Observable<Category> {
    return this.http.put<ApiResponse<Category>>(`${this.CATEGORIES_URL}/${id}`, data).pipe(
      map(response => unwrapResponse(response)),
      tap(() => this.refreshCategories())
    );
  }

  /**
   * Delete a category (Admin only)
   */
  deleteCategory(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.CATEGORIES_URL}/${id}`).pipe(
      map(response => unwrapResponse(response)),
      tap(() => this.refreshCategories())
    );
  }

}
