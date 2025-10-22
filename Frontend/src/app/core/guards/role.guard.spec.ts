import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import {
  roleGuard,
  roleGuardChild,
  createRoleGuard,
  requireAllRoles,
  requireAnyRole,
  denyRoles,
  mentorRoleGuard,
  adminRoleGuard,
  userRoleGuard,
  premiumRoleGuard,
  hasRole,
  hasAnyRole,
  hasAllRoles,
  getUserRoles,
  RoleGuardConfig
} from './role.guard';
import { AuthService } from '../services/auth.service';

describe('Role Guards', () => {
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockRoute: ActivatedRouteSnapshot;
  let mockState: RouterStateSnapshot;

  beforeEach(() => {
    // Create mock services
    mockAuthService = jasmine.createSpyObj('AuthService', [
      'isAuthenticated',
      'isTokenExpired',
      'removeTokens',
      'getUserFromToken'
    ]);
    mockRouter = jasmine.createSpyObj('Router', ['createUrlTree']);

    // Create mock route and state
    mockRoute = { data: {} } as ActivatedRouteSnapshot;
    mockState = { url: '/test' } as RouterStateSnapshot;

    // Configure TestBed
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter }
      ]
    });
  });

  describe('roleGuard with route data', () => {
    it('should allow access when user has allowed role', () => {
      mockRoute.data = { roles: { allowedRoles: ['Admin'] } };
      mockAuthService.isAuthenticated.and.returnValue(true);
      mockAuthService.isTokenExpired.and.returnValue(false);
      mockAuthService.getUserFromToken.and.returnValue({ role: 'Admin' });

      const result = TestBed.runInInjectionContext(() =>
        roleGuard(mockRoute, mockState)
      );

      expect(result).toBe(true);
    });

    it('should deny access when user lacks allowed role', () => {
      mockRoute.data = { roles: { allowedRoles: ['Admin'] } };
      mockAuthService.isAuthenticated.and.returnValue(true);
      mockAuthService.isTokenExpired.and.returnValue(false);
      mockAuthService.getUserFromToken.and.returnValue({ role: 'User' });
      const urlTree = {} as UrlTree;
      mockRouter.createUrlTree.and.returnValue(urlTree);

      const result = TestBed.runInInjectionContext(() =>
        roleGuard(mockRoute, mockState)
      );

      expect(result).toBe(urlTree);
      expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/unauthorized']);
    });

    it('should use custom redirect path', () => {
      mockRoute.data = {
        roles: {
          allowedRoles: ['Premium'],
          redirectTo: '/upgrade'
        }
      };
      mockAuthService.isAuthenticated.and.returnValue(true);
      mockAuthService.isTokenExpired.and.returnValue(false);
      mockAuthService.getUserFromToken.and.returnValue({ role: 'User' });
      const urlTree = {} as UrlTree;
      mockRouter.createUrlTree.and.returnValue(urlTree);

      const result = TestBed.runInInjectionContext(() =>
        roleGuard(mockRoute, mockState)
      );

      expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/upgrade']);
    });

    it('should redirect to custom path when not authenticated and redirectToLogin is false', () => {
      mockRoute.data = {
        roles: {
          allowedRoles: ['Admin'],
          redirectToLogin: false,
          redirectTo: '/access-denied'
        }
      };
      mockAuthService.isAuthenticated.and.returnValue(false);
      const urlTree = {} as UrlTree;
      mockRouter.createUrlTree.and.returnValue(urlTree);

      const result = TestBed.runInInjectionContext(() =>
        roleGuard(mockRoute, mockState)
      );

      expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/access-denied']);
    });
  });

  describe('createRoleGuard factory', () => {
    it('should create guard with allowed roles', () => {
      const config: RoleGuardConfig = { allowedRoles: ['Mentor'] };
      const guard = createRoleGuard(config);

      mockAuthService.isAuthenticated.and.returnValue(true);
      mockAuthService.isTokenExpired.and.returnValue(false);
      mockAuthService.getUserFromToken.and.returnValue({ role: 'Mentor' });

      const result = TestBed.runInInjectionContext(() =>
        guard(mockRoute, mockState)
      );

      expect(result).toBe(true);
    });

    it('should create guard with required roles (all required)', () => {
      const config: RoleGuardConfig = { requiredRoles: ['Admin', 'SuperUser'] };
      const guard = createRoleGuard(config);

      mockAuthService.isAuthenticated.and.returnValue(true);
      mockAuthService.isTokenExpired.and.returnValue(false);
      mockAuthService.getUserFromToken.and.returnValue({ role: ['Admin', 'SuperUser'] });

      const result = TestBed.runInInjectionContext(() =>
        guard(mockRoute, mockState)
      );

      expect(result).toBe(true);
    });

    it('should deny access when user missing one required role', () => {
      const config: RoleGuardConfig = { requiredRoles: ['Admin', 'SuperUser'] };
      const guard = createRoleGuard(config);

      mockAuthService.isAuthenticated.and.returnValue(true);
      mockAuthService.isTokenExpired.and.returnValue(false);
      mockAuthService.getUserFromToken.and.returnValue({ role: ['Admin'] }); // Missing SuperUser
      const urlTree = {} as UrlTree;
      mockRouter.createUrlTree.and.returnValue(urlTree);

      const result = TestBed.runInInjectionContext(() =>
        guard(mockRoute, mockState)
      );

      expect(result).toBe(urlTree);
    });

    it('should deny access when user has denied role', () => {
      const config: RoleGuardConfig = {
        allowedRoles: ['User'],
        deniedRoles: ['Banned', 'Suspended']
      };
      const guard = createRoleGuard(config);

      mockAuthService.isAuthenticated.and.returnValue(true);
      mockAuthService.isTokenExpired.and.returnValue(false);
      mockAuthService.getUserFromToken.and.returnValue({ role: ['User', 'Banned'] });
      const urlTree = {} as UrlTree;
      mockRouter.createUrlTree.and.returnValue(urlTree);

      const result = TestBed.runInInjectionContext(() =>
        guard(mockRoute, mockState)
      );

      expect(result).toBe(urlTree);
    });
  });

  describe('requireAllRoles', () => {
    it('should allow access when user has all required roles', () => {
      const guard = requireAllRoles(['Admin', 'Moderator']);

      mockAuthService.isAuthenticated.and.returnValue(true);
      mockAuthService.isTokenExpired.and.returnValue(false);
      mockAuthService.getUserFromToken.and.returnValue({ role: ['Admin', 'Moderator', 'User'] });

      const result = TestBed.runInInjectionContext(() =>
        guard(mockRoute, mockState)
      );

      expect(result).toBe(true);
    });

    it('should deny access when user lacks one required role', () => {
      const guard = requireAllRoles(['Admin', 'Moderator']);

      mockAuthService.isAuthenticated.and.returnValue(true);
      mockAuthService.isTokenExpired.and.returnValue(false);
      mockAuthService.getUserFromToken.and.returnValue({ role: ['Admin'] });
      const urlTree = {} as UrlTree;
      mockRouter.createUrlTree.and.returnValue(urlTree);

      const result = TestBed.runInInjectionContext(() =>
        guard(mockRoute, mockState)
      );

      expect(result).toBe(urlTree);
    });
  });

  describe('requireAnyRole', () => {
    it('should allow access when user has one of the allowed roles', () => {
      const guard = requireAnyRole(['Admin', 'Moderator', 'Support']);

      mockAuthService.isAuthenticated.and.returnValue(true);
      mockAuthService.isTokenExpired.and.returnValue(false);
      mockAuthService.getUserFromToken.and.returnValue({ role: 'Moderator' });

      const result = TestBed.runInInjectionContext(() =>
        guard(mockRoute, mockState)
      );

      expect(result).toBe(true);
    });

    it('should deny access when user has none of the allowed roles', () => {
      const guard = requireAnyRole(['Admin', 'Moderator']);

      mockAuthService.isAuthenticated.and.returnValue(true);
      mockAuthService.isTokenExpired.and.returnValue(false);
      mockAuthService.getUserFromToken.and.returnValue({ role: 'User' });
      const urlTree = {} as UrlTree;
      mockRouter.createUrlTree.and.returnValue(urlTree);

      const result = TestBed.runInInjectionContext(() =>
        guard(mockRoute, mockState)
      );

      expect(result).toBe(urlTree);
    });
  });

  describe('denyRoles', () => {
    it('should allow access when user does not have denied roles', () => {
      const guard = denyRoles(['Banned', 'Suspended']);

      mockAuthService.isAuthenticated.and.returnValue(true);
      mockAuthService.isTokenExpired.and.returnValue(false);
      mockAuthService.getUserFromToken.and.returnValue({ role: 'User' });

      const result = TestBed.runInInjectionContext(() =>
        guard(mockRoute, mockState)
      );

      expect(result).toBe(true);
    });

    it('should deny access when user has a denied role', () => {
      const guard = denyRoles(['Banned', 'Suspended']);

      mockAuthService.isAuthenticated.and.returnValue(true);
      mockAuthService.isTokenExpired.and.returnValue(false);
      mockAuthService.getUserFromToken.and.returnValue({ role: ['User', 'Banned'] });
      const urlTree = {} as UrlTree;
      mockRouter.createUrlTree.and.returnValue(urlTree);

      const result = TestBed.runInInjectionContext(() =>
        guard(mockRoute, mockState)
      );

      expect(result).toBe(urlTree);
    });
  });

  describe('Pre-configured guards', () => {
    it('mentorRoleGuard should allow Mentor role', () => {
      mockAuthService.isAuthenticated.and.returnValue(true);
      mockAuthService.isTokenExpired.and.returnValue(false);
      mockAuthService.getUserFromToken.and.returnValue({ role: 'Mentor' });

      const result = TestBed.runInInjectionContext(() =>
        mentorRoleGuard(mockRoute, mockState)
      );

      expect(result).toBe(true);
    });

    it('adminRoleGuard should allow Admin role', () => {
      mockAuthService.isAuthenticated.and.returnValue(true);
      mockAuthService.isTokenExpired.and.returnValue(false);
      mockAuthService.getUserFromToken.and.returnValue({ role: 'Admin' });

      const result = TestBed.runInInjectionContext(() =>
        adminRoleGuard(mockRoute, mockState)
      );

      expect(result).toBe(true);
    });

    it('userRoleGuard should allow User role', () => {
      mockAuthService.isAuthenticated.and.returnValue(true);
      mockAuthService.isTokenExpired.and.returnValue(false);
      mockAuthService.getUserFromToken.and.returnValue({ role: 'User' });

      const result = TestBed.runInInjectionContext(() =>
        userRoleGuard(mockRoute, mockState)
      );

      expect(result).toBe(true);
    });

    it('premiumRoleGuard should allow Premium role', () => {
      mockAuthService.isAuthenticated.and.returnValue(true);
      mockAuthService.isTokenExpired.and.returnValue(false);
      mockAuthService.getUserFromToken.and.returnValue({ role: 'Premium' });

      const result = TestBed.runInInjectionContext(() =>
        premiumRoleGuard(mockRoute, mockState)
      );

      expect(result).toBe(true);
    });

    it('premiumRoleGuard should redirect to /upgrade', () => {
      mockAuthService.isAuthenticated.and.returnValue(true);
      mockAuthService.isTokenExpired.and.returnValue(false);
      mockAuthService.getUserFromToken.and.returnValue({ role: 'User' });
      const urlTree = {} as UrlTree;
      mockRouter.createUrlTree.and.returnValue(urlTree);

      const result = TestBed.runInInjectionContext(() =>
        premiumRoleGuard(mockRoute, mockState)
      );

      expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/upgrade']);
    });
  });

  describe('Role extraction from different claim formats', () => {
    it('should extract role from standard "role" claim', () => {
      const guard = createRoleGuard({ allowedRoles: ['Admin'] });

      mockAuthService.isAuthenticated.and.returnValue(true);
      mockAuthService.isTokenExpired.and.returnValue(false);
      mockAuthService.getUserFromToken.and.returnValue({ role: 'Admin' });

      const result = TestBed.runInInjectionContext(() =>
        guard(mockRoute, mockState)
      );

      expect(result).toBe(true);
    });

    it('should extract roles from "roles" claim (array)', () => {
      const guard = createRoleGuard({ allowedRoles: ['Admin'] });

      mockAuthService.isAuthenticated.and.returnValue(true);
      mockAuthService.isTokenExpired.and.returnValue(false);
      mockAuthService.getUserFromToken.and.returnValue({ roles: ['User', 'Admin'] });

      const result = TestBed.runInInjectionContext(() =>
        guard(mockRoute, mockState)
      );

      expect(result).toBe(true);
    });

    it('should extract role from ASP.NET Core claim format', () => {
      const guard = createRoleGuard({ allowedRoles: ['Admin'] });

      mockAuthService.isAuthenticated.and.returnValue(true);
      mockAuthService.isTokenExpired.and.returnValue(false);
      mockAuthService.getUserFromToken.and.returnValue({
        'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': 'Admin'
      });

      const result = TestBed.runInInjectionContext(() =>
        guard(mockRoute, mockState)
      );

      expect(result).toBe(true);
    });
  });

  describe('Helper functions', () => {
    describe('hasRole', () => {
      it('should return true when user has the role', () => {
        mockAuthService.getUserFromToken.and.returnValue({ role: 'Admin' });

        const result = hasRole(mockAuthService, 'Admin');

        expect(result).toBe(true);
      });

      it('should return false when user does not have the role', () => {
        mockAuthService.getUserFromToken.and.returnValue({ role: 'User' });

        const result = hasRole(mockAuthService, 'Admin');

        expect(result).toBe(false);
      });

      it('should return false when user token cannot be decoded', () => {
        mockAuthService.getUserFromToken.and.returnValue(null);

        const result = hasRole(mockAuthService, 'Admin');

        expect(result).toBe(false);
      });
    });

    describe('hasAnyRole', () => {
      it('should return true when user has one of the roles', () => {
        mockAuthService.getUserFromToken.and.returnValue({ role: 'Moderator' });

        const result = hasAnyRole(mockAuthService, ['Admin', 'Moderator', 'Support']);

        expect(result).toBe(true);
      });

      it('should return false when user has none of the roles', () => {
        mockAuthService.getUserFromToken.and.returnValue({ role: 'User' });

        const result = hasAnyRole(mockAuthService, ['Admin', 'Moderator']);

        expect(result).toBe(false);
      });
    });

    describe('hasAllRoles', () => {
      it('should return true when user has all roles', () => {
        mockAuthService.getUserFromToken.and.returnValue({ role: ['Admin', 'Moderator', 'User'] });

        const result = hasAllRoles(mockAuthService, ['Admin', 'Moderator']);

        expect(result).toBe(true);
      });

      it('should return false when user lacks one role', () => {
        mockAuthService.getUserFromToken.and.returnValue({ role: ['Admin'] });

        const result = hasAllRoles(mockAuthService, ['Admin', 'Moderator']);

        expect(result).toBe(false);
      });
    });

    describe('getUserRoles', () => {
      it('should return user roles as array', () => {
        mockAuthService.getUserFromToken.and.returnValue({ role: ['Admin', 'User'] });

        const result = getUserRoles(mockAuthService);

        expect(result).toEqual(['Admin', 'User']);
      });

      it('should return empty array when no roles found', () => {
        mockAuthService.getUserFromToken.and.returnValue({ name: 'John' });

        const result = getUserRoles(mockAuthService);

        expect(result).toEqual([]);
      });

      it('should return empty array when user token cannot be decoded', () => {
        mockAuthService.getUserFromToken.and.returnValue(null);

        const result = getUserRoles(mockAuthService);

        expect(result).toEqual([]);
      });
    });
  });

  describe('roleGuardChild', () => {
    it('should work for child routes', () => {
      mockRoute.data = { roles: { allowedRoles: ['Admin'] } };
      mockAuthService.isAuthenticated.and.returnValue(true);
      mockAuthService.isTokenExpired.and.returnValue(false);
      mockAuthService.getUserFromToken.and.returnValue({ role: 'Admin' });

      const result = TestBed.runInInjectionContext(() =>
        roleGuardChild(mockRoute, mockState)
      );

      expect(result).toBe(true);
    });
  });

  describe('Authentication checks', () => {
    it('should redirect to login when not authenticated', () => {
      const guard = createRoleGuard({ allowedRoles: ['Admin'] });
      mockAuthService.isAuthenticated.and.returnValue(false);
      const urlTree = {} as UrlTree;
      mockRouter.createUrlTree.and.returnValue(urlTree);

      const result = TestBed.runInInjectionContext(() =>
        guard(mockRoute, mockState)
      );

      expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/login'], {
        queryParams: { returnUrl: '/test' }
      });
    });

    it('should redirect to login when token is expired', () => {
      const guard = createRoleGuard({ allowedRoles: ['Admin'] });
      mockAuthService.isAuthenticated.and.returnValue(true);
      mockAuthService.isTokenExpired.and.returnValue(true);
      const urlTree = {} as UrlTree;
      mockRouter.createUrlTree.and.returnValue(urlTree);

      const result = TestBed.runInInjectionContext(() =>
        guard(mockRoute, mockState)
      );

      expect(mockAuthService.removeTokens).toHaveBeenCalled();
      expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/login'], {
        queryParams: { returnUrl: '/test' }
      });
    });
  });
});
