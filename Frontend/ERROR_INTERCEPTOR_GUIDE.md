# Angular Error Interceptor - Complete Step-by-Step Guide

## Table of Contents
1. [What is an Error Interceptor?](#what-is-an-error-interceptor)
2. [Why Do You Need It?](#why-do-you-need-it)
3. [How Error Interceptors Work](#how-error-interceptors-work)
4. [Step-by-Step Implementation](#step-by-step-implementation)
5. [Common Error Scenarios](#common-error-scenarios)
6. [Real-World Examples](#real-world-examples)
7. [Testing the Error Interceptor](#testing-the-error-interceptor)

---

## What is an Error Interceptor?

An **Error Interceptor** is a special type of HTTP interceptor that catches and handles errors from HTTP requests **in one central place**.

### The Request/Response Lifecycle

```
Component/Service
      │
      │  http.get('/api/mentors')
      ▼
┌─────────────────────────────────────────────────────────────┐
│  Auth Interceptor (Request Phase)                           │
│  Adds: Authorization: Bearer <token>                        │
└─────────────────────────────────────────────────────────────┘
      │
      ▼
Backend API
      │
      │  (Might return error: 401, 403, 404, 500, etc.)
      ▼
┌─────────────────────────────────────────────────────────────┐
│  Error Interceptor (Response Phase) ⭐                      │
│                                                              │
│  Catches ALL errors from backend:                           │
│  - 401 Unauthorized → Logout & redirect to login            │
│  - 403 Forbidden → Show "Access denied" message             │
│  - 404 Not Found → Show "Resource not found"                │
│  - 500 Server Error → Show "Something went wrong"           │
│  - Network errors → Show "Check your connection"            │
└─────────────────────────────────────────────────────────────┘
      │
      ▼
Component receives error
(Already handled by interceptor!)
```

---

## Why Do You Need It?

### ❌ WITHOUT Error Interceptor

Every component/service must handle errors individually:

```typescript
// In MentorService
getMentors() {
  return this.http.get('/api/mentors')
    .pipe(
      catchError(error => {
        if (error.status === 401) {
          // Token expired - logout
          this.authService.removeTokens();
          this.router.navigate(['/login']);
        } else if (error.status === 500) {
          // Server error
          alert('Server error. Please try again.');
        }
        return throwError(() => error);
      })
    );
}

// In SessionService
bookSession(data: any) {
  return this.http.post('/api/sessions', data)
    .pipe(
      catchError(error => {
        if (error.status === 401) {
          // Same code repeated! 😫
          this.authService.removeTokens();
          this.router.navigate(['/login']);
        } else if (error.status === 403) {
          alert('You are not allowed to book sessions');
        }
        return throwError(() => error);
      })
    );
}

// ... repeated in 50+ services! 😭
```

**Problems:**
- 🔴 Repetitive error handling code
- 🔴 Easy to miss error cases
- 🔴 Inconsistent error messages
- 🔴 Hard to maintain

### ✅ WITH Error Interceptor

Handle all errors in ONE place:

```typescript
// Error interceptor handles everything centrally
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError(error => {
      // Handle ALL errors here!
      if (error.status === 401) {
        // Logout and redirect
      } else if (error.status === 403) {
        // Show access denied
      }
      // ... etc
      return throwError(() => error);
    })
  );
};

// Now services are clean:
getMentors() {
  return this.http.get('/api/mentors'); // ✅ Errors auto-handled!
}

bookSession(data: any) {
  return this.http.post('/api/sessions', data); // ✅ Errors auto-handled!
}
```

**Benefits:**
- ✅ Centralized error handling
- ✅ Consistent error messages
- ✅ Automatic logout on 401
- ✅ Clean service code

---

## How Error Interceptors Work

### The Complete Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    STEP-BY-STEP FLOW                         │
└─────────────────────────────────────────────────────────────┘

1. Component calls API
   │
   │  this.http.get('/api/mentors')
   │
2. Request goes through Auth Interceptor
   │
   │  Adds: Authorization: Bearer <token>
   │
3. Request sent to backend
   │
   │  GET /api/mentors
   │  Headers: Authorization: Bearer <expired-token>
   │
4. Backend validates token
   │
   │  Token is expired! 🚫
   │
5. Backend returns error
   │
   │  HTTP 401 Unauthorized
   │  {
   │    "error": "Token expired",
   │    "message": "Please login again"
   │  }
   │
6. ⭐ Error Interceptor catches the error ⭐
   │
   │  Checks error.status
   │  ├─→ 401? YES!
   │  │
   │  ├─→ Clear tokens from localStorage
   │  │   authService.removeTokens()
   │  │
   │  ├─→ Show notification
   │  │   "Your session expired. Please login again."
   │  │
   │  └─→ Redirect to login
   │      router.navigate(['/login'])
   │
7. Error thrown back to component (optional)
   │
   │  Component can still handle specific errors if needed
   │
8. User sees login page with message
```

### RxJS Operators Used

The error interceptor uses **RxJS operators** to handle async errors:

```typescript
import { catchError, throwError } from 'rxjs';

// catchError: Catches errors from the HTTP observable
// throwError: Re-throws the error (optionally) for component handling
```

---

## Step-by-Step Implementation

### Step 1: Understand the Interface

```typescript
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  //     ↑
  //     HttpInterceptorFn is the type for functional interceptors
  //
  //     req = The HTTP request
  //     next = Function to pass request to next handler

  return next(req).pipe(
    //   ↑
    //   next(req) sends the request and returns an Observable
    //   .pipe() allows us to chain RxJS operators

    catchError((error: HttpErrorResponse) => {
      //        ↑
      //        catchError catches any errors from the HTTP request
      //        HttpErrorResponse contains error details

      // Handle the error here

      return throwError(() => error);
      //     ↑
      //     Re-throw the error so components can handle it too (optional)
    })
  );
};
```

### Step 2: Create the Error Interceptor File

```typescript
// src/app/core/interceptors/error.interceptor.ts

import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  // Step 1: Inject dependencies
  const router = inject(Router);
  const authService = inject(AuthService);

  // Step 2: Send the request and handle errors
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Step 3: Handle different error types
      handleError(error, router, authService);

      // Step 4: Re-throw error for component-level handling
      return throwError(() => error);
    })
  );
};

// Step 5: Error handling logic
function handleError(
  error: HttpErrorResponse,
  router: Router,
  authService: AuthService
): void {
  // We'll fill this in next!
}
```

### Step 3: Handle Different HTTP Status Codes

```typescript
function handleError(
  error: HttpErrorResponse,
  router: Router,
  authService: AuthService
): void {

  // Check if it's an HTTP error (vs network error)
  if (error.error instanceof ErrorEvent) {
    // CLIENT-SIDE ERROR (network, etc.)
    console.error('Client-side error:', error.error.message);
    // Could show: "Network error. Check your connection."
  } else {
    // SERVER-SIDE ERROR (HTTP status codes)
    console.error(`Server error: ${error.status}`, error.error);

    // Handle based on status code
    switch (error.status) {
      case 401: // Unauthorized
        handle401(router, authService);
        break;

      case 403: // Forbidden
        handle403(router);
        break;

      case 404: // Not Found
        handle404(error);
        break;

      case 500: // Internal Server Error
        handle500(error);
        break;

      case 0: // Network error (backend not reachable)
        handleNetworkError();
        break;

      default:
        handleGenericError(error);
        break;
    }
  }
}
```

### Step 4: Implement Each Error Handler

```typescript
// 401 Unauthorized - Token expired or invalid
function handle401(router: Router, authService: AuthService): void {
  console.log('401 Unauthorized - Logging out user');

  // Clear tokens
  authService.removeTokens();

  // Save current URL for redirect after login
  const currentUrl = router.url;

  // Navigate to login with return URL
  router.navigate(['/login'], {
    queryParams: {
      returnUrl: currentUrl,
      reason: 'session-expired'
    }
  });

  // Optional: Show toast/notification
  // this.notificationService.show('Your session expired. Please login again.');
}

// 403 Forbidden - User doesn't have permission
function handle403(router: Router): void {
  console.log('403 Forbidden - Access denied');

  // Navigate to access denied page
  router.navigate(['/access-denied']);

  // Or show notification
  // this.notificationService.error('You do not have permission to access this resource.');
}

// 404 Not Found - Resource doesn't exist
function handle404(error: HttpErrorResponse): void {
  console.log('404 Not Found:', error.url);

  // Log the error for debugging
  console.error('Resource not found:', error.url);

  // Optional: Show notification
  // this.notificationService.warn('The requested resource was not found.');
}

// 500 Internal Server Error
function handle500(error: HttpErrorResponse): void {
  console.log('500 Internal Server Error');

  // Log detailed error for debugging
  console.error('Server error details:', error.error);

  // Show user-friendly message
  // this.notificationService.error('Something went wrong on our end. Please try again later.');
}

// Network error (backend not reachable)
function handleNetworkError(): void {
  console.log('Network error - Backend not reachable');

  // Show network error message
  // this.notificationService.error('Cannot connect to server. Please check your internet connection.');
}

// Generic error handler
function handleGenericError(error: HttpErrorResponse): void {
  console.log(`Error ${error.status}:`, error.message);

  // Show generic error message
  const message = error.error?.message || error.message || 'An unexpected error occurred';
  // this.notificationService.error(message);
}
```

### Step 5: Register the Interceptor

```typescript
// src/app/app.config.ts

import { ApplicationConfig } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([
        authInterceptor,   // ← Runs first (adds token)
        errorInterceptor   // ← Runs second (handles errors)
      ])
    )
  ]
};
```

**Important:** Order matters!
1. `authInterceptor` runs first (adds token to request)
2. `errorInterceptor` runs second (catches errors from response)

---

## Common Error Scenarios

### Scenario 1: Token Expired (401)

```
┌────────────────────────────────────────────────────────────┐
│  User Action: Click "View Mentors"                         │
└────────────────────────────────────────────────────────────┘
      │
      │  http.get('/api/mentors')
      ▼
Auth Interceptor: Add Authorization header
      │
      ▼
Backend: Validate token
      │
      ├─→ Token expired! 🚫
      │
      └─→ Return 401 Unauthorized
              │
              ▼
┌────────────────────────────────────────────────────────────┐
│  Error Interceptor catches 401                             │
│                                                             │
│  Actions:                                                   │
│  1. authService.removeTokens()                              │
│  2. router.navigate(['/login'])                             │
│  3. Show message: "Session expired, please login"          │
└────────────────────────────────────────────────────────────┘
      │
      ▼
User sees login page
```

### Scenario 2: Forbidden Access (403)

```
┌────────────────────────────────────────────────────────────┐
│  User Action: Try to access admin panel                    │
└────────────────────────────────────────────────────────────┘
      │
      │  http.get('/api/admin/statistics')
      ▼
Auth Interceptor: Add Authorization header
      │
      ▼
Backend: Validate token & check permissions
      │
      ├─→ Token valid ✅
      ├─→ User role: "User" (not "Admin")
      │
      └─→ Return 403 Forbidden
              │
              ▼
┌────────────────────────────────────────────────────────────┐
│  Error Interceptor catches 403                             │
│                                                             │
│  Actions:                                                   │
│  1. router.navigate(['/access-denied'])                     │
│  2. Show message: "You don't have permission"              │
└────────────────────────────────────────────────────────────┘
      │
      ▼
User sees "Access Denied" page
```

### Scenario 3: Resource Not Found (404)

```
┌────────────────────────────────────────────────────────────┐
│  User Action: View mentor profile (invalid ID)             │
└────────────────────────────────────────────────────────────┘
      │
      │  http.get('/api/mentors/99999')
      ▼
Backend: Search for mentor with ID 99999
      │
      └─→ Not found! 🚫
              │
              └─→ Return 404 Not Found
                      │
                      ▼
┌────────────────────────────────────────────────────────────┐
│  Error Interceptor catches 404                             │
│                                                             │
│  Actions:                                                   │
│  1. Log error for debugging                                │
│  2. Show message: "Mentor not found"                       │
│  3. Optionally redirect to mentors list                    │
└────────────────────────────────────────────────────────────┘
      │
      ▼
User sees error message
```

### Scenario 4: Server Error (500)

```
┌────────────────────────────────────────────────────────────┐
│  User Action: Book a session                               │
└────────────────────────────────────────────────────────────┘
      │
      │  http.post('/api/sessions', data)
      ▼
Backend: Process booking
      │
      ├─→ Database connection error! 💥
      │
      └─→ Return 500 Internal Server Error
              │
              ▼
┌────────────────────────────────────────────────────────────┐
│  Error Interceptor catches 500                             │
│                                                             │
│  Actions:                                                   │
│  1. Log detailed error for developers                      │
│  2. Show user-friendly message:                            │
│     "Something went wrong. Please try again."              │
└────────────────────────────────────────────────────────────┘
      │
      ▼
User sees friendly error message
(Technical details hidden)
```

### Scenario 5: Network Error (Backend Down)

```
┌────────────────────────────────────────────────────────────┐
│  User Action: Load mentors list                            │
└────────────────────────────────────────────────────────────┘
      │
      │  http.get('/api/mentors')
      ▼
Try to connect to backend
      │
      └─→ Connection refused! 🚫
          (Backend not running)
              │
              └─→ Return error.status = 0
                      │
                      ▼
┌────────────────────────────────────────────────────────────┐
│  Error Interceptor catches status 0                        │
│                                                             │
│  Actions:                                                   │
│  1. Show message: "Cannot connect to server"               │
│  2. Suggest: "Check your internet connection"              │
└────────────────────────────────────────────────────────────┘
      │
      ▼
User sees network error message
```

---

## Real-World Examples

### Complete Error Interceptor Implementation

```typescript
// src/app/core/interceptors/error.interceptor.ts

import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Error interceptor that handles HTTP errors globally
 *
 * Handles:
 * - 401 Unauthorized: Logout and redirect to login
 * - 403 Forbidden: Show access denied message
 * - 404 Not Found: Log and notify user
 * - 500 Server Error: Show generic error message
 * - Network errors: Show connectivity message
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      console.group('🚨 HTTP Error Intercepted');
      console.log('URL:', req.url);
      console.log('Method:', req.method);
      console.log('Status:', error.status);
      console.log('Error:', error);
      console.groupEnd();

      // Handle different error types
      handleHttpError(error, router, authService);

      // Re-throw error for component-specific handling
      return throwError(() => error);
    })
  );
};

/**
 * Main error handling function
 */
function handleHttpError(
  error: HttpErrorResponse,
  router: Router,
  authService: AuthService
): void {
  // Client-side or network error
  if (error.error instanceof ErrorEvent) {
    handleClientError(error.error);
    return;
  }

  // Server-side error - handle by status code
  switch (error.status) {
    case 0:
      handleNetworkError();
      break;
    case 401:
      handleUnauthorized(router, authService);
      break;
    case 403:
      handleForbidden(router);
      break;
    case 404:
      handleNotFound(error);
      break;
    case 500:
    case 502:
    case 503:
      handleServerError(error);
      break;
    default:
      handleGenericError(error);
  }
}

/**
 * Handle 401 Unauthorized errors
 * Action: Logout user and redirect to login
 */
function handleUnauthorized(router: Router, authService: AuthService): void {
  console.warn('⚠️ Unauthorized access - logging out user');

  // Clear authentication tokens
  authService.removeTokens();

  // Save current URL to redirect back after login
  const currentUrl = router.url;

  // Navigate to login page
  router.navigate(['/login'], {
    queryParams: {
      returnUrl: currentUrl !== '/login' ? currentUrl : '/',
      reason: 'session-expired'
    }
  });

  // Show notification (if you have a notification service)
  // this.notificationService.warning('Your session has expired. Please log in again.');
}

/**
 * Handle 403 Forbidden errors
 * Action: Show access denied message
 */
function handleForbidden(router: Router): void {
  console.warn('⚠️ Access forbidden');

  // Navigate to access denied page (if you have one)
  // router.navigate(['/access-denied']);

  // Or show notification
  // this.notificationService.error('You do not have permission to access this resource.');

  // For now, just log
  alert('Access Denied: You do not have permission to access this resource.');
}

/**
 * Handle 404 Not Found errors
 * Action: Log error and notify user
 */
function handleNotFound(error: HttpErrorResponse): void {
  console.warn('⚠️ Resource not found:', error.url);

  // Show notification
  // this.notificationService.info('The requested resource was not found.');

  // For now, just log
  console.log('Resource not found - this is expected for some requests');
}

/**
 * Handle 500/502/503 Server errors
 * Action: Show user-friendly error message
 */
function handleServerError(error: HttpErrorResponse): void {
  console.error('❌ Server error:', error.status);
  console.error('Error details:', error.error);

  // Show user-friendly message (hide technical details from user)
  // this.notificationService.error(
  //   'Our server encountered an error. Please try again in a few moments.'
  // );

  // For now, show alert
  alert('Server Error: Something went wrong on our end. Please try again later.');
}

/**
 * Handle network errors (backend unreachable)
 * Action: Show connectivity message
 */
function handleNetworkError(): void {
  console.error('❌ Network error - cannot reach backend');

  // Show network error message
  // this.notificationService.error(
  //   'Cannot connect to the server. Please check your internet connection.'
  // );

  // For now, show alert
  alert('Network Error: Cannot connect to the server. Please check your internet connection.');
}

/**
 * Handle client-side errors (JavaScript errors, etc.)
 * Action: Log error
 */
function handleClientError(error: ErrorEvent): void {
  console.error('❌ Client-side error:', error.message);

  // Show generic error
  // this.notificationService.error('An unexpected error occurred.');

  // For now, just log
  console.error('Client error details:', error);
}

/**
 * Handle any other HTTP errors
 * Action: Show generic error message
 */
function handleGenericError(error: HttpErrorResponse): void {
  console.error(`❌ HTTP ${error.status} error:`, error.message);

  const message = error.error?.message || error.message || 'An unexpected error occurred';

  // Show error notification
  // this.notificationService.error(message);

  // For now, show alert
  alert(`Error: ${message}`);
}
```

### Usage in Components (Before and After)

#### Before Error Interceptor:

```typescript
export class MentorListComponent {
  mentors: any[] = [];
  loading = false;
  error = '';

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router
  ) {}

  loadMentors() {
    this.loading = true;
    this.error = '';

    this.http.get('/api/mentors').subscribe({
      next: (mentors: any) => {
        this.mentors = mentors;
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        // Have to handle all errors manually! 😫
        this.loading = false;

        if (error.status === 401) {
          this.authService.removeTokens();
          this.router.navigate(['/login']);
        } else if (error.status === 500) {
          this.error = 'Server error. Please try again.';
        } else if (error.status === 0) {
          this.error = 'Cannot connect to server.';
        } else {
          this.error = 'An error occurred.';
        }
      }
    });
  }
}
```

#### After Error Interceptor:

```typescript
export class MentorListComponent {
  mentors: any[] = [];
  loading = false;

  constructor(private http: HttpClient) {}

  loadMentors() {
    this.loading = true;

    this.http.get('/api/mentors').subscribe({
      next: (mentors: any) => {
        this.mentors = mentors;
        this.loading = false;
      },
      error: () => {
        // Error already handled by interceptor! ✅
        this.loading = false;
        // Only handle component-specific logic if needed
      }
    });
  }
}
```

Much cleaner! 🎉

---

## Testing the Error Interceptor

### Step 1: Create the Interceptor

```bash
# Already done! File is at:
# Frontend/src/app/core/interceptors/error.interceptor.ts
```

### Step 2: Register It

```typescript
// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([
        authInterceptor,
        errorInterceptor  // ← Add this
      ])
    )
  ]
};
```

### Step 3: Test Each Error Scenario

#### Test 401 (Unauthorized):

```typescript
// Create a test component
testUnauthorized() {
  // Manually expire token or use invalid token
  this.authService.setToken('invalid-token');

  // Make any API call
  this.http.get('http://localhost:5000/api/users/me')
    .subscribe({
      next: () => console.log('Success'),
      error: (error) => console.log('Error caught:', error)
    });

  // Expected:
  // 1. Backend returns 401
  // 2. Error interceptor catches it
  // 3. Tokens cleared
  // 4. Redirected to /login
}
```

**Visual Verification:**
1. Open DevTools → Console
2. See: "🚨 HTTP Error Intercepted" with status 401
3. See: "⚠️ Unauthorized access - logging out user"
4. You're redirected to login page

#### Test 403 (Forbidden):

```typescript
testForbidden() {
  // Try to access admin endpoint as regular user
  this.http.get('http://localhost:5000/api/admin/statistics')
    .subscribe({
      next: () => console.log('Success'),
      error: (error) => console.log('Error caught:', error)
    });

  // Expected:
  // 1. Backend returns 403
  // 2. Error interceptor catches it
  // 3. "Access Denied" alert shown
}
```

#### Test 404 (Not Found):

```typescript
testNotFound() {
  // Request non-existent resource
  this.http.get('http://localhost:5000/api/mentors/99999')
    .subscribe({
      next: () => console.log('Success'),
      error: (error) => console.log('Error caught:', error)
    });

  // Expected:
  // 1. Backend returns 404
  // 2. Error interceptor logs it
  // 3. Console shows: "Resource not found"
}
```

#### Test 500 (Server Error):

```typescript
testServerError() {
  // Trigger a server error (backend would need to have a bug)
  this.http.post('http://localhost:5000/api/sessions', {
    // Invalid data that causes backend to crash
    mentorId: null
  }).subscribe({
    next: () => console.log('Success'),
    error: (error) => console.log('Error caught:', error)
  });

  // Expected:
  // 1. Backend returns 500
  // 2. Error interceptor catches it
  // 3. Alert: "Server Error: Something went wrong..."
}
```

#### Test Network Error:

```typescript
testNetworkError() {
  // Stop your backend or use wrong URL
  this.http.get('http://localhost:9999/api/mentors')
    .subscribe({
      next: () => console.log('Success'),
      error: (error) => console.log('Error caught:', error)
    });

  // Expected:
  // 1. Request fails (status 0)
  // 2. Error interceptor catches it
  // 3. Alert: "Network Error: Cannot connect to server..."
}
```

### Step 4: Verify in Browser DevTools

1. **Open DevTools → Console**
2. **Look for error logs:**

```
🚨 HTTP Error Intercepted
  URL: http://localhost:5000/api/mentors
  Method: GET
  Status: 401
  Error: HttpErrorResponse {...}

⚠️ Unauthorized access - logging out user
```

3. **Check Application → Local Storage**
   - Tokens should be cleared after 401

4. **Check current URL**
   - Should redirect to `/login` after 401

---

## Summary

### What Error Interceptor Does:

```
┌────────────────────────────────────────────────────────────┐
│               ERROR INTERCEPTOR BENEFITS                    │
└────────────────────────────────────────────────────────────┘

✅ Centralized Error Handling
   → All HTTP errors handled in ONE place

✅ Automatic Logout on 401
   → Token expired? Auto logout & redirect

✅ Consistent Error Messages
   → Same error messages across entire app

✅ Clean Component Code
   → Components don't need try-catch everywhere

✅ Better User Experience
   → Friendly error messages instead of technical jargon

✅ Easier Debugging
   → All errors logged in console with details

✅ Maintainable
   → Change error handling logic in one file
```

### Error Handling Flow:

```
HTTP Request
     ↓
Auth Interceptor (adds token)
     ↓
Backend API
     ↓
Error? (401, 403, 404, 500, etc.)
     ↓
Error Interceptor ⭐
     ↓
Handle error based on status code
     ↓
Component (optional specific handling)
     ↓
User sees appropriate message/redirect
```

### Key Takeaways:

1. **Error interceptors catch ALL HTTP errors** in one place
2. **They run AFTER the request** (on response)
3. **They use RxJS `catchError` operator** to handle errors
4. **They can redirect, logout, or show messages** automatically
5. **Components stay clean** - no repetitive error handling

---

**The error interceptor is your app's centralized error handler!** 🛡️

It makes your code cleaner, your error handling consistent, and your users' experience better.
