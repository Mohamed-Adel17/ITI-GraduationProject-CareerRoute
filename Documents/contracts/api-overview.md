# API Contracts: Career Route Platform

## Base URL

- Development: `http://localhost:5000/api/v1`
- Production: `https://api.careerroute.com/api/v1`

**Note**: API is versioned. All endpoints include `/v1/` in the path for future-proofing.

## Authentication

All protected endpoints require JWT bearer token in header:

```
Authorization: Bearer <token>
```

## API Endpoints Summary

**Note**: All endpoints are prefixed with `/api/v1`. For example: `POST /api/v1/auth/register`

### Authentication (`/api/v1/auth`)

- `POST /register` - Register new user (public)
- `POST /login` - Login and get JWT tokens (public)
- `POST /refresh` - Refresh access token
- `POST /forgot-password` - Request password reset (public)
- `POST /reset-password` - Reset password with token (public)
- `GET /verify-email?token={token}` - Verify email (public)

### Users (`/api/v1/users`)

- `GET /{id}` - Get user profile (self or admin)
- `PUT /{id}` - Update user profile (self only)
- `GET /{id}/sessions` - Get user's sessions
- `GET /{id}/payments` - Get payment history

### Mentors (`/api/v1/mentors`)

- `GET /` - Search/filter mentors (public)
- `GET /{id}` - Get mentor profile (public)
- `POST /` - Apply as mentor (authenticated)
- `PUT /{id}` - Update mentor profile (self/admin)
- `GET /{id}/availability` - Get mentor calendar
- `PUT /{id}/availability` - Update availability (mentor only)
- `GET /{id}/reviews` - Get mentor reviews (public)

### Categories (`/api/v1/categories`)

- `GET /` - List all categories (public)
- `GET /{id}/mentors` - Get mentors by category (public)
- `POST /` - Create category (admin)
- `PUT /{id}` - Update category (admin)

### Sessions (`/api/v1/sessions`)

- `POST /` - Book session (user)
- `GET /{id}` - Get session details (participants only)
- `GET /upcoming` - Get user's upcoming sessions
- `PUT /{id}/reschedule` - Request reschedule (participants)
- `PUT /{id}/cancel` - Cancel session (participants)
- `POST /{id}/start` - Mark session started (mentor)
- `POST /{id}/complete` - Mark session completed (mentor)

### Payments (`/api/v1/payments`)

- `POST /` - Process payment (user)
- `GET /{id}` - Get payment details
- `POST /{id}/refund` - Request refund (admin)
- `GET /history` - Get payment history

### Reviews (`/api/v1/reviews`)

- `POST /` - Submit review (mentee, post-session)
- `GET /session/{sessionId}` - Get session review
- `PUT /{id}` - Update review (self, within 7 days)
- `DELETE /{id}` - Hide review (admin)

### Chat (`/api/v1/chat`)

- `POST /messages` - Send message (participants)
- `POST /upload` - Upload file attachment (participants)
- `GET /download/{fileId}` - Download file attachment (participants)
- `GET /session/{sessionId}/messages` - Get chat history
- `PUT /messages/{id}/read` - Mark as read

### Disputes (`/api/v1/disputes`)

- `POST /` - File dispute (session participants)
- `GET /{id}` - Get dispute details
- `PUT /{id}/resolve` - Resolve dispute (admin)

### Admin (`/api/v1/admin`)

- `GET /mentors/pending` - Get pending mentor applications
- `PUT /mentors/{id}/approve` - Approve mentor
- `PUT /mentors/{id}/reject` - Reject mentor
- `GET /analytics` - Get platform analytics
- `GET /disputes` - List all disputes
- `GET /audit-logs` - Get admin action logs

## Response Formats

### Success (200 OK)

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error (4xx/5xx)

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [{ "field": "email", "message": "Invalid email format" }]
  }
}
```

## Rate Limiting

- 100 requests/minute per user
- 5 login attempts per 15 minutes per IP
- 429 Too Many Requests if exceeded

## Pagination

```
GET /api/v1/mentors?page=1&pageSize=20&sortBy=rating&sortOrder=desc
```

Response includes pagination metadata:

```json
{
  "data": [...],
  "pagination": {
    "currentPage": 1,
    "pageSize": 20,
    "totalPages": 5,
    "totalRecords": 87
  }
}
```

## Common Status Codes

- 200: Success
- 201: Created
- 204: No Content
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 409: Conflict
- 422: Unprocessable Entity
- 429: Too Many Requests
- 500: Internal Server Error
- 502: Bad Gateway (External service error)
- 503: Service Unavailable

## Technical Standards

### Date and Time Format

All dates and times use **ISO 8601 format with UTC timezone**:

- Format: `YYYY-MM-DDTHH:mm:ssZ`
- Example: `"2024-01-15T14:30:00Z"`
- All dates stored and transmitted in UTC
- Frontend displays in user's local timezone

**Examples**:
```json
{
  "scheduledStartTime": "2024-01-20T10:00:00Z",
  "createdAt": "2024-01-15T08:30:45Z",
  "birthDate": "1990-05-15"
}
```

**Date-only fields** (no time component): `YYYY-MM-DD`

### Enum Serialization

Enums are serialized as **strings** (not integers):

```json
{
  "sessionStatus": "Completed",
  "paymentStatus": "Pending",
  "userRole": "Mentor"
}
```

**Common Enums**:
- `SessionStatus`: `"Pending"`, `"Confirmed"`, `"InProgress"`, `"Completed"`, `"Cancelled"`, `"NoShow"`
- `PaymentStatus`: `"Pending"`, `"Authorized"`, `"Captured"`, `"Refunded"`, `"Failed"`
- `UserRole`: `"User"`, `"Mentor"`, `"Admin"`
- `SessionType`: `"OneOnOne"`, `"Group"`
- `DisputeStatus`: `"Open"`, `"UnderReview"`, `"Resolved"`, `"Closed"`

### Null Handling

- **Null fields are included** in responses (not omitted)
- Empty collections return `[]` (not `null`)
- Optional fields marked in documentation

**Example**:
```json
{
  "bio": null,
  "videoConferenceLink": null,
  "expertiseTags": []
}
```

### Request Headers

**Required for all requests**:
- `Content-Type: application/json` (for POST/PUT)
- `Accept: application/json`

**Required for authenticated requests**:
- `Authorization: Bearer {jwt_token}`

**Optional (recommended)**:
- `X-Request-ID: {uuid}` - Client-generated request ID for tracing

## Error Codes

Complete list of error codes and when they're used:

| Code | HTTP Status | When Used | Example Message |
|------|-------------|-----------|-----------------|
| `VALIDATION_ERROR` | 400 | Request validation failed | "Validation failed" |
| `INVALID_CREDENTIALS` | 401 | Login failed | "Invalid email or password" |
| `AUTHENTICATION_REQUIRED` | 401 | No/invalid JWT token | "Authentication required" |
| `TOKEN_EXPIRED` | 401 | JWT token expired | "Token has expired" |
| `AUTHORIZATION_FAILED` | 403 | Authenticated but no permission | "You don't have permission to access this resource" |
| `RESOURCE_NOT_FOUND` | 404 | Entity doesn't exist | "Mentor not found" |
| `DUPLICATE_RESOURCE` | 409 | Uniqueness constraint violation | "Email already registered" |
| `SESSION_CONFLICT` | 409 | Session time overlap | "Time slot already booked" |
| `BUSINESS_RULE_VIOLATION` | 422 | Valid format but business rule failed | "Cannot book session in the past" |
| `INSUFFICIENT_FUNDS` | 422 | Payment amount issue | "Insufficient balance" |
| `SESSION_NOT_ELIGIBLE_FOR_REVIEW` | 422 | Review requirements not met | "Session must be completed before review" |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests | "Rate limit exceeded. Try again in 60 seconds" |
| `PAYMENT_PROCESSING_ERROR` | 502 | Payment gateway error | "Payment service temporarily unavailable" |
| `EXTERNAL_SERVICE_ERROR` | 502 | External API failed | "Video conferencing service unavailable" |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected server error | "An unexpected error occurred" |

### Validation Error Details

Each validation error includes details array with:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Email is required",
        "code": "REQUIRED"
      },
      {
        "field": "password",
        "message": "Password must be at least 8 characters",
        "code": "MIN_LENGTH",
        "attemptedValue": "12345"
      }
    ]
  }
}
```

**Validation Codes**:
- `REQUIRED` - Field is required
- `INVALID_FORMAT` - Format is invalid (email, phone, etc.)
- `MIN_LENGTH` - String too short
- `MAX_LENGTH` - String too long
- `MIN_VALUE` - Number too small
- `MAX_VALUE` - Number too large
- `INVALID_ENUM` - Not a valid enum value

## File Uploads

### Upload Endpoint

`POST /api/v1/chat/upload`

**Authentication**: Required  
**Content-Type**: `multipart/form-data`

**Request**:
- `file`: File binary (required)
- `sessionId`: Integer (required)

**Constraints**:
- Max file size: **10 MB**
- Allowed types: PDF, DOC, DOCX, PNG, JPG, JPEG, GIF
- File name: Sanitized and stored with unique identifier

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "url": "https://storage.careerroute.com/attachments/abc123_document.pdf",
    "fileName": "document.pdf",
    "size": 2048576,
    "uploadedAt": "2024-01-15T10:30:00Z",
    "contentType": "application/pdf"
  }
}
```

**Error Response (400 Bad Request)**:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_FILE",
    "message": "File validation failed",
    "details": [
      { "field": "file", "message": "File size exceeds 10MB limit", "code": "FILE_TOO_LARGE" }
    ]
  }
}
```

### Download Endpoint

`GET /api/v1/chat/download/{fileId}`

**Authentication**: Required  
**Authorization**: User must be participant in the session

**Response**: File stream with appropriate Content-Type header

### File Security

- Files scanned for viruses (production only)
- Only session participants can access attachments
- Files automatically deleted when chat window expires (72 hours after session)
- Temporary storage during upload with cleanup job

## Real-Time Communication (SignalR)

### Hub Endpoint

- Development: `ws://localhost:5000/hubs/chat`
- Production: `wss://api.careerroute.com/hubs/chat`

### Authentication

Connect with JWT token using one of:
1. Query string: `?access_token={jwt_token}`
2. Authorization header (if WebSocket client supports it)

### Connection Lifecycle

**Client → Server Events**:

#### `JoinSessionChat(sessionId: number)`
Join a session's chat room before sending/receiving messages.

**Example**:
```typescript
connection.invoke('JoinSessionChat', 456);
```

#### `SendMessageToSession(sessionId: number, message: string)`
Send a text message to session chat.

**Example**:
```typescript
connection.invoke('SendMessageToSession', 456, 'Hello!');
```

#### `NotifyTyping(sessionId: number, isTyping: boolean)`
Notify other participant that user is typing.

**Example**:
```typescript
connection.invoke('NotifyTyping', 456, true);  // Started typing
connection.invoke('NotifyTyping', 456, false); // Stopped typing
```

#### `MarkMessageAsRead(messageId: number)`
Mark a message as read.

**Example**:
```typescript
connection.invoke('MarkMessageAsRead', 789);
```

**Server → Client Events**:

#### `ReceiveMessage(message: ChatMessage)`
Triggered when a new message is sent to the session.

**ChatMessage Structure**:
```json
{
  "id": 789,
  "sessionId": 456,
  "senderId": 123,
  "senderName": "John Doe",
  "messageText": "Hello!",
  "attachmentUrl": null,
  "sentAt": "2024-01-15T10:30:00Z",
  "isRead": false
}
```

**Example Handler**:
```typescript
connection.on('ReceiveMessage', (message) => {
  console.log('New message:', message);
  displayMessage(message);
});
```

#### `UserTyping(userName: string, isTyping: boolean)`
Other participant started/stopped typing.

**Example Handler**:
```typescript
connection.on('UserTyping', (userName, isTyping) => {
  if (isTyping) {
    showTypingIndicator(userName);
  } else {
    hideTypingIndicator();
  }
});
```

#### `MessageRead(messageId: number, readBy: string)`
Message was read by other participant.

**Example Handler**:
```typescript
connection.on('MessageRead', (messageId, readBy) => {
  updateMessageStatus(messageId, 'read');
});
```

#### `UserConnected(userId: number, userName: string)`
Participant joined the session.

**Example Handler**:
```typescript
connection.on('UserConnected', (userId, userName) => {
  showNotification(`${userName} joined the chat`);
});
```

#### `UserDisconnected(userId: number, userName: string)`
Participant left the session.

**Example Handler**:
```typescript
connection.on('UserDisconnected', (userId, userName) => {
  showNotification(`${userName} left the chat`);
});
```

### Connection Management

**Automatic Reconnection**:
- Retry intervals: 0ms, 2s, 5s, 10s (exponential backoff)
- Max reconnection attempts: Infinite (until manually disconnected)

**Connection States**:
- `Connecting` - Initial connection attempt
- `Connected` - Successfully connected
- `Reconnecting` - Connection lost, attempting to reconnect
- `Disconnected` - Manually disconnected or connection failed

**Frontend Example**:
```typescript
const connection = new signalR.HubConnectionBuilder()
  .withUrl('/hubs/chat', {
    accessTokenFactory: () => getJwtToken()
  })
  .withAutomaticReconnect([0, 2000, 5000, 10000])
  .build();

connection.onreconnecting(() => {
  console.log('Reconnecting...');
  showReconnectingIndicator();
});

connection.onreconnected(() => {
  console.log('Reconnected');
  hideReconnectingIndicator();
  // Rejoin session chat rooms
  connection.invoke('JoinSessionChat', sessionId);
});

connection.onclose(() => {
  console.log('Connection closed');
});

await connection.start();
```

### Chat Window Expiry

- Chat available for **72 hours** after session completion
- After expiry:
  - No new messages can be sent (read-only mode)
  - Existing messages remain visible for 7 days
  - Attachments deleted after 7 days

## CORS Configuration

### Allowed Origins

- Development: `http://localhost:4200` (Angular dev server)
- Production: `https://www.careerroute.com`, `https://app.careerroute.com`

### Allowed Methods

- GET, POST, PUT, DELETE, OPTIONS

### Allowed Headers

- Authorization, Content-Type, Accept, X-Request-ID

### Credentials

- Credentials allowed: `true` (for cookies and Authorization header)

### Preflight Cache

- Max age: 3600 seconds (1 hour)

## Frontend Integration

### TypeScript Client Generation

**Recommended Tool**: NSwag or OpenAPI Generator

**Process**:
1. Backend exposes Swagger/OpenAPI spec: `GET /swagger/v1/swagger.json`
2. Frontend runs generation script: `npm run generate:api-client`
3. Generated file: `src/app/core/api/api-client.ts` (auto-generated, do not edit manually)

**Benefits**:
- Type-safe API calls
- Auto-complete in IDE
- Compile-time error detection
- Automatic sync with backend DTOs

**Example Usage**:
```typescript
import { MentorsClient, MentorDto } from '@app/core/api/api-client';

constructor(private mentorsClient: MentorsClient) {}

searchMentors(searchTerm: string): Observable<ApiResponse<PagedResponse<MentorDto>>> {
  return this.mentorsClient.searchMentors({ 
    keywords: searchTerm,
    page: 1,
    pageSize: 20
  });
}
```

**Regeneration Required**:
- After any backend DTO changes
- Before each frontend deployment
- After adding new endpoints
- When enum values change

**Command**: `npm run generate:api-client` (configured in package.json)
