/**
 * Category Model
 *
 * Defines category-related interfaces and types for the Career Route application.
 * Categories are used for mentor specializations and user career interests.
 */

/**
 * Category Type Enum
 * Defines different types of categories in the system
 */
export enum CategoryType {
  /** Career interests for user profiles */
  CareerInterest = 'CareerInterest',
  /** Mentor specializations and expertise areas */
  MentorSpecialization = 'MentorSpecialization',
  /** General category (future use) */
  General = 'General'
}

/**
 * Category Interface
 * Represents a category entity from the backend
 */
export interface Category {
  /** Unique identifier for the category */
  id: string;

  /** Display name of the category */
  name: string;

  /** Optional description of the category */
  description?: string;

  /** Category type (CareerInterest, MentorSpecialization, etc.) */
  type: CategoryType;

  /** Icon name or URL for visual representation */
  icon?: string;

  /** Display order for sorting */
  displayOrder?: number;

  /** Whether the category is active/visible */
  isActive: boolean;

  /** Creation timestamp */
  createdAt?: Date;

  /** Last update timestamp */
  updatedAt?: Date;
}

/**
 * Category Summary
 * Lightweight version of Category for lists and dropdowns
 */
export interface CategorySummary {
  /** Unique identifier */
  id: string;

  /** Display name */
  name: string;

  /** Category type */
  type: CategoryType;

  /** Icon (optional) */
  icon?: string;
}

/**
 * Category Create Request
 * Data needed to create a new category (admin only)
 */
export interface CategoryCreateRequest {
  /** Category name */
  name: string;

  /** Category description */
  description?: string;

  /** Category type */
  type: CategoryType;

  /** Icon */
  icon?: string;

  /** Display order */
  displayOrder?: number;
}

/**
 * Category Update Request
 * Data for updating an existing category (admin only)
 */
export interface CategoryUpdateRequest {
  /** Updated name */
  name?: string;

  /** Updated description */
  description?: string;

  /** Updated icon */
  icon?: string;

  /** Updated display order */
  displayOrder?: number;

  /** Updated active status */
  isActive?: boolean;
}

/**
 * Categories Response
 * API response wrapper for multiple categories
 */
export interface CategoriesResponse {
  /** Success status */
  success: boolean;

  /** Response message */
  message?: string;

  /** Array of categories */
  data: Category[];

  /** Total count (for pagination) */
  totalCount?: number;
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
 * Sort categories by display order
 * @param categories - Array of categories to sort
 * @returns Sorted array (by displayOrder, then by name)
 */
export function sortCategories(categories: Category[]): Category[] {
  return [...categories].sort((a, b) => {
    // First sort by display order (if available)
    if (a.displayOrder !== undefined && b.displayOrder !== undefined) {
      if (a.displayOrder !== b.displayOrder) {
        return a.displayOrder - b.displayOrder;
      }
    }
    // Then sort alphabetically by name
    return a.name.localeCompare(b.name);
  });
}

/**
 * Filter categories by type
 * @param categories - Array of categories
 * @param type - Category type to filter by
 * @returns Filtered categories
 */
export function filterCategoriesByType(categories: Category[], type: CategoryType): Category[] {
  return categories.filter(cat => cat.type === type);
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
    type: category.type,
    icon: category.icon
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
 * Get career interest categories only
 * Convenience function for filtering career interests
 * @param categories - Array of all categories
 * @returns Only career interest categories that are active
 */
export function getCareerInterestCategories(categories: Category[]): Category[] {
  return categories.filter(cat =>
    cat.type === CategoryType.CareerInterest && cat.isActive
  );
}

/**
 * Get mentor specialization categories only
 * Convenience function for filtering mentor specializations
 * @param categories - Array of all categories
 * @returns Only mentor specialization categories that are active
 */
export function getMentorSpecializationCategories(categories: Category[]): Category[] {
  return categories.filter(cat =>
    cat.type === CategoryType.MentorSpecialization && cat.isActive
  );
}

/**
 * Format category type for display
 * @param type - Category type enum
 * @returns Human-readable type name
 */
export function formatCategoryType(type: CategoryType): string {
  switch (type) {
    case CategoryType.CareerInterest:
      return 'Career Interest';
    case CategoryType.MentorSpecialization:
      return 'Mentor Specialization';
    case CategoryType.General:
      return 'General';
    default:
      return type;
  }
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
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.type === 'string' &&
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
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.type === 'string'
  );
}
