import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { tap, catchError, map, shareReplay } from 'rxjs/operators';
import { environment } from '../../../environments/environment.development';
import {
  Category,
  CategoryType,
  CategorySummary,
  CategoryCreateRequest,
  CategoryUpdateRequest,
  getCareerInterestCategories,
  getMentorSpecializationCategories,
  sortCategories,
  getActiveCategories
} from '../../shared/models/category.model';

/**
 * Response wrapper for category API calls
 * Matches the standard API response format from backend
 */
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: { [key: string]: string[] };
  statusCode?: number;
}

/**
 * CategoryService
 *
 * Service for managing categories in the Career Route application.
 * Handles fetching career interests, mentor specializations, and category management.
 *
 * Features:
 * - Get all categories or by type
 * - Get career interests for user profiles
 * - Get mentor specializations
 * - Create and update categories (admin only)
 * - Category caching for performance
 * - Automatic error handling
 * - Integration with backend API
 *
 * @remarks
 * - Categories are cached after first fetch
 * - Public endpoints don't require authentication
 * - Admin endpoints require authentication and admin role
 * - Cache can be refreshed by calling loadCategories() again
 *
 * @example
 * ```typescript
 * // In a component
 * constructor(private categoryService: CategoryService) {}
 *
 * // Get career interests for user profile
 * this.categoryService.getCareerInterests().subscribe(
 *   (interests) => this.availableInterests = interests,
 *   (error) => console.error('Error:', error)
 * );
 *
 * // Get mentor specializations
 * this.categoryService.getMentorSpecializations().subscribe(
 *   (specializations) => this.specializations = specializations
 * );
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
      return this.categories$;
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
      map(response => {
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Failed to fetch categories');
        }
        return response.data;
      }),
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
      catchError(error => {
        this.loadingSubject.next(false);
        return this.handleError('Failed to fetch categories', error);
      }),
      shareReplay(1) // Share the result with all subscribers
    );

    return this.categoriesCache$;
  }

  /**
   * Get categories by type
   *
   * @param type - Category type to filter by
   * @param forceRefresh - Force reload from API
   * @returns Observable of categories matching the type
   *
   * @remarks
   * - Filters from cached categories if available
   * - Returns only active categories
   */
  getCategoriesByType(type: CategoryType, forceRefresh: boolean = false): Observable<Category[]> {
    return this.getAllCategories(forceRefresh).pipe(
      map(categories => categories.filter(cat => cat.type === type))
    );
  }

  /**
   * Get career interest categories
   * Convenience method for getting career interests for user profiles
   *
   * @param forceRefresh - Force reload from API
   * @returns Observable of career interest categories
   *
   * @remarks
   * - Returns only active career interest categories
   * - Sorted by displayOrder and name
   * - Use this for user profile career interests selection
   */
  getCareerInterests(forceRefresh: boolean = false): Observable<Category[]> {
    return this.getAllCategories(forceRefresh).pipe(
      map(categories => getCareerInterestCategories(categories))
    );
  }

  /**
   * Get career interest names only
   * Returns just the names as strings for simple use cases
   *
   * @param forceRefresh - Force reload from API
   * @returns Observable of career interest names
   *
   * @remarks
   * - Returns array of strings (category names)
   * - Useful for dropdowns and multi-select
   * - Maintains sort order
   */
  getCareerInterestNames(forceRefresh: boolean = false): Observable<string[]> {
    return this.getCareerInterests(forceRefresh).pipe(
      map(categories => categories.map(cat => cat.name))
    );
  }

  /**
   * Get mentor specialization categories
   * Convenience method for getting mentor specializations
   *
   * @param forceRefresh - Force reload from API
   * @returns Observable of mentor specialization categories
   *
   * @remarks
   * - Returns only active mentor specialization categories
   * - Sorted by displayOrder and name
   * - Use this for mentor profile specializations
   */
  getMentorSpecializations(forceRefresh: boolean = false): Observable<Category[]> {
    return this.getAllCategories(forceRefresh).pipe(
      map(categories => getMentorSpecializationCategories(categories))
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
   * Get cached career interests (synchronous)
   *
   * @returns Current career interest categories from cache
   */
  getCachedCareerInterests(): Category[] {
    return getCareerInterestCategories(this.categoriesSubject.value);
  }

  /**
   * Get cached career interest names (synchronous)
   *
   * @returns Array of career interest names
   */
  getCachedCareerInterestNames(): string[] {
    return this.getCachedCareerInterests().map(cat => cat.name);
  }

  // ==================== Admin Operations ====================

  /**
   * Create a new category (admin only)
   *
   * @param categoryData - Category data to create
   * @returns Observable of created category
   *
   * @remarks
   * - Requires admin authentication
   * - Returns 401 if not authenticated
   * - Returns 403 if not admin
   * - Automatically refreshes cache after creation
   */
  createCategory(categoryData: CategoryCreateRequest): Observable<Category> {
    return this.http.post<ApiResponse<Category>>(
      this.CATEGORIES_URL,
      categoryData
    ).pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Failed to create category');
        }
        return response.data;
      }),
      tap(() => {
        // Refresh categories cache after creating
        this.getAllCategories(true).subscribe();
      }),
      catchError(error => this.handleError('Failed to create category', error))
    );
  }

  /**
   * Update an existing category (admin only)
   *
   * @param categoryId - ID of category to update
   * @param updateData - Updated category data
   * @returns Observable of updated category
   *
   * @remarks
   * - Requires admin authentication
   * - Returns 401 if not authenticated
   * - Returns 403 if not admin
   * - Returns 404 if category not found
   * - Automatically refreshes cache after update
   */
  updateCategory(categoryId: string, updateData: CategoryUpdateRequest): Observable<Category> {
    return this.http.put<ApiResponse<Category>>(
      `${this.CATEGORIES_URL}/${categoryId}`,
      updateData
    ).pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Failed to update category');
        }
        return response.data;
      }),
      tap(() => {
        // Refresh categories cache after updating
        this.getAllCategories(true).subscribe();
      }),
      catchError(error => this.handleError('Failed to update category', error))
    );
  }

  /**
   * Delete a category (admin only)
   *
   * @param categoryId - ID of category to delete
   * @returns Observable of success response
   *
   * @remarks
   * - Requires admin authentication
   * - Returns 401 if not authenticated
   * - Returns 403 if not admin
   * - Returns 404 if category not found
   * - Automatically refreshes cache after deletion
   */
  deleteCategory(categoryId: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(
      `${this.CATEGORIES_URL}/${categoryId}`
    ).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Failed to delete category');
        }
        return;
      }),
      tap(() => {
        // Refresh categories cache after deleting
        this.getAllCategories(true).subscribe();
      }),
      catchError(error => this.handleError('Failed to delete category', error))
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

  // ==================== Error Handling ====================

  /**
   * Handle API errors with logging
   *
   * @param defaultMessage - Default message to use if error message is not available
   * @param error - The error object
   * @returns Throwable error for upstream handling
   *
   * @remarks
   * - Extracts error message from various error formats
   * - Logs error details for debugging
   * - Returns formatted error to calling component
   */
  private handleError(defaultMessage: string, error: any): Observable<never> {
    let errorMessage = defaultMessage;

    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.error?.errors) {
      // Extract first validation error
      const firstError = Object.values(error.error.errors)[0];
      if (Array.isArray(firstError) && firstError.length > 0) {
        errorMessage = firstError[0];
      }
    } else if (error.message) {
      errorMessage = error.message;
    }

    // Log error for debugging
    console.error('[CategoryService] Error:', errorMessage, error);

    return throwError(() => ({
      ...error,
      message: errorMessage
    }));
  }
}
