// ===========================
// Enums
// ===========================

export enum NotificationType {
  SessionBooked = 'SessionBooked',
  SessionCancelled = 'SessionCancelled',
  RescheduleRequested = 'RescheduleRequested',
  RescheduleApproved = 'RescheduleApproved',
  RescheduleRejected = 'RescheduleRejected',
  PaymentCompleted = 'PaymentCompleted',
  SessionReminder = 'SessionReminder',
  MentorApplicationApproved = 'MentorApplicationApproved',
  MentorApplicationRejected = 'MentorApplicationRejected'
}

/**
 * SignalR Connection State Enum
 * Represents the current state of the SignalR connection
 */
export enum ConnectionState {
  Disconnected = 'Disconnected',
  Connecting = 'Connecting',
  Connected = 'Connected',
  Reconnecting = 'Reconnecting'
}

// ===========================
// Core Interfaces
// ===========================

/**
 * NotificationDto Interface
 * Represents a notification received from the backend API or SignalR hub
 * Matches the backend NotificationDto structure
 *
 */
export interface NotificationDto {
  /** Unique identifier for the notification */
  id: string;

  /** Type/category of the notification */
  type: NotificationType;

  /** Notification title for display */
  title: string;

  /** Notification message content */
  message: string;

  /** Whether the notification has been read by the user */
  isRead: boolean;

  /** ISO 8601 datetime string when the notification was created (UTC) */
  createdAt: string;

  /** Optional URL to navigate to when notification is clicked */
  actionUrl?: string;
}

/**
 * Paginated Notifications Response
 * Response structure for GET /api/notifications endpoint
 */
export interface PaginatedNotificationsResponse {
  /** Array of notifications for the current page */
  items: NotificationDto[];

  /** Total number of notifications */
  totalCount: number;

  /** Current page number (1-based) */
  currentPage: number;

  /** Number of items per page */
  pageSize: number;

  /** Total number of pages */
  totalPages: number;

  /** Whether there is a next page */
  hasNextPage: boolean;

  /** Whether there is a previous page */
  hasPreviousPage: boolean;
}

/**
 * Unread Count Response
 * Response structure for GET /api/notifications/unread-count endpoint
 * Backend returns 'unreadCount' property (camelCase from UnreadCount)
 */
export interface UnreadCountResponse {
  /** Number of unread notifications */
  unreadCount: number;
}

// ===========================
// Helper Functions
// ===========================

/**
 * Get display icon class for notification type
 * @param type Notification type
 * @returns Bootstrap icon class name
 */
export function getNotificationIcon(type: NotificationType): string {
  const iconMap: Record<NotificationType, string> = {
    [NotificationType.SessionBooked]: 'bi-calendar-check',
    [NotificationType.SessionCancelled]: 'bi-calendar-x',
    [NotificationType.RescheduleRequested]: 'bi-calendar-event',
    [NotificationType.RescheduleApproved]: 'bi-calendar2-check',
    [NotificationType.RescheduleRejected]: 'bi-calendar2-x',
    [NotificationType.PaymentCompleted]: 'bi-credit-card-2-front',
    [NotificationType.SessionReminder]: 'bi-alarm',
    [NotificationType.MentorApplicationApproved]: 'bi-person-check',
    [NotificationType.MentorApplicationRejected]: 'bi-person-x'
  };
  return iconMap[type] || 'bi-bell';
}

/**
 * Get display color class for notification type
 * @param type Notification type
 * @returns Tailwind/Bootstrap color class
 */
export function getNotificationColor(type: NotificationType): string {
  const colorMap: Record<NotificationType, string> = {
    [NotificationType.SessionBooked]: 'text-green-600',
    [NotificationType.SessionCancelled]: 'text-red-600',
    [NotificationType.RescheduleRequested]: 'text-yellow-600',
    [NotificationType.RescheduleApproved]: 'text-green-600',
    [NotificationType.RescheduleRejected]: 'text-red-600',
    [NotificationType.PaymentCompleted]: 'text-blue-600',
    [NotificationType.SessionReminder]: 'text-orange-500',
    [NotificationType.MentorApplicationApproved]: 'text-green-600',
    [NotificationType.MentorApplicationRejected]: 'text-red-600'
  };
  return colorMap[type] || 'text-gray-600';
}

/**
 * Format notification timestamp for display
 * @param isoString ISO 8601 datetime string
 * @returns Human-readable relative time string
 */
export function formatNotificationTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }
}

/**
 * Type guard to check if object is a valid NotificationDto
 * @param obj Object to check
 * @returns True if object is a valid NotificationDto
 */
export function isNotificationDto(obj: any): obj is NotificationDto {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.type === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.message === 'string' &&
    typeof obj.isRead === 'boolean' &&
    typeof obj.createdAt === 'string'
  );
}

/**
 * Parse notification type from string
 * @param typeString String representation of notification type
 * @returns NotificationType enum value or undefined if invalid
 */
export function parseNotificationType(typeString: string): NotificationType | undefined {
  const values = Object.values(NotificationType);
  return values.find(v => v === typeString);
}
