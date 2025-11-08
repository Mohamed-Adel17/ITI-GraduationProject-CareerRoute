# User Profile Endpoints API Contract

**Frontend Framework:** Angular 20.3.0
**Expected Backend:** ASP.NET Core 8.0 Web API
**Base URL:** `http://localhost:5000/api`

---

## Overview

User profile endpoints allow users to view, update, and manage their personal information. All endpoints require authentication via JWT Bearer token.

**Authorization Rules:**
- Users can view/update/delete their own profile via `/me` endpoints
- Admins and Mentors can view any user profile
- Admins can update any user profile
- Admins and Mentors can view all users list

---

## 1. Get Current User Profile

**Endpoint:** `GET /api/users/me`
**Requires:** `Authorization: Bearer {token}`
**Roles:** Any authenticated user

**Success Response (200):**
```json
{
  "success": true,
  "message": "User profile retrieved successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "emailConfirmed": true,
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
}
```

**Error Responses:**

- **401 Unauthorized:**
  ```json
  {
    "success": false,
    "message": "Unauthorized access",
    "statusCode": 401
  }
  ```

**Backend Behavior:**
- Extract user ID from JWT token claims
- Fetch current user data from database
- Return user profile data

---

## 2. Update Current User Profile

**Endpoint:** `PATCH /api/users/me`
**Requires:** `Authorization: Bearer {token}`
**Roles:** Any authenticated user

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890",
  "careerInterests": ["Software Development", "AI", "Cloud Computing"],
  "careerGoals": "Become a Solutions Architect within 2 years",
  "profilePictureUrl": "https://example.com/profiles/john-new.jpg"
}
```

**Field Requirements:**
- `firstName` (optional): Min 2 chars, max 50 chars
- `lastName` (optional): Min 2 chars, max 50 chars
- `phoneNumber` (optional): Valid phone number format
- `careerInterests` (optional): Array of career interest names
- `careerGoals` (optional): Max 500 characters
- `profilePictureUrl` (optional): Valid URL format, max 200 chars

**Note:** All fields are optional. Only provided fields will be updated. Email cannot be changed via this endpoint.

**Success Response (200):**
```json
{
  "success": true,
  "message": "User profile updated successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "emailConfirmed": true,
    "phoneNumber": "+1234567890",
    "profilePictureUrl": "https://example.com/profiles/john-new.jpg",
    "careerInterests": ["Software Development", "AI", "Cloud Computing"],
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

**Error Responses:**

- **400 Validation Error:**
  ```json
  {
    "success": false,
    "message": "Validation failed",
    "errors": {
      "FirstName": ["First name must be at least 2 characters"],
      "PhoneNumber": ["Invalid phone number format"]
    },
    "statusCode": 400
  }
  ```

- **401 Unauthorized:**
  ```json
  {
    "success": false,
    "message": "Unauthorized access",
    "statusCode": 401
  }
  ```

**Backend Behavior:**
- Extract user ID from JWT token claims
- Validate all provided fields
- Update only the fields that are provided in request
- Return updated user data

---

## 3. Delete Current User Account

**Endpoint:** `DELETE /api/users/me`
**Requires:** `Authorization: Bearer {token}`
**Roles:** Any authenticated user

**Success Response (200):**
```json
{
  "success": true,
  "message": "User profile deleted successfully"
}
```

**Error Responses:**

- **401 Unauthorized:**
  ```json
  {
    "success": false,
    "message": "Unauthorized access",
    "statusCode": 401
  }
  ```

**Backend Behavior:**
- Extract user ID from JWT token claims
- Soft delete or hard delete user account
- Invalidate all refresh tokens
- Return success message

---

## 4. Get All Users

**Endpoint:** `GET /api/users`
**Requires:** `Authorization: Bearer {token}`
**Roles:** Admin, Mentor

**Success Response (200):**
```json
{
  "success": true,
  "message": "All users retrieved successfully",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "emailConfirmed": true,
      "phoneNumber": "+1234567890",
      "profilePictureUrl": "https://example.com/profiles/john.jpg",
      "careerInterests": ["Software Development", "Cloud Computing"],
      "careerGoals": "Become a Solutions Architect",
      "registrationDate": "2025-01-15T10:30:00Z",
      "lastLoginDate": "2025-10-29T14:20:00Z",
      "isActive": true,
      "roles": ["User"],
      "isMentor": false,
      "mentorId": null
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "email": "jane.doe@example.com",
      "firstName": "Jane",
      "lastName": "Doe",
      "emailConfirmed": true,
      "phoneNumber": "+1234567891",
      "profilePictureUrl": "https://example.com/profiles/jane.jpg",
      "careerInterests": ["Data Science", "Machine Learning"],
      "careerGoals": "Become a Data Scientist",
      "registrationDate": "2025-01-10T08:15:00Z",
      "lastLoginDate": "2025-10-30T09:45:00Z",
      "isActive": true,
      "roles": ["Mentor"],
      "isMentor": true,
      "mentorId": null
    }
  ]
}
```

**Error Responses:**

- **401 Unauthorized:**
  ```json
  {
    "success": false,
    "message": "Unauthorized access",
    "statusCode": 401
  }
  ```

- **403 Forbidden:**
  ```json
  {
    "success": false,
    "message": "You don't have permission to access this resource",
    "statusCode": 403
  }
  ```

- **404 Not Found:**
  ```json
  {
    "success": false,
    "message": "No users found",
    "statusCode": 404
  }
  ```

**Backend Behavior:**
- Verify user has Admin or Mentor role
- Fetch all users from database
- Return list of all users
- Return 404 if no users exist

---

## 5. Get User by ID

**Endpoint:** `GET /api/users/{id}`
**Requires:** `Authorization: Bearer {token}`
**Roles:** Admin, Mentor

**Path Parameters:**
- `id` (string, GUID): User ID to retrieve

**Success Response (200):**
```json
{
  "success": true,
  "message": "User retrieved successfully.",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "emailConfirmed": true,
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
}
```

**Error Responses:**

- **401 Unauthorized:**
  ```json
  {
    "success": false,
    "message": "Unauthorized access",
    "statusCode": 401
  }
  ```

- **403 Forbidden:**
  ```json
  {
    "success": false,
    "message": "You don't have permission to access this resource",
    "statusCode": 403
  }
  ```

- **404 Not Found:**
  ```json
  {
    "success": false,
    "message": "User not found",
    "statusCode": 404
  }
  ```

**Backend Behavior:**
- Verify user has Admin or Mentor role
- Fetch user data by ID from database
- Return 403 if user doesn't have required role
- Return 404 if user doesn't exist

---

## 6. Update User by Admin

**Endpoint:** `PATCH /api/users/{id}`
**Requires:** `Authorization: Bearer {token}`
**Roles:** Admin only

**Path Parameters:**
- `id` (string, GUID): User ID to update

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890",
  "careerInterests": ["Software Development", "AI", "Cloud Computing"],
  "careerGoals": "Become a Solutions Architect within 2 years",
  "profilePictureUrl": "https://example.com/profiles/john-new.jpg"
}
```

**Field Requirements:**
- `firstName` (optional): Min 2 chars, max 50 chars
- `lastName` (optional): Min 2 chars, max 50 chars
- `phoneNumber` (optional): Valid phone number format
- `careerInterests` (optional): Array of career interest names
- `careerGoals` (optional): Max 500 characters
- `profilePictureUrl` (optional): Valid URL format, max 200 chars

**Note:** All fields are optional. Only provided fields will be updated. Email cannot be changed via this endpoint.

**Success Response (200):**
```json
{
  "success": true,
  "message": "User profile with Id 550e8400-e29b-41d4-a716-446655440000 updated successfully.",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "emailConfirmed": true,
    "phoneNumber": "+1234567890",
    "profilePictureUrl": "https://example.com/profiles/john-new.jpg",
    "careerInterests": ["Software Development", "AI", "Cloud Computing"],
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

**Error Responses:**

- **400 Validation Error:**
  ```json
  {
    "success": false,
    "message": "Validation failed",
    "errors": {
      "FirstName": ["First name must be at least 2 characters"],
      "PhoneNumber": ["Invalid phone number format"]
    },
    "statusCode": 400
  }
  ```

- **401 Unauthorized:**
  ```json
  {
    "success": false,
    "message": "Unauthorized access",
    "statusCode": 401
  }
  ```

- **403 Forbidden:**
  ```json
  {
    "success": false,
    "message": "You don't have permission to access this resource",
    "statusCode": 403
  }
  ```

- **404 Not Found:**
  ```json
  {
    "success": false,
    "message": "User not found",
    "statusCode": 404
  }
  ```

**Backend Behavior:**
- Verify user has Admin role
- Validate all provided fields
- Update user record in database
- Return 403 if user doesn't have Admin role
- Return updated user data

---

## User Model Structure (RetrieveUserDto)

```typescript
{
  "id": "string (GUID)",
  "email": "string",
  "firstName": "string",
  "lastName": "string",
  "emailConfirmed": "boolean",
  "phoneNumber": "string | null",
  "profilePictureUrl": "string | null",
  "careerInterests": "string[] | null",  // Will be implemented with CareerInterest table
  "careerGoals": "string | null",
  "registrationDate": "ISO 8601 date string",
  "lastLoginDate": "ISO 8601 date string | null",
  "isActive": "boolean",
  "roles": "string[]",  // ["User"], ["Mentor"], or ["Admin"]
  "isMentor": "boolean",
  "mentorId": "string | null"
}
```

**Notes:** 
- `roles` contains the user's assigned roles in the system
- `isMentor` indicates if user has mentor status (approved mentor application)
- `mentorId` is null for regular users, populated for mentees

## Update User Model Structure (UpdateUserDto)

```typescript
{
  "firstName": "string | optional",
  "lastName": "string | optional",
  "phoneNumber": "string | optional",
  "profilePictureUrl": "string | optional",
  "careerInterests": "string[] | optional",
  "careerGoals": "string | optional"
}
```

**Note:** Email, password, and role cannot be changed through profile update endpoints.

---

## Validation Rules

### First Name / Last Name
- Required
- Min 2 characters
- Max 50 characters
- Trimmed whitespace

### Phone Number
- Optional
- Must match valid phone format if provided
- Regex: `/^[\d\s\-\+\(\)]+$/`

### Career Interests
- Optional
- Array of strings
- Each interest must be a valid category name
- Future: Will validate against CareerInterest table

### Career Goals
- Optional
- Max 500 characters
- Personal career goal statement

### Profile Picture URL
- Optional
- Must be valid URL format
- Should support common image formats (jpg, png, gif, webp)

---

## Security Considerations

### Authorization
- Verify JWT token on every request
- `/me` endpoints: Accessible to any authenticated user (operates on own profile)
- `GET /users` and `GET /users/{id}`: Require Admin or Mentor role
- `PATCH /users/{id}`: Require Admin role only
- Return 403 for unauthorized access attempts
- Extract user ID from JWT claims for `/me` endpoints

### Data Validation
- Server-side validation is required for all fields
- Don't trust client-side validation alone
- Sanitize input to prevent XSS attacks
- Validate career interests against available categories
- All update fields are optional (PATCH semantics)

### Privacy
- Don't expose sensitive information in error messages
- Log unauthorized access attempts
- Rate limit profile update requests (e.g., max 10 per hour)

---

## Testing Checklist

### GET /api/users/me
- [ ] Get current user profile with valid token
- [ ] Get profile without token (should return 401)

### PATCH /api/users/me
- [ ] Update own profile with valid data
- [ ] Update profile with invalid firstName (too short)
- [ ] Update profile with invalid phoneNumber
- [ ] Update profile with partial data (only some fields)
- [ ] Update profile without token (should return 401)
- [ ] Attempt to change email via update (should be ignored)

### DELETE /api/users/me
- [ ] Delete own account with valid token
- [ ] Delete account without token (should return 401)

### GET /api/users
- [ ] Get all users as Admin (should succeed)
- [ ] Get all users as Mentor (should succeed)
- [ ] Get all users as regular User (should fail with 403)
- [ ] Get all users without token (should return 401)

### GET /api/users/{id}
- [ ] Get user by ID as Admin (should succeed)
- [ ] Get user by ID as Mentor (should succeed)
- [ ] Get user by ID as regular User (should fail with 403)
- [ ] Get non-existent user (should return 404)
- [ ] Get user without token (should return 401)

### PATCH /api/users/{id}
- [ ] Update any user as Admin with valid data
- [ ] Update user as Mentor (should fail with 403)
- [ ] Update user as regular User (should fail with 403)
- [ ] Update non-existent user (should return 404)
- [ ] Update user with invalid data (should return 400)
- [ ] Update user without token (should return 401)

---

## Sample API Requests

**Get Current User Profile:**
```bash
GET http://localhost:5000/api/users/me
Authorization: Bearer {access-token}
```

**Update Current User Profile:**
```bash
PATCH http://localhost:5000/api/users/me
Authorization: Bearer {access-token}
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890",
  "careerInterests": ["Software Development", "AI"],
  "careerGoals": "Become a Solutions Architect"
}
```

**Delete Current User Account:**
```bash
DELETE http://localhost:5000/api/users/me
Authorization: Bearer {access-token}
```

**Get All Users (Admin/Mentor):**
```bash
GET http://localhost:5000/api/users
Authorization: Bearer {access-token}
```

**Get User by ID (Admin/Mentor):**
```bash
GET http://localhost:5000/api/users/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer {access-token}
```

**Update User by Admin:**
```bash
PATCH http://localhost:5000/api/users/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer {access-token}
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890",
  "careerInterests": ["Software Development", "AI"],
  "careerGoals": "Become a Solutions Architect"
}
```
