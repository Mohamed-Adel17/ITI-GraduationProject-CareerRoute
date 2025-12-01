# Session and Payment Endpoints API Contract

**Frontend Framework:** Angular 20.3.0
**Expected Backend:** ASP.NET Core 8.0 Web API
**Base URL:** `http://localhost:5000/api`

---

## Overview

Session and payment endpoints enable the core transaction flow: booking mentorship sessions, processing payments, managing schedules, and attending virtual meetings. These endpoints handle the complete lifecycle from booking to completion.

**Authorization Rules:**
- Users (mentees) can book sessions and manage their own bookings
- Mentors can view and manage sessions where they are the mentor
- Admins can view and manage all sessions
- Payment processing requires authenticated user

**Key Business Rules:**
- Platform commission: 15% of session price
- Cancellation refund policy:
  - >48 hours before session: 100% refund
  - 24-48 hours before: 50% refund
  - <24 hours: No refund
- Reschedule requires 24+ hours notice and mentor approval
- Payment held for 72 hours post-session, then released to mentor
- Session reminders sent at 24 hours and 1 hour before start time

**Session Lifecycle:**
1. **Pending** - Created after booking, awaiting payment confirmation
2. **Confirmed** - Payment captured, Zoom meeting creation queued via background job
3. **InProgress** - First participant joined
4. **Completed** - Session finished, triggers 72h payment hold, recording upload to R2, and Deepgram transcription

*Alternative states:* Cancelled (user/mentor cancels), NoShow (no participants), PendingReschedule (reschedule requested)

**Zoom Integration Flow:**
1. **Payment Confirmed** → Session status = "Confirmed" → Confirmation emails sent (without Zoom link) → Background job queued to create Zoom meeting
2. **Zoom Meeting Created** (background job) → `videoConferenceLink` and `zoomMeetingPassword` stored → Auto-termination job scheduled → Zoom link email scheduled for 15 min before session
3. **15 minutes before session** → Zoom link email sent to both mentor and mentee with join URL and password
4. **Session ends** → Auto-termination if needed (2 min after scheduled end)
5. **Recording webhook received** → Video downloaded from Zoom → Uploaded to Cloudflare R2 → Deepgram transcription triggered
6. **Transcription complete** → Transcript stored in session record

---

## Related Documentation

- **📖 API Endpoints Index**: See [API-Endpoints-Index.md](./API-Endpoints-Index.md) for complete endpoint directory
- **Mentor Endpoints**: See [Mentor-Endpoints.md](./Mentor-Endpoints.md) for mentor discovery before booking
- **User Profile Endpoints**: See [User-Profile-Endpoints.md](./User-Profile-Endpoints.md) for user context

---

## TimeSlot Integration

**Important:** Session booking now uses a **TimeSlot-based system**. Before booking a session, mentees must select from available time slots created by mentors.

**📖 TimeSlot Management Endpoints:** See [Mentor-Endpoints.md - TimeSlot Availability Management](./Mentor-Endpoints.md#timeslot-availability-management) for complete documentation of:
- GET `/api/mentors/{mentorId}/available-slots` (Public - view available slots)
- POST `/api/mentors/{mentorId}/time-slots` (Mentor/Admin - create slots)
- GET `/api/mentors/{mentorId}/time-slots` (Mentor/Admin - manage all slots)
- DELETE `/api/mentors/{mentorId}/time-slots/{slotId}` (Mentor/Admin - delete slot)

**Booking Flow:**
1. **Mentor creates availability** → POST `/api/mentors/{mentorId}/time-slots` (see [Mentor-Endpoints.md#14](./Mentor-Endpoints.md#14-create-time-slots-for-mentor))
2. **Mentee views available slots** → GET `/api/mentors/{mentorId}/available-slots` (see [Mentor-Endpoints.md#13](./Mentor-Endpoints.md#13-get-available-time-slots-for-mentor-public))
3. **Mentee books session** → POST `/api/sessions` with `timeSlotId` (this document, Endpoint 1)
4. **TimeSlot marked as booked** → `isBooked = true`, `sessionId` set to new session ID
5. **Mentee creates payment intent** → POST `/api/payments/create-intent` with `sessionId`
6. **Payment confirmed** → Session status changes to "Confirmed", confirmation emails sent
7. **Zoom meeting created** (background job) → Video link stored, Zoom link email scheduled for 15 min before session

**TimeSlot-Session Relationship:**
- Each Session is linked to one TimeSlot via `timeSlotId` (string GUID)
- TimeSlot stores: `startDateTime`, `durationMinutes`, mentor's `rate30Min` or `rate60Min`
- When session is cancelled, TimeSlot is released (`isBooked = false`, `sessionId = null`)
- Session price, duration, and schedule are derived from the TimeSlot
- TimeSlots are created by mentors through their availability management endpoints (see [Mentor-Endpoints.md](./Mentor-Endpoints.md#timeslot-availability-management))

---

## Session Management Endpoints

### 1. Book New Session

**Endpoint:** `POST /api/sessions`
**Requires:** `Authorization: Bearer {token}`
**Roles:** User (mentee)

**Request Body:**
```json
{
  "timeSlotId": "ts_123",
  "topic": "System Design Interview Preparation",
  "notes": "Focusing on distributed systems and scalability patterns"
}
```

**Field Requirements:**
- `timeSlotId` (required): String, must reference an existing available TimeSlot (isBooked = false)
- `topic` (optional): Max 200 characters
- `notes` (optional): Max 1000 characters

**Note:** The session's mentor, duration, scheduled time, and price are automatically derived from the selected TimeSlot.

**Success Response (201):**
```json
{
  "success": true,
  "message": "Session booked successfully. Please proceed to payment to confirm your booking.",
  "data": {
    "id": "44444444-e29b-41d4-a716-446655440014",
    "menteeId": "55555555-e29b-41d4-a716-446655440015",
    "menteeFirstName": "John",
    "menteeLastName": "Doe",
    "mentorId": "cc0e8400-e29b-41d4-a716-446655440007",
    "mentorFirstName": "Sarah",
    "mentorLastName": "Johnson",
    "timeSlotId": "ts_123",
    "sessionType": "OneOnOne",
    "duration": "SixtyMinutes",
    "scheduledStartTime": "2025-11-15T14:00:00Z",
    "scheduledEndTime": "2025-11-15T15:00:00Z",
    "status": "Pending",
    "videoConferenceLink": null,
    "topic": "System Design Interview Preparation",
    "notes": "Focusing on distributed systems and scalability patterns",
    "price": 45.00,
    "paymentId": null,
    "createdAt": "2025-11-09T10:30:00Z",
    "updatedAt": "2025-11-09T10:30:00Z"
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
      "TimeSlotId": ["Time slot ID is required"],
      "Topic": ["Topic cannot exceed 200 characters"]
    },
    "statusCode": 400
  }
  ```

- **404 Not Found (Time Slot):**
  ```json
  {
    "success": false,
    "message": "Time slot not found",
    "statusCode": 404
  }
  ```

- **409 Conflict (Time Slot Already Booked):**
  ```json
  {
    "success": false,
    "message": "Time slot is no longer available (already booked)",
    "statusCode": 409
  }
  ```

- **409 Conflict (Scheduling Overlap):**
  ```json
  {
    "success": false,
    "message": "You already have a session scheduled at this time",
    "statusCode": 409
  }
  ```

**Backend Behavior:**
- Validate timeSlotId exists (return 404 if not found)
- Validate TimeSlot is available: `IsBooked = false` (return 409 if already booked)
- Validate TimeSlot is at least 24 hours in future
- Get TimeSlot details (startDateTime, durationMinutes, mentorId)
- Get Mentor details and pricing (rate30Min or rate60Min based on duration)
- Check mentee doesn't have overlapping sessions at this time
- Calculate price from Mentor's rate
- Calculate scheduledEndTime = startDateTime + durationMinutes
- Create Session entity with:
  - TimeSlotId = timeSlotId
  - MentorId from TimeSlot
  - MenteeId from JWT token
  - ScheduledStartTime from TimeSlot
  - ScheduledEndTime calculated
  - Price from Mentor's rate
  - Status = "Pending"
- Mark TimeSlot as booked: `IsBooked = true`, `SessionId = newSession.Id`
- Return session details (without payment intent)
- **Next step:** Frontend must call `POST /api/payments/create-intent` with sessionId to initiate payment

---

### 2. Get Session Detail

**Endpoint:** `GET /api/sessions/{id}`
**Requires:** `Authorization: Bearer {token}`
**Roles:** User (if mentee), Mentor (if mentor), Admin

**Path Parameters:**
- `id` (string, GUID): Session ID

**Success Response (200):**
```json
{
  "success": true,
  "message": "Session retrieved successfully",
  "data": {
    "id": "44444444-e29b-41d4-a716-446655440014",
    "menteeId": "55555555-e29b-41d4-a716-446655440015",
    "menteeFirstName": "John",
    "menteeLastName": "Doe",
    "menteeProfilePictureUrl": "https://example.com/profiles/john.jpg",
    "mentorId": "cc0e8400-e29b-41d4-a716-446655440007",
    "mentorFirstName": "Sarah",
    "mentorLastName": "Johnson",
    "mentorProfilePictureUrl": "https://example.com/profiles/sarah.jpg",
    "sessionType": "OneOnOne",
    "duration": "SixtyMinutes",
    "scheduledStartTime": "2025-11-15T14:00:00Z",
    "scheduledEndTime": "2025-11-15T15:00:00Z",
    "status": "Confirmed",
    "videoConferenceLink": "https://zoom.us/j/1234567890?pwd=abcdefghijklmnop",
    "topic": "System Design Interview Preparation",
    "notes": "Focusing on distributed systems and scalability patterns",
    "price": 45.00,
    "paymentId": "66666666-e29b-41d4-a716-446655440016",
    "paymentStatus": "Captured",
    "cancellationReason": null,
    "canReschedule": true,
    "canCancel": true,
    "hoursUntilSession": 143,
    "createdAt": "2025-11-09T10:30:00Z",
    "updatedAt": "2025-11-09T10:35:00Z"
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

- **403 Forbidden:**
  ```json
  {
    "success": false,
    "message": "You don't have permission to view this session",
    "statusCode": 403
  }
  ```

- **404 Not Found:**
  ```json
  {
    "success": false,
    "message": "Session not found",
    "statusCode": 404
  }
  ```

**Backend Behavior:**
- Validate session exists
- Verify user is session participant (mentee, mentor) or admin
- Return 403 if user is not authorized
- Calculate canReschedule (true if >24h until session and status is Confirmed)
- Calculate canCancel (true if status is Confirmed and not completed)
- Calculate hoursUntilSession for frontend countdown

---

### 3. Get Upcoming Sessions

**Endpoint:** `GET /api/sessions/upcoming`
**Requires:** `Authorization: Bearer {token}`
**Roles:** Any authenticated user

**Query Parameters:**
- `page` (integer, optional): Page number (default: 1, min: 1)
- `pageSize` (integer, optional): Items per page (default: 10, min: 1, max: 50)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Upcoming sessions retrieved successfully",
  "data": {
    "sessions": [
      {
        "id": "44444444-e29b-41d4-a716-446655440014",
        "menteeId": "55555555-e29b-41d4-a716-446655440015",
        "menteeFirstName": "John",
        "menteeLastName": "Doe",
        "mentorId": "cc0e8400-e29b-41d4-a716-446655440007",
        "mentorFirstName": "Sarah",
        "mentorLastName": "Johnson",
        "mentorProfilePictureUrl": "https://example.com/profiles/sarah.jpg",
        "sessionType": "OneOnOne",
        "duration": "SixtyMinutes",
        "scheduledStartTime": "2025-11-15T14:00:00Z",
        "status": "Confirmed",
        "topic": "System Design Interview Preparation",
        "videoConferenceLink": "https://zoom.us/j/1234567890?pwd=abcdefghijklmnop",
        "hoursUntilSession": 143
      },
      {
        "id": "77777777-e29b-41d4-a716-446655440017",
        "menteeId": "55555555-e29b-41d4-a716-446655440015",
        "menteeFirstName": "John",
        "menteeLastName": "Doe",
        "mentorId": "88888888-e29b-41d4-a716-446655440018",
        "mentorFirstName": "Michael",
        "mentorLastName": "Chen",
        "mentorProfilePictureUrl": "https://example.com/profiles/michael.jpg",
        "sessionType": "OneOnOne",
        "duration": "ThirtyMinutes",
        "scheduledStartTime": "2025-11-20T10:00:00Z",
        "status": "Confirmed",
        "topic": "Career Strategy Discussion",
        "videoConferenceLink": "https://zoom.us/j/9876543210?pwd=zyxwvutsrqponmlk",
        "hoursUntilSession": 263
      }
    ],
    "pagination": {
      "totalCount": 2,
      "currentPage": 1,
      "pageSize": 10,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPreviousPage": false
    }
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

- **404 Not Found:**
  ```json
  {
    "success": false,
    "message": "No upcoming sessions found",
    "statusCode": 404
  }
  ```

**Backend Behavior:**
- Extract user ID from JWT token
- Fetch sessions where user is mentee or mentor
- Filter by status: Confirmed, Pending (exclude Completed, Cancelled)
- Filter by scheduledStartTime >= current time
- Order by scheduledStartTime ASC
- Apply pagination
- Return 404 if no upcoming sessions

---

### 4. Get Past Sessions

**Endpoint:** `GET /api/sessions/past`
**Requires:** `Authorization: Bearer {token}`
**Roles:** Any authenticated user

**Query Parameters:**
- `page` (integer, optional): Page number (default: 1, min: 1)
- `pageSize` (integer, optional): Items per page (default: 10, min: 1, max: 50)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Past sessions retrieved successfully",
  "data": {
    "sessions": [
      {
        "id": "99999999-e29b-41d4-a716-446655440019",
        "menteeId": "55555555-e29b-41d4-a716-446655440015",
        "menteeFirstName": "John",
        "menteeLastName": "Doe",
        "mentorId": "cc0e8400-e29b-41d4-a716-446655440007",
        "mentorFirstName": "Sarah",
        "mentorLastName": "Johnson",
        "mentorProfilePictureUrl": "https://example.com/profiles/sarah.jpg",
        "sessionType": "OneOnOne",
        "duration": "ThirtyMinutes",
        "scheduledStartTime": "2025-10-20T14:00:00Z",
        "scheduledEndTime": "2025-10-20T14:30:00Z",
        "status": "Completed",
        "topic": "React Best Practices",
        "hasReview": true,
        "completedAt": "2025-10-20T14:32:00Z"
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

- **404 Not Found:**
  ```json
  {
    "success": false,
    "message": "No past sessions found",
    "statusCode": 404
  }
  ```

**Backend Behavior:**
- Extract user ID from JWT token
- Fetch sessions where user is mentee or mentor
- Filter by status: Completed or Cancelled
- Order by scheduledStartTime DESC (most recent first)
- Apply pagination
- Include hasReview flag (check if review exists for this session)
- Return 404 if no past sessions

---

### 5. Reschedule Session

**Endpoint:** `PATCH /api/sessions/{id}/reschedule`
**Requires:** `Authorization: Bearer {token}`
**Roles:** User (if mentee), Mentor (if mentor)

**Path Parameters:**
- `id` (string, GUID): Session ID

**Request Body:**
```json
{
  "newScheduledStartTime": "2025-11-16T15:00:00Z",
  "reason": "Conflict with another meeting, requesting alternative time"
}
```

**Field Requirements:**
- `newScheduledStartTime` (required): ISO 8601 datetime, must be at least 24 hours from now
- `reason` (required): Min 10 characters, max 500 characters

**Success Response (200):**
```json
{
  "success": true,
  "message": "Reschedule request submitted successfully. Waiting for mentor approval.",
  "data": {
    "id": "44444444-e29b-41d4-a716-446655440014",
    "status": "PendingReschedule",
    "originalStartTime": "2025-11-15T14:00:00Z",
    "requestedStartTime": "2025-11-16T15:00:00Z",
    "requestedBy": "mentee",
    "rescheduleReason": "Conflict with another meeting, requesting alternative time",
    "requestedAt": "2025-11-09T12:00:00Z"
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
      "NewScheduledStartTime": ["Reschedule must be requested at least 24 hours before original session time"],
      "Reason": ["Reason must be at least 10 characters"]
    },
    "statusCode": 400
  }
  ```

- **403 Forbidden:**
  ```json
  {
    "success": false,
    "message": "You don't have permission to reschedule this session",
    "statusCode": 403
  }
  ```

- **409 Conflict:**
  ```json
  {
    "success": false,
    "message": "Cannot reschedule session within 24 hours of scheduled time",
    "statusCode": 409
  }
  ```

- **404 Not Found:**
  ```json
  {
    "success": false,
    "message": "Session not found",
    "statusCode": 404
  }
  ```

**Backend Behavior:**
- Validate session exists and user is participant
- Validate current time is >24 hours before scheduledStartTime
- Validate new time is available for both participants
- Create reschedule request with status "PendingReschedule"
- Send email notification to other party (mentor or mentee)
- Other party must approve within 48 hours
- If approved: Update scheduledStartTime, send confirmations
- If rejected or timeout: Session reverts to original time

---

### 6. Get Reschedule Details

**Endpoint:** `GET /api/sessions/reschedule/{rescheduleId}`
**Requires:** `Authorization: Bearer {token}`
**Roles:** User (mentee), Mentor, Admin

**Description:** Retrieves details of a reschedule request for display on the approval page. Used when a user clicks the reschedule approval link from email.

**Path Parameters:**
- `rescheduleId` (string, GUID): The unique identifier of the reschedule request

**Success Response (200):**
```json
{
  "success": true,
  "message": "Reschedule details retrieved successfully.",
  "data": {
    "rescheduleId": "55555555-e29b-41d4-a716-446655440015",
    "sessionId": "44444444-e29b-41d4-a716-446655440014",
    "status": "Pending",
    "mentorName": "John Doe",
    "menteeName": "Jane Smith",
    "topic": "Career Guidance Session",
    "originalStartTime": "2025-11-15T14:00:00Z",
    "newStartTime": "2025-11-16T15:00:00Z",
    "requestedBy": "Mentor",
    "rescheduleReason": "Conflict with another meeting, requesting alternative time",
    "requestedAt": "2025-11-09T12:00:00Z"
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

- **403 Forbidden:**
  ```json
  {
    "success": false,
    "message": "You don't have permission to view this reschedule request.",
    "statusCode": 403
  }
  ```

- **404 Not Found:**
  ```json
  {
    "success": false,
    "message": "Reschedule request not found.",
    "statusCode": 404
  }
  ```

**Backend Behavior:**
- Validate reschedule request exists
- Verify user is session participant (mentee, mentor) or admin
- Return reschedule details with session info (mentor/mentee names, topic)

**Frontend Usage:**
1. Email link directs user to `/sessions/reschedule/{rescheduleId}`
2. If not logged in, redirect to login with returnUrl
3. Fetch reschedule details using this endpoint
4. Display approval page with session info, original time, new time, reason
5. User clicks Approve/Reject buttons

---

### 7. Approve Reschedule Request

**Endpoint:** `POST /api/sessions/reschedule/{rescheduleId}/approve`
**Requires:** `Authorization: Bearer {token}`
**Roles:** User (mentee), Mentor, Admin

**Path Parameters:**
- `rescheduleId` (string, GUID): The unique identifier of the reschedule request

**Success Response (200):**
```json
{
  "success": true,
  "message": "Reschedule request approved successfully. Session has been updated.",
  "data": {
    "id": "44444444-e29b-41d4-a716-446655440014",
    "status": "Confirmed",
    "originalStartTime": "2025-11-15T14:00:00Z",
    "requestedStartTime": "2025-11-16T15:00:00Z",
    "requestedBy": "mentee",
    "rescheduleReason": "Conflict with another meeting",
    "requestedAt": "2025-11-09T12:00:00Z",
    "isApproved": true
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

- **403 Forbidden:**
  ```json
  {
    "success": false,
    "message": "User not authorized to approve this request",
    "statusCode": 403
  }
  ```

- **404 Not Found:**
  ```json
  {
    "success": false,
    "message": "Reschedule request not found",
    "statusCode": 404
  }
  ```

- **409 Conflict:**
  ```json
  {
    "success": false,
    "message": "Reschedule request already processed",
    "statusCode": 409
  }
  ```

**Backend Behavior:**
- Validate reschedule request exists
- Verify user is authorized (participant or admin)
- Update session scheduled start time
- Update reschedule request status to Approved
- Notify other participant

---

### 8. Reject Reschedule Request

**Endpoint:** `POST /api/sessions/reschedule/{rescheduleId}/reject`
**Requires:** `Authorization: Bearer {token}`
**Roles:** User (mentee), Mentor, Admin

**Path Parameters:**
- `rescheduleId` (string, GUID): The unique identifier of the reschedule request

**Success Response (200):**
```json
{
  "success": true,
  "message": "Reschedule request rejected successfully. Session remains at original time.",
  "data": {
    "id": "44444444-e29b-41d4-a716-446655440014",
    "status": "Confirmed",
    "originalStartTime": "2025-11-15T14:00:00Z",
    "requestedStartTime": "2025-11-16T15:00:00Z",
    "requestedBy": "mentee",
    "rescheduleReason": "Conflict with another meeting",
    "requestedAt": "2025-11-09T12:00:00Z",
    "isApproved": false
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

- **403 Forbidden:**
  ```json
  {
    "success": false,
    "message": "User not authorized to reject this request",
    "statusCode": 403
  }
  ```

- **404 Not Found:**
  ```json
  {
    "success": false,
    "message": "Reschedule request not found",
    "statusCode": 404
  }
  ```

- **409 Conflict:**
  ```json
  {
    "success": false,
    "message": "Reschedule request already processed",
    "statusCode": 409
  }
  ```

**Backend Behavior:**
- Validate reschedule request exists
- Verify user is authorized (participant or admin)
- Update reschedule request status to Rejected
- Session remains at original time
- Notify other participant

---

### 9. Cancel Session

**Endpoint:** `PATCH /api/sessions/{id}/cancel`
**Requires:** `Authorization: Bearer {token}`
**Roles:** User (if mentee), Mentor (if mentor), Admin

**Path Parameters:**
- `id` (string, GUID): Session ID

**Request Body:**
```json
{
  "reason": "Emergency came up, unable to attend"
}
```

**Field Requirements:**
- `reason` (required): Min 10 characters, max 500 characters

**Success Response (200):**
```json
{
  "success": true,
  "message": "Session cancelled successfully. Refund processed according to cancellation policy.",
  "data": {
    "id": "44444444-e29b-41d4-a716-446655440014",
    "status": "Cancelled",
    "cancellationReason": "Emergency came up, unable to attend",
    "cancelledBy": "mentee",
    "cancelledAt": "2025-11-09T12:30:00Z",
    "refundAmount": 45.00,
    "refundPercentage": 100,
    "refundStatus": "Processing"
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
      "Reason": ["Cancellation reason must be at least 10 characters"]
    },
    "statusCode": 400
  }
  ```

- **403 Forbidden:**
  ```json
  {
    "success": false,
    "message": "You don't have permission to cancel this session",
    "statusCode": 403
  }
  ```

- **409 Conflict:**
  ```json
  {
    "success": false,
    "message": "Cannot cancel completed session",
    "statusCode": 409
  }
  ```

- **404 Not Found:**
  ```json
  {
    "success": false,
    "message": "Session not found",
    "statusCode": 404
  }
  ```

**Backend Behavior:**
- Validate session exists and user is participant or admin
- Calculate hours until session start
- Apply refund policy:
  - >48 hours: 100% refund
  - 24-48 hours: 50% refund
  - <24 hours: 0% refund (no refund)
- Update session status to "Cancelled"
- **Release TimeSlot:** Set `IsBooked = false`, `SessionId = null` (makes slot available again)
- Process refund via payment service
- Send cancellation notification to both parties
- Mentor receives cancellation fee if <24 hours (no refund to user)

---

### 10. Join Session (Get Video Link)

**Endpoint:** `POST /api/sessions/{id}/join`
**Requires:** `Authorization: Bearer {token}`
**Roles:** User (if mentee), Mentor (if mentor)

**Path Parameters:**
- `id` (string, GUID): Session ID

**Success Response (200):**
```json
{
  "success": true,
  "message": "Video conference link retrieved successfully",
  "data": {
    "sessionId": "44444444-e29b-41d4-a716-446655440014",
    "videoConferenceLink": "https://zoom.us/j/1234567890?pwd=abcdefghijklmnop",
    "provider": "Zoom",
    "scheduledStartTime": "2025-11-15T14:00:00Z",
    "scheduledEndTime": "2025-11-15T15:00:00Z",
    "canJoinNow": true,
    "minutesUntilStart": 5,
    "instructions": "Click the link to join the session. Please join 5 minutes early to test your audio and video."
  }
}
```

**Error Responses:**

- **403 Forbidden:**
  ```json
  {
    "success": false,
    "message": "You don't have permission to join this session",
    "statusCode": 403
  }
  ```

- **409 Conflict:**
  ```json
  {
    "success": false,
    "message": "Session has not started yet. You can join 15 minutes before scheduled time.",
    "statusCode": 409
  }
  ```

- **410 Gone:**
  ```json
  {
    "success": false,
    "message": "Session has ended",
    "statusCode": 410
  }
  ```

- **404 Not Found:**
  ```json
  {
    "success": false,
    "message": "Session not found",
    "statusCode": 404
  }
  ```

**Backend Behavior:**
- Validate session exists and user is participant
- Check session status is "Confirmed"
- Allow joining 15 minutes before to 15 minutes after scheduledEndTime
- Return 409 if too early (>15 min before start)
- Return 410 if too late (>15 min after end)
- Mark attendance when participant joins
- Update session status to "InProgress" when first participant joins

---

### 11. Complete Session

**Endpoint:** `PATCH /api/sessions/{id}/complete`
**Requires:** `Authorization: Bearer {token}`
**Roles:** Mentor (if mentor), Admin

**Path Parameters:**
- `id` (string, GUID): Session ID

**Success Response (200):**
```json
{
  "success": true,
  "message": "Session marked as completed successfully",
  "data": {
    "id": "44444444-e29b-41d4-a716-446655440014",
    "status": "Completed",
    "completedAt": "2025-11-15T15:05:00Z",
    "duration": "SixtyMinutes",
    "actualDurationMinutes": 62,
    "paymentReleaseDate": "2025-11-18T15:05:00Z"
  }
}
```

**Error Responses:**

- **403 Forbidden:**
  ```json
  {
    "success": false,
    "message": "Only the mentor or admin can mark session as completed",
    "statusCode": 403
  }
  ```

- **409 Conflict:**
  ```json
  {
    "success": false,
    "message": "Session is already marked as completed",
    "statusCode": 409
  }
  ```

- **404 Not Found:**
  ```json
  {
    "success": false,
    "message": "Session not found",
    "statusCode": 404
  }
  ```

**Backend Behavior:**
- Validate session exists and user is mentor or admin
- Update status to "Completed"
- Set completedAt timestamp
- Calculate actual duration
- Trigger 72-hour payment hold (release after 3 days if no disputes)
- Send completion notification to mentee
- Trigger review request email to mentee after 24 hours
- Activate 3-day chat window between mentor and mentee

---

### 12. Get Session Recording

**Endpoint:** `GET /api/sessions/{id}/recording`
**Requires:** `Authorization: Bearer {token}`
**Roles:** User (if mentee), Mentor (if mentor)

**Path Parameters:**
- `id` (string, GUID): Session ID

**Description:**
Returns the session recording video. The recording is stored in Cloudflare R2 and served via a time-limited presigned URL. This endpoint always returns 200 with status information indicating whether the recording is available, still processing, or failed.

**Success Response (200) - Recording Available:**
```json
{
  "success": true,
  "message": "Session recording retrieved successfully",
  "data": {
    "sessionId": "44444444-e29b-41d4-a716-446655440014",
    "recordingPlayUrl": "https://r2.cloudflarestorage.com/bucket/session-id.mp4?token=...",
    "playUrl": "https://r2.cloudflarestorage.com/bucket/session-id.mp4?token=...",
    "accessToken": "",
    "expiresAt": "2025-11-15T16:05:00Z",
    "isAvailable": true,
    "status": "Available",
    "availableAt": "2025-11-15T15:10:00Z",
    "transcript": "[00:00] Speaker 0: Hello, welcome to the session..."
  }
}
```

**Success Response (200) - Recording Processing:**
```json
{
  "success": true,
  "message": "Session recording retrieved successfully",
  "data": {
    "sessionId": "44444444-e29b-41d4-a716-446655440014",
    "recordingPlayUrl": "",
    "playUrl": "",
    "accessToken": "",
    "expiresAt": "2025-11-15T15:05:00Z",
    "isAvailable": false,
    "status": "Processing",
    "availableAt": null,
    "transcript": null
  }
}
```

**Success Response (200) - Recording Failed:**
```json
{
  "success": true,
  "message": "Session recording retrieved successfully",
  "data": {
    "sessionId": "44444444-e29b-41d4-a716-446655440014",
    "recordingPlayUrl": "",
    "playUrl": "",
    "accessToken": "",
    "expiresAt": "2025-11-15T15:05:00Z",
    "isAvailable": false,
    "status": "Failed",
    "availableAt": null,
    "transcript": null
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

- **403 Forbidden:**
  ```json
  {
    "success": false,
    "message": "You are not authorized to view this recording",
    "statusCode": 403
  }
  ```

- **404 Not Found:**
  ```json
  {
    "success": false,
    "message": "Session not found",
    "statusCode": 404
  }
  ```

**Backend Behavior:**
- Validate session exists
- Verify user is session participant (mentee or mentor)
- Check if `VideoStorageKey` exists (recording stored in R2)
- If not available: Return DTO with `isAvailable = false` and appropriate status:
  - `"Processing"` if `RecordingProcessed = false`
  - `"Failed"` if `RecordingProcessed = true` but no `VideoStorageKey`
- If available: Generate presigned URL from R2 with 60-minute expiration and `inline` content disposition for browser streaming
- Include transcript if available

**Status Values:**
- `"Available"` - Recording ready, `recordingPlayUrl` contains valid presigned URL
- `"Processing"` - Recording still being processed (Zoom webhook not yet received or upload in progress)
- `"Failed"` - Recording processing failed, manual intervention may be required

---

### 13. Get Session Transcript

**Endpoint:** `GET /api/sessions/{id}/transcript`
**Requires:** `Authorization: Bearer {token}`
**Roles:** User (if mentee), Mentor (if mentor)

**Path Parameters:**
- `id` (string, GUID): Session ID

**Description:**
Returns the AI-generated transcript of the session recording. Transcription is performed by Deepgram after the recording is uploaded to R2.

**Success Response (200):**
```json
{
  "success": true,
  "message": "Session transcript retrieved successfully",
  "data": {
    "sessionId": "44444444-e29b-41d4-a716-446655440014",
    "transcript": "[00:00] Speaker 0: Hello, welcome to the session.\n[00:05] Speaker 1: Thank you for having me.\n[00:10] Speaker 0: Let's start with system design basics...",
    "isAvailable": true
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

- **403 Forbidden:**
  ```json
  {
    "success": false,
    "message": "You are not authorized to view this transcript",
    "statusCode": 403
  }
  ```

- **404 Not Found (Session):**
  ```json
  {
    "success": false,
    "message": "Session not found",
    "statusCode": 404
  }
  ```

- **404 Not Found (Transcript):**
  ```json
  {
    "success": false,
    "message": "Transcript not yet available for session {sessionId}",
    "statusCode": 404
  }
  ```

**Backend Behavior:**
- Validate session exists
- Verify user is session participant (mentee or mentor)
- Check if `Transcript` field is populated
- Return 404 if transcript not available yet
- Return transcript text if available

**Transcript Format:**
The transcript includes speaker diarization with timestamps:
```
[MM:SS] Speaker N: <text>
```

---

## Payment Management Endpoints

### 14. Create Payment Intent

**Endpoint:** `POST /api/payments/create-intent`
**Requires:** `Authorization: Bearer {token}`
**Roles:** User (mentee)

**Request Body:**
```json
{
  "sessionId": "44444444-e29b-41d4-a716-446655440014",
  "paymentProvider": "Stripe",
  "paymobPaymentMethod": "Card"
}
```

**Field Requirements:**
- `sessionId` (required): Valid session GUID
- `paymentProvider` (required): Enum - `Stripe` or `Paymob`
- `paymobPaymentMethod` (optional): Enum - `Card` or `EWallet` (required when paymentProvider = Paymob)

**Payment Provider Logic:**
- When `paymentProvider` = `Stripe`: Currency = USD, supports international card payments
- When `paymentProvider` = `Paymob`: Currency = EGP, supports local Egyptian payment methods

**Success Response (201):**
```json
{
  "success": true,
  "message": "Payment intent created successfully",
  "data": {
    "paymentIntentId": "pi_3AbcDefGhiJkLmNoPqRsTuVw",
    "clientSecret": "pi_3AbcDefGhiJkLmNoPqRsTuVw_secret_xYzAbCdEfGhIjKlMnOpQrStUvWx",
    "amount": 45.00,
    "currency": "USD",
    "sessionId": "44444444-e29b-41d4-a716-446655440014",
    "paymentProvider": "Stripe",
    "status": "RequiresPaymentMethod"
  }
}
```

**Error Responses:**

- **400 Bad Request:**
  ```json
  {
    "success": false,
    "message": "Session already has a payment associated",
    "statusCode": 400
  }
  ```
- **400 Bad Request:**
  ```json
  {
    "success": false,
    "message": "Payment Error",
    "statusCode": 400,
    "errors":{
        "paymentProvider":"Stripe",
        "paymentIntentId":"222"
    }
  }
  ```


- **404 Not Found:**
  ```json
  {
    "success": false,
    "message": "Session not found",
    "statusCode": 404
  }
  ```

**Backend Behavior:**
- Validate session exists and is in "Pending" status
- Create payment intent via Stripe or Paymob API
- Store payment record with status "Pending"
- Return client secret for frontend to complete payment
- Payment intent expires after 24 hours if not completed

---

### 15. Confirm Payment

**Endpoint:** `POST /api/payments/confirm`
**Requires:** `Authorization: Bearer {token}`
**Roles:** User (mentee)

**Request Body:**
```json
{
  "paymentIntentId": "pi_3AbcDefGhiJkLmNoPqRsTuVw",
  "sessionId": "44444444-e29b-41d4-a716-446655440014"
}
```

**Field Requirements:**
- `paymentIntentId` (required): Payment intent ID from Stripe/Paymob
- `sessionId` (required): Valid session GUID

**Success Response (200):**
```json
{
  "success": true,
  "message": "Payment confirmed successfully. Your session is now booked!",
  "data": {
    "paymentId": "66666666-e29b-41d4-a716-446655440016",
    "sessionId": "44444444-e29b-41d4-a716-446655440014",
    "amount": 45.00,
    "platformCommission": 6.75,
    "mentorPayoutAmount": 38.25,
    "paymentProvider": "Stripe",
    "status": "Captured",
    "transactionId": "txn_1234567890abcdef",
    "paidAt": "2025-11-09T10:35:00Z",
    "session": {
      "id": "44444444-e29b-41d4-a716-446655440014",
      "status": "Confirmed",
      "videoConferenceLink": null,
      "scheduledStartTime": "2025-11-15T14:00:00Z"
    }
  }
}
```

**Note:** The `videoConferenceLink` will be `null` initially. The Zoom meeting is created via a background job after payment confirmation. The Zoom link will be sent via email 15 minutes before the session starts. Users can also retrieve the link via `GET /api/sessions/{id}` or `POST /api/sessions/{id}/join` once the meeting is created.

**Error Responses:**

- **400 Bad Request:**
  ```json
  {
    "success": false,
    "message": "Payment intent has already been processed",
    "statusCode": 400
  }
  ```

- **402 Payment Required:**
  ```json
  {
    "success": false,
    "message": "Payment failed. Please try again or use a different payment method.",
    "statusCode": 402
  }
  ```

- **404 Not Found:**
  ```json
  {
    "success": false,
    "message": "Payment intent or session not found",
    "statusCode": 404
  }
  ```

**Backend Behavior:**
- Verify payment intent status with Stripe/Paymob
- Validate payment amount matches session price
- Calculate 15% platform commission
- Update payment status to "Captured"
- Update session status to "Confirmed"
- Send confirmation emails to mentee and mentor (without Zoom link - link sent separately)
- Queue background job to create Zoom meeting (`CreateZoomMeetingForSessionAsync`)
- Notify client via SignalR about payment status

**Zoom Meeting Creation (Background Job):**
- Create Zoom meeting via Zoom API with cloud recording enabled
- Store `ZoomMeetingId`, `VideoConferenceLink`, and `ZoomMeetingPassword` in session
- Schedule Zoom link email to be sent 15 minutes before session start
- Schedule auto-termination job for 2 minutes after session scheduled end time
- If session starts in less than 15 minutes, send Zoom link email immediately

---

### 16. Get Payment History

**Endpoint:** `GET /api/payments/history`
**Requires:** `Authorization: Bearer {token}`
**Roles:** Any authenticated user

**Query Parameters:**
- `page` (integer, optional): Page number (default: 1, min: 1)
- `pageSize` (integer, optional): Items per page (default: 10, min: 1, max: 50)
- `status` (string, optional): Filter by payment status - `Pending`, `Captured`, `Refunded`, `Failed`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Payment history retrieved successfully",
  "data": {
    "payments": [
      {
        "id": "66666666-e29b-41d4-a716-446655440016",
        "sessionId": "44444444-e29b-41d4-a716-446655440014",
        "mentorName": "Sarah Johnson",
        "sessionTopic": "System Design Interview Preparation",
        "amount": 45.00,
        "paymentProvider": "Stripe",
        "status": "Captured",
        "transactionId": "txn_1234567890abcdef",
        "paidAt": "2025-11-09T10:35:00Z",
        "refundAmount": null,
        "refundedAt": null
      },
      {
        "id": "aaaaaaaa-e29b-41d4-a716-446655440020",
        "sessionId": "bbbbbbbb-e29b-41d4-a716-446655440021",
        "mentorName": "Michael Chen",
        "sessionTopic": "Career Strategy",
        "amount": 35.00,
        "paymentProvider": "Paymob",
        "status": "Refunded",
        "transactionId": "txn_9876543210zyxwvu",
        "paidAt": "2025-10-01T14:20:00Z",
        "refundAmount": 35.00,
        "refundedAt": "2025-10-05T09:15:00Z"
      }
    ],
    "pagination": {
      "totalCount": 2,
      "currentPage": 1,
      "pageSize": 10,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPreviousPage": false
    },
    "summary": {
      "totalSpent": 80.00,
      "totalRefunded": 35.00,
      "netSpent": 45.00
    }
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

- **404 Not Found:**
  ```json
  {
    "success": false,
    "message": "No payment history found",
    "statusCode": 404
  }
  ```

**Backend Behavior:**
- Extract user ID from JWT token
- Fetch payments where user is mentee
- Apply status filter if provided
- Order by paidAt DESC
- Calculate summary statistics (totalSpent, totalRefunded, netSpent)
- Apply pagination
- Return 404 if no payment history

---

## Webhook Endpoints (Backend Integration Only)

**Note:** These endpoints are called by payment gateways (Stripe, Paymob), not by frontend applications. They handle payment event notifications.

### Stripe Webhook

**Endpoint:** `POST /api/payments/webhooks/stripe`
**Requires:** Stripe signature verification
**Purpose:** Handle payment events from Stripe

**Events Handled:**
- `payment_intent.succeeded` - Confirm payment and update session
- `payment_intent.payment_failed` - Mark payment as failed
- `charge.refunded` - Process refund and update records

---

### Paymob Webhook

**Endpoint:** `POST /api/payments/webhooks/paymob`
**Requires:** HMAC signature verification
**Purpose:** Handle payment events from Paymob

**Events Handled:**
- `transaction.success` - Confirm payment and update session
- `transaction.failed` - Mark payment as failed
- `transaction.refunded` - Process refund and update records

---

### Zoom Webhook

**Endpoint:** `POST /api/webhooks/zoom`
**Requires:** HMAC signature verification using `x-zm-signature` header
**Purpose:** Handle Zoom meeting and recording events

**Events Handled:**
- `endpoint.url_validation` - Zoom URL validation challenge (returns encrypted token)
- `recording.completed` - Recording ready for download
  - Downloads MP4 video from Zoom
  - Uploads to Cloudflare R2 storage
  - Triggers Deepgram transcription via presigned R2 URL
  - Updates session with `VideoStorageKey`, `RecordingPlayUrl`, and `Transcript`
  - Marks `RecordingProcessed = true` and `TranscriptProcessed = true`
- `recording.transcript_completed` - Processed same as `recording.completed`
- `meeting.ended` - Logged for audit purposes

**Webhook Payload (recording.completed):**
```json
{
  "event": "recording.completed",
  "payload": {
    "object": {
      "id": 1234567890,
      "uuid": "AbCdEfGhIjKlMnOp==",
      "topic": "Mentorship Session - {sessionId}",
      "start_time": "2025-11-15T14:00:00Z",
      "duration": 60,
      "download_access_token": "eyJhbGciOiJIUzUxMiJ9...",
      "recording_files": [
        {
          "id": "abc123",
          "file_type": "MP4",
          "file_size": 52428800,
          "download_url": "https://zoom.us/rec/download/...",
          "play_url": "https://zoom.us/rec/play/...",
          "recording_start": "2025-11-15T14:00:00Z",
          "recording_end": "2025-11-15T15:00:00Z",
          "status": "completed"
        }
      ]
    }
  }
}
```

---

## Data Models

### SessionDto
```typescript
{
  "id": "string (GUID)",
  "menteeId": "string (GUID)",
  "menteeFirstName": "string",
  "menteeLastName": "string",
  "menteeProfilePictureUrl": "string | null",
  "mentorId": "string (GUID)",
  "mentorFirstName": "string",
  "mentorLastName": "string",
  "mentorProfilePictureUrl": "string | null",
  "timeSlotId": "string | null",                // NEW: Reference to TimeSlot
  "sessionType": "string (enum: OneOnOne, Group)",
  "duration": "string (enum: ThirtyMinutes, SixtyMinutes)",
  "scheduledStartTime": "ISO 8601 datetime",
  "scheduledEndTime": "ISO 8601 datetime",
  "status": "string (enum: Pending, Confirmed, InProgress, Completed, Cancelled, NoShow, PendingReschedule)",
  "videoConferenceLink": "string | null",
  "topic": "string | null",
  "notes": "string | null",
  "price": "decimal",
  "paymentId": "string (GUID) | null",
  "paymentStatus": "string | null",
  "cancellationReason": "string | null",
  "canReschedule": "boolean",
  "canCancel": "boolean",
  "hoursUntilSession": "integer | null",
  "createdAt": "ISO 8601 datetime",
  "updatedAt": "ISO 8601 datetime",
  "completedAt": "ISO 8601 datetime | null"
}
```

### PaymentDto
```typescript
{
  "id": "string (GUID)",
  "sessionId": "string (GUID)",
  "amount": "decimal",
  "platformCommission": "decimal",
  "mentorPayoutAmount": "decimal",
  "paymentProvider": "string (enum: Stripe, Paymob)",
  "status": "string (enum: Pending, Authorized, Captured, Refunded, Failed)",
  "transactionId": "string",
  "refundAmount": "decimal | null",
  "refundedAt": "ISO 8601 datetime | null",
  "paidAt": "ISO 8601 datetime | null",
  "createdAt": "ISO 8601 datetime",
  "updatedAt": "ISO 8601 datetime"
}
```

### BookSessionRequestDto
```typescript
{
  "timeSlotId": "string (required)",           // Changed from mentorId + duration + scheduledStartTime
  "topic": "string | optional",
  "notes": "string | optional"
}
```

### SessionRecordingDto
```typescript
{
  "sessionId": "string (GUID)",
  "recordingPlayUrl": "string",                // R2 presigned URL (empty if not available)
  "playUrl": "string",                         // Alias for recordingPlayUrl
  "accessToken": "string",                     // Empty string (legacy field)
  "expiresAt": "ISO 8601 datetime",            // URL expiration time
  "isAvailable": "boolean",                    // Whether recording is ready
  "status": "string (Available | Processing | Failed)",
  "availableAt": "ISO 8601 datetime | null",   // When recording became available
  "transcript": "string | null"                // Session transcript if available
}
```

### RescheduleRequestDto
```typescript
{
  "newScheduledStartTime": "ISO 8601 datetime",
  "reason": "string"
}
```

### CancelRequestDto
```typescript
{
  "reason": "string"
}
```

### Enums

**SessionStatus:**
`Pending | Confirmed | InProgress | Completed | Cancelled | NoShow | PendingReschedule`

**PaymentStatus:**
`Pending | Authorized | Captured | Refunded | Failed`

**PaymentProvider:**
`Stripe | Paymob`

**PaymobPaymentMethod:**
`Card | EWallet`

**Duration:**
`ThirtyMinutes | SixtyMinutes`

**SessionType:**
`OneOnOne | Group`

**RecordingStatus:**
`Available | Processing | Failed`

---

## Validation Rules

### Session Booking
- timeSlotId: Required, must reference an existing TimeSlot
- TimeSlot must be available (`isBooked = false`)
- TimeSlot must be at least 24 hours in the future
- Validate no scheduling conflicts for mentee (no overlapping sessions)
- topic: Optional, max 200 characters
- notes: Optional, max 1000 characters

### Reschedule
- Must be requested >24 hours before original scheduledStartTime
- newScheduledStartTime: Must be at least 24 hours in future
- reason: Required, min 10 chars, max 500 chars
- Requires mentor approval

### Cancellation
- reason: Required, min 10 chars, max 500 chars
- Refund policy applied based on hours until session:
  - >48h: 100% refund
  - 24-48h: 50% refund
  - <24h: 0% refund

### Payment
- amount: Must match session price (rate30Min or rate60Min)
- Platform commission: Always 15% of amount
- Payment provider: Must be Stripe or Paymob
- Paymob payment method: Required when provider = Paymob (Card or EWallet)

---

## Security Considerations

### Authorization
- Verify JWT token on all requests
- Validate user is session participant for session operations
- Only mentor or admin can mark session complete
- Validate payment intent belongs to requesting user

### Payment Security
- Use Stripe/Paymob secure payment intents (PCI DSS compliant)
- Never store credit card details on backend
- Verify webhook signatures to prevent fraud
- Implement idempotency for payment operations
- Log all payment transactions for audit trail

### Data Privacy
- Don't expose payment method details beyond type (Visa, etc.)
- Sanitize error messages to avoid leaking sensitive data
- Rate limit booking endpoints (max 10 bookings per hour per user)

### Business Logic
- Prevent double-booking of time slots (use database transactions with row locking)
- Validate session overlap to prevent scheduling conflicts
- Enforce 24-hour minimum advance booking
- Calculate refunds server-side (never trust client calculations)

---

## Testing Checklist

### POST /api/sessions (Book Session)
- [ ] Book session with valid timeSlotId
- [ ] Book session with non-existent timeSlotId (404)
- [ ] Book session with already-booked timeSlot (409)
- [ ] Book session with overlapping time for mentee (409)
- [ ] Book session without authentication (401)
- [ ] Verify TimeSlot marked as booked after session creation
- [ ] Verify session created with status 'Pending' and paymentId is null
- [ ] Verify mentorId, price, and scheduledStartTime derived from TimeSlot

### GET /api/sessions/{id}
- [ ] Get session detail as mentee
- [ ] Get session detail as mentor
- [ ] Get session detail as admin
- [ ] Try to get session as unauthorized user (403)
- [ ] Get non-existent session (404)
- [ ] Verify canReschedule and canCancel flags

### GET /api/sessions/upcoming
- [ ] Get upcoming sessions as mentee
- [ ] Get upcoming sessions as mentor
- [ ] Verify pagination works correctly
- [ ] Verify sessions are ordered by scheduledStartTime
- [ ] Handle no upcoming sessions (404)

### GET /api/sessions/past
- [ ] Get past sessions as mentee
- [ ] Get past sessions as mentor
- [ ] Verify hasReview flag is accurate
- [ ] Verify sessions are ordered by recent first
- [ ] Handle no past sessions (404)

### PATCH /api/sessions/{id}/reschedule
- [ ] Reschedule session >24h before (success)
- [ ] Reschedule session <24h before (409)
- [ ] Reschedule as unauthorized user (403)
- [ ] Reschedule non-existent session (404)
- [ ] Verify notification sent to other party

### PATCH /api/sessions/{id}/cancel
- [ ] Cancel session >48h before (100% refund)
- [ ] Cancel session 24-48h before (50% refund)
- [ ] Cancel session <24h before (0% refund)
- [ ] Cancel as unauthorized user (403)
- [ ] Cancel completed session (409)
- [ ] Verify refund is processed
- [ ] Verify TimeSlot released (IsBooked = false, SessionId = null) after cancellation

### POST /api/sessions/{id}/join
- [ ] Join session as mentee
- [ ] Join session as mentor
- [ ] Join session 15min before start (success)
- [ ] Join session >15min before start (409)
- [ ] Join session after end time (410)
- [ ] Join as unauthorized user (403)

### PATCH /api/sessions/{id}/complete
- [ ] Complete session as mentor
- [ ] Complete session as admin
- [ ] Complete session as mentee (403)
- [ ] Complete already completed session (409)
- [ ] Verify 72h payment hold is triggered

### POST /api/payments/create-intent
- [ ] Create payment intent with Stripe
- [ ] Create payment intent with Paymob
- [ ] Create intent for session with existing payment (400)
- [ ] Create intent for non-existent session (404)

### POST /api/payments/confirm
- [ ] Confirm payment successfully
- [ ] Verify session status updates to Confirmed
- [ ] Verify Zoom meeting creation job is queued
- [ ] Confirm already processed payment (400)
- [ ] Confirm with failed payment (402)

### GET /api/sessions/{id}/recording
- [ ] Get recording as mentee (200)
- [ ] Get recording as mentor (200)
- [ ] Get recording when available (status = "Available", URL populated)
- [ ] Get recording when processing (status = "Processing", isAvailable = false)
- [ ] Get recording when failed (status = "Failed", isAvailable = false)
- [ ] Get recording as unauthorized user (403)
- [ ] Get recording for non-existent session (404)

### GET /api/sessions/{id}/transcript
- [ ] Get transcript as mentee (200)
- [ ] Get transcript as mentor (200)
- [ ] Get transcript when not ready (404)
- [ ] Get transcript as unauthorized user (403)
- [ ] Get transcript for non-existent session (404)

### GET /api/payments/history
- [ ] Get payment history with pagination
- [ ] Filter by status (Captured, Refunded)
- [ ] Verify summary calculations are correct
- [ ] Handle no payment history (404)

---

## Sample API Requests

**Book New Session:**
```bash
POST http://localhost:5000/api/sessions
Authorization: Bearer {access-token}
Content-Type: application/json

{
  "timeSlotId": "ts_123",
  "topic": "System Design Interview Preparation",
  "notes": "Focusing on distributed systems"
}
```

**Get Session Detail:**
```bash
GET http://localhost:5000/api/sessions/44444444-e29b-41d4-a716-446655440014
Authorization: Bearer {access-token}
```

**Get Upcoming Sessions:**
```bash
GET http://localhost:5000/api/sessions/upcoming?page=1&pageSize=10
Authorization: Bearer {access-token}
```

**Reschedule Session:**
```bash
PATCH http://localhost:5000/api/sessions/44444444-e29b-41d4-a716-446655440014/reschedule
Authorization: Bearer {access-token}
Content-Type: application/json

{
  "newScheduledStartTime": "2025-11-16T15:00:00Z",
  "reason": "Conflict with another meeting"
}
```

**Cancel Session:**
```bash
PATCH http://localhost:5000/api/sessions/44444444-e29b-41d4-a716-446655440014/cancel
Authorization: Bearer {access-token}
Content-Type: application/json

{
  "reason": "Emergency came up, unable to attend"
}
```

**Join Session:**
```bash
POST http://localhost:5000/api/sessions/44444444-e29b-41d4-a716-446655440014/join
Authorization: Bearer {access-token}
```

**Confirm Payment:**
```bash
POST http://localhost:5000/api/payments/confirm
Authorization: Bearer {access-token}
Content-Type: application/json

{
  "paymentIntentId": "pi_3AbcDefGhiJkLmNoPqRsTuVw",
  "sessionId": "44444444-e29b-41d4-a716-446655440014"
}
```

**Get Payment History:**
```bash
GET http://localhost:5000/api/payments/history?page=1&pageSize=10&status=Captured
Authorization: Bearer {access-token}
```

**Get Session Recording:**
```bash
GET http://localhost:5000/api/sessions/44444444-e29b-41d4-a716-446655440014/recording
Authorization: Bearer {access-token}
```

**Get Session Transcript:**
```bash
GET http://localhost:5000/api/sessions/44444444-e29b-41d4-a716-446655440014/transcript
Authorization: Bearer {access-token}
```
