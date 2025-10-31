import { User, UserSummary } from './user.model';

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
 * Main Mentor interface representing a mentor profile
 */
export interface Mentor {
  /** Mentor ID (same as User.Id - FK to User) */
  id: string;

  /** Associated user information */
  user?: User | UserSummary;

  /** Professional biography / introduction */
  bio: string;

  /** Comma-separated or array of expertise tags (e.g., "React, Node.js, AWS") */
  expertiseTags: string | string[];

  /** Years of professional experience */
  yearsOfExperience: number;

  /** Certifications or credentials (optional, e.g., "AWS Certified, PMP") */
  certifications?: string;

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

  /** Whether mentor is currently available for booking */
  isAvailable?: boolean;

  /** Categories/specializations the mentor belongs to */
  categories?: MentorCategory[];

  /** Category IDs (for simpler use cases) */
  categoryIds?: number[];

  /** Date when mentor profile was created */
  createdDate?: Date | string;

  /** Date when mentor was approved (if approved) */
  approvedDate?: Date | string;
}

/**
 * Category association for mentor
 */
export interface MentorCategory {
  id: number;
  name: string;
  description?: string;
  iconUrl?: string;
}

/**
 * Lightweight mentor summary for search results and lists
 */
export interface MentorListItem {
  id: string;
  firstName: string;
  lastName: string;
  profilePictureUrl?: string;
  bio: string;
  expertiseTags: string | string[];
  yearsOfExperience: number;
  rate30Min: number;
  rate60Min: number;
  averageRating: number;
  totalReviews: number;
  totalSessionsCompleted: number;
  isVerified: boolean;
  isAvailable: boolean;
  categories: MentorCategory[];
}

/**
 * Detailed mentor profile for mentor detail page
 */
export interface MentorDetail {
  id: string;
  user: User | UserSummary;
  bio: string;
  expertiseTags: string[];
  yearsOfExperience: number;
  certifications?: string;
  rate30Min: number;
  rate60Min: number;
  averageRating: number;
  totalReviews: number;
  totalSessionsCompleted: number;
  isVerified: boolean;
  isAvailable: boolean;
  approvalStatus: MentorApprovalStatus;
  categories: MentorCategory[];
  recentReviews?: any[]; // Will be typed when Review model is created
  availableSlots?: Date[]; // Available time slots for booking
}

/**
 * Mentor profile update data
 */
export interface MentorProfileUpdate {
  bio: string;
  expertiseTags: string | string[];
  yearsOfExperience: number;
  certifications?: string;
  rate30Min: number;
  rate60Min: number;
  categoryIds: number[];
  isAvailable?: boolean;
}

/**
 * Mentor application data (when user applies to become mentor)
 */
export interface MentorApplication {
  bio: string;
  expertiseTags: string | string[];
  yearsOfExperience: number;
  certifications?: string;
  rate30Min: number;
  rate60Min: number;
  categoryIds: number[];
}

/**
 * Mentor search/filter request parameters
 */
export interface MentorSearchParams {
  /** Search keyword (searches in bio and expertise tags) */
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
  sortBy?: 'rating' | 'price' | 'experience' | 'sessions';

  /** Sort direction */
  sortDirection?: 'asc' | 'desc';

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
 * Mentor search response with pagination
 */
export interface MentorSearchResponse {
  mentors: MentorListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
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
 * Helper function to get mentor's full name
 */
export function getMentorFullName(mentor: Mentor | MentorListItem | MentorDetail): string {
  if ('user' in mentor && mentor.user) {
    const user = mentor.user;
    return `${user.firstName} ${user.lastName}`.trim();
  }
  if ('firstName' in mentor && 'lastName' in mentor) {
    return `${mentor.firstName} ${mentor.lastName}`.trim();
  }
  return 'Unknown Mentor';
}

/**
 * Helper function to format expertise tags
 */
export function getExpertiseTags(mentor: Mentor | MentorListItem | MentorDetail): string[] {
  if (Array.isArray(mentor.expertiseTags)) {
    return mentor.expertiseTags;
  }
  if (typeof mentor.expertiseTags === 'string') {
    return mentor.expertiseTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
  }
  return [];
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
  if (params.categoryId && !mentor.categories.some(c => c.id === params.categoryId)) return false;

  // Keyword search (if client-side filtering is needed)
  if (params.keywords) {
    const keywords = params.keywords.toLowerCase();
    const bio = mentor.bio.toLowerCase();
    const tags = getExpertiseTagsString(mentor).toLowerCase();

    if (!bio.includes(keywords) && !tags.includes(keywords)) return false;
  }

  return true;
}

/**
 * Type guard to check if object is a valid Mentor
 */
export function isMentor(obj: any): obj is Mentor {
  return obj
    && typeof obj.id === 'string'
    && typeof obj.bio === 'string'
    && (typeof obj.expertiseTags === 'string' || Array.isArray(obj.expertiseTags))
    && typeof obj.yearsOfExperience === 'number'
    && typeof obj.rate30Min === 'number'
    && typeof obj.rate60Min === 'number';
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
  sortBy: 'rating' | 'price' | 'experience' | 'sessions',
  direction: 'asc' | 'desc' = 'desc'
): MentorListItem[] {
  const sorted = [...mentors].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'rating':
        comparison = a.averageRating - b.averageRating;
        break;
      case 'price':
        comparison = a.rate30Min - b.rate30Min;
        break;
      case 'experience':
        comparison = a.yearsOfExperience - b.yearsOfExperience;
        break;
      case 'sessions':
        comparison = a.totalSessionsCompleted - b.totalSessionsCompleted;
        break;
    }

    return direction === 'asc' ? comparison : -comparison;
  });

  return sorted;
}
