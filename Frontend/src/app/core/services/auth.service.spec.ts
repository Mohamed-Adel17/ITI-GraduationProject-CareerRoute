import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';
import {
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  PasswordResetRequest,
  PasswordReset,
  EmailVerificationRequest,
  ChangePasswordRequest
} from '../../shared/models/auth.model';
import { UserRole } from '../../shared/models/user.model';
import { environment } from '../../../environments/environment.development';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: jasmine.SpyObj<Router>;
  let notificationService: jasmine.SpyObj<NotificationService>;

  const mockLoginResponse: LoginResponse = {
    success: true,
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiZ2l2ZW5fbmFtZSI6IkpvaG4iLCJmYW1pbHlfbmFtZSI6IkRvZSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJyb2xlIjoiVXNlciIsImlzX21lbnRvciI6ZmFsc2UsImV4cCI6OTk5OTk5OTk5OSwiaWF0IjoxNTE2MjM5MDIyfQ.dummySignature',
    refreshToken: 'refresh-token-123',
    expiresIn: 3600,
    tokenType: 'Bearer',
    user: {
      id: '1234567890',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      emailConfirmed: true,
      roles: [UserRole.User],
      isMentor: false
    }
  };

  beforeEach(() => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate'], {
      routerState: { snapshot: { root: { queryParams: {} } } }
    });
    const notificationSpy = jasmine.createSpyObj('NotificationService', [
      'success',
      'error',
      'warning',
      'info'
    ]);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: Router, useValue: routerSpy },
        { provide: NotificationService, useValue: notificationSpy }
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;

    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Token Management', () => {
    it('should store and retrieve access token', () => {
      const token = 'test-access-token';
      service.setToken(token);
      expect(service.getToken()).toBe(token);
    });

    it('should store and retrieve refresh token', () => {
      const refreshToken = 'test-refresh-token';
      service.setRefreshToken(refreshToken);
      expect(service.getRefreshToken()).toBe(refreshToken);
    });

    it('should remove all tokens', () => {
      service.setToken('access-token');
      service.setRefreshToken('refresh-token');
      service.removeTokens();
      expect(service.getToken()).toBeNull();
      expect(service.getRefreshToken()).toBeNull();
    });

    it('should return null when no token exists', () => {
      expect(service.getToken()).toBeNull();
      expect(service.getRefreshToken()).toBeNull();
    });
  });

  describe('Authentication Status', () => {
    it('should return false when user is not authenticated', () => {
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should return false when token is expired', () => {
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJuYW1lIjoiSm9obiBEb2UiLCJleHAiOjEyMzQ1Njc4OTB9.signature';
      service.setToken(expiredToken);
      expect(service.isAuthenticated()).toBe(false);
    });
  });

  describe('Token Decoding', () => {
    it('should decode a valid JWT token', () => {
      // Sample JWT token with payload: { sub: '123', name: 'John Doe', exp: 1234567890 }
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJuYW1lIjoiSm9obiBEb2UiLCJleHAiOjEyMzQ1Njc4OTB9.signature';
      const decoded = service.decodeToken(token);

      expect(decoded).toBeTruthy();
      expect(decoded.sub).toBe('123');
      expect(decoded.name).toBe('John Doe');
    });

    it('should return null for invalid token', () => {
      const invalidToken = 'invalid-token';
      const decoded = service.decodeToken(invalidToken);
      expect(decoded).toBeNull();
    });

    it('should get user from stored token', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJuYW1lIjoiSm9obiBEb2UiLCJleHAiOjEyMzQ1Njc4OTB9.signature';
      service.setToken(token);

      const user = service.getUserFromToken();
      expect(user).toBeTruthy();
      expect(user.name).toBe('John Doe');
    });

    it('should return null when no token is stored', () => {
      const user = service.getUserFromToken();
      expect(user).toBeNull();
    });
  });

  describe('Token Expiration', () => {
    it('should detect expired token', () => {
      // Token with exp in the past (timestamp: 1234567890 = Feb 2009)
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJuYW1lIjoiSm9obiBEb2UiLCJleHAiOjEyMzQ1Njc4OTB9.signature';
      service.setToken(expiredToken);

      expect(service.isTokenExpired()).toBe(true);
    });

    it('should detect valid token', () => {
      // Token with exp far in the future
      const futureTimestamp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const payload = btoa(JSON.stringify({ sub: '123', exp: futureTimestamp }));
      const validToken = `header.${payload}.signature`;
      service.setToken(validToken);

      expect(service.isTokenExpired()).toBe(false);
    });

    it('should return true when no token exists', () => {
      expect(service.isTokenExpired()).toBe(true);
    });

    it('should get token expiration date', () => {
      const expiration = service.getTokenExpiration(mockLoginResponse.token);
      expect(expiration).toBeInstanceOf(Date);
    });
  });

  describe('Registration', () => {
    it('should register a new user successfully', (done) => {
      const registerData: RegisterRequest = {
        email: 'newuser@example.com',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!',
        firstName: 'Jane',
        lastName: 'Doe'
      };

      const mockResponse: RegisterResponse = {
        success: true,
        message: 'Registration successful',
        userId: 'new-user-id',
        email: registerData.email,
        requiresEmailVerification: true
      };

      service.register(registerData).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.userId).toBe('new-user-id');
        expect(notificationService.success).toHaveBeenCalled();
        expect(router.navigate).toHaveBeenCalledWith(['/auth/email-verification'], {
          queryParams: { email: registerData.email }
        });
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/register`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(registerData);
      req.flush(mockResponse);
    });

    it('should handle registration errors', (done) => {
      const registerData: RegisterRequest = {
        email: 'existing@example.com',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!',
        firstName: 'Jane',
        lastName: 'Doe'
      };

      service.register(registerData).subscribe({
        error: () => {
          expect(notificationService.error).toHaveBeenCalled();
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/register`);
      req.flush({ message: 'Email already exists' }, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('Login', () => {
    it('should login user successfully', (done) => {
      const loginData: LoginRequest = {
        email: 'test@example.com',
        password: 'password123'
      };

      service.login(loginData).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.token).toBeTruthy();
        expect(service.getToken()).toBe(mockLoginResponse.token);
        expect(service.getRefreshToken()).toBe(mockLoginResponse.refreshToken);
        expect(notificationService.success).toHaveBeenCalled();
        expect(router.navigate).toHaveBeenCalled();
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      expect(req.request.method).toBe('POST');
      req.flush(mockLoginResponse);
    });

    it('should handle login errors', (done) => {
      const loginData: LoginRequest = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      service.login(loginData).subscribe({
        error: () => {
          expect(notificationService.error).toHaveBeenCalled();
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush({ message: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('Logout', () => {
    it('should logout user and clear tokens', () => {
      localStorage.setItem(environment.auth.tokenKey, 'test-token');
      localStorage.setItem(environment.auth.refreshTokenKey, 'test-refresh');

      service.logout();

      expect(service.getToken()).toBeNull();
      expect(service.getRefreshToken()).toBeNull();
      expect(notificationService.info).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
    });

    it('should logout without notification when specified', () => {
      service.logout(false);

      expect(notificationService.info).not.toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
    });
  });

  describe('Email Verification', () => {
    it('should verify email successfully', (done) => {
      const verificationData: EmailVerificationRequest = {
        userId: 'user-123',
        token: 'verification-token'
      };

      const mockResponse = {
        success: true,
        message: 'Email verified successfully'
      };

      service.verifyEmail(verificationData).subscribe(response => {
        expect(response.success).toBe(true);
        expect(notificationService.success).toHaveBeenCalled();
        expect(router.navigate).toHaveBeenCalled();
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/verify-email`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });

    it('should resend verification email', (done) => {
      const request = { email: 'test@example.com' };

      service.resendVerificationEmail(request).subscribe(() => {
        expect(notificationService.success).toHaveBeenCalled();
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/resend-verification`);
      expect(req.request.method).toBe('POST');
      req.flush({});
    });
  });

  describe('Password Reset', () => {
    it('should send forgot password email', (done) => {
      const request: PasswordResetRequest = {
        email: 'test@example.com'
      };

      const mockResponse = {
        success: true,
        message: 'Password reset email sent'
      };

      service.forgotPassword(request).subscribe(response => {
        expect(response.success).toBe(true);
        expect(notificationService.success).toHaveBeenCalled();
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/forgot-password`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });

    it('should reset password with token', (done) => {
      const resetData: PasswordReset = {
        email: 'test@example.com',
        token: 'reset-token',
        newPassword: 'NewSecurePass123!',
        confirmPassword: 'NewSecurePass123!'
      };

      const mockResponse = {
        success: true,
        message: 'Password reset successfully'
      };

      service.resetPassword(resetData).subscribe(response => {
        expect(response.success).toBe(true);
        expect(notificationService.success).toHaveBeenCalled();
        expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/reset-password`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });

    it('should change password for logged-in user', (done) => {
      const changeData: ChangePasswordRequest = {
        currentPassword: 'OldPass123!',
        newPassword: 'NewPass123!',
        confirmPassword: 'NewPass123!'
      };

      const mockResponse = {
        success: true,
        message: 'Password changed successfully'
      };

      service.changePassword(changeData).subscribe(response => {
        expect(response.success).toBe(true);
        expect(notificationService.success).toHaveBeenCalled();
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/change-password`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });
  });

  describe('Role & Permission Checks', () => {
    beforeEach(() => {
      spyOn(service, 'getCurrentUser').and.returnValue({
        id: '123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        emailConfirmed: true,
        roles: [UserRole.User, UserRole.Mentor],
        isMentor: true,
        mentorId: 'mentor-123'
      });
    });

    it('should check if user has specific role', () => {
      expect(service.hasRole(UserRole.User)).toBe(true);
      expect(service.hasRole(UserRole.Mentor)).toBe(true);
      expect(service.hasRole(UserRole.Admin)).toBe(false);
    });

    it('should check if user is admin', () => {
      expect(service.isAdmin()).toBe(false);
    });

    it('should check if user is mentor', () => {
      expect(service.isMentor()).toBe(true);
    });

    it('should get mentor ID', () => {
      expect(service.getMentorId()).toBe('mentor-123');
    });
  });

  describe('Observables', () => {
    it('should provide current user observable', (done) => {
      service.currentUser$.subscribe(user => {
        // Initially null
        expect(user).toBeNull();
        done();
      });
    });

    it('should provide authentication state observable', (done) => {
      service.isAuthenticated$.subscribe(isAuth => {
        // Initially false
        expect(isAuth).toBe(false);
        done();
      });
    });

    it('should provide full auth state observable', (done) => {
      service.authState$.subscribe(state => {
        expect(state).toBeDefined();
        expect(state.isAuthenticated).toBe(false);
        expect(state.user).toBeNull();
        done();
      });
    });
  });
});
