/**
 * User Model
 *
 * Represents a platform user (mentee) in the Career Route application.
 * This model corresponds to the ApplicationUser entity in the backend.
 *
 * @remarks
 * - Extends ASP.NET Identity IdentityUser
 * - PasswordHash is never exposed to the frontend for security
 * - All dates are represented as ISO 8601 strings from API
 * - Based on User-Profile-Endpoints.md contract (RetrieveUserDto)
 */

import { Skill } from './skill.model';

/**
 * User role enum for role-based access control
 */
export enum UserRole {
  User = 'User',
  Mentor = 'Mentor',
  Admin = 'Admin'
}

/**
 * Main User interface representing a platform user (RetrieveUserDto)
 *
 * @remarks
 * Based on User-Profile-Endpoints.md contract
 * - careerInterests is an array of Skill objects (SkillDto)
 * - Timestamps are ISO 8601 strings
 * - roles is always present (array of role names)
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
  phoneNumber: string | null;

  /** URL to user's profile picture (optional) */
  profilePictureUrl: string | null;

  /** User's career interests as array of Skill objects (areas where they seek guidance) */
  careerInterests: Skill[] | null;

  /** User's career goals statement (e.g., "Become a senior developer within 2 years") */
  careerGoals: string | null;

  /** Date when user registered on the platform (ISO 8601 string) */
  registrationDate: string;

  /** Date of user's last login (ISO 8601 string) */
  lastLoginDate: string | null;

  /** Whether the user account is active */
  isActive: boolean;

  /** User's role(s) in the system (always present, array of role names) */
  roles: string[];

  /** Whether this user is also a mentor (has approved mentor profile) */
  isMentor: boolean;

  /** Mentor ID if the user is also a mentor (null for regular users) */
  mentorId: string | null;
}

/**
 * Simplified user profile for display in lists, cards, etc.
 */
export interface UserSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePicture?: File;
  isMentor?: boolean;
}

/**
 * User profile data for update operations (UpdateUserDto)
 *
 * @remarks
 * Based on User-Profile-Endpoints.md contract
 * - All fields are optional (PATCH semantics)
 * - Email, password, and roles cannot be changed via profile update
 * - careerInterestIds: Array of skill IDs (integers) to update career interests
 *   - All IDs must be valid active skills
 *   - Empty array [] clears all career interests
 * - Used for PATCH /api/users/me endpoint
 * - Admin updates (PATCH /api/users/{id}) do NOT support careerInterestIds
 */
export interface UserProfileUpdate {
  /** Updated first name (optional) */
  firstName?: string;

  /** Updated last name (optional) */
  lastName?: string;

  /** Updated phone number (optional) */
  phoneNumber?: string;

  /** Updated profile picture URL (optional) */
  profilePicture?: File;

  /** Updated career goals statement (optional) */
  careerGoals?: string;

  /** Array of skill IDs to set as career interests (optional) */
  careerInterestIds?: number[];
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
  profilePicture?: File;
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
 *
 * @param user - User or AuthenticatedUser object
 * @param role - Role to check for (UserRole enum)
 * @returns True if user has the role
 *
 * @remarks
 * - Handles both string array (from API) and UserRole array
 * - Case-insensitive role comparison
 */
export function hasRole(user: User | AuthenticatedUser, role: UserRole): boolean {
  if (!user.roles || user.roles.length === 0) return false;

  // Convert role enum to string for comparison
  const roleString = role.toString();

  // Check if any role matches (case-insensitive)
  return user.roles.some(r => r.toLowerCase() === roleString.toLowerCase());
}

/**
 * Helper function to check if user is an admin
 */
export function isAdmin(user: User | AuthenticatedUser): boolean {
  return hasRole(user, UserRole.Admin);
}

/**
 * Helper function to format registration date
 *
 * @param user - User object
 * @returns Formatted date string
 *
 * @remarks
 * - Handles ISO 8601 string format from API
 */
export function formatRegistrationDate(user: User): string {
  const date = new Date(user.registrationDate);

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Helper function to format user role for display
 *
 * @param role - Role string from API
 * @returns Formatted role name
 */
export function formatUserRole(role: string): string {
  // Handle role strings: "User", "Mentor", "Admin"
  return role.charAt(0).toUpperCase() + role.slice(1);
}

/**
 * Helper function to get career interest names
 *
 * @param user - User object
 * @returns Array of career interest names
 */
export function getCareerInterestNames(user: User): string[] {
  return user.careerInterests?.map(skill => skill.name) || [];
}

/**
 * Helper function to compare users by name (for sorting)
 *
 * @param u1 - First user
 * @param u2 - Second user
 * @returns Sort comparison result
 */
export function compareUsersByName(u1: User, u2: User): number {
  const name1 = getUserFullName(u1).toLowerCase();
  const name2 = getUserFullName(u2).toLowerCase();
  return name1.localeCompare(name2);
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
