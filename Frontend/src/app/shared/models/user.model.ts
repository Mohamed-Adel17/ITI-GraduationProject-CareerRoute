/**
 * User Model
 *
 * Represents a platform user (mentee) in the Career Route application.
 * This model corresponds to the ApplicationUser entity in the backend.
 *
 * @remarks
 * - Extends ASP.NET Identity IdentityUser
 * - PasswordHash is never exposed to the frontend for security
 * - All dates are represented as Date objects or ISO strings from API
 */

/**
 * User role enum for role-based access control
 */
export enum UserRole {
  User = 'User',
  Mentor = 'Mentor',
  Admin = 'Admin'
}

/**
 * Main User interface representing a platform user
 */
export interface User {
  /** Unique identifier (GUID from ASP.NET Identity) */
  id: string;

  /** User's email address (also used for login) */
  email: string;

  /** Whether the email has been verified */
  emailConfirmed: boolean;

  /** User's first name */
  firstName: string;

  /** User's last name */
  lastName: string;

  /** User's phone number (optional) */
  phoneNumber?: string;

  /** URL to user's profile picture (optional) */
  profilePictureUrl?: string;

  /** User's career interests as an array (e.g., ["Software Development", "Data Science", "Machine Learning"]) */
  careerInterests?: string[];

  /** User's career goals (e.g., "Become a senior developer within 2 years") */
  careerGoals?: string;

  /** Date when user registered on the platform */
  registrationDate: Date | string;

  /** Date of user's last login */
  lastLoginDate?: Date | string;

  /** Whether the user account is active */
  isActive: boolean;

  /** User's role(s) in the system */
  roles?: UserRole[];

  /** Whether this user is also a mentor (has mentor profile) */
  isMentor?: boolean;

  /** Mentor ID if the user is also a mentor */
  mentorId?: string;
}

/**
 * Simplified user profile for display in lists, cards, etc.
 */
export interface UserSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePictureUrl?: string;
  isMentor?: boolean;
}

/**
 * User profile data for edit operations
 */
export interface UserProfileUpdate {
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  profilePictureUrl?: string;
  careerInterests?: string[];
  careerGoals?: string;
}

/**
 * User authentication context (stored in auth state)
 *
 * @remarks
 * For user registration data, use RegisterRequest from auth.model.ts
 * as registration is an authentication operation.
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  emailConfirmed: boolean;
  roles: UserRole[];
  isMentor: boolean;
  profilePictureUrl?: string;
}

/**
 * Helper function to get user's full name
 */
export function getUserFullName(user: User | UserSummary | AuthenticatedUser): string {
  return `${user.firstName} ${user.lastName}`.trim();
}

/**
 * Helper function to get user's initials for avatar fallback
 */
export function getUserInitials(user: User | UserSummary | AuthenticatedUser): string {
  const firstInitial = user.firstName?.charAt(0)?.toUpperCase() || '';
  const lastInitial = user.lastName?.charAt(0)?.toUpperCase() || '';
  return `${firstInitial}${lastInitial}`;
}

/**
 * Helper function to check if user has a specific role
 */
export function hasRole(user: User | AuthenticatedUser, role: UserRole): boolean {
  return user.roles?.includes(role) ?? false;
}

/**
 * Helper function to check if user is an admin
 */
export function isAdmin(user: User | AuthenticatedUser): boolean {
  return hasRole(user, UserRole.Admin);
}

/**
 * Helper function to format registration date
 */
export function formatRegistrationDate(user: User): string {
  const date = typeof user.registrationDate === 'string'
    ? new Date(user.registrationDate)
    : user.registrationDate;

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Type guard to check if object is a valid User
 */
export function isUser(obj: any): obj is User {
  return obj
    && typeof obj.id === 'string'
    && typeof obj.email === 'string'
    && typeof obj.firstName === 'string'
    && typeof obj.lastName === 'string';
}
