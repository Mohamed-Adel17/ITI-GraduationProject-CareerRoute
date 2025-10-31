import { UserRole } from './user.model';

/**
 * Auth Models
 *
 * Data Transfer Objects (DTOs) for authentication operations.
 * These models match the backend API contracts for auth endpoints.
 *
 * @remarks
 * - All DTOs should match backend CareerRoute.Core/DTOs/Auth/ interfaces
 * - Passwords are never stored or logged in the frontend
 * - Tokens are stored securely (localStorage or sessionStorage)
 */

/**
 * Registration request DTO
 * Used when a new user registers on the platform
 */
export interface RegisterRequest {
  /** User's email address (will be used for login) */
  email: string;

  /** User's password (min 8 characters, will be hashed on backend) */
  password: string;

  /** Password confirmation (must match password) */
  confirmPassword: string;

  /** User's first name */
  firstName: string;

  /** User's last name */
  lastName: string;

  /** User's phone number (optional) */
  phoneNumber?: string;

  /** User's career interests (optional) */
  careerInterests?: string;

  /** User's career goals (optional) */
  careerGoals?: string;

  /** Whether user wants to register as a mentor (if true, redirects to mentor application after registration) */
  registerAsMentor?: boolean;
}

/**
 * Registration response DTO
 * Returned after successful registration
 */
export interface RegisterResponse {
  /** Success indicator */
  success: boolean;

  /** Success or error message */
  message: string;

  /** User ID of newly created account */
  userId?: string;

  /** Email that needs verification */
  email?: string;

  /** Whether email verification is required */
  requiresEmailVerification: boolean;
}

/**
 * Login request DTO
 * Used for user authentication
 */
export interface LoginRequest {
  /** User's email address */
  email: string;

  /** User's password */
  password: string;

  /** Remember me option (longer token expiration) */
  rememberMe?: boolean;
}

/**
 * Login response DTO
 * Returned after successful authentication
 */
export interface LoginResponse {
  /** Success indicator */
  success: boolean;

  /** JWT access token */
  token: string;

  /** JWT refresh token (for getting new access tokens) */
  refreshToken: string;

  /** Token expiration time in seconds */
  expiresIn: number;

  /** Token type (usually "Bearer") */
  tokenType: string;

  /** Authenticated user information */
  user: AuthUser;
}

/**
 * Authenticated user data returned in login/token responses
 */
export interface AuthUser {
  /** User ID */
  id: string;

  /** User's email */
  email: string;

  /** User's first name */
  firstName: string;

  /** User's last name */
  lastName: string;

  /** Whether email is confirmed */
  emailConfirmed: boolean;

  /** User's roles in the system */
  roles: UserRole[];

  /** Whether user is also a mentor */
  isMentor: boolean;

  /** Mentor ID if user is a mentor */
  mentorId?: string;

  /** Profile picture URL */
  profilePictureUrl?: string;
}

/**
 * Token refresh request DTO
 * Used to get a new access token using refresh token
 */
export interface TokenRefreshRequest {
  /** Current access token (can be expired) */
  token: string;

  /** Refresh token */
  refreshToken: string;
}

/**
 * Token refresh response DTO
 */
export interface TokenRefreshResponse {
  /** Success indicator */
  success: boolean;

  /** New JWT access token */
  token: string;

  /** New refresh token */
  refreshToken: string;

  /** Token expiration time in seconds */
  expiresIn: number;
}

/**
 * Password reset request DTO (forgot password)
 * Used to initiate password reset process
 */
export interface PasswordResetRequest {
  /** User's email address */
  email: string;
}

/**
 * Password reset response DTO
 */
export interface PasswordResetRequestResponse {
  /** Success indicator */
  success: boolean;

  /** Message to display to user */
  message: string;
}

/**
 * Password reset DTO (complete reset with token)
 * Used when user clicks reset link in email
 */
export interface PasswordReset {
  /** User's email address */
  email: string;

  /** Reset token from email link */
  token: string;

  /** New password */
  newPassword: string;

  /** New password confirmation */
  confirmPassword: string;
}

/**
 * Password reset completion response DTO
 */
export interface PasswordResetResponse {
  /** Success indicator */
  success: boolean;

  /** Message to display to user */
  message: string;
}

/**
 * Change password request DTO (for logged-in users)
 */
export interface ChangePasswordRequest {
  /** Current password */
  currentPassword: string;

  /** New password */
  newPassword: string;

  /** New password confirmation */
  confirmPassword: string;
}

/**
 * Change password response DTO
 */
export interface ChangePasswordResponse {
  /** Success indicator */
  success: boolean;

  /** Message to display to user */
  message: string;
}

/**
 * Email verification request DTO
 * Used when user clicks verification link in email
 */
export interface EmailVerificationRequest {
  /** User ID */
  userId: string;

  /** Verification token from email link */
  token: string;
}

/**
 * Email verification response DTO
 */
export interface EmailVerificationResponse {
  /** Success indicator */
  success: boolean;

  /** Message to display to user */
  message: string;

  /** Whether user should be auto-logged in after verification */
  autoLogin?: boolean;

  /** Login token if autoLogin is true */
  loginToken?: string;
}

/**
 * Resend email verification request DTO
 */
export interface ResendVerificationEmailRequest {
  /** User's email address */
  email: string;
}

/**
 * Logout request DTO (optional, for token invalidation)
 */
export interface LogoutRequest {
  /** Refresh token to invalidate */
  refreshToken?: string;
}

/**
 * Auth error response DTO
 * Standard error format from backend
 */
export interface AuthErrorResponse {
  /** Success indicator (always false for errors) */
  success: false;

  /** Error message */
  message: string;

  /** Validation errors by field */
  errors?: { [key: string]: string[] };

  /** HTTP status code */
  statusCode?: number;
}

/**
 * Token payload interface (decoded JWT)
 * Used for client-side token inspection
 *
 * @remarks
 * This interface represents the structure of the JWT token payload
 * issued by the ASP.NET Core backend. It includes standard JWT claims
 * and custom claims for user information.
 */
export interface TokenPayload {
  /** Subject (user ID) */
  sub: string;

  /** Email address */
  email: string;

  /** User's full name (optional) */
  name?: string;

  /** User's first/given name (JWT standard claim) */
  given_name?: string;

  /** User's last/family name (JWT standard claim) */
  family_name?: string;

  /** Whether email is verified */
  email_verified?: boolean;

  /** User's role(s) - can be string or array */
  role: string | string[];

  /** Whether user is a mentor (custom claim) */
  is_mentor?: boolean;

  /** Mentor ID if user is a mentor (custom claim) */
  mentor_id?: string;

  /** Profile picture URL (JWT standard claim) */
  picture?: string;

  /** Issued at timestamp (Unix epoch) */
  iat: number;

  /** Expiration timestamp (Unix epoch) */
  exp: number;

  /** Not before timestamp (Unix epoch) */
  nbf?: number;

  /** Issuer (who created the token) */
  iss?: string;

  /** Audience (who the token is intended for) */
  aud?: string;

  /** JWT ID (unique identifier for the token) */
  jti?: string;
}

/**
 * Auth state interface (stored in app state/localStorage)
 */
export interface AuthState {
  /** Whether user is authenticated */
  isAuthenticated: boolean;

  /** Current user information */
  user: AuthUser | null;

  /** JWT access token */
  token: string | null;

  /** Refresh token */
  refreshToken: string | null;

  /** Token expiration timestamp */
  tokenExpiration: number | null;

  /** Loading state */
  loading: boolean;

  /** Error state */
  error: string | null;
}

/**
 * Password strength validation result
 */
export interface PasswordStrength {
  /** Whether password meets minimum requirements */
  valid: boolean;

  /** Strength score (0-4: weak to strong) */
  score: 0 | 1 | 2 | 3 | 4;

  /** Strength label */
  label: 'Very Weak' | 'Weak' | 'Fair' | 'Good' | 'Strong';

  /** Validation errors */
  errors: string[];

  /** Suggestions for improvement */
  suggestions: string[];
}

// ==================== Helper Functions ====================

/**
 * Decode JWT token payload (client-side only, for display purposes)
 * @param token JWT token string
 * @returns Decoded token payload or null if invalid
 */
export function decodeToken(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = parts[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return decoded as TokenPayload;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

/**
 * Check if token is expired
 * @param token JWT token or decoded payload
 * @returns True if token is expired
 */
export function isTokenExpired(token: string | TokenPayload): boolean {
  try {
    const payload = typeof token === 'string' ? decodeToken(token) : token;
    if (!payload || !payload.exp) {
      return true;
    }

    // Add 30 second buffer to account for clock skew
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime + 30;
  } catch (error) {
    return true;
  }
}

/**
 * Get token expiration date
 * @param token JWT token or decoded payload
 * @returns Expiration date or null
 */
export function getTokenExpiration(token: string | TokenPayload): Date | null {
  try {
    const payload = typeof token === 'string' ? decodeToken(token) : token;
    if (!payload || !payload.exp) {
      return null;
    }

    return new Date(payload.exp * 1000);
  } catch (error) {
    return null;
  }
}

/**
 * Get user roles from token
 * @param token JWT token or decoded payload
 * @returns Array of user roles
 */
export function getRolesFromToken(token: string | TokenPayload): UserRole[] {
  try {
    const payload = typeof token === 'string' ? decodeToken(token) : token;
    if (!payload || !payload.role) {
      return [];
    }

    const roles = Array.isArray(payload.role) ? payload.role : [payload.role];
    return roles as UserRole[];
  } catch (error) {
    return [];
  }
}

/**
 * Check if user has specific role based on token
 * @param token JWT token or decoded payload
 * @param role Role to check
 * @returns True if user has the role
 */
export function hasRoleInToken(token: string | TokenPayload, role: UserRole): boolean {
  const roles = getRolesFromToken(token);
  return roles.includes(role);
}

/**
 * Validate email format
 * @param email Email address
 * @returns True if email is valid
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * @param password Password string
 * @returns Password strength validation result
 */
export function validatePasswordStrength(password: string): PasswordStrength {
  const errors: string[] = [];
  const suggestions: string[] = [];
  let score: 0 | 1 | 2 | 3 | 4 = 0;

  // Minimum length check
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  } else {
    score++;
  }

  // Contains lowercase
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
    suggestions.push('Add lowercase letters (a-z)');
  } else {
    score++;
  }

  // Contains uppercase
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
    suggestions.push('Add uppercase letters (A-Z)');
  } else {
    score++;
  }

  // Contains number
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
    suggestions.push('Add numbers (0-9)');
  } else {
    score++;
  }

  // Contains special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    suggestions.push('Add special characters (!@#$%^&*) for stronger password');
  } else {
    score = 4;
  }

  // Common password check (basic)
  const commonPasswords = ['password', '12345678', 'qwerty', 'abc123', 'letmein', 'welcome'];
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common');
    suggestions.push('Avoid common passwords');
    score = Math.max(0, score - 2) as 0 | 1 | 2 | 3 | 4;
  }

  // Length bonus
  if (password.length >= 12) {
    score = Math.min(4, score + 1) as 0 | 1 | 2 | 3 | 4;
  }

  const labels: ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'] = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];

  return {
    valid: errors.length === 0,
    score: score as 0 | 1 | 2 | 3 | 4,
    label: labels[score],
    errors,
    suggestions
  };
}

/**
 * Validate registration form data
 * @param data Registration request data
 * @returns Validation result with errors
 */
export function validateRegistrationData(data: RegisterRequest): { valid: boolean; errors: { [key: string]: string[] } } {
  const errors: { [key: string]: string[] } = {};

  // Email validation
  if (!data.email) {
    errors['email'] = ['Email is required'];
  } else if (!isValidEmail(data.email)) {
    errors['email'] = ['Please enter a valid email address'];
  }

  // Password validation
  if (!data.password) {
    errors['password'] = ['Password is required'];
  } else {
    const passwordValidation = validatePasswordStrength(data.password);
    if (!passwordValidation.valid) {
      errors['password'] = passwordValidation.errors;
    }
  }

  // Confirm password validation
  if (!data.confirmPassword) {
    errors['confirmPassword'] = ['Please confirm your password'];
  } else if (data.password !== data.confirmPassword) {
    errors['confirmPassword'] = ['Passwords do not match'];
  }

  // First name validation
  if (!data.firstName || data.firstName.trim().length === 0) {
    errors['firstName'] = ['First name is required'];
  } else if (data.firstName.trim().length < 2) {
    errors['firstName'] = ['First name must be at least 2 characters'];
  }

  // Last name validation
  if (!data.lastName || data.lastName.trim().length === 0) {
    errors['lastName'] = ['Last name is required'];
  } else if (data.lastName.trim().length < 2) {
    errors['lastName'] = ['Last name must be at least 2 characters'];
  }

  // Phone number validation (optional)
  if (data.phoneNumber && data.phoneNumber.trim().length > 0) {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!phoneRegex.test(data.phoneNumber)) {
      errors['phoneNumber'] = ['Please enter a valid phone number'];
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validate login form data
 * @param data Login request data
 * @returns Validation result with errors
 */
export function validateLoginData(data: LoginRequest): { valid: boolean; errors: { [key: string]: string[] } } {
  const errors: { [key: string]: string[] } = {};

  // Email validation
  if (!data.email) {
    errors['email'] = ['Email is required'];
  } else if (!isValidEmail(data.email)) {
    errors['email'] = ['Please enter a valid email address'];
  }

  // Password validation
  if (!data.password) {
    errors['password'] = ['Password is required'];
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Sanitize auth user data (remove sensitive fields)
 * @param user Auth user data
 * @returns Sanitized user data
 */
export function sanitizeAuthUser(user: AuthUser): AuthUser {
  // Create a clean copy without any potentially sensitive fields
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    emailConfirmed: user.emailConfirmed,
    roles: user.roles,
    isMentor: user.isMentor,
    mentorId: user.mentorId,
    profilePictureUrl: user.profilePictureUrl
  };
}

/**
 * Get auth error message from error response
 * @param error Auth error response
 * @returns User-friendly error message
 */
export function getAuthErrorMessage(error: AuthErrorResponse | any): string {
  if (error.message) {
    return error.message;
  }

  if (error.errors && typeof error.errors === 'object') {
    const firstError = Object.values(error.errors)[0];
    if (Array.isArray(firstError) && firstError.length > 0) {
      return firstError[0];
    }
  }

  return 'An unexpected error occurred. Please try again.';
}

/**
 * Create initial auth state
 * @returns Initial auth state object
 */
export function createInitialAuthState(): AuthState {
  return {
    isAuthenticated: false,
    user: null,
    token: null,
    refreshToken: null,
    tokenExpiration: null,
    loading: false,
    error: null
  };
}

/**
 * Type guard for AuthErrorResponse
 */
export function isAuthError(obj: any): obj is AuthErrorResponse {
  return obj && obj.success === false && typeof obj.message === 'string';
}
