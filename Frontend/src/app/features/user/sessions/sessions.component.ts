import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { SessionService } from '../../../core/services/session.service';
import { NotificationService } from '../../../core/services/notification.service';
import { SessionCard } from '../../../shared/components/session-card/session-card';
import { CancelModalComponent } from '../../../shared/components/cancel-modal/cancel-modal.component';
import { RescheduleModalComponent } from '../../../shared/components/reschedule-modal/reschedule-modal.component';
import {
  SessionSummary,
  PastSessionItem,
  PaginationMetadata,
  SessionStatus
} from '../../../shared/models/session.model';

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
  imports: [CommonModule, SessionCard, CancelModalComponent, RescheduleModalComponent],
  templateUrl: './sessions.component.html',
  styleUrls: ['./sessions.component.css']
})
export class SessionsComponent implements OnInit, OnDestroy {
  // Tab state
  activeTab: 'upcoming' | 'past' = 'upcoming';

  // Upcoming sessions state
  upcomingSessions: SessionSummary[] = [];
  upcomingPagination: PaginationMetadata | null = null;
  loadingUpcoming: boolean = false;
  upcomingPage: number = 1;

  // Past sessions state
  pastSessions: PastSessionItem[] = [];
  pastPagination: PaginationMetadata | null = null;
  loadingPast: boolean = false;
  pastPage: number = 1;

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
    private router: Router
  ) { }

  ngOnInit(): void {
    // Load initial data for the active tab
    this.loadUpcomingSessions();
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
  switchTab(tab: 'upcoming' | 'past'): void {
    if (this.activeTab === tab) return;

    this.activeTab = tab;

    // Load data for the tab if not already loaded
    if (tab === 'upcoming' && this.upcomingSessions.length === 0 && !this.loadingUpcoming) {
      this.loadUpcomingSessions();
    } else if (tab === 'past' && this.pastSessions.length === 0 && !this.loadingPast) {
      this.loadPastSessions();
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
   * Load past sessions
   */
  loadPastSessions(): void {
    this.loadingPast = true;

    const sub = this.sessionService.getPastSessions(this.pastPage, this.pageSize).subscribe({
      next: (response) => {
        this.pastSessions = response.sessions;
        this.pastPagination = response.pagination;
        this.loadingPast = false;
      },
      error: (err) => {
        this.loadingPast = false;
        // 404 means no sessions found - not an error, just empty state
        if (err.status === 404) {
          this.pastSessions = [];
          this.pastPagination = null;
        }
        console.error('Error loading past sessions:', err);
      }
    });

    this.subscriptions.push(sub);
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
   * Load next page of past sessions
   */
  loadMorePast(): void {
    if (this.pastPagination?.hasNextPage && !this.loadingPast) {
      this.pastPage++;
      this.loadPastSessions();
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
   * Go to specific page for past sessions
   */
  goToPastPage(page: number): void {
    this.pastPage = page;
    this.loadPastSessions();
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
   * Handle complete payment action
   * Navigates to payment page for pending session
   */
  onCompletePayment(sessionId: string): void {
    this.router.navigate(['/payment'], { queryParams: { sessionId } });
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
   * Check if there are any past sessions
   */
  hasPastSessions(): boolean {
    return this.pastSessions.length > 0;
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
      this.pastPage = 1;
      this.loadPastSessions();
    }
  }
}
