import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthUser } from '../../models/auth.model';
import { UserRole } from '../../models/user.model';

/**
 * HeaderComponent
 *
 * Navigation header component for the CareerRoute application.
 * Displays navigation links, authentication controls, and user menu.
 *
 * Features:
 * - Responsive design with mobile hamburger menu
 * - Login/Register links for unauthenticated users
 * - User menu with avatar and dropdown for authenticated users
 * - Logout functionality
 * - Accessible with ARIA attributes and keyboard navigation
 *
 * @remarks
 * - Uses AuthService for authentication state
 * - Integrates with NotificationService for user feedback
 * - Follows design specs from CareerRoute-MVP-Design
 */
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notificationService = inject(NotificationService);

  // Observable streams from AuthService
  isAuthenticated$: Observable<boolean>;
  currentUser$: Observable<AuthUser | null>;

  // Component state
  menuOpen = false;
  userMenuOpen = false;

  // Expose UserRole enum to template
  readonly UserRole = UserRole;

  constructor() {
    // Subscribe to auth state observables
    this.isAuthenticated$ = this.authService.isAuthenticated$;
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    // Component initialization logic if needed
  }

  /**
   * Toggle mobile navigation menu
   */
  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
    // Close user menu if open
    if (this.menuOpen) {
      this.userMenuOpen = false;
    }
  }

  /**
   * Toggle user dropdown menu
   */
  toggleUserMenu(): void {
    this.userMenuOpen = !this.userMenuOpen;
    // Close mobile menu if open
    if (this.userMenuOpen) {
      this.menuOpen = false;
    }
  }

  /**
   * Close all menus
   */
  closeMenus(): void {
    this.menuOpen = false;
    this.userMenuOpen = false;
  }

  /**
   * Handle user logout
   * Clears tokens, shows notification, and redirects to home
   */
  onLogout(): void {
    this.closeMenus();
    // AuthService.logout() handles token removal, state reset, and navigation
    // Pass false to prevent default notification, we'll show our own
    this.authService.logout(false);
    this.notificationService.showSuccess('Logged out successfully');
    this.router.navigate(['/']);
  }

  /**
   * Navigate to a route and close menus
   * @param route The route to navigate to
   */
  navigateAndClose(route: string): void {
    this.closeMenus();
    this.router.navigate([route]);
  }

  /**
   * Get user display name
   * @param user The authenticated user
   * @returns Display name or 'User'
   */
  getUserDisplayName(user: AuthUser | null): string {
    if (!user) return 'User';
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.firstName) {
      return user.firstName;
    }
    return user.email.split('@')[0];
  }

  /**
   * Get user initials for avatar fallback
   * @param user The authenticated user
   * @returns User initials
   */
  getUserInitials(user: AuthUser | null): string {
    if (!user) return 'U';
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user.firstName) {
      return user.firstName[0].toUpperCase();
    }
    return user.email[0].toUpperCase();
  }

  /**
   * Check if user has a specific role
   * @param user The authenticated user
   * @param role The role to check
   * @returns True if user has the role
   */
  hasRole(user: AuthUser | null, role: UserRole): boolean {
    return user?.roles?.includes(role) || false;
  }
}
