# Frontend-Backend API Contract
**Frontend Implementation Status:** Tasks T061, T062, T063, T064 Completed
**Date:** 2025-10-29
**Frontend Framework:** Angular 20.3.0
**Expected Backend:** ASP.NET Core 8.0 Web API

---

## 📋 Table of Contents
1. [API Base URL Configuration](#api-base-url-configuration)
2. [Authentication Endpoints (T057)](./Authentication-Endpoints.md) - **See separate file**
3. [User Profile Endpoints (T058)](./User-Profile-Endpoints.md) - **See separate file**
4. [Mentor Profile Endpoints (T059)](#mentor-profile-endpoints-t059)
5. [JWT Token Structure](#jwt-token-structure)
6. [Request/Response DTOs](#requestresponse-dtos)
7. [Error Response Format](#error-response-format)
8. [CORS Configuration](#cors-configuration)
9. [User & Mentor Models](#user--mentor-models)
10. [Category Endpoints (T085, T067)](./Category-Endpoints.md) - **See separate file**

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

## 2. Authentication Endpoints (T057)

**See: [Authentication-Endpoints.md](./Authentication-Endpoints.md)**

All authentication endpoints (register, login, token refresh, email verification, password reset) have been moved to a separate document for better organization.

---

## 3. User Profile Endpoints (T058)

**See: [User-Profile-Endpoints.md](./User-Profile-Endpoints.md)**

All user profile endpoints (get profile, update profile) have been moved to a separate document for better organization.

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
  "careerInterests": "string[] | null",
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
  "careerInterests": ["Software Development", "Cloud Computing", "Data Science"],
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

## 10. Category Endpoints (T085, T067)

**See: [Category-Endpoints.md](./Category-Endpoints.md)**

All category endpoints (CRUD operations, get mentors by category) have been moved to a separate document for better organization.

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
  - [ ] Success case (returns all active categories)
  - [ ] Success with type filter (`?type=CareerInterest`)
  - [ ] Empty result when no categories exist
  - [ ] Sorted by displayOrder then name

- [ ] **GET /api/categories/{id}**
  - [ ] Success case (returns single category)
  - [ ] Not found (404) - invalid ID

- [ ] **POST /api/categories**
  - [ ] Success case (admin creates category)
  - [ ] Validation errors (400) - missing name, invalid type
  - [ ] Duplicate name (400) - name exists for same type
  - [ ] Unauthorized (401) - not logged in
  - [ ] Forbidden (403) - not admin

- [ ] **PUT /api/categories/{id}**
  - [ ] Success case (admin updates category)
  - [ ] Validation errors (400)
  - [ ] Forbidden (403) - not admin
  - [ ] Not found (404) - invalid ID

- [ ] **DELETE /api/categories/{id}**
  - [ ] Success case (admin deletes category)
  - [ ] Category in use (400) - referenced by users/mentors
  - [ ] Forbidden (403) - not admin
  - [ ] Not found (404) - invalid ID

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

## 18. Questions

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
  "careerInterests": ["Software Development", "AI", "Cloud Computing"],
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

**Categories (T085, T067):**
- [ ] Public can browse all categories
- [ ] Categories can be filtered by type (CareerInterest, MentorSpecialization)
- [ ] Categories are sorted by displayOrder then name
- [ ] At least 20 career interests available
- [ ] Admin can create new categories
- [ ] Admin can update existing categories
- [ ] Admin can delete categories (with validation)
- [ ] Users can see career interests in edit profile page
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
