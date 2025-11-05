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
      return router.createUrlTree(['/auth/login'], {
        queryParams: { returnUrl: state.url }
      });
    }
  }

  // User is not authenticated, redirect to login
  console.warn('Auth Guard: User not authenticated, redirecting to login');
  return router.createUrlTree(['/auth/login'], {
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
    return router.createUrlTree(['/user/dashboard']);
  }

  // User is not authenticated, allow access to login/register
  return true;
};
