import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ApiResponse, getApiErrorMessage } from '../../shared/models/api-response.model';

/**
 * HTTP Interceptor that handles errors from API requests
 *
 * This interceptor:
 * - Catches HTTP errors and provides centralized error handling
 * - Extracts error information from standardized ApiResponse format
 * - Handles 401 Unauthorized errors by logging out the user
 * - Handles 403 Forbidden errors with appropriate messaging
 * - Handles 404 Not Found errors
 * - Handles 500 Server errors
 * - Handles network/timeout errors
 * - Provides user-friendly error messages
 * - Uses functional interceptor pattern (Angular 15+)
 *
 * @param req The outgoing HTTP request
 * @param next The next handler in the chain
 * @returns Observable of the HTTP event
 */
export const errorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An unexpected error occurred';
      let validationErrors: { [key: string]: string[] } | undefined;

      if (error.error instanceof ErrorEvent) {
        // Client-side or network error
        errorMessage = `Network Error: ${error.error.message}`;
        console.error('Client-side error:', error.error.message);
      } else {
        // Try to extract ApiResponse from error body
        const apiResponse: ApiResponse<any> | undefined =
          error.error && typeof error.error === 'object' ? error.error : undefined;

        // Backend returned an unsuccessful response code
        switch (error.status) {
          case 400:
            // Bad Request - validation errors
            if (apiResponse) {
              errorMessage = getApiErrorMessage(apiResponse);
              validationErrors = apiResponse.errors;
            } else {
              errorMessage = handleBadRequest(error);
            }
            break;

          case 401:
            // Unauthorized - token expired or invalid
            errorMessage = apiResponse?.message || 'Your session has expired. Please log in again.';
            console.warn('Unauthorized request - logging out user');
            authService.removeTokens();
            router.navigate(['/login']);
            break;

          case 403:
            // Forbidden - user doesn't have permission
            errorMessage = apiResponse?.message || 'You do not have permission to access this resource.';
            console.warn('Forbidden access attempt:', req.url);
            break;

          case 404:
            // Not Found
            errorMessage = apiResponse?.message || 'The requested resource was not found.';
            console.warn('Resource not found:', req.url);
            break;

          case 409:
            // Conflict - e.g., duplicate resource
            errorMessage = apiResponse?.message || 'A conflict occurred. The resource may already exist.';
            break;

          case 422:
            // Unprocessable Entity - validation errors
            if (apiResponse) {
              errorMessage = getApiErrorMessage(apiResponse);
              validationErrors = apiResponse.errors;
            } else {
              errorMessage = handleValidationErrors(error);
            }
            break;

          case 429:
            // Too Many Requests - rate limiting
            errorMessage = apiResponse?.message || 'Too many requests. Please try again later.';
            console.warn('Rate limit exceeded');
            break;

          case 500:
            // Internal Server Error
            errorMessage = apiResponse?.message || 'A server error occurred. Please try again later.';
            console.error('Server error:', error.error);
            break;

          case 503:
            // Service Unavailable
            errorMessage = apiResponse?.message || 'The service is temporarily unavailable. Please try again later.';
            console.error('Service unavailable');
            break;

          case 0:
            // Network error or CORS issue
            errorMessage = 'Unable to connect to the server. Please check your internet connection.';
            console.error('Network error or CORS issue');
            break;

          default:
            // Other errors
            errorMessage = apiResponse?.message || error.error?.message || `Error: ${error.statusText || 'Unknown error'}`;
            console.error(`HTTP Error ${error.status}:`, error.error);
        }
      }

      // Log error details for debugging
      console.error('Error Interceptor:', {
        status: error.status,
        message: errorMessage,
        url: req.url,
        method: req.method,
        errors: validationErrors,
        error: error.error
      });

      // Return error with user-friendly message and validation errors
      return throwError(() => ({
        status: error.status,
        message: errorMessage,
        errors: validationErrors,
        originalError: error
      }));
    })
  );
};

/**
 * Handles 400 Bad Request errors
 * Extracts validation error messages from the response
 */
function handleBadRequest(error: HttpErrorResponse): string {
  if (error.error?.errors) {
    // ASP.NET Core validation errors format
    const errors = error.error.errors;
    const errorMessages: string[] = [];

    for (const key in errors) {
      if (errors.hasOwnProperty(key)) {
        errorMessages.push(...errors[key]);
      }
    }

    return errorMessages.length > 0
      ? errorMessages.join('; ')
      : 'Invalid request data.';
  }

  return error.error?.message || 'Invalid request data.';
}

/**
 * Handles 422 Unprocessable Entity errors
 * Extracts validation error messages from the response
 */
function handleValidationErrors(error: HttpErrorResponse): string {
  if (error.error?.errors) {
    // FluentValidation errors format
    const errors = error.error.errors;

    if (Array.isArray(errors)) {
      return errors.join('; ');
    }

    if (typeof errors === 'object') {
      const errorMessages: string[] = [];
      for (const key in errors) {
        if (errors.hasOwnProperty(key)) {
          const value = errors[key];
          if (Array.isArray(value)) {
            errorMessages.push(...value);
          } else {
            errorMessages.push(value);
          }
        }
      }
      return errorMessages.join('; ');
    }
  }

  return error.error?.message || 'Validation failed.';
}
