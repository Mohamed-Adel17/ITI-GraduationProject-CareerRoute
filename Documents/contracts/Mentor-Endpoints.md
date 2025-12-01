# Mentor Endpoints API Contract

**Frontend Framework:** Angular 20.3.0
**Expected Backend:** ASP.NET Core 8.0 Web API
**Base URL:** `http://localhost:5000/api`

---

## Overview

Mentor endpoints handle the complete mentor lifecycle: public discovery, mentor applications, profile management, and admin approval workflow. These endpoints support mentor search, browse, profile management, and the mentor onboarding process.

**Authorization Rules:**
- Public endpoints: Search, browse, and view mentor profiles (no authentication required)
- Authenticated endpoints: Apply as mentor, update own profile
- Admin endpoints: Review applications, approve/reject mentors
- Rate limiting: 100 requests per minute per IP for public search endpoints

---

## Related Documentation

- **📖 API Endpoints Index**: See [API-Endpoints-Index.md](./API-Endpoints-Index.md) for complete endpoint directory and cross-references

- **Category Management**: See [Category-Endpoints.md](./Category-Endpoints.md) for:
  - Full documentation of `GET /api/categories` and `GET /api/categories/{id}/mentors`
  - Category CRUD operations (create, update, delete - admin only)
  - Complete CategoryDto model structure
  
- **Skills Management**: See [Skills-Endpoints.md](./Skills-Endpoints.md) for:
  - Skills CRUD operations (admin only)
  - Complete SkillDto model structure
  
- **Skills System Overview**: See [Skills-System-Overview.md](./Skills-System-Overview.md) for high-level overview of the unified skills system

**📖 Single Source of Truth:**
- `GET /api/categories` - Fully documented in **Category-Endpoints.md**
- `GET /api/categories/{id}/mentors` - Fully documented in **Category-Endpoints.md**
- This document provides quick summaries and cross-references for mentor discovery context

---

## Public Endpoints (No Authentication Required)

### 1. Get All Approved Mentors

**Endpoint:** `GET /api/mentors`
**Requires:** None (public access)
**Roles:** Public

**Query Parameters:**
- `keywords` (string, optional): Search in name, bio, expertise tags (min: 2 chars)
- `categoryId` (integer, optional): Filter by specific category ID
- `minPrice` (decimal, optional): Minimum session price (30min rate, min: 0)
- `maxPrice` (decimal, optional): Maximum session price (30min rate)
- `minRating` (decimal, optional): Minimum average rating (min: 0, max: 5)
- `sortBy` (string, optional): Sort criteria (default: "popularity")
  - `popularity` - Total sessions completed (default)
  - `rating` - Average rating (highest first)
  - `priceAsc` - Price lowest to highest
  - `priceDesc` - Price highest to lowest
- `page` (integer, optional): Page number (default: 1, min: 1)
- `pageSize` (integer, optional): Items per page (default: 12, min: 1, max: 50)

**Note:** If no query parameters provided, returns all approved mentors.

**Success Response (200) - Without Pagination:**
```json
{
  "success": true,
  "message": "Mentors retrieved successfully",
  "data": [
    {
      "id": "cc0e8400-e29b-41d4-a716-446655440007",
      "firstName": "Sarah",
      "lastName": "Johnson",
      "fullName": "Sarah Johnson",
      "email": "sarah.johnson@example.com",
      "profilePictureUrl": "https://example.com/profiles/sarah.jpg",
      "bio": "Full-stack developer with 8 years experience in enterprise software. Specialized in React, Node.js, and AWS cloud architecture. Helped 50+ developers transition to senior roles.",
      "expertiseTags": [
        { "id": 15, "name": "React", "categoryId": 3, "categoryName": "IT Careers & Technical Consultation" },
        { "id": 20, "name": "System Design", "categoryId": 3, "categoryName": "IT Careers & Technical Consultation" },
        { "id": 25, "name": "AWS", "categoryId": 3, "categoryName": "IT Careers & Technical Consultation" }
      ],
      "yearsOfExperience": 8,
      "certifications": "AWS Certified Solutions Architect - Professional, Google Cloud Professional Cloud Architect",
      "rate30Min": 25.00,
      "rate60Min": 45.00,
      "averageRating": 4.8,
      "totalReviews": 67,
      "totalSessionsCompleted": 142,
      "isVerified": true,
      "approvalStatus": "Approved",
      "createdAt": "2025-01-15T10:30:00Z",
      "updatedAt": "2025-10-29T14:20:00Z",
      "categories": [
        {
          "id": 1,
          "name": "IT Careers",
          "description": "Software development, cloud computing, DevOps",
          "iconUrl": "https://example.com/icons/it-careers.svg"
        }
      ],
      "responseTime": "within 2 hours",
      "completionRate": 98.5,
      "isAvailable": true
    }
  ]
}
```

**Success Response (200) - With Pagination:**
```json
{
  "success": true,
  "message": "Search completed successfully",
  "data": {
    "mentors": [
      {
        "id": "cc0e8400-e29b-41d4-a716-446655440007",
        "firstName": "Sarah",
        "lastName": "Johnson",
        "fullName": "Sarah Johnson",
        "email": "sarah.johnson@example.com",
        "profilePictureUrl": "https://example.com/profiles/sarah.jpg",
        "bio": "Full-stack developer with 8 years experience in enterprise software...",
        "expertiseTags": [
          { "id": 15, "name": "React", "categoryId": 3, "categoryName": "IT Careers & Technical Consultation" },
          { "id": 20, "name": "System Design", "categoryId": 3, "categoryName": "IT Careers & Technical Consultation" },
          { "id": 25, "name": "AWS", "categoryId": 3, "categoryName": "IT Careers & Technical Consultation" }
        ],
        "yearsOfExperience": 8,
        "certifications": "AWS Certified Solutions Architect - Professional",
        "rate30Min": 25.00,
        "rate60Min": 45.00,
        "averageRating": 4.8,
        "totalReviews": 67,
        "totalSessionsCompleted": 142,
        "isVerified": true,
        "approvalStatus": "Approved",
        "createdAt": "2025-01-15T10:30:00Z",
        "updatedAt": "2025-10-29T14:20:00Z",
        "categories": [
          {
            "id": 1,
            "name": "IT Careers",
            "description": "Software development, cloud computing, DevOps",
            "iconUrl": "https://example.com/icons/it-careers.svg"
          }
        ],
        "responseTime": "within 2 hours",
        "completionRate": 98.5,
        "isAvailable": true
      }
    ],
    "pagination": {
      "totalCount": 23,
      "currentPage": 1,
      "pageSize": 12,
      "totalPages": 2,
      "hasNextPage": true,
      "hasPreviousPage": false
    },
    "appliedFilters": {
      "keywords": "full-stack developer",
      "categoryId": 1,
      "minPrice": null,
      "maxPrice": null,
      "minRating": 4.5,
      "sortBy": "rating"
    }
  }
}
```

**Error Responses:**

- **400 Bad Request (Invalid Parameters):**
  ```json
  {
    "success": false,
    "message": "Validation failed",
    "errors": {
      "Keywords": ["Keywords must be at least 2 characters"],
      "MinRating": ["Minimum rating must be between 0 and 5"],
      "PageSize": ["Page size must be between 1 and 50"]
    },
    "statusCode": 400
  }
  ```

- **404 Not Found:**
  ```json
  {
    "success": false,
    "message": "No mentors found matching your criteria",
    "statusCode": 404
  }
  ```

**Backend Behavior:**
- If no query parameters: Return all approved mentors
- If page/pageSize provided: Return paginated result with metadata
- Validate all query parameters
- Build dynamic query with WHERE clauses for each filter
- Apply keyword search using LIKE or Full-Text Search on FirstName, LastName, Bio, and **Skill.Name** (joined from UserSkills)
- Calculate relevance score based on keyword match
- Apply sorting (default: popularity = TotalSessionsCompleted DESC)
- Include appliedFilters in response for frontend state management
- Return 404 if no results match criteria
- **Skills Integration**: Join mentor's UserSkills to get expertiseTags with full SkillDto structure

---

### 2. Search Mentors by Keywords

**Endpoint:** `GET /api/mentors/search`
**Requires:** None (public access)
**Roles:** Public

**Query Parameters:**
- `searchTerm` (string, required): Search term to match (min: 2 chars)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Search completed successfully",
  "data": [
    {
      "id": "cc0e8400-e29b-41d4-a716-446655440007",
      "firstName": "Sarah",
      "lastName": "Johnson",
      "fullName": "Sarah Johnson",
      "email": "sarah.johnson@example.com",
      "profilePictureUrl": "https://example.com/profiles/sarah.jpg",
      "bio": "Full-stack developer with 8 years experience...",
      "expertiseTags": [
        { "id": 15, "name": "React", "categoryId": 3, "categoryName": "IT Careers & Technical Consultation" },
        { "id": 18, "name": "Node.js", "categoryId": 3, "categoryName": "IT Careers & Technical Consultation" },
        { "id": 25, "name": "AWS", "categoryId": 3, "categoryName": "IT Careers & Technical Consultation" }
      ],
      "yearsOfExperience": 8,
      "certifications": "AWS Certified Solutions Architect - Professional",
      "rate30Min": 25.00,
      "rate60Min": 45.00,
      "averageRating": 4.8,
      "totalReviews": 67,
      "totalSessionsCompleted": 142,
      "isVerified": true,
      "approvalStatus": "Approved",
      "createdAt": "2025-01-15T10:30:00Z",
      "updatedAt": "2025-10-29T14:20:00Z"
    }
  ]
}
```

**Error Responses:**

- **400 Bad Request:**
  ```json
  {
    "success": false,
    "message": "Search term must be at least 2 characters",
    "statusCode": 400
  }
  ```

- **404 Not Found:**
  ```json
  {
    "success": false,
    "message": "No mentors found matching your search",
    "statusCode": 404
  }
  ```

**Backend Behavior:**
- Search in FirstName, LastName, Bio, and **Skill.Name** (from joined UserSkills table)
- Case-insensitive matching
- Return empty array wrapped in success response if no matches
- Only return approved mentors
- **Skills Integration**: Include full SkillDto objects in expertiseTags field

---

### 3. Get Top-Rated Mentors

**Endpoint:** `GET /api/mentors/top-rated`
**Requires:** None (public access)
**Roles:** Public

**Query Parameters:**
- `count` (integer, optional): Number of mentors to return (default: 10, min: 1, max: 100)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Top-rated mentors retrieved successfully",
  "data": [
    {
      "id": "cc0e8400-e29b-41d4-a716-446655440007",
      "firstName": "Sarah",
      "lastName": "Johnson",
      "fullName": "Sarah Johnson",
      "email": "sarah.johnson@example.com",
      "profilePictureUrl": "https://example.com/profiles/sarah.jpg",
      "bio": "Full-stack developer with 8 years experience...",
      "expertiseTags": [
        { "id": 15, "name": "React", "categoryId": 3, "categoryName": "IT Careers & Technical Consultation" },
        { "id": 18, "name": "Node.js", "categoryId": 3, "categoryName": "IT Careers & Technical Consultation" },
        { "id": 25, "name": "AWS", "categoryId": 3, "categoryName": "IT Careers & Technical Consultation" }
      ],
      "yearsOfExperience": 8,
      "certifications": "AWS Certified Solutions Architect - Professional",
      "rate30Min": 25.00,
      "rate60Min": 45.00,
      "averageRating": 4.9,
      "totalReviews": 89,
      "totalSessionsCompleted": 203,
      "isVerified": true,
      "approvalStatus": "Approved",
      "createdAt": "2025-01-10T08:15:00Z",
      "updatedAt": "2025-10-30T09:45:00Z"
    }
  ]
}
```

**Error Responses:**

- **400 Bad Request:**
  ```json
  {
    "success": false,
    "message": "Count must be between 1 and 100",
    "statusCode": 400
  }
  ```

**Backend Behavior:**
- Order by AverageRating DESC, then TotalReviews DESC
- Limit to specified count
- Only return approved mentors
- Only include mentors with at least 1 review

---

### 4. Get Mentor Profile by ID

**Endpoint:** `GET /api/mentors/{id}`
**Requires:** None (public access)
**Roles:** Public

**Path Parameters:**
- `id` (string, GUID): Mentor ID

**Success Response (200):**
```json
{
  "success": true,
  "message": "Mentor profile retrieved successfully",
  "data": {
    "id": "cc0e8400-e29b-41d4-a716-446655440007",
    "firstName": "Sarah",
    "lastName": "Johnson",
    "fullName": "Sarah Johnson",
    "email": "sarah.johnson@example.com",
    "profilePictureUrl": "https://example.com/profiles/sarah.jpg",
    "bio": "Full-stack developer with 8 years of experience building scalable enterprise software. Currently working as a Senior Software Engineer at a Fortune 500 company.\n\nI specialize in modern web technologies including React, Node.js, TypeScript, and AWS cloud architecture. My passion is helping developers at all levels accelerate their careers through personalized mentorship.\n\nWhether you're looking to:\n- Break into tech from a non-traditional background\n- Transition from junior to senior developer\n- Navigate complex system design interviews\n- Build production-ready full-stack applications\n- Master cloud architecture and DevOps practices\n\nI've successfully mentored 50+ developers through career transitions, technical interview preparation, and skill development. My approach is hands-on, practical, and tailored to your specific goals.",
    "expertiseTags": [
      { "id": 15, "name": "React", "categoryId": 3, "categoryName": "IT Careers & Technical Consultation" },
      { "id": 18, "name": "Node.js", "categoryId": 3, "categoryName": "IT Careers & Technical Consultation" },
      { "id": 22, "name": "TypeScript", "categoryId": 3, "categoryName": "IT Careers & Technical Consultation" },
      { "id": 25, "name": "AWS", "categoryId": 3, "categoryName": "IT Careers & Technical Consultation" },
      { "id": 30, "name": "System Design", "categoryId": 3, "categoryName": "IT Careers & Technical Consultation" },
      { "id": 5, "name": "Career Shifting", "categoryId": 1, "categoryName": "Career Development" },
      { "id": 8, "name": "Interview Preparation", "categoryId": 1, "categoryName": "Career Development" }
    ],
    "yearsOfExperience": 8,
    "certifications": "AWS Certified Solutions Architect - Professional, Google Cloud Professional Cloud Architect, Meta React Developer Certificate",
    "rate30Min": 25.00,
    "rate60Min": 45.00,
    "averageRating": 4.8,
    "totalReviews": 67,
    "totalSessionsCompleted": 142,
    "isVerified": true,
    "approvalStatus": "Approved",
    "createdAt": "2025-01-15T10:30:00Z",
    "updatedAt": "2025-10-29T14:20:00Z",
    "categories": [
      {
        "id": 1,
        "name": "IT Careers",
        "description": "Software development, cloud computing, DevOps, cybersecurity, and technical career guidance",
        "iconUrl": "https://example.com/icons/it-careers.svg"
      }
    ],
    "responseTime": "within 2 hours",
    "completionRate": 98.5,
    "isAvailable": true,
    "recentReviews": [
      {
        "id": "11111111-e29b-41d4-a716-446655440011",
        "rating": 5,
        "reviewText": "Sarah is an exceptional mentor! She helped me prepare for system design interviews and I landed my dream job.",
        "reviewerFirstName": "David",
        "reviewerLastNameInitial": "K.",
        "sessionDate": "2025-10-15T14:00:00Z",
        "createdAt": "2025-10-15T15:30:00Z"
      },
      {
        "id": "22222222-e29b-41d4-a716-446655440012",
        "rating": 5,
        "reviewText": "Highly recommend! Sarah's expertise in React and AWS helped me build confidence in my skills.",
        "reviewerFirstName": "Emily",
        "reviewerLastNameInitial": "R.",
        "sessionDate": "2025-10-10T10:00:00Z",
        "createdAt": "2025-10-10T11:00:00Z"
      }
    ],
    "availabilityPreview": {
      "hasAvailability": true,
      "nextAvailableSlot": "2025-11-10T14:00:00Z",
      "totalSlotsNext7Days": 12
    }
  }
}
```

**Error Responses:**

- **404 Not Found:**
  ```json
  {
    "success": false,
    "message": "Mentor not found",
    "statusCode": 404
  }
  ```

**Backend Behavior:**
- Fetch mentor by ID including all relationships
- Only return approved mentors
- Include up to 5 most recent reviews
- Calculate availability preview for next 7 days
- Calculate responseTime based on average response to bookings
- Calculate completionRate (completed / total booked sessions)
- Return 404 if mentor doesn't exist or is not approved

---

### 5. Get All Categories (Quick Reference)

**Endpoint:** `GET /api/categories`
**Requires:** None (public access)
**Roles:** Public

**📖 Full Documentation:** See [Category-Endpoints.md - Section 1: Get All Categories](./Category-Endpoints.md#1-get-all-categories)

**Quick Summary:**
- Returns all active categories with mentor counts
- Public endpoint (no authentication required)
- Sorted alphabetically by name
- Includes `mentorCount` for each category (count of approved mentors)
- Used for category browsing, filtering, and mentor discovery

**Typical Use Cases:**
- Display category list on mentor search page
- Populate category filter dropdowns
- Show mentor distribution across categories
- Category-based navigation

**Note:** For admin operations (create, update, delete categories), see the full documentation in Category-Endpoints.md.

---

### 6. Get Mentors by Category (Quick Reference)

**Endpoint:** `GET /api/categories/{id}/mentors`
**Requires:** None (public access)
**Roles:** Public

**📖 Full Documentation:** See [Category-Endpoints.md - Section 6: Get Mentors by Category](./Category-Endpoints.md#6-get-mentors-by-category)

**Quick Summary:**
- Returns mentors filtered by specific category
- Supports pagination (default: 12 per page, max: 50)
- Supports sorting: `popularity` (default), `rating`, `priceAsc`, `priceDesc`
- Includes category details and pagination metadata
- Only returns approved and active mentors

**Path Parameters:**
- `id` (integer): Category ID

**Query Parameters:**
- `page`, `pageSize`, `sortBy` (see full documentation)

**Typical Use Cases:**
- Browse mentors within a specific category
- Category-specific mentor listing pages
- Filtered mentor discovery by expertise area

**Note:** This endpoint complements `GET /api/mentors` (endpoint #1) which provides cross-category search with more advanced filtering options.

---

## Authenticated Endpoints (Require Authentication)

### 7. Get Current Mentor's Own Profile

**Endpoint:** `GET /api/mentors/me`
**Requires:** `Authorization: Bearer {token}`
**Roles:** Authenticated user with mentor profile (IsMentor = true)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Mentor profile retrieved successfully",
  "data": {
    "id": "cc0e8400-e29b-41d4-a716-446655440007",
    "firstName": "Sarah",
    "lastName": "Johnson",
    "fullName": "Sarah Johnson",
    "email": "sarah.johnson@example.com",
    "profilePictureUrl": "https://example.com/profiles/sarah.jpg",
    "bio": "Full-stack developer with 8 years of experience...",
    "expertiseTags": [
      { "id": 15, "name": "React", "categoryId": 3, "categoryName": "IT Careers & Technical Consultation" },
      { "id": 18, "name": "Node.js", "categoryId": 3, "categoryName": "IT Careers & Technical Consultation" }
    ],
    "yearsOfExperience": 8,
    "certifications": "AWS Certified Solutions Architect - Professional",
    "rate30Min": 25.00,
    "rate60Min": 45.00,
    "averageRating": 4.8,
    "totalReviews": 67,
    "totalSessionsCompleted": 142,
    "isVerified": true,
    "approvalStatus": "Approved",
    "createdAt": "2025-01-15T10:30:00Z",
    "updatedAt": "2025-10-29T14:20:00Z"
  }
}
```

**Error Responses:**

- **401 Unauthorized:**
  ```json
  {
    "success": false,
    "message": "Invalid authentication token",
    "statusCode": 401
  }
  ```

- **404 Not Found:**
  ```json
  {
    "success": false,
    "message": "Mentor profile not found",
    "statusCode": 404
  }
  ```

**Backend Behavior:**
- Extract user ID from JWT token claims
- Fetch mentor profile for current user
- Return complete mentor profile including approval status
- Return 404 if user doesn't have a mentor profile (IsMentor = false)
- **Authorization**: Does NOT require Mentor role - users can access their mentor profile even while pending approval

**Note:** This endpoint allows users to check their mentor application status and profile details before admin approval.

---

### 8. Apply to Become a Mentor

**Endpoint:** `POST /api/mentors`
**Requires:** `Authorization: Bearer {token}`
**Roles:** Any authenticated user

**Request Body:**
```json
{
  "bio": "Full-stack developer with 8 years of experience building scalable enterprise software...",
  "expertiseTagIds": [
    0
  ],
  "yearsOfExperience": 8,
  "certifications": "AWS Certified Solutions Architect - Professional, Google Cloud Professional Cloud Architect",
  "rate30Min": 25.00,
  "rate60Min": 45.00,
  "categoryIds": [
    0
  ]
}
```

**Field Requirements:**
- `bio` (required): Min 50 chars, max 1000 chars - describe your background and what you can help with
- `yearsOfExperience` (required): Min 0, integer
- `certifications` (optional): Max 500 chars
- `rate30Min` (required): Decimal, min 0, max 10000
- `rate60Min` (required): Decimal, min 0, max 10000

**Success Response (201):**
```json
{
  "success": true,
  "message": "Mentor application submitted successfully! Your application is pending approval.",
  "data": {
    "id": "cc0e8400-e29b-41d4-a716-446655440007",
    "firstName": "Sarah",
    "lastName": "Johnson",
    "fullName": "Sarah Johnson",
    "email": "sarah.johnson@example.com",
    "profilePictureUrl": "https://example.com/profiles/sarah.jpg",
    "bio": "Full-stack developer with 8 years of experience...",
    "expertiseTags": [
      {
        "id": 0,
        "name": "string",
        "categoryId": 0,
        "categoryName": "string",
        "isActive": true
      }
    ],
    "yearsOfExperience": 8,
    "certifications": "AWS Certified Solutions Architect - Professional, Google Cloud Professional Cloud Architect",
    "rate30Min": 25.00,
    "rate60Min": 45.00,
    "averageRating": 0,
    "totalReviews": 0,
    "totalSessionsCompleted": 0,
    "isVerified": false,
    "approvalStatus": "Pending",
    "createdAt": "2025-11-10T10:00:00Z",
    "updatedAt": null
  }
}
```

**Error Responses:**

- **400 Bad Request (Validation):**
  ```json
  {
    "success": false,
    "message": "Validation failed",
    "errors": {
      "Bio": ["Bio must be at least 50 characters"],
      "YearsOfExperience": ["Years of experience is required"],
      "Rate30Min": ["30-minute rate is required"]
    },
    "statusCode": 400
  }
  ```

- **400 Bad Request (Already Applied):**
  ```json
  {
    "success": false,
    "message": "You already have a mentor profile",
    "statusCode": 400
  }
  ```

- **401 Unauthorized:**
  ```json
  {
    "success": false,
    "message": "Invalid authentication token",
    "statusCode": 401
  }
  ```

**Backend Behavior:**
- Extract user ID from JWT token
- Check if user already has a mentor profile (return 400 if exists)
- Validate all required fields
- Create mentor profile with `approvalStatus: "Pending"`
- Set `IsMentor = true` flag on user account
- Set default values: averageRating=0, totalReviews=0, totalSessionsCompleted=0, isVerified=false
- Notify admins of new application (optional)
- Return created mentor profile

**Note:** After approval by admin, mentor should add expertise tags using the `expertiseTagIds` field in `PATCH /api/mentors/me` endpoint

---

### 9. Update Current Mentor's Own Profile

**Endpoint:** `PATCH /api/mentors/me`
**Requires:** `Authorization: Bearer {token}`
**Roles:** Authenticated user with mentor profile (IsMentor = true)

**Request Body:**
```json
{
  "firstName": "Sarah",
  "lastName": "Johnson",
  "phoneNumber": "+1234567890",
  "profilePictureUrl": "https://example.com/profiles/sarah-new.jpg",
  "bio": "Updated bio...",
  "yearsOfExperience": 9,
  "certifications": "Updated certifications...",
  "rate30Min": 30.00,
  "rate60Min": 50.00,
  "expertiseTagIds": [5, 15, 20, 25, 30],
  "isAvailable": true,
  "categoryIds": [1, 3]
}
```

**Field Requirements:**

**User-related fields:**
- `firstName` (optional): Min 2 chars, max 50 chars
- `lastName` (optional): Min 2 chars, max 50 chars
- `phoneNumber` (optional): Valid phone number format
- `profilePictureUrl` (optional): Valid URL format, max 200 chars

**Mentor-specific fields:**
- `bio` (optional): Min 50 chars, max 1000 chars
- `yearsOfExperience` (optional): Min 0, integer
- `certifications` (optional): Max 500 chars
- `rate30Min` (optional): Decimal, min 0, max 10000
- `rate60Min` (optional): Decimal, min 0, max 10000
- `isAvailable` (optional): Boolean - availability status
- `expertiseTagIds` (optional): Array of skill IDs (integers), all IDs must be valid active skills, empty array [] clears all expertise tags
- `categoryIds` (optional): Array of category IDs (integers), 1-5 categories

**Note:** All fields are optional. Only provided fields will be updated.

**Success Response (200):**
```json
{
  "success": true,
  "message": "Mentor profile updated successfully",
  "data": {
    "id": "cc0e8400-e29b-41d4-a716-446655440007",
    "firstName": "Sarah",
    "lastName": "Johnson",
    "fullName": "Sarah Johnson",
    "email": "sarah.johnson@example.com",
    "profilePictureUrl": "https://example.com/profiles/sarah.jpg",
    "bio": "Updated bio...",
    "expertiseTags": [
      { "id": 15, "name": "React", "categoryId": 3, "categoryName": "IT Careers & Technical Consultation" }
    ],
    "yearsOfExperience": 9,
    "certifications": "Updated certifications...",
    "rate30Min": 30.00,
    "rate60Min": 50.00,
    "averageRating": 4.8,
    "totalReviews": 67,
    "totalSessionsCompleted": 142,
    "isVerified": true,
    "approvalStatus": "Approved",
    "createdAt": "2025-01-15T10:30:00Z",
    "updatedAt": "2025-11-10T11:00:00Z"
  }
}
```

**Error Responses:**

- **400 Bad Request:**
  ```json
  {
    "success": false,
    "message": "Validation failed",
    "errors": {
      "FirstName": ["First name must be at least 2 characters"],
      "Bio": ["Bio must be at least 50 characters"],
      "ExpertiseTagIds": ["One or more skill IDs are invalid or inactive"],
      "ProfilePictureUrl": ["Profile picture URL must be a valid URL"]
    },
    "statusCode": 400
  }
  ```

- **401 Unauthorized:**
  ```json
  {
    "success": false,
    "message": "Invalid authentication token",
    "statusCode": 401
  }
  ```

- **404 Not Found:**
  ```json
  {
    "success": false,
    "message": "Mentor not found",
    "statusCode": 404
  }
  ```

**Backend Behavior:**
- Extract user ID from JWT token claims
- Fetch mentor profile for current user
- Validate all provided fields
- Update only provided fields (PATCH semantics)
- **User fields**: Update ApplicationUser entity (FirstName, LastName, PhoneNumber, ProfilePictureUrl)
- **Mentor fields**: Update Mentor entity (Bio, YearsOfExperience, Certifications, Rates, IsAvailable)
- If `expertiseTagIds` is provided:
  - Validate all skill IDs exist and are active
  - Use database transaction: DELETE existing UserSkills for mentor's UserId, INSERT new UserSkills for provided IDs
  - Empty array [] clears all expertise tags
- Update `updatedAt` timestamp
- **Skills Integration**: Join mentor's UserSkills to get expertiseTags with full SkillDto structure in response
- Return updated mentor profile
- Return 404 if user doesn't have a mentor profile
- **Authorization**: Does NOT require Mentor role - users can update their mentor profile even while pending approval

---

## Admin Endpoints (Require Admin Role)

### 10. Get Pending Mentor Applications

**Endpoint:** `GET /api/mentors/pending`
**Requires:** `Authorization: Bearer {token}`
**Roles:** Admin only

**Success Response (200):**
```json
{
  "success": true,
  "message": "Pending mentor applications retrieved successfully",
  "data": [
    {
      "id": "cc0e8400-e29b-41d4-a716-446655440007",
      "firstName": "Sarah",
      "lastName": "Johnson",
      "fullName": "Sarah Johnson",
      "email": "sarah.johnson@example.com",
      "profilePictureUrl": "https://example.com/profiles/sarah.jpg",
      "bio": "Full-stack developer with 8 years of experience...",
      "expertiseTags": [],
      "yearsOfExperience": 8,
      "certifications": "AWS Certified Solutions Architect - Professional",
      "rate30Min": 25.00,
      "rate60Min": 45.00,
      "averageRating": 0,
      "totalReviews": 0,
      "totalSessionsCompleted": 0,
      "isVerified": false,
      "approvalStatus": "Pending",
      "createdAt": "2025-11-10T10:00:00Z",
      "updatedAt": null
    }
  ]
}
```

**Error Responses:**

- **401 Unauthorized:**
  ```json
  {
    "success": false,
    "message": "Invalid authentication token",
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

**Backend Behavior:**
- Verify user has Admin role
- Fetch all mentor profiles with `approvalStatus: "Pending"`
- Order by createdAt DESC (newest first)
- Return empty array if no pending applications
- Return 403 if user is not Admin

---

### 11. Approve Mentor Application

**Endpoint:** `PATCH /api/mentors/{id}/approve`
**Requires:** `Authorization: Bearer {token}`
**Roles:** Admin only

**Path Parameters:**
- `id` (string, GUID): Mentor ID to approve

**Success Response (200):**
```json
{
  "success": true,
  "message": "Mentor approved successfully"
}
```

**Error Responses:**

- **400 Bad Request:**
  ```json
  {
    "success": false,
    "message": "Mentor is already approved",
    "statusCode": 400
  }
  ```

- **401 Unauthorized:**
  ```json
  {
    "success": false,
    "message": "Invalid authentication token",
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
    "message": "Mentor not found",
    "statusCode": 404
  }
  ```

**Backend Behavior:**
- Verify user has Admin role
- Fetch mentor by ID
- Check if mentor is in "Pending" status (return 400 if already approved/rejected)
- Update `approvalStatus: "Approved"`
- Update `isVerified: true` and `isAvailable: true`
- Ensure `IsMentor = true` flag is set on user account (defensive check)
- Update `updatedAt` timestamp
- Add "Mentor" role to user account
- Send approval notification email to mentor
- Return success message
- Return 403 if user is not Admin

---

### 12. Reject Mentor Application

**Endpoint:** `PATCH /api/mentors/{id}/reject`
**Requires:** `Authorization: Bearer {token}`
**Roles:** Admin only

**Path Parameters:**
- `id` (string, GUID): Mentor ID to reject

**Request Body:**
```json
{
  "reason": "Profile does not meet our minimum experience requirements"
}
```

**Field Requirements:**
- `reason` (required): Min 10 chars, max 500 chars - reason for rejection

**Success Response (200):**
```json
{
  "success": true,
  "message": "Mentor application rejected"
}
```

**Error Responses:**

- **400 Bad Request (Validation):**
  ```json
  {
    "success": false,
    "message": "Validation failed",
    "errors": {
      "Reason": ["Rejection reason is required", "Reason must be at least 10 characters"]
    },
    "statusCode": 400
  }
  ```

- **400 Bad Request (Status):**
  ```json
  {
    "success": false,
    "message": "Mentor application has already been processed",
    "statusCode": 400
  }
  ```

- **401 Unauthorized:**
  ```json
  {
    "success": false,
    "message": "Invalid authentication token",
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
    "message": "Mentor not found",
    "statusCode": 404
  }
  ```

**Backend Behavior:**
- Verify user has Admin role
- Fetch mentor by ID
- Check if mentor is in "Pending" status (return 400 if already approved/rejected)
- Update `approvalStatus: "Rejected"`
- Store rejection reason (consider adding `rejectionReason` field to Mentor model)
- Update `updatedAt` timestamp
- Send rejection notification email to user with reason
- Return success message
- Return 403 if user is not Admin

---

---

## Model Structures

### MentorProfileDto
```typescript
{
  "id": "string (GUID)",
  "firstName": "string",
  "lastName": "string",
  "fullName": "string",
  "email": "string",
  "profilePictureUrl": "string | null",
  "bio": "string | null",
  "expertiseTags": "SkillDto[]",                 // Array of skill objects (not strings)
  "yearsOfExperience": "number | null",
  "certifications": "string | null",
  "rate30Min": "decimal",
  "rate60Min": "decimal",
  "averageRating": "decimal",
  "totalReviews": "number",
  "totalSessionsCompleted": "number",
  "isVerified": "boolean",
  "approvalStatus": "string (Pending | Approved | Rejected)",
  "createdAt": "ISO 8601 date string",
  "updatedAt": "ISO 8601 date string | null",
  
  // Optional fields (populated based on context)
  "categories": "CategoryDto[] | null",
  "responseTime": "string | null",           // e.g., "within 2 hours"
  "completionRate": "decimal | null",        // Percentage (e.g., 98.5)
  "isAvailable": "boolean | null",
  "recentReviews": "ReviewPreviewDto[] | null",    // Up to 5 most recent
  "availabilityPreview": "AvailabilityPreviewDto | null"
}
```

**Notes:**
- `expertiseTags` is an array of SkillDto objects (see [Skills-Endpoints.md](./Skills-Endpoints.md) for SkillDto structure)
- `expertiseTags` represents mentor's consultation areas (both career guidance and technical skills)
- Update mentor expertise using the `expertiseTagIds` field in `PATCH /api/mentors/{id}` endpoint
- `rate30Min` and `rate60Min` are pricing for session durations
- Optional fields are populated in detail view (GET /api/mentors/{id})

### CreateMentorProfileDto
```typescript
{
  "bio": "string",                        // Required: Min 50, max 1000 chars
  "yearsOfExperience": "number",          // Required: Min 0, integer
  "certifications": "string | optional",  // Optional: Max 500 chars
  "rate30Min": "decimal",                 // Required: Min 0, max 10000
  "rate60Min": "decimal"                  // Required: Min 0, max 10000
}
```

### UpdateMentorProfileDto
```typescript
{
  // User-related fields
  "firstName": "string | optional",         // Optional: Min 2, max 50 chars
  "lastName": "string | optional",          // Optional: Min 2, max 50 chars
  "phoneNumber": "string | optional",       // Optional: Valid phone format
  "profilePictureUrl": "string | optional", // Optional: Valid URL, max 200 chars
  
  // Mentor-specific fields
  "bio": "string | optional",               // Optional: Min 50, max 1000 chars
  "yearsOfExperience": "number | optional", // Optional: Min 0, integer
  "certifications": "string | optional",    // Optional: Max 500 chars
  "rate30Min": "decimal | optional",        // Optional: Min 0, max 10000
  "rate60Min": "decimal | optional",        // Optional: Min 0, max 10000
  "isAvailable": "boolean | optional",      // Optional: Availability status
  "expertiseTagIds": "number[] | optional", // Optional: Array of skill IDs, empty array [] clears all
  "categoryIds": "number[] | optional"      // Optional: Array of category IDs, 1-5 categories
}
```

**Note:** All fields are optional. Only provided fields will be updated. User-related fields update the ApplicationUser entity, while mentor-specific fields update the Mentor entity.

### RejectMentorDto
```typescript
{
  "reason": "string"  // Required: Min 10, max 500 chars
}
```

### CategoryDto
```typescript
{
  "id": "number",
  "name": "string",
  "description": "string | null",
  "iconUrl": "string | null",
  "mentorCount": "number | null",
  "isActive": "boolean",
  "createdAt": "ISO 8601 date string",
  "updatedAt": "ISO 8601 date string | null"
}
```

**Notes:**
- `mentorCount` is populated in mentor discovery contexts
- **📖 Full Model Documentation:** See [Category-Endpoints.md - Category Model Structure](./Category-Endpoints.md#category-model-structure-categoryDto)

### PaginatedMentorResult
```typescript
{
  "mentors": "MentorProfileDto[]",
  "pagination": {
    "totalCount": "number",
    "currentPage": "number",
    "pageSize": "number",
    "totalPages": "number",
    "hasNextPage": "boolean",
    "hasPreviousPage": "boolean"
  },
  "appliedFilters": {
    "keywords": "string | null",
    "categoryId": "number | null",
    "minPrice": "decimal | null",
    "maxPrice": "decimal | null",
    "minRating": "decimal | null",
    "sortBy": "string"
  }
}
```

**Notes:**
- Returned when pagination parameters are provided
- `appliedFilters` helps frontend maintain search state

### ReviewPreviewDto
```typescript
{
  "id": "string (GUID)",
  "rating": "number",                     // 1-5 stars
  "reviewText": "string",
  "reviewerFirstName": "string",
  "reviewerLastNameInitial": "string",    // e.g., "K."
  "sessionDate": "ISO 8601 date string",
  "createdAt": "ISO 8601 date string"
}
```

**Note:** Last name is truncated to initial for privacy.

### AvailabilityPreviewDto
```typescript
{
  "hasAvailability": "boolean",
  "nextAvailableSlot": "ISO 8601 datetime | null",
  "totalSlotsNext7Days": "number"
}
```

**Note:** Provides quick availability snapshot on mentor profiles.

---

## Validation Rules

### Bio
- Required for creation
- Min 50 characters
- Max 1000 characters
- Trimmed whitespace
- Should describe background and mentoring focus

### Years of Experience
- Required for creation
- Min 0
- Integer
- No decimal values

### Certifications
- Optional
- Max 500 characters

### Rates
- Both rate30Min and rate60Min required for creation
- Min 0, Max 10000
- Decimal values allowed
- rate60Min should typically be less than 2x rate30Min (recommendation, not enforced)

### Rejection Reason
- Required for rejection
- Min 10 characters
- Max 500 characters
- Should be professional and constructive

### Keywords (Search)
- Optional
- Min 2 characters
- Max 100 characters
- Trimmed whitespace

### Price Range (Search)
- Optional
- minPrice: Min 0, Max 10000
- maxPrice: Min 0, Max 10000
- maxPrice must be greater than minPrice if both provided

### Rating (Search)
- Optional
- Min 0, Max 5
- Decimal precision: 1 decimal place

### Pagination
- page: Min 1, default 1
- pageSize: Min 1, Max 50, default 12

### Sort Options
- Must be one of: popularity, rating, priceAsc, priceDesc
- Default: popularity

---

## Security Considerations

### Authorization
- Verify JWT token on every authenticated request
- Extract user ID from JWT claims
- Verify mentor ownership for update operations
- Verify Admin role for admin operations
- Return 403 for unauthorized access attempts

### Rate Limiting
- 100 requests per minute per IP for public search endpoints
- 200 requests per minute for category browsing
- Return 429 Too Many Requests if exceeded

### Data Privacy
- Don't expose mentor's personal email in list views
- Reviewer last names truncated to initial only
- Mentor applications are private until approved

### SQL Injection Prevention
- Use parameterized queries for all operations
- Sanitize keywords input
- Validate all GUID formats

### Business Rules
- Users can only have one mentor profile
- Mentors must be approved before appearing in public search
- Only mentors (or admins) can update mentor profiles
- Rejected mentors can reapply (consider cooldown period)

### Performance
- Implement database indexes on: AverageRating, Rate30Min, TotalSessionsCompleted, ApprovalStatus
- Cache category list (low change frequency)
- Use pagination to limit result set size
- Consider caching top-rated mentors

---

## Testing Checklist

### GET /api/mentors
- [ ] Get all mentors without query params
- [ ] Get mentors with pagination (page=1, pageSize=12)
- [ ] Search with keywords only
- [ ] Filter by price range (minPrice, maxPrice)
- [ ] Filter by minimum rating
- [ ] Filter by category ID
- [ ] Sort by popularity (default)
- [ ] Sort by rating
- [ ] Sort by price (ascending and descending)
- [ ] Combine multiple filters
- [ ] Validate invalid parameters (400)
- [ ] Handle no results (404)
- [ ] Verify pagination metadata is correct
- [ ] Verify applied filters are returned
- [ ] Verify only approved mentors are returned

### GET /api/mentors/search
- [ ] Search with valid term (min 2 chars)
- [ ] Search with term < 2 chars (400)
- [ ] Search matching name
- [ ] Search matching bio
- [ ] Search matching expertise tags
- [ ] Search with no results (404)
- [ ] Verify only approved mentors are returned

### GET /api/mentors/top-rated
- [ ] Get default count (10 mentors)
- [ ] Get custom count (e.g., 20 mentors)
- [ ] Get with count > 100 (400)
- [ ] Get with count < 1 (400)
- [ ] Verify ordering by rating
- [ ] Verify only approved mentors are returned

### GET /api/mentors/{id}
- [ ] Get mentor detail by valid ID
- [ ] Get with invalid ID (404)
- [ ] Verify all fields are populated
- [ ] Verify categories are included
- [ ] Verify recent reviews are included (max 5)
- [ ] Verify availability preview is included
- [ ] Verify only approved mentors can be viewed

### GET /api/categories
- [ ] See [Category-Endpoints.md](./Category-Endpoints.md#testing-checklist) for full testing checklist

### GET /api/categories/{id}/mentors
- [ ] See [Category-Endpoints.md](./Category-Endpoints.md#testing-checklist) for full testing checklist

### GET /api/mentors/me (Get Own Profile)
- [ ] Get own mentor profile with valid token
- [ ] Get profile without token (401)
- [ ] Get profile when not a mentor (404)
- [ ] Verify all fields are returned including approval status
- [ ] Verify works for pending mentors (before approval)

### POST /api/mentors (Apply as Mentor)
- [ ] Apply with valid data as authenticated user
- [ ] Apply with missing required fields (400)
- [ ] Apply with invalid bio (too short) (400)
- [ ] Apply when already have mentor profile (400)
- [ ] Apply without authentication (401)
- [ ] Verify approvalStatus is "Pending"
- [ ] Verify IsMentor flag is set to true
- [ ] Verify mentor profile is created

### PATCH /api/mentors/me (Update Own Profile)
- [ ] Update own profile with valid data (user fields)
- [ ] Update own profile with valid data (mentor fields)
- [ ] Update with partial data (only some fields)
- [ ] Update firstName, lastName, phoneNumber, profilePictureUrl
- [ ] Update bio, rates, certifications, availability
- [ ] Update expertiseTagIds
- [ ] Update with invalid firstName (too short) (400)
- [ ] Update with invalid bio (too short) (400)
- [ ] Update with invalid profilePictureUrl (400)
- [ ] Update non-existent mentor (404)
- [ ] Update without authentication (401)
- [ ] Verify updatedAt is updated
- [ ] Verify user fields update ApplicationUser entity
- [ ] Verify mentor fields update Mentor entity
- [ ] Verify works for pending mentors (before approval)

### GET /api/mentors/pending (Admin)
- [ ] Get pending applications as Admin
- [ ] Get pending as non-Admin (403)
- [ ] Get pending without authentication (401)
- [ ] Verify only pending mentors are returned
- [ ] Verify ordering by createdAt DESC

### PATCH /api/mentors/{id}/approve (Admin)
- [ ] Approve pending mentor as Admin
- [ ] Approve already approved mentor (400)
- [ ] Approve as non-Admin (403)
- [ ] Approve without authentication (401)
- [ ] Approve non-existent mentor (404)
- [ ] Verify approvalStatus is "Approved"
- [ ] Verify IsMentor flag is set to true
- [ ] Verify isVerified is set to true
- [ ] Verify isAvailable is set to true
- [ ] Verify user gets "Mentor" role

### PATCH /api/mentors/{id}/reject (Admin)
- [ ] Reject pending mentor as Admin with reason
- [ ] Reject without reason (400)
- [ ] Reject with short reason (400)
- [ ] Reject already processed mentor (400)
- [ ] Reject as non-Admin (403)
- [ ] Reject without authentication (401)
- [ ] Reject non-existent mentor (404)
- [ ] Verify approvalStatus is "Rejected"

---

## TimeSlot Availability Management

### 13. Get Available Time Slots for Mentor (Public)

**Endpoint:** `GET /api/mentors/{mentorId}/available-slots`
**Requires:** None (public access)
**Roles:** Public

**Path Parameters:**
- `mentorId` (string, GUID): Mentor ID

**Query Parameters:**
- `startDate` (datetime, optional): Filter slots from this date (default: 24 hours from now)
- `endDate` (datetime, optional): Filter slots until this date (default: startDate + 90 days, max range: 90 days)
- `durationMinutes` (integer, optional): Filter by slot duration (30 or 60)

**Default Behavior (No Query Parameters):**
- Returns all available slots starting **24 hours from now** (respects advance booking rule)
- Extends up to **90 days** into the future
- Only includes unbooked slots (`IsBooked = false`)
- Automatically filters out slots less than 24 hours away

**Success Response (200):**
```json
{
  "success": true,
  "message": "Available slots retrieved successfully",
  "data": {
    "mentorId": "cc0e8400-e29b-41d4-a716-446655440007",
    "mentorName": "Sarah Johnson",
    "availableSlots": [
      {
        "id": "ts_123456789",
        "startDateTime": "2025-12-15T14:00:00Z",
        "endDateTime": "2025-12-15T15:00:00Z",
        "durationMinutes": 60,
        "price": 45.00
      },
      {
        "id": "ts_987654321",
        "startDateTime": "2025-12-15T16:00:00Z",
        "endDateTime": "2025-12-15T16:30:00Z",
        "durationMinutes": 30,
        "price": 25.00
      }
    ],
    "totalCount": 12,
    "dateRange": {
      "startDate": "2025-11-22",
      "endDate": "2026-02-20"
    }
  }
}
```

**Error Responses:**

- **400 Bad Request (Invalid Parameters):**
  ```json
  {
    "success": false,
    "message": "Validation failed",
    "errors": {
      "StartDate": ["Start date must be before end date"],
      "DurationMinutes": ["Duration must be 30 or 60 minutes"],
      "DateRange": ["Date range cannot exceed 90 days"]
    },
    "statusCode": 400
  }
  ```

- **404 Not Found:**
  ```json
  {
    "success": false,
    "message": "No available slots found for the specified date range",
    "statusCode": 404
  }
  ```

**Backend Behavior:**
- Validate mentor exists and is approved
- Default start date: **24 hours from current time** (not midnight, ensures 24-hour advance booking)
- Default end date: **90 days from start date**
- Only return slots where `IsBooked = false`
- **Always enforce 24-hour minimum advance booking** (even if user provides earlier startDate)
- Filter by date range and duration if provided
- Calculate price from mentor's `rate30Min` or `rate60Min` based on duration
- Order by `startDateTime` ASC
- Return 404 if no available slots found

---

### 14. Create Time Slot(s) for Mentor

**Endpoint:** `POST /api/mentors/{mentorId}/time-slots`
**Requires:** `Authorization: Bearer {token}`
**Roles:** Mentor (owner) or Admin

**Path Parameters:**
- `mentorId` (string, GUID): Mentor ID

**Request Body (Single Slot):**
```json
{
  "startDateTime": "2025-12-15T14:00:00Z",
  "durationMinutes": 60
}
```

**Request Body (Batch - Max 50 Slots):**
```json
{
  "slots": [
    {
      "startDateTime": "2025-12-15T14:00:00Z",
      "durationMinutes": 60
    },
    {
      "startDateTime": "2025-12-15T16:00:00Z",
      "durationMinutes": 30
    }
  ]
}
```

**Field Requirements:**
- `startDateTime` (required): ISO 8601 datetime, must be at least 24 hours in the future
- `durationMinutes` (required): Integer, must be 30 or 60
- `slots` (for batch): Array of slot objects, min 1, max 50

**Success Response (201) - Single Slot:**
```json
{
  "success": true,
  "message": "Time slot created successfully",
  "data": {
    "id": "ts_123456789",
    "mentorId": "cc0e8400-e29b-41d4-a716-446655440007",
    "startDateTime": "2025-12-15T14:00:00Z",
    "endDateTime": "2025-12-15T15:00:00Z",
    "durationMinutes": 60,
    "isBooked": false,
    "sessionId": null,
    "createdAt": "2025-11-21T10:00:00Z",
    "canDelete": true
  },
  "statusCode": 201
}
```

**Success Response (201) - Batch:**
```json
{
  "success": true,
  "message": "5 time slots created successfully",
  "data": [
    {
      "id": "ts_123456789",
      "mentorId": "cc0e8400-e29b-41d4-a716-446655440007",
      "startDateTime": "2025-12-15T14:00:00Z",
      "endDateTime": "2025-12-15T15:00:00Z",
      "durationMinutes": 60,
      "isBooked": false,
      "sessionId": null,
      "createdAt": "2025-11-21T10:00:00Z",
      "canDelete": true
    }
  ],
  "statusCode": 201
}
```

**Error Responses:**

- **400 Bad Request (Validation):**
  ```json
  {
    "success": false,
    "message": "Validation failed",
    "errors": {
      "StartDateTime": ["Time slot must be at least 24 hours in the future"],
      "DurationMinutes": ["Duration must be 30 or 60 minutes"],
      "Slots": ["Cannot create more than 50 slots in one request"]
    },
    "statusCode": 400
  }
  ```

- **401 Unauthorized:**
  ```json
  {
    "success": false,
    "message": "Invalid authentication token",
    "statusCode": 401
  }
  ```

- **403 Forbidden:**
  ```json
  {
    "success": false,
    "message": "You can only manage time slots for your own mentor profile",
    "statusCode": 403
  }
  ```

- **409 Conflict (Duplicate):**
  ```json
  {
    "success": false,
    "message": "A time slot already exists at 2025-12-15 14:00",
    "statusCode": 409
  }
  ```

**Backend Behavior:**
- Extract user ID from JWT token
- Verify user is mentor owner or admin
- Validate all slots are at least 24 hours in future
- Validate duration is 30 or 60 minutes
- Check for duplicate slots at same time
- For batch: validate all slots before creating any (atomic operation)
- Create TimeSlot entities with `IsBooked = false`, `SessionId = null`
- Return created slot(s) with calculated `endDateTime` and `canDelete` flag

---

### 15. Get Mentor's All Time Slots

**Endpoint:** `GET /api/mentors/{mentorId}/time-slots`
**Requires:** `Authorization: Bearer {token}`
**Roles:** Mentor (owner) or Admin

**Path Parameters:**
- `mentorId` (string, GUID): Mentor ID

**Query Parameters:**
- `startDate` (datetime, optional): Filter slots from this date (default: today)
- `endDate` (datetime, optional): Filter slots until this date (default: startDate + 30 days, max range: 90 days)
- `isBooked` (boolean, optional): Filter by booking status (true = booked, false = available, null = all)
- `page` (integer, optional): Page number (default: 1, min: 1)
- `pageSize` (integer, optional): Items per page (default: 20, min: 1, max: 100)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Time slots retrieved successfully",
  "data": {
    "timeSlots": [
      {
        "id": "ts_123456789",
        "mentorId": "cc0e8400-e29b-41d4-a716-446655440007",
        "startDateTime": "2025-12-15T14:00:00Z",
        "endDateTime": "2025-12-15T15:00:00Z",
        "durationMinutes": 60,
        "isBooked": true,
        "sessionId": "session_abc123",
        "session": {
          "id": "session_abc123",
          "menteeFirstName": "John",
          "menteeLastName": "Doe",
          "status": "Confirmed",
          "topic": "System Design Interview Prep"
        },
        "createdAt": "2025-11-21T10:00:00Z",
        "canDelete": false
      },
      {
        "id": "ts_987654321",
        "mentorId": "cc0e8400-e29b-41d4-a716-446655440007",
        "startDateTime": "2025-12-15T16:00:00Z",
        "endDateTime": "2025-12-15T16:30:00Z",
        "durationMinutes": 30,
        "isBooked": false,
        "sessionId": null,
        "session": null,
        "createdAt": "2025-11-21T10:00:00Z",
        "canDelete": true
      }
    ],
    "pagination": {
      "totalCount": 45,
      "currentPage": 1,
      "pageSize": 20,
      "totalPages": 3,
      "hasNextPage": true,
      "hasPreviousPage": false
    },
    "summary": {
      "totalSlots": 45,
      "availableSlots": 32,
      "bookedSlots": 13
    }
  }
}
```

**Error Responses:**

- **400 Bad Request:**
  ```json
  {
    "success": false,
    "message": "Validation failed",
    "errors": {
      "Page": ["Page must be greater than or equal to 1"],
      "PageSize": ["Page size must be between 1 and 100"],
      "DateRange": ["Date range cannot exceed 90 days"]
    },
    "statusCode": 400
  }
  ```

- **401 Unauthorized:**
  ```json
  {
    "success": false,
    "message": "Invalid authentication token",
    "statusCode": 401
  }
  ```

- **403 Forbidden:**
  ```json
  {
    "success": false,
    "message": "You can only manage time slots for your own mentor profile",
    "statusCode": 403
  }
  ```

- **404 Not Found:**
  ```json
  {
    "success": false,
    "message": "No time slots found",
    "statusCode": 404
  }
  ```

**Backend Behavior:**
- Extract user ID from JWT token
- Verify user is mentor owner or admin
- Default date range: today to 30 days from today
- Filter by date range, booking status if provided
- Include session details for booked slots (mentee name, status, topic)
- Calculate `canDelete` flag (true if not booked)
- Order by `startDateTime` ASC
- Apply pagination
- Calculate summary statistics (total, available, booked counts)
- Return 404 if no slots found

---

### 16. Delete Time Slot

**Endpoint:** `DELETE /api/mentors/{mentorId}/time-slots/{slotId}`
**Requires:** `Authorization: Bearer {token}`
**Roles:** Mentor (owner) or Admin

**Path Parameters:**
- `mentorId` (string, GUID): Mentor ID
- `slotId` (string, GUID): Time slot ID

**Success Response (200):**
```json
{
  "success": true,
  "message": "Time slot deleted successfully"
}
```

**Error Responses:**

- **401 Unauthorized:**
  ```json
  {
    "success": false,
    "message": "Invalid authentication token",
    "statusCode": 401
  }
  ```

- **403 Forbidden:**
  ```json
  {
    "success": false,
    "message": "You can only manage time slots for your own mentor profile",
    "statusCode": 403
  }
  ```

- **404 Not Found:**
  ```json
  {
    "success": false,
    "message": "Time slot not found",
    "statusCode": 404
  }
  ```

- **409 Conflict (Booked Slot):**
  ```json
  {
    "success": false,
    "message": "Cannot delete a booked time slot. Please cancel the session first.",
    "statusCode": 409
  }
  ```

**Backend Behavior:**
- Extract user ID from JWT token
- Verify user is mentor owner or admin
- Validate slot exists and belongs to this mentor
- Check slot is not booked (`IsBooked = false`)
- Return 409 if slot is booked
- Delete slot from database
- Return success message

**Note:** When a session is cancelled, the associated TimeSlot is automatically released (`IsBooked = false`, `SessionId = null`) and becomes available for booking again.

---

## Testing Checklist

### GET /api/mentors/{mentorId}/available-slots (Public)
- [ ] Get available slots without filters
- [ ] Filter by date range (startDate, endDate)
- [ ] Filter by duration (30 or 60 minutes)
- [ ] Invalid date range (startDate > endDate) (400)
- [ ] Date range exceeds 90 days (400)
- [ ] Invalid duration (not 30 or 60) (400)
- [ ] Mentor not found (404)
- [ ] No available slots (404)
- [ ] Verify only slots >24h in future are returned
- [ ] Verify only IsBooked=false slots are returned
- [ ] Verify price calculated from mentor's rates

### POST /api/mentors/{mentorId}/time-slots (Authenticated)
- [ ] Create single slot successfully
- [ ] Create batch slots (2-50 slots)
- [ ] Create slot <24h in future (400)
- [ ] Create slot with invalid duration (400)
- [ ] Create batch with >50 slots (400)
- [ ] Create duplicate slot (409)
- [ ] Create as non-owner mentor (403)
- [ ] Create without authentication (401)
- [ ] Verify admin can create for any mentor
- [ ] Verify batch is atomic (all or nothing)

### GET /api/mentors/{mentorId}/time-slots (Authenticated)
- [ ] Get all slots with pagination
- [ ] Filter by date range
- [ ] Filter by isBooked status
- [ ] Invalid pagination parameters (400)
- [ ] Get as non-owner mentor (403)
- [ ] Get without authentication (401)
- [ ] Verify session details included for booked slots
- [ ] Verify summary statistics are correct
- [ ] Verify admin can view any mentor's slots

### DELETE /api/mentors/{mentorId}/time-slots/{slotId} (Authenticated)
- [ ] Delete available slot successfully
- [ ] Delete booked slot (409)
- [ ] Delete non-existent slot (404)
- [ ] Delete as non-owner mentor (403)
- [ ] Delete without authentication (401)
- [ ] Verify admin can delete any mentor's slots
- [ ] Verify slot belongs to specified mentor

---

## Sample API Requests

**Get All Mentors (Simple):**
```bash
GET http://localhost:5000/api/mentors
```

**Search with Pagination:**
```bash
GET http://localhost:5000/api/mentors?page=1&pageSize=12
```

**Advanced Search:**
```bash
GET http://localhost:5000/api/mentors?keywords=react&minRating=4.5&categoryId=1&sortBy=rating&page=1&pageSize=12
```

**Filter by Price Range:**
```bash
GET http://localhost:5000/api/mentors?minPrice=20&maxPrice=50&sortBy=priceAsc&page=1&pageSize=12
```

**Simple Keyword Search:**
```bash
GET http://localhost:5000/api/mentors/search?searchTerm=full-stack
```

**Get Top-Rated Mentors:**
```bash
GET http://localhost:5000/api/mentors/top-rated?count=20
```

**Get Mentor Detail:**
```bash
GET http://localhost:5000/api/mentors/cc0e8400-e29b-41d4-a716-446655440007
```

**Get Current Mentor's Own Profile:**
```bash
GET http://localhost:5000/api/mentors/me
Authorization: Bearer {access-token}
```

**Get All Categories:**
```bash
# See Category-Endpoints.md for full examples
GET http://localhost:5000/api/categories
```

**Get Mentors by Category:**
```bash
# See Category-Endpoints.md for full examples
GET http://localhost:5000/api/categories/1/mentors?page=1&pageSize=12&sortBy=rating
```

**Apply as Mentor:**
```bash
POST http://localhost:5000/api/mentors
Authorization: Bearer {access-token}
Content-Type: application/json

{
  "bio": "Full-stack developer with 8 years of experience building scalable enterprise software...",
  "yearsOfExperience": 8,
  "certifications": "AWS Certified Solutions Architect - Professional",
  "rate30Min": 25.00,
  "rate60Min": 45.00
}
```

**Update Current Mentor's Own Profile:**
```bash
PATCH http://localhost:5000/api/mentors/me
Authorization: Bearer {access-token}
Content-Type: application/json

{
  "firstName": "Sarah",
  "lastName": "Johnson",
  "phoneNumber": "+1234567890",
  "profilePictureUrl": "https://example.com/profiles/sarah-new.jpg",
  "bio": "Updated bio...",
  "rate30Min": 30.00,
  "isAvailable": true,
  "expertiseTagIds": [15, 18, 22, 25, 30]
}
```

**Get Pending Applications (Admin):**
```bash
GET http://localhost:5000/api/mentors/pending
Authorization: Bearer {admin-access-token}
```

**Approve Mentor (Admin):**
```bash
PATCH http://localhost:5000/api/mentors/cc0e8400-e29b-41d4-a716-446655440007/approve
Authorization: Bearer {admin-access-token}
```

**Reject Mentor (Admin):**
```bash
PATCH http://localhost:5000/api/mentors/cc0e8400-e29b-41d4-a716-446655440007/reject
Authorization: Bearer {admin-access-token}
Content-Type: application/json

{
  "reason": "Profile does not meet our minimum experience requirements"
}
```
