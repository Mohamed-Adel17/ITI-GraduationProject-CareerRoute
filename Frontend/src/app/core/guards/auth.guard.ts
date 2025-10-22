import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Authentication guard to protect routes that require user authentication
 *
 * This guard:
 * - Checks if user has a valid authentication token
 * - Redirects to login page if not authenticated
 * - Preserves the intended destination URL for redirect after login
 * - Uses functional guard pattern (Angular 15+)
 *
 * Usage in routes:
 * ```typescript
 * {
 *   path: 'dashboard',
 *   component: DashboardComponent,
 *   canActivate: [authGuard]
 * }
 * ```
 *
 * @param route The activated route snapshot
 * @param state The router state snapshot
 * @returns true if user is authenticated, otherwise redirects to login
 */
export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if user is authenticated
  if (authService.isAuthenticated()) {
    // Check if token is expired (client-side check)
    if (!authService.isTokenExpired()) {
      return true;
    } else {
      // Token is expired, remove it and redirect to login
      console.warn('Auth Guard: Token expired, redirecting to login');
      authService.removeTokens();
      return router.createUrlTree(['/login'], {
        queryParams: { returnUrl: state.url }
      });
    }
  }

  // User is not authenticated, redirect to login
  console.warn('Auth Guard: User not authenticated, redirecting to login');
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url }
  });
};

/**
 * Guest guard to prevent authenticated users from accessing login/register pages
 *
 * This guard:
 * - Checks if user is already authenticated
 * - Redirects to dashboard/home if authenticated
 * - Allows access to login/register pages only for unauthenticated users
 * - Uses functional guard pattern (Angular 15+)
 *
 * Usage in routes:
 * ```typescript
 * {
 *   path: 'login',
 *   component: LoginComponent,
 *   canActivate: [guestGuard]
 * }
 * ```
 *
 * @param route The activated route snapshot
 * @param state The router state snapshot
 * @returns true if user is not authenticated, otherwise redirects to dashboard
 */
export const guestGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if user is authenticated
  if (authService.isAuthenticated() && !authService.isTokenExpired()) {
    // User is already logged in, redirect to dashboard
    console.info('Guest Guard: User already authenticated, redirecting to dashboard');
    return router.createUrlTree(['/dashboard']);
  }

  // User is not authenticated, allow access to login/register
  return true;
};

/**
 * Role-based authorization guard factory
 *
 * This guard:
 * - Checks if user has required role(s)
 * - Redirects to unauthorized page if user doesn't have required role
 * - Can check for single role or multiple roles
 * - Uses functional guard pattern (Angular 15+)
 *
 * Usage in routes:
 * ```typescript
 * {
 *   path: 'admin',
 *   component: AdminComponent,
 *   canActivate: [roleGuard(['Admin'])]
 * }
 * ```
 *
 * @param allowedRoles Array of allowed role names
 * @returns Guard function that checks user roles
 */
export function roleGuard(allowedRoles: string[]): CanActivateFn {
  return (
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | UrlTree => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // First check if user is authenticated
    if (!authService.isAuthenticated() || authService.isTokenExpired()) {
      console.warn('Role Guard: User not authenticated, redirecting to login');
      authService.removeTokens();
      return router.createUrlTree(['/login'], {
        queryParams: { returnUrl: state.url }
      });
    }

    // Get user information from token
    const user = authService.getUserFromToken();

    if (!user) {
      console.warn('Role Guard: Unable to decode user token, redirecting to login');
      authService.removeTokens();
      return router.createUrlTree(['/login']);
    }

    // Check if user has any of the allowed roles
    // Note: The role claim name might vary based on your backend configuration
    // Common claim names: 'role', 'roles', 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
    const userRole = user['role'] || user['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];

    if (!userRole) {
      console.warn('Role Guard: No role found in token, redirecting to unauthorized');
      return router.createUrlTree(['/unauthorized']);
    }

    // Handle both single role (string) and multiple roles (array)
    const userRoles = Array.isArray(userRole) ? userRole : [userRole];

    // Check if user has any of the allowed roles
    const hasRole = userRoles.some(role => allowedRoles.includes(role));

    if (hasRole) {
      return true;
    }

    // User doesn't have required role
    console.warn(`Role Guard: User role(s) [${userRoles.join(', ')}] not authorized. Required: [${allowedRoles.join(', ')}]`);
    return router.createUrlTree(['/unauthorized']);
  };
}

/**
 * Mentor-specific authorization guard
 *
 * This guard:
 * - Checks if user has 'Mentor' role
 * - Redirects to unauthorized page if not a mentor
 * - Uses functional guard pattern (Angular 15+)
 *
 * Usage in routes:
 * ```typescript
 * {
 *   path: 'mentor/dashboard',
 *   component: MentorDashboardComponent,
 *   canActivate: [mentorGuard]
 * }
 * ```
 */
export const mentorGuard: CanActivateFn = roleGuard(['Mentor']);

/**
 * Admin-specific authorization guard
 *
 * This guard:
 * - Checks if user has 'Admin' role
 * - Redirects to unauthorized page if not an admin
 * - Uses functional guard pattern (Angular 15+)
 *
 * Usage in routes:
 * ```typescript
 * {
 *   path: 'admin',
 *   component: AdminComponent,
 *   canActivate: [adminGuard]
 * }
 * ```
 */
export const adminGuard: CanActivateFn = roleGuard(['Admin']);
