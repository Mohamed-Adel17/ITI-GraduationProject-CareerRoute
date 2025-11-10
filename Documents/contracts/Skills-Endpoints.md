# Skills Endpoints API Contract

**Frontend Framework:** Angular 20.3.0  
**Expected Backend:** ASP.NET Core 8.0 Web API  
**Base URL:** `http://localhost:5000/api`

---

## Overview

Skills endpoints manage the master list of career guidance and technical consultation areas. Skills are organized under categories and can be selected by users (as career interests) and mentors (as expertise tags).

**Key Concepts:**
- Skills are flat - no parent-child relationships
- Skills belong to categories (Career Development, IT Careers, Leadership, etc.)
- Same Skills table serves both user career interests and mentor expertise
- Mix of career guidance and technical consultation areas

**Authorization Rules:**
- All authenticated users can **view** skills
- Only **Admins** can create, update, or delete skills

**Note:** User career interests and mentor expertise tags are updated via their respective profile endpoints:
- **User career interests**: Update using the `careerInterestIds` field in `PATCH /api/users/me` (see User-Profile-Endpoints.md)
- **Mentor expertise tags**: Update using the `expertiseTagIds` field in `PATCH /api/mentors/{id}` (see Mentor-Endpoints.md)

---

## 1. Get All Skills

**Endpoint:** `GET /api/skills`  
**Requires:** `Authorization: Bearer {token}` (optional for public access)  
**Roles:** Any (public endpoint)

**Query Parameters:**
- `categoryId` (integer, optional): Filter skills by category ID
- `isActive` (boolean, optional): Filter by active status (default: true)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Skills retrieved successfully",
  "data": [
    {
      "id": 1,
      "name": "Career Shifting",
      "categoryId": 1,
      "categoryName": "Career Development",
      "isActive": true
    },
    {
      "id": 5,
      "name": "Leadership Development",
      "categoryId": 2,
      "categoryName": "Leadership & Management",
      "isActive": true
    },
    {
      "id": 15,
      "name": "React",
      "categoryId": 3,
      "categoryName": "IT Careers & Technical Consultation",
      "isActive": true
    },
    {
      "id": 20,
      "name": "System Design",
      "categoryId": 3,
      "categoryName": "IT Careers & Technical Consultation",
      "isActive": true
    }
  ]
}
```

**Success Response - Grouped by Category (Alternative):**
```json
{
  "success": true,
  "message": "Skills retrieved successfully",
  "data": {
    "categories": [
      {
        "id": 1,
        "name": "Career Development",
        "skills": [
          { "id": 1, "name": "Career Shifting", "isActive": true },
          { "id": 2, "name": "Career Planning", "isActive": true },
          { "id": 3, "name": "Interview Preparation", "isActive": true }
        ]
      },
      {
        "id": 3,
        "name": "IT Careers & Technical Consultation",
        "skills": [
          { "id": 15, "name": "React", "isActive": true },
          { "id": 20, "name": "System Design", "isActive": true },
          { "id": 25, "name": "AWS", "isActive": true }
        ]
      }
    ]
  }
}
```

**Error Responses:**

- **404 Not Found:**
  ```json
  {
    "success": false,
    "message": "No skills found",
    "statusCode": 404
  }
  ```

**Backend Behavior:**
- Fetch all active skills from database
- Include category information for each skill
- Apply filters if provided (categoryId, isActive)
- Order by category, then by skill name
- Can optionally group by category for easier frontend consumption

---

## 2. Get Skill by ID

**Endpoint:** `GET /api/skills/{id}`  
**Requires:** `Authorization: Bearer {token}` (optional)  
**Roles:** Any (public endpoint)

**Path Parameters:**
- `id` (integer): Skill ID to retrieve

**Success Response (200):**
```json
{
  "success": true,
  "message": "Skill retrieved successfully",
  "data": {
    "id": 15,
    "name": "React",
    "categoryId": 3,
    "categoryName": "IT Careers & Technical Consultation",
    "isActive": true,
    "createdAt": "2025-01-10T10:00:00Z",
    "updatedAt": "2025-01-10T10:00:00Z"
  }
}
```

**Error Responses:**

- **404 Not Found:**
  ```json
  {
    "success": false,
    "message": "Skill not found",
    "statusCode": 404
  }
  ```

**Backend Behavior:**
- Fetch skill by ID from database
- Include category information
- Return 404 if skill doesn't exist

---

## 3. Create Skill (Admin Only)

**Endpoint:** `POST /api/skills`  
**Requires:** `Authorization: Bearer {token}`  
**Roles:** Admin only

**Request Body:**
```json
{
  "name": "Kubernetes",
  "categoryId": 3
}
```

**Field Requirements:**
- `name` (required): Min 2 chars, max 100 chars, unique within category
- `categoryId` (required): Must be valid existing category ID

**Success Response (201):**
```json
{
  "success": true,
  "message": "Skill created successfully",
  "data": {
    "id": 45,
    "name": "Kubernetes",
    "categoryId": 3,
    "categoryName": "IT Careers & Technical Consultation",
    "isActive": true,
    "createdAt": "2025-01-10T15:30:00Z",
    "updatedAt": null
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
      "Name": ["Skill name is required"],
      "CategoryId": ["Category does not exist"]
    },
    "statusCode": 400
  }
  ```

- **409 Conflict:**
  ```json
  {
    "success": false,
    "message": "Skill 'Kubernetes' already exists in this category",
    "statusCode": 409
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

**Backend Behavior:**
- Verify user has Admin role
- Validate skill name and category ID
- Check if skill name already exists in the category (unique constraint)
- Create skill record in database
- Return created skill with generated ID

---

## 4. Update Skill (Admin Only)

**Endpoint:** `PATCH /api/skills/{id}`  
**Requires:** `Authorization: Bearer {token}`  
**Roles:** Admin only

**Path Parameters:**
- `id` (integer): Skill ID to update

**Request Body:**
```json
{
  "name": "React & React Native",
  "categoryId": 3,
  "isActive": true
}
```

**Field Requirements:**
- `name` (optional): Min 2 chars, max 100 chars, unique within category
- `categoryId` (optional): Must be valid existing category ID
- `isActive` (optional): Boolean to activate/deactivate skill

**Note:** All fields are optional. Only provided fields will be updated.

**Success Response (200):**
```json
{
  "success": true,
  "message": "Skill updated successfully",
  "data": {
    "id": 15,
    "name": "React & React Native",
    "categoryId": 3,
    "categoryName": "IT Careers & Technical Consultation",
    "isActive": true,
    "createdAt": "2025-01-10T10:00:00Z",
    "updatedAt": "2025-01-10T16:45:00Z"
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
      "Name": ["Skill name must be at least 2 characters"],
      "CategoryId": ["Category does not exist"]
    },
    "statusCode": 400
  }
  ```

- **404 Not Found:**
  ```json
  {
    "success": false,
    "message": "Skill not found",
    "statusCode": 404
  }
  ```

- **409 Conflict:**
  ```json
  {
    "success": false,
    "message": "Skill name already exists in this category",
    "statusCode": 409
  }
  ```

- **401 Unauthorized / 403 Forbidden:** (same as above)

**Backend Behavior:**
- Verify user has Admin role
- Validate all provided fields
- Check for name uniqueness within category if name is being changed
- Update only provided fields (PATCH semantics)
- Update `updatedAt` timestamp
- Return updated skill data

---

## 5. Delete Skill (Admin Only)

**Endpoint:** `DELETE /api/skills/{id}`  
**Requires:** `Authorization: Bearer {token}`  
**Roles:** Admin only

**Path Parameters:**
- `id` (integer): Skill ID to delete

**Success Response (200):**
```json
{
  "success": true,
  "message": "Skill deleted successfully"
}
```

**Error Responses:**

- **404 Not Found:**
  ```json
  {
    "success": false,
    "message": "Skill not found",
    "statusCode": 404
  }
  ```

- **409 Conflict:**
  ```json
  {
    "success": false,
    "message": "Cannot delete skill. It is currently being used by 15 users",
    "statusCode": 409
  }
  ```

- **401 Unauthorized / 403 Forbidden:** (same as above)

**Backend Behavior:**
- Verify user has Admin role
- Check if skill is being used by any users/mentors
- If in use, consider soft delete (set `isActive = false`) instead of hard delete
- Or return 409 if hard delete is attempted on used skill
- Remove skill from database (or soft delete)
- Return success message

**Recommended:** Use soft delete (isActive flag) instead of hard delete to preserve data integrity.

---

## Model Structures

### SkillDto

```typescript
{
  "id": "number",
  "name": "string",
  "categoryId": "number",
  "categoryName": "string",
  "isActive": "boolean"
}
```

### SkillDetailDto (with timestamps)

```typescript
{
  "id": "number",
  "name": "string",
  "categoryId": "number",
  "categoryName": "string",
  "isActive": "boolean",
  "createdAt": "ISO 8601 date string",
  "updatedAt": "ISO 8601 date string | null"
}
```

### CreateSkillDto

```typescript
{
  "name": "string",
  "categoryId": "number"
}
```

### UpdateSkillDto

```typescript
{
  "name": "string | optional",
  "categoryId": "number | optional",
  "isActive": "boolean | optional"
}
```

### UpdateUserSkillsDto

```typescript
{
  "skillIds": "number[]"
}
```

### CategoryWithSkillsDto

```typescript
{
  "id": "number",
  "name": "string",
  "skills": [
    {
      "id": "number",
      "name": "string",
      "isActive": "boolean"
    }
  ]
}
```

---

## Validation Rules

### Skill Name
- Required for creation
- Min 2 characters
- Max 100 characters
- Must be unique within the same category
- Trimmed whitespace
- Cannot be empty or only whitespace

### Category ID
- Required for creation
- Must reference an existing category
- Foreign key constraint

### Skill IDs Array
- Required for updating user/mentor skills
- Can be empty array (clears all skills)
- All IDs must exist in Skills table
- All IDs must have `isActive = true`
- Duplicates are ignored

### Is Active
- Boolean value
- Default is `true` for new skills
- Used for soft delete functionality

---

## Security Considerations

### Authorization
- **Public endpoints:** GET /api/skills and GET /api/skills/{id} can be public or require authentication
- **Admin-only endpoints:** POST, PATCH, DELETE on /api/skills require Admin role
- **User endpoints:** PATCH /api/users/me/career-interests accessible to own profile only
- **Mentor endpoints:** PATCH /api/mentors/{id}/expertise-tags accessible to mentor owner or Admin
- Verify JWT token and extract claims for authorization checks
- Return 403 for unauthorized access attempts

### Data Validation
- Server-side validation is mandatory for all fields
- Validate skill IDs exist and are active before updating user/mentor skills
- Check for duplicate skill names within the same category
- Sanitize skill names to prevent XSS attacks
- Validate category IDs against existing categories

### Data Integrity
- Use soft delete (isActive flag) instead of hard delete to preserve references
- Consider cascading logic or prevent deletion if skill is in use
- Maintain referential integrity between Skills, UserSkills, and Categories
- Use transactions when updating user/mentor skills (delete + insert)

### Business Rules
- Skills are flat - no parent-child relationships
- Skill names must be unique within a category (but can repeat across categories)
- Users can have unlimited skills (consider reasonable UI limit)
- Mentors should have at least 1 skill (consider validation)
- Same user can have different skills as mentee vs mentor

---

## Testing Checklist

### GET /api/skills
- [ ] Get all skills without filters
- [ ] Get skills filtered by categoryId
- [ ] Get skills filtered by isActive status
- [ ] Get skills when none exist (should return 404)
- [ ] Verify skills are ordered by category and name
- [ ] Test with and without authentication token

### GET /api/skills/{id}
- [ ] Get skill by valid ID
- [ ] Get skill by non-existent ID (should return 404)
- [ ] Verify category information is included

### POST /api/skills (Admin)
- [ ] Create skill with valid data as Admin
- [ ] Create skill as non-Admin (should return 403)
- [ ] Create skill with missing required fields (should return 400)
- [ ] Create skill with invalid categoryId (should return 400)
- [ ] Create duplicate skill in same category (should return 409)
- [ ] Create skill without token (should return 401)

### PATCH /api/skills/{id} (Admin)
- [ ] Update skill name as Admin
- [ ] Update skill category as Admin
- [ ] Update skill isActive status as Admin
- [ ] Update with partial data (only some fields)
- [ ] Update as non-Admin (should return 403)
- [ ] Update non-existent skill (should return 404)
- [ ] Update with invalid data (should return 400)
- [ ] Update with duplicate name in category (should return 409)

### DELETE /api/skills/{id} (Admin)
- [ ] Delete unused skill as Admin
- [ ] Delete skill in use (should return 409 or soft delete)
- [ ] Delete as non-Admin (should return 403)
- [ ] Delete non-existent skill (should return 404)

### PATCH /api/users/me/career-interests
- [ ] Update career interests with valid skill IDs
- [ ] Clear all career interests (empty array)
- [ ] Update with invalid skill IDs (should return 400)
- [ ] Update with inactive skill IDs (should return 400)
- [ ] Update without token (should return 401)
- [ ] Verify old skills are replaced, not appended

### PATCH /api/mentors/{id}/expertise-tags
- [ ] Update own expertise tags as mentor
- [ ] Update other mentor's tags as Admin (should succeed)
- [ ] Update other mentor's tags as non-Admin (should return 403)
- [ ] Update expertise tags with valid skill IDs
- [ ] Clear all expertise tags (empty array)
- [ ] Update with invalid skill IDs (should return 400)
- [ ] Update non-existent mentor (should return 404)
- [ ] Verify old skills are replaced, not appended

---

## Sample API Requests

**Get All Skills:**
```bash
GET http://localhost:5000/api/skills
Authorization: Bearer {access-token}
```

**Get Skills by Category:**
```bash
GET http://localhost:5000/api/skills?categoryId=3
Authorization: Bearer {access-token}
```

**Get Skill by ID:**
```bash
GET http://localhost:5000/api/skills/15
Authorization: Bearer {access-token}
```

**Create Skill (Admin):**
```bash
POST http://localhost:5000/api/skills
Authorization: Bearer {access-token}
Content-Type: application/json

{
  "name": "Kubernetes",
  "categoryId": 3
}
```

**Update Skill (Admin):**
```bash
PATCH http://localhost:5000/api/skills/15
Authorization: Bearer {access-token}
Content-Type: application/json

{
  "name": "React & React Native",
  "isActive": true
}
```

**Delete Skill (Admin):**
```bash
DELETE http://localhost:5000/api/skills/15
Authorization: Bearer {access-token}
```

**Update User Career Interests:**
```bash
PATCH http://localhost:5000/api/users/me/career-interests
Authorization: Bearer {access-token}
Content-Type: application/json

{
  "skillIds": [1, 5, 15, 20]
}
```

**Update Mentor Expertise Tags:**
```bash
PATCH http://localhost:5000/api/mentors/101/expertise-tags
Authorization: Bearer {access-token}
Content-Type: application/json

{
  "skillIds": [5, 15, 20, 25, 30]
}
```

---

## Related Documentation

- **📖 API Endpoints Index**: See [API-Endpoints-Index.md](./API-Endpoints-Index.md) for complete endpoint directory and cross-references
- **Skills-System-Overview.md** - High-level overview for frontend and backend teams
- **Skills-Career-Interests-Proposal.md** - Detailed technical proposal and database design
- **User-Profile-Endpoints.md** - User profile management endpoints
- **Category-Endpoints.md** - Category management endpoints (Skills belong to Categories)

---

## Notes

1. **Skill Names:** Should be clear and self-descriptive (no descriptions field)
2. **Context-Driven Naming:** Same skills data, different field names in API:
   - User profile → `careerInterests`
   - Mentor profile → `expertiseTags`
3. **Flat Structure:** Skills don't have parent-child relationships - they're organized only by categories
4. **Mixed Types:** Skills can be career guidance ("Career Shifting") or technical consultation ("React")
5. **Soft Delete Recommended:** Use `isActive` flag instead of hard delete to preserve data integrity
6. **Transaction Safety:** Use database transactions when updating user/mentor skills (delete all + insert new)
7. **Performance:** Consider caching the skills list as it changes infrequently
8. **Future Enhancement:** Consider adding skill search/autocomplete endpoint for better UX
