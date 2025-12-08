# Reviews API Endpoints

## Overview

Session reviews allow mentees to rate and comment on completed sessions. Reviews are displayed on mentor profiles and affect mentor ratings.

---

## Endpoints

### 1. Get Session Review (Auth Required)

**Endpoint:** `GET /api/sessions/{sessionId}/review`  
**Auth:** Bearer token (Mentee or Mentor of the session)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Review retrieved successfully.",
  "data": {
    "id": "review-guid",
    "rating": 5,
    "comment": "Great session!",
    "createdAt": "2025-12-04T10:00:00Z",
    "menteeFirstName": "John",
    "menteeLastName": "Doe"
  }
}
```

**No Review Response (200):**
```json
{
  "success": true,
  "message": "No review exists for this session.",
  "data": null
}
```

**Error Responses:**
| Status | Message |
|--------|---------|
| 401 | User not authenticated |
| 403 | You can only view reviews for sessions you participated in |
| 404 | Session not found |

---

### 2. Add Review (Mentee Only)

**Endpoint:** `POST /api/sessions/{sessionId}/reviews`  
**Auth:** Bearer token (Mentee role)

**Request Body:**
```json
{
  "rating": 5,
  "comment": "Great session, very helpful!"
}
```

**Validation:**
- `rating`: Required, 1-5
- `comment`: Optional, 5-500 characters if provided

**Success Response (201):**
```json
{
  "success": true,
  "message": "Review added successfully.",
  "data": {
    "id": "review-guid",
    "rating": 5,
    "comment": "Great session, very helpful!",
    "createdAt": "2025-12-04T10:00:00Z",
    "sessionId": "session-guid",
    "menteeId": "mentee-guid",
    "menteeFirstName": "John",
    "menteeLastName": "Doe",
    "mentorId": "mentor-guid",
    "mentorFirstName": "Sarah",
    "mentorLastName": "Johnson"
  }
}
```

**Error Responses:**
| Status | Message |
|--------|---------|
| 400 | Rating must be between 1 and 5 |
| 400 | Cannot review before session is completed |
| 401 | User not authenticated |
| 403 | You can only review sessions you participated in |
| 404 | Session not found |
| 409 | This session has already been reviewed |

---

### 3. Get Mentor Reviews (Public)

**Endpoint:** `GET /api/mentors/{mentorId}/reviews`  
**Auth:** None (public)

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | int | 1 | Page number |
| pageSize | int | 10 | Items per page |

**Success Response (200):**
```json
{
  "success": true,
  "message": "Reviews retrieved successfully.",
  "data": {
    "reviews": [
      {
        "id": "review-guid",
        "rating": 5,
        "comment": "Great session!",
        "createdAt": "2025-12-04T10:00:00Z",
        "menteeFirstName": "John",
        "menteeLastName": "Doe"
      }
    ],
    "pagination": {
      "totalCount": 25,
      "currentPage": 1,
      "pageSize": 10,
      "totalPages": 3,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

**Error Responses:**
| Status | Message |
|--------|---------|
| 400 | Page and pageSize must be greater than zero |
| 404 | Mentor not found |

---

## Frontend Integration Tasks

### 1. Mentor Profile Page (`/mentors/{id}`)
- Call `GET /api/mentors/{mentorId}/reviews` to fetch reviews
- Display reviews list with rating stars, comment, mentee name, date
- Add pagination if totalPages > 1
- Show "No reviews yet" empty state

### 2. Session Details Page (Completed Sessions)
- Show "Leave a Review" button if:
  - User is the mentee
  - Session status is `Completed`
  - No review exists yet
- On click: open review modal/form

### 3. Review Form/Modal
- Star rating selector (1-5, required)
- Comment textarea (optional, max 500 chars)
- Submit calls `POST /api/sessions/{sessionId}/reviews`
- On success: close modal, show success toast, refresh data

### 4. Review Request Email Route (Required)
- Mentees receive email **24 hours** after session completion (Hangfire scheduled job)
- Email contains link: `/sessions/{sessionId}/review`
- **Frontend must create this route** to handle the email link
- Route should:
  - Load session details
  - Show review form if eligible (completed, no existing review, user is mentee)
  - Redirect or show error if not eligible
- If review is submitted before 24h, the scheduled email is automatically cancelled

---

## TypeScript Models

```typescript
// Request
interface CreateReviewRequest {
  rating: number;      // 1-5
  comment?: string;    // 5-500 chars
}

// Response item
interface ReviewItem {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  menteeFirstName: string;
  menteeLastName: string;
}

// Paginated response
interface MentorReviewsResponse {
  reviews: ReviewItem[];
  pagination: PaginationMetadata;
}
```

---

## Notes

- Mentor's `averageRating` and `totalReviews` are updated automatically when a review is added
- Reviews are sorted by newest first (descending by `createdAt`)
- Only one review per session allowed
- Reviews cannot be edited or deleted (by design)
