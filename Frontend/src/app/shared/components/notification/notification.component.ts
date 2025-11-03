import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { Subscription } from 'rxjs';
import {
  NotificationService,
  Notification,
  NotificationType,
  NotificationPosition
} from '../../../core/services/notification.service';

/**
 * Notification/Toast Component
 *
 * @description
 * Displays toast notifications in various positions on screen.
 * Subscribes to NotificationService to receive and display notifications.
 * Supports multiple notification types with different visual styles.
 *
 * @example
 * Import in app.ts:
 * ```typescript
 * imports: [NotificationComponent, RouterOutlet]
 * ```
 *
 * Add to app.html template:
 * ```html
 * <app-notification></app-notification>
 * <router-outlet></router-outlet>
 * ```
 */
@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.css'],
  animations: [
    trigger('notificationAnimation', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ transform: 'translateX(100%)', opacity: 0 }))
      ])
    ])
  ]
})
export class NotificationComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  private subscription?: Subscription;

  // Expose enums to template
  NotificationType = NotificationType;
  NotificationPosition = NotificationPosition;

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    // Subscribe to notification stream
    this.subscription = this.notificationService.notifications$.subscribe(
      (notifications) => {
        this.notifications = notifications;
      }
    );
  }

  ngOnDestroy(): void {
    // Clean up subscription
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  /**
   * Dismiss a specific notification
   * @param id Notification ID to dismiss
   */
  dismiss(id: string): void {
    this.notificationService.dismiss(id);
  }

  /**
   * Get CSS classes for notification type
   * @param type Notification type
   * @returns CSS class string
   */
  getNotificationClass(type: NotificationType): string {
    switch (type) {
      case NotificationType.Success:
        return 'notification-success';
      case NotificationType.Error:
        return 'notification-error';
      case NotificationType.Warning:
        return 'notification-warning';
      case NotificationType.Info:
        return 'notification-info';
      default:
        return 'notification-info';
    }
  }

  /**
   * Get icon for notification type
   * @param type Notification type
   * @returns Bootstrap icon class
   */
  getNotificationIcon(type: NotificationType): string {
    switch (type) {
      case NotificationType.Success:
        return 'bi bi-check-circle-fill';
      case NotificationType.Error:
        return 'bi bi-exclamation-circle-fill';
      case NotificationType.Warning:
        return 'bi bi-exclamation-triangle-fill';
      case NotificationType.Info:
        return 'bi bi-info-circle-fill';
      default:
        return 'bi bi-info-circle-fill';
    }
  }

  /**
   * Get CSS class for notification position
   * @param position Notification position
   * @returns CSS class string
   */
  getPositionClass(position?: NotificationPosition): string {
    if (!position) {
      return 'notification-container-top-right';
    }

    switch (position) {
      case NotificationPosition.TopRight:
        return 'notification-container-top-right';
      case NotificationPosition.TopLeft:
        return 'notification-container-top-left';
      case NotificationPosition.TopCenter:
        return 'notification-container-top-center';
      case NotificationPosition.BottomRight:
        return 'notification-container-bottom-right';
      case NotificationPosition.BottomLeft:
        return 'notification-container-bottom-left';
      case NotificationPosition.BottomCenter:
        return 'notification-container-bottom-center';
      default:
        return 'notification-container-top-right';
    }
  }

  /**
   * Group notifications by position
   * @returns Map of position to notifications
   */
  getNotificationsByPosition(): Map<NotificationPosition, Notification[]> {
    const grouped = new Map<NotificationPosition, Notification[]>();

    this.notifications.forEach(notification => {
      const position = notification.position || NotificationPosition.TopRight;
      if (!grouped.has(position)) {
        grouped.set(position, []);
      }
      grouped.get(position)!.push(notification);
    });

    return grouped;
  }
}
