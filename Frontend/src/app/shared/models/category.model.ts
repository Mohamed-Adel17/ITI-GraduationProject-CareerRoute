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
 */
export interface Category {
  /** Unique identifier for the category */
  id: string;

  /** Display name of the category */
  name: string;

  /** Optional description of the category */
  description?: string;

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
 * Find category by ID
 * @param categories - Array of categories to search
 * @param id - ID to search for
 * @returns Matching category or undefined
 */
export function findCategoryById(categories: Category[], id: string): Category | undefined {
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
    typeof obj.id === 'string' &&
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
    typeof obj.id === 'string' &&
    typeof obj.name === 'string'
  );
}
