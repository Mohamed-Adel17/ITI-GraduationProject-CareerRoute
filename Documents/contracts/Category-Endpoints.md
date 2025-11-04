# Category Endpoints API Contract

**Frontend Framework:** Angular 20.3.0
**Expected Backend:** ASP.NET Core 8.0 Web API
**Base URL:** `http://localhost:5000/api`

---

## Overview

Categories are used for:
1. **Career Interests**: User profile interests (type: `CareerInterest`)
2. **Mentor Specializations**: Mentor expertise areas (type: `MentorSpecialization`)

**Frontend Implementation:** ✅ Completed
- Service: `Frontend/src/app/core/services/category.service.ts`
- Model: `Frontend/src/app/shared/models/category.model.ts`
- Features: Full CRUD operations, caching, filtering by type

**Public Endpoints:** GET operations are public (no authentication required)
**Admin-Only Endpoints:** POST, PUT, DELETE require admin role

---

## 1. Get All Categories

**Endpoint:** `GET /api/categories`
**Authentication:** Optional (public endpoint)

**Query Parameters:**
- `type` (optional): Filter by `CareerInterest` or `MentorSpecialization`

**Example Requests:**
```
GET /api/categories                              # All active categories
GET /api/categories?type=CareerInterest          # Only career interests
GET /api/categories?type=MentorSpecialization   # Only mentor specializations
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Categories retrieved successfully",
  "data": [
    {
      "id": "1",
      "name": "Software Development",
      "description": "Building software applications",
      "type": "CareerInterest",
      "icon": "💻",
      "displayOrder": 1,
      "isActive": true,
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-01T00:00:00Z"
    },
    {
      "id": "2",
      "name": "Data Science",
      "description": "Analyzing and interpreting complex data",
      "type": "CareerInterest",
      "icon": "📊",
      "displayOrder": 2,
      "isActive": true,
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-01T00:00:00Z"
    }
  ],
  "totalCount": 23
}
```

**Backend Behavior:**
- Return only active categories (`isActive: true`)
- Support filtering by `type` query parameter
- Sort by `displayOrder` ASC, then by `name` ASC
- Include `totalCount` in response
- Return empty array if no categories exist

**Typical Career Interest Categories:**
Software Development, Data Science, Machine Learning, AI, Cloud Computing, DevOps, Cybersecurity, Mobile Development, Web Development, Database Administration, UI/UX Design, Project Management, Business Analysis, Quality Assurance, Network Engineering, Blockchain, Game Development, IoT, Embedded Systems, Other (minimum 20)

---

## 2. Get Single Category by ID

**Endpoint:** `GET /api/categories/{id}`
**Authentication:** Optional (public endpoint)

**Path Parameters:**
- `id` (string): Category ID

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "1",
    "name": "Software Development",
    "description": "Building software applications",
    "type": "CareerInterest",
    "icon": "💻",
    "displayOrder": 1,
    "isActive": true,
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-01T00:00:00Z"
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "Category not found",
  "statusCode": 404
}
```

**Backend Behavior:**
- Return single category by ID
- Return 404 if category doesn't exist or is inactive

---

## 3. Create Category (Admin Only)

**Endpoint:** `POST /api/categories`
**Requires:** `Authorization: Bearer {token}` (Admin role)

**Request Body:**
```json
{
  "name": "Quantum Computing",
  "description": "Quantum computing and quantum algorithms",
  "type": "CareerInterest",
  "icon": "⚛️",
  "displayOrder": 21
}
```

**Field Requirements:**
- `name` (required): Min 2 chars, max 100 chars
- `description` (optional): Max 500 chars
- `type` (required): `CareerInterest`, `MentorSpecialization`, or `General`
- `icon` (optional): Icon emoji or URL
- `displayOrder` (optional): Positive integer, defaults to highest + 1

**Success Response (201):**
```json
{
  "success": true,
  "message": "Category created successfully",
  "data": {
    "id": "24",
    "name": "Quantum Computing",
    "description": "Quantum computing and quantum algorithms",
    "type": "CareerInterest",
    "icon": "⚛️",
    "displayOrder": 21,
    "isActive": true,
    "createdAt": "2025-10-30T10:00:00Z",
    "updatedAt": "2025-10-30T10:00:00Z"
  }
}
```

**Error Responses:**

- **400 Validation Failed:**
  ```json
  {
    "success": false,
    "message": "Validation failed",
    "errors": {
      "Name": ["Name is required", "Name must be at least 2 characters"],
      "Type": ["Type must be CareerInterest, MentorSpecialization, or General"]
    },
    "statusCode": 400
  }
  ```

- **400 Duplicate Name:**
  ```json
  {
    "success": false,
    "message": "Category with this name already exists for this type",
    "errors": { "Name": ["Category name already exists"] },
    "statusCode": 400
  }
  ```

- **403 Forbidden:**
  ```json
  {
    "success": false,
    "message": "Admin access required",
    "statusCode": 403
  }
  ```

**Backend Behavior:**
- Validate all required fields
- Check if category name already exists for same type
- Set `isActive: true` by default
- Auto-generate ID
- Set `createdAt` and `updatedAt` timestamps
- Return 403 if user is not admin

---

## 4. Update Category (Admin Only)

**Endpoint:** `PUT /api/categories/{id}`
**Requires:** `Authorization: Bearer {token}` (Admin role)

**Path Parameters:**
- `id` (string): Category ID to update

**Request Body:**
```json
{
  "name": "Software Engineering",
  "description": "Updated description",
  "icon": "💻",
  "displayOrder": 1,
  "isActive": true
}
```

**Field Requirements:**
- `name` (optional): Min 2 chars, max 100 chars
- `description` (optional): Max 500 chars
- `icon` (optional): Icon emoji or URL
- `displayOrder` (optional): Positive integer
- `isActive` (optional): Set to false to deactivate

**Note:** Cannot change `type` after creation

**Success Response (200):**
```json
{
  "success": true,
  "message": "Category updated successfully",
  "data": {
    "id": "1",
    "name": "Software Engineering",
    "description": "Updated description",
    "type": "CareerInterest",
    "icon": "💻",
    "displayOrder": 1,
    "isActive": true,
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-10-30T11:00:00Z"
  }
}
```

**Error Responses:**
- **403 Forbidden:** Admin access required
- **404 Not Found:** Category doesn't exist

**Backend Behavior:**
- Find category by ID
- Update only provided fields (partial update)
- Update `updatedAt` timestamp
- Reject if `type` is in request body
- Return 403 if user is not admin

---

## 5. Delete Category (Admin Only)

**Endpoint:** `DELETE /api/categories/{id}`
**Requires:** `Authorization: Bearer {token}` (Admin role)

**Path Parameters:**
- `id` (string): Category ID to delete

**Success Response (200):**
```json
{
  "success": true,
  "message": "Category deleted successfully"
}
```

**Error Responses:**

- **400 Category In Use:**
  ```json
  {
    "success": false,
    "message": "Cannot delete category that is in use by users or mentors",
    "statusCode": 400
  }
  ```

- **403 Forbidden:** Admin access required
- **404 Not Found:** Category doesn't exist

**Backend Behavior:**
- Check if category is referenced by users or mentors
- **Recommended:** Soft delete (set `isActive: false`)
- **Alternative:** Hard delete only if not referenced
- Return 400 if category is in use
- Return 403 if user is not admin

**Business Rules:**
- Cannot delete categories used by users (career interests) or mentors (specializations)
- Soft delete recommended to preserve data integrity

---

## 6. Get Mentors by Category

**Endpoint:** `GET /api/categories/{id}/mentors`
**Authentication:** Optional (public endpoint)

**Path Parameters:**
- `id` (number): Category ID

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Items per page (default: 10, max: 50)
- `sortBy` (optional): `rating`, `price`, `experience`, `sessions` (default: `rating`)
- `sortOrder` (optional): `asc` or `desc` (default: `desc`)
- `minPrice` (optional): Minimum 30-min rate filter
- `maxPrice` (optional): Maximum 30-min rate filter
- `minRating` (optional): Minimum rating filter (0-5)
- `keywords` (optional): Search in bio and expertise tags

**Example Request:**
```
GET /api/categories/1/mentors?page=1&pageSize=10&sortBy=rating&minRating=4.0&keywords=react
```

**Success Response (200):**
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

**Error Response (404):**
```json
{
  "success": false,
  "message": "Category not found",
  "statusCode": 404
}
```

**Business Rules:**
- Only return mentors with `approvalStatus: "Approved"`
- Only return mentors with `isAvailable: true`
- Results paginated (default 10, max 50 per page)
- Default sort by rating (highest first)

---

## Category Model Structure

```typescript
{
  "id": "string (GUID or number)",
  "name": "string",
  "description": "string | null",
  "type": "CareerInterest | MentorSpecialization | General",
  "icon": "string | null",        // Icon emoji or URL
  "displayOrder": "number",
  "isActive": "boolean",
  "createdAt": "ISO 8601 date string",
  "updatedAt": "ISO 8601 date string"
}
```

---

**Frontend Caching:**
- Categories cached after first fetch
- Cache persists during user session
- Use `forceRefresh: true` to bypass cache
- `shareReplay(1)` shares data across multiple subscribers
- Admin operations automatically refresh cache

```

---

## Testing Checklist

- [ ] Get all categories (returns active categories sorted by displayOrder)
- [ ] Get categories filtered by type (`?type=CareerInterest`)
- [ ] Get single category by ID
- [ ] Get non-existent category (404)
- [ ] Create category as admin (201)
- [ ] Create category with invalid data (400 validation)
- [ ] Create duplicate category name (400 conflict)
- [ ] Create category as non-admin (403)
- [ ] Update category as admin (200)
- [ ] Update category type (should fail - type immutable)
- [ ] Update category as non-admin (403)
- [ ] Delete unused category as admin (200)
- [ ] Delete category in use (400)
- [ ] Delete category as non-admin (403)
- [ ] Get mentors by category with pagination
- [ ] Get mentors by category with filters (price, rating, keywords)
- [ ] Get mentors by category with sorting

---

## Sample API Requests

**Get All Categories:**
```bash
GET http://localhost:5000/api/categories
```

**Get Career Interests Only:**
```bash
GET http://localhost:5000/api/categories?type=CareerInterest
```

**Create Category (Admin):**
```bash
POST http://localhost:5000/api/categories
Authorization: Bearer {access-token}
Content-Type: application/json

{
  "name": "Quantum Computing",
  "description": "Quantum computing and algorithms",
  "type": "CareerInterest",
  "icon": "⚛️"
}
```

**Update Category (Admin):**
```bash
PUT http://localhost:5000/api/categories/1
Authorization: Bearer {access-token}
Content-Type: application/json

{
  "name": "Software Engineering",
  "description": "Updated description",
  "isActive": true
}
```

**Delete Category (Admin):**
```bash
DELETE http://localhost:5000/api/categories/1
Authorization: Bearer {access-token}
```

**Get Mentors by Category:**
```bash
GET http://localhost:5000/api/categories/1/mentors?page=1&sortBy=rating&minRating=4.0
```
