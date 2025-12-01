# Frontend Reschedule Page Requirements

## Overview
When a mentor or mentee requests to reschedule a session, an email is sent to the other party with a link to review and respond to the request.

## Email Link Format
```
{FrontendUrl}/sessions/reschedule/{rescheduleId}
Example: http://localhost:4200/sessions/reschedule/abc-123-def-456
```

## Frontend Page: `/sessions/reschedule/:rescheduleId`

### Page Flow

1. **User clicks email link** → Opens frontend page
2. **Frontend fetches reschedule details** (see API below)
3. **Display reschedule information:**
   - Session details (topic, original time, requested new time)
   - Requester name (who requested the reschedule)
   - Reason for reschedule
   - Mentor and mentee information
4. **Show two action buttons:**
   - ✅ Approve Button (green)
   - ❌ Reject Button (red)
5. **User clicks button** → Frontend calls API with auth token
6. **Show success/error message**

### Required API Calls

#### 1. Get Reschedule Details (if needed - optional)
```http
GET /api/sessions/{sessionId}
Authorization: Bearer {token}
```
Returns session details including reschedule information.

#### 2. Approve Reschedule
```http
POST /api/sessions/reschedule/{rescheduleId}/approve
Authorization: Bearer {token}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Reschedule request approved successfully. Session has been updated.",
  "data": {
    "id": "reschedule-id",
    "sessionId": "session-id",
    "status": "Approved",
    "originalStartTime": "2025-11-15T14:00:00Z",
    "newScheduledStartTime": "2025-11-16T15:00:00Z",
    "requestedBy": "Mentor",
    "requestedAt": "2025-11-09T12:00:00Z"
  }
}
```

**Error Responses:**
- 401: User not authenticated
- 403: User not authorized (not a participant)
- 404: Reschedule request not found
- 409: Already processed

#### 3. Reject Reschedule
```http
POST /api/sessions/reschedule/{rescheduleId}/reject
Authorization: Bearer {token}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Reschedule request rejected successfully. Session remains at original time.",
  "data": {
    "id": "reschedule-id",
    "sessionId": "session-id",
    "status": "Rejected",
    "originalStartTime": "2025-11-15T14:00:00Z",
    "newScheduledStartTime": "2025-11-16T15:00:00Z",
    "requestedBy": "Mentor",
    "requestedAt": "2025-11-09T12:00:00Z"
  }
}
```

### UI/UX Requirements

#### Page Layout
```
┌─────────────────────────────────────────┐
│  Session Reschedule Request             │
├─────────────────────────────────────────┤
│                                         │
│  📅 Session Details                     │
│  Topic: System Design Interview         │
│  Duration: 60 minutes                   │
│                                         │
│  👤 Requested by: Sarah Johnson (Mentor)│
│  Reason: Conflict with another meeting  │
│                                         │
│  ⏰ Original Time:                      │
│  November 15, 2025 at 2:00 PM          │
│                                         │
│  ⏰ Requested New Time:                 │
│  November 16, 2025 at 3:00 PM          │
│                                         │
│  ┌──────────┐  ┌──────────┐           │
│  │ ✅ Approve│  │ ❌ Reject │           │
│  └──────────┘  └──────────┘           │
│                                         │
└─────────────────────────────────────────┘
```

#### Confirmation Dialog
Before calling API, show confirmation:
- **Approve:** "Are you sure you want to approve this reschedule? The session will be moved to {new time}."
- **Reject:** "Are you sure you want to reject this reschedule? The session will remain at {original time}."

#### Success Messages
- **Approve:** "✅ Reschedule approved! The session has been updated to {new time}."
- **Reject:** "Session will remain at the original time {original time}."

#### Error Handling
- **401/403:** Redirect to login page
- **404:** "This reschedule request was not found or has expired."
- **409:** "This reschedule request has already been processed."
- **Network error:** "Unable to process request. Please try again."

### Authentication Requirements
- User must be logged in
- JWT token must be included in API calls
- If not logged in, redirect to login page with return URL

### Route Guard
```typescript
// Angular example
canActivate: [AuthGuard]
```

### Component Structure (Angular Example)
```typescript
@Component({
  selector: 'app-reschedule-review',
  templateUrl: './reschedule-review.component.html'
})
export class RescheduleReviewComponent implements OnInit {
  rescheduleId: string;
  session: SessionDetails;
  loading = false;

  ngOnInit() {
    this.rescheduleId = this.route.snapshot.params['rescheduleId'];
    this.loadSessionDetails();
  }

  async approve() {
    const confirmed = await this.confirmDialog('Approve reschedule?');
    if (!confirmed) return;

    this.loading = true;
    try {
      await this.sessionService.approveReschedule(this.rescheduleId);
      this.showSuccess('Reschedule approved!');
      this.router.navigate(['/sessions']);
    } catch (error) {
      this.handleError(error);
    } finally {
      this.loading = false;
    }
  }

  async reject() {
    const confirmed = await this.confirmDialog('Reject reschedule?');
    if (!confirmed) return;

    this.loading = true;
    try {
      await this.sessionService.rejectReschedule(this.rescheduleId);
      this.showSuccess('Reschedule rejected!');
      this.router.navigate(['/sessions']);
    } catch (error) {
      this.handleError(error);
    } finally {
      this.loading = false;
    }
  }
}
```

### Testing Checklist
- [ ] Email link opens correct frontend page
- [ ] Page loads session details correctly
- [ ] Approve button calls correct API endpoint
- [ ] Reject button calls correct API endpoint
- [ ] Success messages display correctly
- [ ] Error messages display correctly
- [ ] Unauthorized users redirected to login
- [ ] Already processed requests show appropriate message
- [ ] Loading states work correctly
- [ ] Confirmation dialogs work correctly

### Notes
- The reschedule ID is passed in the URL, not the session ID
- User must be authenticated to approve/reject
- Backend validates that user is a participant in the session
- After 48 hours, pending reschedules are automatically rejected by background job
