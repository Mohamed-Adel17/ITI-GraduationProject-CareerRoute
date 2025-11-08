# Category Endpoints API Contract

**Frontend Framework:** Angular 20.3.0
**Expected Backend:** ASP.NET Core 8.0 Web API
**Base URL:** `http://localhost:5000/api`

---

## ⚠️ BREAKING CHANGES - Unified Category System

**Date:** 2025-11-06
**Version:** 2.0

### Migration Summary

The category system has been **unified** - categories now serve both user career interests and mentor specializations. The `type` field has been completely removed.

### What Changed

**Frontend (✅ COMPLETED):**
- ❌ Removed `CategoryType` enum
- ❌ Removed `type` property from all Category interfaces
- ❌ Removed type-based filtering methods (`getCareerInterests()`, `getMentorSpecializations()`)
- ✅ Added unified `getAllCategories()` method
- ✅ Updated all components to use unified categories

**Backend (⚠️ REQUIRED):**
- ❌ Remove `type` column from Categories table (or make nullable/deprecated)
- ❌ Remove `type` from Category entity/model
- ❌ Remove `?type=` query parameter support
- ❌ Update validation to check for duplicate names globally (not per type)
- ✅ Return all active categories without type filtering

### Migration Steps for Backend

1. **Database Migration:**
   ```sql
   -- Option 1: Drop the column (if no data needs preserving)
   ALTER TABLE Categories DROP COLUMN Type;

   -- Option 2: Make nullable (for gradual migration)
   ALTER TABLE Categories ALTER COLUMN Type NVARCHAR(50) NULL;
   ```

2. **Update Entity:**
   - Remove `Type` property from Category entity
   - Remove `CategoryType` enum

3. **Update API:**
   - Remove `type` from request/response DTOs
   - Remove type filtering logic in GET endpoint
   - Update duplicate name check (global uniqueness)

4. **Update Validation:**
   - Remove type requirement from create/update validators
   - Check for duplicate names across all categories

---

## Overview

**Unified Category System** - Categories represent areas of expertise used for BOTH:
1. **User Career Interests**: What users want to learn
2. **Mentor Specializations**: What mentors can teach

This unified approach simplifies matching between users and mentors by using the same category list for both contexts.

**Frontend Implementation:** ✅ Completed (Unified System)
- Service: `Frontend/src/app/core/services/category.service.ts`
- Model: `Frontend/src/app/shared/models/category.model.ts`
- Features: Full CRUD operations, caching, unified category retrieval
- **Note**: Type-based filtering removed - categories are now unified

**Public Endpoints:** GET operations are public (no authentication required)
**Admin-Only Endpoints:** POST, PUT, DELETE require admin role

---

## 1. Get All Categories

**Endpoint:** `GET /api/categories`
**Authentication:** Optional (public endpoint)

**Query Parameters:**
- ~~`type` (optional): Filter by `CareerInterest` or `MentorSpecialization`~~ **DEPRECATED - Use unified categories**

**Example Request:**
```
GET /api/categories    # All active categories (unified system)
```

**⚠️ BREAKING CHANGE:**
The `type` query parameter is deprecated. Backend should return all active categories without type filtering.

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

**⚠️ MIGRATION NOTE:**
The `type` field has been removed from the Category model. Categories are now unified - used for both user interests and mentor specializations.

**Backend Behavior:**
- Return only active categories (`isActive: true`)
- ~~Support filtering by `type` query parameter~~ **REMOVED - No type filtering**
- Sort by `displayOrder` ASC, then by `name` ASC
- Include `totalCount` in response
- Return empty array if no categories exist
- **Do NOT filter by type** - return all active categories

**Typical Categories (Unified):**
Software Development, Data Science, Machine Learning, AI, Cloud Computing, DevOps, Cybersecurity, Mobile Development, Web Development, Database Administration, UI/UX Design, Project Management, Business Analysis, Quality Assurance, Network Engineering, Blockchain, Game Development, IoT, Embedded Systems, Digital Marketing, Product Management, etc. (minimum 20)

These categories serve both user career interests and mentor specializations.

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
    "icon": "💻",
    "displayOrder": 1,
    "isActive": true,
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-01T00:00:00Z"
  }
}
```

**Note:** `type` field removed from response.

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
  "icon": "⚛️",
  "displayOrder": 21
}
```

**Field Requirements:**
- `name` (required): Min 2 chars, max 100 chars
- `description` (optional): Max 500 chars
- ~~`type` (required): `CareerInterest`, `MentorSpecialization`, or `General`~~ **REMOVED - No type needed**
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
    "icon": "⚛️",
    "displayOrder": 21,
    "isActive": true,
    "createdAt": "2025-10-30T10:00:00Z",
    "updatedAt": "2025-10-30T10:00:00Z"
  }
}
```

**Note:** `type` field removed from request and response.

**Error Responses:**

- **400 Validation Failed:**
  ```json
  {
    "success": false,
    "message": "Validation failed",
    "errors": {
      "Name": ["Name is required", "Name must be at least 2 characters"]
    },
    "statusCode": 400
  }
  ```

- **400 Duplicate Name:**
  ```json
  {
    "success": false,
    "message": "Category with this name already exists",
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
- Check if category name already exists ~~for same type~~ (globally - no type differentiation)
- Set `isActive: true` by default
- Auto-generate ID
- Set `createdAt` and `updatedAt` timestamps
- Return 403 if user is not admin
- **Do NOT require or save type field**

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

~~**Note:** Cannot change `type` after creation~~ **REMOVED - No type field exists**

**Success Response (200):**
```json
{
  "success": true,
  "message": "Category updated successfully",
  "data": {
    "id": "1",
    "name": "Software Engineering",
    "description": "Updated description",
    "icon": "💻",
    "displayOrder": 1,
    "isActive": true,
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-10-30T11:00:00Z"
  }
}
```

**Note:** `type` field removed from response.

**Error Responses:**
- **403 Forbidden:** Admin access required
- **404 Not Found:** Category doesn't exist

**Backend Behavior:**
- Find category by ID
- Update only provided fields (partial update)
- Update `updatedAt` timestamp
- ~~Reject if `type` is in request body~~ **REMOVED - No type field**
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
  "icon": "string | null",        // Icon emoji or URL
  "displayOrder": "number",
  "isActive": "boolean",
  "createdAt": "ISO 8601 date string",
  "updatedAt": "ISO 8601 date string"
}
```

**⚠️ BREAKING CHANGE:**
The `type` field has been completely removed. Categories are now unified and serve both user career interests and mentor specializations.

---

**Frontend Caching:**
- Categories cached after first fetch
- Cache persists during user session
- Use `forceRefresh: true` to bypass cache
- `shareReplay(1)` shares data across multiple subscribers
- Admin operations automatically refresh cache
- **Unified approach**: Same cached categories used for both user interests and mentor specializations

**Frontend Usage:**
```typescript
// Get all categories (for both users and mentors)
this.categoryService.getAllCategories().subscribe(categories => {
  this.categories = categories;
});

// Get category names only
this.categoryService.getCategoryNames().subscribe(names => {
  this.categoryNames = names;
});
```

---

## Testing Checklist

- [ ] Get all categories (returns active categories sorted by displayOrder)
- [x] ~~Get categories filtered by type (`?type=CareerInterest`)~~ **REMOVED - Unified system**
- [ ] Get single category by ID
- [ ] Get non-existent category (404)
- [ ] Create category as admin (201) - **without type field**
- [ ] Create category with invalid data (400 validation)
- [ ] Create duplicate category name (400 conflict) - **global uniqueness check**
- [ ] Create category as non-admin (403)
- [ ] Update category as admin (200)
- [x] ~~Update category type (should fail - type immutable)~~ **REMOVED - No type field**
- [ ] Update category as non-admin (403)
- [ ] Delete unused category as admin (200)
- [ ] Delete category in use (400)
- [ ] Delete category as non-admin (403)
- [ ] Get mentors by category with pagination
- [ ] Get mentors by category with filters (price, rating, keywords)
- [ ] Get mentors by category with sorting
- [ ] **Verify unified usage**: Same category appears in both user interests and mentor specializations

---

## Sample API Requests

**Get All Categories:**
```bash
GET http://localhost:5000/api/categories
```

~~**Get Career Interests Only:**~~ **REMOVED - Unified system**
```bash
# This endpoint is deprecated - use GET /api/categories instead
# GET http://localhost:5000/api/categories?type=CareerInterest
```

**Create Category (Admin):**
```bash
POST http://localhost:5000/api/categories
Authorization: Bearer {access-token}
Content-Type: application/json

{
  "name": "Quantum Computing",
  "description": "Quantum computing and algorithms",
  "icon": "⚛️"
}
```

**Note:** `type` field removed from request body.

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
