import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment.development';
import {
  User,
  UserProfileUpdate,
  UserRole
} from '../../shared/models/user.model';
import { ApiResponse } from '../../shared/models/api-response.model';

/**
 * UserService
 *
 * Service for managing user profile operations in the Career Route application.
 * Handles retrieving, updating, and deleting user profiles with API calls and state management.
 *
 * Features:
 * - Get current user profile (GET /api/users/me)
 * - Update current user profile (PATCH /api/users/me)
 * - Delete current user account (DELETE /api/users/me)
 * - Get all users (GET /api/users) - Admin/Mentor only
 * - Get user by ID (GET /api/users/{id}) - Admin/Mentor only
 * - Update user by ID (PATCH /api/users/{id}) - Admin only
 * - User profile caching with BehaviorSubject
 * - Token management handled by authInterceptor
 *
 * @remarks
 * - All endpoints require authentication (Bearer token)
 * - careerInterests can be updated via PATCH /api/users/me using careerInterestIds field
 * - Profile updates use PATCH semantics (all fields optional)
 * - Based on User-Profile-Endpoints.md contract
 * - Error handling is done globally by errorInterceptor
 * - Components only need to handle success cases and optional custom error logic
 *
 * @example
 * ```typescript
 * // Get current user profile - errors handled automatically by errorInterceptor
 * this.userService.getCurrentUserProfile().subscribe(
 *   (user) => this.user = user
 * );
 *
 * // Update current user profile - only handle success
 * const updates: UserProfileUpdate = {
 *   firstName: 'John',
 *   lastName: 'Doe',
 *   careerGoals: 'Become a Solutions Architect',
 *   careerInterestIds: [1, 5, 15, 20]
 * };
 * this.userService.updateCurrentUserProfile(updates).subscribe({
 *   next: (user) => {
 *     this.notificationService.success('Profile updated!', 'Success');
 *   }
 *   // No error handler needed - errorInterceptor handles it
 * });
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly http = inject(HttpClient);

  // API endpoints
  private readonly API_URL = environment.apiUrl;
  private readonly USERS_URL = `${this.API_URL}/users`;

  // Current user profile state
  private currentUserProfileSubject = new BehaviorSubject<User | null>(null);
  public currentUserProfile$ = this.currentUserProfileSubject.asObservable();

  // User profiles cache (for multiple user lookups)
  private userProfilesCache = new Map<string, User>();

  // ==================== Helper Methods ====================

  /**
   * Unwrap ApiResponse and validate response structure
   *
   * @param response - The ApiResponse wrapper from backend
   * @param errorMessage - Default error message if response is invalid
   * @returns The unwrapped data from the response
   * @throws Error if response is invalid or unsuccessful
   *
   * @remarks
   * - Validates response.success flag
   * - Validates response.data is present
   * - Uses response.message if available, otherwise uses errorMessage
   * - Thrown errors are caught by errorInterceptor
   */
  private unwrapResponse<T>(response: ApiResponse<T>, errorMessage: string): T {
    if (!response.success || !response.data) {
      throw new Error(response.message || errorMessage);
    }
    return response.data;
  }

  /**
   * Unwrap ApiResponse for void operations (e.g., delete)
   *
   * @param response - The ApiResponse wrapper from backend
   * @param errorMessage - Default error message if response is invalid
   * @throws Error if response is unsuccessful
   *
   * @remarks
   * - Only validates response.success flag (data can be null for void operations)
   * - Uses response.message if available, otherwise uses errorMessage
   * - Thrown errors are caught by errorInterceptor
   */
  private unwrapVoidResponse(response: ApiResponse<void>, errorMessage: string): void {
    if (!response.success) {
      throw new Error(response.message || errorMessage);
    }
  }

  // ==================== Get User Profile ====================

  /**
   * Get user profile by user ID (Admin/Mentor only)
   *
   * @param userId - The ID of the user to retrieve
   * @returns Observable of User profile
   *
   * @remarks
   * - Endpoint: GET /api/users/{id}
   * - Requires Admin or Mentor role
   * - Returns 401 if not authenticated
   * - Returns 403 if user doesn't have required role
   * - Returns 404 if user not found
   * - Caches user profile for quick access
   *
   * @example
   * ```typescript
   * this.userService.getUserProfile(userId).subscribe({
   *   next: (user) => this.user = user,
   *   error: (err) => console.error('Error:', err)
   * });
   * ```
   */
  getUserProfile(userId: string): Observable<User> {
    return this.http.get<ApiResponse<User>>(
      `${this.USERS_URL}/${userId}`
    ).pipe(
      map(response => this.unwrapResponse(response, 'Failed to fetch user profile')),
      tap(user => {
        // Cache the user profile
        this.userProfilesCache.set(userId, user);
      })
    );
  }

  /**
   * Get current authenticated user's profile
   *
   * @returns Observable of current User profile
   *
   * @remarks
   * - Endpoint: GET /api/users/me
   * - Requires authentication (Bearer token automatically added by authInterceptor)
   * - Backend extracts user ID from JWT token
   * - Updates the currentUserProfile$ observable
   * - Caches the profile for quick access
   * - Returns 401 if not authenticated (handled by errorInterceptor)
   * - Component should be protected by authGuard to prevent unauthorized access
   *
   * @example
   * ```typescript
   * this.userService.getCurrentUserProfile().subscribe(
   *   (user) => this.currentUser = user
   * );
   * ```
   */
  getCurrentUserProfile(): Observable<User> {
    return this.http.get<ApiResponse<User>>(
      `${this.USERS_URL}/me`
    ).pipe(
      map(response => this.unwrapResponse(response, 'Failed to fetch user profile')),
      tap(user => {
        // Cache the user profile using the user ID from the response
        this.userProfilesCache.set(user.id, user);
        this.currentUserProfileSubject.next(user);
      })
    );
  }

  /**
   * Get cached user profile (synchronous)
   *
   * @param userId - The ID of the user to retrieve from cache
   * @returns User profile if cached, undefined otherwise
   *
   * @remarks
   * - Returns immediately without API call
   * - Returns undefined if user profile not in cache
   * - Use getUserProfile() to fetch from API if not cached
   */
  getCachedUserProfile(userId: string): User | undefined {
    return this.userProfilesCache.get(userId);
  }

  /**
   * Get current user profile from cache (synchronous)
   *
   * @returns Current user profile if cached, null otherwise
   *
   * @remarks
   * - Returns immediately without API call
   * - Returns null if no profile cached
   * - Use getCurrentUserProfile() to fetch from API
   */
  getCachedCurrentUserProfile(): User | null {
    return this.currentUserProfileSubject.value;
  }

  /**
   * Get all users (Admin/Mentor only)
   *
   * @returns Observable of all users array
   *
   * @remarks
   * - Endpoint: GET /api/users
   * - Requires Admin or Mentor role
   * - Returns 401 if not authenticated
   * - Returns 403 if user doesn't have required role
   * - Returns 404 if no users found
   * - All users include their career interests as Skill objects
   *
   * @example
   * ```typescript
   * this.userService.getAllUsers().subscribe({
   *   next: (users) => this.users = users,
   *   error: (err) => console.error('Error:', err)
   * });
   * ```
   */
  getAllUsers(): Observable<User[]> {
    return this.http.get<ApiResponse<User[]>>(
      this.USERS_URL
    ).pipe(
      map(response => this.unwrapResponse(response, 'Failed to fetch users')),
      tap(users => {
        // Cache all user profiles
        users.forEach(user => {
          this.userProfilesCache.set(user.id, user);
        });
      })
    );
  }

  // ==================== Update User Profile ====================

  /**
   * Update current authenticated user's profile
   *
   * @param profileUpdate - The profile data to update
   * @returns Observable of updated User profile
   *
   * @remarks
   * - Uses `/api/users/me` endpoint (PATCH method)
   * - Requires authentication (Bearer token)
   * - User can only update their own profile
   * - Email cannot be changed via this endpoint
   * - All fields are optional (PATCH semantics)
   * - careerInterestIds: Array of skill IDs (integers) to update career interests
   *   - All IDs must be valid active skills
   *   - Empty array [] clears all career interests
   *   - Backend validates IDs and returns 400 if any are invalid/inactive
   * - Returns 400 if validation fails
   * - Returns 401 if not authenticated
   * - Updates currentUserProfile$ observable
   * - Component should handle success notification for context-specific messaging
   *
   * @example
   * ```typescript
   * const updates: UserProfileUpdate = {
   *   firstName: 'John',
   *   lastName: 'Doe',
   *   phoneNumber: '+1234567890',
   *   careerGoals: 'Become a senior developer',
   *   careerInterestIds: [1, 5, 15, 20] // Update career interests with skill IDs
   * };
   *
   * this.userService.updateCurrentUserProfile(updates).subscribe({
   *   next: (updatedUser) => {
   *     // Profile updated successfully
   *     // Show notification in component
   *     this.notificationService.success('Profile updated!', 'Success');
   *   },
   *   error: (err) => {
   *     this.notificationService.error(err.message, 'Error');
   *   }
   * });
   * ```
   *
   * @note careerInterests can now be updated directly via this endpoint using careerInterestIds field
   */
  updateCurrentUserProfile(profileUpdate: UserProfileUpdate): Observable<User> {
    return this.http.patch<ApiResponse<User>>(
      `${this.USERS_URL}/me`,
      profileUpdate
    ).pipe(
      map(response => this.unwrapResponse(response, 'Failed to update user profile')),
      tap(user => {
        // Update cache using user ID from response
        this.userProfilesCache.set(user.id, user);

        // Update current user profile observable
        this.currentUserProfileSubject.next(user);
      })
    );
  }

  /**
   * Update user profile by ID (Admin only)
   *
   * @param userId - The ID of the user to update
   * @param profileUpdate - The profile data to update
   * @returns Observable of updated User profile
   *
   * @remarks
   * - Uses `/api/users/{id}` endpoint (PATCH method)
   * - Requires Admin role
   * - Email cannot be changed via this endpoint
   * - All fields are optional (PATCH semantics)
   * - careerInterestIds is NOT supported for admin updates (backend ignores this field)
   * - Returns 400 if validation fails
   * - Returns 401 if not authenticated
   * - Returns 403 if not Admin
   * - Returns 404 if user not found
   * - Component should handle success notification for context-specific messaging
   *
   * @example
   * ```typescript
   * const updates: UserProfileUpdate = {
   *   firstName: 'John',
   *   lastName: 'Doe'
   * };
   *
   * this.userService.updateUserProfileById(userId, updates).subscribe(
   *   (user) => console.log('Updated:', user)
   * );
   * ```
   *
   * @note Admin updates do NOT support careerInterestIds field (per API contract)
   */
  updateUserProfileById(userId: string, profileUpdate: UserProfileUpdate): Observable<User> {
    return this.http.patch<ApiResponse<User>>(
      `${this.USERS_URL}/${userId}`,
      profileUpdate
    ).pipe(
      map(response => this.unwrapResponse(response, 'Failed to update user profile')),
      tap(user => {
        // Update cache
        this.userProfilesCache.set(userId, user);

        // Update current user profile observable if updating the currently cached user
        if (this.currentUserProfileSubject.value?.id === userId) {
          this.currentUserProfileSubject.next(user);
        }
      })
    );
  }

  // ==================== Delete User Account ====================

  /**
   * Delete current user account
   *
   * @returns Observable of void
   *
   * @remarks
   * - Endpoint: DELETE /api/users/me
   * - Requires authentication (Bearer token)
   * - User can only delete their own account
   * - Returns 401 if not authenticated
   * - Invalidates all refresh tokens
   * - Soft delete or hard delete based on backend implementation
   * - Component should handle logout after successful deletion
   *
   * @example
   * ```typescript
   * this.userService.deleteCurrentUser().subscribe({
   *   next: () => {
   *     this.notificationService.success('Account deleted', 'Success');
   *     this.authService.logout(); // Logout after deletion
   *     this.router.navigate(['/']);
   *   },
   *   error: (err) => {
   *     this.notificationService.error(err.message, 'Error');
   *   }
   * });
   * ```
   */
  deleteCurrentUser(): Observable<void> {
    return this.http.delete<ApiResponse<void>>(
      `${this.USERS_URL}/me`
    ).pipe(
      map(response => this.unwrapVoidResponse(response, 'Failed to delete user account')),
      tap(() => {
        // Clear current user profile cache
        this.clearCurrentUserProfile();
        this.clearProfileCache();

        // Note: Component should call authService.logout() after successful deletion
      })
    );
  }

  // ==================== Helper Methods ====================

  /**
   * Clear the user profile cache
   *
   * @remarks
   * - Clears all cached user profiles
   * - Does not clear currentUserProfile$ observable
   * - Use when you need fresh data from API
   */
  clearProfileCache(): void {
    this.userProfilesCache.clear();
  }

  /**
   * Clear current user profile cache
   *
   * @remarks
   * - Sets currentUserProfile$ to null
   * - Clears profile data
   */
  clearCurrentUserProfile(): void {
    this.currentUserProfileSubject.next(null);
  }

  /**
   * Refresh current user profile from API
   *
   * @returns Observable of refreshed User profile
   *
   * @remarks
   * - Fetches fresh profile data from API
   * - Ignores cache
   * - Useful for getting latest profile after external updates
   */
  refreshCurrentUserProfile(): Observable<User> {
    this.clearCurrentUserProfile();
    return this.getCurrentUserProfile();
  }

  /**
   * Check if user has specific role
   *
   * @param userId - The ID of the user to check
   * @param role - The role to check for
   * @returns True if user has the role, false otherwise
   *
   * @remarks
   * - Uses cached profile if available
   * - Returns false if user profile not cached
   * - Use this after fetching/caching user profile
   */
  userHasRole(userId: string, role: UserRole): boolean {
    const user = this.getCachedUserProfile(userId);
    return user?.roles?.includes(role) ?? false;
  }

  /**
   * Check if current user is a mentor
   *
   * @returns True if current user is a mentor, false otherwise
   *
   * @remarks
   * - Uses cached profile
   * - Returns false if profile not cached
   * - Use after fetching current user profile
   */
  currentUserIsMentor(): boolean {
    const user = this.getCachedCurrentUserProfile();
    return user?.isMentor ?? false;
  }

  /**
   * Get current user's mentor ID if applicable
   *
   * @returns Mentor ID string or undefined
   *
   * @remarks
   * - Uses cached profile
   * - Returns undefined if not a mentor or profile not cached
   */
  getCurrentUserMentorId(): string | null | undefined {
    const user = this.getCachedCurrentUserProfile();
    return user?.mentorId;
  }

  /**
   * Format user's full name
   *
   * @param user - The user to format
   * @returns Full name as "FirstName LastName"
   *
   * @remarks
   * - Trims whitespace
   * - Returns empty string if user is null/undefined
   */
  formatUserFullName(user: User | null | undefined): string {
    if (!user) return '';
    return `${user.firstName} ${user.lastName}`.trim();
  }

  /**
   * Get user's initials for avatar display
   *
   * @param user - The user to get initials from
   * @returns User initials (e.g., "JD" for John Doe)
   *
   * @remarks
   * - Returns empty string if user is null/undefined
   * - Useful for avatar placeholders
   */
  getUserInitials(user: User | null | undefined): string {
    if (!user) return '';
    const firstInitial = user.firstName?.charAt(0)?.toUpperCase() || '';
    const lastInitial = user.lastName?.charAt(0)?.toUpperCase() || '';
    return `${firstInitial}${lastInitial}`;
  }
}
