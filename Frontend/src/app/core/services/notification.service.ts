import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Represents the type of notification to display
 */
export enum NotificationType {
  Success = 'success',
  Error = 'error',
  Warning = 'warning',
  Info = 'info'
}

/**
 * Represents the position where notifications should appear
 */
export enum NotificationPosition {
  TopRight = 'top-right',
  TopLeft = 'top-left',
  TopCenter = 'top-center',
  BottomRight = 'bottom-right',
  BottomLeft = 'bottom-left',
  BottomCenter = 'bottom-center'
}

/**
 * Represents a single notification
 */
export interface Notification {
  id: string;
  type: NotificationType;
  title?: string;
  message: string;
  duration?: number;
  position?: NotificationPosition;
  dismissible?: boolean;
  timestamp: Date;
  actionUrl?: string;
  /** Whether the notification is clickable (has actionUrl) */
  clickable?: boolean;
}

/**
 * Configuration options for notifications
 */
export interface NotificationConfig {
  duration?: number; // Duration in milliseconds (0 = infinite)
  position?: NotificationPosition;
  dismissible?: boolean;
  maxNotifications?: number;
}

/**
 * Service for managing application-wide notifications and toast messages
 *
 * @description
 * This service provides a centralized way to display toast notifications throughout the application.
 * It supports multiple notification types (success, error, warning, info) with customizable
 * duration, position, and dismissibility.
 *
 * @example
 * ```typescript
 * constructor(private notificationService: NotificationService) {}
 *
 * showSuccess() {
 *   this.notificationService.success('Profile updated successfully!');
 * }
 *
 * showError() {
 *   this.notificationService.error('Failed to save changes', 'Error');
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly DEFAULT_DURATION = 5000; // 5 seconds
  private readonly DEFAULT_POSITION = NotificationPosition.TopRight;
  private readonly DEFAULT_MAX_NOTIFICATIONS = 5;

  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  private config: NotificationConfig = {
    duration: this.DEFAULT_DURATION,
    position: this.DEFAULT_POSITION,
    dismissible: true,
    maxNotifications: this.DEFAULT_MAX_NOTIFICATIONS
  };

  /**
   * Observable stream of current notifications
   */
  public notifications$: Observable<Notification[]> = this.notificationsSubject.asObservable();

  constructor() {}

  /**
   * Configure default notification settings
   * @param config Configuration options
   */
  configure(config: NotificationConfig): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Show a success notification
   * @param message The notification message
   * @param title Optional notification title
   * @param duration Optional custom duration in milliseconds
   */
  success(message: string, title?: string, duration?: number): string {
    return this.show({
      type: NotificationType.Success,
      message,
      title: title || 'Success',
      duration: duration ?? this.config.duration
    });
  }

  /**
   * Show an error notification
   * @param message The notification message
   * @param title Optional notification title
   * @param duration Optional custom duration in milliseconds
   */
  error(message: string, title?: string, duration?: number): string {
    return this.show({
      type: NotificationType.Error,
      message,
      title: title || 'Error',
      duration: duration ?? this.config.duration
    });
  }

  /**
   * Show a warning notification
   * @param message The notification message
   * @param title Optional notification title
   * @param duration Optional custom duration in milliseconds
   */
  warning(message: string, title?: string, duration?: number): string {
    return this.show({
      type: NotificationType.Warning,
      message,
      title: title || 'Warning',
      duration: duration ?? this.config.duration
    });
  }

  /**
   * Show an info notification
   * @param message The notification message
   * @param title Optional notification title
   * @param duration Optional custom duration in milliseconds
   */
  info(message: string, title?: string, duration?: number): string {
    return this.show({
      type: NotificationType.Info,
      message,
      title: title || 'Info',
      duration: duration ?? this.config.duration
    });
  }

  /**
   * Show a custom notification with full control over options
   * @param options Notification options
   * @returns The ID of the created notification
   */
  show(options: {
    type: NotificationType;
    message: string;
    title?: string;
    duration?: number;
    position?: NotificationPosition;
    dismissible?: boolean;
    actionUrl?: string;
  }): string {
    const notification: Notification = {
      id: this.generateId(),
      type: options.type,
      message: options.message,
      title: options.title,
      duration: options.duration ?? this.config.duration,
      position: options.position ?? this.config.position,
      dismissible: options.dismissible ?? this.config.dismissible,
      timestamp: new Date(),
      actionUrl: options.actionUrl,
      clickable: !!options.actionUrl
    };

    const currentNotifications = this.notificationsSubject.value;

    // Enforce max notifications limit
    const maxNotifications = this.config.maxNotifications || this.DEFAULT_MAX_NOTIFICATIONS;
    if (currentNotifications.length >= maxNotifications) {
      // Remove oldest notification
      currentNotifications.shift();
    }

    this.notificationsSubject.next([...currentNotifications, notification]);

    // Auto-dismiss if duration is set
    if (notification.duration && notification.duration > 0) {
      setTimeout(() => {
        this.dismiss(notification.id);
      }, notification.duration);
    }

    return notification.id;
  }

  /**
   * Dismiss a specific notification by ID
   * @param id The notification ID to dismiss
   */
  dismiss(id: string): void {
    const currentNotifications = this.notificationsSubject.value;
    const updatedNotifications = currentNotifications.filter(n => n.id !== id);
    this.notificationsSubject.next(updatedNotifications);
  }

  /**
   * Dismiss all notifications
   */
  dismissAll(): void {
    this.notificationsSubject.next([]);
  }

  /**
   * Get all current notifications
   * @returns Array of current notifications
   */
  getNotifications(): Notification[] {
    return this.notificationsSubject.value;
  }

  /**
   * Get count of current notifications
   * @returns Number of active notifications
   */
  getCount(): number {
    return this.notificationsSubject.value.length;
  }

  /**
   * Generate a unique ID for notifications
   * @private
   */
  private generateId(): string {
    return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
