import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment.development';
import { NotificationService } from './notification.service';
import { AuthService } from './auth.service';
import {
  Mentor,
  MentorApplication,
  MentorProfileUpdate,
  MentorApprovalStatus
} from '../../shared/models/mentor.model';

/**
 * Response wrapper for mentor API calls
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
 * MentorService
 *
 * Service for managing mentor profile operations in the Career Route application.
 * Handles mentor applications, profile management, and mentor-related queries with API calls and state management.
 *
 * Features:
 * - Apply to become mentor with professional information
 * - Get mentor profile by ID
 * - Get current authenticated user's mentor profile
 * - Update mentor profile
 * - Mentor profile caching
 * - Get mentor details with user information
 * - Application status tracking
 * - Automatic error handling and notifications
 * - Integration with AuthService for user authentication
 *
 * @remarks
 * - All endpoints require authentication (Bearer token) except public mentor viewing
 * - Mentor application requires verified email address
 * - User cannot apply twice (backend validates existing applications)
 * - Profile updates are reflected in the UI through observables
 * - Error handling is integrated with NotificationService
 * - Follows Angular standalone service pattern with dependency injection
 *
 * @example
 * ```typescript
 * // In a component
 * constructor(private mentorService: MentorService) {}
 *
 * // Apply to become mentor
 * const application: MentorApplication = {
 *   bio: 'Senior developer with 10 years experience...',
 *   expertiseTags: 'React, Node.js, AWS',
 *   yearsOfExperience: 10,
 *   rate30Min: 50,
 *   rate60Min: 90,
 *   categoryIds: [1, 2]
 * };
 * this.mentorService.applyToBecomeMentor(application).subscribe(
 *   (mentor) => console.log('Application submitted:', mentor),
 *   (error) => console.error('Error:', error)
 * );
 *
 * // Get mentor profile
 * this.mentorService.getMentorProfile(mentorId).subscribe(
 *   (mentor) => console.log('Mentor:', mentor)
 * );
 *
 * // Update mentor profile
 * const updates: MentorProfileUpdate = {
 *   bio: 'Updated bio...',
 *   expertiseTags: 'React, Node.js, AWS, Docker',
 *   yearsOfExperience: 11,
 *   rate30Min: 55,
 *   rate60Min: 100,
 *   categoryIds: [1, 2, 5]
 * };
 * this.mentorService.updateMentorProfile(mentorId, updates).subscribe(
 *   (mentor) => console.log('Profile updated:', mentor)
 * );
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class MentorService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);

  // API endpoints
  private readonly API_URL = environment.apiUrl;
  private readonly MENTORS_URL = `${this.API_URL}/mentors`;

  // Current user's mentor profile state
  private currentMentorProfileSubject = new BehaviorSubject<Mentor | null>(null);
  public currentMentorProfile$ = this.currentMentorProfileSubject.asObservable();

  // Mentor application state (for tracking application status)
  private mentorApplicationSubject = new BehaviorSubject<{
    status: 'idle' | 'pending' | 'approved' | 'rejected';
    mentor: Mentor | null;
  }>({ status: 'idle', mentor: null });
  public mentorApplication$ = this.mentorApplicationSubject.asObservable();

  // Mentor profiles cache (for multiple mentor lookups)
  private mentorProfilesCache = new Map<string, Mentor>();

  // ==================== Mentor Application ====================

  /**
   * Apply to become a mentor
   *
   * Submits a mentor application with professional profile information.
   * User must have verified email to apply.
   *
   * @param application - The mentor application data
   * @returns Observable of created Mentor profile
   *
   * @remarks
   * - Requires authentication (Bearer token)
   * - User must have verified email address
   * - User cannot apply twice (409 Conflict error if already applied)
   * - Application starts in "Pending" approval status
   * - User gains "Mentor" role after admin approval
   * - Returns 400 if validation fails (bio too short, invalid rates, etc.)
   *
   * @example
   * ```typescript
   * const application: MentorApplication = {
   *   bio: 'Senior Software Engineer with 10 years...',
   *   expertiseTags: 'React, Node.js, AWS, Docker',
   *   yearsOfExperience: 10,
   *   certifications: 'AWS Certified Solutions Architect',
   *   rate30Min: 50.00,
   *   rate60Min: 90.00,
   *   categoryIds: [1, 2, 5]
   * };
   *
   * this.mentorService.applyToBecomeMentor(application).subscribe(
   *   (mentor) => {
   *     // Application submitted successfully
   *     // Success notification shown automatically
   *   }
   * );
   * ```
   */
  applyToBecomeMentor(application: MentorApplication): Observable<Mentor> {
    return this.http.post<ApiResponse<Mentor>>(
      this.MENTORS_URL,
      application
    ).pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Failed to submit mentor application');
        }
        return response.data;
      }),
      tap(mentor => {
        // Update current mentor profile
        this.currentMentorProfileSubject.next(mentor);

        // Update application state
        this.mentorApplicationSubject.next({
          status: this.getMentorApplicationStatus(mentor),
          mentor: mentor
        });

        // Cache the profile
        this.mentorProfilesCache.set(mentor.id, mentor);

        // Show success notification
        this.notificationService.success(
          'Application submitted successfully! Your application is pending approval.',
          'Success'
        );
      }),
      catchError(error => this.handleError('Failed to submit mentor application', error))
    );
  }

  // ==================== Get Mentor Profile ====================

  /**
   * Get mentor profile by mentor ID
   *
   * @param mentorId - The ID of the mentor to retrieve
   * @returns Observable of Mentor profile
   *
   * @remarks
   * - Public endpoint - can be accessed without authentication
   * - Returns mentor information with rating, reviews, and categories
   * - Returns 404 if mentor not found
   * - Profile is cached for performance
   */
  getMentorProfile(mentorId: string): Observable<Mentor> {
    // Check cache first
    const cached = this.mentorProfilesCache.get(mentorId);
    if (cached) {
      return new Observable(observer => {
        observer.next(cached);
        observer.complete();
      });
    }

    return this.http.get<ApiResponse<Mentor>>(
      `${this.MENTORS_URL}/${mentorId}`
    ).pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Failed to fetch mentor profile');
        }
        return response.data;
      }),
      tap(mentor => {
        // Cache the profile
        this.mentorProfilesCache.set(mentorId, mentor);
      }),
      catchError(error => this.handleError('Failed to fetch mentor profile', error))
    );
  }

  /**
   * Get current authenticated user's mentor profile
   *
   * This method uses the authenticated user ID from AuthService
   * to fetch the current user's mentor profile from the API.
   *
   * @returns Observable of current user's Mentor profile
   *
   * @remarks
   * - Requires authentication (Bearer token)
   * - User must have a mentor profile (be a mentor or have pending application)
   * - Updates the currentMentorProfile$ observable
   * - Returns null/error if user is not a mentor
   *
   * @example
   * ```typescript
   * this.mentorService.getCurrentMentorProfile().subscribe(
   *   (mentor) => {
   *     console.log('Your mentor profile:', mentor);
   *     this.mentorProfile = mentor;
   *   }
   * );
   * ```
   */
  getCurrentMentorProfile(): Observable<Mentor> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || !currentUser.mentorId) {
      return throwError(() => new Error('User does not have a mentor profile'));
    }

    return this.getMentorProfile(currentUser.mentorId).pipe(
      tap(mentor => {
        this.currentMentorProfileSubject.next(mentor);

        // Update application state based on approval status
        this.mentorApplicationSubject.next({
          status: this.getMentorApplicationStatus(mentor),
          mentor: mentor
        });
      })
    );
  }

  /**
   * Get cached mentor profile (synchronous)
   *
   * @param mentorId - The ID of the mentor to retrieve from cache
   * @returns Mentor profile if cached, undefined otherwise
   *
   * @remarks
   * - Returns immediately without API call
   * - Returns undefined if mentor profile not in cache
   * - Use getMentorProfile() to fetch from API if not cached
   */
  getCachedMentorProfile(mentorId: string): Mentor | undefined {
    return this.mentorProfilesCache.get(mentorId);
  }

  /**
   * Get current user's mentor profile from cache (synchronous)
   *
   * @returns Current user's mentor profile if cached, null otherwise
   *
   * @remarks
   * - Returns immediately without API call
   * - Returns null if no mentor profile cached
   * - Use getCurrentMentorProfile() to fetch from API
   */
  getCachedCurrentMentorProfile(): Mentor | null {
    return this.currentMentorProfileSubject.value;
  }

  // ==================== Update Mentor Profile ====================

  /**
   * Update mentor profile
   *
   * @param mentorId - The ID of the mentor to update
   * @param profileUpdate - The profile data to update
   * @returns Observable of updated Mentor profile
   *
   * @remarks
   * - Requires authentication (Bearer token)
   * - Mentor can only update their own profile (or admin can update any)
   * - Some fields cannot be updated after approval (approvalStatus, isVerified, calculated fields)
   * - Returns 403 if trying to update another mentor's profile (non-admin)
   * - Returns 404 if mentor not found
   * - Automatically shows success notification on completion
   * - Updates currentMentorProfile$ if updating current user's profile
   *
   * @example
   * ```typescript
   * const updates: MentorProfileUpdate = {
   *   bio: 'Updated bio with new achievements...',
   *   expertiseTags: 'React, Node.js, AWS, Docker, Kubernetes',
   *   yearsOfExperience: 11,
   *   certifications: 'AWS Certified, CKA, CKAD',
   *   rate30Min: 55.00,
   *   rate60Min: 100.00,
   *   categoryIds: [1, 2, 5, 8],
   *   isAvailable: true
   * };
   *
   * this.mentorService.updateMentorProfile(mentorId, updates).subscribe(
   *   (updatedMentor) => {
   *     console.log('Profile updated:', updatedMentor);
   *     // Success notification shown automatically
   *   }
   * );
   * ```
   */
  updateMentorProfile(mentorId: string, profileUpdate: MentorProfileUpdate): Observable<Mentor> {
    return this.http.put<ApiResponse<Mentor>>(
      `${this.MENTORS_URL}/${mentorId}`,
      profileUpdate
    ).pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Failed to update mentor profile');
        }
        return response.data;
      }),
      tap(mentor => {
        // Update cache
        this.mentorProfilesCache.set(mentorId, mentor);

        // Update current mentor profile if it's the authenticated user
        const currentUser = this.authService.getCurrentUser();
        if (currentUser && currentUser.mentorId === mentorId) {
          this.currentMentorProfileSubject.next(mentor);

          // Update application state
          this.mentorApplicationSubject.next({
            status: this.getMentorApplicationStatus(mentor),
            mentor: mentor
          });
        }

        // Show success notification
        this.notificationService.success(
          'Mentor profile updated successfully',
          'Success'
        );
      }),
      catchError(error => this.handleError('Failed to update mentor profile', error))
    );
  }

  /**
   * Update current authenticated user's mentor profile
   *
   * This is a convenience method that automatically uses
   * the authenticated user's mentor ID.
   *
   * @param profileUpdate - The profile data to update
   * @returns Observable of updated Mentor profile
   *
   * @remarks
   * - Automatically gets the current user's mentor ID from AuthService
   * - Returns error if user does not have a mentor profile
   * - Same validation and authorization as updateMentorProfile()
   *
   * @example
   * ```typescript
   * const updates: MentorProfileUpdate = {
   *   bio: 'Updated bio...',
   *   expertiseTags: 'React, Node.js, AWS',
   *   yearsOfExperience: 11,
   *   rate30Min: 55,
   *   rate60Min: 100,
   *   categoryIds: [1, 2]
   * };
   *
   * this.mentorService.updateCurrentMentorProfile(updates).subscribe(
   *   (mentor) => console.log('Updated:', mentor)
   * );
   * ```
   */
  updateCurrentMentorProfile(profileUpdate: MentorProfileUpdate): Observable<Mentor> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || !currentUser.mentorId) {
      return throwError(() => new Error('User does not have a mentor profile'));
    }

    return this.updateMentorProfile(currentUser.mentorId, profileUpdate);
  }

  // ==================== Helper Methods ====================

  /**
   * Clear the mentor profile cache
   *
   * @remarks
   * - Clears all cached mentor profiles
   * - Does not clear currentMentorProfile$ observable
   * - Use when you need fresh data from API
   */
  clearProfileCache(): void {
    this.mentorProfilesCache.clear();
  }

  /**
   * Clear current user's mentor profile cache
   *
   * @remarks
   * - Sets currentMentorProfile$ to null
   * - Clears current user's mentor profile data
   */
  clearCurrentMentorProfile(): void {
    this.currentMentorProfileSubject.next(null);
  }

  /**
   * Refresh current user's mentor profile from API
   *
   * @returns Observable of refreshed Mentor profile
   *
   * @remarks
   * - Fetches fresh profile data from API
   * - Ignores cache
   * - Useful for getting latest profile after external updates
   */
  refreshCurrentMentorProfile(): Observable<Mentor> {
    this.clearCurrentMentorProfile();
    return this.getCurrentMentorProfile();
  }

  /**
   * Check if user has applied to become a mentor
   *
   * @returns True if user has mentor profile or pending application
   *
   * @remarks
   * - Checks cached mentor profile
   * - Returns false if no profile cached
   */
  hasAppliedToBecomeMentor(): boolean {
    const mentor = this.getCachedCurrentMentorProfile();
    return mentor != null;
  }

  /**
   * Get mentor application approval status
   *
   * @returns Application status: 'idle', 'pending', 'approved', or 'rejected'
   *
   * @remarks
   * - Returns current application status from observable
   * - Useful for UI display of application progress
   */
  getMentorApplicationStatusObs(): Observable<{
    status: 'idle' | 'pending' | 'approved' | 'rejected';
    mentor: Mentor | null;
  }> {
    return this.mentorApplication$;
  }

  /**
   * Check if current user is an approved mentor
   *
   * @returns True if user is approved mentor
   *
   * @remarks
   * - Uses cached mentor profile
   * - Checks both approval status and verification
   * - Returns false if profile not cached
   */
  isCurrentUserApprovedMentor(): boolean {
    const mentor = this.getCachedCurrentMentorProfile();
    return mentor != null
      && mentor.approvalStatus === MentorApprovalStatus.Approved
      && mentor.isVerified;
  }

  /**
   * Check if current user has pending mentor application
   *
   * @returns True if application is pending
   *
   * @remarks
   * - Uses cached mentor profile
   * - Returns false if profile not cached
   */
  hasCurrentUserPendingApplication(): boolean {
    const mentor = this.getCachedCurrentMentorProfile();
    return mentor != null && mentor.approvalStatus === MentorApprovalStatus.Pending;
  }

  /**
   * Get percentage of mentor profile completion
   *
   * Useful for showing profile completion UI in mentor dashboard
   *
   * @param mentor - The mentor profile to check
   * @returns Completion percentage (0-100)
   *
   * @remarks
   * - Checks for presence of profile data
   * - Useful for encouraging mentors to complete profile
   * - Includes bio, expertise, certifications, pricing, categories
   */
  calculateProfileCompletionPercentage(mentor: Mentor): number {
    let completedFields = 0;
    const totalFields = 6;

    if (mentor.bio && mentor.bio.length > 0) completedFields++;
    if (mentor.expertiseTags && (Array.isArray(mentor.expertiseTags)
      ? mentor.expertiseTags.length > 0
      : mentor.expertiseTags.length > 0)) completedFields++;
    if (mentor.yearsOfExperience && mentor.yearsOfExperience > 0) completedFields++;
    if (mentor.certifications && mentor.certifications.length > 0) completedFields++;
    if (mentor.rate30Min && mentor.rate60Min) completedFields++;
    if (mentor.categoryIds && mentor.categoryIds.length > 0) completedFields++;

    return Math.round((completedFields / totalFields) * 100);
  }

  // ==================== Private Helper Methods ====================

  /**
   * Get mentor application status from approval status
   *
   * @param mentor - The mentor profile
   * @returns Application status
   */
  private getMentorApplicationStatus(mentor: Mentor): 'idle' | 'pending' | 'approved' | 'rejected' {
    switch (mentor.approvalStatus) {
      case MentorApprovalStatus.Pending:
        return 'pending';
      case MentorApprovalStatus.Approved:
        return 'approved';
      case MentorApprovalStatus.Rejected:
        return 'rejected';
      default:
        return 'idle';
    }
  }

  /**
   * Handle API errors with logging and user feedback
   *
   * @param defaultMessage - Default message to show if error message is not available
   * @param error - The error object
   * @returns Throwable error for upstream handling
   *
   * @remarks
   * - Shows notification to user
   * - Logs error details
   * - Handles various error types (validation, auth, server, etc.)
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

    this.notificationService.error(errorMessage, 'Error');

    return throwError(() => error);
  }
}
