# Authentication Endpoints API Contract

**Frontend Framework:** Angular 20.3.0
**Expected Backend:** ASP.NET Core 8.0 Web API
**Base URL:** `http://localhost:5000/api`

---

## Overview

All authentication endpoints are located at `/api/auth/*`. These endpoints handle user registration, login, token refresh, email verification, and password management.

---

## 1. User Registration

**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890",
  "careerInterests": ["Software Development", "Cloud Computing"],
  "careerGoals": "Become a Solutions Architect",
  "registerAsMentor": false
}
```

**Field Requirements:**
- `email` (required): Valid email format
- `password` (required): Min 8 chars, uppercase, lowercase, number
- `confirmPassword` (required): Must match password
- `firstName`, `lastName` (optional): User's name
- `phoneNumber` (optional): User's phone
- `careerInterests` (optional): Array of career interests
- `careerGoals` (optional): Career goals description
- `registerAsMentor` (optional): Default false

**Success Response (201):**
```json
{
  "success": true,
  "message": "Registration successful! Please check your email to verify your account.",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "requiresEmailVerification": true
}
```

**Error Responses:**
- **400 Validation Failed:**
  ```json
  {
    "success": false,
    "message": "Validation failed",
    "errors": {
      "Email": ["Email is required"],
      "Password": ["Password must be at least 8 characters"]
    },
    "statusCode": 400
  }
  ```

- **409 Conflict (Email Exists):**
  ```json
  {
    "success": false,
    "message": "Email already registered",
    "errors": { "Email": ["Email is already in use"] },
    "statusCode": 409
  }
  ```

**Backend Behavior:**
- Validate email format and password strength
- Check if email already exists (return 409)
- Hash password before storing
- Set `emailConfirmed` to false
- Generate unique email verification token (24-48 hour expiration)
- Send verification email with link: `http://localhost:4200/auth/verify-email?userId={userId}&token={verificationToken}`
- Return success response (do NOT include token in response - security)

**Verification Email Link Format:**
```
http://localhost:4200/auth/verify-email?userId={userId}&token={verificationToken}
```
Example: `http://localhost:4200/auth/verify-email?userId=e27e53&token=verify_rq6pn`

See [Section 4: Email Verification](#4-email-verification) for complete email template and verification flow details

---

## 2. User Login

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "rememberMe": true
}
```

**Success Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "refresh-token-string",
  "expiresIn": 3600,
  "tokenType": "Bearer",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "emailConfirmed": true,
    "roles": ["User"],
    "isMentor": false,
    "mentorId": null,
    "profilePictureUrl": "https://example.com/profile.jpg"
  }
}
```

**Error Responses:**
- **401 Invalid Credentials:**
  ```json
  {
    "success": false,
    "message": "Invalid email or password",
    "statusCode": 401
  }
  ```

- **403 Email Not Verified:**
  ```json
  {
    "success": false,
    "message": "Please verify your email address before logging in.",
    "statusCode": 403,
    "errors": { "EmailConfirmed": ["Email address not verified"] }
  }
  ```

**Backend Behavior:**
- Validate credentials
- Check if `emailConfirmed === true` (return 403 if false)
- Generate JWT with required claims (see JWT Token Structure section)
- Generate refresh token
- Token expiration: `rememberMe: true` → 7 days, `false` → 1 hour
- Update `lastLoginDate`
- Implement rate limiting to prevent brute force

---

## 3. Token Refresh

**Endpoint:** `POST /api/auth/refresh`

**Request Body:**
```json
{
  "token": "current-access-token",
  "refreshToken": "current-refresh-token"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.new-token...",
  "refreshToken": "new-refresh-token-string",
  "expiresIn": 3600
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Invalid or expired refresh token. Please log in again.",
  "statusCode": 401
}
```

**Backend Behavior:**
- Accept expired access tokens
- Validate refresh token is not expired/revoked
- Extract user ID and fetch latest user data
- Generate new JWT and refresh token (token rotation)
- Invalidate old refresh token
- Frontend auto-refreshes 5 minutes before expiration

---

## 4. Email Verification

**Endpoint:** `POST /api/auth/verify-email`

### Email Verification Link Format

**Email Link Sent to User:**
```
http://localhost:4200/auth/verify-email?userId={userId}&token={verificationToken}
```

**Example:**
```
http://localhost:4200/auth/verify-email?userId=e27e53&token=verify_rq6pn
```

**Frontend Route:** `/auth/verify-email`
- Component: `EmailVerificationComponent`
- Location: `Frontend/src/app/features/auth/email-verification/`
- Automatically extracts `userId` and `token` from URL query parameters
- Calls `POST /api/auth/verify-email` endpoint automatically on page load

**Production URL Format:**
```
https://careerroute.com/auth/verify-email?userId={userId}&token={verificationToken}
```

### API Request

**Request Body:**
```json
{
  "userId": "user-guid",
  "token": "email-verification-token"
}
```

**Field Requirements:**
- `userId` (required): User's GUID from registration
- `token` (required): Verification token generated during registration

### Success Response with Auto-Login (200):
```json
{
  "success": true,
  "message": "Email verified successfully! Logging you in...",
  "autoLogin": true,
  "loginToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "refresh-token-string",
  "user": {
    "id": "user-guid",
    "email": "user@example.com",
    "emailConfirmed": true,
    "roles": ["User"]
  }
}
```

### Success Response without Auto-Login (200):
```json
{
  "success": true,
  "message": "Email verified successfully! You can now log in.",
  "autoLogin": false,
  "loginToken": null,
  "refreshToken": null,
  "user": null
}
```

### Error Response (400):
```json
{
  "success": false,
  "message": "Invalid or expired verification link",
  "statusCode": 400
}
```

### Backend Behavior:
- Validate token is not expired (recommend 24-48 hour expiration)
- Validate token matches the userId
- Update `emailConfirmed` to true
- Invalidate verification token (one-time use)
- If `autoLogin` enabled: Generate JWT tokens and return user data
- If `autoLogin` disabled: Return success without tokens

### Frontend Behavior:
- Extract `userId` and `token` from URL query parameters
- Automatically call API on component load
- Show loading spinner during verification
- On success with `autoLogin: true`:
  - Store tokens in localStorage
  - Update auth state
  - Redirect to `/user/dashboard` after 3 seconds
- On success with `autoLogin: false`:
  - Redirect to `/auth/login` after 3 seconds
- On error:
  - Display error message
  - Offer option to resend verification email

### Email Template Requirements:

**Email Subject:** "Verify Your Email - CareerRoute"

**Email Body Example:**
```
Hi {firstName},

Thank you for registering with CareerRoute!

Please verify your email address by clicking the link below:

{verificationLink}

This link will expire in 48 hours.

If you did not create an account, please ignore this email.

Best regards,
CareerRoute Team
```

**Backend Must Include:**
- User's first name for personalization
- Full verification link (frontend URL + query parameters)
- Link expiration time
- Sender: `noreply@careerroute.com` or configured email

---

## 5. Resend Email Verification

**Endpoint:** `POST /api/auth/resend-verification`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Verification email has been sent. Please check your inbox."
}
```

**Error Responses:**
- **400 Already Verified:**
  ```json
  {
    "success": false,
    "message": "Email address is already verified",
    "statusCode": 400
  }
  ```

- **429 Too Many Requests:**
  ```json
  {
    "success": false,
    "message": "Please wait before requesting another verification email",
    "statusCode": 429
  }
  ```

**Backend Behavior:**
- Check if email already verified (return 400)
- Rate limit: Max 1 request per 5 minutes per email
- Invalidate previous verification token
- Generate new verification token
- Send verification email with link: `http://localhost:4200/auth/verify-email?userId={userId}&token={newToken}`
- Return success even if email doesn't exist (security - prevent email enumeration)

**Note:** Uses same email verification link format as registration (see Section 4 for details)

---

## 6. Forgot Password

**Endpoint:** `POST /api/auth/forgot-password`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "If an account with that email exists, a password reset link has been sent."
}
```

**Error Response (429):**
```json
{
  "success": false,
  "message": "Too many password reset requests. Please try again later.",
  "statusCode": 429
}
```

**Backend Behavior:**
- Rate limit: Max 3 requests per hour per IP/email
- Generate reset token (1-2 hour expiration)
- Send email with reset link: `/auth/reset-password?email=user@example.com&token=abc123`
- Return same response regardless of email existence (security)

---

## 7. Reset Password

**Endpoint:** `POST /api/auth/reset-password`

**Request Body:**
```json
{
  "email": "user@example.com",
  "token": "password-reset-token",
  "newPassword": "NewSecurePass123!",
  "confirmPassword": "NewSecurePass123!"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Your password has been reset successfully. You can now log in."
}
```

**Error Responses:**
- **400 Invalid/Expired Token:**
  ```json
  {
    "success": false,
    "message": "Invalid or expired password reset link.",
    "statusCode": 400
  }
  ```

- **400 Validation Failed:**
  ```json
  {
    "success": false,
    "message": "Password validation failed",
    "errors": {
      "NewPassword": ["Password must be at least 8 characters"],
      "ConfirmPassword": ["Passwords do not match"]
    },
    "statusCode": 400
  }
  ```

**Backend Behavior:**
- Validate token is not expired
- Validate password requirements
- Hash new password
- Invalidate reset token
- Invalidate all refresh tokens (force re-login)
- Optionally send confirmation email

---

## 8. Change Password (Authenticated)

**Endpoint:** `POST /api/auth/change-password`
**Requires:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass123!",
  "confirmPassword": "NewPass123!"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Your password has been changed successfully."
}
```

**Error Responses:**
- **400 Current Password Incorrect:**
  ```json
  {
    "success": false,
    "message": "Current password is incorrect",
    "errors": { "CurrentPassword": ["The current password is incorrect"] },
    "statusCode": 400
  }
  ```

- **400 Same Password:**
  ```json
  {
    "success": false,
    "message": "New password must be different from current password",
    "statusCode": 400
  }
  ```

**Backend Behavior:**
- Extract user ID from JWT
- Verify current password
- Validate new password requirements
- Hash new password
- Update password in database
- Optionally invalidate all refresh tokens except current
- Send confirmation email

---

## JWT Token Structure

The JWT token must include the following claims:

```typescript
{
  // Standard Claims
  "sub": "user-guid",              // User ID
  "email": "user@example.com",
  "iat": 1699999999,               // Issued at
  "exp": 1700003599,               // Expiration
  "iss": "CareerRoute",
  "aud": "CareerRoute-Users",

  // OpenID Connect Claims
  "given_name": "John",
  "family_name": "Doe",
  "email_verified": true,
  "picture": "url-to-profile-pic",

  // Custom Claims
  "role": "User",                  // String or Array: ["User", "Mentor"]
  "is_mentor": false,
  "mentor_id": null
}
```

**Important:** The `role` claim can be:
- String (single role): `"role": "User"`
- Array (multiple roles): `"role": ["User", "Mentor"]`

Frontend handles both formats automatically.

**Token Expiration:**
- Access Token: 1 hour (3600 seconds)
- Refresh Token: 7 days
- Frontend auto-refreshes 5 minutes before expiration

---

## Security Considerations

### Rate Limiting
- Login: Prevent brute force attacks
- Password reset: Max 3 per hour
- Email verification: Max 1 per 5 minutes

### Token Security
- Use cryptographically secure random tokens
- Implement refresh token rotation (one-time use)
- Invalidate old tokens after use
- Store refresh tokens in database with expiration

### Error Messages
- Don't reveal if email exists (registration, password reset)
- Use generic messages for invalid credentials
- Log all authentication attempts

### CORS Configuration
```csharp
builder.WithOrigins("http://localhost:4200")
       .AllowAnyMethod()
       .AllowAnyHeader()
       .AllowCredentials();
```

---

## Frontend Token Storage

**Keys used:**
- `career_route_token` (access token)
- `career_route_refresh_token` (refresh token)

**Storage:** localStorage (consider httpOnly cookies for production)

**Auto-Refresh:** Frontend triggers refresh 5 minutes before expiration
