import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { SessionService } from '../../../core/services/session.service';
import { ReviewService } from '../../../core/services/review.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { DisputeService } from '../../../core/services/dispute.service';
import { ReviewItem } from '../../models/review.model';
import {
  SessionDetailResponse,
  SessionStatus,
  formatSessionStatus,
  getSessionStatusColor,
  formatSessionDuration,
  formatSessionDateTime,
  RescheduleDetails
} from '../../models/session.model';
import { DisputeDto, getDisputeReasonText } from '../../models/dispute.model';
import { RecordingPlayerComponent } from '../recording-player/recording-player.component';
import { SummaryViewerComponent } from '../summary-viewer/summary-viewer.component';
import { AIPreparationGuideComponent } from '../ai-preparation-guide/ai-preparation-guide.component';
import { CreateDisputeModalComponent } from '../create-dispute-modal/create-dispute-modal.component';
import { DisputeStatusBadgeComponent } from '../dispute-status-badge/dispute-status-badge.component';

/**
 * SessionDetailsComponent
 * 
 * Displays detailed session information with status-specific features:
 * - Confirmed: Session info + Join button (enabled 15 min before start)
 * - InProgress: Session info + Active Join button + "In Progress" indicator
 * - Completed: Session info + Recording player + AI Summary viewer
 */
@Component({
  selector: 'app-session-details',
  standalone: true,
  imports: [CommonModule, RouterModule, RecordingPlayerComponent, SummaryViewerComponent, AIPreparationGuideComponent, CreateDisputeModalComponent, DisputeStatusBadgeComponent],
  templateUrl: './session-details.component.html',
  styleUrl: './session-details.component.css'
})
export class SessionDetailsComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly sessionService = inject(SessionService);
  private readonly reviewService = inject(ReviewService);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly disputeService = inject(DisputeService);

  session: SessionDetailResponse | null = null;
  isLoading = true;
  errorMessage: string | null = null;
  
  // User context
  currentUserId: string | null = null;
  userRole: 'mentee' | 'mentor' = 'mentee';
  
  // Time-based state
  canJoinNow = false;
  minutesUntilJoinable = 0;
  isInProgress = false;
  
  // UI state
  activeTab: 'recording' | 'transcript' = 'recording';
  
  // Reschedule state
  rescheduleDetails: RescheduleDetails | null = null;
  isProcessingReschedule = false;

  // Review state
  existingReview: ReviewItem | null = null;
  isLoadingReview = false;

  // Dispute state
  existingDispute: DisputeDto | null = null;
  isLoadingDispute = false;
  showDisputeModal = false;
  readonly DISPUTE_WINDOW_DAYS = 3;
  
  private timerSubscription: Subscription | null = null;
  private readonly JOIN_WINDOW_MINUTES = 15;

  // Expose enum to template
  SessionStatus = SessionStatus;

  ngOnInit(): void {
    // Get current user
    const user = this.authService.getCurrentUser();
    this.currentUserId = user?.id || null;
    
    // Get session ID from route
    const sessionId = this.route.snapshot.paramMap.get('id');
    if (sessionId) {
      this.loadSession(sessionId);
    } else {
      this.errorMessage = 'Session ID not provided';
      this.isLoading = false;
    }
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  private loadSession(sessionId: string): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.sessionService.getSessionById(sessionId).subscribe({
      next: (session) => {
        this.session = session;
        this.isLoading = false;
        this.determineUserRole();
        this.updateTimeBasedState();
        this.startTimerIfNeeded();
        
        // Fetch reschedule details if pending and has rescheduleId
        if (session.status === SessionStatus.PendingReschedule && session.rescheduleId) {
          this.loadRescheduleDetails(session.rescheduleId);
        }

        // Load existing review for completed sessions
        if (session.status === SessionStatus.Completed) {
          this.loadExistingReview(sessionId);
          this.loadExistingDispute(sessionId);
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error?.error?.message || 'Failed to load session details';
      }
    });
  }

  private loadRescheduleDetails(rescheduleId: string): void {
    this.sessionService.getRescheduleDetails(rescheduleId).subscribe({
      next: (details) => this.rescheduleDetails = details,
      error: () => {} // Silently fail - banner still shows without details
    });
  }

  private loadExistingReview(sessionId: string): void {
    this.isLoadingReview = true;
    this.reviewService.getSessionReview(sessionId).subscribe({
      next: (review) => {
        this.existingReview = review;
        this.isLoadingReview = false;
      },
      error: () => {
        this.isLoadingReview = false;
      }
    });
  }

  private loadExistingDispute(sessionId: string): void {
    this.isLoadingDispute = true;
    this.disputeService.getDisputeBySession(sessionId).subscribe({
      next: (dispute) => {
        this.existingDispute = dispute;
        this.isLoadingDispute = false;
      },
      error: () => {
        this.isLoadingDispute = false;
      }
    });
  }

  private determineUserRole(): void {
    if (!this.session || !this.currentUserId) return;
    this.userRole = this.currentUserId === this.session.menteeId ? 'mentee' : 'mentor';
  }

  private updateTimeBasedState(): void {
    if (!this.session) return;

    const now = new Date();
    const startTime = new Date(this.session.scheduledStartTime);
    const endTime = new Date(this.session.scheduledEndTime);
    const joinableTime = new Date(startTime.getTime() - this.JOIN_WINDOW_MINUTES * 60 * 1000);

    // Check if session is in progress
    this.isInProgress = this.session.status === SessionStatus.InProgress ||
      (this.session.status === SessionStatus.Confirmed && now >= startTime && now <= endTime);

    // Check if can join (within 15 min window before start or during session)
    this.canJoinNow = (this.session.status === SessionStatus.Confirmed || 
                       this.session.status === SessionStatus.InProgress) &&
                      now >= joinableTime && now <= endTime;

    // Calculate minutes until joinable
    if (!this.canJoinNow && now < joinableTime) {
      this.minutesUntilJoinable = Math.ceil((joinableTime.getTime() - now.getTime()) / (60 * 1000));
    } else {
      this.minutesUntilJoinable = 0;
    }
  }

  private startTimerIfNeeded(): void {
    if (!this.session) return;
    
    // Only start timer for confirmed/in-progress sessions
    if (this.session.status === SessionStatus.Confirmed || 
        this.session.status === SessionStatus.InProgress) {
      this.stopTimer();
      // Update every minute
      this.timerSubscription = interval(60000).subscribe(() => {
        this.updateTimeBasedState();
      });
    }
  }

  private stopTimer(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
      this.timerSubscription = null;
    }
  }

  // === Getters for template ===

  get participantName(): string {
    if (!this.session) return '';
    return this.userRole === 'mentee'
      ? `${this.session.mentorFirstName} ${this.session.mentorLastName}`
      : `${this.session.menteeFirstName} ${this.session.menteeLastName}`;
  }

  get participantLabel(): string {
    return this.userRole === 'mentee' ? 'Mentor' : 'Mentee';
  }

  get participantAvatar(): string {
    if (!this.session) return '';
    const url = this.userRole === 'mentee' 
      ? this.session.mentorProfilePictureUrl 
      : this.session.menteeProfilePictureUrl;
    return url || `https://ui-avatars.com/api/?name=${encodeURIComponent(this.participantName)}&background=6366f1&color=fff`;
  }

  get statusText(): string {
    return this.session ? formatSessionStatus(this.session.status) : '';
  }

  get statusColorClass(): string {
    return this.session ? getSessionStatusColor(this.session.status) : '';
  }

  get formattedDateTime(): string {
    return this.session ? formatSessionDateTime(this.session.scheduledStartTime) : '';
  }

  get formattedDuration(): string {
    return this.session ? formatSessionDuration(this.session.duration) : '';
  }

  get formattedEndTime(): string {
    if (!this.session) return '';
    return new Date(this.session.scheduledEndTime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  get joinButtonText(): string {
    if (this.canJoinNow) return 'Join Session';
    if (this.minutesUntilJoinable > 60) {
      const hours = Math.floor(this.minutesUntilJoinable / 60);
      const mins = this.minutesUntilJoinable % 60;
      return `Available in ${hours}h ${mins}m`;
    }
    return `Available in ${this.minutesUntilJoinable}m`;
  }

  get isCompleted(): boolean {
    return this.session?.status === SessionStatus.Completed;
  }

  get isCancelled(): boolean {
    return this.session?.status === SessionStatus.Cancelled;
  }

  get isPendingReschedule(): boolean {
    return this.session?.status === SessionStatus.PendingReschedule;
  }

  get showJoinSection(): boolean {
    return this.session?.status === SessionStatus.Confirmed || 
           this.session?.status === SessionStatus.InProgress;
  }

  get canLeaveReview(): boolean {
    return this.isCompleted && 
           this.userRole === 'mentee' && 
           !this.existingReview && 
           !this.isLoadingReview;
  }

  get hasExistingReview(): boolean {
    return !!this.existingReview;
  }

  get isMentor(): boolean {
    return this.userRole === 'mentor';
  }

  get showAIPreparation(): boolean {
    // Show AI preparation section for mentors on non-completed sessions
    if (!this.isMentor || !this.session) return false;
    const activeStatuses = [
      SessionStatus.Pending,
      SessionStatus.Confirmed,
      SessionStatus.PendingReschedule,
      SessionStatus.InProgress
    ];
    return activeStatuses.includes(this.session.status);
  }

  // === Dispute Getters ===

  get canCreateDispute(): boolean {
    if (!this.isCompleted || this.userRole !== 'mentee' || this.existingDispute || this.isLoadingDispute) {
      return false;
    }
    return this.isWithinDisputeWindow;
  }

  get isWithinDisputeWindow(): boolean {
    if (!this.session) return false;
    const completionTime = this.session.completedAt || this.session.scheduledEndTime;
    if (!completionTime) return false;
    const completedAt = new Date(completionTime);
    const now = new Date();
    const daysSinceCompletion = (now.getTime() - completedAt.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceCompletion <= this.DISPUTE_WINDOW_DAYS;
  }

  get daysLeftToDispute(): number {
    if (!this.session) return 0;
    const completionTime = this.session.completedAt || this.session.scheduledEndTime;
    if (!completionTime) return 0;
    const completedAt = new Date(completionTime);
    const now = new Date();
    const daysSinceCompletion = (now.getTime() - completedAt.getTime()) / (1000 * 60 * 60 * 24);
    return Math.max(0, Math.ceil(this.DISPUTE_WINDOW_DAYS - daysSinceCompletion));
  }

  get hasExistingDispute(): boolean {
    return !!this.existingDispute;
  }

  getDisputeReasonText(reason: string): string {
    return getDisputeReasonText(reason as any);
  }

  // === Dispute Actions ===

  openDisputeModal(): void {
    if (this.canCreateDispute) {
      this.showDisputeModal = true;
    }
  }

  closeDisputeModal(): void {
    this.showDisputeModal = false;
  }

  onDisputeCreated(dispute: DisputeDto): void {
    this.existingDispute = dispute;
    this.showDisputeModal = false;
  }

  // === Actions ===

  joinSession(): void {
    if (!this.session || !this.canJoinNow) return;

    this.sessionService.joinSession(this.session.id).subscribe({
      next: (response) => {
        if (response.videoConferenceLink) {
          window.open(response.videoConferenceLink, '_blank');
        } else {
          this.notificationService.error('Video link not available', 'Error');
        }
      },
      error: (error) => {
        const message = error?.error?.message || 'Failed to join session';
        this.notificationService.error(message, 'Error');
      }
    });
  }

  retryLoad(): void {
    const sessionId = this.route.snapshot.paramMap.get('id');
    if (sessionId) {
      this.loadSession(sessionId);
    }
  }

  goBack(): void {
    this.router.navigate(['..'], { relativeTo: this.route });
  }

  setActiveTab(tab: 'recording' | 'transcript'): void {
    this.activeTab = tab;
  }

  navigateToReview(): void {
    if (this.session) {
      this.router.navigate(['/sessions', this.session.id, 'review']);
    }
  }

  // === Reschedule Getters ===

  get isRescheduleRequester(): boolean {
    if (!this.rescheduleDetails?.requestedBy) return false;
    
    // Backend may return "User"/"Mentor" or "mentee"/"mentor"
    const requestedByRole = this.rescheduleDetails.requestedBy.toLowerCase() === 'user' 
      ? 'mentee' 
      : this.rescheduleDetails.requestedBy.toLowerCase();
    
    return requestedByRole === this.userRole.toLowerCase();
  }

  get canActOnReschedule(): boolean {
    // Can act if: pending reschedule, has reschedule details loaded, and not the requester
    return this.isPendingReschedule && !!this.rescheduleDetails && !this.isRescheduleRequester;
  }

  get formattedProposedTime(): string {
    if (!this.rescheduleDetails) return '';
    return formatSessionDateTime(this.rescheduleDetails.newScheduledStartTime || this.rescheduleDetails.newStartTime || '');
  }

  // === Reschedule Actions ===

  approveReschedule(): void {
    if (!this.session?.rescheduleId || this.isProcessingReschedule) return;
    this.isProcessingReschedule = true;

    this.sessionService.approveReschedule(this.session.rescheduleId).subscribe({
      next: () => {
        this.notificationService.success('Reschedule approved!', 'Success');
        this.retryLoad();
      },
      error: (error) => {
        this.isProcessingReschedule = false;
        this.notificationService.error(error?.error?.message || 'Failed to approve', 'Error');
      }
    });
  }

  rejectReschedule(): void {
    if (!this.session?.rescheduleId || this.isProcessingReschedule) return;
    this.isProcessingReschedule = true;

    this.sessionService.rejectReschedule(this.session.rescheduleId).subscribe({
      next: () => {
        this.notificationService.info('Reschedule rejected', 'Info');
        this.retryLoad();
      },
      error: (error) => {
        this.isProcessingReschedule = false;
        this.notificationService.error(error?.error?.message || 'Failed to reject', 'Error');
      }
    });
  }
}
