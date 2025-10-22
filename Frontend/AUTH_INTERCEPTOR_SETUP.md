# JWT Auth Interceptor Setup - Complete Implementation

## Overview

This document describes the JWT authentication interceptor implementation for the Career Route Angular frontend. The interceptor automatically attaches JWT tokens to all HTTP requests that require authentication.

## Files Created

### 1. Core Services
- **`src/app/core/services/auth.service.ts`** - Token management service
- **`src/app/core/services/auth.service.spec.ts`** - Unit tests for AuthService
- **`src/app/core/services/example-api.service.ts`** - Example usage reference

### 2. Interceptor
- **`src/app/core/interceptors/auth.interceptor.ts`** - HTTP interceptor for token attachment
- **`src/app/core/interceptors/README.md`** - Comprehensive usage documentation

### 3. Configuration
- **`src/app/app.config.ts`** - Updated to register interceptor and HTTP client

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     HTTP Request Flow                        │
└─────────────────────────────────────────────────────────────┘

Component/Service
      │
      │  http.get('/api/mentors')
      ▼
HttpClient
      │
      ▼
┌─────────────────────────────────────────────────────────────┐
│  authInterceptor                                             │
│                                                               │
│  1. Check if URL is excluded (login, register, etc.)         │
│  2. Get token from AuthService                               │
│  3. Clone request and add: Authorization: Bearer <token>     │
│  4. Pass modified request to next handler                    │
└─────────────────────────────────────────────────────────────┘
      │
      ▼
Backend API
      │
      ▼
Response returns through interceptor chain
```

## Key Features

### ✅ Automatic Token Attachment
- Automatically adds `Authorization: Bearer <token>` header to all requests
- No need to manually add headers in every service method

### ✅ Smart Exclusion
Skips token attachment for public endpoints:
- `/api/auth/login`
- `/api/auth/register`
- `/api/auth/refresh-token`
- `/api/auth/forgot-password`
- `/api/auth/reset-password`

### ✅ Functional Interceptor Pattern
Uses Angular 15+ functional interceptor pattern (`HttpInterceptorFn`)

### ✅ Token Management
`AuthService` provides:
- Token storage (localStorage)
- Token retrieval
- Token decoding (client-side)
- Expiration checking
- Authentication status

### ✅ Type Safety
Full TypeScript support with proper typing

### ✅ Testability
Includes unit tests for AuthService

## Usage

### 1. Login and Store Token

```typescript
import { AuthService } from './core/services/auth.service';

constructor(private http: HttpClient, private authService: AuthService) {}

login(email: string, password: string) {
  this.http.post('/api/auth/login', { email, password })
    .subscribe((response: any) => {
      // Store tokens
      this.authService.setToken(response.accessToken);
      this.authService.setRefreshToken(response.refreshToken);

      // Navigate to dashboard
      this.router.navigate(['/dashboard']);
    });
}
```

### 2. Make Authenticated Requests

After login, all requests automatically include the token:

```typescript
// Token is automatically attached - no manual header needed!
getMentors() {
  return this.http.get('/api/mentors'); // ✅ Token attached automatically
}

bookSession(data: any) {
  return this.http.post('/api/sessions', data); // ✅ Token attached automatically
}

updateProfile(data: any) {
  return this.http.put('/api/users/me', data); // ✅ Token attached automatically
}
```

### 3. Logout

```typescript
logout() {
  this.authService.removeTokens();
  this.router.navigate(['/login']);
}
```

### 4. Check Authentication Status

```typescript
// In route guards
canActivate(): boolean {
  if (this.authService.isAuthenticated() && !this.authService.isTokenExpired()) {
    return true;
  }
  this.router.navigate(['/login']);
  return false;
}
```

## Testing the Implementation

### Build Test
```bash
cd Frontend
npm run build
```
✅ **Status**: Build successful (verified)

### Unit Tests
```bash
cd Frontend
npm test
```

Run the AuthService tests to verify token management functionality.

### Manual Testing

1. **Login Flow**:
   ```typescript
   // Make login request
   POST /api/auth/login
   Body: { email: "user@example.com", password: "password123" }

   // Check browser console - token should be stored in localStorage
   localStorage.getItem('access_token')
   ```

2. **Authenticated Request**:
   ```typescript
   // Make any protected request
   GET /api/mentors

   // Check browser Network tab -> Headers
   // Should see: Authorization: Bearer eyJhbGc...
   ```

3. **Logout**:
   ```typescript
   // Call logout
   authService.removeTokens();

   // Verify tokens are cleared
   localStorage.getItem('access_token') // Should be null
   ```

## Integration with Backend

### Expected Token Format

The backend should return tokens in this format:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600
}
```

### Backend Validation

The backend should:
1. Extract token from `Authorization` header
2. Validate signature and expiration
3. Extract user info from token payload
4. Return 401 if token is invalid/expired

Example backend validation (ASP.NET Core):
```csharp
[Authorize] // This attribute validates the JWT token
public class MentorsController : ControllerBase
{
    [HttpGet]
    public IActionResult GetMentors()
    {
        // User.Identity.Name contains the user ID from token
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        // ...
    }
}
```

## Error Handling (Optional Enhancement)

To handle 401 errors (expired tokens), create an error interceptor:

```typescript
// src/app/core/interceptors/error.interceptor.ts
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
        // Token expired - logout and redirect
        authService.removeTokens();
        router.navigate(['/login'], {
          queryParams: { returnUrl: router.url, reason: 'session-expired' }
        });
      }
      return throwError(() => error);
    })
  );
};
```

Register in `app.config.ts`:
```typescript
provideHttpClient(
  withInterceptors([authInterceptor, errorInterceptor])
)
```

## Security Considerations

### ✅ Implemented
- Token stored in localStorage (acceptable for MVP)
- Tokens only sent to same domain
- Client-side expiration checking

### ⚠️ Production Recommendations
1. **Use HttpOnly Cookies** (requires backend support)
   - More secure than localStorage (immune to XSS)
   - Requires backend to set cookies with `HttpOnly` flag

2. **Implement Token Refresh**
   - Auto-refresh tokens before expiration
   - Prevents user session interruption

3. **HTTPS Only**
   - Always use HTTPS in production
   - Prevents token interception

4. **XSS Protection**
   - Sanitize all user inputs
   - Use Angular's built-in sanitization

5. **CSRF Protection** (if using cookies)
   - Implement CSRF tokens
   - ASP.NET Core has built-in support

## Next Steps

1. **Create Login Component**
   ```bash
   ng generate component features/auth/login
   ```

2. **Create Route Guard**
   ```bash
   ng generate guard core/guards/auth
   ```

3. **Implement Token Refresh**
   - Add refresh logic in error interceptor
   - Call refresh endpoint before token expires

4. **Add Environment Configuration**
   - Create environment files for API URL
   - Use `environment.apiUrl` instead of hardcoded URLs

5. **Create User Service**
   - Implement user-related API calls
   - Use auth interceptor automatically

## Troubleshooting

### Token Not Attached

**Problem**: Token not appearing in request headers

**Solutions**:
1. Verify token is stored: `localStorage.getItem('access_token')`
2. Check if URL is excluded in interceptor
3. Ensure `provideHttpClient` is registered in `app.config.ts`

### 401 Errors

**Problem**: All requests return 401 Unauthorized

**Solutions**:
1. Check token format on backend (expects `Bearer <token>`)
2. Verify token signature matches backend secret key
3. Check token expiration
4. Ensure backend JWT middleware is configured correctly

### CORS Errors

**Problem**: CORS errors when making requests

**Solutions**:
1. Configure backend CORS to allow frontend origin
2. Include `Authorization` header in allowed headers
3. ASP.NET Core: Update `CorsSettings` in appsettings.json

```csharp
services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", builder =>
    {
        builder.WithOrigins("http://localhost:4200")
               .AllowAnyHeader()
               .AllowAnyMethod()
               .AllowCredentials();
    });
});
```

## References

- **Interceptor Docs**: `src/app/core/interceptors/README.md`
- **Example Usage**: `src/app/core/services/example-api.service.ts`
- **Unit Tests**: `src/app/core/services/auth.service.spec.ts`
- **Angular Docs**: https://angular.dev/guide/http/interceptors

---

## Summary

✅ **Interceptor Configured**: JWT tokens automatically attached to all protected requests
✅ **AuthService Created**: Complete token management functionality
✅ **Build Verified**: No compilation errors
✅ **Tests Included**: Unit tests for AuthService
✅ **Documentation**: Comprehensive README and examples
✅ **Ready to Use**: Integration with backend API ready

The authentication interceptor is now fully functional and ready for use in your Career Route application!
