import { Injectable, inject, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject, Subscription } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import * as signalR from '@microsoft/signalr';
import { AuthService } from './auth.service';
import {
  NotificationDto,
  NotificationType,
  ConnectionState,
  isNotificationDto
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
      // Group membership is automatically restored by the hub on reconnect
      // since we use the same authenticated connection
    });

    // Handle connection closed
    this.hubConnection.onclose((error) => {
      console.log('[SignalR] Connection closed', error);
      this.connectionStateSubject.next(ConnectionState.Disconnected);

      // If not a manual disconnect and user is still authenticated, try to reconnect
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

      // Try to parse the notification - handle both camelCase and PascalCase from backend
      const parsedNotification = this.parseNotification(notification);

      if (parsedNotification) {
        // Deduplication: check if we've already processed this notification
        if (this.processedNotificationIds.has(parsedNotification.id)) {
          console.log('[SignalR] Duplicate notification ignored:', parsedNotification.id);
          return;
        }

        // Mark as processed and schedule cleanup
        this.processedNotificationIds.add(parsedNotification.id);
        setTimeout(() => {
          this.processedNotificationIds.delete(parsedNotification.id);
        }, this.DEDUP_WINDOW_MS);

        console.log('[SignalR] Parsed notification:', parsedNotification);
        this.notificationSubject.next(parsedNotification);
        // Increment unread count for new notifications
        if (!parsedNotification.isRead) {
          const currentCount = this.unreadCountSubject.value || 0;
          const newCount = currentCount + 1;
          console.log('[SignalR] Incrementing unread count to:', newCount);
          this.unreadCountSubject.next(newCount);
        }
      } else {
        console.warn('[SignalR] Invalid notification data received:', notification);
      }
    });

    // Handle unread count updates from server
    this.hubConnection.on('UpdateUnreadCount', (count: number) => {
      console.log('[SignalR] Unread count updated:', count);
      this.unreadCountSubject.next(count);
    });
  }

  /**
   * Parse notification from backend - handles both camelCase and PascalCase
   * Also handles numeric enum values from SignalR
   */
  private parseNotification(data: unknown): NotificationDto | null {
    if (!data || typeof data !== 'object') {
      return null;
    }

    const obj = data as Record<string, unknown>;

    // Handle both camelCase (from JSON serialization) and PascalCase (from SignalR)
    const id = obj['id'] ?? obj['Id'];
    const typeRaw = obj['type'] ?? obj['Type'];
    const title = obj['title'] ?? obj['Title'];
    const message = obj['message'] ?? obj['Message'];
    const isRead = obj['isRead'] ?? obj['IsRead'];
    const createdAt = obj['createdAt'] ?? obj['CreatedAt'];
    const actionUrl = obj['actionUrl'] ?? obj['ActionUrl'];

    // Convert numeric type to string enum value
    const type = this.convertNotificationType(typeRaw);

    // Validate required fields
    if (
      typeof id !== 'string' ||
      !type ||
      typeof title !== 'string' ||
      typeof message !== 'string' ||
      typeof isRead !== 'boolean' ||
      typeof createdAt !== 'string'
    ) {
      console.warn('[SignalR] Notification validation failed:', { id, type, typeRaw, title, message, isRead, createdAt });
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
   * Convert notification type from backend (can be number or string) to NotificationType enum
   */
  private convertNotificationType(typeRaw: unknown): NotificationType | null {
    // Map of numeric values to NotificationType enum values
    // Must match the order in backend NotificationType.cs enum
    const numericTypeMap: Record<number, NotificationType> = {
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

    if (typeof typeRaw === 'number') {
      return numericTypeMap[typeRaw] ?? null;
    }
    return null;
  }

  /**
   * Disconnect from SignalR hub
   */
  async disconnect(): Promise<void> {
    this.isManualDisconnect = true;

    if (this.hubConnection) {
      try {
        await this.hubConnection.stop();
        console.log('[SignalR] Disconnected from notification hub');
      } catch (error) {
        console.error('[SignalR] Error disconnecting:', error);
      }
      this.hubConnection = null;
    }

    this.connectionStateSubject.next(ConnectionState.Disconnected);
  }

  /**
   * Clear local notification state
   */
  private clearLocalState(): void {
    this.unreadCountSubject.next(0);
    this.processedNotificationIds.clear();
  }

  /**
   * Get current connection state
   */
  getConnectionState(): ConnectionState {
    return this.connectionStateSubject.value;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connectionStateSubject.value === ConnectionState.Connected;
  }

  /**
   * Get current unread count
   */
  getUnreadCount(): number {
    return this.unreadCountSubject.value;
  }

  /**
   * Set unread count (used when fetching from API)
   */
  setUnreadCount(count: number): void {
    const validCount = typeof count === 'number' && !isNaN(count) ? count : 0;
    this.unreadCountSubject.next(validCount);
  }

  /**
   * Decrement unread count (used when marking notification as read)
   */
  decrementUnreadCount(): void {
    const current = this.unreadCountSubject.value || 0;
    if (current > 0) {
      this.unreadCountSubject.next(current - 1);
    }
  }

  /**
   * Reset unread count to zero (used when marking all as read)
   */
  resetUnreadCount(): void {
    this.unreadCountSubject.next(0);
  }

  /**
   * Wait for connection to be established
   * Useful for components that need to ensure connection before proceeding
   */
  waitForConnection(): Observable<ConnectionState> {
    return this.connectionState$.pipe(
      filter(state => state === ConnectionState.Connected),
      take(1)
    );
  }
}
