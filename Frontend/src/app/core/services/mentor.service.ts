import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment.development';
import { ApiResponse, unwrapResponse } from '../../shared/models/api-response.model';
import {
  Mentor,
  MentorListItem,
  MentorDetail,
  MentorSearchParams,
  MentorSearchResponse,
  MentorApplication,
  MentorProfileUpdate
} from '../../shared/models/mentor.model';

/**
 * MentorService
 *
 * Service for mentor browsing, discovery, and profile management in the Career Route application.
 * Provides both public and authenticated endpoints for mentor operations.
 *
 * **Public Endpoints (No Authentication Required):**
 * 1. Get all approved mentors with filtering and pagination
 * 2. Search mentors by keywords
 * 3. Get top-rated mentors
 * 4. Get mentor profile details by ID
 *
 * **Authenticated Endpoints (Require Bearer Token):**
 * 7. Apply to become a mentor
 * 8. Update mentor profile (own profile or admin)
 *
 * Features:
 * - Browse all approved mentors with advanced filtering
 * - Search mentors by keywords (name, bio, expertise)
 * - Filter by price range, rating, category
 * - Sort by popularity, rating, price
 * - Pagination support
 * - Get top-rated mentors
 * - View detailed mentor profiles
 * - Apply to become a mentor (authenticated)
 * - Update mentor profile (authenticated)
 * - Based on Mentor-Endpoints.md contract
 *
 * @remarks
 * - Public endpoints return only approved mentors
 * - Authenticated endpoints require Bearer token (handled by authInterceptor)
 * - Follows Angular standalone service pattern
 * - Uses ApiResponse wrapper for consistent error handling
 * - Error handling delegated to errorInterceptor
 * - Uses shared unwrapResponse() utility for consistent error handling
 *
 * @example
 * ```typescript
 * // In a component
 * constructor(private mentorService: MentorService) {}
 *
 * // Public: Get all mentors with pagination
 * this.mentorService.getAllMentors({ page: 1, pageSize: 12 }).subscribe(
 *   (response) => {
 *     this.mentors = response.mentors;
 *     this.pagination = response.pagination;
 *   }
 * );
 *
 * // Public: Search mentors
 * this.mentorService.searchMentors('react').subscribe(
 *   (mentors) => this.searchResults = mentors
 * );
 *
 * // Authenticated: Apply to become mentor
 * this.mentorService.applyToBecomeMentor(applicationData).subscribe(
 *   (mentor) => this.mentorProfile = mentor
 * );
 *
 * // Authenticated: Update mentor profile
 * this.mentorService.updateMentorProfile(mentorId, updates).subscribe(
 *   (mentor) => this.updatedProfile = mentor
 * );
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class MentorService {
  private readonly http = inject(HttpClient);

  // API endpoints
  private readonly API_URL = environment.apiUrl;
  private readonly MENTORS_URL = `${this.API_URL}/mentors`;

  // ==================== Public Endpoints ====================

  /**
   * Get all approved mentors with filtering and pagination
   *
   * Endpoint: GET /api/mentors
   * Based on Mentor-Endpoints.md - Endpoint #1
   *
   * @param params - Optional search and filter parameters
   * @returns Observable of mentors array or paginated response
   *
   * @remarks
   * - Public endpoint (no authentication required)
   * - Returns all approved mentors if no params provided
   * - Returns paginated response if page/pageSize provided
   * - Supports filtering by keywords, category, price, rating
   * - Supports sorting by popularity, rating, price
   * - Only returns approved and verified mentors
   *
   * Response Structure:
   * - Without pagination: ApiResponse<MentorListItem[]>
   * - With pagination: ApiResponse<MentorSearchResponse> (includes pagination metadata and appliedFilters)
   *
   * @example
   * ```typescript
   * // Get all mentors without pagination
   * this.mentorService.getAllMentors().subscribe(
   *   (mentors) => this.allMentors = mentors
   * );
   *
   * // Get mentors with pagination
   * this.mentorService.getAllMentors({ page: 1, pageSize: 12 }).subscribe(
   *   (response) => {
   *     this.mentors = response.mentors;
   *     this.pagination = response.pagination;
   *     this.appliedFilters = response.appliedFilters;
   *   }
   * );
   *
   * // Advanced filtering
   * this.mentorService.getAllMentors({
   *   keywords: 'react',
   *   categoryId: 1,
   *   minPrice: 20,
   *   maxPrice: 50,
   *   minRating: 4.5,
   *   sortBy: 'rating',
   *   page: 1,
   *   pageSize: 12
   * }).subscribe(response => {
   *   this.mentors = response.mentors;
   *   this.totalPages = response.pagination.totalPages;
   * });
   * ```
   */
  getAllMentors(params?: MentorSearchParams): Observable<MentorListItem[] | MentorSearchResponse> {
    let httpParams = new HttpParams();

    if (params) {
      if (params.keywords) httpParams = httpParams.set('keywords', params.keywords);
      if (params.categoryId) httpParams = httpParams.set('categoryId', params.categoryId.toString());
      if (params.minPrice !== undefined) httpParams = httpParams.set('minPrice', params.minPrice.toString());
      if (params.maxPrice !== undefined) httpParams = httpParams.set('maxPrice', params.maxPrice.toString());
      if (params.minRating !== undefined) httpParams = httpParams.set('minRating', params.minRating.toString());
      if (params.sortBy) httpParams = httpParams.set('sortBy', params.sortBy);
      if (params.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
      if (params.pageSize !== undefined) httpParams = httpParams.set('pageSize', params.pageSize.toString());
      if (params.verifiedOnly !== undefined) httpParams = httpParams.set('verifiedOnly', params.verifiedOnly.toString());
      if (params.availableOnly !== undefined) httpParams = httpParams.set('availableOnly', params.availableOnly.toString());
    }

    const url = `${this.MENTORS_URL}?${httpParams.toString()}`;
    console.log('🌐 MentorService calling API:', url);

    return this.http.get<ApiResponse<MentorListItem[] | MentorSearchResponse>>(
      this.MENTORS_URL,
      { params: httpParams }
    ).pipe(
      map(response => {
        console.log('📥 MentorService received raw response:', response);
        const unwrapped = unwrapResponse(response);
        console.log('📦 MentorService unwrapped response:', unwrapped);
        return unwrapped;
      })
    );
  }

  /**
   * Search mentors by keywords
   *
   * Endpoint: GET /api/mentors/search
   * Based on Mentor-Endpoints.md - Endpoint #2
   *
   * @param searchTerm - Search term to match (min 2 chars)
   * @returns Observable of matching mentor list items
   *
   * @remarks
   * - Public endpoint (no authentication required)
   * - Searches in FirstName, LastName, Bio, and Skill.Name
   * - Case-insensitive matching
   * - Only returns approved mentors
   * - Returns empty array if no matches
   * - Returns 400 if searchTerm < 2 characters
   *
   * @example
   * ```typescript
   * this.mentorService.searchMentors('full-stack').subscribe(
   *   (mentors) => {
   *     this.searchResults = mentors;
   *     console.log(`Found ${mentors.length} mentors`);
   *   }
   * );
   * ```
   */
  searchMentors(searchTerm: string): Observable<MentorListItem[]> {
    const httpParams = new HttpParams().set('searchTerm', searchTerm);

    return this.http.get<ApiResponse<MentorListItem[]>>(
      `${this.MENTORS_URL}/search`,
      { params: httpParams }
    ).pipe(
      map(response => unwrapResponse(response))
    );
  }

  /**
   * Get top-rated mentors
   *
   * Endpoint: GET /api/mentors/top-rated
   * Based on Mentor-Endpoints.md - Endpoint #3
   *
   * @param count - Number of mentors to return (default: 10, min: 1, max: 100)
   * @returns Observable of top-rated mentor list items
   *
   * @remarks
   * - Public endpoint (no authentication required)
   * - Ordered by AverageRating DESC, then TotalReviews DESC
   * - Only returns approved mentors
   * - Only includes mentors with at least 1 review
   * - Returns 400 if count < 1 or count > 100
   *
   * @example
   * ```typescript
   * // Get default top 10
   * this.mentorService.getTopRatedMentors().subscribe(
   *   (mentors) => this.topMentors = mentors
   * );
   *
   * // Get top 20
   * this.mentorService.getTopRatedMentors(20).subscribe(
   *   (mentors) => this.featuredMentors = mentors
   * );
   * ```
   */
  getTopRatedMentors(count: number = 10): Observable<MentorListItem[]> {
    const httpParams = new HttpParams().set('count', count.toString());

    return this.http.get<ApiResponse<MentorListItem[]>>(
      `${this.MENTORS_URL}/top-rated`,
      { params: httpParams }
    ).pipe(
      map(response => unwrapResponse(response))
    );
  }

  /**
   * Get mentor profile details by ID
   *
   * Endpoint: GET /api/mentors/{id}
   * Based on Mentor-Endpoints.md - Endpoint #4
   *
   * @param mentorId - The ID of the mentor to retrieve (GUID)
   * @returns Observable of detailed mentor profile
   *
   * @remarks
   * - Public endpoint (no authentication required)
   * - Only returns approved mentors
   * - Includes up to 5 most recent reviews
   * - Includes availability preview for next 7 days
   * - Includes categories, responseTime, completionRate
   * - Returns 404 if mentor not found or not approved
   *
   * @example
   * ```typescript
   * this.mentorService.getMentorById(mentorId).subscribe(
   *   (mentor) => {
   *     this.mentorProfile = mentor;
   *     this.recentReviews = mentor.recentReviews;
   *     this.availability = mentor.availabilityPreview;
   *   }
   * );
   * ```
   */
  getMentorById(mentorId: string): Observable<MentorDetail> {
    return this.http.get<ApiResponse<MentorDetail>>(
      `${this.MENTORS_URL}/${mentorId}`
    ).pipe(
      map(response => unwrapResponse(response))
    );
  }

  // ==================== Authenticated Endpoints ====================

  /**
   * Apply to become a mentor
   *
   * Endpoint: POST /api/mentors
   * Based on Mentor-Endpoints.md - Endpoint #7
   *
   * @param application - The mentor application data
   * @returns Observable of created Mentor profile
   *
   * @remarks
   * - Requires authentication (Bearer token automatically added by authInterceptor)
   * - User must be authenticated
   * - User cannot apply twice (returns 400 if already has mentor profile)
   * - Application starts with approvalStatus: "Pending"
   * - Default values: averageRating=0, totalReviews=0, totalSessionsCompleted=0, isVerified=false
   * - expertiseTags will be empty initially (add later via update endpoint)
   * - After admin approval, mentor can add expertise tags using expertiseTagIds field
   *
   * Field Requirements:
   * - bio: Required, min 50 chars, max 1000 chars
   * - yearsOfExperience: Required, min 0, integer
   * - certifications: Optional, max 500 chars
   * - rate30Min: Required, min 0, max 10000
   * - rate60Min: Required, min 0, max 10000
   *
   * @example
   * ```typescript
   * const application: MentorApplication = {
   *   bio: 'Full-stack developer with 8 years of experience...',
   *   yearsOfExperience: 8,
   *   certifications: 'AWS Certified Solutions Architect - Professional',
   *   rate30Min: 25.00,
   *   rate60Min: 45.00
   * };
   *
   * this.mentorService.applyToBecomeMentor(application).subscribe(
   *   (mentor) => {
   *     // Application submitted successfully
   *     console.log('Application pending approval:', mentor.approvalStatus);
   *     // Component should show success notification
   *   }
   * );
   * ```
   */
  applyToBecomeMentor(application: MentorApplication): Observable<Mentor> {
    return this.http.post<ApiResponse<Mentor>>(
      this.MENTORS_URL,
      application
    ).pipe(
      map(response => unwrapResponse(response))
    );
  }

  /**
   * Update mentor profile
   *
   * Endpoint: PATCH /api/mentors/{id}
   * Based on Mentor-Endpoints.md - Endpoint #8
   *
   * @param mentorId - The ID of the mentor to update (GUID)
   * @param profileUpdate - The profile data to update (all fields optional)
   * @returns Observable of updated Mentor profile
   *
   * @remarks
   * - Requires authentication (Bearer token automatically added by authInterceptor)
   * - Mentor can only update their own profile
   * - Admin can update any mentor profile
   * - Returns 403 if trying to update another mentor's profile (non-admin)
   * - Returns 404 if mentor not found
   * - All fields are optional (PATCH semantics for partial updates)
   * - Only provided fields will be updated
   * - expertiseTagIds updates the mentor's expertise tags (Skills)
   * - Empty array [] for expertiseTagIds clears all expertise tags
   *
   * Field Requirements:
   * - bio: Optional, min 50 chars, max 1000 chars
   * - yearsOfExperience: Optional, min 0, integer
   * - certifications: Optional, max 500 chars
   * - rate30Min: Optional, min 0, max 10000
   * - rate60Min: Optional, min 0, max 10000
   * - expertiseTagIds: Optional, array of skill IDs (integers), all must be valid active skills
   *
   * @example
   * ```typescript
   * const updates: MentorProfileUpdate = {
   *   bio: 'Updated bio with new achievements...',
   *   yearsOfExperience: 9,
   *   certifications: 'AWS Certified, Google Cloud Certified',
   *   rate30Min: 30.00,
   *   rate60Min: 50.00,
   *   expertiseTagIds: [5, 15, 20, 25, 30]  // Array of skill IDs
   * };
   *
   * this.mentorService.updateMentorProfile(mentorId, updates).subscribe(
   *   (mentor) => {
   *     console.log('Profile updated:', mentor);
   *     console.log('Expertise tags:', mentor.expertiseTags);
   *     // Component should show success notification
   *   }
   * );
   *
   * // Clear all expertise tags
   * this.mentorService.updateMentorProfile(mentorId, {
   *   expertiseTagIds: []
   * }).subscribe(mentor => {
   *   console.log('Expertise tags cleared');
   * });
   * ```
   */
  updateMentorProfile(mentorId: string, profileUpdate: MentorProfileUpdate): Observable<Mentor> {
    return this.http.patch<ApiResponse<Mentor>>(
      `${this.MENTORS_URL}/${mentorId}`,
      profileUpdate
    ).pipe(
      map(response => unwrapResponse(response))
    );
  }

  // ==================== Helper Methods ====================

  /**
   * Build query parameters for mentor search
   *
   * Helper method to construct HttpParams from MentorSearchParams
   * Used internally by getAllMentors()
   *
   * @param params - Search parameters
   * @returns HttpParams object
   */
  private buildSearchParams(params: MentorSearchParams): HttpParams {
    let httpParams = new HttpParams();

    if (params.keywords) {
      httpParams = httpParams.set('keywords', params.keywords);
    }
    if (params.categoryId !== undefined) {
      httpParams = httpParams.set('categoryId', params.categoryId.toString());
    }
    if (params.minPrice !== undefined) {
      httpParams = httpParams.set('minPrice', params.minPrice.toString());
    }
    if (params.maxPrice !== undefined) {
      httpParams = httpParams.set('maxPrice', params.maxPrice.toString());
    }
    if (params.minRating !== undefined) {
      httpParams = httpParams.set('minRating', params.minRating.toString());
    }
    if (params.sortBy) {
      httpParams = httpParams.set('sortBy', params.sortBy);
    }
    if (params.page !== undefined) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params.pageSize !== undefined) {
      httpParams = httpParams.set('pageSize', params.pageSize.toString());
    }
    if (params.verifiedOnly !== undefined) {
      httpParams = httpParams.set('verifiedOnly', params.verifiedOnly.toString());
    }
    if (params.availableOnly !== undefined) {
      httpParams = httpParams.set('availableOnly', params.availableOnly.toString());
    }

    return httpParams;
  }
}
