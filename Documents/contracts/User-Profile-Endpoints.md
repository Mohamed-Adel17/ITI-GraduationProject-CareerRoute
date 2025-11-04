# User Profile Endpoints API Contract

**Frontend Framework:** Angular 20.3.0
**Expected Backend:** ASP.NET Core 8.0 Web API
**Base URL:** `http://localhost:5000/api`

---

## Overview

User profile endpoints allow users to view and update their personal information. All endpoints require authentication via JWT Bearer token.

**Authorization Rules:**
- Users can view/update their own profile
- Admins can view/update any user profile

---

## 1. Get User Profile

**Endpoint:** `GET /api/users/{id}`
**Requires:** `Authorization: Bearer {token}`

**Path Parameters:**
- `id` (string, GUID): User ID to retrieve

**Success Response (200):**
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

- **403 Forbidden (viewing another user's profile):**
  ```json
  {
    "success": false,
    "message": "You can only view your own profile",
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
- Extract user ID from JWT token
- Check if requesting user has permission (own profile or admin)
- Fetch user data from database
- Return 403 if non-admin tries to view another user's profile
- Return 404 if user doesn't exist

---

## 2. Update User Profile

**Endpoint:** `PUT /api/users/{id}`
**Requires:** `Authorization: Bearer {token}`

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
- `firstName` (required): Min 2 chars, max 50 chars
- `lastName` (required): Min 2 chars, max 50 chars
- `phoneNumber` (optional): Valid phone number format
- `careerInterests` (optional): Array of career interest names
- `careerGoals` (optional): Max 500 characters
- `profilePictureUrl` (optional): Valid URL format

**Note:** Email cannot be changed via this endpoint.

**Success Response (200):**
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
      "FirstName": ["First name is required", "First name must be at least 2 characters"],
      "PhoneNumber": ["Invalid phone number format"]
    },
    "statusCode": 400
  }
  ```

- **403 Forbidden:**
  ```json
  {
    "success": false,
    "message": "You can only update your own profile",
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
- Extract user ID from JWT token
- Check if requesting user has permission (own profile or admin)
- Validate all fields
- Update user record in database
- Return 403 if non-admin tries to update another user's profile
- Return updated user data

---

## User Model Structure

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
- Each interest must be a valid category name from the categories table

### Career Goals
- Optional
- Max 500 characters

### Profile Picture URL
- Optional
- Must be valid URL format
- Should support common image formats (jpg, png, gif, webp)

---

## Security Considerations

### Authorization
- Verify JWT token on every request
- Check if user ID in token matches URL parameter
- Allow admins to bypass ownership check
- Return 403 for unauthorized access attempts

### Data Validation
- Server-side validation is required for all fields
- Don't trust client-side validation alone
- Sanitize input to prevent XSS attacks
- Validate career interests against categories table

### Privacy
- Don't expose sensitive information in error messages
- Log unauthorized access attempts
- Rate limit profile update requests (e.g., max 10 per hour)

---

## Testing Checklist

- [ ] Get own profile (authenticated user)
- [ ] Get another user's profile (should fail with 403 for non-admin)
- [ ] Get profile as admin (should succeed for any user)
- [ ] Get non-existent user (should return 404)
- [ ] Update own profile with valid data
- [ ] Update profile with invalid firstName (too short)
- [ ] Update profile with invalid phoneNumber
- [ ] Update profile with empty required fields
- [ ] Update another user's profile as non-admin (should fail with 403)
- [ ] Update any user's profile as admin (should succeed)
- [ ] Attempt to change email via update (should be ignored/rejected)

---

## Sample API Requests

**Get Current User Profile:**
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
  "careerInterests": ["Software Development", "AI"],
  "careerGoals": "Become a Solutions Architect"
}
```
