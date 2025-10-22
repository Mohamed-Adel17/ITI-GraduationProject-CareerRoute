# Quick Start Guide - JWT Auth Interceptor

## 🎯 What Problem Does This Solve?

### Before (Manual Token Handling) ❌
```typescript
// Every API call needs this boilerplate:
getMentors() {
  const token = localStorage.getItem('access_token');
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`
  });
  return this.http.get('/api/mentors', { headers });
}

bookSession(data) {
  const token = localStorage.getItem('access_token');
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`
  });
  return this.http.post('/api/sessions', data, { headers });
}
// ... repeat 100+ times across all services 😫
```

### After (With Interceptor) ✅
```typescript
// Clean, simple, automatic:
getMentors() {
  return this.http.get('/api/mentors'); // ✨ Token auto-attached!
}

bookSession(data) {
  return this.http.post('/api/sessions', data); // ✨ Token auto-attached!
}
// No repetition, works everywhere! 🎉
```

---

## 📦 What's Included

### 1. **AuthService** - Token Manager
```typescript
authService.setToken(token)        // Store token after login
authService.getToken()             // Get current token
authService.removeTokens()         // Logout (clear tokens)
authService.isAuthenticated()      // Check if logged in
authService.isTokenExpired()       // Check if token expired
```

### 2. **Auth Interceptor** - Automatic Token Attachment
- Intercepts ALL HTTP requests
- Adds `Authorization: Bearer <token>` header
- Skips public endpoints (login, register)

### 3. **Configuration** - Global Setup
- Registered in `app.config.ts`
- Works for entire application

---

## 🚀 How To Use (3 Simple Steps)

### Step 1: Login and Store Token

```typescript
import { HttpClient } from '@angular/common/http';
import { AuthService } from './core/services/auth.service';

export class LoginComponent {
  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router
  ) {}

  login(email: string, password: string) {
    this.http.post('http://localhost:5000/api/auth/login', { email, password })
      .subscribe((response: any) => {
        // Store the token
        this.authService.setToken(response.accessToken);
        this.authService.setRefreshToken(response.refreshToken);

        // Navigate to dashboard
        this.router.navigate(['/dashboard']);
      });
  }
}
```

### Step 2: Make Authenticated Requests

```typescript
export class MentorService {
  constructor(private http: HttpClient) {}

  // Token automatically attached - no manual work! ✨
  getMentors() {
    return this.http.get('http://localhost:5000/api/mentors');
  }

  getMentorById(id: number) {
    return this.http.get(`http://localhost:5000/api/mentors/${id}`);
  }

  bookSession(mentorId: number, data: any) {
    return this.http.post(`http://localhost:5000/api/sessions`, {
      mentorId,
      ...data
    });
  }
}
```

### Step 3: Logout

```typescript
export class HeaderComponent {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  logout() {
    // Clear tokens
    this.authService.removeTokens();

    // Redirect to login
    this.router.navigate(['/login']);
  }
}
```

---

## 🔍 How To Test

### Test 1: Check Token Storage

1. Run your app: `npm start`
2. Login with valid credentials
3. Open DevTools (F12) → **Application tab** → **Local Storage**
4. Look for your domain (e.g., `http://localhost:4200`)

**Expected Result:**
```
Key                Value
─────────────────  ─────────────────────────────
access_token       eyJhbGciOiJIUzI1NiIsInR5cCI6...
refresh_token      eyJhbGciOiJIUzI1NiIsInR5cCI6...
```

### Test 2: Verify Token Attachment

1. After logging in, make any API request (e.g., view mentors)
2. Open DevTools → **Network tab**
3. Find the request (e.g., GET /api/mentors)
4. Click on it → **Headers tab** → **Request Headers**

**Expected Result:**
```
Accept: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

### Test 3: Verify Login Excluded

1. Make a login request
2. Open DevTools → **Network tab**
3. Find the login request (POST /api/auth/login)
4. Click on it → **Headers tab**

**Expected Result:**
```
Authorization: (NOT PRESENT) ✅
```
Login should NOT have the Authorization header because it's in the excluded list.

### Test 4: Run Unit Tests

```bash
cd Frontend
npm test
```

**Expected Result:**
```
Chrome Headless: Executed 16 of 16 SUCCESS
TOTAL: 16 SUCCESS
```

---

## 📋 Complete Flow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                    USER JOURNEY                               │
└──────────────────────────────────────────────────────────────┘

1. USER OPENS APP
   │
   ├─→ No token in localStorage
   │   └─→ Redirect to /login
   │
2. USER LOGS IN
   │
   ├─→ Component: login(email, password)
   ├─→ HTTP: POST /api/auth/login
   ├─→ Interceptor: Skips (excluded endpoint)
   ├─→ Backend: Validates credentials
   ├─→ Backend: Returns { accessToken, refreshToken }
   ├─→ Component: authService.setToken(accessToken)
   ├─→ localStorage: Stores token
   └─→ Router: Navigate to /dashboard
   │
3. USER BROWSES MENTORS
   │
   ├─→ Component: ngOnInit() → loadMentors()
   ├─→ Service: http.get('/api/mentors')
   ├─→ Interceptor: ⭐ ADDS Authorization header ⭐
   │   │
   │   ├─→ Gets token from localStorage
   │   ├─→ Clones request
   │   ├─→ Adds header: Authorization: Bearer <token>
   │   └─→ Sends modified request
   │
   ├─→ Backend: Receives request with token
   ├─→ Backend: Validates token
   ├─→ Backend: Returns mentor list
   └─→ Component: Displays mentors
   │
4. USER BOOKS SESSION
   │
   ├─→ Component: bookSession(mentorId, data)
   ├─→ Service: http.post('/api/sessions', data)
   ├─→ Interceptor: ⭐ ADDS Authorization header ⭐
   ├─→ Backend: Validates token
   ├─→ Backend: Extracts user ID from token
   ├─→ Backend: Creates session for this user
   └─→ Component: Shows success message
   │
5. USER LOGS OUT
   │
   ├─→ Component: logout()
   ├─→ Service: authService.removeTokens()
   ├─→ localStorage: Clears tokens
   └─→ Router: Navigate to /login

┌──────────────────────────────────────────────────────────────┐
│                   INTERCEPTOR LOGIC                           │
└──────────────────────────────────────────────────────────────┘

Every HTTP Request:
   │
   ├─→ Is URL in excluded list?
   │   ├─→ YES: Skip token, send request as-is
   │   └─→ NO: Continue to next check
   │
   ├─→ Does token exist in localStorage?
   │   ├─→ NO: Send request without token
   │   └─→ YES: Clone request and add Authorization header
   │
   └─→ Send modified request to backend
```

---

## 🎓 Backend Integration

### What Your Backend Needs to Do

1. **Accept JWT Token in Header:**
```csharp
// ASP.NET Core automatically handles this with [Authorize]
[Authorize] // ← Validates token automatically
[HttpGet]
public IActionResult GetMentors()
{
    // Token is already validated
    // Get user ID from token claims
    var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

    return Ok(mentors);
}
```

2. **Return Token on Login:**
```csharp
[HttpPost("login")]
public IActionResult Login([FromBody] LoginDto dto)
{
    // Validate credentials
    var user = ValidateUser(dto.Email, dto.Password);

    if (user == null)
        return Unauthorized();

    // Generate JWT token
    var token = GenerateJwtToken(user);
    var refreshToken = GenerateRefreshToken(user);

    return Ok(new {
        accessToken = token,
        refreshToken = refreshToken,
        expiresIn = 3600 // 1 hour
    });
}
```

3. **CORS Configuration:**
```csharp
services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", builder =>
    {
        builder.WithOrigins("http://localhost:4200")
               .AllowAnyHeader() // Important: Allow Authorization header
               .AllowAnyMethod()
               .AllowCredentials();
    });
});
```

---

## ✅ Checklist - Verify Everything Works

```
□ Installation
  □ All files created in Frontend/src/app/core/
  □ app.config.ts updated with interceptor
  □ Build successful: npm run build
  □ Tests pass: npm test (16/16 SUCCESS)

□ Login Flow
  □ Login request does NOT have Authorization header
  □ Backend returns accessToken and refreshToken
  □ Tokens stored in localStorage
  □ User redirected after login

□ Authenticated Requests
  □ All requests to protected endpoints have Authorization header
  □ Header format: "Authorization: Bearer <token>"
  □ Backend successfully validates token
  □ Data returned from backend

□ Logout Flow
  □ Tokens removed from localStorage
  □ User redirected to login page
  □ Subsequent requests have NO Authorization header

□ Error Handling
  □ 401 errors handled (expired token)
  □ User redirected to login on 401
```

---

## 🆘 Troubleshooting

### Problem: Token Not Appearing in Requests

**Check:**
1. Is token stored in localStorage?
   - Open DevTools → Application → Local Storage
   - Look for `access_token`

2. Is the endpoint excluded?
   - Check `excludedUrls` in `auth.interceptor.ts`

3. Is interceptor registered?
   - Check `app.config.ts` has `provideHttpClient(withInterceptors([authInterceptor]))`

**Solution:**
```typescript
// Debug: Log in interceptor
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).getToken();
  console.log('Interceptor - URL:', req.url);
  console.log('Interceptor - Token:', token);
  // ...
};
```

### Problem: 401 Unauthorized Errors

**Possible Causes:**
1. Token expired
2. Token signature mismatch (backend secret different)
3. Token format incorrect
4. Backend not configured for JWT

**Solution:**
```typescript
// Check token expiration
const isExpired = authService.isTokenExpired();
console.log('Token expired?', isExpired);

// Check token content
const decoded = authService.getUserFromToken();
console.log('Token payload:', decoded);
```

### Problem: CORS Errors

**Cause:** Backend not allowing Authorization header

**Solution:** Update backend CORS config:
```csharp
builder.WithOrigins("http://localhost:4200")
       .AllowAnyHeader() // ← Must include this
       .AllowAnyMethod();
```

---

## 📚 Further Reading

- **Complete Documentation:** `Frontend/src/app/core/interceptors/README.md`
- **Detailed Explanation:** `Frontend/AUTH_INTERCEPTOR_EXPLANATION.md`
- **Setup Guide:** `Frontend/AUTH_INTERCEPTOR_SETUP.md`
- **Example Code:** `Frontend/src/app/core/services/example-api.service.ts`

---

## 🎉 You're Done!

The auth interceptor is now ready to use. Just:
1. Login → Store token
2. Make requests → Token auto-attached
3. Logout → Clear token

No manual header management needed! 🚀
