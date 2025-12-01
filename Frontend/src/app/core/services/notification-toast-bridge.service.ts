import { Injectable, inject, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { SignalRNotificationService } from './signalr-notification.service';
import { AuthService } from './auth.service';
import { NotificationService, NotificationType as ToastType } from './notification.service';
import { NotificationDto, NotificationType } from '../../shared/models/notification.model';

/**
 * NotificationToastBridgeService
 *
 * Bridges SignalR real-time notifications to toast notifications.
 * Handles queuing of simultaneous notifications and click navigation.
 *
 * Features:
 * - Subscribes to SignalR notification$ stream
 * - Displays notifications as toasts using NotificationService
 * - Queues notifications and displays sequentially with delay
 * - Supports click navigation to actionUrl
 * - Clears queue on logout to prevent stale notifications
 *
 */
@Injectable({
  providedIn: 'root'
})
export class NotificationToastBridgeService implements OnDestroy {
  private readonly signalRService = inject(SignalRNotificationService);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(NotificationService);
  private readonly router = inject(Router);

  // Subscription management
  private notificationSubscription: Subscription | null = null;
  private authSubscription: Subscription | null = null;

  // Notification queue for sequential display
  private notificationQueue: NotificationDto[] = [];
  private isProcessingQueue = false;
  private readonly QUEUE_DELAY_MS = 500; // Delay between sequential notifications

  // Click handler subject - maps toast ID to notification
  private activeToasts = new Map<string, NotificationDto>();

  // Flag to prevent processing during logout
  private isActive = false;

  constructor() {
    this.initialize();
  }

  ngOnDestroy(): void {
    this.notificationSubscription?.unsubscribe();
    this.authSubscription?.unsubscribe();
    this.activeToasts.clear();
    this.clearQueue();
  }

  /**
   * Initialize the bridge by subscribing to SignalR notifications and auth state
   */
  private initialize(): void {
    // Subscribe to auth state to activate/deactivate on login/logout
    this.authSubscription = this.authService.isAuthenticated$.subscribe(isAuthenticated => {
      if (isAuthenticated) {
        this.isActive = true;
      } else {
        // User logged out - clear queue and deactivate
        this.isActive = false;
        this.clearQueue();
      }
    });

    // Subscribe to SignalR notifications
    this.notificationSubscription = this.signalRService.notification$.subscribe(notification => {
      // Only queue notifications when user is authenticated
      if (this.isActive) {
        this.queueNotification(notification);
      }
    });
  }

  /**
   * Clear the notification queue
   * Called on logout to prevent stale notifications from appearing
   */
  private clearQueue(): void {
    this.notificationQueue = [];
    this.isProcessingQueue = false;
    this.activeToasts.clear();
  }


  /**
   * Add notification to queue and start processing
   */
  private queueNotification(notification: NotificationDto): void {
    this.notificationQueue.push(notification);

    if (!this.isProcessingQueue) {
      this.processQueue();
    }
  }

  /**
   * Process notification queue sequentially
   */
  private async processQueue(): Promise<void> {
    this.isProcessingQueue = true;

    while (this.notificationQueue.length > 0 && this.isActive) {
      const notification = this.notificationQueue.shift();
      if (notification && this.isActive) {
        this.displayToast(notification);

        // Wait before showing next notification if queue has more items
        if (this.notificationQueue.length > 0 && this.isActive) {
          await this.delay(this.QUEUE_DELAY_MS);
        }
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Display a notification as a toast
   */
  private displayToast(notification: NotificationDto): void {
    const toastType = this.mapNotificationTypeToToastType(notification.type);
    const toastId = this.toastService.show({
      type: toastType,
      title: notification.title,
      message: notification.message,
      duration: 6000, // 6 seconds for real-time notifications
      dismissible: true,
      actionUrl: notification.actionUrl // Pass actionUrl for click navigation
    });

    // Store mapping for click navigation
    if (notification.actionUrl) {
      this.activeToasts.set(toastId, notification);
    }
  }

  /**
   * Map SignalR NotificationType to toast NotificationType
   */
  private mapNotificationTypeToToastType(type: NotificationType): ToastType {
    switch (type) {
      case NotificationType.SessionBooked:
      case NotificationType.RescheduleApproved:
      case NotificationType.PaymentCompleted:
      case NotificationType.MentorApplicationApproved:
        return ToastType.Success;

      case NotificationType.SessionCancelled:
      case NotificationType.RescheduleRejected:
      case NotificationType.MentorApplicationRejected:
        return ToastType.Error;

      case NotificationType.RescheduleRequested:
      case NotificationType.SessionReminder:
        return ToastType.Warning;

      default:
        return ToastType.Info;
    }
  }

  /**
   * Navigate to notification action URL
   */
  navigateToAction(toastId: string): void {
    const notification = this.activeToasts.get(toastId);
    if (notification?.actionUrl) {
      this.toastService.dismiss(toastId);
      this.activeToasts.delete(toastId);
      this.router.navigateByUrl(notification.actionUrl);
    }
  }

  /**
   * Get notification for a toast ID (for click handling)
   */
  getNotificationForToast(toastId: string): NotificationDto | undefined {
    return this.activeToasts.get(toastId);
  }

  /**
   * Check if a toast has an action URL
   */
  hasActionUrl(toastId: string): boolean {
    return this.activeToasts.has(toastId);
  }

  /**
   * Clean up toast mapping when dismissed
   */
  onToastDismissed(toastId: string): void {
    this.activeToasts.delete(toastId);
  }

  /**
   * Get current queue length (for testing)
   */
  getQueueLength(): number {
    return this.notificationQueue.length;
  }

  /**
   * Helper to create a delay promise
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
