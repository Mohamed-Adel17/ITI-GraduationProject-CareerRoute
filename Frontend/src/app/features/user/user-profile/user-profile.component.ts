import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { User, getUserFullName, getUserInitials, formatRegistrationDate, getCareerInterestNames } from '../../../shared/models/user.model';

/**
 * UserProfileComponent
 *
 * @description
 * Displays the authenticated user's profile information in read-only mode.
 * Provides a link to edit the profile.
 *
 * Features:
 * - Display user personal information
 * - Show profile picture or initials fallback
 * - Display career interests as Skill tags (from Skills system)
 * - Display career goals
 * - Show account information (email, registration date)
 * - Link to edit profile page
 * - Loading state while fetching data
 * - Error handling with user feedback
 *
 * @remarks
 * - Uses GET /api/users/me endpoint via UserService
 * - careerInterests are Skill objects with full category information
 * - Timestamps are ISO 8601 strings from API
 * - Based on User-Profile-Endpoints.md contract
 *
 * @example
 * Route: /user/profile
 */
@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit, OnDestroy {
  user: User | null = null;
  loading: boolean = true;
  error: string | null = null;

  private subscription?: Subscription;

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadUserProfile();
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  /**
   * Load the current user's profile from the API
   *
   * @remarks
   * Uses GET /api/users/me endpoint via UserService.getCurrentUserProfile()
   * This endpoint extracts user ID from JWT token on backend
   */
  private loadUserProfile(): void {
    this.loading = true;
    this.error = null;

    this.subscription = this.userService.getCurrentUserProfile().subscribe({
      next: (user) => {
        this.user = user;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load profile';
        this.loading = false;
        this.notificationService.error('Could not load your profile. Please try again.', 'Error');
        console.error('Error loading user profile:', err);
      }
    });
  }

  /**
   * Get user's full name for display
   */
  getUserFullName(): string {
    return this.user ? getUserFullName(this.user) : '';
  }

  /**
   * Get user's initials for avatar fallback
   */
  getUserInitials(): string {
    return this.user ? getUserInitials(this.user) : '??';
  }

  /**
   * Check if user has a profile picture
   */
  hasProfilePicture(): boolean {
    return !!this.user?.profilePictureUrl;
  }

  /**
   * Get formatted registration date
   *
   * @remarks
   * Uses formatRegistrationDate helper from user.model.ts
   * Handles ISO 8601 string format from API
   */
  getRegistrationDate(): string {
    if (!this.user) return 'N/A';
    return formatRegistrationDate(this.user);
  }

  /**
   * Get career interest names as string array
   *
   * @remarks
   * Extracts skill names from Skill objects
   * Uses getCareerInterestNames helper from user.model.ts
   */
  getCareerInterestNames(): string[] {
    if (!this.user) return [];
    return getCareerInterestNames(this.user);
  }

  /**
   * Check if user has career interests
   */
  hasCareerInterests(): boolean {
    return !!this.user?.careerInterests && this.user.careerInterests.length > 0;
  }

  /**
   * Check if user has career goals
   */
  hasCareerGoals(): boolean {
    return !!this.user?.careerGoals && this.user.careerGoals.trim().length > 0;
  }

  /**
   * Reload profile data
   */
  refreshProfile(): void {
    this.loadUserProfile();
  }
}
