import { inject } from '@angular/core';
import { CanActivateFn, CanActivateChildFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Role-based authorization configuration
 */
export interface RoleGuardConfig {
  /** Array of allowed roles - user must have at least one */
  allowedRoles?: string[];
  /** Array of required roles - user must have all of them */
  requiredRoles?: string[];
  /** Array of denied roles - user must not have any of them */
  deniedRoles?: string[];
  /** Custom redirect path on failure (default: '/unauthorized') */
  redirectTo?: string;
  /** Whether to redirect to login if not authenticated (default: true) */
  redirectToLogin?: boolean;
}

/**
 * Enhanced role-based authorization guard with advanced features
 *
 * This guard provides:
 * - Multiple role checking strategies (any, all, none)
 * - Custom redirect paths
 * - Fine-grained role requirements
 * - Support for both route data and direct configuration
 * - Composite role logic (AND/OR conditions)
 *
 * Usage in routes:
 *
 * Method 1: Using route data
 * ```typescript
 * {
 *   path: 'admin',
 *   component: AdminComponent,
 *   canActivate: [roleGuard],
 *   data: {
 *     roles: {
 *       allowedRoles: ['Admin', 'SuperAdmin'],
 *       redirectTo: '/access-denied'
 *     }
 *   }
 * }
 * ```
 *
 * Method 2: Using factory with configuration
 * ```typescript
 * {
 *   path: 'admin',
 *   component: AdminComponent,
 *   canActivate: [createRoleGuard({ allowedRoles: ['Admin'] })]
 * }
 * ```
 *
 * @param route The activated route snapshot
 * @param state The router state snapshot
 * @returns true if authorized, otherwise redirects
 */
export const roleGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Get role configuration from route data
  const config: RoleGuardConfig = route.data['roles'] || {};

  return checkRoleAuthorization(authService, router, config, state.url);
};

/**
 * Role guard for child routes
 * Applies the same role check to all child routes
 */
export const roleGuardChild: CanActivateChildFn = (
  childRoute: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  return roleGuard(childRoute, state);
};

/**
 * Factory function to create a role guard with specific configuration
 *
 * Usage:
 * ```typescript
 * {
 *   path: 'premium',
 *   component: PremiumComponent,
 *   canActivate: [createRoleGuard({
 *     allowedRoles: ['Premium', 'VIP'],
 *     deniedRoles: ['Banned'],
 *     redirectTo: '/upgrade'
 *   })]
 * }
 * ```
 *
 * @param config Role guard configuration
 * @returns Configured guard function
 */
export function createRoleGuard(config: RoleGuardConfig): CanActivateFn {
  return (route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return checkRoleAuthorization(authService, router, config, state.url);
  };
}

/**
 * Guard that requires user to have ALL specified roles
 *
 * Usage:
 * ```typescript
 * {
 *   path: 'super-admin',
 *   component: SuperAdminComponent,
 *   canActivate: [requireAllRoles(['Admin', 'SuperUser'])]
 * }
 * ```
 */
export function requireAllRoles(roles: string[]): CanActivateFn {
  return createRoleGuard({ requiredRoles: roles });
}

/**
 * Guard that requires user to have AT LEAST ONE of the specified roles
 *
 * Usage:
 * ```typescript
 * {
 *   path: 'moderation',
 *   component: ModerationComponent,
 *   canActivate: [requireAnyRole(['Admin', 'Moderator', 'Support'])]
 * }
 * ```
 */
export function requireAnyRole(roles: string[]): CanActivateFn {
  return createRoleGuard({ allowedRoles: roles });
}

/**
 * Guard that denies access if user has ANY of the specified roles
 *
 * Usage:
 * ```typescript
 * {
 *   path: 'user-area',
 *   component: UserAreaComponent,
 *   canActivate: [denyRoles(['Banned', 'Suspended'])]
 * }
 * ```
 */
export function denyRoles(roles: string[]): CanActivateFn {
  return createRoleGuard({ deniedRoles: roles });
}

/**
 * Pre-configured guard for Mentor role
 */
export const mentorRoleGuard: CanActivateFn = createRoleGuard({ allowedRoles: ['Mentor'] });

/**
 * Pre-configured guard for Admin role
 */
export const adminRoleGuard: CanActivateFn = createRoleGuard({ allowedRoles: ['Admin'] });

/**
 * Pre-configured guard for User role
 */
export const userRoleGuard: CanActivateFn = createRoleGuard({ allowedRoles: ['User'] });

/**
 * Guard for premium/paid features - requires Premium or VIP role
 */
export const premiumRoleGuard: CanActivateFn = createRoleGuard({
  allowedRoles: ['Premium', 'VIP'],
  redirectTo: '/upgrade'
});

/**
 * Guard for mentor application - denies access to users who are already mentors
 * Redirects mentors to their mentor dashboard
 */
export const notMentorGuard: CanActivateFn = createRoleGuard({
  deniedRoles: ['Mentor'],
  redirectTo: '/mentor/dashboard'
});

/**
 * Core authorization logic
 * Extracted for reusability and testing
 */
function checkRoleAuthorization(
  authService: AuthService,
  router: Router,
  config: RoleGuardConfig,
  currentUrl: string
): boolean | UrlTree {
  const {
    allowedRoles = [],
    requiredRoles = [],
    deniedRoles = [],
    redirectTo = '/unauthorized',
    redirectToLogin = true
  } = config;

  // Check if user is authenticated
  if (!authService.isAuthenticated() || authService.isTokenExpired()) {
    if (redirectToLogin) {
      console.warn('Role Guard: User not authenticated, redirecting to login');
      authService.removeTokens();
      return router.createUrlTree(['/login'], {
        queryParams: { returnUrl: currentUrl }
      });
    } else {
      console.warn('Role Guard: User not authenticated, redirecting to:', redirectTo);
      return router.createUrlTree([redirectTo]);
    }
  }

  // Get user information from token
  const user = authService.getUserFromToken();

  if (!user) {
    console.warn('Role Guard: Unable to decode user token, redirecting to login');
    authService.removeTokens();
    return router.createUrlTree(['/login']);
  }

  // Extract user roles from token
  const userRoles = extractUserRoles(user);

  if (!userRoles || userRoles.length === 0) {
    console.warn('Role Guard: No roles found in token, redirecting to:', redirectTo);
    return router.createUrlTree([redirectTo]);
  }

  // Check denied roles first (highest priority)
  if (deniedRoles.length > 0) {
    const hasDeniedRole = userRoles.some(role => deniedRoles.includes(role));
    if (hasDeniedRole) {
      console.warn(`Role Guard: User has denied role(s). User roles: [${userRoles.join(', ')}], Denied: [${deniedRoles.join(', ')}]`);
      return router.createUrlTree([redirectTo]);
    }
  }

  // Check required roles (user must have ALL of them)
  if (requiredRoles.length > 0) {
    const hasAllRequiredRoles = requiredRoles.every(role => userRoles.includes(role));
    if (!hasAllRequiredRoles) {
      console.warn(`Role Guard: User missing required role(s). User roles: [${userRoles.join(', ')}], Required (all): [${requiredRoles.join(', ')}]`);
      return router.createUrlTree([redirectTo]);
    }
  }

  // Check allowed roles (user must have AT LEAST ONE)
  if (allowedRoles.length > 0) {
    const hasAllowedRole = userRoles.some(role => allowedRoles.includes(role));
    if (!hasAllowedRole) {
      console.warn(`Role Guard: User doesn't have allowed role(s). User roles: [${userRoles.join(', ')}], Allowed (any): [${allowedRoles.join(', ')}]`);
      return router.createUrlTree([redirectTo]);
    }
  }

  // If no specific role requirements are set and we reach here, allow access
  if (allowedRoles.length === 0 && requiredRoles.length === 0) {
    console.info('Role Guard: No role requirements specified, allowing access for authenticated user');
  } else {
    console.info(`Role Guard: Authorization successful. User roles: [${userRoles.join(', ')}]`);
  }

  return true;
}

/**
 * Extract user roles from JWT token payload
 * Handles multiple JWT role claim formats
 */
function extractUserRoles(user: any): string[] {
  // Try different role claim names (in order of preference)
  const roleClaims = [
    'role',
    'roles',
    'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role'
  ];

  for (const claim of roleClaims) {
    const roleValue = user[claim];
    if (roleValue) {
      // Handle both single role (string) and multiple roles (array)
      return Array.isArray(roleValue) ? roleValue : [roleValue];
    }
  }

  return [];
}

/**
 * Helper function to check if user has specific role
 * Can be used in components for conditional rendering
 *
 * Usage in components:
 * ```typescript
 * import { hasRole } from './core/guards/role.guard';
 *
 * export class MyComponent {
 *   canEdit = hasRole(this.authService, 'Admin');
 * }
 * ```
 */
export function hasRole(authService: AuthService, role: string): boolean {
  const user = authService.getUserFromToken();
  if (!user) return false;

  const userRoles = extractUserRoles(user);
  return userRoles.includes(role);
}

/**
 * Helper function to check if user has any of the specified roles
 */
export function hasAnyRole(authService: AuthService, roles: string[]): boolean {
  const user = authService.getUserFromToken();
  if (!user) return false;

  const userRoles = extractUserRoles(user);
  return roles.some(role => userRoles.includes(role));
}

/**
 * Helper function to check if user has all of the specified roles
 */
export function hasAllRoles(authService: AuthService, roles: string[]): boolean {
  const user = authService.getUserFromToken();
  if (!user) return false;

  const userRoles = extractUserRoles(user);
  return roles.every(role => userRoles.includes(role));
}

/**
 * Helper function to get user's current roles
 */
export function getUserRoles(authService: AuthService): string[] {
  const user = authService.getUserFromToken();
  if (!user) return [];

  return extractUserRoles(user);
}
