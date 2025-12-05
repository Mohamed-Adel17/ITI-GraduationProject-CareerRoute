import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment.development';
import {
  Session,
  SessionSummary,
  PastSessionItem,
  SessionDetailResponse,
  BookSessionRequest,
  BookSessionResponse,
  RescheduleRequest,
  RescheduleResponse,
  ApproveRescheduleResponse,
  RejectRescheduleResponse,
  RescheduleDetails,
  CancelRequest,
  CancelResponse,
  JoinSessionResponse,
  CompleteSessionResponse,
  SessionRecordingResponse,
  SessionTranscriptResponse,
  SessionSummaryResponse,
  AIPreparationResponse,
  UpcomingSessionsResponse,
  PastSessionsResponse
} from '../../shared/models/session.model';
import { ApiResponse, unwrapResponse } from '../../shared/models/api-response.model';

/**
 * SessionService
 *
 * Service for managing mentorship session operations in the Career Route application.
 * Handles session booking, scheduling, lifecycle management, and all session-related API calls.
 *
 * Features:
 * - Book new sessions (POST /api/sessions)
 * - Get session details (GET /api/sessions/{id})
 * - Get upcoming sessions (GET /api/sessions/upcoming)
 * - Get past sessions (GET /api/sessions/past)
 * - Reschedule sessions (PATCH /api/sessions/{id}/reschedule)
 * - Cancel sessions (PATCH /api/sessions/{id}/cancel)
 * - Join sessions (POST /api/sessions/{id}/join)
 * - Complete sessions (PATCH /api/sessions/{id}/complete)
 * - Token management handled by authInterceptor
 * - Error handling done globally by errorInterceptor
 *
 * Business Rules:
 * - Sessions use TimeSlot-based booking (timeSlotId required)
 * - Session price, duration, and schedule derived from TimeSlot
 * - Minimum advance booking: 24 hours
 * - Reschedule requires >24h notice and mentor approval
 * - Cancellation refund policy: >48h = 100%, 24-48h = 50%, <24h = 0%
 * - Payment required to confirm session (status changes from Pending to Confirmed)
 * - Platform commission: 15%
 *
 * @remarks
 * - All endpoints require authentication (Bearer token)
 * - Based on Session-Payment-Endpoints.md contract
 * - Error handling is done globally by errorInterceptor
 * - Components only need to handle success cases
 *
 * @example
 * ```typescript
 * // Book a new session
 * const request: BookSessionRequest = {
 *   timeSlotId: 'ts_123',
 *   topic: 'System Design Interview Preparation',
 *   notes: 'Focusing on distributed systems'
 * };
 * this.sessionService.bookSession(request).subscribe({
 *   next: (session) => {
 *     console.log('Session booked:', session.id);
 *     console.log('Status:', session.status); // "Pending"
 *     // Next step: Create payment intent
 *   }
 * });
 *
 * // Get upcoming sessions
 * this.sessionService.getUpcomingSessions(1, 10).subscribe({
 *   next: (response) => {
 *     this.sessions = response.sessions;
 *     this.pagination = response.pagination;
 *   }
 * });
 *
 * // Reschedule a session
 * const reschedule: RescheduleRequest = {
 *   newScheduledStartTime: '2025-11-16T15:00:00Z',
 *   reason: 'Conflict with another meeting'
 * };
 * this.sessionService.rescheduleSession(sessionId, reschedule).subscribe({
 *   next: (response) => {
 *     this.notificationService.success('Reschedule request sent!', 'Success');
 *   }
 * });
 *
 * // Cancel a session
 * const cancel: CancelRequest = {
 *   reason: 'Emergency came up, unable to attend'
 * };
 * this.sessionService.cancelSession(sessionId, cancel).subscribe({
 *   next: (response) => {
 *     console.log('Refund amount:', response.refundAmount);
 *     console.log('Refund percentage:', response.refundPercentage);
 *   }
 * });
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private readonly http = inject(HttpClient);

  // API endpoints
  private readonly API_URL = environment.apiUrl;
  private readonly SESSIONS_URL = `${this.API_URL}/sessions`;

  // ==================== Session Booking ====================

  /**
   * Book a new mentorship session
   *
   * @param request - Booking request with timeSlotId, topic, and notes
   * @returns Observable of BookSessionResponse (status = Pending)
   *
   * @remarks
   * - Endpoint: POST /api/sessions
   * - Requires authentication (User/mentee role)
   * - TimeSlot must be available (isBooked = false)
   * - Session details derived from TimeSlot (mentor, duration, time, price)
   * - Session created with status "Pending" (awaiting payment)
   * - Next step: Create payment intent via PaymentService
   * - Returns 400 if validation fails
   * - Returns 404 if timeSlot not found
   * - Returns 409 if timeSlot already booked or schedule conflict
   *
   * @example
   * ```typescript
   * const request: BookSessionRequest = {
   *   timeSlotId: 'ts_123',
   *   topic: 'System Design Interview',
   *   notes: 'Focus on scalability'
   * };
   * this.sessionService.bookSession(request).subscribe({
   *   next: (session) => {
   *     console.log('Session ID:', session.id);
   *     console.log('Price:', session.price);
   *     // Create payment intent with session.id
   *   }
   * });
   * ```
   */
  bookSession(request: BookSessionRequest): Observable<BookSessionResponse> {
    return this.http
      .post<ApiResponse<BookSessionResponse>>(this.SESSIONS_URL, request)
      .pipe(map(response => unwrapResponse(response)));
  }

  // ==================== Get Session Details ====================

  /**
   * Get detailed session information by ID
   *
   * @returns Observable of SessionDetailResponse
   *
   * @remarks
   * - Endpoint: GET /api/sessions/{id}
   * - Requires authentication
   * - User must be session participant (mentee or mentor) or admin
   * - Returns canReschedule and canCancel flags
   * - Includes video conference link if session is Confirmed
   * - Returns 401 if not authenticated
   * - Returns 403 if not authorized to view session
   * - Returns 404 if session not found
   *
   * @example
   * ```typescript
   * this.sessionService.getSessionById(sessionId).subscribe({
   *   next: (session) => {
   *     console.log('Status:', session.status);
   *     console.log('Can reschedule:', session.canReschedule);
   *     console.log('Video link:', session.videoConferenceLink);
   *   }
   * });
   * ```
   */
  getSessionById(sessionId: string): Observable<SessionDetailResponse> {
    return this.http
      .get<ApiResponse<SessionDetailResponse>>(`${this.SESSIONS_URL}/${sessionId}`)
      .pipe(map(response => unwrapResponse(response)));
  }

  // ==================== Get Upcoming Sessions ====================

  /**
   * Get upcoming sessions for current user (mentee or mentor)
   *
   * @param page - Page number (default: 1)
   * @param pageSize - Items per page (default: 10, max: 50)
   * @returns Observable of UpcomingSessionsResponse with pagination
   *
   * @remarks
   * - Endpoint: GET /api/sessions/upcoming
   * - Requires authentication
   * - Returns sessions where user is mentee or mentor
   * - Filters by status: Confirmed, Pending (excludes Completed, Cancelled)
   * - Filters by scheduledStartTime >= current time
   * - Ordered by scheduledStartTime ASC (soonest first)
   * - Includes hoursUntilSession for countdown
   * - Returns 401 if not authenticated
   * - Returns 404 if no upcoming sessions
   *
   * @example
   * ```typescript
   * this.sessionService.getUpcomingSessions(1, 10).subscribe({
   *   next: (response) => {
   *     this.sessions = response.sessions;
   *     console.log('Total sessions:', response.pagination.totalCount);
   *     console.log('Has next page:', response.pagination.hasNextPage);
   *   }
   * });
   * ```
   */
  getUpcomingSessions(page: number = 1, pageSize: number = 10): Observable<UpcomingSessionsResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    return this.http
      .get<ApiResponse<UpcomingSessionsResponse>>(`${this.SESSIONS_URL}/upcoming`, { params })
      .pipe(map(response => unwrapResponse(response)));
  }

  // ==================== Get Past Sessions ====================

  /**
   * Get past sessions for current user (mentee or mentor)
   *
   * @param page - Page number (default: 1)
   * @param pageSize - Items per page (default: 10, max: 50)
   * @returns Observable of PastSessionsResponse with pagination
   *
   * @remarks
   * - Endpoint: GET /api/sessions/past
   * - Requires authentication
   * - Returns sessions where user is mentee or mentor
   * - Filters by status: Completed, Cancelled
   * - Ordered by scheduledStartTime DESC (most recent first)
   * - Includes hasReview flag
   * - Returns 401 if not authenticated
   * - Returns 404 if no past sessions
   *
   * @example
   * ```typescript
   * this.sessionService.getPastSessions(1, 10).subscribe({
   *   next: (response) => {
   *     this.pastSessions = response.sessions;
   *     response.sessions.forEach(session => {
   *       console.log('Has review:', session.hasReview);
   *     });
   *   }
   * });
   * ```
   */
  getPastSessions(page: number = 1, pageSize: number = 10): Observable<PastSessionsResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    return this.http
      .get<ApiResponse<PastSessionsResponse>>(`${this.SESSIONS_URL}/past`, { params })
      .pipe(map(response => unwrapResponse(response)));
  }

  // ==================== Reschedule Session ====================

  /**
   * Request to reschedule a session
   *
   * @param request - Reschedule request with new time and reason
   * @returns Observable of RescheduleResponse
   *
   * @remarks
   * - Endpoint: PATCH /api/sessions/{id}/reschedule
   * - Requires authentication (mentee or mentor)
   * - Must be requested >24 hours before original scheduledStartTime
   * - New time must be >24 hours in the future
   * - Requires mentor approval (other party must approve)
   * - Session status changes to "PendingReschedule"
   * - Other party has 48 hours to approve
   * - Returns 400 if validation fails
   * - Returns 403 if not authorized
   * - Returns 404 if session not found
   * - Returns 409 if <24h before session
   *
   * @example
   * ```typescript
   * const request: RescheduleRequest = {
   *   newScheduledStartTime: '2025-11-16T15:00:00Z',
   *   reason: 'Conflict with another meeting, requesting alternative time'
   * };
   * this.sessionService.rescheduleSession(sessionId, request).subscribe({
   *   next: (response) => {
   *     console.log('Status:', response.status); // "PendingReschedule"
   *     console.log('Requested by:', response.requestedBy);
   *     this.notificationService.success('Reschedule request sent!', 'Success');
   *   }
   * });
   * ```
   */
  rescheduleSession(sessionId: string, request: RescheduleRequest): Observable<RescheduleResponse> {
    return this.http
      .patch<ApiResponse<RescheduleResponse>>(`${this.SESSIONS_URL}/${sessionId}/reschedule`, request)
      .pipe(map(response => unwrapResponse(response)));
  }

  // ==================== Get Reschedule Details ====================

  /**
   * Get reschedule request details
   * @param rescheduleId - Reschedule request GUID
   */
  getRescheduleDetails(rescheduleId: string): Observable<RescheduleDetails> {
    return this.http
      .get<ApiResponse<RescheduleDetails>>(`${this.SESSIONS_URL}/reschedule/${rescheduleId}`)
      .pipe(map(response => unwrapResponse(response)));
  }

  /**
  }

  // ==================== Approve Reschedule Request ====================

  /**
   * Approve a reschedule request
   *
   * @param rescheduleId - Reschedule request GUID
   * @returns Observable of ApproveRescheduleResponse
   *
   * @remarks
   * - Endpoint: POST /api/sessions/reschedule/{rescheduleId}/approve
   * - Requires authentication (mentee, mentor, or admin)
   * - User must be authorized to approve (participant or admin)
   * - Updates session scheduled start time to requested time
   * - Updates reschedule request status to Approved
   * - Notifies other participant
   * - Returns 401 if not authenticated
   * - Returns 403 if not authorized
   * - Returns 404 if reschedule request not found
   * - Returns 409 if already processed
   *
   * @example
   * ```typescript
   * this.sessionService.approveReschedule(rescheduleId).subscribe({
   *   next: (response) => {
   *     console.log('Session updated:', response.id);
   *     console.log('New time:', response.requestedStartTime);
   *     console.log('Approved:', response.isApproved);
   *     this.notificationService.success('Reschedule approved!', 'Success');
   *   }
   * });
   * ```
   */
  approveReschedule(rescheduleId: string): Observable<ApproveRescheduleResponse> {
    return this.http
      .post<ApiResponse<ApproveRescheduleResponse>>(`${this.SESSIONS_URL}/reschedule/${rescheduleId}/approve`, {})
      .pipe(map(response => unwrapResponse(response)));
  }

  // ==================== Reject Reschedule Request ====================

  /**
   * Reject a reschedule request
   *
   * @param rescheduleId - Reschedule request GUID
   * @returns Observable of RejectRescheduleResponse
   *
   * @remarks
   * - Endpoint: POST /api/sessions/reschedule/{rescheduleId}/reject
   * - Requires authentication (mentee, mentor, or admin)
   * - User must be authorized to reject (participant or admin)
   * - Updates reschedule request status to Rejected
   * - Session remains at original time
   * - Notifies other participant
   * - Returns 401 if not authenticated
   * - Returns 403 if not authorized
   * - Returns 404 if reschedule request not found
   * - Returns 409 if already processed
   *
   * @example
   * ```typescript
   * this.sessionService.rejectReschedule(rescheduleId).subscribe({
   *   next: (response) => {
   *     console.log('Session unchanged:', response.id);
   *     console.log('Original time:', response.originalStartTime);
   *     console.log('Rejected:', !response.isApproved);
   *     this.notificationService.info('Reschedule rejected', 'Info');
   *   }
   * });
   * ```
   */
  rejectReschedule(rescheduleId: string): Observable<RejectRescheduleResponse> {
    return this.http
      .post<ApiResponse<RejectRescheduleResponse>>(`${this.SESSIONS_URL}/reschedule/${rescheduleId}/reject`, {})
      .pipe(map(response => unwrapResponse(response)));
  }

  // ==================== Cancel Session ====================

  /**
   * Cancel a session with refund processing
   *
   * @param request - Cancellation request with reason
   * @returns Observable of CancelResponse with refund information
   *
   * @remarks
   * - Endpoint: PATCH /api/sessions/{id}/cancel
   * - Requires authentication (mentee, mentor, or admin)
   * - Refund policy based on hours until session:
   *   - >48 hours: 100% refund
   *   - 24-48 hours: 50% refund
   *   - <24 hours: 0% refund (no refund)
   * - Session status changes to "Cancelled"
   * - TimeSlot is released (isBooked = false, sessionId = null)
   * - Refund processed via payment service
   * - Returns 400 if validation fails
   * - Returns 403 if not authorized
   * - Returns 404 if session not found
   * - Returns 409 if cannot cancel (e.g., already completed)
   *
   * @example
   * ```typescript
   * const request: CancelRequest = {
   *   reason: 'Emergency came up, unable to attend'
   * };
   * this.sessionService.cancelSession(sessionId, request).subscribe({
   *   next: (response) => {
   *     console.log('Refund amount:', response.refundAmount);
   *     console.log('Refund percentage:', response.refundPercentage);
   *     console.log('Status:', response.status); // "Cancelled"
   *     this.notificationService.success('Session cancelled', 'Success');
   *   }
   * });
   * ```
   */
  cancelSession(sessionId: string, request: CancelRequest): Observable<CancelResponse> {
    return this.http
      .patch<ApiResponse<CancelResponse>>(`${this.SESSIONS_URL}/${sessionId}/cancel`, request)
      .pipe(map(response => unwrapResponse(response)));
  }

  // ==================== Join Session ====================

  /**
   * Get video conference link to join session
   *
   * @returns Observable of JoinSessionResponse with video link
   *
   * @remarks
   * - Endpoint: POST /api/sessions/{id}/join
   * - Requires authentication (mentee or mentor)
   * - Session status must be "Confirmed"
   * - Can join 15 minutes before to 15 minutes after scheduledEndTime
   * - Marks attendance when participant joins
   * - Updates session status to "InProgress" when first participant joins
   * - Returns 403 if not authorized
   * - Returns 404 if session not found
   * - Returns 409 if too early (>15 min before start)
   * - Returns 410 if too late (>15 min after end)
   *
   * @example
   * ```typescript
   * this.sessionService.joinSession(sessionId).subscribe({
   *   next: (response) => {
   *     console.log('Video link:', response.videoConferenceLink);
   *     console.log('Can join now:', response.canJoinNow);
   *     console.log('Instructions:', response.instructions);
   *     // Open video link in new window
   *     window.open(response.videoConferenceLink, '_blank');
   *   }
   * });
   * ```
   */
  joinSession(sessionId: string): Observable<JoinSessionResponse> {
    return this.http
      .post<ApiResponse<JoinSessionResponse>>(`${this.SESSIONS_URL}/${sessionId}/join`, {})
      .pipe(map(response => unwrapResponse(response)));
  }

  // ==================== Complete Session ====================

  /**
   * Mark session as completed (Mentor or Admin only)
   *
   * @returns Observable of CompleteSessionResponse
   *
   * @remarks
   * - Endpoint: PATCH /api/sessions/{id}/complete
   * - Requires authentication (mentor or admin)
   * - Updates session status to "Completed"
   * - Sets completedAt timestamp
   * - Calculates actual duration
   * - Triggers 72-hour payment hold (released after 3 days if no disputes)
   * - Sends completion notification to mentee
   * - Triggers review request email to mentee after 24 hours
   * - Activates 3-day chat window between mentor and mentee
   * - Returns 403 if not authorized (must be mentor or admin)
   * - Returns 404 if session not found
   * - Returns 409 if already completed
   *
   * @example
   * ```typescript
   * this.sessionService.completeSession(sessionId).subscribe({
   *   next: (response) => {
   *     console.log('Status:', response.status); // "Completed"
   *     console.log('Actual duration:', response.actualDurationMinutes);
   *     console.log('Payment release date:', response.paymentReleaseDate);
   *     this.notificationService.success('Session marked as completed', 'Success');
   *   }
   * });
   * ```
   */
  completeSession(sessionId: string): Observable<CompleteSessionResponse> {
    return this.http
      .patch<ApiResponse<CompleteSessionResponse>>(`${this.SESSIONS_URL}/${sessionId}/complete`, {})
      .pipe(map(response => unwrapResponse(response)));
  }

  // ==================== Get Session Recording ====================

  /**
   * Get session recording with presigned URL
   *
   * @returns Observable of SessionRecordingResponse
   *
   * @remarks
   * - Endpoint: GET /api/sessions/{id}/recording
   * - Requires authentication (mentee or mentor)
   * - Returns presigned URL with 60-minute expiration
   * - Three possible states:
   *   - Available: Recording ready, recordingPlayUrl contains valid URL
   *   - Processing: Recording still being processed (Zoom webhook not received)
   *   - Failed: Recording processing failed
   * - Always returns 200 with status information
   * - Returns 401 if not authenticated
   * - Returns 403 if not authorized (not session participant)
   * - Returns 404 if session not found
   *
   * @example
   * ```typescript
   * this.sessionService.getSessionRecording(sessionId).subscribe({
   *   next: (response) => {
   *     if (response.isAvailable && response.status === 'Available') {
   *       // Play video using response.recordingPlayUrl
   *       console.log('Video URL:', response.recordingPlayUrl);
   *       console.log('Expires at:', response.expiresAt);
   *     } else if (response.status === 'Processing') {
   *       // Show loading state, poll again later
   *       console.log('Recording is still processing...');
   *     } else {
   *       // Show error message
   *       console.log('Recording failed or unavailable');
   *     }
   *   }
   * });
   * ```
   */
  getSessionRecording(sessionId: string): Observable<SessionRecordingResponse> {
    return this.http
      .get<ApiResponse<SessionRecordingResponse>>(`${this.SESSIONS_URL}/${sessionId}/recording`)
      .pipe(map(response => unwrapResponse(response)));
  }

  // ==================== Get Session Transcript ====================

  /**
   * Get AI-generated session transcript
   *
   * @returns Observable of SessionTranscriptResponse
   *
   * @remarks
   * - Endpoint: GET /api/sessions/{id}/transcript
   * - Requires authentication (mentee or mentor)
   * - Returns Deepgram-generated transcript with timestamps
   * - Transcript format: "[00:00] Speaker 0: Hello..."
   * - Returns 401 if not authenticated
   * - Returns 403 if not authorized (not session participant)
   * - Returns 404 if session not found or transcript not available
   *
   * @example
   * ```typescript
   * this.sessionService.getSessionTranscript(sessionId).subscribe({
   *   next: (response) => {
   *     if (response.isAvailable) {
   *       console.log('Transcript:', response.transcript);
   *       // Parse and display transcript with timestamps
   *     } else {
   *       console.log('Transcript not available yet');
   *     }
   *   }
   * });
   * ```
   */
  getSessionTranscript(sessionId: string): Observable<SessionTranscriptResponse> {
    return this.http
      .get<ApiResponse<SessionTranscriptResponse>>(`${this.SESSIONS_URL}/${sessionId}/transcript`)
      .pipe(map(response => unwrapResponse(response)));
  }

  // ==================== Get Session AI Summary ====================

  /**
   * Get AI-generated session summary
   *
   * @returns Observable of SessionSummaryResponse
   */
  getSessionSummary(sessionId: string): Observable<SessionSummaryResponse> {
    return this.http
      .get(`${this.SESSIONS_URL}/${sessionId}/summary`, { responseType: 'text' })
      .pipe(map(text => ({ sessionId, summary: text, isAvailable: !!text })));
  }

  // ==================== Generate AI Preparation Guide ====================

  /**
   * Generate AI preparation guide for a session (Mentor only)
   *
   * @param sessionId - Session GUID
   * @returns Observable of AIPreparationResponse
   *
   * @remarks
   * - Endpoint: POST /api/sessions/{id}/generate-preparation
   * - Requires authentication (mentor or admin)
   * - Only the session's mentor can generate their own preparation
   * - Returns cached guide if already generated (wasAlreadyGenerated = true)
   * - Guide is markdown-formatted with:
   *   - Key talking points based on topic
   *   - Suggested questions to ask the mentee
   *   - Topics/resources to review beforehand
   *   - Potential challenges the mentee might face
   *   - Suggested session structure
   * - Returns 400 if session is Completed, Cancelled, or NoShow
   * - Returns 403 if user is not the session's mentor
   * - Returns 404 if session not found
   *
   * @example
   * ```typescript
   * this.sessionService.generatePreparation(sessionId).subscribe({
   *   next: (response) => {
   *     console.log('Guide:', response.preparationGuide);
   *     console.log('Was cached:', response.wasAlreadyGenerated);
   *   }
   * });
   * ```
   */
  generatePreparation(sessionId: string): Observable<AIPreparationResponse> {
    return this.http
      .post<ApiResponse<AIPreparationResponse>>(`${this.SESSIONS_URL}/${sessionId}/generate-preparation`, {})
      .pipe(map(response => unwrapResponse(response)));
  }

  // ==================== Helper Methods ====================

  /**
   * Check if a session can be rescheduled
   * Business rule: Must be >24h before scheduled start time
   *
   * @param scheduledStartTime - ISO 8601 datetime string
   * @returns True if reschedule is allowed
   */
  canReschedule(scheduledStartTime: string): boolean {
    const now = new Date();
    const startTime = new Date(scheduledStartTime);
    const hoursUntil = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntil > 24;
  }

  /**
   * Check if a session can be cancelled
   * Business rule: Session must be Confirmed or Pending
   *
   * @param status - Current session status
   * @returns True if cancellation is allowed
   */
  canCancel(status: string): boolean {
    return status === 'Confirmed' || status === 'Pending' || status === 'PendingReschedule';
  }

  /**
   * Calculate refund amount based on hours until session
   * Refund policy: >48h = 100%, 24-48h = 50%, <24h = 0%
   *
   * @param price - Session price
   * @param hoursUntilSession - Hours until scheduled start
   * @returns Object with refund amount and percentage
   */
  calculateRefund(price: number, hoursUntilSession: number): { amount: number; percentage: number } {
    if (hoursUntilSession > 48) {
      return { amount: price, percentage: 100 };
    } else if (hoursUntilSession >= 24) {
      return { amount: price * 0.5, percentage: 50 };
    } else {
      return { amount: 0, percentage: 0 };
    }
  }

  /**
   * Check if a session can be joined (within 15-minute window)
   * Business rule: Can join 15 min before to 15 min after end time
   *
   * @param scheduledStartTime - ISO 8601 datetime string
   * @param scheduledEndTime - ISO 8601 datetime string
   * @returns True if session can be joined now
   */
  canJoin(scheduledStartTime: string, scheduledEndTime: string): boolean {
    const now = new Date();
    const startTime = new Date(scheduledStartTime);
    const endTime = new Date(scheduledEndTime);

    const minutesUntilStart = (startTime.getTime() - now.getTime()) / (1000 * 60);
    const minutesSinceEnd = (now.getTime() - endTime.getTime()) / (1000 * 60);

    // Can join 15 minutes before start and up to 15 minutes after end
    return minutesUntilStart <= 15 && minutesSinceEnd <= 15;
  }

  // ==================== Test/Demo Endpoints ====================

  /**
   * Seed a test session for demo purposes (bypasses 24-hour rule)
   * Creates a TimeSlot and Session with Pending status ready for payment.
   *
   * @param mentorId - Mentor ID
   * @param menteeId - Mentee ID
   * @param offsetMinutes - Minutes from now for session start (default: 2)
   * @param durationMinutes - Session duration: 30 or 60 (default: 60)
   * @returns Observable with seeded session details
   */
  seedTestSession(
    mentorId: string,
    menteeId: string,
    offsetMinutes: number = 2,
    durationMinutes: number = 60,
    topic?: string,
    notes?: string
  ): Observable<any> {
    let params = new HttpParams()
      .set('mentorId', mentorId)
      .set('menteeId', menteeId)
      .set('offsetMinutes', offsetMinutes.toString())
      .set('durationMinutes', durationMinutes.toString());

    if (topic) params = params.set('topic', topic);
    if (notes) params = params.set('notes', notes);

    return this.http.post<any>(`${this.API_URL}/test/zoom/seed-session-pending-payment`, null, { params });
  }

  /**
   * End a Zoom meeting for testing purposes.
   * Marks session as Completed and ends the Zoom meeting.
   *
   * @param sessionId - Session ID to end
   * @returns Observable with result
   */
  endMeetingTest(sessionId: string): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/test/zoom/end-meeting/${sessionId}`, null);
  }
}
