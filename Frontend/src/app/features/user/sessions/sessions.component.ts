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
import { SessionPaymentModalComponent } from '../../../shared/components/session-payment-modal/session-payment-modal.component';
import {
  SessionSummary,
  PastSessionItem,
  PaginationMetadata,
  SessionStatus
} from '../../../shared/models/session.model';
import { NotificationType } from '../../../shared/models/notification.model';

/**
 * SessionsComponent
 *
 * Mentee sessions dashboard with tabs for Upcoming and Past sessions.
 * Provides session management capabilities including join, cancel, reschedule, and view details.
 *
 * Features:
 * - Tabbed interface (Upcoming / Past)
 * - Paginated session lists
 * - Session card actions (join, cancel, reschedule, view details)
 * - Loading skeleton states
 * - Empty states for each tab
 * - Payment status indicators
 *
 * @remarks
 * - Requires authentication (User role)
 * - Uses SessionService for all session operations
 * - Error handling done globally by errorInterceptor
 */
@Component({
  selector: 'app-user-sessions',
  standalone: true,
  imports: [CommonModule, RouterModule, SessionCard, CancelModalComponent, RescheduleModalComponent, SessionPaymentModalComponent],
  templateUrl: './sessions.component.html',
  styleUrls: ['./sessions.component.css']
})
export class SessionsComponent implements OnInit, OnDestroy {
  // Tab state
  activeTab: 'upcoming' | 'completed' = 'upcoming';

  // Upcoming sessions state
  upcomingSessions: SessionSummary[] = [];
  upcomingPagination: PaginationMetadata | null = null;
  loadingUpcoming: boolean = false;
  upcomingPage: number = 1;

  // Completed sessions state (renamed from past)
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
  showPaymentModal: boolean = false;
  showPendingCancelConfirm: boolean = false;
  selectedSession: SessionSummary | null = null;
  pendingCancelSessionId: string | null = null;

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
      NotificationType.RescheduleRejected    ];

    const sub = this.signalRNotificationService.notification$.subscribe(notification => {
      if (sessionNotificationTypes.includes(notification.type)) {
        console.log('[UserSessions] Received session notification, refreshing...', notification.type);
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
   * Load cancelled sessions (only paid/confirmed ones that were cancelled)
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
   * Load next page of upcoming sessions
   */
  loadMoreUpcoming(): void {
    if (this.upcomingPagination?.hasNextPage && !this.loadingUpcoming) {
      this.upcomingPage++;
      this.loadUpcomingSessions();
    }
  }

  /**
   * Load next page of completed sessions
   */
  loadMoreCompleted(): void {
    if (this.completedPagination?.hasNextPage && !this.loadingCompleted) {
      this.completedPage++;
      this.loadCompletedSessions();
    }
  }

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
   * Handle cancel session action
   * For pending payment sessions: simple confirmation modal (no refund needed)
   * For confirmed sessions: opens cancel modal with refund info
   */
  onCancelSession(sessionId: string): void {
    const session = this.upcomingSessions.find(s => s.id === sessionId);
    if (!session) return;

    // For pending payment sessions, show simple confirmation modal
    if (session.status === SessionStatus.Pending) {
      this.pendingCancelSessionId = sessionId;
      this.showPendingCancelConfirm = true;
      return;
    }

    // For confirmed sessions, open the cancel modal with refund info
    this.selectedSession = session;
    this.showCancelModal = true;
  }

  /**
   * Confirm cancellation of pending payment session
   */
  confirmPendingCancel(): void {
    if (!this.pendingCancelSessionId) return;

    const sub = this.sessionService.cancelSession(this.pendingCancelSessionId, { reason: 'Session cancelled before payment' }).subscribe({
      next: () => {
        this.notificationService.success('Session cancelled successfully.', 'Cancelled');
        this.closePendingCancelConfirm();
        this.loadUpcomingSessions();
      },
      error: (err) => {
        console.error('Error cancelling session:', err);
        this.closePendingCancelConfirm();
      }
    });
    this.subscriptions.push(sub);
  }

  /**
   * Close pending cancel confirmation modal
   */
  closePendingCancelConfirm(): void {
    this.showPendingCancelConfirm = false;
    this.pendingCancelSessionId = null;
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
    this.router.navigate(['/user/sessions', sessionId]);
  }

  /**
   * Handle view recording action
   * Navigates to session detail page with recording tab
   */
  onViewRecording(sessionId: string): void {
    this.router.navigate(['/user/sessions', sessionId], { queryParams: { tab: 'recording' } });
  }

  /**
   * Handle view transcript action
   * Navigates to session detail page with transcript tab
   */
  onViewTranscript(sessionId: string): void {
    this.router.navigate(['/user/sessions', sessionId], { queryParams: { tab: 'transcript' } });
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

  /**
   * Handle complete payment action
   * Opens payment modal for pending payment session
   */
  onCompletePayment(sessionId: string): void {
    const session = this.upcomingSessions.find(s => s.id === sessionId);
    if (session && session.status === SessionStatus.Pending) {
      this.selectedSession = session;
      this.showPaymentModal = true;
    } else if (session) {
      this.notificationService.error(`Cannot pay for session with status: ${session.status}`);
    }
  }

  /**
   * Handle payment modal close
   */
  onPaymentModalClose(): void {
    this.showPaymentModal = false;
    this.selectedSession = null;
  }

  /**
   * Handle payment success
   */
  onPaymentSuccess(): void {
    this.showPaymentModal = false;
    this.selectedSession = null;
    // Refresh the sessions list to show updated status
    this.loadUpcomingSessions();
    this.notificationService.success(
      'Payment completed successfully! Your session is now confirmed.',
      'Payment Successful'
    );
  }

  /**
   * Handle payment expired (15-minute countdown finished)
   * Refreshes the sessions list to reflect the cancelled session
   */
  onPaymentExpired(sessionId: string): void {
    this.notificationService.warning(
      'Payment time expired. The session has been cancelled.',
      'Session Expired'
    );
    // Refresh after a short delay to allow backend to process
    setTimeout(() => {
      this.loadUpcomingSessions();
    }, 2000);
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
   * Get count of pending payment sessions
   */
  get pendingPaymentCount(): number {
    return this.upcomingSessions.filter(s => s.status === SessionStatus.Pending).length;
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
