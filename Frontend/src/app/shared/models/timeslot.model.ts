/**
 * TimeSlot Models and Utilities
 *
 * Defines interfaces and helper functions for the timeslot booking system.
 * Timeslots are created by mentors to indicate their availability,
 * and can be booked by mentees to schedule mentorship sessions.
 */

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Complete TimeSlot entity (used by mentors for slot management)
 */
export interface TimeSlot {
  id: string; // GUID
  mentorId: string; // GUID
  startDateTime: string; // ISO 8601 datetime
  endDateTime: string; // ISO 8601 datetime (calculated: startDateTime + durationMinutes)
  durationMinutes: number; // 30 or 60
  isBooked: boolean; // true if slot has been booked by a mentee
  sessionId: string | null; // Links to Session when booked
  session: SessionPreview | null; // Session details (only present for booked slots)
  createdAt: string; // ISO 8601 datetime
  canDelete?: boolean | null; // true if slot can be deleted (only available slots)
}

/**
 * Lightweight AvailableSlot (used by mentees for browsing and booking)
 * Returned by GET /api/mentors/{mentorId}/available-slots
 */
export interface AvailableSlot {
  id: string; // GUID
  startDateTime: string; // ISO 8601 datetime
  endDateTime: string; // ISO 8601 datetime
  durationMinutes: number; // 30 or 60
  price: number; // USD - mentor's rate30Min or rate60Min based on duration
}

/**
 * CreateTimeSlot DTO for creating a single slot
 * Used in POST /api/mentors/{mentorId}/time-slots
 */
export interface CreateTimeSlot {
  startDateTime: string; // ISO 8601 datetime, must be 24+ hours in future
  durationMinutes: number; // 30 or 60
}

/**
 * Session preview embedded in booked TimeSlots
 */
export interface SessionPreview {
  id: string; // GUID
  menteeFirstName: string;
  menteeLastName: string;
  status: string; // Session status enum value
  topic: string | null;
}

/**
 * Response from GET /api/mentors/{mentorId}/available-slots
 */
export interface AvailableSlotsResponse {
  mentorId: string; // GUID
  mentorName: string; // Full name
  availableSlots: AvailableSlot[];
  totalCount: number; // Total number of available slots
  dateRange: {
    startDate: string; // ISO date (YYYY-MM-DD)
    endDate: string; // ISO date (YYYY-MM-DD)
  };
}

/**
 * Response from GET /api/mentors/{mentorId}/time-slots (mentor management)
 */
export interface TimeSlotListResponse {
  timeSlots: TimeSlot[];
  pagination: PaginationMetadata;
  summary: {
    totalSlots: number;
    availableSlots: number;
    bookedSlots: number;
  };
}

/**
 * Pagination metadata
 */
export interface PaginationMetadata {
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// ============================================================================
// QUERY PARAMETER INTERFACES
// ============================================================================

/**
 * Query parameters for GET /api/mentors/{mentorId}/available-slots (public)
 */
export interface GetAvailableSlotsParams {
  startDate?: string; // ISO date (YYYY-MM-DD), default: 24 hours from now
  endDate?: string; // ISO date (YYYY-MM-DD), default: startDate + 90 days
  durationMinutes?: number; // 30 or 60, filters by slot duration
}

/**
 * Query parameters for GET /api/mentors/{mentorId}/time-slots (mentor only)
 */
export interface GetMentorSlotsParams {
  startDate?: string; // ISO date (YYYY-MM-DD), default: today
  endDate?: string; // ISO date (YYYY-MM-DD), default: startDate + 30 days
  isBooked?: boolean; // true = booked, false = available, null = all
  page?: number; // default: 1, min: 1
  pageSize?: number; // default: 20, min: 1, max: 100
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Business rules for timeslot management
 */
export const TIMESLOT_RULES = {
  MIN_ADVANCE_HOURS: 24, // Minimum hours in advance for booking/creating slots
  MAX_DATE_RANGE_DAYS: 90, // Maximum date range for queries
  DEFAULT_QUERY_DAYS: 90, // Default date range when no params provided (mentee view)
  DEFAULT_MENTOR_QUERY_DAYS: 30, // Default date range for mentor management view
  VALID_DURATIONS: [30, 60] as const, // Valid slot durations in minutes
  MAX_BATCH_SIZE: 50, // Maximum slots that can be created in one batch request
  DEFAULT_PAGE_SIZE: 20, // Default pagination page size
  MAX_PAGE_SIZE: 100, // Maximum pagination page size
} as const;

/**
 * User-friendly error messages for validation
 */
export const TIMESLOT_ERROR_MESSAGES = {
  PAST_DATE: 'Time slot must be at least 24 hours in the future',
  INVALID_DURATION: 'Duration must be 30 or 60 minutes',
  DATE_RANGE_EXCEEDED: 'Date range cannot exceed 90 days',
  SLOT_ALREADY_BOOKED: 'This time slot is no longer available',
  BATCH_SIZE_EXCEEDED: 'Cannot create more than 50 slots at once',
  DUPLICATE_SLOT: 'A time slot already exists at this time',
  CANNOT_DELETE_BOOKED: 'Cannot delete a booked time slot',
  START_DATE_AFTER_END: 'Start date must be before end date',
  NETWORK_ERROR: 'Unable to load availability. Please try again.',
  NO_SLOTS_AVAILABLE: 'No available time slots found for the selected period',
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Formats a time slot's time range as a readable string
 * @example "10:00 AM - 10:30 AM"
 */
export function formatSlotTime(slot: AvailableSlot | TimeSlot): string {
  const start = new Date(slot.startDateTime);
  const end = new Date(slot.endDateTime);

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return `${formatTime(start)} - ${formatTime(end)}`;
}

/**
 * Formats slot duration as human-readable string
 * @example formatSlotDuration(30) => "30 min"
 * @example formatSlotDuration(60) => "1 hour"
 */
export function formatSlotDuration(minutes: number): string {
  if (minutes === 60) {
    return '1 hour';
  }
  return `${minutes} min`;
}

/**
 * Checks if a TimeSlot is available (not booked)
 */
export function isSlotAvailable(slot: TimeSlot): boolean {
  return !slot.isBooked;
}

/**
 * Checks if a TimeSlot can be deleted
 * Only available (not booked) slots can be deleted
 */
export function canDeleteSlot(slot: TimeSlot): boolean {
  return slot.canDelete === true || !slot.isBooked;
}

/**
 * Groups an array of slots by their date (ignores time)
 * @returns Map where key is ISO date string (YYYY-MM-DD) and value is array of slots for that date
 */
export function groupSlotsByDate<T extends AvailableSlot | TimeSlot>(
  slots: T[]
): Map<string, T[]> {
  const grouped = new Map<string, T[]>();

  slots.forEach((slot) => {
    const date = new Date(slot.startDateTime);
    const dateKey = date.toISOString().split('T')[0]; // Extract YYYY-MM-DD

    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, []);
    }
    grouped.get(dateKey)!.push(slot);
  });

  // Sort slots within each date by start time
  grouped.forEach((slotsForDate) => {
    slotsForDate.sort(
      (a, b) =>
        new Date(a.startDateTime).getTime() -
        new Date(b.startDateTime).getTime()
    );
  });

  return grouped;
}

/**
 * Validates that a datetime is at least 24 hours in the future
 * @param dateTime ISO 8601 datetime string
 * @returns true if valid, false otherwise
 */
export function validateSlotDateTime(dateTime: string): boolean {
  const slotDate = new Date(dateTime);
  const now = new Date();
  const minFutureDate = new Date(
    now.getTime() + TIMESLOT_RULES.MIN_ADVANCE_HOURS * 60 * 60 * 1000
  );

  return slotDate >= minFutureDate;
}

/**
 * Gets the minimum allowed date for slot creation (24 hours from now)
 * @returns ISO date string (YYYY-MM-DD)
 */
export function getMinimumSlotDate(): string {
  const now = new Date();
  const minDate = new Date(
    now.getTime() + TIMESLOT_RULES.MIN_ADVANCE_HOURS * 60 * 60 * 1000
  );
  return minDate.toISOString().split('T')[0];
}

/**
 * Gets the maximum allowed date for slot creation (1 year from now)
 * @returns ISO date string (YYYY-MM-DD)
 */
export function getMaximumSlotDate(): string {
  const now = new Date();
  const maxDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year
  return maxDate.toISOString().split('T')[0];
}

/**
 * Validates that duration is 30 or 60 minutes
 */
export function validateSlotDuration(duration: number): boolean {
  return TIMESLOT_RULES.VALID_DURATIONS.includes(
    duration as (typeof TIMESLOT_RULES.VALID_DURATIONS)[number]
  );
}

/**
 * Calculates end datetime from start datetime and duration
 * @param startDateTime ISO 8601 datetime string
 * @param durationMinutes 30 or 60
 * @returns ISO 8601 datetime string
 */
export function calculateEndDateTime(
  startDateTime: string,
  durationMinutes: number
): string {
  const start = new Date(startDateTime);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
  return end.toISOString();
}

/**
 * Formats a date as "Monday, January 15, 2024"
 */
export function formatSlotDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Checks if a date string is today
 */
export function isToday(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Generates an array of time slots between start and end time with given interval
 * Used for batch slot creation with recurring patterns
 *
 * @param date ISO date string (YYYY-MM-DD)
 * @param startTime Time string in HH:mm format (24-hour)
 * @param endTime Time string in HH:mm format (24-hour)
 * @param durationMinutes 30 or 60
 * @param intervalMinutes Minutes between slot start times
 * @returns Array of CreateTimeSlot objects
 */
export function generateSlotsForDay(
  date: string,
  startTime: string,
  endTime: string,
  durationMinutes: number,
  intervalMinutes: number
): CreateTimeSlot[] {
  const slots: CreateTimeSlot[] = [];

  // Parse start and end times
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);

  // Create start datetime
  let currentDateTime = new Date(`${date}T${startTime}:00`);
  const endDateTime = new Date(`${date}T${endTime}:00`);

  // Generate slots
  while (currentDateTime.getTime() + durationMinutes * 60 * 1000 <= endDateTime.getTime()) {
    slots.push({
      startDateTime: currentDateTime.toISOString(),
      durationMinutes,
    });

    // Increment by interval
    currentDateTime = new Date(currentDateTime.getTime() + intervalMinutes * 60 * 1000);
  }

  return slots;
}

/**
 * Checks if two datetime strings represent the same date (ignoring time)
 */
export function isSameDate(date1: string, date2: string): boolean {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}
