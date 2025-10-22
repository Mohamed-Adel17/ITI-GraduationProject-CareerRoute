# Auth Interceptor

## Overview

The `authInterceptor` automatically attaches JWT tokens to all outgoing HTTP requests, eliminating the need to manually add Authorization headers in every service.

## How It Works

1. The interceptor is registered globally in `app.config.ts`
2. For each HTTP request, it checks if a token exists in localStorage
3. If a token exists and the endpoint is not excluded, it adds the `Authorization: Bearer <token>` header
4. The modified request is then sent to the backend

## Excluded Endpoints

The following endpoints do NOT receive the token (to prevent errors on public endpoints):
- `/api/auth/login`
- `/api/auth/register`
- `/api/auth/refresh-token`
- `/api/auth/forgot-password`
- `/api/auth/reset-password`

## Usage Example

### 1. Login and Store Token

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AuthService } from '../core/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  private apiUrl = 'http://localhost:5000/api';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/login`, { email, password })
      .pipe(
        tap((response: any) => {
          // Store tokens after successful login
          this.authService.setToken(response.accessToken);
          this.authService.setRefreshToken(response.refreshToken);
        })
      );
  }
}
```

### 2. Make Authenticated Requests

After login, all subsequent requests automatically include the token:

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MentorService {
  private apiUrl = 'http://localhost:5000/api';

  constructor(private http: HttpClient) {}

  // Token is automatically attached by the interceptor
  getMentors(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/mentors`);
  }

  // No need to manually add Authorization header
  getMentorById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/mentors/${id}`);
  }

  // Works for POST, PUT, DELETE too
  updateMentorProfile(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/mentors/${id}`, data);
  }
}
```

### 3. Logout

```typescript
logout(): void {
  this.authService.removeTokens();
  // Redirect to login page
  this.router.navigate(['/login']);
}
```

## AuthService Methods

The `AuthService` provides convenient methods for token management:

### Token Management
- `getToken()`: Retrieve the access token
- `getRefreshToken()`: Retrieve the refresh token
- `setToken(token: string)`: Store the access token
- `setRefreshToken(token: string)`: Store the refresh token
- `removeTokens()`: Clear all tokens (logout)

### Authentication Status
- `isAuthenticated()`: Check if user has a token
- `isTokenExpired()`: Check if the token is expired (client-side only)

### Token Utilities
- `decodeToken(token: string)`: Decode JWT payload (client-side, not verified)
- `getUserFromToken()`: Extract user info from stored token

## Error Handling

To handle 401 (Unauthorized) errors when tokens expire, create an error interceptor:

```typescript
// core/interceptors/error.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error) => {
      if (error.status === 401) {
        // Token expired or invalid - logout and redirect
        authService.removeTokens();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
```

Then register it in `app.config.ts`:

```typescript
import { errorInterceptor } from './core/interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    // ...
    provideHttpClient(
      withInterceptors([authInterceptor, errorInterceptor])
    )
  ]
};
```

## Environment Configuration

For production, use Angular environment files:

```typescript
// src/environments/environment.ts (development)
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000/api'
};

// src/environments/environment.prod.ts (production)
export const environment = {
  production: true,
  apiUrl: 'https://api.careerroute.com/api'
};
```

Then use in services:

```typescript
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MentorService {
  private apiUrl = environment.apiUrl;
  // ...
}
```

## Security Notes

1. **Token Storage**: Currently using `localStorage`. For enhanced security, consider using `httpOnly` cookies (requires backend support)
2. **Token Expiration**: The `isTokenExpired()` method is a client-side check only. The backend must validate all tokens
3. **HTTPS**: Always use HTTPS in production to prevent token interception
4. **XSS Protection**: Sanitize all user inputs to prevent token theft via XSS attacks
5. **Token Refresh**: Implement token refresh logic before tokens expire to maintain user sessions

## Testing

To test the interceptor:

```typescript
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';

describe('AuthInterceptor', () => {
  let httpMock: HttpTestingController;
  let authService: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting()
      ]
    });

    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);
  });

  it('should add Authorization header when token exists', () => {
    authService.setToken('test-token');

    // Make a request
    // Verify Authorization header is present
  });

  it('should not add Authorization header for excluded URLs', () => {
    authService.setToken('test-token');

    // Make request to /api/auth/login
    // Verify Authorization header is NOT present
  });
});
```
