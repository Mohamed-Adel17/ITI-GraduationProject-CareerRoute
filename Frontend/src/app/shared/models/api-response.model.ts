/**
 * API Response Models
 *
 * Standardized response wrapper for all API endpoints.
 * Matches the backend ApiResponse structure from CareerRoute.API/Models/ApiResponse.cs
 *
 * @remarks
 * - All API endpoints return data wrapped in ApiResponse<T> format
 * - Provides consistent error handling across the application
 * - Success property indicates operation success/failure
 * - Message provides user-friendly feedback
 * - Errors dictionary contains field-specific validation errors
 */

/**
 * Base API response wrapper
 * Used for responses without typed data or error responses
 */
export interface ApiResponse<T = any> {
  /**
   * Indicates whether the request was successful
   * @default true
   */
  success: boolean;

  /**
   * The response data payload (strongly typed)
   * @remarks Only present in success responses
   */
  data?: T;

  /**
   * Optional message providing additional context
   * @remarks Used for success messages or error descriptions
   */
  message?: string;

  /**
   * HTTP status code
   * @remarks Included in error responses for frontend error handling
   */
  statusCode?: number;

  /**
   * Validation errors dictionary (field name -> error messages)
   * @remarks
   * - Key: field name (e.g., "email", "password")
   * - Value: array of error messages for that field
   * - Follows ASP.NET Core ModelState error format
   */
  errors?: { [key: string]: string[] };
}

/**
 * Success response with typed data
 * @template T The type of data being returned
 */
export interface ApiSuccessResponse<T> extends ApiResponse<T> {
  success: true;
  data: T;
}

/**
 * Error response with optional validation errors
 */
export interface ApiErrorResponse extends ApiResponse<never> {
  success: false;
  message: string;
  statusCode: number;
  errors?: { [key: string]: string[] };
}

// ==================== Type Guards ====================

/**
 * Type guard to check if response is successful
 * @param response API response to check
 * @returns True if response is successful with data
 */
export function isSuccessResponse<T>(
  response: ApiResponse<T>
): response is ApiSuccessResponse<T> {
  return response.success === true && response.data !== undefined;
}

/**
 * Type guard to check if response is an error
 * @param response API response to check
 * @returns True if response is an error
 */
export function isErrorResponse(
  response: ApiResponse<any>
): response is ApiErrorResponse {
  return response.success === false;
}

// ==================== Helper Functions ====================

/**
 * Extract user-friendly error message from API response
 * @param response Error response
 * @returns User-friendly error message
 */
export function getApiErrorMessage(response: ApiResponse<any>): string {
  // Check for explicit message
  if (response.message) {
    return response.message;
  }

  // Extract first validation error if available
  if (response.errors && typeof response.errors === 'object') {
    const firstErrorArray = Object.values(response.errors)[0];
    if (Array.isArray(firstErrorArray) && firstErrorArray.length > 0) {
      return firstErrorArray[0];
    }
  }

  // Default fallback message
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Extract all validation errors as a flat array
 * @param response Error response
 * @returns Array of all error messages
 */
export function getAllErrorMessages(response: ApiResponse<any>): string[] {
  const messages: string[] = [];

  // Add main message if present
  if (response.message) {
    messages.push(response.message);
  }

  // Add all validation errors
  if (response.errors && typeof response.errors === 'object') {
    Object.values(response.errors).forEach(errorArray => {
      if (Array.isArray(errorArray)) {
        messages.push(...errorArray);
      }
    });
  }

  return messages;
}

/**
 * Get validation errors for a specific field
 * @param response Error response
 * @param fieldName Name of the field
 * @returns Array of error messages for the field, or empty array
 */
export function getFieldErrors(
  response: ApiResponse<any>,
  fieldName: string
): string[] {
  if (!response.errors || typeof response.errors !== 'object') {
    return [];
  }

  const errors = response.errors[fieldName];
  return Array.isArray(errors) ? errors : [];
}

/**
 * Check if response has validation errors for a specific field
 * @param response Error response
 * @param fieldName Name of the field
 * @returns True if field has validation errors
 */
export function hasFieldError(
  response: ApiResponse<any>,
  fieldName: string
): boolean {
  return getFieldErrors(response, fieldName).length > 0;
}

/**
 * Create a success response (useful for mocking/testing)
 * @param data Response data
 * @param message Optional success message
 * @returns Success response
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string
): ApiSuccessResponse<T> {
  return {
    success: true,
    data,
    message
  };
}

/**
 * Create an error response (useful for mocking/testing)
 * @param message Error message
 * @param statusCode HTTP status code
 * @param errors Optional validation errors
 * @returns Error response
 */
export function createErrorResponse(
  message: string,
  statusCode: number = 400,
  errors?: { [key: string]: string[] }
): ApiErrorResponse {
  return {
    success: false,
    message,
    statusCode,
    errors
  };
}

/**
 * Unwrap API response data or throw error
 * @param response API response
 * @returns Unwrapped data
 * @throws Error if response is not successful
 *
 * @remarks
 * Use this for endpoints that return data (User, Category[], etc.)
 * For void/empty responses, use unwrapVoidResponse()
 */
export function unwrapResponse<T>(response: ApiResponse<T>): T {
  if (isSuccessResponse(response)) {
    return response.data;
  }

  throw new Error(getApiErrorMessage(response));
}

/**
 * Unwrap API response for void operations (delete, logout, etc.)
 * @param response API response with void data
 * @throws Error if response is not successful
 *
 * @remarks
 * Use this for endpoints that don't return data:
 * - DELETE operations
 * - Logout operations
 * - Other operations where only success/failure matters
 *
 * Unlike unwrapResponse(), this only validates the success flag
 * and doesn't require response.data to be present.
 *
 * @example
 * ```typescript
 * deleteUser(): Observable<void> {
 *   return this.http.delete<ApiResponse<void>>(url).pipe(
 *     map(response => unwrapVoidResponse(response))
 *   );
 * }
 * ```
 */
export function unwrapVoidResponse(response: ApiResponse<void>): void {
  if (!response.success) {
    throw new Error(getApiErrorMessage(response));
  }
  // No return value needed for void operations
}

/**
 * Transform API response errors to form validation errors
 * Useful for displaying errors in reactive forms
 * @param response Error response
 * @returns Map of field names to error messages (first error only)
 */
export function toFormErrors(
  response: ApiResponse<any>
): { [key: string]: string } {
  const formErrors: { [key: string]: string } = {};

  if (response.errors && typeof response.errors === 'object') {
    Object.entries(response.errors).forEach(([field, errors]) => {
      if (Array.isArray(errors) && errors.length > 0) {
        // Use first error for each field
        formErrors[field] = errors[0];
      }
    });
  }

  return formErrors;
}
