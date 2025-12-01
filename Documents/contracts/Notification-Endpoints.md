# Notification Endpoints API Contract

**Frontend Framework:** Angular 20.3.0  
**Expected Backend:** ASP.NET Core 8.0 Web API  
**Base URL:** `http://localhost:5000/api`

---

## Overview

The Notification system provides REST API endpoints for managing user notifications and a SignalR hub for real-time notification delivery. Users receive notifications for various platform events such as session bookings, cancellations, reschedule requests, payment completions, and session reminders.

**Key Features:**
- Paginated notification retrieval
- Unread count tracking
- Mark as read (single or all)
- Real-time delivery via SignalR

---

## Related Documentation

- **📖 API Endpoints Index**: See [API-Endpoints-Index.md](./API-Endpoints-Index.md) for complete endpoint directory and cross-references
- **Authentication**: See [Authentication-Endpoints.md](./Authentication-Endpoints.md) for JWT token management
- **Sessions**: See [Session-Payment-Endpoints.md](./Session-Payment-Endpoints.md) for session events that trigger notifications

**All Endpoints:** Require authentication (JWT Bearer token)

---

## 1. Get Notifications

**Endpoint:** `GET /api/notifications`  
**Authentication:** Required (Any authenticated user)

Retrieves a paginated list of notifications for the authenticated user, sorted by creation date descending (newest first).

**Query Parameters:**
| Parameter | Type | Default | Constraints | Description |
|-----------|------|---------|-------------|-------------|
| `page` | integer | 1 | Min: 1 | Page number (1-based) |
| `pageSize` | integer | 10 | Min: 1, Max: 50 | Items per page |

**Example Request:**
```
GET /api/notifications?page=1&pageSize=10
Authorization: Bearer {access-token}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Notifications retrieved successfully",
  "data": {
    "items": [
      {
        "id": "123",
        "type": "SessionBooked",
        "title": "New Session Booked",
        "message": "John Doe has booked a session with you for January 20, 2025 at 10:00 AM",
        "isRead": false,
        "createdAt": "2025-01-15T14:30:00Z",
        "actionUrl": "/sessions/456"
      },
      {
        "id": "122",
        "type": "PaymentCompleted",
        "title": "Payment Received",
        "message": "Payment of $50.00 has been completed for your session",
        "isRead": true,
        "createdAt": "2025-01-14T10:00:00Z",
        "actionUrl": "/payments/history"
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
  },
  "statusCode": 200
}
```

**Error Response (40 Unauthorized):**
```json
{
  "success": false,
  "message": "Access Denied",
  "statusCode": 403
}
```

**Backend Behavior:**
- Return only notifications belonging to the authenticated user
- Sort by `createdAt` descending (newest first)
- Validate and constrain pagination: `page = Math.Max(1, page)`, `pageSize = Math.Clamp(pageSize, 1, 50)`
- Return empty `items` array if no notifications exist

---

## 2. Get Unread Count

**Endpoint:** `GET /api/notifications/unread-count`  
**Authentication:** Required (Any authenticated user)

Gets the count of unread notifications for the authenticated user.

**Example Request:**
```
GET /api/notifications/unread-count
Authorization: Bearer {access-token}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Unread count retrieved successfully",
  "data": {
    "unreadCount": 5
  },
  "statusCode": 200
}
```

**Error Response (403 Forbidden):**
```json
{
  "success": false,
  "message": "Access Denied",
}
```

**Backend Behavior:**
- Count notifications where `userId` matches authenticated user AND `isRead = false`
- Return `0` if no unread notifications

---

## 3. Mark Notification as Read

**Endpoint:** `PUT /api/notifications/{id}/read`  
**Authentication:** Required (Any authenticated user)

Marks a specific notification as read. Users can only mark their own notifications.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Notification ID |

**Example Request:**
```
PUT /api/notifications/123/read
Authorization: Bearer {access-token}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Notification marked as read",
  "statusCode": 200
}
```

**Error Response (403 Forbidden):**
```json
{
  "success": false,
  "message": "Access Denied",
}
```


**Error Response (404 Not Found):**
```json
{
  "success": false,
  "message": "Notification not found",
  "statusCode": 404
}
```

**Backend Behavior:**
- Find notification by ID
- Verify notification belongs to authenticated user (return 403 if not)
- Return 404 if notification doesn't exist
- Set `isRead = true`
- No-op if already read (still return 200)

---

## 4. Mark All Notifications as Read

**Endpoint:** `PUT /api/notifications/read-all`  
**Authentication:** Required (Any authenticated user)

Marks all notifications as read for the authenticated user.

**Example Request:**
```
PUT /api/notifications/read-all
Authorization: Bearer {access-token}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "All notifications marked as read",
  "statusCode": 200
}
```

**Error Response (403 Forbidden):**
```json
{
  "success": false,
  "message": "Access Denied",
  "statusCode": 401
}
```

**Backend Behavior:**
- Update all notifications where `userId` matches authenticated user
- Set `isRead = true` for all matching notifications
- No-op if no unread notifications (still return 200)

---

## Notification Model Structure (NotificationDto)

```csharp
public class NotificationDto
{
    public string Id { get; set; }
    public NotificationType Type { get; set; }
    public string Title { get; set; }        // Max 200 chars
    public string Message { get; set; }      // Max 1000 chars
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }  // UTC
    public string? ActionUrl { get; set; }   // Max 500 chars, nullable
}
```

**JSON Representation:**
```json
{
  "id": 123,
  "type": "SessionBooked",
  "title": "New Session Booked",
  "message": "John Doe has booked a session with you",
  "isRead": false,
  "createdAt": "2025-01-15T14:30:00Z",
  "actionUrl": "/sessions/456"
}
```

**Notes:**
- `id` is an integer (auto-generated)
- `type` is serialized as string (enum name)
- `createdAt` is ISO 8601 format (UTC)
- `actionUrl` is nullable - may be `null` in response

---

## Notification List Response Model (NotificationListResponseDto)

```csharp
public class NotificationListResponseDto
{
    public List<NotificationDto> Items { get; set; }
    public PaginationMetadataDto Pagination { get; set; }
}
```

**JSON Representation:**
```json
{
  "items": [ /* NotificationDto[] */ ],
  "pagination": {
    "totalCount": 25,
    "currentPage": 1,
    "pageSize": 10,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

---

## Unread Count Response Model (UnreadCountResponseDto)

```csharp
public class UnreadCountResponseDto
{
    public int UnreadCount { get; set; }
}
```

**JSON Representation:**
```json
{
  "unreadCount": 5
}
```

---

## Pagination Metadata Model (PaginationMetadataDto)

```csharp
public class PaginationMetadataDto
{
    public int TotalCount { get; set; }
    public int CurrentPage { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
    public bool HasNextPage { get; set; }
    public bool HasPreviousPage { get; set; }
}
```

---

## NotificationType Enum

```csharp
public enum NotificationType
{
    SessionBooked,
    SessionCancelled,
    RescheduleRequested,
    RescheduleApproved,
    RescheduleRejected,
    PaymentCompleted,
    SessionReminder,
    MentorApplicationApproved,
    MentorApplicationRejected
}
```

**Serialization:** Enums are serialized as **strings** (not integers).

| Value | Description | Typical ActionUrl |
|-------|-------------|-------------------|
| `SessionBooked` | New session booked | `/sessions/{sessionId}` |
| `SessionCancelled` | Session cancelled | `/sessions` |
| `RescheduleRequested` | Reschedule request received | `/sessions/{sessionId}` |
| `RescheduleApproved` | Reschedule approved | `/sessions/{sessionId}` |
| `RescheduleRejected` | Reschedule rejected | `/sessions/{sessionId}` |
| `PaymentCompleted` | Payment successful | `/payments/history` |
| `SessionReminder` | Session starting soon | `/sessions/{sessionId}/join` |
| `MentorApplicationApproved` | Mentor application approved | `/mentor/profile` |
| `MentorApplicationRejected` | Mentor application rejected | `/mentor/apply` |

---

## 🔔 Real-Time Notifications (SignalR)

### Hub Endpoint

- Development: `ws://localhost:5000/hubs/notifications`
- Production: `wss://api.careerroute.com/hubs/notifications`

### Authentication

Connect with JWT token using query string:
```
?access_token={jwt_token}
```

### Hub Class

```csharp
[Authorize]
public class NotificationHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!string.IsNullOrEmpty(userId))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
        }
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!string.IsNullOrEmpty(userId))
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user_{userId}");
        }
        await base.OnDisconnectedAsync(exception);
    }
}
```

### Connection Lifecycle

1. Client connects with JWT token
2. User automatically added to group `user_{userId}`
3. All notifications for that user are pushed to this group
4. On disconnect, user is removed from the group

### Server → Client Events

#### `ReceiveNotification`

Triggered when a new notification is created for the user.

**Payload:** `NotificationDto`
```json
{
  "id": 124,
  "type": "SessionReminder",
  "title": "Session Starting Soon",
  "message": "Your session with Jane Smith starts in 15 minutes",
  "isRead": false,
  "createdAt": "2025-01-20T09:45:00Z",
  "actionUrl": "/sessions/456/join"
}
```

### Sending Notifications (Backend)

To send a notification to a specific user:
```csharp
await _hubContext.Clients.Group($"user_{userId}")
    .SendAsync("ReceiveNotification", notificationDto);
```

---

## Sample API Requests

**Get Notifications:**
```bash
GET http://localhost:5000/api/notifications?page=1&pageSize=10
Authorization: Bearer {access-token}
```

**Get Unread Count:**
```bash
GET http://localhost:5000/api/notifications/unread-count
Authorization: Bearer {access-token}
```

**Mark Single Notification as Read:**
```bash
PUT http://localhost:5000/api/notifications/123/read
Authorization: Bearer {access-token}
```

**Mark All Notifications as Read:**
```bash
PUT http://localhost:5000/api/notifications/read-all
Authorization: Bearer {access-token}
```

---
