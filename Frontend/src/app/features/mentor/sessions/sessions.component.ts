import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { SessionService } from '../../../core/services/session.service';
import { NotificationService } from '../../../core/services/notification.service';
import { SignalRNotificationService } from '../../../core/services/signalr-notification.service';
import { SessionCard } from '../../../shared/components/session-card/session-card';
import { CancelModalComponent } from '../../../shared/components/cancel-modal/cancel-modal.component';
import { RescheduleModalComponent } from '../../../shared/components/reschedule-modal/reschedule-modal.component';
import {
  SessionSummary,
  PastSessionItem,
  PaginationMetadata,
  SessionStatus
} from '../../../shared/models/session.model';
import { NotificationType } from '../../../shared/models/notification.model';

/**
 * MentorSessionsComponent
 *
 * Mentor sessions dashboard with tabs for Upcoming and Past sessions.
 * Provides session management capabilities including join, cancel, reschedule,
 * complete session, and approve/reject reschedule requests.
 *
 * Features:
 * - Tabbed interface (Upcoming / Past)
 * - Paginated session lists
 * - Session card actions (join, cancel, reschedule, complete, view details)
 * - Reschedule request management
 * - Loading skeleton states
 * - Empty states for each tab
 *
 * @remarks
 * - Requires authentication (Mentor role with approved status)
 * - Uses SessionService for all session operations
 * - Error handling done globally by errorInterceptor
 */
@Component({
  selector: 'app-mentor-sessions',
  standalone: true,
  imports: [CommonModule, RouterModule, SessionCard, CancelModalComponent, RescheduleModalComponent],
  templateUrl: './sessions.component.html',
  styleUrls: ['./sessions.component.css']
})
export class MentorSessionsComponent implements OnInit, OnDestroy {
  // Tab state
  activeTab: 'upcoming' | 'completed' = 'upcoming';

  // Upcoming sessions state
  upcomingSessions: SessionSummary[] = [];
  upcomingPagination: PaginationMetadata | null = null;
  loadingUpcoming: boolean = false;
  upcomingPage: number = 1;

  // Completed sessions state
  completedSessions: PastSessionItem[] = [];
  completedPagination: PaginationMetadata | null = null;
  loadingCompleted: boolean = false;
  completedPage: number = 1;

  // Cancelled sessions state (for modal)
  cancelledSessions: PastSessionItem[] = [];
  cancelledPagination: PaginationMetadata | null = null;
  loadingCancelled: boolean = false;
  cancelledPage: number = 1;
  showCancelledModal: boolean = false;

  // General state
  pageSize: number = 10;

  // Modal state
  showCancelModal: boolean = false;
  showRescheduleModal: boolean = false;
  selectedSession: SessionSummary | null = null;

  private subscriptions: Subscription[] = [];

  constructor(
    private sessionService: SessionService,
    private notificationService: NotificationService,
    private signalRNotificationService: SignalRNotificationService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Load initial data for the active tab
    this.loadUpcomingSessions();

    // Subscribe to session-related notifications to auto-refresh
    this.subscribeToSessionNotifications();
  }

  /**
   * Subscribe to session-related notifications to auto-refresh the sessions list
   */
  private subscribeToSessionNotifications(): void {
    const sessionNotificationTypes = [
      NotificationType.SessionBooked,
      NotificationType.SessionCancelled,
      NotificationType.RescheduleRequested,
      NotificationType.RescheduleApproved,
      NotificationType.RescheduleRejected
    ];

    const sub = this.signalRNotificationService.notification$.subscribe(notification => {
      if (sessionNotificationTypes.includes(notification.type)) {
        console.log('[MentorSessions] Received session notification, refreshing...', notification.type);
        // Refresh the current tab's data
        this.refresh();
      }
    });

    this.subscriptions.push(sub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // ==========================================================================
  // TAB NAVIGATION
  // ==========================================================================

  /**
   * Switch between tabs and load data if needed
   */
  switchTab(tab: 'upcoming' | 'completed'): void {
    if (this.activeTab === tab) return;

    this.activeTab = tab;

    // Load data for the tab if not already loaded
    if (tab === 'upcoming' && this.upcomingSessions.length === 0 && !this.loadingUpcoming) {
      this.loadUpcomingSessions();
    } else if (tab === 'completed' && this.completedSessions.length === 0 && !this.loadingCompleted) {
      this.loadCompletedSessions();
    }
  }

  // ==========================================================================
  // DATA LOADING
  // ==========================================================================

  /**
   * Load upcoming sessions
   */
  loadUpcomingSessions(): void {
    this.loadingUpcoming = true;

    const sub = this.sessionService.getUpcomingSessions(this.upcomingPage, this.pageSize).subscribe({
      next: (response) => {
        this.upcomingSessions = response.sessions;
        this.upcomingPagination = response.pagination;
        this.loadingUpcoming = false;
      },
      error: (err) => {
        this.loadingUpcoming = false;
        // 404 means no sessions found - not an error, just empty state
        if (err.status === 404) {
          this.upcomingSessions = [];
          this.upcomingPagination = null;
        }
        console.error('Error loading upcoming sessions:', err);
      }
    });

    this.subscriptions.push(sub);
  }

  /**
   * Load completed sessions (only Completed status, not Cancelled)
   */
  loadCompletedSessions(): void {
    this.loadingCompleted = true;

    const sub = this.sessionService.getPastSessions(this.completedPage, this.pageSize).subscribe({
      next: (response) => {
        // Filter to only show Completed sessions (not Cancelled)
        this.completedSessions = response.sessions.filter(s => s.status === SessionStatus.Completed);
        this.completedPagination = response.pagination;
        this.loadingCompleted = false;
      },
      error: (err) => {
        this.loadingCompleted = false;
        // 404 means no sessions found - not an error, just empty state
        if (err.status === 404) {
          this.completedSessions = [];
          this.completedPagination = null;
        }
        console.error('Error loading completed sessions:', err);
      }
    });

    this.subscriptions.push(sub);
  }

  /**
   * Load cancelled sessions (for modal)
   */
  loadCancelledSessions(): void {
    this.loadingCancelled = true;

    const sub = this.sessionService.getPastSessions(this.cancelledPage, this.pageSize).subscribe({
      next: (response) => {
        // Filter to only show Cancelled sessions
        this.cancelledSessions = response.sessions.filter(s => s.status === SessionStatus.Cancelled);
        this.cancelledPagination = response.pagination;
        this.loadingCancelled = false;
      },
      error: (err) => {
        this.loadingCancelled = false;
        if (err.status === 404) {
          this.cancelledSessions = [];
          this.cancelledPagination = null;
        }
        console.error('Error loading cancelled sessions:', err);
      }
    });

    this.subscriptions.push(sub);
  }

  /**
   * Open cancelled sessions modal
   */
  openCancelledModal(): void {
    this.showCancelledModal = true;
    if (this.cancelledSessions.length === 0 && !this.loadingCancelled) {
      this.loadCancelledSessions();
    }
  }

  /**
   * Close cancelled sessions modal
   */
  closeCancelledModal(): void {
    this.showCancelledModal = false;
  }

  // ==========================================================================
  // PAGINATION
  // ==========================================================================

  /**
   * Go to specific page for upcoming sessions
   */
  goToUpcomingPage(page: number): void {
    this.upcomingPage = page;
    this.loadUpcomingSessions();
  }

  /**
   * Go to specific page for completed sessions
   */
  goToCompletedPage(page: number): void {
    this.completedPage = page;
    this.loadCompletedSessions();
  }

  // ==========================================================================
  // SESSION ACTIONS
  // ==========================================================================

  /**
   * Handle join session action
   */
  onJoinSession(sessionId: string): void {
    const sub = this.sessionService.joinSession(sessionId).subscribe({
      next: (response) => {
        if (response.videoConferenceLink) {
          // Open video link in new tab
          window.open(response.videoConferenceLink, '_blank');
          this.notificationService.success(
            'Joining session...',
            'Session Started'
          );
        } else {
          this.notificationService.warning(
            'Video conference link is not available yet',
            'Link Unavailable'
          );
        }
      },
      error: (err) => {
        console.error('Error joining session:', err);
      }
    });

    this.subscriptions.push(sub);
  }

  /**
   * Handle complete session action (Mentor only)
   */
  onCompleteSession(sessionId: string): void {
    // TODO: Open complete session confirmation modal
    // For now, call the API directly with confirmation
    if (confirm('Are you sure you want to mark this session as completed?')) {
      const sub = this.sessionService.completeSession(sessionId).subscribe({
        next: (response) => {
          this.notificationService.success(
            'Session marked as completed. Payment will be released in 72 hours.',
            'Session Completed'
          );
          // Refresh the sessions list
          this.loadUpcomingSessions();
        },
        error: (err) => {
          console.error('Error completing session:', err);
        }
      });

      this.subscriptions.push(sub);
    }
  }

  /**
   * Handle cancel session action
   * Opens cancel confirmation modal
   */
  onCancelSession(sessionId: string): void {
    // Find the session to get its details for the modal
    const session = this.upcomingSessions.find(s => s.id === sessionId);
    if (session) {
      this.selectedSession = session;
      this.showCancelModal = true;
    }
  }

  /**
   * Handle reschedule session action
   * Opens reschedule modal
   */
  onRescheduleSession(sessionId: string): void {
    // Find the session to get its details for the modal
    const session = this.upcomingSessions.find(s => s.id === sessionId);
    if (session) {
      this.selectedSession = session;
      this.showRescheduleModal = true;
    }
  }

  /**
   * Handle view details action
   * Navigates to session detail page
   */
  onViewDetails(sessionId: string): void {
    this.router.navigate(['/mentor/sessions', sessionId]);
  }

  /**
   * Handle view recording action
   * Navigates to session detail page with recording tab
   */
  onViewRecording(sessionId: string): void {
    this.router.navigate(['/mentor/sessions', sessionId], { queryParams: { tab: 'recording' } });
  }

  /**
   * Handle view transcript action
   * Navigates to session detail page with transcript tab
   */
  onViewTranscript(sessionId: string): void {
    this.router.navigate(['/mentor/sessions', sessionId], { queryParams: { tab: 'transcript' } });
  }

  /**
   * Handle cancel modal close
   */
  onCancelModalClose(): void {
    this.showCancelModal = false;
    this.selectedSession = null;
  }

  /**
   * Handle cancel success
   */
  onCancelSuccess(): void {
    this.showCancelModal = false;
    this.selectedSession = null;
    // Refresh the sessions list
    this.loadUpcomingSessions();
  }

  /**
   * Handle reschedule modal close
   */
  onRescheduleModalClose(): void {
    this.showRescheduleModal = false;
    this.selectedSession = null;
  }

  /**
   * Handle reschedule success
   */
  onRescheduleSuccess(): void {
    this.showRescheduleModal = false;
    this.selectedSession = null;
    // Refresh the sessions list
    this.loadUpcomingSessions();
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  /**
   * Track sessions by ID for ngFor optimization
   */
  trackBySessionId(index: number, session: SessionSummary | PastSessionItem): string {
    return session.id;
  }

  /**
   * Check if there are any upcoming sessions
   */
  hasUpcomingSessions(): boolean {
    return this.upcomingSessions.length > 0;
  }

  /**
   * Check if there are any completed sessions
   */
  hasCompletedSessions(): boolean {
    return this.completedSessions.length > 0;
  }

  /**
   * Check if there are any cancelled sessions
   */
  hasCancelledSessions(): boolean {
    return this.cancelledSessions.length > 0;
  }

  /**
   * Get count of in-progress sessions
   */
  get inProgressCount(): number {
    return this.upcomingSessions.filter(s => s.status === SessionStatus.InProgress).length;
  }

  /**
   * Get count of pending reschedule sessions
   */
  get pendingRescheduleCount(): number {
    return this.upcomingSessions.filter(s => s.status === SessionStatus.PendingReschedule).length;
  }

  /**
   * Refresh current tab data
   */
  refresh(): void {
    if (this.activeTab === 'upcoming') {
      this.upcomingPage = 1;
      this.loadUpcomingSessions();
    } else {
      this.completedPage = 1;
      this.loadCompletedSessions();
    }
  }
}
