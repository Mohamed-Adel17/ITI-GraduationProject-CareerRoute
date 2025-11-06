# Authentication Endpoints API Contract

**Frontend Framework:** Angular 20.3.0
**Expected Backend:** ASP.NET Core 8.0 Web API
**Base URL:** `http://localhost:5000/api`

---

## Overview

All authentication endpoints are located at `/api/auth/*`. These endpoints handle user registration, login, token refresh, email verification, and password management.

## API Response Structure (ApiResponse Wrapper)

**IMPORTANT:** All authentication endpoints now return responses wrapped in a standardized `ApiResponse<T>` structure defined in `Backend/CareerRoute.API/Models/ApiResponse.cs`.

### ApiResponse Structure

```typescript
{
  "success": boolean,        // Indicates if the request was successful
  "data"?: T,                // The actual response data (only present on success)
  "message"?: string,        // User-friendly message (success or error description)
  "statusCode"?: number,     // HTTP status code (included in error responses)
  "errors"?: {               // Validation errors dictionary (field name -> error messages)
    [fieldName: string]: string[]
  }
}
```

### Success Response Format

```json
{
  "success": true,
  "data": {
    // Actual response data (LoginResponse, RegisterResponse, etc.)
  },
  "message": "Operation completed successfully"
}
```

### Error Response Format

```json
{
  "success": false,
  "message": "Operation failed",
  "statusCode": 400,
  "errors": {
    "Email": ["Email is required"],
    "Password": ["Password must be at least 8 characters"]
  }
}
```

### Frontend Handling

The Angular frontend automatically:
- **Unwraps** successful responses to extract the `data` field
- **Extracts** error messages from the `message` field
- **Parses** validation errors from the `errors` dictionary
- **Displays** user-friendly error notifications

Components receive the unwrapped data types directly (e.g., `LoginResponse`, `RegisterResponse`) without needing to access the `.data` property.

### Backend Implementation Notes

All authentication endpoints should use:
- `ApiResponse<T>` for success responses with typed data
- `ApiResponse.Error()` static method for error responses
- Consistent error format with validation errors in the `errors` dictionary

**Example Backend Response Creation:**
```csharp
// Success
return Ok(new ApiResponse<LoginResponse> {
    Success = true,
    Data = loginResponse,
    Message = "Login successful"
});

// Error
return BadRequest(ApiResponse.Error(
    "Validation failed",
    400,
    errors: validationErrors
));
```

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
- `firstName`, `lastName` (Required): minimum 2 characters
- `phoneNumber` (optional): No Validation
- `careerInterests` (optional): Array of career interests
- `careerGoals` (optional): Career goals description
- `registerAsMentor` (optional): Default false

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
  },
  "message": "Registration successful! Please check your email to verify your account."
}
```

**Note:** The frontend `AuthService` automatically unwraps this response, so components receive only the `data` object (RegisterResponse). The `success` indicator and `message` are only in the wrapper, not in the inner DTO.

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
- Send verification email with link: `http://localhost:4200/auth/verify-email?email={userEmail}&token={verificationToken}`
- Return success response (do NOT include token in response - security)

**Verification Email Link Format:**
```
http://localhost:4200/auth/verify-email?email={userEmail}&token={verificationToken}
```
Example: `http://localhost:4200/auth/verify-email?email=user@example.com&token=verify_rq6pn`

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
  "data": {
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
  },
  "message": "Login successful"
}
```

**Note:** The frontend `AuthService` automatically unwraps this response, so components receive only the `data` object (LoginResponse). The `success` indicator is only in the wrapper, not in the inner DTO.

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
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.new-token...",
    "refreshToken": "new-refresh-token-string",
    "expiresIn": 3600
  },
  "message": "Token refreshed successfully"
}
```

**Note:** The frontend `AuthService` automatically unwraps this response, so components receive only the `data` object (TokenRefreshResponse). The `success` indicator is only in the wrapper, not in the inner DTO.

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
http://localhost:4200/auth/verify-email?email={userEmail}&token={verificationToken}
```

**Example:**
```
http://localhost:4200/auth/verify-email?email=user@example.com&token=verify_rq6pn
```

**Frontend Route:** `/auth/verify-email`
- Component: `EmailVerificationComponent`
- Location: `Frontend/src/app/features/auth/email-verification/`
- Automatically extracts `email` and `token` from URL query parameters
- Calls `POST /api/auth/verify-email` endpoint automatically on page load

**Production URL Format:**
```
https://careerroute.com/auth/verify-email?email={userEmail}&token={verificationToken}
```

### API Request

**Request Body:**
```json
{
  "email": "user@example.com",
  "token": "email-verification-token"
}
```

**Field Requirements:**
- `email` (required): User's email address
- `token` (required): Verification token generated during registration

### Success Response with Auto-Login (200):
```json
{
  "success": true,
  "data": {
    "loginToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh-token-string",
    "user": {
      "id": "user-guid",
      "email": "user@example.com",
      "emailConfirmed": true,
      "roles": ["User"]
    }
  },
  "message": "Email verified successfully! Logging you in..."
}
```

**Note:** The frontend `AuthService` automatically unwraps this response, so components receive only the `data` object (EmailVerificationResponse). The `success` indicator and `message` are only in the wrapper, not in the inner DTO.


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
- Validate token matches the email address
- Update `emailConfirmed` to true
- Invalidate verification token (one-time use)
- If `autoLogin` enabled: Generate JWT tokens and return user data
- If `autoLogin` disabled: Return success without tokens

### Frontend Behavior:
- Extract `email` and `token` from URL query parameters
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
  "data": {},
  "message": "Verification email has been sent. Please check your inbox."
}
```

**Note:** The frontend `AuthService` automatically unwraps this response. The `success` indicator and `message` are only in the wrapper. The `data` object may be empty or contain additional fields in the future.

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
- Send verification email with link: `http://localhost:4200/auth/verify-email?email={userEmail}&token={newToken}`
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
  "data": {},
  "message": "If an account with that email exists, a password reset link has been sent."
}
```

**Note:** The frontend `AuthService` automatically unwraps this response. The `success` indicator and `message` are only in the wrapper. The `data` object may be empty or contain additional fields in the future.

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
  "data": {},
  "message": "Your password has been reset successfully. You can now log in."
}
```

**Note:** The frontend `AuthService` automatically unwraps this response. The `success` indicator and `message` are only in the wrapper. The `data` object may be empty or contain additional fields in the future.

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
  "data": {},
  "message": "Your password has been changed successfully."
}
```

**Note:** The frontend `AuthService` automatically unwraps this response. The `success` indicator and `message` are only in the wrapper. The `data` object may be empty or contain additional fields in the future.

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

---

## API Response Wrapper Implementation Summary

### Changes Made (January 2025)

All authentication endpoints have been updated to return responses wrapped in the standardized `ApiResponse<T>` structure:

1. **Backend Changes Required:**
   - All endpoints must return `ApiResponse<T>` for success responses
   - All endpoints must return `ApiResponse.Error()` for error responses
   - Validation errors must be included in the `errors` dictionary
   - Success messages should be included in the `message` field

2. **Frontend Implementation (COMPLETED):**
   - ✅ Created `ApiResponse<T>` model in `Frontend/src/app/shared/models/api-response.model.ts`
   - ✅ Updated `AuthService` to unwrap `ApiResponse<T>` automatically
   - ✅ Updated `errorInterceptor` to extract errors from `ApiResponse` format
   - ✅ Components receive unwrapped data types (no changes needed)
   - ✅ Full backward compatibility maintained

3. **Benefits:**
   - Consistent error handling across all endpoints
   - Standardized validation error format
   - Better error messages from backend
   - Type-safe response handling
   - Easier debugging and error tracking

4. **Testing Checklist for Backend Team:**
   - [ ] All success responses include `success: true` and `data` field
   - [ ] All error responses include `success: false`, `message`, and `statusCode`
   - [ ] Validation errors are properly formatted in the `errors` dictionary
   - [ ] HTTP status codes match the `statusCode` field in error responses
   - [ ] All authentication endpoints tested with frontend integration

### Migration Path

**For Existing Endpoints:**
1. Wrap success responses: `return Ok(new ApiResponse<T> { Success = true, Data = data })`
2. Wrap error responses: `return BadRequest(ApiResponse.Error(message, 400, errors))`
3. Test with frontend to verify unwrapping works correctly

**For New Endpoints:**
- Use `ApiResponse<T>` from the start for consistency
- Follow the same pattern as authentication endpoints

### Related Files

**Backend:**
- `Backend/CareerRoute.API/Models/ApiResponse.cs` - Response wrapper definition

**Frontend:**
- `Frontend/src/app/shared/models/api-response.model.ts` - TypeScript model
- `Frontend/src/app/core/services/auth.service.ts` - Unwrapping implementation
- `Frontend/src/app/core/interceptors/error.interceptor.ts` - Error extraction
- `Frontend/src/app/shared/models/README.md` - Model documentation
- `Frontend/src/app/core/services/README.md` - Service documentation
