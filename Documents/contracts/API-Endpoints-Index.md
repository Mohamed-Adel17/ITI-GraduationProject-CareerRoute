# API Endpoints Documentation Index

**Last Updated:** 2025-11-19
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

### Skills (5 endpoints)

| Method | Endpoint | Auth | Documented In | Notes |
|--------|----------|------|---------------|-------|
| `GET` | `/api/skills` | Public/Auth | **[Skills-Endpoints.md](./Skills-Endpoints.md#1-get-all-skills)** | ✅ Authoritative |
| `GET` | `/api/skills/{id}` | Public/Auth | **[Skills-Endpoints.md](./Skills-Endpoints.md#2-get-skill-by-id)** | ✅ Authoritative |
| `POST` | `/api/skills` | Admin | **[Skills-Endpoints.md](./Skills-Endpoints.md#3-create-skill-admin-only)** | ✅ Authoritative |
| `PATCH` | `/api/skills/{id}` | Admin | **[Skills-Endpoints.md](./Skills-Endpoints.md#4-update-skill-admin-only)** | ✅ Authoritative |
| `DELETE` | `/api/skills/{id}` | Admin | **[Skills-Endpoints.md](./Skills-Endpoints.md#5-delete-skill-admin-only)** | ✅ Authoritative |

**Note:** User career interests are now updated via `PATCH /api/users/me` with `careerInterestIds` field (see [User-Profile-Endpoints.md](./User-Profile-Endpoints.md)). Mentor expertise tags are updated via `PATCH /api/mentors/{id}` with `expertiseTagIds` field (see [Mentor-Endpoints.md](./Mentor-Endpoints.md)).

---

### Mentors (10 endpoints)

| Method | Endpoint | Auth | Documented In | Notes |
|--------|----------|------|---------------|-------|
| `GET` | `/api/mentors` | Public | **[Mentor-Endpoints.md](./Mentor-Endpoints.md#1-get-all-approved-mentors)** | ✅ Authoritative<br/>Advanced search with filters |
| `GET` | `/api/mentors/search` | Public | **[Mentor-Endpoints.md](./Mentor-Endpoints.md#2-search-mentors-by-keywords)** | ✅ Authoritative<br/>Simple keyword search |
| `GET` | `/api/mentors/top-rated` | Public | **[Mentor-Endpoints.md](./Mentor-Endpoints.md#3-get-top-rated-mentors)** | ✅ Authoritative |
| `GET` | `/api/mentors/{id}` | Public | **[Mentor-Endpoints.md](./Mentor-Endpoints.md#4-get-mentor-profile-by-id)** | ✅ Authoritative |
| `GET` | `/api/mentors/me` | User | **[Mentor-Endpoints.md](./Mentor-Endpoints.md#7-get-current-mentors-own-profile)** | ✅ Authoritative<br/>No Mentor role required |
| `POST` | `/api/mentors` | User | **[Mentor-Endpoints.md](./Mentor-Endpoints.md#8-apply-to-become-a-mentor)** | ✅ Authoritative<br/>Application pending approval |
| `PATCH` | `/api/mentors/me` | User | **[Mentor-Endpoints.md](./Mentor-Endpoints.md#9-update-current-mentors-own-profile)** | ✅ Authoritative<br/>Includes user & mentor fields<br/>No Mentor role required |
| `GET` | `/api/mentors/pending` | Admin | **[Mentor-Endpoints.md](./Mentor-Endpoints.md#10-get-pending-mentor-applications)** | ✅ Authoritative<br/>Review applications |
| `PATCH` | `/api/mentors/{id}/approve` | Admin | **[Mentor-Endpoints.md](./Mentor-Endpoints.md#11-approve-mentor-application)** | ✅ Authoritative<br/>Approve application |
| `PATCH` | `/api/mentors/{id}/reject` | Admin | **[Mentor-Endpoints.md](./Mentor-Endpoints.md#12-reject-mentor-application)** | ✅ Authoritative<br/>Reject with reason |

---

### Users (6 endpoints)

| Method | Endpoint | Auth | Documented In | Notes |
|--------|----------|------|---------------|-------|
| `GET` | `/api/users/me` | User | **[User-Profile-Endpoints.md](./User-Profile-Endpoints.md#1-get-current-user-profile)** | ✅ Authoritative<br/>Includes Roles, IsMentor, EmailConfirmed |
| `PATCH` | `/api/users/me` | User | **[User-Profile-Endpoints.md](./User-Profile-Endpoints.md#2-update-current-user-profile)** | ✅ Authoritative<br/>Includes CareerGoals field |
| `DELETE` | `/api/users/me` | User | **[User-Profile-Endpoints.md](./User-Profile-Endpoints.md#3-delete-current-user-account)** | ✅ Authoritative |
| `GET` | `/api/users` | Admin/Mentor | **[User-Profile-Endpoints.md](./User-Profile-Endpoints.md#4-get-all-users)** | ✅ Authoritative<br/>Filters out mentor profiles |
| `GET` | `/api/users/{id}` | Admin/Mentor | **[User-Profile-Endpoints.md](./User-Profile-Endpoints.md#5-get-user-by-id)** | ✅ Authoritative<br/>Filters out mentor profiles |
| `PATCH` | `/api/users/{id}` | Admin | **[User-Profile-Endpoints.md](./User-Profile-Endpoints.md#6-update-user-by-admin)** | ✅ Authoritative<br/>Includes CareerGoals field |

---

### Sessions (10 endpoints)

| Method | Endpoint | Auth | Documented In | Notes |
|--------|----------|------|---------------|-------|
| `POST` | `/api/sessions` | User | **[Session-Payment-Endpoints.md](./Session-Payment-Endpoints.md#1-book-new-session)** | ✅ Authoritative<br/>Book session with timeSlotId |
| `GET` | `/api/sessions/{id}` | User/Mentor/Admin | **[Session-Payment-Endpoints.md](./Session-Payment-Endpoints.md#2-get-session-detail)** | ✅ Authoritative<br/>View session details |
| `GET` | `/api/sessions/upcoming` | User | **[Session-Payment-Endpoints.md](./Session-Payment-Endpoints.md#3-get-upcoming-sessions)** | ✅ Authoritative<br/>Paginated list |
| `GET` | `/api/sessions/past` | User | **[Session-Payment-Endpoints.md](./Session-Payment-Endpoints.md#4-get-past-sessions)** | ✅ Authoritative<br/>Paginated list with review flags |
| `PATCH` | `/api/sessions/{id}/reschedule` | User/Mentor | **[Session-Payment-Endpoints.md](./Session-Payment-Endpoints.md#5-reschedule-session)** | ✅ Authoritative<br/>Requires mentor approval |
| `PATCH` | `/api/sessions/{id}/cancel` | User/Mentor/Admin | **[Session-Payment-Endpoints.md](./Session-Payment-Endpoints.md#6-cancel-session)** | ✅ Authoritative<br/>Refund policy applies<br/>Releases TimeSlot |
| `POST` | `/api/sessions/{id}/join` | User/Mentor | **[Session-Payment-Endpoints.md](./Session-Payment-Endpoints.md#7-join-session-get-video-link)** | ✅ Authoritative<br/>Get video conference link |
| `PATCH` | `/api/sessions/{id}/complete` | Mentor/Admin | **[Session-Payment-Endpoints.md](./Session-Payment-Endpoints.md#8-complete-session)** | ✅ Authoritative<br/>Trigger payment release |
| `GET` | `/api/sessions/{id}/recording` | User/Mentor | **[Session-Payment-Endpoints.md](./Session-Payment-Endpoints.md#12-get-session-recording)** | ✅ Authoritative<br/>🎥 Zoom recording access |
| `GET` | `/api/sessions/{id}/transcript` | User/Mentor | **[Session-Payment-Endpoints.md](./Session-Payment-Endpoints.md#13-get-session-transcript)** | ✅ Authoritative<br/>📝 AI transcript access |

---

### Payments (3 endpoints)

| Method | Endpoint | Auth | Documented In | Notes |
|--------|----------|------|---------------|-------|
| `POST` | `/api/payments/create-intent` | User | **[Session-Payment-Endpoints.md](./Session-Payment-Endpoints.md#9-create-payment-intent)** | ✅ Authoritative<br/>Stripe/Paymob integration |
| `POST` | `/api/payments/confirm` | User | **[Session-Payment-Endpoints.md](./Session-Payment-Endpoints.md#10-confirm-payment)** | ✅ Authoritative<br/>Confirm & capture payment |
| `GET` | `/api/payments/history` | User | **[Session-Payment-Endpoints.md](./Session-Payment-Endpoints.md#11-get-payment-history)** | ✅ Authoritative<br/>With summary stats |

---

### Webhooks (2 endpoints - System Integration)

| Method | Endpoint | Auth | Documented In | Notes |
|--------|----------|------|---------------|-------|
| `POST` | `/api/payments/webhooks/stripe` | System | **[Session-Payment-Endpoints.md](./Session-Payment-Endpoints.md#stripe-webhook)** | 🔒 Backend Only<br/>Stripe signature verification |
| `POST` | `/api/payments/webhooks/paymob` | System | **[Session-Payment-Endpoints.md](./Session-Payment-Endpoints.md#paymob-webhook)** | 🔒 Backend Only<br/>HMAC signature verification |

**Note:** Webhook endpoints are called by payment gateways (Stripe, Paymob), not by frontend applications. They are secured via signature verification.

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
- ✅ Skills are managed in [Skills-Endpoints.md](./Skills-Endpoints.md) (admin CRUD only)
- 🔄 User career interests updated via `PATCH /api/users/me` with `careerInterestIds` field
- 🔄 Mentor expertise tags updated via `PATCH /api/mentors/{id}` with `expertiseTagIds` field
- ✅ **Consolidated approach**: Skills updated in profile endpoints (single request)

---

### Session-Payment-Mentor Flow

Session booking and payments connect users with mentors through TimeSlots:

```
Mentor-Endpoints.md
    └─ Mentor discovery & profile viewing
           ↓
    Mentor creates TimeSlots (availability)
           ↓
Session-Payment-Endpoints.md
    ├─ POST /api/sessions (book with timeSlotId)
    ├─ POST /api/payments/create-intent
    ├─ POST /api/payments/confirm → Confirms session
    ├─ Session management (upcoming, past, detail)
    ├─ PATCH reschedule/cancel → Releases TimeSlot
    ├─ POST /api/sessions/{id}/join → Video link
    └─ PATCH /api/sessions/{id}/complete → Payment release
```

**Session Lifecycle:**
1. **Discovery**: User finds mentor via [Mentor-Endpoints.md](./Mentor-Endpoints.md)
2. **View Availability**: User views mentor's available TimeSlots
3. **Booking**: POST /api/sessions with timeSlotId creates session (Pending), marks TimeSlot as booked
4. **Payment**: POST /api/payments/create-intent then POST /api/payments/confirm → session (Confirmed)
5. **Session**: POST /api/sessions/{id}/join → video conference
6. **Completion**: PATCH /api/sessions/{id}/complete → 72h payment hold → payout
7. **Cancellation**: If cancelled, TimeSlot is released and becomes available again

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

| Resource | Total Endpoints | Public | Authenticated | Admin Only | System |
|----------|----------------|--------|---------------|------------|--------|
| Authentication | 8 | 7 | 1 | 0 | 0 |
| Categories | 6 | 2 | 0 | 4 | 0 |
| Skills | 5 | 2 | 0 | 3 | 0 |
| Mentors | 10 | 4 | 3 | 3 | 0 |
| Users | 6 | 0 | 4 | 2 | 0 |
| Sessions | 10 | 0 | 10 | 0 | 0 |
| Payments | 3 | 0 | 3 | 0 | 0 |
| Webhooks | 2 | 0 | 0 | 0 | 2 |
| **TOTAL** | **49** | **15** | **20** | **12** | **2** |

**Notes:**
- **System**: Webhook endpoints called by payment gateways (Stripe, Paymob), not by frontend applications
- **Admin Only**: Count includes admin endpoints, though some may also be accessible by resource owners (e.g., PATCH /api/sessions/{id}/complete by Mentor)

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
- `GET /api/users/me` (Any authenticated user - includes Roles, IsMentor, EmailConfirmed)
- `PATCH /api/users/me` (Any authenticated user - includes CareerGoals)
- `DELETE /api/users/me` (Any authenticated user)

**Users (Admin/Mentor):**
- `GET /api/users` (Admin or Mentor - filters out mentor profiles)
- `GET /api/users/{id}` (Admin or Mentor - filters out mentor profiles)

**Mentors:**
- `GET /api/mentors/me` (Any authenticated user with IsMentor=true - no Mentor role required)
- `POST /api/mentors` (Any authenticated user - apply as mentor)
- `PATCH /api/mentors/me` (Any authenticated user with IsMentor=true - includes user & mentor fields, no Mentor role required)

**Sessions:**
- `POST /api/sessions` (User - book session)
- `GET /api/sessions/{id}` (User/Mentor/Admin - view session)
- `GET /api/sessions/upcoming` (Any authenticated user)
- `GET /api/sessions/past` (Any authenticated user)
- `PATCH /api/sessions/{id}/reschedule` (User/Mentor - reschedule session)
- `PATCH /api/sessions/{id}/cancel` (User/Mentor/Admin - cancel session)
- `POST /api/sessions/{id}/join` (User/Mentor - get video link)
- `PATCH /api/sessions/{id}/complete` (Mentor/Admin - mark completed)

**Payments:**
- `POST /api/payments/create-intent` (User - create payment intent)
- `POST /api/payments/confirm` (User - confirm payment)
- `GET /api/payments/history` (Any authenticated user)

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
- `PATCH /api/users/{id}` (Admin - includes CareerGoals)

**Mentors:**
- `GET /api/mentors/pending` (Admin - review applications)
- `PATCH /api/mentors/{id}/approve` (Admin - approve mentor)
- `PATCH /api/mentors/{id}/reject` (Admin - reject mentor)

**Note:** Mentor profile updates (including user & mentor fields with `expertiseTagIds` and `categoryIds`) are handled via `PATCH /api/mentors/me` by the mentor themselves (see Mentors section). Admins can approve/reject applications but cannot directly update mentor profiles.

---

## 🎯 Common Use Cases

### 1. User Registration & Verification Flow
```
1. Register user → POST /api/auth/register
   📖 Authentication-Endpoints.md
   (Can set IsMentor flag during registration)
2. User receives verification email
3. Click email link → POST /api/auth/verify-email (auto-called)
   📖 Authentication-Endpoints.md
4. Update profile with career goals → PATCH /api/users/me (with CareerGoals)
   📖 User-Profile-Endpoints.md
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
1. Update profile (basic info + career goals) → PATCH /api/users/me
   📖 User-Profile-Endpoints.md
   (Single request with optional CareerGoals field)
```

### 7. Update Mentor Profile
```
1. Get current mentor profile → GET /api/mentors/me
   📖 Mentor-Endpoints.md
2. Update profile (user fields + mentor fields) → PATCH /api/mentors/me
   📖 Mentor-Endpoints.md
   (Includes firstName, lastName, phoneNumber, profilePictureUrl, bio, rates, expertiseTagIds, categoryIds)
   (No Mentor role required - accessible during pending approval)
```

### 8. Book Mentorship Session Flow
```
1. Find mentor → GET /api/mentors/{id}
   📖 Mentor-Endpoints.md
2. View available time slots → GET /api/mentors/{mentorId}/available-slots
   📖 Session-Payment-Endpoints.md
3. Book session with timeSlotId → POST /api/sessions
   📖 Session-Payment-Endpoints.md
   (Creates session with status Pending, marks TimeSlot as booked)
4. Create payment intent → POST /api/payments/create-intent
   📖 Session-Payment-Endpoints.md
5. Complete payment → POST /api/payments/confirm
   📖 Session-Payment-Endpoints.md
   (Confirms session + generates video link)
6. Join session → POST /api/sessions/{id}/join
   📖 Session-Payment-Endpoints.md
   (Get video conference link)
7. Complete session → PATCH /api/sessions/{id}/complete (Mentor)
   📖 Session-Payment-Endpoints.md
```

### 9. Admin Category Management
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
| **SessionDto** | [Session-Payment-Endpoints.md](./Session-Payment-Endpoints.md#sessiondto) | Sessions |
| **PaymentDto** | [Session-Payment-Endpoints.md](./Session-Payment-Endpoints.md#paymentdto) | Payments |
| **BookSessionRequestDto** | [Session-Payment-Endpoints.md](./Session-Payment-Endpoints.md#booksessionrequestdto) | Sessions |
| **RescheduleRequestDto** | [Session-Payment-Endpoints.md](./Session-Payment-Endpoints.md#reschedulerequestdto) | Sessions |
| **CancelRequestDto** | [Session-Payment-Endpoints.md](./Session-Payment-Endpoints.md#cancelrequestdto) | Sessions |
| **SessionStatus (Enum)** | [Session-Payment-Endpoints.md](./Session-Payment-Endpoints.md#enums) | Sessions |
| **PaymentStatus (Enum)** | [Session-Payment-Endpoints.md](./Session-Payment-Endpoints.md#enums) | Payments |
| **PaymentMethod (Enum)** | [Session-Payment-Endpoints.md](./Session-Payment-Endpoints.md#enums) | Payments |

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
- ✅ **Consolidated Approach** - Skills updated in profile endpoints
- ✅ **User career goals**: Update via `PATCH /api/users/me` with `CareerGoals` field
- ✅ **Mentor expertise tags**: Update via `PATCH /api/mentors/me` with `expertiseTagIds` field
- ✅ **Mentor categories**: Update via `PATCH /api/mentors/me` with `categoryIds` field
- 🔄 **Single request updates**: All profile fields including skills/categories in one API call
- 🔓 **No Mentor role required**: Mentors can update profiles during pending approval

### Session & Payment Flow
- 💳 **Payment Integration**: Stripe (international) + Paymob (Egypt - Meeza, InstaPay, Vodafone Cash)
- 📅 **24-hour advance booking**: All sessions require minimum 24h advance notice
- 💰 **Refund Policy**: >48h = 100%, 24-48h = 50%, <24h = 0% refund
- ⏱️ **Payment Hold**: 72 hours after session completion before mentor payout
- 🎥 **Join Window**: Can join 15 minutes before to 15 minutes after scheduled end

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
- **Sessions & Payments**: [Session-Payment-Endpoints.md](./Session-Payment-Endpoints.md) - Session booking, payment processing, session management, and webhooks

---

## 🔄 Maintenance

**When adding new endpoints:**
1. Document in the appropriate contract file
2. Update this index
3. Add cross-references in related documents
4. Update the statistics section
5. Add to Common Use Cases if applicable

**Last Review:** 2025-11-19

---

**Total Documented Endpoints:** 49
**Total Contract Files:** 6
**Documentation Status:** ✅ Complete & Synchronized
