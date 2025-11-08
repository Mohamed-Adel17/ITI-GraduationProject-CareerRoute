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
   * Get CSS classes for notification type (Tailwind border-left color)
   * @param type Notification type
   * @returns CSS class string
   */
  getNotificationClass(type: NotificationType): string {
    switch (type) {
      case NotificationType.Success:
        return 'border-l-4 border-green-600 dark:border-green-500';
      case NotificationType.Error:
        return 'border-l-4 border-red-600 dark:border-red-500';
      case NotificationType.Warning:
        return 'border-l-4 border-yellow-500 dark:border-yellow-400';
      case NotificationType.Info:
        return 'border-l-4 border-cyan-500 dark:border-cyan-400';
      default:
        return 'border-l-4 border-cyan-500 dark:border-cyan-400';
    }
  }

  /**
   * Get Tailwind color class for notification icon
   * @param type Notification type
   * @returns Tailwind color class
   */
  getIconColorClass(type: NotificationType): string {
    switch (type) {
      case NotificationType.Success:
        return 'text-green-600 dark:text-green-500';
      case NotificationType.Error:
        return 'text-red-600 dark:text-red-500';
      case NotificationType.Warning:
        return 'text-yellow-500 dark:text-yellow-400';
      case NotificationType.Info:
        return 'text-cyan-500 dark:text-cyan-400';
      default:
        return 'text-cyan-500 dark:text-cyan-400';
    }
  }

  /**
   * Get Tailwind color class for progress bar
   * @param type Notification type
   * @returns Tailwind background color class
   */
  getProgressBarClass(type: NotificationType): string {
    switch (type) {
      case NotificationType.Success:
        return 'bg-green-600 dark:bg-green-500';
      case NotificationType.Error:
        return 'bg-red-600 dark:bg-red-500';
      case NotificationType.Warning:
        return 'bg-yellow-500 dark:bg-yellow-400';
      case NotificationType.Info:
        return 'bg-cyan-500 dark:bg-cyan-400';
      default:
        return 'bg-cyan-500 dark:bg-cyan-400';
    }
  }

  /**
   * Get Tailwind position classes for notification container
   * @param position Notification position
   * @returns Tailwind positioning class string
   */
  getPositionClass(position?: NotificationPosition): string {
    if (!position) {
      return 'top-0 right-0';
    }

    switch (position) {
      case NotificationPosition.TopRight:
        return 'top-0 right-0';
      case NotificationPosition.TopLeft:
        return 'top-0 left-0';
      case NotificationPosition.TopCenter:
        return 'top-0 left-1/2 -translate-x-1/2';
      case NotificationPosition.BottomRight:
        return 'bottom-0 right-0';
      case NotificationPosition.BottomLeft:
        return 'bottom-0 left-0';
      case NotificationPosition.BottomCenter:
        return 'bottom-0 left-1/2 -translate-x-1/2';
      default:
        return 'top-0 right-0';
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
