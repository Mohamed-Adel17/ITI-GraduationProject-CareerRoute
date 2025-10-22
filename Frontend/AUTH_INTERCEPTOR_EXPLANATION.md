# JWT Auth Interceptor - Complete Explanation

## Table of Contents
1. [What is an HTTP Interceptor?](#what-is-an-http-interceptor)
2. [The Problem It Solves](#the-problem-it-solves)
3. [What This Implementation Adds](#what-this-implementation-adds)
4. [How It Works (Step-by-Step)](#how-it-works-step-by-step)
5. [Code Walkthrough](#code-walkthrough)
6. [Testing Guide](#testing-guide)
7. [Real-World Usage Examples](#real-world-usage-examples)

---

## What is an HTTP Interceptor?

An **HTTP Interceptor** is a middleware pattern in Angular that sits between your application code and the HTTP requests/responses going to/from the server.

### Think of it like a security checkpoint at an airport:

```
Your Code (Component/Service)
         │
         │  "I want to call the API"
         ▼
┌─────────────────────────────────┐
│   HTTP Interceptor              │
│   (Security Checkpoint)         │
│                                 │
│  - Checks outgoing requests     │
│  - Adds authentication token    │
│  - Modifies headers             │
│  - Logs requests                │
└─────────────────────────────────┘
         │
         │  Request with token attached
         ▼
    Backend API Server
         │
         │  Response
         ▼
┌─────────────────────────────────┐
│   HTTP Interceptor              │
│   (on the way back)             │
│                                 │
│  - Can modify responses         │
│  - Handle errors                │
│  - Log responses                │
└─────────────────────────────────┘
         │
         ▼
Your Code receives the response
```

---

## The Problem It Solves

### ❌ WITHOUT the Interceptor (Manual Way)

Every time you make an API call, you have to manually add the authentication token:

```typescript
// In MentorService
getMentors() {
  const token = localStorage.getItem('access_token');
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`
  });
  return this.http.get('/api/mentors', { headers });
}

// In SessionService
bookSession(data: any) {
  const token = localStorage.getItem('access_token');
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`
  });
  return this.http.post('/api/sessions', data, { headers });
}

// In UserService
getProfile() {
  const token = localStorage.getItem('access_token');
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`
  });
  return this.http.get('/api/users/me', { headers });
}

// ... and so on for EVERY API call! 😫
```

**Problems with this approach:**
- 🔴 **Repetitive** - Same code copied everywhere
- 🔴 **Error-prone** - Easy to forget in some places
- 🔴 **Hard to maintain** - If token storage changes, update 100+ places
- 🔴 **Inconsistent** - Different developers might do it differently

### ✅ WITH the Interceptor (Automatic Way)

The interceptor handles it automatically:

```typescript
// In MentorService
getMentors() {
  return this.http.get('/api/mentors'); // ✅ Token added automatically!
}

// In SessionService
bookSession(data: any) {
  return this.http.post('/api/sessions', data); // ✅ Token added automatically!
}

// In UserService
getProfile() {
  return this.http.get('/api/users/me'); // ✅ Token added automatically!
}

// Clean, simple, consistent! 😊
```

**Benefits:**
- ✅ **Write once, works everywhere**
- ✅ **No repetition**
- ✅ **Can't forget**
- ✅ **Easy to maintain**
- ✅ **Consistent across the app**

---

## What This Implementation Adds to Your Project

### 1. **AuthService** (`core/services/auth.service.ts`)

A centralized service for managing authentication tokens:

```typescript
class AuthService {
  // Store token after login
  setToken(token: string): void

  // Get token for requests
  getToken(): string | null

  // Store refresh token
  setRefreshToken(token: string): void

  // Get refresh token
  getRefreshToken(): string | null

  // Clear tokens on logout
  removeTokens(): void

  // Check if user is logged in
  isAuthenticated(): boolean

  // Check if token expired
  isTokenExpired(): boolean

  // Decode token to get user info
  getUserFromToken(): any
}
```

**Where tokens are stored:** `localStorage` (browser storage)
- Key: `access_token` → JWT token from backend
- Key: `refresh_token` → Refresh token from backend

### 2. **Auth Interceptor** (`core/interceptors/auth.interceptor.ts`)

Automatically adds `Authorization: Bearer <token>` header to all HTTP requests.

**Smart Features:**
- ✅ Only adds token if it exists
- ✅ Skips public endpoints (login, register)
- ✅ Works with all HTTP methods (GET, POST, PUT, DELETE, PATCH)
- ✅ Non-invasive (doesn't break existing code)

### 3. **Global Configuration** (`app.config.ts`)

Registers the interceptor globally so it works for the entire application:

```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([authInterceptor]) // ← Registered here
    )
  ]
};
```

### 4. **Complete Documentation**
- Usage examples
- Testing guide
- Security best practices
- Troubleshooting tips

---

## How It Works (Step-by-Step)

### Scenario: User wants to view available mentors

#### Step 1: User Logs In

```typescript
// User enters email/password in login form
loginComponent.login('john@example.com', 'password123');

// Component calls login service
this.http.post('/api/auth/login', { email, password })
  .subscribe(response => {
    // Response from backend:
    // {
    //   accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    //   refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    //   user: { id: 1, email: "john@example.com", role: "User" }
    // }

    // Store tokens in localStorage
    this.authService.setToken(response.accessToken);
    this.authService.setRefreshToken(response.refreshToken);

    // Navigate to dashboard
    this.router.navigate(['/dashboard']);
  });
```

**What happens:**
- ✅ User credentials sent to backend
- ✅ Backend validates and returns JWT token
- ✅ Token stored in localStorage
- ✅ User redirected to dashboard

#### Step 2: User Clicks "Browse Mentors"

```typescript
// Component loads
ngOnInit() {
  this.mentorService.getMentors().subscribe(mentors => {
    this.mentors = mentors;
  });
}

// Service makes HTTP call
getMentors() {
  return this.http.get('/api/mentors');
  // Notice: NO manual token handling! ✨
}
```

**What happens behind the scenes:**

```
1. Component calls getMentors()
   │
2. Service calls http.get('/api/mentors')
   │
3. Request enters HTTP pipeline
   │
4. ⭐ Auth Interceptor intercepts the request ⭐
   │
   ├── Checks: Is this endpoint excluded?
   │   Answer: No (/api/mentors is NOT in excluded list)
   │
   ├── Gets token from AuthService
   │   authService.getToken() → Returns "eyJhbGciOiJIUzI1..."
   │
   ├── Clones the request and adds header:
   │   Authorization: Bearer eyJhbGciOiJIUzI1...
   │
5. Modified request sent to backend
   │
6. Backend receives request with token
   │
   ├── Validates token signature
   ├── Checks token expiration
   ├── Extracts user ID from token
   ├── Verifies user permissions
   │
7. Backend returns list of mentors (if authorized)
   │
8. Response travels back through interceptor
   │
9. Component receives mentor list
   │
10. UI displays mentors
```

#### Step 3: User Books a Session

```typescript
// User clicks "Book Session" button
bookSession() {
  const sessionData = {
    mentorId: 5,
    startTime: '2025-10-25T14:00:00',
    duration: 60
  };

  this.sessionService.bookSession(sessionData)
    .subscribe(response => {
      alert('Session booked successfully!');
    });
}

// Service
bookSession(data: any) {
  return this.http.post('/api/sessions', data);
  // Again, NO manual token handling! ✨
}
```

**Interceptor automatically:**
- ✅ Adds `Authorization: Bearer <token>` header
- ✅ Backend knows who is making the request
- ✅ Backend can associate the session with the logged-in user

#### Step 4: User Logs Out

```typescript
logout() {
  this.authService.removeTokens(); // Clears localStorage
  this.router.navigate(['/login']);
}
```

**What happens:**
- ✅ Tokens removed from localStorage
- ✅ Subsequent requests won't have tokens
- ✅ Backend will return 401 Unauthorized
- ✅ User redirected to login

---

## Code Walkthrough

### Auth Interceptor Code Explained

```typescript
export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {

  // 1. Get AuthService instance
  const authService = inject(AuthService);

  // 2. Define endpoints that should NOT have tokens
  //    (public endpoints like login, register)
  const excludedUrls = [
    '/api/auth/login',      // Login doesn't need a token (you don't have one yet!)
    '/api/auth/register',   // Registration doesn't need a token
    '/api/auth/refresh-token',
    '/api/auth/forgot-password',
    '/api/auth/reset-password'
  ];

  // 3. Check if current request URL is in the excluded list
  const shouldExclude = excludedUrls.some(url => req.url.includes(url));

  // 4. If excluded, skip token attachment
  if (shouldExclude) {
    return next(req); // Pass request unchanged
  }

  // 5. Get token from localStorage (via AuthService)
  const token = authService.getToken();

  // 6. If no token exists, proceed without modification
  //    (User not logged in, or token expired)
  if (!token) {
    return next(req);
  }

  // 7. Clone the request and add Authorization header
  //    (We clone because HTTP requests are immutable)
  const clonedRequest = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}` // ← The magic happens here!
    }
  });

  // 8. Pass the modified request to the next handler
  return next(clonedRequest);
};
```

### AuthService Code Explained

```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  // Keys for localStorage
  private readonly TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';

  // Get token from browser storage
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  // Store token in browser storage
  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  // Clear tokens (logout)
  removeTokens(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  // Check if user has a token
  isAuthenticated(): boolean {
    return this.getToken() !== null;
  }

  // Decode JWT to extract user info
  // JWT format: header.payload.signature
  decodeToken(token: string): any {
    try {
      const payload = token.split('.')[1]; // Get middle part
      return JSON.parse(atob(payload));    // Base64 decode and parse JSON
    } catch (error) {
      return null;
    }
  }

  // Check if token has expired
  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) return true;

    // exp is in seconds, Date() expects milliseconds
    const expirationDate = new Date(decoded.exp * 1000);
    return expirationDate < new Date();
  }
}
```

---

## Testing Guide

### 1. Unit Tests (Already Included)

Run the automated tests:

```bash
cd Frontend
npm test
```

**Tests verify:**
- ✅ Token storage and retrieval
- ✅ Token removal
- ✅ Authentication status checking
- ✅ Token decoding
- ✅ Expiration detection

**Expected output:**
```
Chrome Headless: Executed 16 of 16 SUCCESS
TOTAL: 16 SUCCESS
```

### 2. Manual Testing with Browser DevTools

#### Test 1: Verify Interceptor Registration

1. Open your Angular app: `npm start`
2. Open browser DevTools (F12)
3. Go to Console tab
4. The app should load without errors

#### Test 2: Test Login Flow

1. **Prepare a mock login endpoint** (or use actual backend)

2. **Create a test login component:**

```typescript
// In any component
login() {
  this.http.post('http://localhost:5000/api/auth/login', {
    email: 'test@example.com',
    password: 'password123'
  }).subscribe(
    response => {
      console.log('Login response:', response);
      // Store token
      this.authService.setToken(response.accessToken);
    },
    error => console.error('Login failed:', error)
  );
}
```

3. **Open DevTools → Network tab**
4. **Click login button**
5. **Find the login request in Network tab**
6. **Click on it → Headers tab**

**Expected:** Should see request headers WITHOUT Authorization header (because login is excluded)

7. **Open DevTools → Application tab → Local Storage**
8. **Look for your domain**

**Expected:** Should see `access_token` key with JWT value

#### Test 3: Test Protected Request

1. **Make any API call to a protected endpoint:**

```typescript
getMentors() {
  this.http.get('http://localhost:5000/api/mentors')
    .subscribe(
      response => console.log('Mentors:', response),
      error => console.error('Error:', error)
    );
}
```

2. **Open DevTools → Network tab**
3. **Click the button to call getMentors()**
4. **Find the request in Network tab**
5. **Click on it → Headers tab → Request Headers**

**Expected:** Should see:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Visual verification:**

```
General:
  Request URL: http://localhost:5000/api/mentors
  Request Method: GET

Request Headers:
  Accept: application/json
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  ← HERE!
  Content-Type: application/json
```

#### Test 4: Test Logout

1. **Clear tokens:**

```typescript
logout() {
  this.authService.removeTokens();
  console.log('Logged out');
}
```

2. **Click logout**
3. **Open DevTools → Application → Local Storage**

**Expected:** `access_token` should be gone

4. **Try making a protected request again**
5. **Check Network tab → Headers**

**Expected:** NO Authorization header (because no token)

### 3. Integration Testing with Backend

#### Prerequisites:
- Backend API running
- Backend expects JWT token in `Authorization: Bearer <token>` format

#### Test Scenario: Complete User Flow

```typescript
// 1. Login
login() {
  this.http.post('http://localhost:5000/api/auth/login', {
    email: 'john@example.com',
    password: 'password123'
  }).subscribe(response => {
    // Store token
    this.authService.setToken(response.accessToken);

    // 2. Make authenticated request
    this.testProtectedEndpoint();
  });
}

// 3. Test protected endpoint
testProtectedEndpoint() {
  this.http.get('http://localhost:5000/api/users/me')
    .subscribe(
      response => {
        console.log('✅ Success! User data:', response);
        // Should receive user profile data
      },
      error => {
        console.error('❌ Error:', error);
        // If 401: Token invalid or expired
        // If 403: Token valid but insufficient permissions
      }
    );
}
```

**Expected Backend Behavior:**

```csharp
// Backend receives request
[Authorize] // ← Validates JWT token
[HttpGet("me")]
public IActionResult GetCurrentUser()
{
    // Token is valid, extract user ID
    var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

    // Return user data
    return Ok(new { id = userId, email = "john@example.com" });
}
```

### 4. Testing Token Expiration

#### Simulate Expired Token:

```typescript
// Create an expired token for testing
testExpiredToken() {
  // Token with exp in the past (Feb 2009)
  const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJuYW1lIjoiSm9obiBEb2UiLCJleHAiOjEyMzQ1Njc4OTB9.signature';

  this.authService.setToken(expiredToken);

  // Check expiration
  console.log('Is expired?', this.authService.isTokenExpired()); // Should be true

  // Try making request
  this.http.get('http://localhost:5000/api/mentors')
    .subscribe(
      response => console.log('Response:', response),
      error => {
        console.error('Error:', error);
        // Backend should return 401 Unauthorized
      }
    );
}
```

### 5. Visual Testing Checklist

Use this checklist for manual testing:

```
□ Login Flow
  □ Login request does NOT have Authorization header
  □ Token stored in localStorage after successful login
  □ Console shows no errors

□ Authenticated Requests
  □ All requests to /api/* have Authorization header
  □ Header format is "Bearer <token>"
  □ Backend accepts the token

□ Excluded Endpoints
  □ /api/auth/login - No token attached
  □ /api/auth/register - No token attached
  □ /api/auth/refresh-token - No token attached

□ Logout
  □ Tokens removed from localStorage
  □ Subsequent requests have NO Authorization header

□ Token Expiration
  □ Expired token detected by isTokenExpired()
  □ Backend returns 401 for expired tokens
```

---

## Real-World Usage Examples

### Example 1: Mentor Search Component

```typescript
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-mentor-search',
  template: `
    <input [(ngModel)]="searchTerm" (input)="search()">
    <div *ngFor="let mentor of mentors">
      {{ mentor.name }} - {{ mentor.specialization }}
    </div>
  `
})
export class MentorSearchComponent implements OnInit {
  mentors: any[] = [];
  searchTerm = '';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadMentors();
  }

  loadMentors() {
    // Token automatically attached by interceptor! ✨
    this.http.get<any[]>('http://localhost:5000/api/mentors')
      .subscribe(mentors => {
        this.mentors = mentors;
      });
  }

  search() {
    // Token automatically attached! ✨
    this.http.get<any[]>(`http://localhost:5000/api/mentors/search?q=${this.searchTerm}`)
      .subscribe(mentors => {
        this.mentors = mentors;
      });
  }
}
```

### Example 2: Session Booking Component

```typescript
import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-book-session',
  template: `
    <button (click)="bookSession()">Book Session</button>
  `
})
export class BookSessionComponent {
  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  bookSession() {
    const sessionData = {
      mentorId: 5,
      startTime: '2025-10-25T14:00:00',
      duration: 60
    };

    // Token automatically attached! ✨
    // Backend will know WHO is booking (from token)
    this.http.post('http://localhost:5000/api/sessions', sessionData)
      .subscribe(
        response => {
          alert('Session booked successfully!');
        },
        error => {
          if (error.status === 401) {
            // Token expired or invalid
            alert('Please login again');
            this.authService.removeTokens();
            // Redirect to login
          }
        }
      );
  }
}
```

### Example 3: Route Guard (Protect Routes)

```typescript
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if user is authenticated
  if (authService.isAuthenticated() && !authService.isTokenExpired()) {
    return true; // Allow access
  }

  // Not authenticated - redirect to login
  router.navigate(['/login']);
  return false;
};

// Use in routes
const routes: Routes = [
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard] // ← Protected route
  },
  {
    path: 'mentors',
    component: MentorsComponent,
    canActivate: [authGuard] // ← Protected route
  }
];
```

---

## Summary

### What You Built:
✅ **Automatic token attachment** to all HTTP requests
✅ **Centralized token management** (AuthService)
✅ **Smart exclusion** of public endpoints
✅ **Type-safe** TypeScript implementation
✅ **Well-tested** with 16 unit tests passing
✅ **Well-documented** with examples and guides

### What It Does For Your Project:
✅ Eliminates repetitive code
✅ Prevents security bugs (forgotten tokens)
✅ Makes backend integration seamless
✅ Improves developer experience
✅ Ensures consistent authentication across the app

### How To Use It:
1. Login → Store token with `authService.setToken()`
2. Make any HTTP request → Token automatically attached
3. Logout → Clear token with `authService.removeTokens()`

That's it! The interceptor handles everything else automatically. 🎉
