# API Endpoints Documentation Index

**Last Updated:** 2025-11-10  
**Base URL:** `http://localhost:5000/api`

---

## 📖 Purpose

This index provides a comprehensive map of all API endpoints across the CareerRoute platform. Use this to quickly locate endpoint documentation and understand the relationships between different contract files.

---

## 🗂️ Quick Navigation

| Resource | Primary Document |
|----------|-----------------|
| **Authentication** | [Authentication-Endpoints.md](./Authentication-Endpoints.md) |
| **Categories** | [Category-Endpoints.md](./Category-Endpoints.md) |
| **Skills** | [Skills-Endpoints.md](./Skills-Endpoints.md) |
| **Mentors** | [Mentor-Endpoints.md](./Mentor-Endpoints.md) |
| **Users** | [User-Profile-Endpoints.md](./User-Profile-Endpoints.md) |

---

## 📋 Complete Endpoint Index

### Authentication (8 endpoints)

| Method | Endpoint | Auth | Documented In | Notes |
|--------|----------|------|---------------|-------|
| `POST` | `/api/auth/register` | Public | **[Authentication-Endpoints.md](./Authentication-Endpoints.md#1-user-registration)** | ✅ Authoritative |
| `POST` | `/api/auth/login` | Public | **[Authentication-Endpoints.md](./Authentication-Endpoints.md#2-user-login)** | ✅ Authoritative |
| `POST` | `/api/auth/refresh` | Public | **[Authentication-Endpoints.md](./Authentication-Endpoints.md#3-token-refresh)** | ✅ Authoritative<br/>Accepts expired tokens |
| `POST` | `/api/auth/verify-email` | Public | **[Authentication-Endpoints.md](./Authentication-Endpoints.md#4-email-verification)** | ✅ Authoritative<br/>Auto-login on success |
| `POST` | `/api/auth/resend-verification` | Public | **[Authentication-Endpoints.md](./Authentication-Endpoints.md#5-resend-email-verification)** | ✅ Authoritative<br/>Rate limited |
| `POST` | `/api/auth/forgot-password` | Public | **[Authentication-Endpoints.md](./Authentication-Endpoints.md#6-forgot-password)** | ✅ Authoritative<br/>Rate limited |
| `POST` | `/api/auth/reset-password` | Public | **[Authentication-Endpoints.md](./Authentication-Endpoints.md#7-reset-password)** | ✅ Authoritative |
| `POST` | `/api/auth/change-password` | User | **[Authentication-Endpoints.md](./Authentication-Endpoints.md#8-change-password-authenticated)** | ✅ Authoritative<br/>Requires current password |

---

### Categories (6 endpoints)

| Method | Endpoint | Auth | Documented In | Notes |
|--------|----------|------|---------------|-------|
| `GET` | `/api/categories` | Public | **[Category-Endpoints.md](./Category-Endpoints.md#1-get-all-categories)** | ✅ Authoritative<br/>📖 Referenced in [Mentor-Endpoints.md](./Mentor-Endpoints.md#5-get-all-categories-quick-reference) |
| `GET` | `/api/categories/{id}` | Public | **[Category-Endpoints.md](./Category-Endpoints.md#2-get-single-category-by-id)** | ✅ Authoritative |
| `POST` | `/api/categories` | Admin | **[Category-Endpoints.md](./Category-Endpoints.md#3-create-category-admin-only)** | ✅ Authoritative |
| `PUT` | `/api/categories/{id}` | Admin | **[Category-Endpoints.md](./Category-Endpoints.md#4-update-category-admin-only)** | ✅ Authoritative |
| `DELETE` | `/api/categories/{id}` | Admin | **[Category-Endpoints.md](./Category-Endpoints.md#5-delete-category-admin-only)** | ✅ Authoritative |
| `GET` | `/api/categories/{id}/mentors` | Public | **[Category-Endpoints.md](./Category-Endpoints.md#6-get-mentors-by-category)** | ✅ Authoritative<br/>📖 Referenced in [Mentor-Endpoints.md](./Mentor-Endpoints.md#6-get-mentors-by-category-quick-reference) |

---

### Skills (7 endpoints)

| Method | Endpoint | Auth | Documented In | Notes |
|--------|----------|------|---------------|-------|
| `GET` | `/api/skills` | Public/Auth | **[Skills-Endpoints.md](./Skills-Endpoints.md#1-get-all-skills)** | ✅ Authoritative |
| `GET` | `/api/skills/{id}` | Public/Auth | **[Skills-Endpoints.md](./Skills-Endpoints.md#2-get-skill-by-id)** | ✅ Authoritative |
| `POST` | `/api/skills` | Admin | **[Skills-Endpoints.md](./Skills-Endpoints.md#3-create-skill-admin-only)** | ✅ Authoritative |
| `PATCH` | `/api/skills/{id}` | Admin | **[Skills-Endpoints.md](./Skills-Endpoints.md#4-update-skill-admin-only)** | ✅ Authoritative |
| `DELETE` | `/api/skills/{id}` | Admin | **[Skills-Endpoints.md](./Skills-Endpoints.md#5-delete-skill-admin-only)** | ✅ Authoritative |
| `PATCH` | `/api/users/me/career-interests` | User | **[Skills-Endpoints.md](./Skills-Endpoints.md#6-update-user-career-interests)** | ✅ Authoritative<br/>📖 Referenced in [User-Profile-Endpoints.md](./User-Profile-Endpoints.md) |
| `PATCH` | `/api/mentors/{mentorId}/expertise-tags` | Mentor/Admin | **[Skills-Endpoints.md](./Skills-Endpoints.md#7-update-mentor-expertise-tags)** | ✅ Authoritative<br/>📖 Referenced in [Mentor-Endpoints.md](./Mentor-Endpoints.md) |

---

### Mentors (9 endpoints)

| Method | Endpoint | Auth | Documented In | Notes |
|--------|----------|------|---------------|-------|
| `GET` | `/api/mentors` | Public | **[Mentor-Endpoints.md](./Mentor-Endpoints.md#1-get-all-approved-mentors)** | ✅ Authoritative<br/>Advanced search with filters |
| `GET` | `/api/mentors/search` | Public | **[Mentor-Endpoints.md](./Mentor-Endpoints.md#2-search-mentors-by-keywords)** | ✅ Authoritative<br/>Simple keyword search |
| `GET` | `/api/mentors/top-rated` | Public | **[Mentor-Endpoints.md](./Mentor-Endpoints.md#3-get-top-rated-mentors)** | ✅ Authoritative |
| `GET` | `/api/mentors/{id}` | Public | **[Mentor-Endpoints.md](./Mentor-Endpoints.md#4-get-mentor-profile-by-id)** | ✅ Authoritative |
| `POST` | `/api/mentors` | User | **[Mentor-Endpoints.md](./Mentor-Endpoints.md#7-apply-to-become-a-mentor)** | ✅ Authoritative<br/>Application pending approval |
| `PATCH` | `/api/mentors/{id}` | User/Admin | **[Mentor-Endpoints.md](./Mentor-Endpoints.md#8-update-mentor-profile)** | ✅ Authoritative<br/>Own profile or Admin |
| `GET` | `/api/mentors/pending` | Admin | **[Mentor-Endpoints.md](./Mentor-Endpoints.md#9-get-pending-mentor-applications)** | ✅ Authoritative<br/>Review applications |
| `PATCH` | `/api/mentors/{id}/approve` | Admin | **[Mentor-Endpoints.md](./Mentor-Endpoints.md#10-approve-mentor-application)** | ✅ Authoritative<br/>Approve application |
| `PATCH` | `/api/mentors/{id}/reject` | Admin | **[Mentor-Endpoints.md](./Mentor-Endpoints.md#11-reject-mentor-application)** | ✅ Authoritative<br/>Reject with reason |

---

### Users (6 endpoints)

| Method | Endpoint | Auth | Documented In | Notes |
|--------|----------|------|---------------|-------|
| `GET` | `/api/users/me` | User | **[User-Profile-Endpoints.md](./User-Profile-Endpoints.md#1-get-current-user-profile)** | ✅ Authoritative |
| `PATCH` | `/api/users/me` | User | **[User-Profile-Endpoints.md](./User-Profile-Endpoints.md#2-update-current-user-profile)** | ✅ Authoritative<br/>⚠️ Does NOT update careerInterests |
| `DELETE` | `/api/users/me` | User | **[User-Profile-Endpoints.md](./User-Profile-Endpoints.md#3-delete-current-user-account)** | ✅ Authoritative |
| `GET` | `/api/users` | Admin/Mentor | **[User-Profile-Endpoints.md](./User-Profile-Endpoints.md#4-get-all-users)** | ✅ Authoritative |
| `GET` | `/api/users/{id}` | Admin/Mentor | **[User-Profile-Endpoints.md](./User-Profile-Endpoints.md#5-get-user-by-id)** | ✅ Authoritative |
| `PATCH` | `/api/users/{id}` | Admin | **[User-Profile-Endpoints.md](./User-Profile-Endpoints.md#6-update-user-by-admin)** | ✅ Authoritative<br/>⚠️ Does NOT update careerInterests |

---

## 🔗 Cross-Document Relationships

### Skills System Integration

The Skills system is integrated across multiple resources:

```
Skills-Endpoints.md (MASTER)
    ├─ Defines SkillDto model
    ├─ CRUD operations for Skills
    └─ User/Mentor skills update endpoints
    
User-Profile-Endpoints.md
    ├─ careerInterests field → SkillDto[]
    └─ References Skills-Endpoints.md for updates
    
Mentor-Endpoints.md
    ├─ expertiseTags field → SkillDto[]
    └─ References Skills-Endpoints.md for updates
    
Category-Endpoints.md
    └─ Categories contain Skills (parent-child relationship)
```

**Key Points:**
- ✅ Skills are managed in [Skills-Endpoints.md](./Skills-Endpoints.md)
- 🔄 User career interests updated via `PATCH /api/users/me/career-interests`
- 🔄 Mentor expertise tags updated via `PATCH /api/mentors/{mentorId}/expertise-tags`
- ❌ **NOT updated** via profile update endpoints

---

### Category-Mentor Integration

Category and Mentor endpoints share browse/discovery functionality:

```
Category-Endpoints.md (AUTHORITATIVE)
    ├─ GET /api/categories
    └─ GET /api/categories/{id}/mentors
    
Mentor-Endpoints.md (REFERENCES)
    ├─ Quick summaries of category endpoints
    ├─ Links to Category-Endpoints.md for full docs
    └─ Primary focus: mentor search/filter/detail/application/approval
```

**Single Source of Truth:**
- ✅ Category CRUD → [Category-Endpoints.md](./Category-Endpoints.md)
- ✅ Category browsing → [Category-Endpoints.md](./Category-Endpoints.md)
- 📖 Mentor discovery context → [Mentor-Endpoints.md](./Mentor-Endpoints.md) (with references)

---

## 📊 Endpoint Statistics

| Resource | Total Endpoints | Public | Authenticated | Admin Only |
|----------|----------------|--------|---------------|------------|
| Authentication | 8 | 7 | 1 | 0 |
| Categories | 6 | 2 | 0 | 4 |
| Skills | 7 | 2 | 3 | 2 |
| Mentors | 9 | 4 | 2 | 3 |
| Users | 6 | 0 | 4 | 2 |
| **TOTAL** | **36** | **15** | **10** | **11** |

---

## 🔐 Authentication Summary

### Public Endpoints (No Auth Required)

**Authentication:**
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/verify-email`
- `POST /api/auth/resend-verification`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

**Categories:**
- `GET /api/categories`
- `GET /api/categories/{id}`
- `GET /api/categories/{id}/mentors`

**Skills:**
- `GET /api/skills` (can be public or auth)
- `GET /api/skills/{id}` (can be public or auth)

**Mentors:**
- `GET /api/mentors`
- `GET /api/mentors/search`
- `GET /api/mentors/top-rated`
- `GET /api/mentors/{id}`

### Authenticated Endpoints (User/Mentor/Admin)

**Authentication:**
- `POST /api/auth/change-password` (Any authenticated user)

**Users:**
- `GET /api/users/me` (Any authenticated user)
- `PATCH /api/users/me` (Any authenticated user)
- `DELETE /api/users/me` (Any authenticated user)

**Skills:**
- `PATCH /api/users/me/career-interests` (Any authenticated user)

**Users (Admin/Mentor):**
- `GET /api/users` (Admin or Mentor)
- `GET /api/users/{id}` (Admin or Mentor)

**Mentors:**
- `POST /api/mentors` (Any authenticated user - apply as mentor)
- `PATCH /api/mentors/{id}` (Mentor own profile or Admin)

### Admin-Only Endpoints

**Categories:**
- `POST /api/categories` (Admin)
- `PUT /api/categories/{id}` (Admin)
- `DELETE /api/categories/{id}` (Admin)

**Skills:**
- `POST /api/skills` (Admin)
- `PATCH /api/skills/{id}` (Admin)
- `DELETE /api/skills/{id}` (Admin)

**Users:**
- `PATCH /api/users/{id}` (Admin)

**Mentors:**
- `GET /api/mentors/pending` (Admin - review applications)
- `PATCH /api/mentors/{id}/approve` (Admin - approve mentor)
- `PATCH /api/mentors/{id}/reject` (Admin - reject mentor)

### Mentor/Admin Endpoints
- `PATCH /api/mentors/{mentorId}/expertise-tags` (Mentor own profile or Admin)

---

## 🎯 Common Use Cases

### 1. User Registration & Verification Flow
```
1. Register user → POST /api/auth/register
   📖 Authentication-Endpoints.md
2. User receives verification email
3. Click email link → POST /api/auth/verify-email (auto-called)
   📖 Authentication-Endpoints.md
4. Select career interests → PATCH /api/users/me/career-interests
   📖 Skills-Endpoints.md
```

### 2. User Login Flow
```
1. Login → POST /api/auth/login
   📖 Authentication-Endpoints.md
2. Store tokens in localStorage
3. Access protected endpoints with Bearer token
4. Auto-refresh before expiration → POST /api/auth/refresh
   📖 Authentication-Endpoints.md
```

### 3. Password Reset Flow
```
1. Request reset → POST /api/auth/forgot-password
   📖 Authentication-Endpoints.md
2. User receives reset email
3. Click email link → Navigate to reset form
4. Submit new password → POST /api/auth/reset-password
   📖 Authentication-Endpoints.md
```

### 4. Browse Mentors by Category
```
1. Get all categories → GET /api/categories
   📖 Category-Endpoints.md
2. Get mentors in category → GET /api/categories/{id}/mentors
   📖 Category-Endpoints.md
3. View mentor detail → GET /api/mentors/{id}
   📖 Mentor-Endpoints.md
```

### 5. Search Mentors by Skills
```
1. Get all skills → GET /api/skills
   📖 Skills-Endpoints.md
2. Search mentors with filters → GET /api/mentors?keywords=react&minRating=4.5
   📖 Mentor-Endpoints.md
```

### 6. Update User Profile
```
1. Update basic info → PATCH /api/users/me
   📖 User-Profile-Endpoints.md
2. Update career interests → PATCH /api/users/me/career-interests
   📖 Skills-Endpoints.md
```

### 7. Admin Category Management
```
1. Create category → POST /api/categories
   📖 Category-Endpoints.md
2. Create skills for category → POST /api/skills (multiple times)
   📖 Skills-Endpoints.md
3. Update category → PUT /api/categories/{id}
   📖 Category-Endpoints.md
```

---

## 📝 Model Documentation

### Where to Find Model Definitions

| Model | Documented In | Used By |
|-------|---------------|---------|
| **ApiResponse&lt;T&gt;** | [Authentication-Endpoints.md](./Authentication-Endpoints.md#api-response-structure-apiresponse-wrapper) | All endpoints |
| **LoginResponse** | [Authentication-Endpoints.md](./Authentication-Endpoints.md#2-user-login) | Authentication |
| **RegisterResponse** | [Authentication-Endpoints.md](./Authentication-Endpoints.md#1-user-registration) | Authentication |
| **TokenRefreshResponse** | [Authentication-Endpoints.md](./Authentication-Endpoints.md#3-token-refresh) | Authentication |
| **EmailVerificationResponse** | [Authentication-Endpoints.md](./Authentication-Endpoints.md#4-email-verification) | Authentication |
| **CategoryDto** | [Category-Endpoints.md](./Category-Endpoints.md#category-model-structure-categoryDto) | Categories, Mentors |
| **SkillDto** | [Skills-Endpoints.md](./Skills-Endpoints.md#skilldto) | Skills, Users, Mentors |
| **MentorProfileDto** | [Mentor-Endpoints.md](./Mentor-Endpoints.md#mentorprofiledto) | Mentors |
| **CreateMentorProfileDto** | [Mentor-Endpoints.md](./Mentor-Endpoints.md#creatementorprofiledto) | Mentors |
| **UpdateMentorProfileDto** | [Mentor-Endpoints.md](./Mentor-Endpoints.md#updatementorprofiledto) | Mentors |
| **RejectMentorDto** | [Mentor-Endpoints.md](./Mentor-Endpoints.md#rejectmentordto) | Mentors |
| **RetrieveUserDto** | [User-Profile-Endpoints.md](./User-Profile-Endpoints.md#user-model-structure-retrieveuserdto) | Users |
| **UpdateUserDto** | [User-Profile-Endpoints.md](./User-Profile-Endpoints.md#update-user-model-structure-updateuserdto) | Users |
| **CreateSkillDto** | [Skills-Endpoints.md](./Skills-Endpoints.md#createskilldto) | Skills |
| **UpdateSkillDto** | [Skills-Endpoints.md](./Skills-Endpoints.md#updateskilldto) | Skills |
| **CreateCategoryDto** | [Category-Endpoints.md](./Category-Endpoints.md#create-category-model-structure-createcategorydto) | Categories |
| **UpdateCategoryDto** | [Category-Endpoints.md](./Category-Endpoints.md#update-category-model-structure-updatecategorydto) | Categories |

---

## ⚠️ Important Notes

### Authentication & Security
- 🔐 **JWT Token Format**: See [Authentication-Endpoints.md - JWT Token Structure](./Authentication-Endpoints.md#jwt-token-structure)
- 🔄 **Token Refresh**: Auto-refresh 5 minutes before expiration
- 🔒 **Token Storage**: `career_route_token` and `career_route_refresh_token` in localStorage
- ⏱️ **Token Expiration**: Access token (1 hour), Refresh token (7 days)
- 🚫 **Rate Limiting**: 
  - Login attempts (brute force prevention)
  - Password reset (max 3/hour)
  - Email verification (max 1/5 minutes)

### Duplicate Prevention
- ✅ **Single Source of Truth** principle enforced
- 📖 Cross-references used instead of duplication
- ⚠️ Always check this index before adding new endpoints

### Skills System Critical Info
- ⚠️ **Do NOT update careerInterests via user profile endpoints**
- ⚠️ **Do NOT update expertiseTags via mentor profile endpoints**
- ✅ **Use dedicated Skills endpoints** for both

### Breaking Changes
- 📅 Category system unified (removed `type` field) - see [Category-Endpoints.md](./Category-Endpoints.md#⚠️-breaking-changes---unified-category-system)
- 📅 API Response Wrapper (ApiResponse<T>) - see [Authentication-Endpoints.md](./Authentication-Endpoints.md#api-response-structure-apiresponse-wrapper)

---

## 🔍 Search Tips

### Find an Endpoint
1. **By Resource**: Use the Complete Endpoint Index above
2. **By Method**: Use browser search (Ctrl+F) for `GET`, `POST`, `PATCH`, etc.
3. **By Feature**: Check Common Use Cases section
4. **By Model**: Check Model Documentation section

### Find Related Documentation
- Each endpoint links directly to its section in the authoritative document
- "Referenced in" shows where else the endpoint is mentioned
- Related Documentation sections in each contract file cross-reference related endpoints

---

## 📚 Additional Documentation

### System Overviews
- **Skills System Overview**: [Skills-System-Overview.md](./Skills-System-Overview.md)
- **Skills Technical Proposal**: [Skills-Career-Interests-Proposal.md](./Skills-Career-Interests-Proposal.md)

### Core API Contracts
- **Authentication**: [Authentication-Endpoints.md](./Authentication-Endpoints.md) - Registration, login, tokens, password management
- **Categories**: [Category-Endpoints.md](./Category-Endpoints.md) - Category CRUD and mentor browsing
- **Skills**: [Skills-Endpoints.md](./Skills-Endpoints.md) - Skills CRUD and user/mentor skills management
- **Mentors**: [Mentor-Endpoints.md](./Mentor-Endpoints.md) - Mentor search, application, profile management, and admin approval
- **Users**: [User-Profile-Endpoints.md](./User-Profile-Endpoints.md) - User profile management

---

## 🔄 Maintenance

**When adding new endpoints:**
1. Document in the appropriate contract file
2. Update this index
3. Add cross-references in related documents
4. Update the statistics section
5. Add to Common Use Cases if applicable

**Last Review:** 2025-11-10  

---

**Total Documented Endpoints:** 36  
**Total Contract Files:** 5  
**Documentation Status:** ✅ Complete & Synchronized
