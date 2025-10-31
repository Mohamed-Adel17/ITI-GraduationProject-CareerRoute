import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

describe('App Routes', () => {
  let router: Router;
  let location: Location;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter(routes)]
    });

    router = TestBed.inject(Router);
    location = TestBed.inject(Location);
  });

  it('should create routes configuration', () => {
    expect(routes).toBeDefined();
    expect(routes.length).toBeGreaterThan(0);
  });

  it('should have public routes as root path', () => {
    const publicRoute = routes.find(r => r.path === '');
    expect(publicRoute).toBeDefined();
    expect(publicRoute?.loadChildren).toBeDefined();
  });

  it('should have user routes protected by authGuard', () => {
    const userRoute = routes.find(r => r.path === 'user');
    expect(userRoute).toBeDefined();
    expect(userRoute?.canActivate).toBeDefined();
    expect(userRoute?.canActivate?.length).toBeGreaterThan(0);
    expect(userRoute?.loadChildren).toBeDefined();
  });

  it('should have mentor routes protected by mentorGuard', () => {
    const mentorRoute = routes.find(r => r.path === 'mentor');
    expect(mentorRoute).toBeDefined();
    expect(mentorRoute?.canActivate).toBeDefined();
    expect(mentorRoute?.canActivate?.length).toBeGreaterThan(0);
    expect(mentorRoute?.loadChildren).toBeDefined();
  });

  it('should have admin routes protected by adminGuard', () => {
    const adminRoute = routes.find(r => r.path === 'admin');
    expect(adminRoute).toBeDefined();
    expect(adminRoute?.canActivate).toBeDefined();
    expect(adminRoute?.canActivate?.length).toBeGreaterThan(0);
    expect(adminRoute?.loadChildren).toBeDefined();
  });

  it('should have error routes', () => {
    const errorsRoute = routes.find(r => r.path === 'errors');
    expect(errorsRoute).toBeDefined();
    expect(errorsRoute?.loadChildren).toBeDefined();
  });

  it('should have wildcard route that redirects to not-found', () => {
    const wildcardRoute = routes.find(r => r.path === '**');
    expect(wildcardRoute).toBeDefined();
    expect(wildcardRoute?.redirectTo).toBe('errors/not-found');
  });

  it('should redirect unknown routes to not-found', async () => {
    await router.navigate(['/unknown-route']);
    expect(location.path()).toBe('/errors/not-found');
  });

  describe('Lazy Loading', () => {
    it('should lazy load public routes', async () => {
      const publicRoute = routes.find(r => r.path === '');
      expect(publicRoute?.loadChildren).toBeDefined();

      if (publicRoute?.loadChildren) {
        const loadedRoutes = await publicRoute.loadChildren();
        expect(loadedRoutes).toBeDefined();
      }
    });

    it('should lazy load user routes', async () => {
      const userRoute = routes.find(r => r.path === 'user');
      expect(userRoute?.loadChildren).toBeDefined();

      if (userRoute?.loadChildren) {
        const loadedRoutes = await userRoute.loadChildren();
        expect(loadedRoutes).toBeDefined();
      }
    });

    it('should lazy load mentor routes', async () => {
      const mentorRoute = routes.find(r => r.path === 'mentor');
      expect(mentorRoute?.loadChildren).toBeDefined();

      if (mentorRoute?.loadChildren) {
        const loadedRoutes = await mentorRoute.loadChildren();
        expect(loadedRoutes).toBeDefined();
      }
    });

    it('should lazy load admin routes', async () => {
      const adminRoute = routes.find(r => r.path === 'admin');
      expect(adminRoute?.loadChildren).toBeDefined();

      if (adminRoute?.loadChildren) {
        const loadedRoutes = await adminRoute.loadChildren();
        expect(loadedRoutes).toBeDefined();
      }
    });

    it('should lazy load errors routes', async () => {
      const errorsRoute = routes.find(r => r.path === 'errors');
      expect(errorsRoute?.loadChildren).toBeDefined();

      if (errorsRoute?.loadChildren) {
        const loadedRoutes = await errorsRoute.loadChildren();
        expect(loadedRoutes).toBeDefined();
      }
    });
  });

  describe('Route Structure', () => {
    it('should have exactly 6 routes configured (public, user, mentor, admin, errors, wildcard)', () => {
      expect(routes.length).toBe(6);
    });

    it('should have all required feature module paths', () => {
      const paths = routes.map(r => r.path);
      expect(paths).toContain('');
      expect(paths).toContain('user');
      expect(paths).toContain('mentor');
      expect(paths).toContain('admin');
      expect(paths).toContain('errors');
      expect(paths).toContain('**');
    });
  });
});
