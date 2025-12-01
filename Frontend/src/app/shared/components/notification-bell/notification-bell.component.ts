import { Component, OnInit, OnDestroy, inject, ElementRef, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { SignalRNotificationService } from '../../../core/services/signalr-notification.service';
import { NotificationApiService } from '../../../core/services/notification-api.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  NotificationDto,
  NotificationType,
  ConnectionState,
  getNotificationIcon,
  getNotificationColor,
  formatNotificationTime
} from '../../models/notification.model';

/**
 * NotificationBellComponent
 *
 * Displays a notification bell icon with unread count badge and dropdown
 * for viewing recent notifications.
 *
 * Features:
 * - Bell icon with unread count badge
 * - Dropdown with recent notifications list
 * - Click to navigate to actionUrl
 * - Mark visible notifications as read when dropdown opens
 * - Real-time updates via SignalR
 *
 */
@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-bell.component.html',
  styleUrls: ['./notification-bell.component.css']
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  private readonly signalRService = inject(SignalRNotificationService);
  private readonly notificationApiService = inject(NotificationApiService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly elementRef = inject(ElementRef);
  private readonly cdr = inject(ChangeDetectorRef);

  // Component state
  isDropdownOpen = false;
  notifications: NotificationDto[] = [];
  unreadCount = 0;
  isLoading = false;
  connectionState: ConnectionState = ConnectionState.Disconnected;

  // Subscriptions
  private subscriptions: Subscription[] = [];

  // Expose helpers to template
  readonly getNotificationIcon = getNotificationIcon;
  readonly getNotificationColor = getNotificationColor;
  readonly formatNotificationTime = formatNotificationTime;
  readonly ConnectionState = ConnectionState;
  protected hasBootstrapIcons:boolean = false;

  ngOnInit(): void {
    this.hasBootstrapIcons = this.checkIconFontLoaded();
    this.subscribeToUnreadCount();
    this.subscribeToConnectionState();
    this.subscribeToNewNotifications();
    this.fetchInitialData();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }


  /**
   * Close dropdown when clicking outside
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const clickedInside = this.elementRef.nativeElement.contains(target);

    if (!clickedInside && this.isDropdownOpen) {
      this.closeDropdown();
    }
  }

  /**
   * Subscribe to unread count updates from SignalR service
   */
  private subscribeToUnreadCount(): void {
    const sub = this.signalRService.unreadCount$.subscribe(count => {
      console.log('[NotificationBell] Unread count updated:', count);
      this.unreadCount = count;
      this.cdr.detectChanges();
    });
    this.subscriptions.push(sub);
  }

  /**
   * Subscribe to connection state changes
   */
  private subscribeToConnectionState(): void {
    const sub = this.signalRService.connectionState$.subscribe(state => {
      console.log('[NotificationBell] Connection state:', state);
      this.connectionState = state;
      this.cdr.detectChanges();
    });
    this.subscriptions.push(sub);
  }

  /**
   * Subscribe to new notifications from SignalR
   */
  private subscribeToNewNotifications(): void {
    const sub = this.signalRService.notification$.subscribe(notification => {
      console.log('[NotificationBell] New notification received:', notification);
      // Add new notification to the top of the list
      this.notifications = [notification, ...this.notifications.slice(0, 9)];
      this.cdr.detectChanges();
    });
    this.subscriptions.push(sub);
  }

  /**
   * Fetch initial unread count from API
   * Always fetches on component init to ensure accurate count from database
   */
  private fetchInitialData(): void {
    // Always fetch unread count from API on init
    this.notificationApiService.getUnreadCount().subscribe({
      next: (response) => {
        // Backend returns 'unreadCount' property (camelCase from UnreadCount)
        const count = response?.unreadCount ?? 0;
        console.log('[NotificationBell] Initial unread count from API:', count);
        this.signalRService.setUnreadCount(count);
      },
      error: (error) => {
        console.error('Failed to fetch unread count:', error);
      }
    });
  }

  /**
   * Toggle dropdown visibility
   */
  toggleDropdown(): void {
    if (this.isDropdownOpen) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  }

  /**
   * Open dropdown and fetch notifications
   */
  private openDropdown(): void {
    this.isDropdownOpen = true;
    this.fetchNotifications();
  }

  /**
   * Close dropdown
   */
  private closeDropdown(): void {
    this.isDropdownOpen = false;
  }

  /**
   * Fetch recent notifications
   */
  private fetchNotifications(): void {
    this.isLoading = true;

    this.notificationApiService.getNotifications(1, 10).subscribe({
      next: (response) => {
        this.notifications = response.items;
        this.isLoading = false;
        // Note: We no longer auto-mark as read when opening dropdown
        // User must click "Mark all as read" button or click individual notifications
      },
      error: (error) => {
        console.error('Failed to fetch notifications:', error);
        this.isLoading = false;
      }
    });
  }

  /**
   * Handle notification click - navigate to actionUrl
   */
  onNotificationClick(notification: NotificationDto): void {
    // Mark as read if not already
    if (!notification.isRead) {
      this.notificationApiService.markAsRead(notification.id).subscribe({
        next: () => {
          notification.isRead = true;
          this.signalRService.decrementUnreadCount();
        },
        error: (error) => {
          console.error('Failed to mark notification as read:', error);
        }
      });
    }

    // Navigate to actionUrl if present
    if (notification.actionUrl) {
      this.closeDropdown();
      this.router.navigateByUrl(notification.actionUrl);
    }
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): void {
    this.notificationApiService.markAllAsRead().subscribe({
      next: () => {
        // Update local state
        this.notifications = this.notifications.map(n => ({ ...n, isRead: true }));
        this.signalRService.resetUnreadCount();
        console.log('[NotificationBell] All notifications marked as read');
      },
      error: (error) => {
        console.error('Failed to mark all as read:', error);
      }
    });
  }

  /**
   * Get display badge count (99+ for large numbers)
   */
  getDisplayCount(): string {
    if (this.unreadCount > 99) {
      return '99+';
    }
    return this.unreadCount.toString();
  }

  /**
   * Check if there are any notifications
   */
  hasNotifications(): boolean {
    return this.notifications.length > 0;
  }

  private checkIconFontLoaded(): boolean {
    // Check if the Bootstrap Icons CSS is loaded
    const styleSheets = Array.from(document.styleSheets);
    return styleSheets.some(sheet => {
      try {
        return sheet.href?.includes('bootstrap-icons');
      } catch (e) {
        return false;
      }
    });
  }
}
