import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError, of, timer } from 'rxjs';
import { tap, catchError, map, switchMap, finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment.development';
import { NotificationService } from './notification.service';
import {
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  AuthUser,
  TokenRefreshRequest,
  TokenRefreshResponse,
  PasswordResetRequest,
  PasswordResetRequestResponse,
  PasswordReset,
  PasswordResetResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
  EmailVerificationRequest,
  EmailVerificationResponse,
  ResendVerificationEmailRequest,
  AuthState,
  createInitialAuthState,
  decodeToken,
  isTokenExpired,
  getTokenExpiration,
  getRolesFromToken,
  isAuthError,
  getAuthErrorMessage
} from '../../shared/models/auth.model';
import { UserRole } from '../../shared/models/user.model';

/**
 * AuthService
 *
 * Comprehensive authentication service for the Career Route application.
 * Handles user registration, login, logout, token management, email verification,
 * and password reset operations.
 *
 * Features:
 * - User registration (with optional mentor registration)
 * - Login/logout with JWT tokens
 * - Automatic token refresh
 * - Email verification
 * - Password reset (forgot password, reset password, change password)
 * - Auth state management with reactive updates
 * - Automatic token expiration handling
 * - Integration with NotificationService for user feedback
 *
 * @remarks
 * - Tokens are stored in localStorage
 * - Auth state is managed with BehaviorSubject for reactive UI updates
 * - Automatic token refresh starts on login
 * - Token expiration triggers automatic logout
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly notificationService = inject(NotificationService);

  // API endpoints
  private readonly API_URL = environment.apiUrl;
  private readonly AUTH_URL = `${this.API_URL}/auth`;

  // Token storage keys
  private readonly TOKEN_KEY = environment.auth.tokenKey;
  private readonly REFRESH_TOKEN_KEY = environment.auth.refreshTokenKey;
  private readonly TOKEN_EXPIRATION_BUFFER = environment.auth.tokenExpirationBuffer;

  // Auth state management
  private authStateSubject = new BehaviorSubject<AuthState>(createInitialAuthState());
  public authState$ = this.authStateSubject.asObservable();

  // Current user observable (derived from auth state)
  public currentUser$ = this.authState$.pipe(
    map(state => state.user)
  );

  // Is authenticated observable (derived from auth state)
  public isAuthenticated$ = this.authState$.pipe(
    map(state => state.isAuthenticated)
  );

  // Token refresh timer
  private tokenRefreshTimer: any;

  constructor() {
    // Initialize auth state from stored tokens on service creation
    this.initializeAuthState();
  }

  // ==================== Initialization ====================

  /**
   * Initialize auth state from localStorage on app startup
   * @private
   */
  private initializeAuthState(): void {
    const token = this.getToken();
    const refreshToken = this.getRefreshToken();

    if (token && refreshToken && !isTokenExpired(token)) {
      // Valid token exists, restore auth state
      const payload = decodeToken(token);
      if (payload) {
        const user: AuthUser = {
          id: payload.sub,
          email: payload.email,
          firstName: payload.given_name || '',
          lastName: payload.family_name || '',
          emailConfirmed: payload.email_verified || false,
          roles: getRolesFromToken(payload),
          isMentor: payload.is_mentor || false,
          mentorId: payload.mentor_id,
          profilePictureUrl: payload.picture
        };

        this.authStateSubject.next({
          isAuthenticated: true,
          user,
          token,
          refreshToken,
          tokenExpiration: payload.exp,
          loading: false,
          error: null
        });

        // Start token refresh timer
        this.startTokenRefreshTimer();
      }
    } else if (token) {
      // Token exists but is expired, attempt refresh
      this.refreshToken().subscribe({
        error: () => this.logout()
      });
    }
  }

  // ==================== Registration ====================

  /**
   * Register a new user
   * @param data User registration data
   * @returns Observable of registration response
   */
  register(data: RegisterRequest): Observable<RegisterResponse> {
    this.setLoading(true);

    return this.http.post<RegisterResponse>(`${this.AUTH_URL}/register`, data).pipe(
      tap(response => {
        if (response.success) {
          this.notificationService.success(
            response.message || 'Registration successful! Please check your email to verify your account.',
            'Welcome to Career Route'
          );

          // If email verification is required, navigate to verification page
          if (response.requiresEmailVerification) {
            this.router.navigate(['/auth/email-verification'], {
              queryParams: { email: data.email }
            });
          } else {
            // Auto-login if email verification is not required
            this.router.navigate(['/auth/login']);
          }
        }
      }),
      catchError(error => this.handleAuthError(error, 'Registration failed')),
      finalize(() => this.setLoading(false))
    );
  }

  // ==================== Login ====================

  /**
   * Login user with email and password
   * @param data Login credentials
   * @returns Observable of login response
   */
  login(data: LoginRequest): Observable<LoginResponse> {
    this.setLoading(true);

    return this.http.post<LoginResponse>(`${this.AUTH_URL}/login`, data).pipe(
      tap(response => {
        if (response.success && response.token) {
          // Store tokens
          this.setToken(response.token);
          this.setRefreshToken(response.refreshToken);

          // Update auth state
          const tokenPayload = decodeToken(response.token);
          this.authStateSubject.next({
            isAuthenticated: true,
            user: response.user,
            token: response.token,
            refreshToken: response.refreshToken,
            tokenExpiration: tokenPayload?.exp || null,
            loading: false,
            error: null
          });

          // Start token refresh timer
          this.startTokenRefreshTimer();

          // Show success notification
          this.notificationService.success(
            `Welcome back, ${response.user.firstName}!`,
            'Login Successful'
          );

          // Navigate to dashboard or intended route
          const returnUrl = this.router.routerState.snapshot.root.queryParams['returnUrl'] || '/dashboard';
          this.router.navigate([returnUrl]);
        }
      }),
      catchError(error => this.handleAuthError(error, 'Login failed')),
      finalize(() => this.setLoading(false))
    );
  }

  // ==================== Logout ====================

  /**
   * Logout current user
   * @param showNotification Whether to show logout notification (default: true)
   */
  logout(showNotification: boolean = true): void {
    // Stop token refresh timer
    this.stopTokenRefreshTimer();

    // Clear tokens
    this.removeTokens();

    // Reset auth state
    this.authStateSubject.next(createInitialAuthState());

    // Show notification
    if (showNotification) {
      this.notificationService.info('You have been logged out.', 'Logged Out');
    }

    // Navigate to login page
    this.router.navigate(['/auth/login']);
  }

  // ==================== Token Management ====================

  /**
   * Get the JWT access token from localStorage
   * @returns The access token or null if not found
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Get the refresh token from localStorage
   * @returns The refresh token or null if not found
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Store the access token in localStorage
   * @param token The JWT access token to store
   */
  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  /**
   * Store the refresh token in localStorage
   * @param refreshToken The refresh token to store
   */
  setRefreshToken(refreshToken: string): void {
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  /**
   * Remove tokens from localStorage
   */
  removeTokens(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Check if user is authenticated
   * @returns True if user is authenticated
   */
  isAuthenticated(): boolean {
    const state = this.authStateSubject.value;
    return state.isAuthenticated && !!state.token && !isTokenExpired(state.token);
  }

  /**
   * Get current authenticated user
   * @returns Current user or null
   */
  getCurrentUser(): AuthUser | null {
    return this.authStateSubject.value.user;
  }

  /**
   * Refresh access token using refresh token
   * @returns Observable of token refresh response
   */
  refreshToken(): Observable<TokenRefreshResponse> {
    const token = this.getToken();
    const refreshToken = this.getRefreshToken();

    if (!token || !refreshToken) {
      return throwError(() => new Error('No tokens available for refresh'));
    }

    const request: TokenRefreshRequest = { token, refreshToken };

    return this.http.post<TokenRefreshResponse>(`${this.AUTH_URL}/refresh`, request).pipe(
      tap(response => {
        if (response.success && response.token) {
          // Update tokens
          this.setToken(response.token);
          this.setRefreshToken(response.refreshToken);

          // Update auth state
          const currentState = this.authStateSubject.value;
          const tokenPayload = decodeToken(response.token);

          this.authStateSubject.next({
            ...currentState,
            token: response.token,
            refreshToken: response.refreshToken,
            tokenExpiration: tokenPayload?.exp || null
          });

          // Restart token refresh timer
          this.startTokenRefreshTimer();
        }
      }),
      catchError(error => {
        // Token refresh failed, logout user
        this.logout(false);
        this.notificationService.warning('Your session has expired. Please login again.', 'Session Expired');
        return throwError(() => error);
      })
    );
  }

  /**
   * Start automatic token refresh timer
   * @private
   */
  private startTokenRefreshTimer(): void {
    this.stopTokenRefreshTimer();

    const token = this.getToken();
    if (!token) return;

    const tokenPayload = decodeToken(token);
    if (!tokenPayload || !tokenPayload.exp) return;

    const expiresAt = new Date(tokenPayload.exp * 1000);
    const now = new Date();
    const timeUntilExpiry = expiresAt.getTime() - now.getTime();

    // Refresh token before it expires (buffer time in milliseconds)
    const refreshTime = timeUntilExpiry - (this.TOKEN_EXPIRATION_BUFFER * 1000);

    if (refreshTime > 0) {
      this.tokenRefreshTimer = timer(refreshTime).subscribe(() => {
        this.refreshToken().subscribe();
      });
    } else {
      // Token already expired or about to expire, refresh immediately
      this.refreshToken().subscribe();
    }
  }

  /**
   * Stop automatic token refresh timer
   * @private
   */
  private stopTokenRefreshTimer(): void {
    if (this.tokenRefreshTimer) {
      this.tokenRefreshTimer.unsubscribe();
      this.tokenRefreshTimer = null;
    }
  }

  // ==================== Email Verification ====================

  /**
   * Verify email address with token
   * @param request Email verification request
   * @returns Observable of verification response
   */
  verifyEmail(request: EmailVerificationRequest): Observable<EmailVerificationResponse> {
    return this.http.post<EmailVerificationResponse>(`${this.AUTH_URL}/verify-email`, request).pipe(
      tap(response => {
        if (response.success) {
          this.notificationService.success(
            response.message || 'Email verified successfully!',
            'Email Verified'
          );

          // If auto-login token is provided, use it to log in
          if (response.autoLogin && response.loginToken) {
            // Handle auto-login (would need to implement this endpoint)
            this.router.navigate(['/auth/login'], {
              queryParams: { verified: 'true' }
            });
          } else {
            this.router.navigate(['/auth/login'], {
              queryParams: { verified: 'true' }
            });
          }
        }
      }),
      catchError(error => this.handleAuthError(error, 'Email verification failed'))
    );
  }

  /**
   * Resend email verification
   * @param request Resend verification request
   * @returns Observable of response
   */
  resendVerificationEmail(request: ResendVerificationEmailRequest): Observable<any> {
    return this.http.post(`${this.AUTH_URL}/resend-verification`, request).pipe(
      tap(() => {
        this.notificationService.success(
          'Verification email has been sent. Please check your inbox.',
          'Email Sent'
        );
      }),
      catchError(error => this.handleAuthError(error, 'Failed to resend verification email'))
    );
  }

  // ==================== Password Reset ====================

  /**
   * Initiate password reset (forgot password)
   * @param request Password reset request with email
   * @returns Observable of response
   */
  forgotPassword(request: PasswordResetRequest): Observable<PasswordResetRequestResponse> {
    return this.http.post<PasswordResetRequestResponse>(`${this.AUTH_URL}/forgot-password`, request).pipe(
      tap(response => {
        if (response.success) {
          this.notificationService.success(
            response.message || 'Password reset email has been sent. Please check your inbox.',
            'Email Sent'
          );
        }
      }),
      catchError(error => this.handleAuthError(error, 'Failed to send password reset email'))
    );
  }

  /**
   * Reset password with token from email
   * @param request Password reset data with token
   * @returns Observable of response
   */
  resetPassword(request: PasswordReset): Observable<PasswordResetResponse> {
    return this.http.post<PasswordResetResponse>(`${this.AUTH_URL}/reset-password`, request).pipe(
      tap(response => {
        if (response.success) {
          this.notificationService.success(
            response.message || 'Password has been reset successfully! You can now login with your new password.',
            'Password Reset'
          );
          this.router.navigate(['/auth/login']);
        }
      }),
      catchError(error => this.handleAuthError(error, 'Failed to reset password'))
    );
  }

  /**
   * Change password for logged-in user
   * @param request Change password request
   * @returns Observable of response
   */
  changePassword(request: ChangePasswordRequest): Observable<ChangePasswordResponse> {
    return this.http.post<ChangePasswordResponse>(`${this.AUTH_URL}/change-password`, request).pipe(
      tap(response => {
        if (response.success) {
          this.notificationService.success(
            response.message || 'Password changed successfully!',
            'Password Updated'
          );
        }
      }),
      catchError(error => this.handleAuthError(error, 'Failed to change password'))
    );
  }

  // ==================== Role & Permission Checks ====================

  /**
   * Check if current user has specific role
   * @param role Role to check
   * @returns True if user has the role
   */
  hasRole(role: UserRole): boolean {
    const user = this.getCurrentUser();
    return user?.roles?.includes(role) ?? false;
  }

  /**
   * Check if current user is an admin
   * @returns True if user is admin
   */
  isAdmin(): boolean {
    return this.hasRole(UserRole.Admin);
  }

  /**
   * Check if current user is a mentor
   * @returns True if user is mentor
   */
  isMentor(): boolean {
    const user = this.getCurrentUser();
    return user?.isMentor ?? false;
  }

  /**
   * Get current user's mentor ID
   * @returns Mentor ID or null
   */
  getMentorId(): string | null {
    const user = this.getCurrentUser();
    return user?.mentorId ?? null;
  }

  // ==================== Helper Methods ====================

  /**
   * Set loading state
   * @param loading Loading state
   * @private
   */
  private setLoading(loading: boolean): void {
    const currentState = this.authStateSubject.value;
    this.authStateSubject.next({
      ...currentState,
      loading
    });
  }

  /**
   * Handle authentication errors
   * @param error HTTP error response
   * @param defaultMessage Default error message
   * @returns Observable that throws the error
   * @private
   */
  private handleAuthError(error: HttpErrorResponse, defaultMessage: string): Observable<never> {
    let errorMessage = defaultMessage;

    if (error.error && isAuthError(error.error)) {
      errorMessage = getAuthErrorMessage(error.error);
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    // Show error notification
    this.notificationService.error(errorMessage, 'Error');

    // Update error state
    const currentState = this.authStateSubject.value;
    this.authStateSubject.next({
      ...currentState,
      error: errorMessage,
      loading: false
    });

    return throwError(() => error);
  }

  /**
   * Decode JWT token to extract payload
   * @param token JWT token
   * @returns Decoded payload or null
   */
  decodeToken(token: string): any {
    return decodeToken(token);
  }

  /**
   * Check if token is expired
   * @param token JWT token (optional, uses stored token if not provided)
   * @returns True if token is expired
   */
  isTokenExpired(token?: string): boolean {
    const tokenToCheck = token || this.getToken();
    return tokenToCheck ? isTokenExpired(tokenToCheck) : true;
  }

  /**
   * Get token expiration date
   * @param token JWT token (optional, uses stored token if not provided)
   * @returns Expiration date or null
   */
  getTokenExpiration(token?: string): Date | null {
    const tokenToCheck = token || this.getToken();
    return tokenToCheck ? getTokenExpiration(tokenToCheck) : null;
  }

  /**
   * Get user information from stored token
   * @returns User info from token payload or null
   */
  getUserFromToken(): any {
    const token = this.getToken();
    return token ? this.decodeToken(token) : null;
  }
}
