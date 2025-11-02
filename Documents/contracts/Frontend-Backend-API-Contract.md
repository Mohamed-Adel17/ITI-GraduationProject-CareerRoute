# Frontend-Backend API Contract
**Frontend Implementation Status:** Tasks T061, T062, T063, T064 Completed
**Date:** 2025-10-29
**Frontend Framework:** Angular 20.3.0
**Expected Backend:** ASP.NET Core 8.0 Web API

---

## 📋 Table of Contents
1. [API Base URL Configuration](#api-base-url-configuration)
2. [Authentication Endpoints (T057)](#authentication-endpoints-t057)
3. [User Profile Endpoints (T058)](#user-profile-endpoints-t058)
4. [Mentor Profile Endpoints (T059)](#mentor-profile-endpoints-t059)
5. [JWT Token Structure](#jwt-token-structure)
6. [Request/Response DTOs](#requestresponse-dtos)
7. [Error Response Format](#error-response-format)
8. [CORS Configuration](#cors-configuration)
9. [User & Mentor Models](#user--mentor-models)
10. [Category Endpoints](#category-endpoints)

---

## 1. API Base URL Configuration

### Current Frontend Configuration
```typescript
// Frontend/src/environments/environment.development.ts
apiUrl: 'http://localhost:5000/api'

// All auth endpoints will call:
// http://localhost:5000/api/auth/{endpoint}
```

### Backend Requirements
✅ Backend API should run on: `http://localhost:5000` (development)
✅ All endpoints should be prefixed with: `/api`
✅ Auth controller should be at: `/api/auth`

---

## 2. Authentication Endpoints

### 2.1 User Registration
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
  "careerInterests": "Software Development, Cloud Computing",
  "careerGoals": "Become a Solutions Architect",
  "registerAsMentor": false
}
```

**Field Requirements:**
- `email` (string, required): Valid email format
- `password` (string, required): Minimum 8 characters, at least one uppercase, one lowercase, one number
- `confirmPassword` (string, required): Must match password
- `firstName` (string, optional): User's first name (can be empty, defaults to empty string)
- `lastName` (string, optional): User's last name (can be empty, defaults to empty string)
- `phoneNumber` (string, optional): User's phone number
- `careerInterests` (string, optional): User's career interests
- `careerGoals` (string, optional): User's career goals
- `registerAsMentor` (boolean, optional): Whether user wants to register as a mentor (default: false)

**Response (Success - 201 Created):**
```json
{
  "success": true,
  "message": "Registration successful! Please check your email to verify your account.",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "requiresEmailVerification": true
}
```

**Response (Error - 400 Validation Failed):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "Email": ["Email is required", "Email format is invalid"],
    "Password": ["Password must be at least 8 characters", "Password must contain at least one uppercase letter"],
    "ConfirmPassword": ["Passwords do not match"]
  },
  "statusCode": 400
}
```

**Response (Error - 409 Conflict - Email Already Exists):**
```json
{
  "success": false,
  "message": "Email already registered",
  "errors": {
    "Email": ["Email is already in use"]
  },
  "statusCode": 409
}
```

**Expected Backend Behavior:**
- Endpoint: `POST /api/auth/register`
- Backend should:
  - Validate all required fields (email, password, confirmPassword)
  - Check if email already exists in database (return 409 if exists)
  - Validate password strength (min 8 chars, uppercase, lowercase, number)
  - Validate password and confirmPassword match
  - Hash the password before storing
  - Create new user record with provided information
  - Set `emailConfirmed` to `false` initially
  - Generate unique email verification token
  - Store verification token with expiration (recommend 24-48 hours)
  - Send verification email with link: `/auth/verify-email?userId={userId}&token={verificationToken}`
  - Return success response with userId and email
  - Do NOT send verification token in response (security - only via email)

**Note:** The frontend currently sends minimal data (email, password, registerAsMentor) as firstName and lastName are commented out in the component. Backend should handle both cases - with or without firstName/lastName.

---

### 2.2 User Login
**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "rememberMe": true
}
```

**Field Requirements:**
- `email` (string, required): User's email address
- `password` (string, required): User's password
- `rememberMe` (boolean, optional): Extend token expiration if true (default: false)

**Response (Success - 200):**
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

**Response (Error - 401 Unauthorized - Invalid Credentials):**
```json
{
  "success": false,
  "message": "Invalid email or password",
  "statusCode": 401
}
```

**Response (Error - 403 Forbidden - Email Not Verified):**
```json
{
  "success": false,
  "message": "Please verify your email address before logging in. Check your inbox for the verification link.",
  "statusCode": 403,
  "errors": {
    "EmailConfirmed": ["Email address not verified"]
  }
}
```

**Response (Error - 403 Forbidden - Account Locked/Disabled):**
```json
{
  "success": false,
  "message": "Your account has been disabled. Please contact support.",
  "statusCode": 403
}
```

**Expected Backend Behavior:**
- Endpoint: `POST /api/auth/login`
- Backend should:
  - Validate email and password are provided
  - Find user by email in database
  - Verify password hash matches
  - **Check if email is verified (`emailConfirmed === true`):**
    - If not verified, return 403 with appropriate message
    - Include option to resend verification email
  - Check if account is active/not disabled
  - Generate JWT access token with all required claims (see Section 5)
  - Generate refresh token for token rotation
  - Set token expiration based on `rememberMe`:
    - `rememberMe: true` → Longer expiration (e.g., 7 days)
    - `rememberMe: false` → Standard expiration (e.g., 1 hour)
  - Update user's `lastLoginDate` in database
  - Return tokens and user data
  - Log successful login for security auditing

**Security Considerations:**
- Use generic error message for invalid credentials (don't reveal if email exists)
- Implement rate limiting to prevent brute force attacks
- Consider implementing account lockout after N failed attempts
- Log failed login attempts for security monitoring

---

### 2.3 Token Refresh
**Endpoint:** `POST /api/auth/refresh`

**Request Body:**
```json
{
  "token": "current-access-token",
  "refreshToken": "current-refresh-token"
}
```

**Field Requirements:**
- `token` (string, required): Current JWT access token (can be expired)
- `refreshToken` (string, required): Current refresh token (must be valid)

**Response (Success - 200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.new-token...",
  "refreshToken": "new-refresh-token-string",
  "expiresIn": 3600
}
```

**Response (Error - 401 Unauthorized - Invalid Refresh Token):**
```json
{
  "success": false,
  "message": "Invalid or expired refresh token. Please log in again.",
  "statusCode": 401
}
```

**Response (Error - 401 Unauthorized - Token Mismatch):**
```json
{
  "success": false,
  "message": "Token validation failed",
  "statusCode": 401
}
```

**Expected Backend Behavior:**
- Endpoint: `POST /api/auth/refresh`
- Backend should:
  - **Accept expired access tokens** (frontend refreshes before/after expiration)
  - Validate refresh token exists and is not expired
  - Validate refresh token matches the user from access token
  - Verify refresh token hasn't been revoked/used (if implementing token rotation)
  - Extract user ID from the old access token
  - Fetch latest user data from database (roles may have changed)
  - Generate new JWT access token with updated user data
  - Generate new refresh token (implement refresh token rotation)
  - **Invalidate old refresh token** (mark as used/revoked)
  - Store new refresh token in database with expiration
  - Return new tokens with expiration time
  - Log token refresh for security auditing

**Token Rotation Security:**
- Implement refresh token rotation (one-time use tokens)
- Revoke old refresh token when new one is issued
- Detect refresh token reuse attacks (if old token used again, revoke all user's tokens)
- Store refresh tokens in database with expiration timestamps
- Clean up expired tokens periodically

**Frontend Auto-Refresh:**
- Frontend automatically refreshes tokens **5 minutes before expiration**
- Frontend uses timer based on `expiresIn` value from login/refresh response
- If refresh fails (401), frontend logs user out automatically

---

### 2.4 Email Verification
**Endpoint:** `POST /api/auth/verify-email`

**Request Body:**
```json
{
  "userId": "user-guid",
  "token": "email-verification-token"
}
```

**Response (Success - 200, Auto-Login Enabled):**
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
    "firstName": "John",
    "lastName": "Doe",
    "emailConfirmed": true,
    "roles": ["User"],
    "isMentor": false
  }
}
```

**Response (Success - 200, Auto-Login Disabled):**
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

**Response (Error - 400 Invalid/Expired Token):**
```json
{
  "success": false,
  "message": "Invalid or expired verification link",
  "statusCode": 400
}
```

**Expected Backend Behavior:**
- Endpoint: `POST /api/auth/verify-email`
- Request body: `{ "userId": "user-guid", "token": "verification-token" }`
- Backend should:
  - Validate token exists and is not expired
  - Validate token matches the userId
  - Update user's `emailConfirmed` field to `true`
  - Invalidate the verification token (mark as used/delete)
  - **Option 1 - Auto-Login (Recommended):**
    - Generate JWT access token and refresh token
    - Return `autoLogin: true` with tokens and user data
    - Frontend automatically logs user in after verification
  - **Option 2 - Manual Login:**
    - Return `autoLogin: false` with null tokens
    - User must manually navigate to login page
  - Return appropriate success/error response

**Note:** The `autoLogin` feature provides better UX by automatically logging the user in after email verification, eliminating the need for them to manually enter credentials again.

---

### 2.5 Resend Email Verification
**Endpoint:** `POST /api/auth/resend-verification`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Field Requirements:**
- `email` (string, required): User's email address

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Verification email has been sent. Please check your inbox."
}
```

**Response (Error - 400 Email Already Verified):**
```json
{
  "success": false,
  "message": "Email address is already verified",
  "statusCode": 400
}
```

**Response (Error - 429 Too Many Requests):**
```json
{
  "success": false,
  "message": "Please wait before requesting another verification email",
  "statusCode": 429
}
```

**Expected Backend Behavior:**
- Endpoint: `POST /api/auth/resend-verification`
- Backend should:
  - Find user by email
  - Check if email is already verified (return 400 if already verified)
  - Check rate limiting (e.g., max 1 request per 5 minutes per email)
  - Invalidate previous verification token
  - Generate new verification token with expiration
  - Send new verification email with link
  - Return success response **even if email doesn't exist** (security best practice)
  - Log resend attempts for monitoring

**Rate Limiting:**
- Limit to 1 resend per 5 minutes per email address
- Prevent spam and abuse
- Return 429 status code if rate limit exceeded

---

### 2.6 Forgot Password (Initiate Reset)
**Endpoint:** `POST /api/auth/forgot-password`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Field Requirements:**
- `email` (string, required): User's email address

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "If an account with that email exists, a password reset link has been sent. Please check your inbox."
}
```

**Response (Error - 400 Validation Failed):**
```json
{
  "success": false,
  "message": "Invalid email format",
  "errors": {
    "Email": ["Please enter a valid email address"]
  },
  "statusCode": 400
}
```

**Response (Error - 429 Too Many Requests):**
```json
{
  "success": false,
  "message": "Too many password reset requests. Please try again later.",
  "statusCode": 429
}
```

**Expected Backend Behavior:**
- Endpoint: `POST /api/auth/forgot-password`
- Request body: `{ "email": "user@example.com" }`
- Backend should:
  - Validate email format
  - Check rate limiting (e.g., max 3 requests per hour per IP/email)
  - Find user by email in database
  - **If user exists:**
    - Generate unique, time-limited reset token (recommend 1-2 hour expiration)
    - Store token in database with email association and expiration timestamp
    - Invalidate any previous unused reset tokens for this email
    - Send email containing reset link: `/auth/reset-password?email=user@example.com&token=abc123xyz`
  - **If user doesn't exist:**
    - Do nothing (don't send email)
  - Return **same success response regardless** (security best practice to prevent email enumeration)
  - Log reset attempts for security monitoring

**Security Considerations:**
- Always return the same success message (don't reveal if email exists)
- Implement rate limiting to prevent abuse
- Use cryptographically secure random tokens
- Set short expiration time (1-2 hours maximum)
- Invalidate token after successful password reset
- Log all reset attempts with timestamp and IP address

---

### 2.7 Reset Password (Complete Reset)
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

**Field Requirements:**
- `email` (string, required): User's email address from reset link
- `token` (string, required): Password reset token from email link
- `newPassword` (string, required): New password (min 8 chars, uppercase, lowercase, number)
- `confirmPassword` (string, required): Must match newPassword

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Your password has been reset successfully. You can now log in with your new password."
}
```

**Response (Error - 400 Invalid/Expired Token):**
```json
{
  "success": false,
  "message": "Invalid or expired password reset link. Please request a new password reset.",
  "statusCode": 400
}
```

**Response (Error - 400 Validation Failed):**
```json
{
  "success": false,
  "message": "Password validation failed",
  "errors": {
    "NewPassword": ["Password must be at least 8 characters", "Password must contain at least one uppercase letter"],
    "ConfirmPassword": ["Passwords do not match"]
  },
  "statusCode": 400
}
```

**Response (Error - 400 Token/Email Mismatch):**
```json
{
  "success": false,
  "message": "Invalid password reset request",
  "statusCode": 400
}
```

**Expected Backend Behavior:**
- Endpoint: `POST /api/auth/reset-password`
- Request body:
  ```json
  {
    "email": "user@example.com",
    "token": "abc123xyz",
    "newPassword": "NewSecurePass123!",
    "confirmPassword": "NewSecurePass123!"
  }
  ```
- Backend should:
  - Validate all required fields are provided
  - Find reset token in database by token and email
  - Validate token exists and is not expired (check expiration timestamp)
  - Validate token matches the email
  - Validate newPassword meets security requirements (min 8 chars, complexity)
  - Validate newPassword === confirmPassword
  - Prevent password reuse (optional: check against previous N passwords)
  - Hash the new password using strong hashing algorithm
  - Update user's password in database
  - **Invalidate the reset token** (mark as used or delete)
  - Invalidate all existing refresh tokens for this user (force re-login)
  - Log successful password reset for security auditing
  - Optionally send confirmation email to user
  - Return success response

**Security Considerations:**
- Use same error message for all validation failures (don't reveal specific issues)
- Invalidate token immediately after use (one-time use)
- Consider invalidating all active sessions after password reset
- Log password reset completion with timestamp and IP
- Optionally notify user via email that password was changed

---

### 2.8 Change Password (Logged-in User)
**Endpoint:** `POST /api/auth/change-password`

**Headers:**
```
Authorization: Bearer {access-token}
```

**Request Body:**
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass123!",
  "confirmPassword": "NewPass123!"
}
```

**Field Requirements:**
- `currentPassword` (string, required): User's current password for verification
- `newPassword` (string, required): New password (min 8 chars, uppercase, lowercase, number)
- `confirmPassword` (string, required): Must match newPassword

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Your password has been changed successfully."
}
```

**Response (Error - 400 Current Password Incorrect):**
```json
{
  "success": false,
  "message": "Current password is incorrect",
  "errors": {
    "CurrentPassword": ["The current password you entered is incorrect"]
  },
  "statusCode": 400
}
```

**Response (Error - 400 Validation Failed):**
```json
{
  "success": false,
  "message": "Password validation failed",
  "errors": {
    "NewPassword": ["Password must be at least 8 characters", "Password must contain at least one number"],
    "ConfirmPassword": ["Passwords do not match"]
  },
  "statusCode": 400
}
```

**Response (Error - 400 Same as Current Password):**
```json
{
  "success": false,
  "message": "New password must be different from current password",
  "errors": {
    "NewPassword": ["New password cannot be the same as current password"]
  },
  "statusCode": 400
}
```

**Response (Error - 401 Unauthorized):**
```json
{
  "success": false,
  "message": "Unauthorized access",
  "statusCode": 401
}
```

**Expected Backend Behavior:**
- Endpoint: `POST /api/auth/change-password`
- **Requires Authentication:** Extract user ID from JWT token
- Backend should:
  - Validate access token and extract user ID
  - Find user in database by ID
  - Verify currentPassword matches user's stored password hash
  - Validate newPassword meets security requirements
  - Validate newPassword === confirmPassword
  - Ensure newPassword is different from currentPassword
  - Prevent password reuse (optional: check against previous N passwords)
  - Hash the new password
  - Update user's password in database
  - Invalidate all existing refresh tokens except current one (optional)
  - Log password change for security auditing
  - Optionally send confirmation email to user
  - Return success response

**Security Considerations:**
- Require current password to prevent unauthorized changes if device is left unlocked
- Implement rate limiting (e.g., max 5 attempts per hour)
- Log all password change attempts (successful and failed)
- Notify user via email that password was changed
- Consider requiring re-authentication after password change
- Optionally invalidate all other sessions (force re-login on other devices)

---

## 3. User Profile Endpoints (T058)

### 3.1 Get User Profile
**Endpoint:** `GET /api/users/{id}`

**Headers:**
```
Authorization: Bearer {access-token}
```

**Path Parameters:**
- `id` (string, GUID): User ID to retrieve

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "emailConfirmed": true,
    "phoneNumber": "+1234567890",
    "profilePictureUrl": "https://example.com/profiles/john.jpg",
    "careerInterests": "Software Development, Cloud Computing",
    "careerGoals": "Become a Solutions Architect",
    "registrationDate": "2025-01-15T10:30:00Z",
    "lastLoginDate": "2025-10-29T14:20:00Z",
    "isActive": true,
    "roles": ["User"],
    "isMentor": false,
    "mentorId": null
  }
}
```

**Response (Error - 401 Unauthorized):**
```json
{
  "success": false,
  "message": "Unauthorized access",
  "statusCode": 401
}
```

**Response (Error - 404 Not Found):**
```json
{
  "success": false,
  "message": "User not found",
  "statusCode": 404
}
```

**Authorization:**
- Users can view their own profile
- Admins can view any user profile

---

### 3.2 Update User Profile
**Endpoint:** `PUT /api/users/{id}`

**Headers:**
```
Authorization: Bearer {access-token}
```

**Path Parameters:**
- `id` (string, GUID): User ID to update

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890",
  "careerInterests": "Software Development, AI, Cloud Computing",
  "careerGoals": "Become a Solutions Architect within 2 years",
  "profilePictureUrl": "https://example.com/profiles/john-new.jpg"
}
```

**Note:** Email cannot be changed via this endpoint. Use change email flow if needed.

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "emailConfirmed": true,
    "phoneNumber": "+1234567890",
    "profilePictureUrl": "https://example.com/profiles/john-new.jpg",
    "careerInterests": "Software Development, AI, Cloud Computing",
    "careerGoals": "Become a Solutions Architect within 2 years",
    "registrationDate": "2025-01-15T10:30:00Z",
    "lastLoginDate": "2025-10-29T14:20:00Z",
    "isActive": true,
    "roles": ["User"],
    "isMentor": false,
    "mentorId": null
  }
}
```

**Response (Error - 400 Validation Error):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "FirstName": ["First name is required"],
    "PhoneNumber": ["Invalid phone number format"]
  },
  "statusCode": 400
}
```

**Response (Error - 403 Forbidden):**
```json
{
  "success": false,
  "message": "You can only update your own profile",
  "statusCode": 403
}
```

**Authorization:**
- Users can only update their own profile
- Admins can update any user profile

---

## 4. Mentor Profile Endpoints (T059)

### 4.1 Apply to Become Mentor
**Endpoint:** `POST /api/mentors`

**Headers:**
```
Authorization: Bearer {access-token}
```

**Request Body:**
```json
{
  "bio": "Senior Software Engineer with 10 years of experience in full-stack development. Specialized in React, Node.js, and cloud architectures.",
  "expertiseTags": "React, Node.js, AWS, Docker, Kubernetes, Microservices",
  "yearsOfExperience": 10,
  "certifications": "AWS Certified Solutions Architect - Professional, Certified Kubernetes Administrator (CKA)",
  "rate30Min": 50.00,
  "rate60Min": 90.00,
  "categoryIds": [1, 2, 5]
}
```

**Field Requirements:**
- `bio` (string, required): Minimum 100 characters, maximum 2000 characters
- `expertiseTags` (string, required): Comma-separated tags, minimum 3 tags
- `yearsOfExperience` (number, required): Minimum 1 year
- `certifications` (string, optional): Professional certifications
- `rate30Min` (decimal, required): $20.00 - $500.00 range
- `rate60Min` (decimal, required): $20.00 - $500.00 range, typically 1.5-2x of 30-min rate
- `categoryIds` (number array, required): At least 1 category, maximum 5 categories

**Response (Success - 201 Created):**
```json
{
  "success": true,
  "message": "Mentor application submitted successfully! Your application is pending approval.",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "bio": "Senior Software Engineer with 10 years...",
    "expertiseTags": "React, Node.js, AWS, Docker, Kubernetes, Microservices",
    "yearsOfExperience": 10,
    "certifications": "AWS Certified Solutions Architect - Professional...",
    "rate30Min": 50.00,
    "rate60Min": 90.00,
    "averageRating": 0,
    "totalReviews": 0,
    "totalSessionsCompleted": 0,
    "isVerified": false,
    "approvalStatus": "Pending",
    "isAvailable": false,
    "categories": [
      {
        "id": 1,
        "name": "IT Careers",
        "description": "Information Technology career guidance",
        "iconUrl": "https://example.com/icons/it.svg"
      }
    ],
    "categoryIds": [1, 2, 5],
    "createdDate": "2025-10-29T14:30:00Z",
    "approvedDate": null
  }
}
```

**Response (Error - 400 Bad Request):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "Bio": ["Bio must be at least 100 characters"],
    "Rate30Min": ["Rate must be between $20.00 and $500.00"],
    "CategoryIds": ["At least one category is required"]
  },
  "statusCode": 400
}
```

**Response (Error - 409 Conflict):**
```json
{
  "success": false,
  "message": "You have already applied to become a mentor. Your application is pending approval.",
  "statusCode": 409
}
```

**Business Rules:**
- User must have verified email
- User cannot apply twice (check existing mentor record)
- Application starts in "Pending" approval status
- User gains "Mentor" role after admin approval

---

### 4.2 Update Mentor Profile
**Endpoint:** `PUT /api/mentors/{id}`

**Headers:**
```
Authorization: Bearer {access-token}
```

**Path Parameters:**
- `id` (string, GUID): Mentor ID to update

**Request Body:**
```json
{
  "bio": "Updated bio with new achievements...",
  "expertiseTags": "React, Node.js, AWS, Docker, Kubernetes, GraphQL",
  "yearsOfExperience": 11,
  "certifications": "AWS Certified Solutions Architect - Professional, CKA, CKAD",
  "rate30Min": 55.00,
  "rate60Min": 100.00,
  "categoryIds": [1, 2, 5, 8],
  "isAvailable": true
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Mentor profile updated successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "bio": "Updated bio with new achievements...",
    "expertiseTags": "React, Node.js, AWS, Docker, Kubernetes, GraphQL",
    "yearsOfExperience": 11,
    "certifications": "AWS Certified Solutions Architect - Professional, CKA, CKAD",
    "rate30Min": 55.00,
    "rate60Min": 100.00,
    "averageRating": 4.8,
    "totalReviews": 45,
    "totalSessionsCompleted": 120,
    "isVerified": true,
    "approvalStatus": "Approved",
    "isAvailable": true,
    "categories": [
      {
        "id": 1,
        "name": "IT Careers",
        "description": "Information Technology career guidance",
        "iconUrl": "https://example.com/icons/it.svg"
      }
    ],
    "categoryIds": [1, 2, 5, 8],
    "createdDate": "2025-01-20T08:00:00Z",
    "approvedDate": "2025-01-25T15:30:00Z"
  }
}
```

**Response (Error - 403 Forbidden):**
```json
{
  "success": false,
  "message": "You can only update your own mentor profile",
  "statusCode": 403
}
```

**Authorization:**
- Mentors can only update their own profile
- Admins can update any mentor profile

**Note:** Some fields cannot be updated after approval:
- `approvalStatus` - Only admins can change this
- `isVerified` - Only admins can verify mentors
- `averageRating`, `totalReviews`, `totalSessionsCompleted` - Calculated fields

---

### 4.3 Get Mentor Profile
**Endpoint:** `GET /api/mentors/{id}`

**Headers:**
```
Authorization: Bearer {access-token} (optional - public endpoint)
```

**Path Parameters:**
- `id` (string, GUID): Mentor ID to retrieve

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "bio": "Senior Software Engineer with 10 years...",
    "expertiseTags": "React, Node.js, AWS, Docker, Kubernetes",
    "yearsOfExperience": 10,
    "certifications": "AWS Certified Solutions Architect...",
    "rate30Min": 50.00,
    "rate60Min": 90.00,
    "averageRating": 4.8,
    "totalReviews": 45,
    "totalSessionsCompleted": 120,
    "isVerified": true,
    "approvalStatus": "Approved",
    "isAvailable": true,
    "categories": [
      {
        "id": 1,
        "name": "IT Careers",
        "description": "Information Technology career guidance",
        "iconUrl": "https://example.com/icons/it.svg"
      }
    ],
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "firstName": "John",
      "lastName": "Doe",
      "profilePictureUrl": "https://example.com/profiles/john.jpg"
    }
  }
}
```

**Response (Error - 404 Not Found):**
```json
{
  "success": false,
  "message": "Mentor not found",
  "statusCode": 404
}
```

**Note:** This endpoint is public - can be accessed without authentication for browsing mentors.

---

## 5. JWT Token Structure

### Required JWT Claims (Token Payload)

The frontend expects the following claims in the JWT token payload:

```typescript
{
  // Standard JWT Claims
  "sub": "user-guid",              // User ID (Subject)
  "email": "user@example.com",     // User email
  "iat": 1699999999,               // Issued at (Unix timestamp)
  "exp": 1700003599,               // Expiration (Unix timestamp)
  "nbf": 1699999999,               // Not before (Unix timestamp)
  "iss": "CareerRoute",            // Issuer
  "aud": "CareerRoute-Users",      // Audience
  "jti": "token-guid",             // JWT ID (unique)

  // OpenID Connect Standard Claims
  "given_name": "John",            // First name
  "family_name": "Doe",            // Last name
  "email_verified": true,          // Email verified status
  "picture": "url-to-profile-pic", // Profile picture URL

  // Custom Claims (Application-Specific)
  "role": "User",                  // User role (can be array: ["User", "Mentor"])
  "is_mentor": false,              // Whether user is a mentor
  "mentor_id": null                // Mentor ID if user is a mentor
}
```

### ⚠️ CRITICAL: Role Claim Format

The `role` claim can be either:
- **String** (single role): `"role": "User"`
- **Array** (multiple roles): `"role": ["User", "Mentor"]`

Frontend handles both formats automatically.

### Token Expiration
- **Access Token:** Recommended 1 hour (3600 seconds)
- **Refresh Token:** Recommended 7 days
- **Frontend Auto-Refresh:** Triggers 5 minutes before expiration (configurable)

---

## 6. Request/Response DTOs

### 6.1 Standard Success Response
```typescript
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { /* response data */ }
}
```

### 6.2 Standard Error Response
```typescript
{
  "success": false,
  "message": "User-friendly error message",
  "errors": {
    "fieldName": ["Error message 1", "Error message 2"]
  },
  "statusCode": 400
}
```

### 6.3 Validation Error Response (400 Bad Request)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "Email": ["Email is required", "Email format is invalid"],
    "Password": ["Password must be at least 8 characters"],
    "FirstName": ["First name is required"]
  },
  "statusCode": 400
}
```

**Note:** Frontend expects errors as `{ [fieldName]: string[] }`

---

## 7. Error Response Format

### HTTP Status Codes Expected

| Status | Scenario | Frontend Behavior |
|--------|----------|-------------------|
| **200** | Success | Show success notification |
| **400** | Validation error | Show field-specific errors |
| **401** | Unauthorized | Auto-logout, redirect to login |
| **403** | Forbidden | Show permission denied message |
| **404** | Not found | Show not found error |
| **409** | Conflict (e.g., duplicate email) | Show conflict message |
| **422** | Unprocessable Entity | Show validation errors |
| **429** | Too many requests | Show rate limit warning |
| **500** | Server error | Show generic error message |
| **503** | Service unavailable | Show maintenance message |

### Error Handling Priority

Frontend tries to extract error messages in this order:
1. `error.message` (string)
2. `error.errors[field][0]` (first validation error)
3. Default fallback message

---

## 8. CORS Configuration

### Required CORS Settings (Backend)

```csharp
// In Program.cs or Startup.cs
services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", builder =>
    {
        builder.WithOrigins("http://localhost:4200") // Angular dev server
               .AllowAnyMethod()
               .AllowAnyHeader()
               .AllowCredentials();
    });
});

app.UseCors("AllowFrontend");
```

### Allowed Origins
- **Development:** `http://localhost:4200`
- **Production:** TBD (add production domain)

### Allowed Methods
- GET, POST, PUT, DELETE, PATCH, OPTIONS

### Allowed Headers
- Authorization
- Content-Type
- Accept

---

## 9. User & Mentor Models

### 9.1 User Model Structure

```typescript
{
  "id": "string (GUID)",
  "email": "string",
  "emailConfirmed": "boolean",
  "firstName": "string",
  "lastName": "string",
  "phoneNumber": "string | null",
  "profilePictureUrl": "string | null",
  "careerInterests": "string | null",
  "careerGoals": "string | null",
  "registrationDate": "ISO 8601 date string",
  "lastLoginDate": "ISO 8601 date string | null",
  "isActive": "boolean",
  "roles": ["User", "Mentor", "Admin"],
  "isMentor": "boolean",
  "mentorId": "string | null"
}
```

**Example:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "john.doe@example.com",
  "emailConfirmed": true,
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890",
  "profilePictureUrl": "https://example.com/profiles/john.jpg",
  "careerInterests": "Software Development, Cloud Computing",
  "careerGoals": "Become a Solutions Architect",
  "registrationDate": "2025-01-15T10:30:00Z",
  "lastLoginDate": "2025-10-29T14:20:00Z",
  "isActive": true,
  "roles": ["User"],
  "isMentor": false,
  "mentorId": null
}
```

### 9.2 Mentor Model Structure

```typescript
{
  "id": "string (GUID - FK to User.Id)",
  "bio": "string",
  "expertiseTags": "string (comma-separated) | string[]",
  "yearsOfExperience": "number",
  "certifications": "string | null",
  "rate30Min": "number (decimal)",
  "rate60Min": "number (decimal)",
  "averageRating": "number (0-5)",
  "totalReviews": "number",
  "totalSessionsCompleted": "number",
  "isVerified": "boolean",
  "approvalStatus": "Pending | Approved | Rejected",
  "isAvailable": "boolean",
  "categories": [
    {
      "id": "number",
      "name": "string",
      "description": "string | null",
      "iconUrl": "string | null"
    }
  ],
  "categoryIds": "number[]",
  "createdDate": "ISO 8601 date string",
  "approvedDate": "ISO 8601 date string | null"
}
```

**Example:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "bio": "Senior Software Engineer with 10 years of experience in full-stack development...",
  "expertiseTags": "React, Node.js, AWS, Docker, Kubernetes",
  "yearsOfExperience": 10,
  "certifications": "AWS Certified Solutions Architect, PMP",
  "rate30Min": 50.00,
  "rate60Min": 90.00,
  "averageRating": 4.8,
  "totalReviews": 45,
  "totalSessionsCompleted": 120,
  "isVerified": true,
  "approvalStatus": "Approved",
  "isAvailable": true,
  "categories": [
    {
      "id": 1,
      "name": "IT Careers",
      "description": "Information Technology career guidance",
      "iconUrl": "https://example.com/icons/it.svg"
    }
  ],
  "categoryIds": [1, 2],
  "createdDate": "2025-01-20T08:00:00Z",
  "approvedDate": "2025-01-25T15:30:00Z"
}
```

---

## 10. Category Endpoints (T085)

### 10.1 Get All Categories
**Endpoint:** `GET /api/categories`

**Headers:**
```
Authorization: Bearer {access-token} (optional - public endpoint)
```

**Query Parameters:**
- None (returns all active categories)

**Response (Success - 200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "IT Careers",
      "description": "Information Technology and Software Development career guidance",
      "iconUrl": "https://example.com/icons/it.svg",
      "mentorCount": 45
    },
    {
      "id": 2,
      "name": "Business & Finance",
      "description": "Business strategy, finance, and entrepreneurship mentorship",
      "iconUrl": "https://example.com/icons/business.svg",
      "mentorCount": 32
    },
    {
      "id": 3,
      "name": "Healthcare",
      "description": "Medical and healthcare career mentorship",
      "iconUrl": "https://example.com/icons/healthcare.svg",
      "mentorCount": 18
    }
  ]
}
```

**Category Model:**
```typescript
{
  "id": "number",
  "name": "string",
  "description": "string | null",
  "iconUrl": "string | null",
  "mentorCount": "number (optional)"
}
```

**Note:** This is a public endpoint - can be accessed without authentication for browsing.

---

### 10.2 Get Mentors by Category
**Endpoint:** `GET /api/categories/{id}/mentors`

**Headers:**
```
Authorization: Bearer {access-token} (optional - public endpoint)
```

**Path Parameters:**
- `id` (number): Category ID

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `pageSize` (number, optional): Items per page (default: 10, max: 50)
- `sortBy` (string, optional): Sort field - `rating`, `price`, `experience`, `sessions` (default: `rating`)
- `sortOrder` (string, optional): `asc` or `desc` (default: `desc`)
- `minPrice` (decimal, optional): Minimum 30-min rate filter
- `maxPrice` (decimal, optional): Maximum 30-min rate filter
- `minRating` (decimal, optional): Minimum rating filter (0-5)
- `keywords` (string, optional): Search in bio and expertise tags

**Example Request:**
```
GET /api/categories/1/mentors?page=1&pageSize=10&sortBy=rating&minRating=4.0&keywords=react
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "bio": "Senior Software Engineer with 10 years...",
        "expertiseTags": "React, Node.js, AWS, Docker, Kubernetes",
        "yearsOfExperience": 10,
        "rate30Min": 50.00,
        "rate60Min": 90.00,
        "averageRating": 4.8,
        "totalReviews": 45,
        "totalSessionsCompleted": 120,
        "isVerified": true,
        "isAvailable": true,
        "user": {
          "id": "550e8400-e29b-41d4-a716-446655440000",
          "firstName": "John",
          "lastName": "Doe",
          "profilePictureUrl": "https://example.com/profiles/john.jpg"
        }
      }
    ],
    "totalCount": 45,
    "page": 1,
    "pageSize": 10,
    "totalPages": 5
  }
}
```

**Response (Error - 404 Not Found):**
```json
{
  "success": false,
  "message": "Category not found",
  "statusCode": 404
}
```

**Pagination Response Schema:**
```typescript
{
  "items": "Mentor[]",
  "totalCount": "number",
  "page": "number",
  "pageSize": "number",
  "totalPages": "number"
}
```

**Business Rules:**
- Only returns mentors with `approvalStatus: "Approved"`
- Only returns mentors with `isAvailable: true` (unless user is viewing their own profile)
- Results are paginated (default 10 per page, max 50)
- Default sort by rating (highest first)

**Note:** This is a public endpoint - can be accessed without authentication for browsing mentors.

---

## 11. Frontend Token Storage

### Token Storage Keys (localStorage)
```typescript
// Keys used by frontend
TOKEN_KEY = 'career_route_token'
REFRESH_TOKEN_KEY = 'career_route_refresh_token'
```

### Security Considerations
- ✅ Tokens stored in localStorage (current implementation)
- ✅ Tokens cleared on logout
- ✅ Tokens validated on page refresh
- ✅ Auto-refresh mechanism (5 min before expiry)
- ⚠️ **Production:** Consider httpOnly cookies for enhanced security

---

## 12. Frontend Auto-Refresh Mechanism

### How It Works
1. Frontend starts timer when user logs in
2. Token refresh triggered **5 minutes before expiration**
3. If refresh fails → User logged out automatically
4. If refresh succeeds → New tokens stored, timer restarted

### Backend Requirements
- ✅ Refresh endpoint must accept expired access tokens
- ✅ Refresh token must be valid for at least 7 days
- ✅ Return new access token + new refresh token
- ✅ Handle refresh token rotation (invalidate old refresh token)

---

## 13. Authentication Flow Diagram

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │
       │ 1. Register
       ▼
┌─────────────────────────────────────┐
│  POST /api/auth/register            │
│  → Backend creates user             │
│  → Sends verification email         │
│  → Returns success response         │
└──────────┬──────────────────────────┘
           │
           │ 2. User clicks email link
           ▼
┌─────────────────────────────────────┐
│  POST /api/auth/verify-email        │
│  → Backend verifies email           │
│  → Updates emailConfirmed = true    │
└──────────┬──────────────────────────┘
           │
           │ 3. Login
           ▼
┌─────────────────────────────────────┐
│  POST /api/auth/login               │
│  → Backend validates credentials    │
│  → Generates JWT + Refresh token    │
│  → Returns tokens + user data       │
└──────────┬──────────────────────────┘
           │
           │ Frontend stores tokens
           ▼
┌─────────────────────────────────────┐
│  localStorage:                      │
│  - career_route_token               │
│  - career_route_refresh_token       │
└──────────┬──────────────────────────┘
           │
           │ 4. Authenticated Requests
           ▼
┌─────────────────────────────────────┐
│  API Calls with:                    │
│  Authorization: Bearer {token}      │
└──────────┬──────────────────────────┘
           │
           │ 5. Token near expiration (55 min)
           ▼
┌─────────────────────────────────────┐
│  POST /api/auth/refresh             │
│  → Backend validates refresh token  │
│  → Issues new access token          │
│  → Issues new refresh token         │
└──────────┬──────────────────────────┘
           │
           │ Frontend updates tokens
           └──────► Continue using app
```

---

## 14. Validation Rules

### Frontend Validation (Client-Side)

**Email:**
- ✅ Required
- ✅ Valid email format (regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`)

**Password:**
- ✅ Required
- ✅ Minimum 8 characters
- ✅ At least one lowercase letter (a-z)
- ✅ At least one uppercase letter (A-Z)
- ✅ At least one number (0-9)
- ⚠️ Special character recommended (not required)
- ❌ Not in common passwords list

**First Name / Last Name:**
- ✅ Required
- ✅ Minimum 2 characters
- ✅ Trimmed whitespace

**Phone Number:**
- ⚠️ Optional
- ✅ If provided: must match `/^[\d\s\-\+\(\)]+$/`

### Backend Validation Required

Backend should implement **server-side validation** for all fields to prevent malicious requests bypassing client-side validation.

---

## 15. Testing Checklist for Backend Team

### ✅ Endpoints to Test

- [ ] **POST /api/auth/register**
  - [ ] Success case
  - [ ] Duplicate email (409 Conflict)
  - [ ] Invalid email format (400 Bad Request)
  - [ ] Weak password (400 Bad Request)
  - [ ] Missing required fields (400 Bad Request)

- [ ] **POST /api/auth/login**
  - [ ] Success case
  - [ ] Invalid credentials (401 Unauthorized)
  - [ ] Unverified email (403 Forbidden)
  - [ ] Account disabled (403 Forbidden)

- [ ] **POST /api/auth/refresh**
  - [ ] Success case
  - [ ] Invalid refresh token (401)
  - [ ] Expired refresh token (401)

- [ ] **POST /api/auth/verify-email**
  - [ ] Success case
  - [ ] Invalid token (400)
  - [ ] Expired token (400)

- [ ] **POST /api/auth/forgot-password**
  - [ ] Success case (email exists)
  - [ ] Email not found (still return 200 for security)

- [ ] **POST /api/auth/reset-password**
  - [ ] Success case
  - [ ] Invalid token (400)
  - [ ] Token expired (400)

- [ ] **POST /api/auth/change-password**
  - [ ] Success case
  - [ ] Wrong current password (400)
  - [ ] Unauthorized (401)

- [ ] **GET /api/users/{id}**
  - [ ] Success case (own profile)
  - [ ] Success case (admin viewing any profile)
  - [ ] Unauthorized (401)
  - [ ] Forbidden (403) - user viewing another user's profile
  - [ ] Not found (404)

- [ ] **PUT /api/users/{id}**
  - [ ] Success case
  - [ ] Validation errors (400)
  - [ ] Forbidden (403) - user updating another user's profile
  - [ ] Not found (404)

- [ ] **POST /api/mentors**
  - [ ] Success case (mentor application)
  - [ ] Validation errors (400) - bio too short, invalid rates
  - [ ] Conflict (409) - user already applied
  - [ ] Unauthorized (401) - not logged in

- [ ] **PUT /api/mentors/{id}**
  - [ ] Success case
  - [ ] Validation errors (400)
  - [ ] Forbidden (403) - updating another mentor's profile
  - [ ] Not found (404)

- [ ] **GET /api/mentors/{id}**
  - [ ] Success case (public endpoint)
  - [ ] Not found (404)

- [ ] **GET /api/categories**
  - [ ] Success case (returns all categories)
  - [ ] Empty result when no categories exist

- [ ] **GET /api/categories/{id}/mentors**
  - [ ] Success case with pagination
  - [ ] Success with filters (minPrice, maxPrice, minRating, keywords)
  - [ ] Success with sorting (rating, price, experience)
  - [ ] Not found (404) - invalid category
  - [ ] Empty result when no mentors in category

### ✅ JWT Token Tests

- [ ] Token includes all required claims
- [ ] Token expiration is correct
- [ ] Refresh token rotation works
- [ ] Token validation on protected endpoints
- [ ] Role claims properly formatted

### ✅ CORS Tests

- [ ] Preflight requests (OPTIONS) handled
- [ ] Frontend origin allowed
- [ ] Credentials allowed
- [ ] Headers allowed

---

## 16. Environment Configuration

### Frontend Configuration Files

**Development:**
```typescript
// Frontend/src/environments/environment.development.ts
{
  apiUrl: 'http://localhost:5000/api',
  auth: {
    tokenKey: 'career_route_token',
    refreshTokenKey: 'career_route_refresh_token',
    tokenExpirationBuffer: 300 // 5 minutes
  }
}
```

**Production:**
```typescript
// Frontend/src/environments/environment.ts
{
  apiUrl: 'https://api.careerroute.com/api',
  auth: {
    tokenKey: 'career_route_token',
    refreshTokenKey: 'career_route_refresh_token',
    tokenExpirationBuffer: 300
  }
}
```

### Backend Expected Configuration

```json
{
  "JwtSettings": {
    "SecretKey": "your-secret-key-here",
    "Issuer": "CareerRoute",
    "Audience": "CareerRoute-Users",
    "AccessTokenExpirationMinutes": 60,
    "RefreshTokenExpirationDays": 7
  }
}
```

---

## 17. Quick Reference: HTTP Headers

### Request Headers (Frontend → Backend)

```
Content-Type: application/json
Authorization: Bearer {access-token}
Accept: application/json
```

### Response Headers (Backend → Frontend)

```
Content-Type: application/json
Access-Control-Allow-Origin: http://localhost:4200
Access-Control-Allow-Credentials: true
```

---

## 18. Contact & Questions

### Frontend Developer
- **Name:** [Your Name]
- **Email:** [Your Email]
- **Tasks Completed:** T061, T062, T063, T064

### Documentation References
- Frontend Models: `Frontend/src/app/shared/models/`
- Auth Service: `Frontend/src/app/core/services/auth.service.ts`
- Environment Config: `Frontend/src/environments/`

### Questions to Clarify with Backend Team

1. ❓ Confirm JWT claim names (especially custom claims: `is_mentor`, `mentor_id`)
2. ❓ Confirm error response format matches expectations
3. ❓ Confirm CORS configuration allows `http://localhost:4200`
4. ❓ Confirm refresh token rotation strategy
5. ❓ Confirm email verification flow (auto-login after verification?)
6. ❓ Confirm role claim format (string vs array)

---

## 19. Sample API Test Requests

### Postman Collection Sample

**Register:**
```bash
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "TestPass123!",
  "confirmPassword": "TestPass123!",
  "firstName": "Test",
  "lastName": "User"
}
```

**Login:**
```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "TestPass123!"
}
```

**Refresh:**
```bash
POST http://localhost:5000/api/auth/refresh
Content-Type: application/json

{
  "token": "eyJhbGc...",
  "refreshToken": "refresh-token"
}
```

**Get User Profile:**
```bash
GET http://localhost:5000/api/users/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer {access-token}
```

**Update User Profile:**
```bash
PUT http://localhost:5000/api/users/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer {access-token}
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890",
  "careerInterests": "Software Development, AI",
  "careerGoals": "Become a Solutions Architect"
}
```

**Apply to Become Mentor:**
```bash
POST http://localhost:5000/api/mentors
Authorization: Bearer {access-token}
Content-Type: application/json

{
  "bio": "Senior Software Engineer with 10 years of experience in full-stack development. Specialized in React, Node.js, and cloud architectures. Passionate about mentoring and helping others grow their careers.",
  "expertiseTags": "React, Node.js, AWS, Docker, Kubernetes, Microservices",
  "yearsOfExperience": 10,
  "certifications": "AWS Certified Solutions Architect - Professional, CKA",
  "rate30Min": 50.00,
  "rate60Min": 90.00,
  "categoryIds": [1, 2]
}
```

**Update Mentor Profile:**
```bash
PUT http://localhost:5000/api/mentors/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer {access-token}
Content-Type: application/json

{
  "bio": "Updated bio...",
  "expertiseTags": "React, Node.js, AWS, Docker, Kubernetes, GraphQL",
  "yearsOfExperience": 11,
  "rate30Min": 55.00,
  "rate60Min": 100.00,
  "categoryIds": [1, 2, 5],
  "isAvailable": true
}
```

**Get All Categories:**
```bash
GET http://localhost:5000/api/categories
```

**Get Mentors by Category (with filters):**
```bash
GET http://localhost:5000/api/categories/1/mentors?page=1&pageSize=10&sortBy=rating&minRating=4.0&keywords=react
```

---

## 20. Breaking Changes to Watch For

### ⚠️ If Backend Changes These, Frontend Will Break:

1. **Endpoint URLs** - Must match exactly
2. **JWT Claim Names** - Frontend expects specific claim names
3. **Response Structure** - Must have `success`, `message`, `data/user`
4. **Error Format** - Must have `errors` object with field names
5. **Status Codes** - Frontend handles specific codes differently
6. **Token Expiration** - Frontend expects `exp` claim in seconds (Unix timestamp)

---

## 21. Success Indicators

### ✅ Integration is Successful When:

**Authentication (T057):**
- [ ] User can register successfully
- [ ] User receives verification email
- [ ] User can verify email via link
- [ ] User can login and receive tokens
- [ ] Tokens are stored in localStorage
- [ ] Protected routes require authentication
- [ ] Token auto-refresh works
- [ ] User can logout (tokens cleared)
- [ ] Password reset flow works

**User Profile (T058):**
- [ ] User can view their own profile
- [ ] User can update their profile
- [ ] User cannot view/update other users' profiles (403 Forbidden)
- [ ] Admin can view/update any user profile

**Mentor Profile (T059):**
- [ ] User can apply to become mentor
- [ ] User cannot apply twice (409 Conflict)
- [ ] Mentor application creates pending approval status
- [ ] Mentor can update their own profile
- [ ] Mentor profile shows correct approval status
- [ ] Public can view approved mentor profiles

**Categories (T085):**
- [ ] Public can browse all categories
- [ ] Public can view mentors by category
- [ ] Filtering by price, rating, keywords works
- [ ] Sorting by rating, price, experience works
- [ ] Pagination works correctly
- [ ] Only approved mentors are shown

**General:**
- [ ] Error messages display properly in UI
- [ ] CORS doesn't block requests
- [ ] All endpoints return correct status codes
- [ ] JWT token includes all required claims
- [ ] Validation errors show field-specific messages

---

**Document Version:** 2.2
**Last Updated:** 2025-10-30
**Frontend Tasks Completed:** T061, T062, T063, T064, T065 (UserService)
**Frontend Tasks In Progress:** T066 (MentorService - Partial)
**Backend Tasks Covered:** T057, T058, T059, T085
**Next Frontend Tasks:** T066 (MentorService - Complete), T067 (Category Service)

---

## 22. Frontend Implementation Status

### T061 - T064: Auth Service & Infrastructure (Completed)
- ✅ AuthService with full authentication flows (login, register, logout, token refresh)
- ✅ Email verification and password reset flows
- ✅ Auth guards for route protection (authGuard, guestGuard, role-based guards)
- ✅ HTTP interceptors (authInterceptor for token attachment, errorInterceptor for global error handling)
- ✅ NotificationService for user feedback

### T065: UserService (Completed ✅)
- ✅ `getUserProfile(userId)`: Retrieve user profile by ID
- ✅ `getCurrentUserProfile()`: Get authenticated user's profile
- ✅ `updateUserProfile(userId, profileUpdate)`: Update user profile
- ✅ `updateCurrentUserProfile(profileUpdate)`: Update current user's profile
- ✅ Profile caching for performance optimization
- ✅ Cached access methods: `getCachedUserProfile()`, `getCachedCurrentUserProfile()`
- ✅ Profile refresh: `refreshCurrentUserProfile()`
- ✅ Helper methods: `formatUserFullName()`, `getUserInitials()`, `userHasRole()`, `currentUserIsMentor()`
- ✅ Observable streams: `currentUserProfile$` for reactive UI updates
- ✅ Error handling with automatic notifications
- ✅ Integration with AuthService and NotificationService

**Implementation Location:** `Frontend/src/app/core/services/user.service.ts`
**Documentation:** `Frontend/src/app/core/services/README.md`

### T066: MentorService (In Progress 🔄)
- ✅ `applyToBecomeMentor(application)`: Submit mentor application
- ✅ `getMentorProfile(mentorId)`: Get mentor profile by ID
- ✅ `getCurrentMentorProfile()`: Get authenticated user's mentor profile
- ✅ `updateMentorProfile(mentorId, profileUpdate)`: Update mentor profile
- ✅ `updateCurrentMentorProfile(profileUpdate)`: Update current user's profile
- ✅ Profile caching for performance optimization
- ✅ Cached access methods: `getCachedMentorProfile()`, `getCachedCurrentMentorProfile()`
- ✅ Application status tracking: `getMentorApplicationStatusObs()`
- ✅ Status checking methods: `isCurrentUserApprovedMentor()`, `hasCurrentUserPendingApplication()`
- ✅ Helper methods: `calculateProfileCompletionPercentage()`, `hasAppliedToBecomeMentor()`
- ✅ Observable streams: `currentMentorProfile$`, `mentorApplication$` for reactive UI
- ✅ Error handling with automatic notifications
- ✅ Integration with AuthService and NotificationService

**Implementation Location:** `Frontend/src/app/core/services/mentor.service.ts`
**Documentation:** `Frontend/src/app/core/services/README.md`

**Partial Implementation Covers:**
- Apply to become mentor (POST /api/mentors)
- Get mentor profile (GET /api/mentors/{id})
- Update mentor profile (PUT /api/mentors/{id})

**Not Yet Implemented (T066 Future):**
- Mentor search and filtering
- Mentor listing by category
- Category endpoints
- Mentor statistics and analytics

---

## 23. Frontend Service Architecture

### Authentication Flow
```
Login → AuthService stores tokens → Guards verify token →
AuthInterceptor adds token to requests → Protected endpoints accessible
```

### User Profile Flow
```
Component → UserService.getCurrentUserProfile() → API: GET /api/users/{id} →
Response cached → currentUserProfile$ updates → UI renders with async pipe
```

### Error Handling Flow
```
API Error → ErrorInterceptor catches → NotificationService displays error →
User sees feedback toast → Error details logged for debugging
```

---

## 24. Frontend Service Dependencies

### HttpClient
- Automatically injected by Angular
- Used by all API services
- Interceptors modify requests/responses

### AuthService
- Used by UserService to get current user ID
- Provides current user information
- Manages authentication state
- Used by guards for route protection

### NotificationService
- Used by UserService for user feedback
- Shows success/error/warning messages
- Auto-dismisses notifications
- Integrates with error interceptor

### RxJS Operators
- `map()`: Transform API responses
- `tap()`: Side effects (caching, notifications)
- `catchError()`: Error handling
- `switchMap()`: Chaining observables
- `finalize()`: Cleanup operations

---
