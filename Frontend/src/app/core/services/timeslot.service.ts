import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import {
  TimeSlot,
  AvailableSlot,
  CreateTimeSlot,
  AvailableSlotsResponse,
  TimeSlotListResponse,
  GetAvailableSlotsParams,
  GetMentorSlotsParams,
} from '../../shared/models/timeslot.model';

/**
 * API Response wrapper matching backend format
 */
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  statusCode?: number;
}

/**
 * TimeSlot Service
 *
 * Handles all API interactions for timeslot management.
 * Provides methods for both public (mentee) and authenticated (mentor) endpoints.
 *
 * Public Endpoints:
 * - getAvailableSlots: View available slots for booking
 *
 * Authenticated Endpoints (Mentor only):
 * - getMentorSlots: View all slots (booked + available) with pagination
 * - createSlot: Create a single time slot
 * - createBatchSlots: Create multiple slots at once (max 50)
 * - deleteSlot: Delete an available slot
 */
@Injectable({
  providedIn: 'root',
})
export class TimeslotService {
  private readonly apiUrl = `${environment.apiUrl}/mentors`;

  constructor(private http: HttpClient) {}

  // ==========================================================================
  // PUBLIC ENDPOINTS (No Authentication Required)
  // ==========================================================================

  /**
   * Get available time slots for a mentor (public access for mentees)
   *
   * Endpoint: GET /api/mentors/{mentorId}/available-slots
   * Access: Public (no auth required)
   *
   * Default behavior (no query params):
   * - Returns slots starting 24+ hours from now
   * - Extends up to 90 days into future
   * - Only unbooked slots (isBooked = false)
   *
   * @param mentorId Mentor's GUID
   * @param params Optional query parameters (startDate, endDate, durationMinutes)
   * @returns Observable of available slots response
   *
   * @example
   * // Get all available slots (default: 24h from now, 90 days range)
   * timeslotService.getAvailableSlots(mentorId).subscribe(response => {
   *   console.log(response.data.availableSlots);
   * });
   *
   * @example
   * // Filter by date range and duration
   * timeslotService.getAvailableSlots(mentorId, {
   *   startDate: '2025-11-25',
   *   endDate: '2025-12-25',
   *   durationMinutes: 60
   * }).subscribe(response => {
   *   console.log(response.data.availableSlots);
   * });
   */
  getAvailableSlots(
    mentorId: string,
    params?: GetAvailableSlotsParams
  ): Observable<ApiResponse<AvailableSlotsResponse>> {
    const url = `${this.apiUrl}/${mentorId}/available-slots`;
    let httpParams = new HttpParams();

    if (params) {
      if (params.startDate) {
        httpParams = httpParams.set('startDate', params.startDate);
      }
      if (params.endDate) {
        httpParams = httpParams.set('endDate', params.endDate);
      }
      if (params.durationMinutes) {
        httpParams = httpParams.set(
          'durationMinutes',
          params.durationMinutes.toString()
        );
      }
    }

    return this.http.get<ApiResponse<AvailableSlotsResponse>>(url, {
      params: httpParams,
    });
  }

  // ==========================================================================
  // AUTHENTICATED ENDPOINTS (Mentor or Admin only)
  // ==========================================================================

  /**
   * Get all time slots for a mentor (booked + available) with pagination
   *
   * Endpoint: GET /api/mentors/{mentorId}/time-slots
   * Access: Mentor (owner) or Admin
   * Requires: JWT token (automatically added by authInterceptor)
   *
   * @param mentorId Mentor's GUID
   * @param params Optional query parameters (startDate, endDate, isBooked, page, pageSize)
   * @returns Observable of paginated time slots with summary
   *
   * @example
   * // Get all slots with default pagination
   * timeslotService.getMentorSlots(mentorId).subscribe(response => {
   *   console.log(response.data.timeSlots);
   *   console.log(response.data.summary); // { totalSlots, availableSlots, bookedSlots }
   * });
   *
   * @example
   * // Filter by booking status
   * timeslotService.getMentorSlots(mentorId, {
   *   isBooked: false, // Only available slots
   *   page: 1,
   *   pageSize: 20
   * }).subscribe(response => {
   *   console.log(response.data.timeSlots);
   * });
   */
  getMentorSlots(
    mentorId: string,
    params?: GetMentorSlotsParams
  ): Observable<ApiResponse<TimeSlotListResponse>> {
    const url = `${this.apiUrl}/${mentorId}/time-slots`;
    let httpParams = new HttpParams();

    if (params) {
      if (params.startDate) {
        httpParams = httpParams.set('startDate', params.startDate);
      }
      if (params.endDate) {
        httpParams = httpParams.set('endDate', params.endDate);
      }
      if (params.isBooked !== undefined) {
        httpParams = httpParams.set('isBooked', params.isBooked.toString());
      }
      if (params.page) {
        httpParams = httpParams.set('page', params.page.toString());
      }
      if (params.pageSize) {
        httpParams = httpParams.set('pageSize', params.pageSize.toString());
      }
    }

    return this.http.get<ApiResponse<TimeSlotListResponse>>(url, {
      params: httpParams,
    });
  }

  /**
   * Create a single time slot
   *
   * Endpoint: POST /api/mentors/{mentorId}/time-slots
   * Access: Mentor (owner) or Admin
   * Requires: JWT token
   *
   * Validation:
   * - startDateTime must be at least 24 hours in future
   * - durationMinutes must be 30 or 60
   * - No duplicate slots at same time
   *
   * @param mentorId Mentor's GUID
   * @param slot CreateTimeSlot object
   * @returns Observable of created TimeSlot
   *
   * @example
   * timeslotService.createSlot(mentorId, {
   *   startDateTime: '2025-11-25T14:00:00Z',
   *   durationMinutes: 60
   * }).subscribe(response => {
   *   console.log('Slot created:', response.data);
   * });
   */
  createSlot(
    mentorId: string,
    slot: CreateTimeSlot
  ): Observable<ApiResponse<TimeSlot>> {
    const url = `${this.apiUrl}/${mentorId}/time-slots`;
    return this.http.post<ApiResponse<TimeSlot>>(url, slot);
  }

  /**
   * Create multiple time slots in batch (max 50 slots per request)
   *
   * Endpoint: POST /api/mentors/{mentorId}/time-slots
   * Access: Mentor (owner) or Admin
   * Requires: JWT token
   *
   * Batch operation is atomic: all slots are created or none are created.
   * If any slot fails validation, the entire batch is rejected.
   *
   * @param mentorId Mentor's GUID
   * @param slots Array of CreateTimeSlot objects (max 50)
   * @returns Observable of created TimeSlots array
   *
   * @example
   * timeslotService.createBatchSlots(mentorId, [
   *   { startDateTime: '2025-11-25T14:00:00Z', durationMinutes: 60 },
   *   { startDateTime: '2025-11-25T16:00:00Z', durationMinutes: 60 },
   *   { startDateTime: '2025-11-26T14:00:00Z', durationMinutes: 60 }
   * ]).subscribe(response => {
   *   console.log(`Created ${response.data.length} slots`);
   * });
   */
  createBatchSlots(
    mentorId: string,
    slots: CreateTimeSlot[]
  ): Observable<ApiResponse<TimeSlot[]>> {
    const url = `${this.apiUrl}/${mentorId}/time-slots`;
    return this.http.post<ApiResponse<TimeSlot[]>>(url, { slots });
  }

  /**
   * Delete a time slot
   *
   * Endpoint: DELETE /api/mentors/{mentorId}/time-slots/{slotId}
   * Access: Mentor (owner) or Admin
   * Requires: JWT token
   *
   * Constraints:
   * - Can only delete available slots (isBooked = false)
   * - Attempting to delete a booked slot returns 409 Conflict
   *
   * Note: When a session is cancelled, the associated TimeSlot is automatically
   * released (isBooked = false, sessionId = null) by the backend.
   *
   * @param mentorId Mentor's GUID
   * @param slotId TimeSlot's GUID
   * @returns Observable of void (success response has no data)
   *
   * @example
   * timeslotService.deleteSlot(mentorId, slotId).subscribe({
   *   next: () => console.log('Slot deleted successfully'),
   *   error: (err) => {
   *     if (err.status === 409) {
   *       console.error('Cannot delete booked slot');
   *     }
   *   }
   * });
   */
  deleteSlot(
    mentorId: string,
    slotId: string
  ): Observable<ApiResponse<void>> {
    const url = `${this.apiUrl}/${mentorId}/time-slots/${slotId}`;
    return this.http.delete<ApiResponse<void>>(url);
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  /**
   * Helper method to refresh available slots after booking attempt
   * Useful for handling race conditions (409 errors)
   *
   * @param mentorId Mentor's GUID
   * @returns Observable of available slots response
   */
  refreshAvailableSlots(
    mentorId: string
  ): Observable<ApiResponse<AvailableSlotsResponse>> {
    return this.getAvailableSlots(mentorId);
  }

  /**
   * Helper method to check if a specific slot is still available
   * Can be used before submitting booking to reduce race conditions
   *
   * @param mentorId Mentor's GUID
   * @param slotId TimeSlot's GUID
   * @returns Observable of available slots, caller should check if slotId exists
   */
  checkSlotAvailability(
    mentorId: string,
    slotId: string
  ): Observable<ApiResponse<AvailableSlotsResponse>> {
    return this.getAvailableSlots(mentorId);
  }
}
