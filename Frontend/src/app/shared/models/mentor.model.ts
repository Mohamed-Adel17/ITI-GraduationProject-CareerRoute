import { User, UserSummary } from './user.model';
import { Skill } from './skill.model';

/**
 * Mentor Model
 *
 * Represents a mentor in the Career Route application.
 * A mentor is a user with additional professional profile and credentials.
 *
 * @remarks
 * - Mentor.Id is a foreign key to User.Id (one-to-one relationship)
 * - A user can become a mentor by applying and getting approved
 * - Mentors have pricing, ratings, and expertise information
 * - Based on Mentor-Endpoints.md contract (MentorProfileDto)
 */

/**
 * Mentor approval status enum
 */
export enum MentorApprovalStatus {
  Pending = 'Pending',
  Approved = 'Approved',
  Rejected = 'Rejected'
}

/**
 * Session type enum (used for pricing)
 */
export enum SessionType {
  OneOnOne = 'OneOnOne',
  Group = 'Group'
}

/**
 * Category association for mentor (CategoryDto)
 */
export interface MentorCategory {
  id: number;
  name: string;
  description?: string | null;
  iconUrl?: string | null;
  mentorCount?: number | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string | null;
}

/**
 * Main Mentor interface representing a mentor profile (MentorProfileDto)
 * Based on Mentor-Endpoints.md contract
 */
export interface Mentor {
  /** Mentor ID (same as User.Id - FK to User) */
  id: string;

  /** User's first name */
  firstName: string;

  /** User's last name */
  lastName: string;

  /** Computed full name */
  fullName: string;

  /** User's email address */
  email: string;

  /** Profile picture URL */
  profilePictureUrl?: string | null;

  /** Professional biography / introduction */
  bio: string | null;

  /** Expertise tags as array of Skill objects (not strings) */
  expertiseTags: Skill[];

  /** Years of professional experience */
  yearsOfExperience: number | null;

  /** Certifications or credentials */
  certifications?: string | null;

  /** Rate for 30-minute session (in USD) */
  rate30Min: number;

  /** Rate for 60-minute session (in USD) */
  rate60Min: number;

  /** Average rating from reviews (1-5 stars) */
  averageRating: number;

  /** Total number of reviews received */
  totalReviews: number;

  /** Total number of sessions completed */
  totalSessionsCompleted: number;

  /** Whether mentor is verified by admin */
  isVerified: boolean;

  /** Current approval status */
  approvalStatus: MentorApprovalStatus;

  /** Date when mentor profile was created (ISO 8601) */
  createdAt: string;

  /** Date when mentor was last updated (ISO 8601) */
  updatedAt: string | null;

  /** Categories/specializations the mentor belongs to */
  categories?: MentorCategory[];

  /** Response time estimate (e.g., "within 2 hours") */
  responseTime?: string | null;

  /** Completion rate percentage (e.g., 98.5) */
  completionRate?: number | null;

  /** Whether mentor is currently available for booking */
  isAvailable?: boolean | null;
}

/**
 * Lightweight mentor summary for search results and lists
 */
export interface MentorListItem {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  profilePictureUrl?: string | null;
  bio: string;
  expertiseTags: Skill[];
  yearsOfExperience: number;
  certifications?: string | null;
  rate30Min: number;
  rate60Min: number;
  averageRating: number;
  totalReviews: number;
  totalSessionsCompleted: number;
  isVerified: boolean;
  approvalStatus: MentorApprovalStatus;
  createdAt: string;
  updatedAt: string | null;
  categories?: MentorCategory[];
  responseTime?: string | null;
  completionRate?: number | null;
  isAvailable: boolean;
}

/**
 * Review preview for mentor detail page (ReviewPreviewDto)
 */
export interface ReviewPreview {
  id: string;
  rating: number; // 1-5 stars
  reviewText: string;
  reviewerFirstName: string;
  reviewerLastNameInitial: string; // e.g., "K."
  sessionDate: string; // ISO 8601
  createdAt: string; // ISO 8601
}

/**
 * Availability preview for mentor profiles (AvailabilityPreviewDto)
 */
export interface AvailabilityPreview {
  hasAvailability: boolean;
  nextAvailableSlot: string | null; // ISO 8601 datetime
  totalSlotsNext7Days: number;
}

/**
 * Detailed mentor profile for mentor detail page
 */
export interface MentorDetail {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  profilePictureUrl?: string | null;
  bio: string;
  expertiseTags: Skill[];
  yearsOfExperience: number;
  certifications?: string | null;
  rate30Min: number;
  rate60Min: number;
  averageRating: number;
  totalReviews: number;
  totalSessionsCompleted: number;
  isVerified: boolean;
  approvalStatus: MentorApprovalStatus;
  createdAt: string;
  updatedAt: string | null;
  categories: MentorCategory[];
  responseTime: string | null;
  completionRate: number | null;
  isAvailable: boolean;
  recentReviews?: ReviewPreview[];
  availabilityPreview?: AvailabilityPreview;
}

/**
 * Mentor profile update data (UpdateMentorProfileDto)
 * All fields are optional - only provided fields will be updated
 * Based on Mentor-Endpoints.md - Endpoint #9: PATCH /api/mentors/me
 *
 * @remarks
 * - User-related fields update the ApplicationUser entity (firstName, lastName, phoneNumber, profilePictureUrl)
 * - Mentor-specific fields update the Mentor entity (bio, yearsOfExperience, certifications, rates, isAvailable, expertiseTagIds, categoryIds)
 * - Empty array [] for expertiseTagIds clears all expertise tags
 */
export interface MentorProfileUpdate {
  // User-related fields
  firstName?: string; // Min 2 chars, max 50 chars
  lastName?: string; // Min 2 chars, max 50 chars
  phoneNumber?: string; // Valid phone number format
  profilePictureUrl?: string; // Valid URL format, max 200 chars

  // Mentor-specific fields
  bio?: string; // Min 50 chars, max 1000 chars
  yearsOfExperience?: number; // Min 0, integer
  certifications?: string; // Max 500 chars
  rate30Min?: number; // Min 0, max 10000
  rate60Min?: number; // Min 0, max 10000
  isAvailable?: boolean; // Availability status
  expertiseTagIds?: number[]; // Array of skill IDs, empty array [] clears all
  categoryIds?: number[]; // Array of category IDs, 1-5 categories
}

/**
 * Mentor application data (when user applies to become mentor) (CreateMentorProfileDto)
 *
 * @remarks
 * - According to updated API contract (Endpoint #7: POST /api/mentors)
 * - Includes expertiseTagIds and categoryIds arrays
 * - expertiseTagIds: Array of skill IDs (integers) for mentor's expertise areas
 * - categoryIds: Array of category IDs (integers) for mentor's service categories
 * - Both arrays are required in the application
 */
export interface MentorApplication {
  bio: string; // Required: Min 50, max 1000 chars
  expertiseTagIds: number[]; // Required: Array of skill IDs
  yearsOfExperience: number; // Required: Min 0, integer
  certifications?: string; // Optional: Max 500 chars
  rate30Min: number; // Required: Min 0, max 10000
  rate60Min: number; // Required: Min 0, max 10000
  categoryIds: number[]; // Required: Array of category IDs
}

/**
 * Mentor search/filter request parameters
 */
export interface MentorSearchParams {
  /** Search keyword (searches in name, bio, expertise tags) */
  keywords?: string;

  /** Filter by category ID */
  categoryId?: number;

  /** Minimum price (30-min session) */
  minPrice?: number;

  /** Maximum price (30-min session) */
  maxPrice?: number;

  /** Minimum rating (1-5) */
  minRating?: number;

  /** Sort by field */
  sortBy?: 'popularity' | 'rating' | 'priceAsc' | 'priceDesc';

  /** Page number (for pagination) */
  page?: number;

  /** Page size (for pagination) */
  pageSize?: number;

  /** Only show verified mentors */
  verifiedOnly?: boolean;

  /** Only show available mentors */
  availableOnly?: boolean;
}

/**
 * Pagination metadata
 */
export interface PaginationMetadata {
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Applied filters returned with search results
 */
export interface AppliedFilters {
  keywords: string | null;
  categoryId: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  minRating: number | null;
  sortBy: string;
}

/**
 * Mentor search response with pagination (PaginatedMentorResult)
 */
export interface MentorSearchResponse {
  mentors: MentorListItem[];
  pagination: PaginationMetadata;
  appliedFilters: AppliedFilters;
}

/**
 * Mentor statistics for admin dashboard
 */
export interface MentorStatistics {
  totalMentors: number;
  activeMentors: number;
  pendingApprovals: number;
  averageRating: number;
  totalSessionsCompleted: number;
  topMentorsByRating: MentorListItem[];
  topMentorsBySessions: MentorListItem[];
}

/**
 * Rejection request body (RejectMentorDto)
 */
export interface RejectMentorRequest {
  reason: string; // Required: Min 10, max 500 chars
}

/**
 * Helper function to get mentor's full name
 */
export function getMentorFullName(mentor: Mentor | MentorListItem | MentorDetail): string {
  return mentor.fullName || `${mentor.firstName} ${mentor.lastName}`.trim() || 'Unknown Mentor';
}

/**
 * Helper function to format expertise tags from Skill objects
 */
export function getExpertiseTags(mentor: Mentor | MentorListItem | MentorDetail): string[] {
  if (!mentor.expertiseTags || !Array.isArray(mentor.expertiseTags)) {
    return [];
  }
  return mentor.expertiseTags.map(skill => skill.name);
}

/**
 * Helper function to get formatted expertise tags as string
 */
export function getExpertiseTagsString(mentor: Mentor | MentorListItem | MentorDetail, maxTags?: number): string {
  const tags = getExpertiseTags(mentor);
  const displayTags = maxTags ? tags.slice(0, maxTags) : tags;
  const result = displayTags.join(', ');

  if (maxTags && tags.length > maxTags) {
    return `${result}, +${tags.length - maxTags} more`;
  }

  return result;
}

/**
 * Helper function to get star rating display
 */
export function getStarRating(rating: number): { fullStars: number; halfStar: boolean; emptyStars: number } {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return {
    fullStars,
    halfStar: hasHalfStar,
    emptyStars
  };
}

/**
 * Helper function to format rating display
 */
export function formatRating(mentor: Mentor | MentorListItem | MentorDetail): string {
  return `${mentor.averageRating.toFixed(1)} (${mentor.totalReviews} ${mentor.totalReviews === 1 ? 'review' : 'reviews'})`;
}

/**
 * Helper function to format session count
 */
export function formatSessionCount(count: number): string {
  return `${count} ${count === 1 ? 'session' : 'sessions'} completed`;
}

/**
 * Helper function to check if mentor is approved
 */
export function isApproved(mentor: Mentor | MentorDetail): boolean {
  return mentor.approvalStatus === MentorApprovalStatus.Approved && mentor.isVerified;
}

/**
 * Helper function to check if mentor is pending approval
 */
export function isPendingApproval(mentor: Mentor | MentorDetail): boolean {
  return mentor.approvalStatus === MentorApprovalStatus.Pending;
}

/**
 * Helper function to check if mentor is rejected
 */
export function isRejected(mentor: Mentor | MentorDetail): boolean {
  return mentor.approvalStatus === MentorApprovalStatus.Rejected;
}

/**
 * Helper function to get approval status badge color
 */
export function getApprovalStatusColor(status: MentorApprovalStatus): string {
  switch (status) {
    case MentorApprovalStatus.Approved:
      return 'success'; // Green
    case MentorApprovalStatus.Pending:
      return 'warning'; // Yellow
    case MentorApprovalStatus.Rejected:
      return 'danger'; // Red
    default:
      return 'secondary'; // Gray
  }
}

/**
 * Helper function to calculate hourly rate from 30-min rate
 */
export function getHourlyRate(rate30Min: number): number {
  return rate30Min * 2;
}

/**
 * Helper function to format price
 */
export function formatPrice(price: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(price);
}

/**
 * Helper function to get price range display
 */
export function getPriceRange(mentor: Mentor | MentorListItem | MentorDetail): string {
  return `${formatPrice(mentor.rate30Min)}/30min - ${formatPrice(mentor.rate60Min)}/60min`;
}

/**
 * Helper function to check if mentor matches search criteria
 */
export function matchesSearchCriteria(mentor: MentorListItem, params: MentorSearchParams): boolean {
  // Price filter
  if (params.minPrice && mentor.rate30Min < params.minPrice) return false;
  if (params.maxPrice && mentor.rate30Min > params.maxPrice) return false;

  // Rating filter
  if (params.minRating && mentor.averageRating < params.minRating) return false;

  // Verified filter
  if (params.verifiedOnly && !mentor.isVerified) return false;

  // Available filter
  if (params.availableOnly && !mentor.isAvailable) return false;

  // Category filter
  if (params.categoryId && mentor.categories && !mentor.categories.some(c => c.id === params.categoryId)) return false;

  // Keyword search (if client-side filtering is needed)
  if (params.keywords) {
    const keywords = params.keywords.toLowerCase();
    const bio = mentor.bio?.toLowerCase() || '';
    const tags = getExpertiseTagsString(mentor).toLowerCase();
    const name = getMentorFullName(mentor).toLowerCase();

    if (!bio.includes(keywords) && !tags.includes(keywords) && !name.includes(keywords)) return false;
  }

  return true;
}

/**
 * Type guard to check if object is a valid Mentor
 */
export function isMentor(obj: any): obj is Mentor {
  return obj
    && typeof obj.id === 'string'
    && typeof obj.firstName === 'string'
    && typeof obj.lastName === 'string'
    && typeof obj.email === 'string'
    && (obj.bio === null || typeof obj.bio === 'string')
    && Array.isArray(obj.expertiseTags)
    && (obj.yearsOfExperience === null || typeof obj.yearsOfExperience === 'number')
    && typeof obj.rate30Min === 'number'
    && typeof obj.rate60Min === 'number'
    && typeof obj.averageRating === 'number'
    && typeof obj.totalReviews === 'number'
    && typeof obj.totalSessionsCompleted === 'number'
    && typeof obj.isVerified === 'boolean'
    && typeof obj.approvalStatus === 'string'
    && typeof obj.createdAt === 'string';
}

/**
 * Helper function to validate pricing (business rules)
 */
export function validatePricing(rate30Min: number, rate60Min: number): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Minimum and maximum price validation (from spec.md)
  const MIN_PRICE = 20;
  const MAX_PRICE = 500;

  if (rate30Min < MIN_PRICE) {
    errors.push(`30-minute rate must be at least ${formatPrice(MIN_PRICE)}`);
  }

  if (rate30Min > MAX_PRICE) {
    errors.push(`30-minute rate cannot exceed ${formatPrice(MAX_PRICE)}`);
  }

  if (rate60Min < MIN_PRICE) {
    errors.push(`60-minute rate must be at least ${formatPrice(MIN_PRICE)}`);
  }

  if (rate60Min > MAX_PRICE) {
    errors.push(`60-minute rate cannot exceed ${formatPrice(MAX_PRICE)}`);
  }

  // 60-min rate should typically be less than 2x the 30-min rate (but not enforced as hard rule)
  const expectedMax = rate30Min * 2;
  if (rate60Min > expectedMax) {
    errors.push(`60-minute rate (${formatPrice(rate60Min)}) seems high compared to 30-minute rate. Consider ${formatPrice(expectedMax)} or less.`);
  }

  // 60-min rate should be more than 30-min rate
  if (rate60Min <= rate30Min) {
    errors.push('60-minute rate must be higher than 30-minute rate');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Helper function to sort mentors by criteria
 */
export function sortMentors(
  mentors: MentorListItem[],
  sortBy: 'popularity' | 'rating' | 'priceAsc' | 'priceDesc',
  direction: 'asc' | 'desc' = 'desc'
): MentorListItem[] {
  const sorted = [...mentors].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'rating':
        comparison = a.averageRating - b.averageRating;
        break;
      case 'priceAsc':
      case 'priceDesc':
        comparison = a.rate30Min - b.rate30Min;
        break;
      case 'popularity':
        comparison = a.totalSessionsCompleted - b.totalSessionsCompleted;
        break;
    }

    // For priceDesc, we want descending order
    if (sortBy === 'priceDesc') {
      return -comparison;
    }

    return direction === 'asc' ? comparison : -comparison;
  });

  return sorted;
}
