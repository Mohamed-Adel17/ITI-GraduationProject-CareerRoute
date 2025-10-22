import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * HTTP Interceptor that automatically attaches JWT token to outgoing requests
 *
 * This interceptor:
 * - Adds Authorization header with Bearer token to all API requests
 * - Skips token attachment for login/register endpoints
 * - Uses functional interceptor pattern (Angular 15+)
 *
 * @param req The outgoing HTTP request
 * @param next The next handler in the chain
 * @returns Observable of the HTTP event
 */
export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);

  // List of endpoints that should NOT have the token attached
  const excludedUrls = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/refresh-token',
    '/api/auth/forgot-password',
    '/api/auth/reset-password'
  ];

  // Check if the request URL should be excluded from token attachment
  const shouldExclude = excludedUrls.some(url => req.url.includes(url));

  // If excluded or no token available, proceed without modification
  if (shouldExclude) {
    return next(req);
  }

  // Get the token from AuthService
  const token = authService.getToken();

  // If no token exists, proceed without modification
  if (!token) {
    return next(req);
  }

  // Clone the request and add the Authorization header
  const clonedRequest = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  // Pass the cloned request to the next handler
  return next(clonedRequest);
};
