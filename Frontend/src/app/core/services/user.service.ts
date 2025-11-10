import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment.development';
import { NotificationService } from './notification.service';
import { AuthService } from './auth.service';
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
 * Handles retrieving and updating user profiles with API calls and state management.
 *
 * Features:
 * - Get user profile by ID
 * - Get current authenticated user's profile
 * - Update user profile
 * - User profile caching with BehaviorSubject
 * - Automatic error handling and notifications
 * - Integration with AuthService for token management
 *
 * @remarks
 * - All endpoints require authentication (Bearer token)
 * - Profile updates are reflected in the UI through observables
 * - Error handling is integrated with NotificationService
 * - Follows Angular standalone service pattern with dependency injection
 *
 * @example
 * ```typescript
 * // In a component
 * constructor(private userService: UserService) {}
 *
 * // Get current user profile
 * this.userService.getCurrentUserProfile().subscribe(
 *   (user) => console.log('User:', user),
 *   (error) => console.error('Error:', error)
 * );
 *
 * // Update profile
 * const updates: UserProfileUpdate = {
 *   firstName: 'John',
 *   lastName: 'Doe',
 *   careerInterests: 'Software Development'
 * };
 * this.userService.updateUserProfile(userId, updates).subscribe(
 *   (user) => console.log('Profile updated:', user),
 *   (error) => console.error('Error:', error)
 * );
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);

  // API endpoints
  private readonly API_URL = environment.apiUrl;
  private readonly USERS_URL = `${this.API_URL}/users`;

  // Current user profile state
  private currentUserProfileSubject = new BehaviorSubject<User | null>(null);
  public currentUserProfile$ = this.currentUserProfileSubject.asObservable();

  // User profiles cache (for multiple user lookups)
  private userProfilesCache = new Map<string, User>();

  // ==================== Get User Profile ====================

  /**
   * Get user profile by user ID
   *
   * @param userId - The ID of the user to retrieve
   * @returns Observable of User profile
   *
   * @remarks
   * - Requires authentication (Bearer token)
   * - User can view their own profile
   * - Admin can view any user profile
   * - Returns 401 if not authenticated
   * - Returns 403 if trying to view another user's profile (non-admin)
   * - Returns 404 if user not found
   */
  getUserProfile(userId: string): Observable<User> {
    return this.http.get<ApiResponse<User>>(
      `${this.USERS_URL}/me`
    ).pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Failed to fetch user profile');
        }
        // Cache the user profile
        this.userProfilesCache.set(userId, response.data);
        return response.data;
      }),
      catchError(error => this.handleError('Failed to fetch user profile', error))
    );
  }

  /**
   * Get current authenticated user's profile
   *
   * This method uses the authenticated user ID from AuthService
   * to fetch the current user's profile from the API.
   *
   * @returns Observable of current User profile
   *
   * @remarks
   * - Automatically gets the current user ID from AuthService
   * - Updates the currentUserProfile$ observable
   * - Caches the profile for quick access
   * - Returns null if user is not authenticated
   *
   * @example
   * ```typescript
   * this.userService.getCurrentUserProfile().subscribe(
   *   (user) => this.currentUser = user
   * );
   * ```
   */
  getCurrentUserProfile(): Observable<User> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || !currentUser.id) {
      return throwError(() => new Error('User not authenticated'));
    }

    return this.getUserProfile(currentUser.id).pipe(
      tap(user => {
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
   *   careerInterests: ['Software Development', 'AI'],
   *   careerGoals: 'Become a senior developer'
   * };
   *
   * this.userService.updateCurrentUserProfile(updates).subscribe(
   *   (updatedUser) => {
   *     // Profile updated successfully
   *     // Show notification in component
   *     this.notificationService.success('Profile updated!', 'Success');
   *   }
   * );
   * ```
   */
  updateCurrentUserProfile(profileUpdate: UserProfileUpdate): Observable<User> {
    return this.http.patch<ApiResponse<User>>(
      `${this.USERS_URL}/me`,
      profileUpdate
    ).pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Failed to update user profile');
        }
        return response.data;
      }),
      tap(user => {
        // Update cache with current user data
        const currentUser = this.authService.getCurrentUser();
        if (currentUser && currentUser.id) {
          this.userProfilesCache.set(currentUser.id, user);
        }

        // Update current user profile observable
        this.currentUserProfileSubject.next(user);

        // Note: Success notification should be shown by the calling component
        // for context-specific messaging
      }),
      catchError(error => this.handleError('Failed to update user profile', error))
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
   */
  updateUserProfileById(userId: string, profileUpdate: UserProfileUpdate): Observable<User> {
    return this.http.patch<ApiResponse<User>>(
      `${this.USERS_URL}/${userId}`,
      profileUpdate
    ).pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Failed to update user profile');
        }
        return response.data;
      }),
      tap(user => {
        // Update cache
        this.userProfilesCache.set(userId, user);

        // Update current user profile if it's the authenticated user
        const currentUser = this.authService.getCurrentUser();
        if (currentUser && currentUser.id === userId) {
          this.currentUserProfileSubject.next(user);
        }

        // Note: Success notification should be shown by the calling component
        // for context-specific messaging
      }),
      catchError(error => this.handleError('Failed to update user profile', error))
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
  getCurrentUserMentorId(): string | undefined {
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
   * - Component should handle error notification for context-specific messaging
   * - Error interceptor handles global errors (401, network errors, etc.)
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
    console.error('[UserService] Error:', errorMessage, error);

    // Note: Error notification should be shown by the calling component
    // for context-specific messaging

    return throwError(() => ({
      ...error,
      message: errorMessage
    }));
  }
}
