import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { User } from '../../../shared/models/user.model';
import { getUserFullName, getUserInitials } from '../../../shared/models/user.model';

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
 * - Display career interests as tags
 * - Display career goals
 * - Show account information (email, registration date)
 * - Link to edit profile page
 * - Loading state while fetching data
 * - Error handling with user feedback
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
   */
  private loadUserProfile(): void {
    this.loading = true;
    this.error = null;

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.error = 'User not authenticated';
      this.loading = false;
      this.notificationService.error('Please log in to view your profile', 'Authentication Required');
      return;
    }

    this.subscription = this.userService.getUserProfile(currentUser.id).subscribe({
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
   */
  getRegistrationDate(): string {
    if (!this.user?.registrationDate) return 'N/A';

    const date = typeof this.user.registrationDate === 'string'
      ? new Date(this.user.registrationDate)
      : this.user.registrationDate;

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
