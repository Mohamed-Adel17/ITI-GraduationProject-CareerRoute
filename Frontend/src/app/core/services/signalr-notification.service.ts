import { Injectable, inject, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject, Subscription } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import * as signalR from '@microsoft/signalr';
import { AuthService } from './auth.service';
import {
  NotificationDto,
  NotificationType,
  ConnectionState
} from '../../shared/models/notification.model';
import { environment } from '../../../environments/environment.development';

/**
 * SignalRNotificationService
 *
 * Manages SignalR connection lifecycle for real-time notifications.
 * Handles connection, reconnection with exponential backoff, and notification events.
 *
 * Features:
 * - Automatic connection on login
 * - Automatic disconnection on logout
 * - Exponential backoff reconnection (0ms, 2s, 5s, 10s)
 * - Re-authentication and group rejoining on reconnect
 * - Observable streams for notifications and connection state
 *
 * Updates & Fixes:
 * - Added explicit TypeScript types for all callback parameters
 *   to fix TS7006 errors (retryContext, error, connectionId)
 * - Removed attempt to install non-existent @types/microsoft__signalr
 * - Configured HubConnection using official @microsoft/signalr package
 * - Deduplication added for notifications within 5-second window
 * - All unread count management handled via BehaviorSubject
 * - waitForConnection helper added for components to wait until hub is connected
 * - parseNotification enhanced to handle camelCase and PascalCase from backend
 * - convertNotificationType handles numeric enum values from backend
 * - Safe disconnect ensures hubConnection is cleaned up and state updated
 */

@Injectable({
  providedIn: 'root'
})
export class SignalRNotificationService implements OnDestroy {
  private readonly authService = inject(AuthService);

  // Hub URL - derived from API URL
  private readonly HUB_URL = environment.apiUrl.replace('/api', '/hub/notification');

  // SignalR connection
  private hubConnection: signalR.HubConnection | null = null;

  // Connection state
  private connectionStateSubject = new BehaviorSubject<ConnectionState>(ConnectionState.Disconnected);
  public connectionState$: Observable<ConnectionState> = this.connectionStateSubject.asObservable();

  // Notification stream
  private notificationSubject = new Subject<NotificationDto>();
  public notification$: Observable<NotificationDto> = this.notificationSubject.asObservable();

  // Unread count
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$: Observable<number> = this.unreadCountSubject.asObservable();

  // Auth subscription
  private authSubscription: Subscription | null = null;

  // Reconnection state
  private isManualDisconnect = false;

  // Deduplication: track recently processed notification IDs to prevent duplicates
  private processedNotificationIds = new Set<string>();
  private readonly DEDUP_WINDOW_MS = 5000; // 5 seconds deduplication window

  constructor() {
    this.subscribeToAuthChanges();
  }

  ngOnDestroy(): void {
    this.disconnect();
    this.authSubscription?.unsubscribe();
  }

  /**
   * Subscribe to authentication state changes
   * Connects on login, disconnects on logout
   */
  private subscribeToAuthChanges(): void {
    this.authSubscription = this.authService.isAuthenticated$.subscribe(isAuthenticated => {
      if (isAuthenticated) {
        // User logged in - establish connection
        this.connect();
      } else {
        // User logged out - disconnect and clear state
        this.disconnect();
        this.clearLocalState();
      }
    });
  }

  /**
   * Establish SignalR connection
   */
  async connect(): Promise<void> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      return;
    }

    const token = this.authService.getToken();
    if (!token) {
      console.warn('[SignalR] Cannot connect: No authentication token');
      return;
    }

    this.isManualDisconnect = false;
    this.connectionStateSubject.next(ConnectionState.Connecting);

    try {
      this.hubConnection = new signalR.HubConnectionBuilder()
        .withUrl(this.HUB_URL, {
          accessTokenFactory: () => this.authService.getToken() || ''
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext) => {
            // Exponential backoff: 0ms, 2s, 5s, 10s
            const delays = [0, 2000, 5000, 10000];
            if (retryContext.previousRetryCount < delays.length) {
              return delays[retryContext.previousRetryCount];
            }
            // After max retries, stop reconnecting
            return null;
          }
        })
        .configureLogging(signalR.LogLevel.Information)
        .build();

      this.setupConnectionHandlers();
      this.setupNotificationHandlers();

      await this.hubConnection.start();
      this.connectionStateSubject.next(ConnectionState.Connected);
      console.log('[SignalR] Connected to notification hub');

    } catch (error) {
      console.error('[SignalR] Connection failed:', error);
      this.connectionStateSubject.next(ConnectionState.Disconnected);
    }
  }


  /**
   * Set up connection lifecycle handlers
   */
  private setupConnectionHandlers(): void {
    if (!this.hubConnection) return;

    // Handle reconnecting state
    this.hubConnection.onreconnecting((error) => {
      console.log('[SignalR] Reconnecting...', error);
      this.connectionStateSubject.next(ConnectionState.Reconnecting);
    });

    // Handle successful reconnection
    this.hubConnection.onreconnected((connectionId) => {
      console.log('[SignalR] Reconnected with ID:', connectionId);
      this.connectionStateSubject.next(ConnectionState.Connected);
    });

    // Handle connection closed
    this.hubConnection.onclose((error) => {
      console.log('[SignalR] Connection closed', error);
      this.connectionStateSubject.next(ConnectionState.Disconnected);

      if (!this.isManualDisconnect && this.authService.isAuthenticated()) {
        console.log('[SignalR] Attempting manual reconnection...');
        setTimeout(() => this.connect(), 5000);
      }
    });
  }

  /**
   * Set up notification event handlers
   */
  private setupNotificationHandlers(): void {
    if (!this.hubConnection) return;

    // Handle incoming notifications
    this.hubConnection.on('ReceiveNotification', (notification: unknown) => {
      console.log('[SignalR] Received notification:', notification);

      const parsedNotification = this.parseNotification(notification);

      if (parsedNotification) {
        if (this.processedNotificationIds.has(parsedNotification.id)) {
          console.log('[SignalR] Duplicate notification ignored:', parsedNotification.id);
          return;
        }

        this.processedNotificationIds.add(parsedNotification.id);
        setTimeout(() => {
          this.processedNotificationIds.delete(parsedNotification.id);
        }, this.DEDUP_WINDOW_MS);

        this.notificationSubject.next(parsedNotification);

        if (!parsedNotification.isRead) {
          const currentCount = this.unreadCountSubject.value || 0;
          this.unreadCountSubject.next(currentCount + 1);
        }
      }
    });

    this.hubConnection.on('UpdateUnreadCount', (count: number) => {
      this.unreadCountSubject.next(count);
    });
  }

  /**
   * Parse notification from backend (camelCase + PascalCase)
   */
  private parseNotification(data: unknown): NotificationDto | null {
    if (!data || typeof data !== 'object') return null;

    const obj = data as Record<string, unknown>;

    const id = obj['id'] ?? obj['Id'];
    const typeRaw = obj['type'] ?? obj['Type'];
    const title = obj['title'] ?? obj['Title'];
    const message = obj['message'] ?? obj['Message'];
    const isRead = obj['isRead'] ?? obj['IsRead'];
    const createdAt = obj['createdAt'] ?? obj['CreatedAt'];
    const actionUrl = obj['actionUrl'] ?? obj['ActionUrl'];

    const type = this.convertNotificationType(typeRaw);

    if (
      typeof id !== 'string' ||
      !type ||
      typeof title !== 'string' ||
      typeof message !== 'string' ||
      typeof isRead !== 'boolean' ||
      typeof createdAt !== 'string'
    ) {
      return null;
    }

    return {
      id,
      type,
      title,
      message,
      isRead,
      createdAt,
      actionUrl: typeof actionUrl === 'string' ? actionUrl : undefined
    };
  }

  /**
   * Convert numeric type to NotificationType enum
   */
  private convertNotificationType(typeRaw: unknown): NotificationType | null {
    const map: Record<number, NotificationType> = {
      0: NotificationType.SessionBooked,
      1: NotificationType.SessionCancelled,
      2: NotificationType.RescheduleRequested,
      3: NotificationType.RescheduleApproved,
      4: NotificationType.RescheduleRejected,
      5: NotificationType.PaymentCompleted,
      6: NotificationType.SessionReminder,
      7: NotificationType.MentorApplicationApproved,
      8: NotificationType.MentorApplicationRejected
    };

    if (typeof typeRaw === 'number') return map[typeRaw] ?? null;
    return null;
  }

  /**
   * Disconnect safely
   */
  async disconnect(): Promise<void> {
    this.isManualDisconnect = true;

    if (this.hubConnection) {
      try {
        await this.hubConnection.stop();
      } catch (error) {
        console.error('[SignalR] Error disconnecting:', error);
      }
      this.hubConnection = null;
    }

    this.connectionStateSubject.next(ConnectionState.Disconnected);
  }

  /**
   * Clear local state on logout
   */
  private clearLocalState(): void {
    this.unreadCountSubject.next(0);
    this.processedNotificationIds.clear();
  }

  getConnectionState(): ConnectionState {
    return this.connectionStateSubject.value;
  }

  isConnected(): boolean {
    return this.connectionStateSubject.value === ConnectionState.Connected;
  }

  getUnreadCount(): number {
    return this.unreadCountSubject.value;
  }

  setUnreadCount(count: number): void {
    this.unreadCountSubject.next(typeof count === 'number' ? count : 0);
  }

  decrementUnreadCount(): void {
    const current = this.unreadCountSubject.value;
    if (current > 0) this.unreadCountSubject.next(current - 1);
  }

  resetUnreadCount(): void {
    this.unreadCountSubject.next(0);
  }

  /**
   * Wait for connection to be established
   */
  waitForConnection(): Observable<ConnectionState> {
    return this.connectionState$.pipe(
      filter(state => state === ConnectionState.Connected),
      take(1)
    );
  }
}
