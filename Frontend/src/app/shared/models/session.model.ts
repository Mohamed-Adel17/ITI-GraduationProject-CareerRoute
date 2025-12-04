/**
 * Session Models
 *
 * This file contains TypeScript interfaces and enums for session management,
 * including booking, scheduling, and session lifecycle operations.
 *
 * Based on: Session-Payment-Endpoints.md
 */

// ===========================
// Enums
// ===========================

/**
 * Session Status Enum
 * Represents the lifecycle state of a mentorship session
 */
export enum SessionStatus {
  Pending = 'Pending',                     // Created, awaiting payment
  Confirmed = 'Confirmed',                 // Payment captured, session scheduled
  InProgress = 'InProgress',               // First participant joined
  Completed = 'Completed',                 // Session finished successfully
  Cancelled = 'Cancelled',                 // Cancelled by user or mentor
  NoShow = 'NoShow',                       // No participants showed up
  PendingReschedule = 'PendingReschedule'  // Reschedule requested, awaiting approval
}

/**
 * Session Type Enum
 * Type of mentorship session
 */
export enum SessionType {
  OneOnOne = 'OneOnOne',  // Individual mentorship session
  Group = 'Group'         // Group mentorship session
}

/**
 * Session Duration Enum
 * Fixed duration options for sessions
 */
export enum SessionDuration {
  ThirtyMinutes = 'ThirtyMinutes',   // 30-minute session
  SixtyMinutes = 'SixtyMinutes'      // 60-minute session
}

// ===========================
// Core Interfaces
// ===========================

/**
 * Session Interface
 * Complete session entity with all details
 * Based on SessionDto from backend
 */
export interface Session {
  id: string;                           // Session GUID
  menteeId: string;                     // Mentee user GUID
  menteeFirstName: string;              // Mentee first name
  menteeLastName: string;               // Mentee last name
  menteeProfilePictureUrl?: string | null;  // Mentee profile picture
  mentorId: string;                     // Mentor user GUID
  mentorFirstName: string;              // Mentor first name
  mentorLastName: string;               // Mentor last name
  mentorProfilePictureUrl?: string | null;  // Mentor profile picture
  timeSlotId?: string | null;           // Reference to TimeSlot
  sessionType: SessionType;             // OneOnOne or Group
  duration: SessionDuration;            // ThirtyMinutes or SixtyMinutes
  scheduledStartTime: string;           // ISO 8601 datetime
  scheduledEndTime: string;             // ISO 8601 datetime
  status: SessionStatus;                // Current session status
  videoConferenceLink?: string | null;  // Zoom/video link (available when Confirmed)
  topic?: string | null;                // Session topic (max 200 chars)
  notes?: string | null;                // Session notes (max 1000 chars)
  price: number;                        // Session price in USD/EGP
  paymentId?: string | null;            // Payment GUID (null until payment created)
  paymentStatus?: string | null;        // Payment status (Pending, Captured, etc.)
  cancellationReason?: string | null;
  rescheduleId?: string | null;       // Only populated when status is PendingReschedule
  rescheduleRequestedBy?: 'Mentor' | 'Mentee' | null; // Who requested the reschedule
  canReschedule?: boolean;              // True if reschedule allowed (>24h notice)
  canCancel?: boolean;                  // True if cancellation allowed
  hoursUntilSession?: number | null;    // Hours until session start (for countdown)
  createdAt: string;                    // ISO 8601 datetime
  updatedAt: string;                    // ISO 8601 datetime
  completedAt?: string | null;          // ISO 8601 datetime (when marked complete)
}

/**
 * Session Summary
 * Lightweight session info for lists
 */
export interface SessionSummary {
  id: string;
  menteeId: string;
  menteeFirstName: string;
  menteeLastName: string;
  menteeProfilePictureUrl?: string | null;
  mentorId: string;
  mentorFirstName: string;
  mentorLastName: string;
  mentorProfilePictureUrl?: string | null;
  sessionType: SessionType;
  duration: SessionDuration;
  scheduledStartTime: string;
  status: SessionStatus;
  topic?: string | null;
  price: number;
  videoConferenceLink?: string | null;
  hoursUntilSession?: number | null;
  createdAt?: string;                     // ISO 8601 datetime (for payment countdown)
}

/**
 * Past Session Item
 * Session information for past sessions list
 */
export interface PastSessionItem {
  id: string;
  menteeId: string;
  menteeFirstName: string;
  menteeLastName: string;
  menteeProfilePictureUrl?: string | null;
  mentorId: string;
  mentorFirstName: string;
  mentorLastName: string;
  mentorProfilePictureUrl?: string | null;
  sessionType: SessionType;
  duration: SessionDuration;
  scheduledStartTime: string;
  scheduledEndTime: string;
  status: SessionStatus;
  topic?: string | null;
  hasReview: boolean;                   // True if review exists for this session
  completedAt?: string | null;
  cancellationReason?: string | null;   // Reason for cancellation (if cancelled)
}

/**
 * Session Detail Response
 * Full session details with video link and status
 */
export interface SessionDetailResponse {
  id: string;
  menteeId: string;
  menteeFirstName: string;
  menteeLastName: string;
  menteeProfilePictureUrl?: string | null;
  mentorId: string;
  mentorFirstName: string;
  mentorLastName: string;
  mentorProfilePictureUrl?: string | null;
  sessionType: SessionType;
  duration: SessionDuration;
  scheduledStartTime: string;
  scheduledEndTime: string;
  status: SessionStatus;
  videoConferenceLink?: string | null;
  topic?: string | null;
  notes?: string | null;
  price: number;
  paymentId?: string | null;
  paymentStatus?: string | null;
  cancellationReason?: string | null;
  rescheduleId?: string | null;       // Only populated when status is PendingReschedule
  rescheduleRequestedBy?: 'Mentor' | 'Mentee' | null; // Who requested the reschedule
  canReschedule: boolean;
  canCancel: boolean;
  hoursUntilSession?: number | null;
  createdAt: string;
  updatedAt: string;
  // AI Preparation fields (mentor only)
  aiPreparationGuide?: string | null;         // Markdown-formatted AI guide
  aiPreparationGeneratedAt?: string | null;   // ISO 8601 datetime when generated
}

// ===========================
// Request/Response DTOs
// ===========================

/**
 * Book Session Request
 * Request body for POST /api/sessions
 */
export interface BookSessionRequest {
  timeSlotId: string;          // Required: TimeSlot ID
  topic?: string;              // Optional: Session topic (max 200 chars)
  notes?: string;              // Optional: Session notes (max 1000 chars)
}

/**
 * Book Session Response
 * Response after creating a new session
 */
export interface BookSessionResponse {
  id: string;
  menteeId: string;
  menteeFirstName: string;
  menteeLastName: string;
  mentorId: string;
  mentorFirstName: string;
  mentorLastName: string;
  timeSlotId?: string | null;
  sessionType: SessionType;
  duration: SessionDuration;
  scheduledStartTime: string;
  scheduledEndTime: string;
  status: SessionStatus;
  videoConferenceLink?: string | null;
  topic?: string | null;
  notes?: string | null;
  price: number;
  paymentId?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Reschedule Request
 * Request body for PATCH /api/sessions/{id}/reschedule
 */
export interface RescheduleRequest {
  newScheduledStartTime: string;  // ISO 8601 datetime, must be >24h from now
  newStartTime?: string; // Backend returns this instead of newScheduledStartTime
  reason: string;                 // Required: Min 10 chars, max 500 chars
  slotId?: string;                // Optional: slot ID when mentee selects from available slots
}

/**
 * Reschedule Response
 * Response after requesting a reschedule
 */
export interface RescheduleResponse {
  id: string;
  status: SessionStatus;          // PendingReschedule
  originalStartTime: string;
  requestedStartTime: string;
  requestedBy: 'mentee' | 'mentor';
  rescheduleReason: string;
  requestedAt: string;
}

/**
 * Reschedule Details
 * Response for GET /api/sessions/reschedule/{rescheduleId}
 */
export interface RescheduleDetails {
  id: string;
  sessionId: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  originalStartTime: string;
  newScheduledStartTime: string;
  newStartTime?: string; // Backend returns this instead of newScheduledStartTime
  requestedBy: 'mentee' | 'mentor';
  rescheduleReason: string;
  requestedAt: string;
  topic?: string;
  duration?: string;
  mentorFirstName?: string;
  mentorLastName?: string;
  menteeFirstName?: string;
  menteeLastName?: string;
}

/**
 * Approve Reschedule Response
 * Response for POST /api/sessions/reschedule/{rescheduleId}/approve
 */
export interface ApproveRescheduleResponse {
  id: string;                           // Session ID
  status: SessionStatus;                // Confirmed
  originalStartTime: string;            // Original scheduled time
  requestedStartTime: string;           // New scheduled time (approved)
  requestedBy: 'mentee' | 'mentor';     // Who requested the reschedule
  rescheduleReason: string;             // Reason for reschedule
  requestedAt: string;                  // When reschedule was requested
  isApproved: boolean;                  // true
}

/**
 * Reject Reschedule Response
 * Response for POST /api/sessions/reschedule/{rescheduleId}/reject
 */
export interface RejectRescheduleResponse {
  id: string;                           // Session ID
  status: SessionStatus;                // Confirmed (unchanged)
  originalStartTime: string;            // Original scheduled time (kept)
  requestedStartTime: string;           // Requested time (rejected)
  requestedBy: 'mentee' | 'mentor';     // Who requested the reschedule
  rescheduleReason: string;             // Reason for reschedule
  requestedAt: string;                  // When reschedule was requested
  isApproved: boolean;                  // false
}

/**
 * Cancel Request
 * Request body for PATCH /api/sessions/{id}/cancel
 */
export interface CancelRequest {
  reason: string;  // Required: Min 10 chars, max 500 chars
}

/**
 * Cancel Response
 * Response after cancelling a session
 */
export interface CancelResponse {
  id: string;
  status: SessionStatus;              // Cancelled
  cancellationReason: string;
  cancelledBy: 'mentee' | 'mentor' | 'admin';
  cancelledAt: string;
  refundAmount: number;
  refundPercentage: number;           // 100, 50, or 0
  refundStatus: 'Processing' | 'Completed' | 'Failed';
}

/**
 * Join Session Response
 * Response for POST /api/sessions/{id}/join
 */
export interface JoinSessionResponse {
  sessionId: string;
  videoConferenceLink: string;
  provider: string;                   // "Zoom" or other video provider
  scheduledStartTime: string;
  scheduledEndTime: string;
  canJoinNow: boolean;
  minutesUntilStart?: number;
  instructions: string;
}

/**
 * Complete Session Response
 * Response for PATCH /api/sessions/{id}/complete
 */
export interface CompleteSessionResponse {
  id: string;
  status: SessionStatus;              // Completed
  completedAt: string;
  duration: SessionDuration;
  actualDurationMinutes: number;
  paymentReleaseDate: string;         // Date when payment released to mentor (72h after)
}

/**
 * Session Recording Response
 * Response for GET /api/sessions/{id}/recording
 */
export interface SessionRecordingResponse {
  sessionId: string;
  recordingPlayUrl: string;           // Presigned URL for video playback (60-min expiration)
  playUrl: string;                    // Alias for recordingPlayUrl
  accessToken: string;                // Access token (if needed)
  expiresAt: string;                  // ISO 8601 datetime when presigned URL expires
  isAvailable: boolean;               // True if recording is ready
  status: 'Available' | 'Processing' | 'Failed';  // Recording status
  availableAt: string | null;         // ISO 8601 datetime when recording became available
  transcript: string | null;          // Transcript text (if available)
}

/**
 * Session Transcript Response
 * Response for GET /api/sessions/{id}/transcript
 */
export interface SessionTranscriptResponse {
  sessionId: string;
  transcript: string;                 // AI-generated transcript from Deepgram
  isAvailable: boolean;               // True if transcript is ready
}


/**
 * Session AI Summary Response
 * Response for GET /api/sessions/{id}/summary
 */
export interface SessionSummaryResponse {
  sessionId: string;
  summary: string;                    // AI-generated summary (markdown/plain text)
  isAvailable: boolean;               // True if summary is ready
}

/**
 * AI Preparation Guide Response
 * Response for POST /api/sessions/{id}/generate-preparation
 */
export interface AIPreparationResponse {
  sessionId: string;
  preparationGuide: string;           // Markdown-formatted AI-generated guide
  generatedAt: string;                // ISO 8601 datetime
  wasAlreadyGenerated: boolean;       // True if returning cached result
}
// ===========================
// Paginated Responses
// ===========================

/**
 * Pagination Metadata
 * Standard pagination information
 */
export interface PaginationMetadata {
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Upcoming Sessions Response
 * Response for GET /api/sessions/upcoming
 */
export interface UpcomingSessionsResponse {
  sessions: SessionSummary[];
  pagination: PaginationMetadata;
}

/**
 * Past Sessions Response
 * Response for GET /api/sessions/past
 */
export interface PastSessionsResponse {
  sessions: PastSessionItem[];
  pagination: PaginationMetadata;
}

// ===========================
// Helper Functions
// ===========================

/**
 * Get full name of mentee
 */
export function getMenteeName(session: Session | SessionSummary | SessionDetailResponse): string {
  return `${session.menteeFirstName} ${session.menteeLastName}`.trim();
}

/**
 * Get full name of mentor
 */
export function getMentorName(session: Session | SessionSummary | SessionDetailResponse): string {
  return `${session.mentorFirstName} ${session.mentorLastName}`.trim();
}

/**
 * Format session status for display
 */
export function formatSessionStatus(status: SessionStatus): string {
  const statusMap: Record<SessionStatus, string> = {
    [SessionStatus.Pending]: 'Pending Payment',
    [SessionStatus.Confirmed]: 'Confirmed',
    [SessionStatus.InProgress]: 'In Progress',
    [SessionStatus.Completed]: 'Completed',
    [SessionStatus.Cancelled]: 'Cancelled',
    [SessionStatus.NoShow]: 'No Show',
    [SessionStatus.PendingReschedule]: 'Pending Reschedule'
  };
  return statusMap[status] || status;
}

/**
 * Get status badge color for UI
 */
export function getSessionStatusColor(status: SessionStatus): string {
  const colorMap: Record<SessionStatus, string> = {
    [SessionStatus.Pending]: 'yellow',
    [SessionStatus.Confirmed]: 'green',
    [SessionStatus.InProgress]: 'blue',
    [SessionStatus.Completed]: 'gray',
    [SessionStatus.Cancelled]: 'red',
    [SessionStatus.NoShow]: 'orange',
    [SessionStatus.PendingReschedule]: 'purple'
  };
  return colorMap[status] || 'gray';
}

/**
 * Format session duration for display
 */
export function formatSessionDuration(duration: SessionDuration): string {
  const durationMap: Record<SessionDuration, string> = {
    [SessionDuration.ThirtyMinutes]: '30 minutes',
    [SessionDuration.SixtyMinutes]: '60 minutes'
  };
  return durationMap[duration] || duration;
}

/**
 * Get duration in minutes
 */
export function getDurationMinutes(duration: SessionDuration): number {
  const minutesMap: Record<SessionDuration, number> = {
    [SessionDuration.ThirtyMinutes]: 30,
    [SessionDuration.SixtyMinutes]: 60
  };
  return minutesMap[duration] || 0;
}

/**
 * Format session type for display
 */
export function formatSessionType(type: SessionType): string {
  const typeMap: Record<SessionType, string> = {
    [SessionType.OneOnOne]: 'One-on-One',
    [SessionType.Group]: 'Group Session'
  };
  return typeMap[type] || type;
}

/**
 * Format price with currency
 */
export function formatSessionPrice(price: number, currency: string = 'EGP'): string {
  return new Intl.NumberFormat('en-EG', {
    style: 'currency',
    currency: currency
  }).format(price);
}

/**
 * Format datetime for display
 */
export function formatSessionDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });
}

/**
 * Get time until session in human-readable format
 */
export function getTimeUntilSession(hoursUntil: number | undefined | null): string {
  if (hoursUntil === undefined || hoursUntil === null) {
    return 'Unknown';
  }

  if (hoursUntil < 0) {
    return 'Started';
  }

  if (hoursUntil < 1) {
    const minutes = Math.round(hoursUntil * 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }

  if (hoursUntil < 24) {
    const hours = Math.floor(hoursUntil);
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }

  const days = Math.floor(hoursUntil / 24);
  return `${days} day${days !== 1 ? 's' : ''}`;
}

/**
 * Check if session can be joined (within 15 min window)
 */
export function canJoinSession(session: Session | SessionSummary): boolean {
  if (session.status !== SessionStatus.Confirmed && session.status !== SessionStatus.InProgress) {
    return false;
  }

  const now = new Date();
  const startTime = new Date(session.scheduledStartTime);
  const minutesUntilStart = (startTime.getTime() - now.getTime()) / (1000 * 60);

  // Can join 15 minutes before start
  return minutesUntilStart <= 15 && minutesUntilStart >= -15;
}

/**
 * Check if session is upcoming (future and confirmed)
 */
export function isUpcomingSession(session: Session | SessionSummary): boolean {
  if (session.status !== SessionStatus.Confirmed && session.status !== SessionStatus.Pending) {
    return false;
  }

  const now = new Date();
  const startTime = new Date(session.scheduledStartTime);
  return startTime > now;
}

/**
 * Check if session is past (completed or cancelled)
 */
export function isPastSession(session: Session | SessionSummary): boolean {
  return session.status === SessionStatus.Completed || session.status === SessionStatus.Cancelled;
}

/**
 * Sort sessions by scheduled start time
 */
export function sortSessionsByDate(
  sessions: Session[] | SessionSummary[],
  ascending: boolean = true
): typeof sessions {
  return [...sessions].sort((a, b) => {
    const dateA = new Date(a.scheduledStartTime).getTime();
    const dateB = new Date(b.scheduledStartTime).getTime();
    return ascending ? dateA - dateB : dateB - dateA;
  });
}

/**
 * Filter sessions by status
 */
export function filterSessionsByStatus(
  sessions: Session[] | SessionSummary[],
  status: SessionStatus
): typeof sessions {
  return sessions.filter(session => session.status === status);
}

/**
 * Calculate refund amount based on cancellation policy
 * >48h: 100%, 24-48h: 50%, <24h: 0%
 */
export function calculateRefundAmount(price: number, hoursUntilSession: number): {
  amount: number;
  percentage: number;
} {
  if (hoursUntilSession > 48) {
    return { amount: price, percentage: 100 };
  } else if (hoursUntilSession >= 24) {
    return { amount: price * 0.5, percentage: 50 };
  } else {
    return { amount: 0, percentage: 0 };
  }
}

// ===========================
// Type Guards
// ===========================

/**
 * Type guard to check if object is a Session
 */
export function isSession(obj: any): obj is Session {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.menteeId === 'string' &&
    typeof obj.mentorId === 'string' &&
    typeof obj.scheduledStartTime === 'string' &&
    typeof obj.scheduledEndTime === 'string' &&
    typeof obj.status === 'string' &&
    typeof obj.price === 'number' &&
    typeof obj.createdAt === 'string'
  );
}

/**
 * Type guard to check if object is a SessionSummary
 */
export function isSessionSummary(obj: any): obj is SessionSummary {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.menteeId === 'string' &&
    typeof obj.mentorId === 'string' &&
    typeof obj.scheduledStartTime === 'string' &&
    typeof obj.status === 'string'
  );
}

/**
 * Validate book session request
 */
export function validateBookSessionRequest(request: Partial<BookSessionRequest>): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  if (!request.timeSlotId || request.timeSlotId.trim() === '') {
    errors['timeSlotId'] = 'Time slot ID is required';
  }

  if (request.topic && request.topic.length > 200) {
    errors['topic'] = 'Topic cannot exceed 200 characters';
  }

  if (request.notes && request.notes.length > 1000) {
    errors['notes'] = 'Notes cannot exceed 1000 characters';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validate reschedule request
 */
export function validateRescheduleRequest(request: Partial<RescheduleRequest>): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  if (!request.newScheduledStartTime) {
    errors['newScheduledStartTime'] = 'New scheduled start time is required';
  } else {
    const newTime = new Date(request.newScheduledStartTime);
    const now = new Date();
    const hoursUntil = (newTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntil < 24) {
      errors['newScheduledStartTime'] = 'Reschedule must be at least 24 hours in the future';
    }
  }

  if (!request.reason || request.reason.trim().length < 10) {
    errors['reason'] = 'Reason must be at least 10 characters';
  }

  if (request.reason && request.reason.length > 500) {
    errors['reason'] = 'Reason cannot exceed 500 characters';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validate cancel request
 */
export function validateCancelRequest(request: Partial<CancelRequest>): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  if (!request.reason || request.reason.trim().length < 10) {
    errors['reason'] = 'Cancellation reason must be at least 10 characters';
  }

  if (request.reason && request.reason.length > 500) {
    errors['reason'] = 'Cancellation reason cannot exceed 500 characters';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}
