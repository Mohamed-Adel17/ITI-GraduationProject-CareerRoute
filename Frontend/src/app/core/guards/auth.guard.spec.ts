import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { authGuard, guestGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('Auth Guards', () => {
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
    mockRoute = {} as ActivatedRouteSnapshot;
    mockState = { url: '/dashboard' } as RouterStateSnapshot;

    // Configure TestBed
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter }
      ]
    });
  });

  describe('authGuard', () => {
    it('should allow access when user is authenticated and token is valid', () => {
      mockAuthService.isAuthenticated.and.returnValue(true);
      mockAuthService.isTokenExpired.and.returnValue(false);

      const result = TestBed.runInInjectionContext(() =>
        authGuard(mockRoute, mockState)
      );

      expect(result).toBe(true);
      expect(mockAuthService.isAuthenticated).toHaveBeenCalled();
      expect(mockAuthService.isTokenExpired).toHaveBeenCalled();
    });

    it('should redirect to login when user is not authenticated', () => {
      mockAuthService.isAuthenticated.and.returnValue(false);
      const urlTree = {} as UrlTree;
      mockRouter.createUrlTree.and.returnValue(urlTree);

      const result = TestBed.runInInjectionContext(() =>
        authGuard(mockRoute, mockState)
      );

      expect(result).toBe(urlTree);
      expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/login'], {
        queryParams: { returnUrl: '/dashboard' }
      });
    });

    it('should redirect to login when token is expired', () => {
      mockAuthService.isAuthenticated.and.returnValue(true);
      mockAuthService.isTokenExpired.and.returnValue(true);
      const urlTree = {} as UrlTree;
      mockRouter.createUrlTree.and.returnValue(urlTree);

      const result = TestBed.runInInjectionContext(() =>
        authGuard(mockRoute, mockState)
      );

      expect(result).toBe(urlTree);
      expect(mockAuthService.removeTokens).toHaveBeenCalled();
      expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/login'], {
        queryParams: { returnUrl: '/dashboard' }
      });
    });

    it('should preserve returnUrl in query params', () => {
      mockAuthService.isAuthenticated.and.returnValue(false);
      const customState = { url: '/mentor/profile' } as RouterStateSnapshot;
      const urlTree = {} as UrlTree;
      mockRouter.createUrlTree.and.returnValue(urlTree);

      TestBed.runInInjectionContext(() =>
        authGuard(mockRoute, customState)
      );

      expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/login'], {
        queryParams: { returnUrl: '/mentor/profile' }
      });
    });
  });

  describe('guestGuard', () => {
    it('should allow access when user is not authenticated', () => {
      mockAuthService.isAuthenticated.and.returnValue(false);

      const result = TestBed.runInInjectionContext(() =>
        guestGuard(mockRoute, mockState)
      );

      expect(result).toBe(true);
    });

    it('should redirect to dashboard when user is authenticated', () => {
      mockAuthService.isAuthenticated.and.returnValue(true);
      mockAuthService.isTokenExpired.and.returnValue(false);
      const urlTree = {} as UrlTree;
      mockRouter.createUrlTree.and.returnValue(urlTree);

      const result = TestBed.runInInjectionContext(() =>
        guestGuard(mockRoute, mockState)
      );

      expect(result).toBe(urlTree);
      expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/dashboard']);
    });

    it('should allow access when token is expired', () => {
      mockAuthService.isAuthenticated.and.returnValue(true);
      mockAuthService.isTokenExpired.and.returnValue(true);

      const result = TestBed.runInInjectionContext(() =>
        guestGuard(mockRoute, mockState)
      );

      expect(result).toBe(true);
    });
  });

});
