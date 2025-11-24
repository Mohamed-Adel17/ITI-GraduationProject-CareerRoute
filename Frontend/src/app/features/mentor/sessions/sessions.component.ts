import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { SessionService } from '../../../core/services/session.service';
import { NotificationService } from '../../../core/services/notification.service';
import { SessionCard } from '../../../shared/components/session-card/session-card';
import {
  SessionSummary,
  PastSessionItem,
  PaginationMetadata,
  SessionStatus
} from '../../../shared/models/session.model';

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
  imports: [CommonModule, SessionCard],
  templateUrl: './sessions.component.html',
  styleUrls: ['./sessions.component.css']
})
export class MentorSessionsComponent implements OnInit, OnDestroy {
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

  private subscriptions: Subscription[] = [];

  constructor(
    private sessionService: SessionService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

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
      // TODO: Open cancel session modal
      this.notificationService.info(
        'Cancel session modal will be implemented',
        'Coming Soon'
      );
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
      // TODO: Open reschedule session modal
      this.notificationService.info(
        'Reschedule session modal will be implemented',
        'Coming Soon'
      );
    }
  }

  /**
   * Handle view details action
   * Navigates to session detail page
   */
  onViewDetails(sessionId: string): void {
    this.router.navigate(['/mentor/sessions', sessionId]);
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
      this.pastPage = 1;
      this.loadPastSessions();
    }
  }
}
