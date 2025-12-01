import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment.development';
import {
  NotificationDto,
  PaginatedNotificationsResponse,
  UnreadCountResponse
} from '../../shared/models/notification.model';
import { ApiResponse, unwrapResponse } from '../../shared/models/api-response.model';

/**
 * NotificationApiService
 *
 * Service for interacting with the notifications REST API endpoints.
 * Handles fetching notifications, marking as read, and getting unread counts.
 *
 * Endpoints:
 * - GET /api/notifications - Get paginated notifications
 * - GET /api/notifications/unread-count - Get unread notification count
 * - PUT /api/notifications/{id}/read - Mark single notification as read
 * - PUT /api/notifications/read-all - Mark all notifications as read
 *
 */
@Injectable({
  providedIn: 'root'
})
export class NotificationApiService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/notifications`;

  /**
   * Get paginated list of notifications for the current user
   *
   * @param page Page number (1-based)
   * @param pageSize Number of items per page
   * @returns Observable of paginated notifications response
   */
  getNotifications(page: number = 1, pageSize: number = 10): Observable<PaginatedNotificationsResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    return this.http.get<ApiResponse<PaginatedNotificationsResponse>>(this.API_URL, { params }).pipe(
      map(response => unwrapResponse(response))
    );
  }

  /**
   * Get the count of unread notifications for the current user
   *
   * @returns Observable of unread count response
   */
  getUnreadCount(): Observable<UnreadCountResponse> {
    return this.http.get<ApiResponse<UnreadCountResponse>>(`${this.API_URL}/unread-count`).pipe(
      map(response => unwrapResponse(response))
    );
  }

  /**
   * Mark a single notification as read
   *
   * @param notificationId ID of the notification to mark as read
   * @returns Observable of void
   */
  markAsRead(notificationId: string): Observable<void> {
    return this.http.put<ApiResponse<void>>(`${this.API_URL}/${notificationId}/read`, {}).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Failed to mark notification as read');
        }
      })
    );
  }

  /**
   * Mark all notifications as read for the current user
   *
   * @returns Observable of void
   */
  markAllAsRead(): Observable<void> {
    return this.http.put<ApiResponse<void>>(`${this.API_URL}/read-all`, {}).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Failed to mark all notifications as read');
        }
      })
    );
  }

  /**
   * Get a single notification by ID
   *
   * @param notificationId ID of the notification
   * @returns Observable of notification DTO
   */
  getNotification(notificationId: string): Observable<NotificationDto> {
    return this.http.get<ApiResponse<NotificationDto>>(`${this.API_URL}/${notificationId}`).pipe(
      map(response => unwrapResponse(response))
    );
  }
}
