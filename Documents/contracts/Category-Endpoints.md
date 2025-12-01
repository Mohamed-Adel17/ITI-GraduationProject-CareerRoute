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

**Unified Category System** - Categories are the top-level containers that organize Skills.

**Two-Level Hierarchy:**
```
Categories (this document)
    └─ Skills (see Skills-Endpoints.md)
        └─ Selected by Users & Mentors
```

**How It Works:**
1. **Categories**: Top-level groupings (e.g., "Career Development", "IT Careers & Technical Consultation", "Leadership & Management")
2. **Skills**: Specific areas within categories (e.g., "Career Shifting", "React", "System Design")
3. **User Career Interests**: Users select specific **Skills** they want help with
4. **Mentor Expertise**: Mentors select specific **Skills** they can provide consultation on

**Example:**
- Category: "IT Careers & Technical Consultation"
  - Skills: "React", "Node.js", "System Design", "AWS", "Tech Leadership", "Career Shifting"
- Category: "Career Development"
  - Skills: "Career Shifting", "Interview Preparation", "Salary Negotiation"

Users and mentors interact with **Skills**, not Categories directly. Categories are used for organization and browsing.

---

## Related Documentation

- **📖 API Endpoints Index**: See [API-Endpoints-Index.md](./API-Endpoints-Index.md) for complete endpoint directory and cross-references
- **Mentor Discovery**: See [Mentor-Endpoints.md](./Mentor-Endpoints.md) for endpoints related to browsing mentors by category
- **Skills Management**: See [Skills-Endpoints.md](./Skills-Endpoints.md) for skills CRUD operations - **Skills belong to Categories**
- **Skills System Overview**: See [Skills-System-Overview.md](./Skills-System-Overview.md) for understanding how Categories and Skills work together
- **US2 Implementation**: This document focuses on category CRUD (admin management). Mentor discovery endpoints are in the separate document above.

**Important:** Categories are the parent/container for Skills. Each Skill belongs to exactly one Category. Users select Skills (not Categories) for their career interests, and mentors select Skills for their expertise tags.

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
      "id": 1,
      "name": "Software Development",
      "description": "Building software applications and systems",
      "iconUrl": "💻",
      "mentorCount": 42,
      "isActive": true,
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-01T00:00:00Z"
    },
    {
      "id": 2,
      "name": "Data Science",
      "description": "Analyzing and interpreting complex data",
      "iconUrl": "📊",
      "mentorCount": 28,
      "isActive": true,
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-01T00:00:00Z"
    },
    {
      "id": 3,
      "name": "Cloud Computing",
      "description": "Cloud platforms and infrastructure",
      "iconUrl": "☁️",
      "mentorCount": 35,
      "isActive": true,
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-01T00:00:00Z"
    }
  ]
}
```

**Note:** Response includes `mentorCount` showing the count of approved mentors who have selected **at least one skill** from this category.

**⚠️ MIGRATION NOTE:**
The `type` field has been removed from the Category model. Categories are now unified - used for both user interests and mentor specializations.

**Backend Behavior:**
- Return only active categories (`isActive: true`)
- Sort by `name` ASC (alphabetically)
- Include `mentorCount` for each category
- Return empty array if no categories exist
- **Do NOT filter by type** - return all active categories

**Typical Categories:**
- Career Development
- Leadership & Management
- IT Careers & Technical Consultation
- Entrepreneurship
- Finance & Accounting
- Marketing & Sales
- Design & Creative
- Product Management
- Data & Analytics
- Business Strategy

Each category contains multiple Skills (see [Skills-Endpoints.md](./Skills-Endpoints.md) for the Skills list).

**Note:** Users and mentors select **Skills** (not Categories). Categories are organizational containers.

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
  "message": "Category retrieved successfully",
  "data": {
    "id": 1,
    "name": "Software Development",
    "description": "Building software applications and systems",
    "iconUrl": "💻",
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
  "iconUrl": "⚛️"
}
```

**Field Requirements:**
- `name` (required): Min 2 chars, max 100 chars, must be unique
- `description` (optional): Max 500 chars
- `iconUrl` (optional): Icon emoji or URL, max 200 chars

**Success Response (201):**
```json
{
  "success": true,
  "message": "Category created successfully",
  "data": {
    "id": 24,
    "name": "Quantum Computing",
    "description": "Quantum computing and quantum algorithms",
    "iconUrl": "⚛️",
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
  "description": "Software engineering and best practices",
  "iconUrl": "💻",
  "isActive": true
}
```

**Field Requirements:**
- `name` (optional): Min 2 chars, max 100 chars, must be unique if changed
- `description` (optional): Max 500 chars
- `iconUrl` (optional): Icon emoji or URL, max 200 chars
- `isActive` (optional): Set to false to deactivate (soft delete)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Category updated successfully",
  "data": {
    "id": 1,
    "name": "Software Engineering",
    "description": "Software engineering and best practices",
    "iconUrl": "💻",
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
  "message": "Mentors retrieved successfully",
  "data": {
    "category": {
      "id": 1,
      "name": "Software Development",
      "description": "Building software applications and systems",
      "iconUrl": "💻"
    },
    "mentors": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "firstName": "John",
        "lastName": "Doe",
        "fullName": "John Doe",
        "profilePictureUrl": "https://example.com/profiles/john.jpg",
        "bio": "Senior Software Engineer with 10 years of experience in enterprise applications...",
        "expertiseTags": ["React", "Node.js", "AWS", "Docker", "Kubernetes"],
        "yearsOfExperience": 10,
        "rate30Min": 50.00,
        "rate60Min": 90.00,
        "averageRating": 4.8,
        "totalReviews": 45,
        "totalSessionsCompleted": 120,
        "isVerified": true,
        "isAvailable": true,
        "approvalStatus": "Approved"
      }
    ],
    "pagination": {
      "totalCount": 45,
      "currentPage": 1,
      "pageSize": 10,
      "totalPages": 5,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

**Note:** Uses unified pagination structure with nested `pagination` object and includes category information in response.

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

---

## Category Model Structure (CategoryDto)

```typescript
{
  "id": "number",
  "name": "string",
  "description": "string | null",
  "iconUrl": "string | null",       // Icon emoji or URL
  "mentorCount": "number | null",   // Count of approved mentors (populated in browse contexts)
  "isActive": "boolean",
  "createdAt": "ISO 8601 date string",
  "updatedAt": "ISO 8601 date string | null"
}
```

**Notes:**
- `id` is an integer (not GUID/string)
- `iconUrl` can be emoji or image URL
- `mentorCount` is populated for public/browse endpoints, may be null in admin contexts
- All timestamps in ISO 8601 format (UTC)

## Create Category Model Structure (CreateCategoryDto)

```typescript
{
  "name": "string",                 // Required: Min 2, max 100 chars, must be unique
  "description": "string | optional", // Optional: Max 500 chars
  "iconUrl": "string | optional"    // Optional: Max 200 chars
}
```

**Note:** All fields except `name` are optional.

## Update Category Model Structure (UpdateCategoryDto)

```typescript
{
  "name": "string | optional",        // Optional: Min 2, max 100 chars, must be unique if changed
  "description": "string | optional", // Optional: Max 500 chars
  "iconUrl": "string | optional",     // Optional: Max 200 chars
  "isActive": "boolean | optional"    // Optional: Set to false for soft delete
}
```

**Note:** All fields are optional. Only provided fields will be updated.

---

## ⚠️ UNIFIED SYSTEM

The `type` field has been removed. Categories now serve both user career interests and mentor specializations.

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
  "iconUrl": "⚛️"
}
```

**Update Category (Admin):**
```bash
PUT http://localhost:5000/api/categories/1
Authorization: Bearer {access-token}
Content-Type: application/json

{
  "name": "Software Engineering",
  "description": "Software engineering and best practices",
  "iconUrl": "💻",
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
