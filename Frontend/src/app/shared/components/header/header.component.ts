import { Component, OnInit, HostListener, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthUser } from '../../models/auth.model';
import { UserRole } from '../../models/user.model';
import { NotificationBellComponent } from '../notification-bell/notification-bell.component';

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
  imports: [CommonModule, RouterModule, NotificationBellComponent],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notificationService = inject(NotificationService);
  private readonly elementRef = inject(ElementRef);

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
   * Close menus when clicking outside the component
   * @param event Mouse click event
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const clickedInside = this.elementRef.nativeElement.contains(target);

    // Only close menus if clicked outside the header component
    if (!clickedInside) {
      this.closeMenus();
    }
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
   * Delegates to AuthService which handles token removal, state reset, and notification
   */
  onLogout(): void {
    this.closeMenus();
    // AuthService.logout() handles everything (tokens, state, notification)
    this.authService.logout();
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

  /**
   * Get the appropriate profile route based on user role and mentor status
   * Priority: Approved Mentor > Pending Mentor > Regular User
   *
   * @param user The authenticated user
   * @returns Profile route path
   */
  getProfileRoute(user: AuthUser | null): string {
    if (!user) return '/user/profile';

    // Approved mentors: Route to mentor profile
    if (this.hasRole(user, UserRole.Mentor)) {
      return '/mentor/profile';
    }

    // Pending mentors: Route to application-pending page
    // (Users with isMentor=true but no Mentor role - Types 2 & 3)
    if (user.isMentor) {
      return '/mentor/application-pending';
    }

    // Default to user profile for all other cases:
    // - Regular users (Type 1)
    // - Admins (unless they're also approved mentors)
    return '/user/profile';
  }

  /**
   * Get the appropriate sessions route based on user role
   * Approved mentors go to mentor sessions, others go to user sessions
   *
   * @param user The authenticated user
   * @returns Sessions route path
   */
  getSessionsRoute(user: AuthUser | null): string {
    if (!user) return '/user/sessions';

    // Approved mentors: Route to mentor sessions
    if (this.hasRole(user, UserRole.Mentor)) {
      return '/mentor/sessions';
    }

    // All other users (regular users, pending mentors): Route to user sessions
    return '/user/sessions';
  }
}
