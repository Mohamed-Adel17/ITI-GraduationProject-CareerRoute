# Session Dispute Endpoints API Contract

**Frontend Framework:** Angular 20.3.0
**Expected Backend:** ASP.NET Core 8.0 Web API
**Base URL:** `http://localhost:5000/api`

---

## Overview

The Dispute endpoints allow mentees to report issues with completed sessions during the 3-day payment hold period. Admins can review and resolve disputes, potentially issuing refunds.

**Key Dispute Flow:**
1. **Session Completes** - Payment enters 3-day hold period
2. **Mentee Reports Issue** - Creates dispute within 3-day window
3. **Admin Reviews** - Examines dispute details
4. **Resolution** - Admin resolves with full refund, partial refund, or no refund
5. **Payment Release** - If no dispute or dispute rejected, payment releases to mentor

**Roles:**
- **Mentee (User):** Can create disputes for their own sessions and view dispute status
- **Mentor:** Can view disputes for their sessions (read-only)
- **Admin:** Can view all disputes, filter/search, and resolve them

---

## Dispute Endpoints

### 1. Create Dispute

**Endpoint:** `POST /api/disputes/sessions/{sessionId}`
**Requires:** `Authorization: Bearer {token}`
**Roles:** User (Mentee)

**Path Parameters:**
- `sessionId` (string, GUID): The ID of the completed session

**Request Body:**
```json
{
  "reason": "MentorNoShow",
  "description": "The mentor never joined the session. I waited for 30 minutes."
}
```

**Field Requirements:**
- `reason` (required): Enum - `MentorNoShow`, `TechnicalIssues`, `SessionQuality`, `Other`
- `description` (optional, max 1000 chars): Required if reason is `Other`

**Success Response (200):**
```json
{
    "data": {
        "id": "d1234567-89ab-cdef-0123-456789abcdef",
        "sessionId": "s1234567-89ab-cdef-0123-456789abcdef",
        "menteeId": "u1234567-89ab-cdef-0123-456789abcdef",
        "reason": "MentorNoShow",
        "description": "The mentor never joined the session. I waited for 30 minutes.",
        "status": "Pending",
        "resolution": null,
        "refundAmount": null,
        "adminNotes": null,
        "createdAt": "2025-12-05T10:30:00Z",
        "resolvedAt": null
    },
    "success": true,
    "message": "Dispute created successfully",
    "statusCode": 200,
    "errors": null
}
```

**Error Responses:**
- **400 Bad Request:** Session not completed, dispute window expired, or invalid reason
- **401 Unauthorized:** Invalid token
- **403 Forbidden:** User is not the mentee of this session
- **404 Not Found:** Session not found
- **409 Conflict:** Dispute already exists for this session

---

### 2. Get Dispute by Session

**Endpoint:** `GET /api/disputes/sessions/{sessionId}`
**Requires:** `Authorization: Bearer {token}`
**Roles:** User, Mentor, Admin

**Path Parameters:**
- `sessionId` (string, GUID): The ID of the session

**Success Response (200):**
```json
{
    "data": {
        "id": "d1234567-89ab-cdef-0123-456789abcdef",
        "sessionId": "s1234567-89ab-cdef-0123-456789abcdef",
        "menteeId": "u1234567-89ab-cdef-0123-456789abcdef",
        "reason": "MentorNoShow",
        "description": "The mentor never joined the session.",
        "status": "Pending",
        "resolution": null,
        "refundAmount": null,
        "adminNotes": null,
        "createdAt": "2025-12-05T10:30:00Z",
        "resolvedAt": null
    },
    "success": true,
    "message": "Dispute retrieved successfully",
    "statusCode": 200,
    "errors": null
}
```

**No Dispute Response (200):**
```json
{
    "data": null,
    "success": true,
    "message": "No dispute found for this session",
    "statusCode": 200,
    "errors": null
}
```

---

### 3. Get Dispute by ID (Admin)

**Endpoint:** `GET /api/disputes/{disputeId}`
**Requires:** `Authorization: Bearer {token}`
**Roles:** Admin

**Path Parameters:**
- `disputeId` (string, GUID): The ID of the dispute

**Success Response (200):**
```json
{
    "data": {
        "id": "d1234567-89ab-cdef-0123-456789abcdef",
        "sessionId": "s1234567-89ab-cdef-0123-456789abcdef",
        "menteeId": "u1234567-89ab-cdef-0123-456789abcdef",
        "reason": "MentorNoShow",
        "description": "The mentor never joined the session.",
        "status": "Pending",
        "resolution": null,
        "refundAmount": null,
        "adminNotes": null,
        "createdAt": "2025-12-05T10:30:00Z",
        "resolvedAt": null
    },
    "success": true,
    "message": "Dispute retrieved successfully",
    "statusCode": 200,
    "errors": null
}
```

---

### 4. Resolve Dispute (Admin)

**Endpoint:** `POST /api/disputes/{disputeId}/resolve`
**Requires:** `Authorization: Bearer {token}`
**Roles:** Admin

**Path Parameters:**
- `disputeId` (string, GUID): The ID of the dispute

**Request Body:**
```json
{
  "resolution": "FullRefund",
  "refundAmount": 150.00,
  "adminNotes": "Verified mentor did not join. Full refund issued."
}
```

**Field Requirements:**
- `resolution` (required): Enum - `FullRefund`, `PartialRefund`, `NoRefund`
- `refundAmount` (optional): Decimal, required for FullRefund/PartialRefund
- `adminNotes` (optional, max 1000 chars): Admin's notes on the resolution

**Success Response (200):**
```json
{
    "data": {
        "id": "d1234567-89ab-cdef-0123-456789abcdef",
        "sessionId": "s1234567-89ab-cdef-0123-456789abcdef",
        "menteeId": "u1234567-89ab-cdef-0123-456789abcdef",
        "menteeFirstName": "John",
        "menteeLastName": "Doe",
        "menteeEmail": "john@example.com",
        "mentorId": "m1234567-89ab-cdef-0123-456789abcdef",
        "mentorFirstName": "Jane",
        "mentorLastName": "Smith",
        "sessionPrice": 150.00,
        "reason": "MentorNoShow",
        "description": "The mentor never joined the session.",
        "status": "Resolved",
        "resolution": "FullRefund",
        "refundAmount": 150.00,
        "adminNotes": "Verified mentor did not join. Full refund issued.",
        "createdAt": "2025-12-05T10:30:00Z",
        "resolvedAt": "2025-12-05T14:00:00Z"
    },
    "success": true,
    "message": "Dispute resolved successfully",
    "statusCode": 200,
    "errors": null
}
```

**Error Responses:**
- **400 Bad Request:** Dispute already resolved or invalid resolution
- **404 Not Found:** Dispute not found

---

### 5. Get All Disputes (Admin)

**Endpoint:** `GET /api/disputes/admin`
**Requires:** `Authorization: Bearer {token}`
**Roles:** Admin

**Query Parameters:**
- `Status` (enum, optional): Filter by status - `Pending`, `UnderReview`, `Resolved`, `Rejected`
- `Reason` (enum, optional): Filter by reason - `MentorNoShow`, `TechnicalIssues`, `SessionQuality`, `Other`
- `MenteeId` (string, optional): Filter by mentee ID
- `MentorId` (string, optional): Filter by mentor ID
- `StartDate` (DateTime, optional): Filter disputes created after this date
- `EndDate` (DateTime, optional): Filter disputes created before this date
- `SortBy` (string, optional): Sort field - `status`, `reason`, `createdAt` (default)
- `SortDescending` (bool, default: true): Sort direction
- `Page` (int, default: 1): Page number
- `PageSize` (int, default: 10): Items per page

**Success Response (200):**
```json
{
    "data": {
        "disputes": [
            {
                "id": "d1234567-89ab-cdef-0123-456789abcdef",
                "sessionId": "s1234567-89ab-cdef-0123-456789abcdef",
                "menteeId": "u1234567-89ab-cdef-0123-456789abcdef",
                "menteeFirstName": "John",
                "menteeLastName": "Doe",
                "menteeEmail": "john@example.com",
                "mentorId": "m1234567-89ab-cdef-0123-456789abcdef",
                "mentorFirstName": "Jane",
                "mentorLastName": "Smith",
                "sessionPrice": 150.00,
                "reason": "MentorNoShow",
                "description": "The mentor never joined the session.",
                "status": "Pending",
                "resolution": null,
                "refundAmount": null,
                "adminNotes": null,
                "createdAt": "2025-12-05T10:30:00Z",
                "resolvedAt": null
            }
        ],
        "pagination": {
            "totalCount": 1,
            "currentPage": 1,
            "pageSize": 10,
            "totalPages": 1,
            "hasNextPage": false,
            "hasPreviousPage": false
        }
    },
    "success": true,
    "message": "Disputes retrieved successfully",
    "statusCode": 200,
    "errors": null
}
```

---

## Enums Reference

### DisputeReason
- `MentorNoShow` - Mentor did not join the session
- `TechnicalIssues` - Technical problems during session
- `SessionQuality` - Quality of session was unsatisfactory
- `Other` - Other reason (description required)

### DisputeStatus
- `Pending` - Dispute created, awaiting admin review
- `Resolved` - Dispute resolved with refund
- `Rejected` - Dispute rejected, no refund

### DisputeResolution
- `FullRefund` - Full session price refunded to mentee
- `PartialRefund` - Partial amount refunded
- `NoRefund` - No refund issued (dispute rejected)

---

## Business Rules

1. **Dispute Window:** Mentees can only create disputes within 3 days of session completion
2. **One Dispute Per Session:** Only one dispute allowed per session
3. **Payment Hold:** If a dispute exists, payment release to mentor is paused
4. **Refund Processing:** When resolved with refund, amount is deducted from mentor's balance
5. **Status Transitions:**
   - `Pending` → `Resolved` (with refund) or `Rejected` (no refund)
   - Once resolved/rejected, status cannot change
