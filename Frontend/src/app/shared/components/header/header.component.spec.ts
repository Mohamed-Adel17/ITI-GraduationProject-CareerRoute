import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, BehaviorSubject, throwError } from 'rxjs';
import { HeaderComponent } from './header.component';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthUser } from '../../models/auth.model';
import { UserRole } from '../../models/user.model';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let notificationService: jasmine.SpyObj<NotificationService>;
  let router: Router;

  // Mock user data
  const mockUser: AuthUser = {
    id: '123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    emailConfirmed: true,
    roles: [UserRole.User],
    isMentor: false,
    profilePictureUrl: 'https://example.com/avatar.jpg'
  };

  const mockMentorUser: AuthUser = {
    ...mockUser,
    roles: [UserRole.User, UserRole.Mentor],
    isMentor: true,
    mentorId: '456'
  };

  const mockAdminUser: AuthUser = {
    ...mockUser,
    roles: [UserRole.User, UserRole.Admin]
  };

  beforeEach(async () => {
    // Create spy objects for services
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['logout'], {
      isAuthenticated$: of(false),
      currentUser$: of(null)
    });

    const notificationServiceSpy = jasmine.createSpyObj('NotificationService', [
      'showSuccess',
      'showError',
      'info',
      'showWarning'
    ]);

    await TestBed.configureTestingModule({
      imports: [HeaderComponent, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: NotificationService, useValue: notificationServiceSpy }
      ]
    }).compileComponents();

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    router = TestBed.inject(Router);

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should initialize with menus closed', () => {
      expect(component.menuOpen).toBe(false);
      expect(component.userMenuOpen).toBe(false);
    });

    it('should subscribe to auth state observables', () => {
      expect(component.isAuthenticated$).toBeDefined();
      expect(component.currentUser$).toBeDefined();
    });
  });

  describe('Unauthenticated State', () => {
    beforeEach(() => {
      authService.isAuthenticated$ = of(false);
      authService.currentUser$ = of(null);
      fixture.detectChanges();
    });

    it('should display login and register links', () => {
      const compiled = fixture.nativeElement;
      const loginLink = compiled.querySelector('a[routerLink="/login"]');
      const registerLink = compiled.querySelector('a[routerLink="/register"]');

      expect(loginLink).toBeTruthy();
      expect(registerLink).toBeTruthy();
    });

    it('should not display user menu', () => {
      const compiled = fixture.nativeElement;
      const userMenu = compiled.querySelector('[aria-label="User menu"]');

      expect(userMenu).toBeFalsy();
    });

    it('should display main navigation links', () => {
      const compiled = fixture.nativeElement;
      const navLinks = compiled.querySelectorAll('nav[aria-label="Main navigation"] a');

      expect(navLinks.length).toBeGreaterThan(0);
    });
  });

  describe('Authenticated State', () => {
    beforeEach(() => {
      authService.isAuthenticated$ = of(true);
      authService.currentUser$ = of(mockUser);
      fixture.detectChanges();
    });

    it('should display user menu trigger', () => {
      const compiled = fixture.nativeElement;
      const userMenuTrigger = compiled.querySelector('[aria-label="User menu"]');

      expect(userMenuTrigger).toBeTruthy();
    });

    it('should not display login and register links', () => {
      const compiled = fixture.nativeElement;
      const loginLink = compiled.querySelector('a[routerLink="/login"]');
      const registerLink = compiled.querySelector('a[routerLink="/register"]');

      expect(loginLink).toBeFalsy();
      expect(registerLink).toBeFalsy();
    });

    it('should display user avatar or initials', () => {
      const compiled = fixture.nativeElement;
      const avatar = compiled.querySelector('img[alt="John Doe"]') || 
                     compiled.querySelector('.h-8.w-8.rounded-full');

      expect(avatar).toBeTruthy();
    });

    it('should display user name on desktop', () => {
      const compiled = fixture.nativeElement;
      const userName = compiled.querySelector('.hidden.md\\:block');

      expect(userName?.textContent?.trim()).toContain('John Doe');
    });
  });

  describe('Menu Toggle Functions', () => {
    it('should toggle mobile menu', () => {
      expect(component.menuOpen).toBe(false);
      
      component.toggleMenu();
      expect(component.menuOpen).toBe(true);
      
      component.toggleMenu();
      expect(component.menuOpen).toBe(false);
    });

    it('should close user menu when opening mobile menu', () => {
      component.userMenuOpen = true;
      component.toggleMenu();

      expect(component.menuOpen).toBe(true);
      expect(component.userMenuOpen).toBe(false);
    });

    it('should toggle user menu', () => {
      expect(component.userMenuOpen).toBe(false);
      
      component.toggleUserMenu();
      expect(component.userMenuOpen).toBe(true);
      
      component.toggleUserMenu();
      expect(component.userMenuOpen).toBe(false);
    });

    it('should close mobile menu when opening user menu', () => {
      component.menuOpen = true;
      component.toggleUserMenu();

      expect(component.userMenuOpen).toBe(true);
      expect(component.menuOpen).toBe(false);
    });

    it('should close all menus', () => {
      component.menuOpen = true;
      component.userMenuOpen = true;

      component.closeMenus();

      expect(component.menuOpen).toBe(false);
      expect(component.userMenuOpen).toBe(false);
    });
  });

  describe('User Dropdown Menu', () => {
    beforeEach(() => {
      authService.isAuthenticated$ = of(true);
      authService.currentUser$ = of(mockUser);
      fixture.detectChanges();
    });

    it('should show dropdown when user menu is toggled', () => {
      component.toggleUserMenu();
      fixture.detectChanges();

      const dropdown = fixture.nativeElement.querySelector('[role="menu"]');
      expect(dropdown).toBeTruthy();
    });

    it('should display user info in dropdown', () => {
      component.toggleUserMenu();
      fixture.detectChanges();

      const dropdown = fixture.nativeElement.querySelector('[role="menu"]');
      expect(dropdown.textContent).toContain('John Doe');
      expect(dropdown.textContent).toContain('test@example.com');
    });

    it('should display standard menu items', () => {
      component.toggleUserMenu();
      fixture.detectChanges();

      const menuItems = fixture.nativeElement.querySelectorAll('[role="menuitem"]');
      const menuTexts = Array.from(menuItems).map((item: any) => item.textContent);

      expect(menuTexts.some((text: string) => text.includes('Dashboard'))).toBe(true);
      expect(menuTexts.some((text: string) => text.includes('My Profile'))).toBe(true);
      expect(menuTexts.some((text: string) => text.includes('Settings'))).toBe(true);
      expect(menuTexts.some((text: string) => text.includes('Logout'))).toBe(true);
    });

    it('should not show mentor dashboard for regular user', () => {
      component.toggleUserMenu();
      fixture.detectChanges();

      const mentorLink = fixture.nativeElement.querySelector('a[routerLink="/mentor/dashboard"]');
      expect(mentorLink).toBeFalsy();
    });

    it('should not show admin dashboard for regular user', () => {
      component.toggleUserMenu();
      fixture.detectChanges();

      const adminLink = fixture.nativeElement.querySelector('a[routerLink="/admin/dashboard"]');
      expect(adminLink).toBeFalsy();
    });
  });

  describe('Mentor User', () => {
    beforeEach(() => {
      authService.isAuthenticated$ = of(true);
      authService.currentUser$ = of(mockMentorUser);
      fixture.detectChanges();
    });

    it('should show mentor dashboard link', () => {
      component.toggleUserMenu();
      fixture.detectChanges();

      const mentorLink = fixture.nativeElement.querySelector('a[routerLink="/mentor/dashboard"]');
      expect(mentorLink).toBeTruthy();
    });
  });

  describe('Admin User', () => {
    beforeEach(() => {
      authService.isAuthenticated$ = of(true);
      authService.currentUser$ = of(mockAdminUser);
      fixture.detectChanges();
    });

    it('should show admin dashboard link', () => {
      component.toggleUserMenu();
      fixture.detectChanges();

      const adminLink = fixture.nativeElement.querySelector('a[routerLink="/admin/dashboard"]');
      expect(adminLink).toBeTruthy();
    });
  });

  describe('Logout Functionality', () => {
    beforeEach(() => {
      authService.isAuthenticated$ = of(true);
      authService.currentUser$ = of(mockUser);
      fixture.detectChanges();
    });

    it('should call authService.logout when logout is clicked', () => {
      component.onLogout();

      expect(authService.logout).toHaveBeenCalledWith(false);
    });

    it('should show success notification on logout', () => {
      component.onLogout();

      expect(notificationService.showSuccess).toHaveBeenCalledWith('Logged out successfully');
    });

    it('should navigate to home on logout', () => {
      spyOn(router, 'navigate');
      component.onLogout();

      expect(router.navigate).toHaveBeenCalledWith(['/']);
    });

    it('should close menus on logout', () => {
      component.menuOpen = true;
      component.userMenuOpen = true;

      component.onLogout();

      expect(component.menuOpen).toBe(false);
      expect(component.userMenuOpen).toBe(false);
    });
  });

  describe('Navigation Functions', () => {
    it('should navigate and close menus', () => {
      spyOn(router, 'navigate');
      component.menuOpen = true;
      component.userMenuOpen = true;

      component.navigateAndClose('/test-route');

      expect(component.menuOpen).toBe(false);
      expect(component.userMenuOpen).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/test-route']);
    });
  });

  describe('User Display Functions', () => {
    it('should return full name when both first and last name exist', () => {
      const displayName = component.getUserDisplayName(mockUser);
      expect(displayName).toBe('John Doe');
    });

    it('should return first name when only first name exists', () => {
      const userWithFirstNameOnly = { ...mockUser, lastName: '' };
      const displayName = component.getUserDisplayName(userWithFirstNameOnly);
      expect(displayName).toBe('John');
    });

    it('should return email username when no names exist', () => {
      const userWithNoNames = { ...mockUser, firstName: '', lastName: '' };
      const displayName = component.getUserDisplayName(userWithNoNames);
      expect(displayName).toBe('test');
    });

    it('should return "User" when user is null', () => {
      const displayName = component.getUserDisplayName(null);
      expect(displayName).toBe('User');
    });

    it('should return correct initials for full name', () => {
      const initials = component.getUserInitials(mockUser);
      expect(initials).toBe('JD');
    });

    it('should return first letter of first name when only first name exists', () => {
      const userWithFirstNameOnly = { ...mockUser, lastName: '' };
      const initials = component.getUserInitials(userWithFirstNameOnly);
      expect(initials).toBe('J');
    });

    it('should return first letter of email when no names exist', () => {
      const userWithNoNames = { ...mockUser, firstName: '', lastName: '' };
      const initials = component.getUserInitials(userWithNoNames);
      expect(initials).toBe('T');
    });

    it('should return "U" when user is null', () => {
      const initials = component.getUserInitials(null);
      expect(initials).toBe('U');
    });
  });

  describe('Role Checking', () => {
    it('should return true when user has the role', () => {
      expect(component.hasRole(mockUser, UserRole.User)).toBe(true);
    });

    it('should return false when user does not have the role', () => {
      expect(component.hasRole(mockUser, UserRole.Admin)).toBe(false);
    });

    it('should return false when user is null', () => {
      expect(component.hasRole(null, UserRole.User)).toBe(false);
    });

    it('should return false when user has no roles', () => {
      const userWithNoRoles = { ...mockUser, roles: [] };
      expect(component.hasRole(userWithNoRoles, UserRole.User)).toBe(false);
    });
  });

  describe('Mobile Menu', () => {
    beforeEach(() => {
      authService.isAuthenticated$ = of(false);
      authService.currentUser$ = of(null);
      fixture.detectChanges();
    });

    it('should show mobile menu when toggled', () => {
      component.toggleMenu();
      fixture.detectChanges();

      const mobileMenu = fixture.nativeElement.querySelector('nav[aria-label="Mobile navigation"]');
      expect(mobileMenu).toBeTruthy();
    });

    it('should display navigation links in mobile menu', () => {
      component.toggleMenu();
      fixture.detectChanges();

      const mobileMenu = fixture.nativeElement.querySelector('nav[aria-label="Mobile navigation"]');
      const links = mobileMenu.querySelectorAll('a');

      expect(links.length).toBeGreaterThan(0);
    });

    it('should show auth links in mobile menu when unauthenticated', () => {
      component.toggleMenu();
      fixture.detectChanges();

      const mobileMenu = fixture.nativeElement.querySelector('nav[aria-label="Mobile navigation"]');
      expect(mobileMenu.textContent).toContain('Log In');
      expect(mobileMenu.textContent).toContain('Sign Up');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes on user menu trigger', () => {
      authService.isAuthenticated$ = of(true);
      authService.currentUser$ = of(mockUser);
      fixture.detectChanges();

      const userMenuTrigger = fixture.nativeElement.querySelector('[aria-label="User menu"]');
      
      expect(userMenuTrigger.getAttribute('aria-haspopup')).toBe('true');
      expect(userMenuTrigger.getAttribute('aria-expanded')).toBe('false');
    });

    it('should update aria-expanded when menu is opened', () => {
      authService.isAuthenticated$ = of(true);
      authService.currentUser$ = of(mockUser);
      fixture.detectChanges();

      component.toggleUserMenu();
      fixture.detectChanges();

      const userMenuTrigger = fixture.nativeElement.querySelector('[aria-label="User menu"]');
      expect(userMenuTrigger.getAttribute('aria-expanded')).toBe('true');
    });

    it('should have proper ARIA attributes on mobile menu toggle', () => {
      const hamburger = fixture.nativeElement.querySelector('[aria-label="Toggle navigation menu"]');
      
      expect(hamburger.getAttribute('aria-expanded')).toBe('false');
    });

    it('should have role="menu" on dropdown', () => {
      authService.isAuthenticated$ = of(true);
      authService.currentUser$ = of(mockUser);
      fixture.detectChanges();

      component.toggleUserMenu();
      fixture.detectChanges();

      const dropdown = fixture.nativeElement.querySelector('[role="menu"]');
      expect(dropdown).toBeTruthy();
    });

    it('should have role="menuitem" on dropdown items', () => {
      authService.isAuthenticated$ = of(true);
      authService.currentUser$ = of(mockUser);
      fixture.detectChanges();

      component.toggleUserMenu();
      fixture.detectChanges();

      const menuItems = fixture.nativeElement.querySelectorAll('[role="menuitem"]');
      expect(menuItems.length).toBeGreaterThan(0);
    });
  });

  describe('Responsive Behavior', () => {
    it('should hide desktop navigation on mobile', () => {
      const desktopNav = fixture.nativeElement.querySelector('nav[aria-label="Main navigation"]');
      expect(desktopNav.classList.contains('hidden')).toBe(true);
      expect(desktopNav.classList.contains('lg:flex')).toBe(true);
    });

    it('should hide mobile menu toggle on desktop', () => {
      const hamburger = fixture.nativeElement.querySelector('[aria-label="Toggle navigation menu"]');
      expect(hamburger.classList.contains('lg:hidden')).toBe(true);
    });
  });
});
