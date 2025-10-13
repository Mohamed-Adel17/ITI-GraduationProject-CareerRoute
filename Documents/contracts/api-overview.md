# API Contracts: Career Route Platform

## Base URL

- Development: `http://localhost:5000/api`
- Production: `https://api.careerroute.com/api`

## Authentication

All protected endpoints require JWT bearer token in header:

```
Authorization: Bearer <token>
```

## API Endpoints Summary

### Authentication (`/api/auth`)

- `POST /register` - Register new user (public)
- `POST /login` - Login and get JWT tokens (public)
- `POST /refresh` - Refresh access token
- `POST /forgot-password` - Request password reset (public)
- `POST /reset-password` - Reset password with token (public)
- `GET /verify-email?token={token}` - Verify email (public)

### Users (`/api/users`)

- `GET /{id}` - Get user profile (self or admin)
- `PUT /{id}` - Update user profile (self only)
- `GET /{id}/sessions` - Get user's sessions
- `GET /{id}/payments` - Get payment history

### Mentors (`/api/mentors`)

- `GET /` - Search/filter mentors (public)
- `GET /{id}` - Get mentor profile (public)
- `POST /` - Apply as mentor (authenticated)
- `PUT /{id}` - Update mentor profile (self/admin)
- `GET /{id}/availability` - Get mentor calendar
- `PUT /{id}/availability` - Update availability (mentor only)
- `GET /{id}/reviews` - Get mentor reviews (public)

### Categories (`/api/categories`)

- `GET /` - List all categories (public)
- `GET /{id}/mentors` - Get mentors by category (public)
- `POST /` - Create category (admin)
- `PUT /{id}` - Update category (admin)

### Sessions (`/api/sessions`)

- `POST /` - Book session (user)
- `GET /{id}` - Get session details (participants only)
- `GET /upcoming` - Get user's upcoming sessions
- `PUT /{id}/reschedule` - Request reschedule (participants)
- `PUT /{id}/cancel` - Cancel session (participants)
- `POST /{id}/start` - Mark session started (mentor)
- `POST /{id}/complete` - Mark session completed (mentor)

### Payments (`/api/payments`)

- `POST /` - Process payment (user)
- `GET /{id}` - Get payment details
- `POST /{id}/refund` - Request refund (admin)
- `GET /history` - Get payment history

### Reviews (`/api/reviews`)

- `POST /` - Submit review (mentee, post-session)
- `GET /session/{sessionId}` - Get session review
- `PUT /{id}` - Update review (self, within 7 days)
- `DELETE /{id}` - Hide review (admin)

### Chat (`/api/chat`)

- `POST /messages` - Send message (participants)
- `GET /session/{sessionId}/messages` - Get chat history
- `PUT /messages/{id}/read` - Mark as read

### Disputes (`/api/disputes`)

- `POST /` - File dispute (session participants)
- `GET /{id}` - Get dispute details
- `PUT /{id}/resolve` - Resolve dispute (admin)

### Admin (`/api/admin`)

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
GET /api/mentors?page=1&pageSize=20&sortBy=rating&sortOrder=desc
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
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 409: Conflict
- 429: Too Many Requests
- 500: Internal Server Error
