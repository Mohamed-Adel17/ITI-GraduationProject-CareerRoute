/**
 * Review Models
 *
 * TypeScript interfaces for the Review System based on Reviews-Endpoints.md contract.
 */

// ===========================
// Request DTOs
// ===========================

/**
 * Request body for creating a review
 * POST /api/sessions/{sessionId}/reviews
 */
export interface CreateReviewRequest {
  rating: number;      // Required: 1-5
  comment?: string;    // Optional: 5-500 characters if provided
}

// ===========================
// Response DTOs
// ===========================

/**
 * Review item returned from API
 * Used in both single review and list responses
 */
export interface ReviewItem {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  menteeFirstName: string;
  menteeLastName: string;
}

/**
 * Full review response after creation
 * POST /api/sessions/{sessionId}/reviews response
 */
export interface ReviewResponse {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  sessionId: string;
  menteeId: string;
  menteeFirstName: string;
  menteeLastName: string;
  mentorId: string;
  mentorFirstName: string;
  mentorLastName: string;
}

/**
 * Pagination metadata for reviews list
 */
export interface ReviewPaginationMetadata {
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Paginated mentor reviews response
 * GET /api/mentors/{mentorId}/reviews response
 */
export interface MentorReviewsResponse {
  reviews: ReviewItem[];
  pagination: ReviewPaginationMetadata;
}

// ===========================
// Helper Functions
// ===========================

/**
 * Get reviewer display name (first name + last initial)
 */
export function getReviewerDisplayName(review: ReviewItem): string {
  const firstName = review.menteeFirstName || 'Anonymous';
  const lastInitial = review.menteeLastName ? review.menteeLastName.charAt(0) + '.' : '';
  return `${firstName} ${lastInitial}`.trim();
}

/**
 * Format review date for display
 */
export function formatReviewDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Format review date as relative time (e.g., "2 days ago")
 */
export function formatReviewDateRelative(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

/**
 * Validate review request
 */
export function validateReviewRequest(request: Partial<CreateReviewRequest>): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  if (!request.rating || request.rating < 1 || request.rating > 5) {
    errors['rating'] = 'Rating must be between 1 and 5';
  }

  if (request.comment) {
    if (request.comment.length < 5) {
      errors['comment'] = 'Comment must be at least 5 characters';
    }
    if (request.comment.length > 500) {
      errors['comment'] = 'Comment cannot exceed 500 characters';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Generate star array for display
 */
export function getStarArray(rating: number): ('full' | 'half' | 'empty')[] {
  const stars: ('full' | 'half' | 'empty')[] = [];
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;

  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      stars.push('full');
    } else if (i === fullStars && hasHalf) {
      stars.push('half');
    } else {
      stars.push('empty');
    }
  }

  return stars;
}
