/**
 * Booking Models
 *
 * This file contains TypeScript interfaces for session booking operations,
 * including booking requests, reschedule, and cancellation DTOs.
 *
 * Note: This file provides a centralized location for booking-related DTOs,
 * though many of these are also defined in session.model.ts. Import from
 * this file when working specifically with booking operations.
 *
 * Based on: Session-Payment-Endpoints.md
 */

import {
  SessionStatus,
  SessionType,
  SessionDuration
} from './session.model';

// ===========================
// Booking Request DTOs
// ===========================

/**
 * Book Session Request
 * Request body for POST /api/sessions
 *
 * This is the primary DTO for booking a new session.
 * The session's mentor, duration, scheduled time, and price
 * are automatically derived from the selected TimeSlot.
 */
export interface BookSessionRequest {
  timeSlotId: string;          // Required: TimeSlot ID (must be available, isBooked = false)
  topic?: string;              // Optional: Session topic (max 200 chars)
  notes?: string;              // Optional: Session notes (max 1000 chars)
}

/**
 * Book Session Response
 * Response after creating a new session (status = Pending)
 */
export interface BookSessionResponse {
  id: string;                           // Session GUID
  menteeId: string;                     // Mentee user GUID
  menteeFirstName: string;              // Mentee first name
  menteeLastName: string;               // Mentee last name
  mentorId: string;                     // Mentor user GUID (from TimeSlot)
  mentorFirstName: string;              // Mentor first name
  mentorLastName: string;               // Mentor last name
  timeSlotId?: string | null;           // Reference to TimeSlot
  sessionType: SessionType;             // OneOnOne or Group
  duration: SessionDuration;            // ThirtyMinutes or SixtyMinutes (from TimeSlot)
  scheduledStartTime: string;           // ISO 8601 datetime (from TimeSlot)
  scheduledEndTime: string;             // ISO 8601 datetime (calculated)
  status: SessionStatus;                // Always "Pending" initially
  videoConferenceLink?: string | null;  // Null until payment confirmed
  topic?: string | null;                // Session topic
  notes?: string | null;                // Session notes
  price: number;                        // Price from Mentor's rate
  paymentId?: string | null;            // Null until payment created
  createdAt: string;                    // ISO 8601 datetime
  updatedAt: string;                    // ISO 8601 datetime
}

// ===========================
// Reschedule Request DTOs
// ===========================

/**
 * Reschedule Request
 * Request body for PATCH /api/sessions/{id}/reschedule
 *
 * Business Rule: Must be requested >24 hours before original scheduledStartTime
 */
export interface RescheduleRequest {
  newScheduledStartTime: string;  // ISO 8601 datetime, must be >24h from now
  reason: string;                 // Required: Min 10 chars, max 500 chars
}

/**
 * Reschedule Response
 * Response after requesting a reschedule (requires mentor approval)
 */
export interface RescheduleResponse {
  id: string;                         // Session GUID
  status: SessionStatus;              // "PendingReschedule"
  originalStartTime: string;          // Original scheduled time
  requestedStartTime: string;         // Requested new time
  requestedBy: 'mentee' | 'mentor';  // Who requested the reschedule
  rescheduleReason: string;           // Reason provided
  requestedAt: string;                // ISO 8601 datetime
}

// ===========================
// Cancel Request DTOs
// ===========================

/**
 * Cancel Request
 * Request body for PATCH /api/sessions/{id}/cancel
 *
 * Refund Policy:
 * - >48 hours before session: 100% refund
 * - 24-48 hours before: 50% refund
 * - <24 hours before: 0% refund (no refund)
 */
export interface CancelRequest {
  reason: string;  // Required: Min 10 chars, max 500 chars
}

/**
 * Cancel Response
 * Response after cancelling a session
 * TimeSlot is automatically released (isBooked = false, sessionId = null)
 */
export interface CancelResponse {
  id: string;                                // Session GUID
  status: SessionStatus;                     // "Cancelled"
  cancellationReason: string;                // Reason provided
  cancelledBy: 'mentee' | 'mentor' | 'admin';  // Who cancelled
  cancelledAt: string;                       // ISO 8601 datetime
  refundAmount: number;                      // Amount to be refunded
  refundPercentage: number;                  // 100, 50, or 0
  refundStatus: 'Processing' | 'Completed' | 'Failed';  // Refund processing status
}

// ===========================
// Booking Validation
// ===========================

/**
 * Validation Result
 * Standard validation result structure
 */
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Validate book session request
 */
export function validateBookSessionRequest(
  request: Partial<BookSessionRequest>
): ValidationResult {
  const errors: Record<string, string> = {};

  // Validate timeSlotId
  if (!request.timeSlotId || request.timeSlotId.trim() === '') {
    errors['timeSlotId'] = 'Time slot ID is required';
  }

  // Validate topic length
  if (request.topic && request.topic.length > 200) {
    errors['topic'] = 'Topic cannot exceed 200 characters';
  }

  // Validate notes length
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
export function validateRescheduleRequest(
  request: Partial<RescheduleRequest>
): ValidationResult {
  const errors: Record<string, string> = {};

  // Validate newScheduledStartTime exists
  if (!request.newScheduledStartTime) {
    errors['newScheduledStartTime'] = 'New scheduled start time is required';
  } else {
    // Validate newScheduledStartTime is at least 24 hours in future
    const newTime = new Date(request.newScheduledStartTime);
    const now = new Date();
    const hoursUntil = (newTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntil < 24) {
      errors['newScheduledStartTime'] = 'Reschedule must be at least 24 hours in the future';
    }
  }

  // Validate reason
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
export function validateCancelRequest(
  request: Partial<CancelRequest>
): ValidationResult {
  const errors: Record<string, string> = {};

  // Validate reason
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

// ===========================
// Booking Helper Functions
// ===========================

/**
 * Calculate refund percentage based on hours until session
 * Business Rule:
 * - >48h: 100%
 * - 24-48h: 50%
 * - <24h: 0%
 */
export function calculateRefundPercentage(hoursUntilSession: number): number {
  if (hoursUntilSession > 48) {
    return 100;
  } else if (hoursUntilSession >= 24) {
    return 50;
  } else {
    return 0;
  }
}

/**
 * Calculate refund amount based on price and hours until session
 */
export function calculateRefundAmount(
  price: number,
  hoursUntilSession: number
): {
  amount: number;
  percentage: number;
} {
  const percentage = calculateRefundPercentage(hoursUntilSession);
  const amount = (price * percentage) / 100;

  return {
    amount: Math.round(amount * 100) / 100, // Round to 2 decimal places
    percentage
  };
}

/**
 * Check if reschedule is allowed (must be >24h before session)
 */
export function canReschedule(scheduledStartTime: string): boolean {
  const now = new Date();
  const startTime = new Date(scheduledStartTime);
  const hoursUntil = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  return hoursUntil > 24;
}

/**
 * Check if cancellation is allowed (session must be confirmed/pending)
 */
export function canCancel(status: SessionStatus): boolean {
  return (
    status === SessionStatus.Confirmed ||
    status === SessionStatus.Pending ||
    status === SessionStatus.PendingReschedule
  );
}

/**
 * Get refund policy message based on hours until session
 */
export function getRefundPolicyMessage(hoursUntilSession: number): string {
  const refund = calculateRefundAmount(100, hoursUntilSession); // Use 100 as base

  if (refund.percentage === 100) {
    return 'Full refund (100%) - Cancelling more than 48 hours before session';
  } else if (refund.percentage === 50) {
    return 'Partial refund (50%) - Cancelling 24-48 hours before session';
  } else {
    return 'No refund - Cancelling less than 24 hours before session';
  }
}

/**
 * Format hours until session for display
 */
export function formatHoursUntilSession(hours: number): string {
  if (hours < 0) {
    return 'Session has started or passed';
  }

  if (hours < 1) {
    const minutes = Math.round(hours * 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }

  if (hours < 24) {
    const wholeHours = Math.floor(hours);
    return `${wholeHours} hour${wholeHours !== 1 ? 's' : ''}`;
  }

  const days = Math.floor(hours / 24);
  const remainingHours = Math.floor(hours % 24);

  if (remainingHours === 0) {
    return `${days} day${days !== 1 ? 's' : ''}`;
  }

  return `${days} day${days !== 1 ? 's' : ''} and ${remainingHours} hour${remainingHours !== 1 ? 's' : ''}`;
}

/**
 * Check if booking request is valid (client-side pre-validation)
 */
export function isValidBookingRequest(request: BookSessionRequest): boolean {
  return validateBookSessionRequest(request).isValid;
}

/**
 * Check if reschedule request is valid (client-side pre-validation)
 */
export function isValidRescheduleRequest(request: RescheduleRequest): boolean {
  return validateRescheduleRequest(request).isValid;
}

/**
 * Check if cancel request is valid (client-side pre-validation)
 */
export function isValidCancelRequest(request: CancelRequest): boolean {
  return validateCancelRequest(request).isValid;
}

// ===========================
// Type Guards
// ===========================

/**
 * Type guard to check if object is a BookSessionRequest
 */
export function isBookSessionRequest(obj: any): obj is BookSessionRequest {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.timeSlotId === 'string' &&
    obj.timeSlotId.trim() !== ''
  );
}

/**
 * Type guard to check if object is a RescheduleRequest
 */
export function isRescheduleRequest(obj: any): obj is RescheduleRequest {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.newScheduledStartTime === 'string' &&
    typeof obj.reason === 'string'
  );
}

/**
 * Type guard to check if object is a CancelRequest
 */
export function isCancelRequest(obj: any): obj is CancelRequest {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.reason === 'string' &&
    obj.reason.trim() !== ''
  );
}

/**
 * Type guard to check if object is a BookSessionResponse
 */
export function isBookSessionResponse(obj: any): obj is BookSessionResponse {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.menteeId === 'string' &&
    typeof obj.mentorId === 'string' &&
    typeof obj.scheduledStartTime === 'string' &&
    typeof obj.scheduledEndTime === 'string' &&
    typeof obj.status === 'string' &&
    typeof obj.price === 'number'
  );
}

// ===========================
// Constants
// ===========================

/**
 * Booking Business Rules
 * Centralized constants for booking operations
 */
export const BookingRules = {
  // Time constraints
  MINIMUM_ADVANCE_BOOKING_HOURS: 24,
  RESCHEDULE_NOTICE_HOURS: 24,
  FULL_REFUND_HOURS: 48,
  PARTIAL_REFUND_HOURS: 24,

  // Refund percentages
  FULL_REFUND_PERCENTAGE: 100,
  PARTIAL_REFUND_PERCENTAGE: 50,
  NO_REFUND_PERCENTAGE: 0,

  // Field length constraints
  TOPIC_MAX_LENGTH: 200,
  NOTES_MAX_LENGTH: 1000,
  REASON_MIN_LENGTH: 10,
  REASON_MAX_LENGTH: 500,

  // Payment
  PLATFORM_COMMISSION_PERCENTAGE: 15,
  MENTOR_PAYOUT_PERCENTAGE: 85,
  PAYMENT_HOLD_HOURS: 72,

  // Session duration
  MIN_SESSION_DURATION_MINUTES: 30,
  MAX_SESSION_DURATION_MINUTES: 180,

  // Pricing (in USD)
  MIN_SESSION_PRICE: 20,
  MAX_SESSION_PRICE: 500
} as const;

/**
 * Error Messages
 * Centralized error messages for validation
 */
export const BookingErrorMessages = {
  TIMESLOT_REQUIRED: 'Time slot ID is required',
  TIMESLOT_UNAVAILABLE: 'Selected time slot is no longer available',
  TIMESLOT_CONFLICT: 'You already have a session scheduled at this time',
  TOPIC_TOO_LONG: `Topic cannot exceed ${BookingRules.TOPIC_MAX_LENGTH} characters`,
  NOTES_TOO_LONG: `Notes cannot exceed ${BookingRules.NOTES_MAX_LENGTH} characters`,
  REASON_TOO_SHORT: `Reason must be at least ${BookingRules.REASON_MIN_LENGTH} characters`,
  REASON_TOO_LONG: `Reason cannot exceed ${BookingRules.REASON_MAX_LENGTH} characters`,
  RESCHEDULE_TOO_LATE: `Reschedule must be requested at least ${BookingRules.RESCHEDULE_NOTICE_HOURS} hours before session`,
  RESCHEDULE_TIME_INVALID: `New time must be at least ${BookingRules.MINIMUM_ADVANCE_BOOKING_HOURS} hours in the future`,
  CANCEL_NOT_ALLOWED: 'This session cannot be cancelled',
  SESSION_NOT_FOUND: 'Session not found',
  UNAUTHORIZED: 'You are not authorized to perform this action'
} as const;
