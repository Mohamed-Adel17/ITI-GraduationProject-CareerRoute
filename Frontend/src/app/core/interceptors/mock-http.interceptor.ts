import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';

/**
 * Mock HTTP Interceptor for Frontend Testing
 * Functional interceptor pattern for Angular 15+
 */

// Mock database (persisted in localStorage to survive page refreshes and navigation)
const MOCK_USERS_KEY = 'mockUsers';
const MOCK_STORAGE = localStorage; // Use localStorage instead of sessionStorage for persistence

function getMockUsers(): any[] {
  const stored = MOCK_STORAGE.getItem(MOCK_USERS_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  // Default user if no stored users
  const defaultUsers = [
    {
      id: '1',
      email: 'test@example.com',
      password: 'Test1234!',
      firstName: 'John',
      lastName: 'Doe',
      roles: ['User'],
      isMentor: false,
      emailConfirmed: true
    }
  ];
  saveMockUsers(defaultUsers);
  return defaultUsers;
}

function saveMockUsers(users: any[]): void {
  MOCK_STORAGE.setItem(MOCK_USERS_KEY, JSON.stringify(users));
}

let mockUsers = getMockUsers();

const mockTokens = new Map<string, { userId: string; email: string; expiration: number }>();

let initialized = false;

export const mockHttpInterceptor: HttpInterceptorFn = (req, next) => {
  if (!initialized) {
    console.log('[MOCK HTTP INTERCEPTOR] Initialized - Ready to mock auth endpoints');
    console.log('[MOCK HTTP INTERCEPTOR] Test credentials: test@example.com / Test1234!');
    initialized = true;
  }

  // Only mock auth endpoints, let others pass through
  if (!req.url.includes('/auth/')) {
    return next(req);
  }

  console.log('[MOCK] Intercepting:', req.method, req.url);

  // Route to appropriate mock handler
  if (req.url.includes('/login') && req.method === 'POST') {
    return mockLogin(req);
  }
  if (req.url.includes('/register') && req.method === 'POST') {
    return mockRegister(req);
  }
  if (req.url.includes('/forgot-password') && req.method === 'POST') {
    return mockForgotPassword(req);
  }
  if (req.url.includes('/reset-password') && req.method === 'POST') {
    return mockResetPassword(req);
  }
  if (req.url.includes('/verify-email') && req.method === 'POST') {
    return mockVerifyEmail(req);
  }
  if (req.url.includes('/resend-verification') && req.method === 'POST') {
    return mockResendVerificationEmail(req);
  }
  if (req.url.includes('/refresh') && req.method === 'POST') {
    return mockRefreshToken(req);
  }

  // Default: pass through
  return next(req);
};

// ===================== MOCK ENDPOINTS =====================

function mockLogin(req: any): Observable<any> {
  const { email, password } = req.body;

  console.log('[MOCK LOGIN] Request:', { email });

  if (!email || !password) {
    console.log('[MOCK LOGIN] Validation failed - missing fields');
    return throwHttpError(400, 'Email and password are required', {
      email: email ? [] : ['Email is required'],
      password: password ? [] : ['Password is required']
    });
  }

  const user = mockUsers.find(u => u.email === email);
  if (!user || user.password !== password) {
    console.log('[MOCK LOGIN] Invalid credentials for email:', email);
    return throwHttpError(401, 'Invalid email or password', null);
  }

  const mockToken = generateMockJWT(user);
  const mockRefreshToken = 'refresh_token_' + Math.random().toString(36).substring(7);

  mockTokens.set(mockToken, {
    userId: user.id,
    email: user.email,
    expiration: Date.now() + 3600000
  });

  const response = {
    success: true,
    message: 'Login successful',
    token: mockToken,
    refreshToken: mockRefreshToken,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      emailConfirmed: user.emailConfirmed,
      roles: user.roles,
      isMentor: user.isMentor
    }
  };

  console.log('[MOCK LOGIN] Success for:', email);
  return of(new HttpResponse({
    status: 200,
    body: response
  })).pipe(delay(500));
}

function mockRegister(req: any): Observable<any> {
  const { email, password, confirmPassword, firstName, lastName, userType, registerAsMentor } = req.body;

  // Support both naming conventions
  const isMentor = registerAsMentor !== undefined ? registerAsMentor : (userType === 'mentor');
  const firstName_val = firstName && firstName.trim() ? firstName : 'User';
  const lastName_val = lastName && lastName.trim() ? lastName : 'Account';

  console.log('[MOCK REGISTER] Request:', { email, isMentor });

  // Validate required fields - firstName/lastName can be empty, they'll use defaults
  if (!email || !password || !confirmPassword) {
    console.log('[MOCK REGISTER] Validation failed - missing required fields');
    return throwHttpError(400, 'Email and password are required', {
      email: email ? [] : ['Email is required'],
      password: password ? [] : ['Password is required'],
      confirmPassword: confirmPassword ? [] : ['Confirm password is required']
    });
  }

  if (!isValidEmail(email)) {
    return throwHttpError(400, 'Invalid email format', {
      email: ['Please enter a valid email address']
    });
  }

  if (password.length < 8) {
    return throwHttpError(400, 'Password must be at least 8 characters', {
      password: ['Password must be at least 8 characters']
    });
  }

  if (password !== confirmPassword) {
    return throwHttpError(400, 'Passwords do not match', {
      confirmPassword: ['Passwords do not match']
    });
  }

  if (mockUsers.some(u => u.email === email)) {
    console.log('[MOCK REGISTER] Email already exists:', email);
    return throwHttpError(400, 'Email already registered', {
      email: ['Email already in use']
    });
  }

  const newUser = {
    id: Math.random().toString(36).substring(7),
    email,
    password,
    firstName: firstName_val,
    lastName: lastName_val,
    roles: [isMentor ? 'Mentor' : 'User'],
    isMentor: isMentor,
    emailConfirmed: false
  };

  mockUsers.push(newUser);
  saveMockUsers(mockUsers); // Persist to sessionStorage

  const verificationToken = 'verify_' + Math.random().toString(36).substring(7);
  localStorage.setItem(`verify_${newUser.id}`, verificationToken);

  const response = {
    success: true,
    message: 'Registration successful',
    requiresEmailVerification: true,
    userId: newUser.id,
    email: newUser.email
  };

  console.log('[MOCK REGISTER] Success for:', email);
  console.log('[MOCK REGISTER] User ID:', newUser.id);
  console.log('[MOCK REGISTER] Verification link: /auth/verify-email?userId=' + newUser.id + '&token=' + verificationToken);

  return of(new HttpResponse({
    status: 200,
    body: response
  })).pipe(delay(1000));
}

function mockForgotPassword(req: any): Observable<any> {
  const { email } = req.body;

  console.log('[MOCK FORGOT PASSWORD] Request:', { email });

  if (!email) {
    return throwHttpError(400, 'Email is required', {
      email: ['Email is required']
    });
  }

  if (!isValidEmail(email)) {
    return throwHttpError(400, 'Invalid email format', {
      email: ['Please enter a valid email address']
    });
  }

  const resetToken = 'reset_token_' + Math.random().toString(36).substring(7);
  localStorage.setItem(`reset_${email}`, resetToken);

  const resetLink = `/auth/reset-password?email=${encodeURIComponent(email)}&token=${resetToken}`;
  console.log('[MOCK FORGOT PASSWORD] Reset link generated:');
  console.log('[MOCK FORGOT PASSWORD] ' + window.location.origin + resetLink);

  const response = {
    success: true,
    message: 'If an account with that email exists, a password reset link has been sent.'
  };

  return of(new HttpResponse({
    status: 200,
    body: response
  })).pipe(delay(800));
}

function mockResetPassword(req: any): Observable<any> {
  const { email, token, newPassword, confirmPassword } = req.body;

  console.log('[MOCK RESET PASSWORD] Request:', { email, token });

  if (!email || !token || !newPassword || !confirmPassword) {
    console.log('[MOCK RESET PASSWORD] Missing required fields');
    return throwHttpError(400, 'All fields are required', null);
  }

  if (newPassword.length < 8) {
    return throwHttpError(400, 'Password must be at least 8 characters', {
      newPassword: ['Password must be at least 8 characters']
    });
  }

  const storedToken = localStorage.getItem(`reset_${email}`);
  console.log('[MOCK RESET PASSWORD] Stored token:', storedToken);
  console.log('[MOCK RESET PASSWORD] Received token:', token);

  if (!storedToken) {
    console.log('[MOCK RESET PASSWORD] No stored token found for email:', email);
    console.log('[MOCK RESET PASSWORD] Available reset tokens:',
      Object.keys(localStorage).filter(k => k.startsWith('reset_')));
    return throwHttpError(400, 'Invalid or expired password reset link.', null);
  }

  if (storedToken !== token) {
    console.log('[MOCK RESET PASSWORD] Token mismatch for email:', email);
    return throwHttpError(400, 'Invalid or expired password reset link.', null);
  }

  if (newPassword !== confirmPassword) {
    return throwHttpError(400, 'Passwords do not match', {
      confirmPassword: ['Passwords do not match']
    });
  }

  // Reload users from storage to ensure we have the latest data
  mockUsers = getMockUsers();

  const user = mockUsers.find(u => u.email === email);
  if (!user) {
    console.log('[MOCK RESET PASSWORD] User not found with email:', email);
    console.log('[MOCK RESET PASSWORD] Available users:', mockUsers.map(u => ({ id: u.id, email: u.email })));
    return throwHttpError(400, 'User not found', null);
  }

  const oldPassword = user.password;
  user.password = newPassword;
  saveMockUsers(mockUsers); // Persist updated user
  localStorage.removeItem(`reset_${email}`);

  const response = {
    success: true,
    message: 'Your password has been reset successfully.'
  };

  console.log('[MOCK RESET PASSWORD] Success for:', email);
  console.log('[MOCK RESET PASSWORD] New password: ' + newPassword);

  return of(new HttpResponse({
    status: 200,
    body: response
  })).pipe(delay(800));
}

function mockVerifyEmail(req: any): Observable<any> {
  const { userId, token } = req.body;

  console.log('[MOCK VERIFY EMAIL] Request:', { userId, token });

  if (!userId || !token) {
    console.log('[MOCK VERIFY EMAIL] Missing userId or token');
    return throwHttpError(400, 'Invalid verification request', null);
  }

  const storedToken = localStorage.getItem(`verify_${userId}`);
  console.log('[MOCK VERIFY EMAIL] Stored token:', storedToken);
  console.log('[MOCK VERIFY EMAIL] Received token:', token);

  if (!storedToken) {
    console.log('[MOCK VERIFY EMAIL] No stored token found for userId:', userId);
    console.log('[MOCK VERIFY EMAIL] Available keys:', Object.keys(localStorage));
    return throwHttpError(400, 'Invalid or expired verification link', null);
  }

  if (storedToken !== token) {
    console.log('[MOCK VERIFY EMAIL] Token mismatch for userId:', userId);
    return throwHttpError(400, 'Invalid or expired verification link', null);
  }

  // Reload users from storage to ensure we have the latest data
  mockUsers = getMockUsers();

  const user = mockUsers.find(u => u.id === userId);
  if (!user) {
    console.log('[MOCK VERIFY EMAIL] User not found with id:', userId);
    console.log('[MOCK VERIFY EMAIL] Available users:', mockUsers.map(u => ({ id: u.id, email: u.email })));
    return throwHttpError(400, 'User not found', null);
  }

  user.emailConfirmed = true;
  saveMockUsers(mockUsers); // Persist updated user
  localStorage.removeItem(`verify_${userId}`);

  const loginToken = generateMockJWT(user);
  const refreshToken = 'refresh_token_' + Math.random().toString(36).substring(7);

  const response = {
    success: true,
    message: 'Email verified successfully',
    autoLogin: true,
    loginToken: loginToken,
    refreshToken: refreshToken,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      emailConfirmed: true,
      roles: user.roles,
      isMentor: user.isMentor
    }
  };

  console.log('[MOCK VERIFY EMAIL] Success for userId:', userId);

  return of(new HttpResponse({
    status: 200,
    body: response
  })).pipe(delay(800));
}

function mockResendVerificationEmail(req: any): Observable<any> {
  const { email } = req.body;

  console.log('[MOCK RESEND VERIFICATION] Request:', { email });

  if (!email) {
    return throwHttpError(400, 'Email is required', null);
  }

  const verificationToken = 'verify_' + Math.random().toString(36).substring(7);
  const user = mockUsers.find(u => u.email === email);

  if (user) {
    localStorage.setItem(`verify_${user.id}`, verificationToken);
    const verifyLink = `/auth/verify-email?userId=${user.id}&token=${verificationToken}`;
    console.log('[MOCK RESEND VERIFICATION] Verification link: ' + window.location.origin + verifyLink);
  }

  const response = {
    success: true,
    message: 'Verification email has been sent. Please check your inbox.'
  };

  return of(new HttpResponse({
    status: 200,
    body: response
  })).pipe(delay(600));
}

function mockRefreshToken(req: any): Observable<any> {
  const { token } = req.body;

  console.log('[MOCK REFRESH TOKEN] Request received');

  if (!token) {
    return throwHttpError(401, 'Invalid token', null);
  }

  const tokenData = mockTokens.get(token);
  if (!tokenData) {
    return throwHttpError(401, 'Token not found', null);
  }

  const user = mockUsers.find(u => u.id === tokenData.userId);
  if (!user) {
    return throwHttpError(401, 'User not found', null);
  }

  const newToken = generateMockJWT(user);
  const newRefreshToken = 'refresh_token_' + Math.random().toString(36).substring(7);

  const response = {
    success: true,
    token: newToken,
    refreshToken: newRefreshToken
  };

  console.log('[MOCK REFRESH TOKEN] Success');

  return of(new HttpResponse({
    status: 200,
    body: response
  })).pipe(delay(300));
}

// ===================== UTILITIES =====================

function generateMockJWT(user: any): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const expiration = Math.floor(Date.now() / 1000) + 3600;

  const payload = btoa(JSON.stringify({
    sub: user.id,
    email: user.email,
    given_name: user.firstName,
    family_name: user.lastName,
    email_verified: user.emailConfirmed,
    roles: user.roles,
    is_mentor: user.isMentor,
    exp: expiration,
    iat: Math.floor(Date.now() / 1000)
  }));

  const signature = btoa('mock_signature');
  return `${header}.${payload}.${signature}`;
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function throwHttpError(status: number, message: string, errors: any): Observable<never> {
  const errorResponse = {
    success: false,
    message,
    errors
  };

  console.log('[MOCK] HTTP Error:', status, message);

  return throwError(() => ({
    status,
    statusText: message,
    error: errorResponse,
    message: errorResponse.message
  })).pipe(delay(300));
}
