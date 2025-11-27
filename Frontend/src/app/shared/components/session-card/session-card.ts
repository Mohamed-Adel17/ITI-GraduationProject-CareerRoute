import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  SessionSummary,
  PastSessionItem,
  SessionStatus,
  SessionDuration,
  formatSessionStatus,
  getSessionStatusColor,
  formatSessionDuration,
  formatSessionDateTime,
  getTimeUntilSession,
  getMentorName,
  getMenteeName
} from '../../models/session.model';

/**
 * SessionCard Component
 *
 * A reusable card component for displaying session information in lists.
 * Adapts display and available actions based on user role (mentee or mentor).
 *
 * Features:
 * - Displays session participant info (mentor for mentee view, mentee for mentor view)
 * - Session status badge with color coding
 * - Date/time and duration display
 * - Countdown for upcoming sessions
 * - Action buttons: Join, Cancel, Reschedule, View Details
 * - Payment status indicator (basic display)
 * - Role-aware action visibility
 *
 * @example
 * ```html
 * <app-session-card
 *   [session]="session"
 *   [userRole]="'mentee'"
 *   (joinSession)="onJoin($event)"
 *   (cancelSession)="onCancel($event)"
 *   (rescheduleSession)="onReschedule($event)"
 *   (viewDetails)="onViewDetails($event)">
 * </app-session-card>
 * ```
 */
@Component({
  selector: 'app-session-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './session-card.html',
  styleUrl: './session-card.css'
})
export class SessionCard {
  /**
   * Session data to display
   */
  @Input({ required: true }) session!: SessionSummary | PastSessionItem;

  /**
   * Current user's role determines what info and actions are shown
   */
  @Input() userRole: 'mentee' | 'mentor' = 'mentee';

  /**
   * Whether to show action buttons
   */
  @Input() showActions: boolean = true;

  /**
   * Emitted when user clicks Join Session button
   */
  @Output() joinSession = new EventEmitter<string>();

  /**
   * Emitted when user clicks Cancel Session button
   */
  @Output() cancelSession = new EventEmitter<string>();

  /**
   * Emitted when user clicks Reschedule button
   */
  @Output() rescheduleSession = new EventEmitter<string>();

  /**
   * Emitted when user clicks View Details button
   */
  @Output() viewDetails = new EventEmitter<string>();

  /**
   * Emitted when mentor clicks Complete Session button
   */
  @Output() completeSession = new EventEmitter<string>();

  /**
   * Emitted when user clicks Complete Payment button (for pending payment sessions)
   */
  @Output() completePayment = new EventEmitter<string>();

  // Expose enums to template
  SessionStatus = SessionStatus;

  /**
   * Get the other participant's name based on user role
   */
  get participantName(): string {
    if (this.userRole === 'mentee') {
      return `${this.session.mentorFirstName} ${this.session.mentorLastName}`;
    } else {
      return `${this.session.menteeFirstName} ${this.session.menteeLastName}`;
    }
  }

  /**
   * Get participant label (Mentor/Mentee)
   */
  get participantLabel(): string {
    return this.userRole === 'mentee' ? 'Mentor' : 'Mentee';
  }

  /**
   * Get profile picture URL or generate default avatar
   */
  get participantAvatar(): string {
    const profileUrl = this.userRole === 'mentee'
      ? this.session.mentorProfilePictureUrl
      : (this.session as SessionSummary).menteeProfilePictureUrl;

    if (profileUrl) {
      return profileUrl;
    }

    // Generate placeholder avatar with initials
    const initials = this.getParticipantInitials();
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=100&background=1193d4&color=fff`;
  }

  /**
   * Get initials for avatar fallback
   */
  private getParticipantInitials(): string {
    if (this.userRole === 'mentee') {
      return `${this.session.mentorFirstName?.charAt(0) || ''}${this.session.mentorLastName?.charAt(0) || ''}`.toUpperCase() || 'M';
    } else {
      return `${this.session.menteeFirstName?.charAt(0) || ''}${this.session.menteeLastName?.charAt(0) || ''}`.toUpperCase() || 'U';
    }
  }

  /**
   * Get formatted session status for display
   */
  get statusText(): string {
    return formatSessionStatus(this.session.status);
  }

  /**
   * Get status badge color class
   */
  get statusColorClass(): string {
    const color = getSessionStatusColor(this.session.status);
    const colorMap: Record<string, string> = {
      'yellow': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'green': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'blue': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'gray': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
      'red': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'orange': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'purple': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    };
    return colorMap[color] || colorMap['gray'];
  }

  /**
   * Get formatted date and time
   */
  get formattedDateTime(): string {
    return formatSessionDateTime(this.session.scheduledStartTime);
  }

  /**
   * Get formatted duration
   */
  get formattedDuration(): string {
    return formatSessionDuration(this.session.duration);
  }

  /**
   * Get time until session (countdown)
   */
  get timeUntil(): string {
    const hoursUntil = (this.session as SessionSummary).hoursUntilSession;
    return getTimeUntilSession(hoursUntil);
  }

  /**
   * Check if session is upcoming (shows countdown)
   */
  get isUpcoming(): boolean {
    return this.session.status === SessionStatus.Confirmed ||
           this.session.status === SessionStatus.Pending ||
           this.session.status === SessionStatus.PendingReschedule;
  }

  /**
   * Check if session is past
   */
  get isPast(): boolean {
    return this.session.status === SessionStatus.Completed ||
           this.session.status === SessionStatus.Cancelled;
  }

  /**
   * Check if session can be joined
   * Can join 15 minutes before to 15 minutes after scheduled end time
   */
  get canJoin(): boolean {
    if (this.session.status !== SessionStatus.Confirmed &&
        this.session.status !== SessionStatus.InProgress) {
      return false;
    }

    const now = new Date();
    const startTime = new Date(this.session.scheduledStartTime);
    const minutesUntilStart = (startTime.getTime() - now.getTime()) / (1000 * 60);

    // Can join 15 minutes before start
    return minutesUntilStart <= 15;
  }

  /**
   * Check if session can be cancelled
   */
  get canCancel(): boolean {
    return this.session.status === SessionStatus.Confirmed ||
           this.session.status === SessionStatus.Pending ||
           this.session.status === SessionStatus.PendingReschedule;
  }

  /**
   * Check if session can be rescheduled
   * Must be >24 hours before scheduled start time
   */
  get canReschedule(): boolean {
    if (this.session.status !== SessionStatus.Confirmed) {
      return false;
    }

    const now = new Date();
    const startTime = new Date(this.session.scheduledStartTime);
    const hoursUntil = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    return hoursUntil > 24;
  }

  /**
   * Check if mentor can mark session as complete
   */
  get canComplete(): boolean {
    return this.userRole === 'mentor' &&
           this.session.status === SessionStatus.InProgress;
  }

  /**
   * Check if session has a review (for past sessions)
   */
  get hasReview(): boolean {
    return (this.session as PastSessionItem).hasReview ?? false;
  }

  /**
   * Check if session is pending payment
   */
  get isPendingPayment(): boolean {
    return this.session.status === SessionStatus.Pending;
  }

  /**
   * Get topic display text
   */
  get topicText(): string {
    return this.session.topic || 'No topic specified';
  }

  // Event handlers
  onJoinClick(): void {
    this.joinSession.emit(this.session.id);
  }

  onCancelClick(): void {
    this.cancelSession.emit(this.session.id);
  }

  onRescheduleClick(): void {
    this.rescheduleSession.emit(this.session.id);
  }

  onViewDetailsClick(): void {
    this.viewDetails.emit(this.session.id);
  }

  onCompleteClick(): void {
    this.completeSession.emit(this.session.id);
  }

  onCompletePaymentClick(): void {
    this.completePayment.emit(this.session.id);
  }
}
