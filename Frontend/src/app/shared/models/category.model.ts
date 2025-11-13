/**
 * Category Model
 *
 * Defines category-related interfaces and types for the Career Route application.
 * Categories represent areas of expertise that can be used for both:
 * - User career interests (what they want to learn)
 * - Mentor specializations (what they can teach)
 *
 * This unified approach simplifies the matching between users and mentors.
 */

/**
 * Category Interface
 * Represents a category entity from the backend
 *
 * @remarks
 * Based on Category-Endpoints.md contract
 * Categories serve both user career interests and mentor specializations (unified system)
 */
export interface Category {
  /** Unique identifier for the category (integer, not GUID) */
  id: number;

  /** Display name of the category */
  name: string;

  /** Optional description of the category */
  description: string | null;

  /** Icon emoji or URL for visual representation */
  iconUrl: string | null;

  /** Count of approved mentors in this category (populated in browse contexts) */
  mentorCount?: number | null;

  /** Whether the category is active/visible */
  isActive: boolean;

  /** Creation timestamp (ISO 8601 format) */
  createdAt: string;

  /** Last update timestamp (ISO 8601 format) */
  updatedAt: string | null;
}

/**
 * Category Summary
 * Lightweight version of Category for lists and dropdowns
 */
export interface CategorySummary {
  /** Unique identifier (integer) */
  id: number;

  /** Display name */
  name: string;

  /** Icon emoji or URL (optional) */
  iconUrl?: string | null;
}

/**
 * Pagination information
 * Used in paginated responses
 */
export interface PaginationInfo {
  /** Total number of items across all pages */
  totalCount: number;

  /** Current page number */
  currentPage: number;

  /** Number of items per page */
  pageSize: number;

  /** Total number of pages */
  totalPages: number;

  /** Whether there is a next page */
  hasNextPage: boolean;

  /** Whether there is a previous page */
  hasPreviousPage: boolean;
}

/**
 * Mentor List Item for category browsing
 * Lightweight mentor information displayed in category mentor lists
 */
export interface MentorListItem {
  /** Mentor ID */
  id: string;

  /** First name */
  firstName: string;

  /** Last name */
  lastName: string;

  /** Full name (formatted) */
  fullName: string;

  /** Profile picture URL */
  profilePictureUrl?: string | null;

  /** Professional biography */
  bio: string;

  /** Expertise tags (skills) */
  expertiseTags: string[];

  /** Years of experience */
  yearsOfExperience: number;

  /** Rate for 30-minute session */
  rate30Min: number;

  /** Rate for 60-minute session */
  rate60Min: number;

  /** Average rating (0-5) */
  averageRating: number;

  /** Total number of reviews */
  totalReviews: number;

  /** Total sessions completed */
  totalSessionsCompleted: number;

  /** Whether mentor is verified */
  isVerified: boolean;

  /** Whether mentor is available for booking */
  isAvailable: boolean;

  /** Approval status */
  approvalStatus: string;
}

/**
 * Category with mentors response
 * Response from GET /api/categories/{id}/mentors
 */
export interface CategoryMentorsResponse {
  /** Category information */
  category: {
    id: number;
    name: string;
    description: string | null;
    iconUrl: string | null;
  };

  /** List of mentors in this category */
  mentors: MentorListItem[];

  /** Pagination information */
  pagination: PaginationInfo;
}

/**
 * Query parameters for getting mentors by category
 * Used in endpoint: GET /api/categories/{id}/mentors
 */
export interface CategoryMentorsParams {
  /** Page number (default: 1) */
  page?: number;

  /** Items per page (default: 10, max: 50) */
  pageSize?: number;

  /** Sort by field (default: rating) */
  sortBy?: 'rating' | 'price' | 'experience' | 'sessions';

  /** Sort order (default: desc) */
  sortOrder?: 'asc' | 'desc';

  /** Minimum 30-min rate filter */
  minPrice?: number;

  /** Maximum 30-min rate filter */
  maxPrice?: number;

  /** Minimum rating filter (0-5) */
  minRating?: number;

  /** Search in bio and expertise tags */
  keywords?: string;
}

// ==================== Helper Functions ====================

/**
 * Get category display name
 * @param category - Category to get name from
 * @returns Display name or empty string
 */
export function getCategoryName(category: Category | CategorySummary | null | undefined): string {
  return category?.name || '';
}

/**
 * Sort categories alphabetically by name
 * @param categories - Array of categories to sort
 * @returns Sorted array (alphabetically by name)
 */
export function sortCategories(categories: Category[]): Category[] {
  return [...categories].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get only active categories
 * @param categories - Array of categories
 * @returns Only active categories
 */
export function getActiveCategories(categories: Category[]): Category[] {
  return categories.filter(cat => cat.isActive);
}

/**
 * Convert Category to CategorySummary
 * @param category - Full category object
 * @returns Lightweight category summary
 */
export function toCategorySummary(category: Category): CategorySummary {
  return {
    id: category.id,
    name: category.name,
    iconUrl: category.iconUrl
  };
}

/**
 * Find category by name (case-insensitive)
 * @param categories - Array of categories to search
 * @param name - Name to search for
 * @returns Matching category or undefined
 */
export function findCategoryByName(categories: Category[], name: string): Category | undefined {
  const normalizedName = name.toLowerCase().trim();
  return categories.find(cat => cat.name.toLowerCase() === normalizedName);
}

/**
 * Find category by ID
 * @param categories - Array of categories to search
 * @param id - ID to search for
 * @returns Matching category or undefined
 */
export function findCategoryById(categories: Category[], id: number): Category | undefined {
  return categories.find(cat => cat.id === id);
}

/**
 * Get category names as string array
 * @param categories - Array of categories
 * @returns Array of category names
 */
export function getCategoryNames(categories: Category[]): string[] {
  return categories.map(cat => cat.name);
}

// ==================== Type Guards ====================

/**
 * Type guard to check if object is a Category
 * @param obj - Object to check
 * @returns True if object is a Category
 */
export function isCategory(obj: any): obj is Category {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'number' &&
    typeof obj.name === 'string' &&
    typeof obj.isActive === 'boolean'
  );
}

/**
 * Type guard to check if object is a CategorySummary
 * @param obj - Object to check
 * @returns True if object is a CategorySummary
 */
export function isCategorySummary(obj: any): obj is CategorySummary {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'number' &&
    typeof obj.name === 'string'
  );
}
