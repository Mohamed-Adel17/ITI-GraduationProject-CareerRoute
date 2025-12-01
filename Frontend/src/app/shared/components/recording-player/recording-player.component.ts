import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionService } from '../../../core/services/session.service';
import { SessionRecordingResponse } from '../../models/session.model';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

/**
 * RecordingPlayerComponent
 *
 * Video player component for session recordings with automatic status polling.
 * Handles three recording states: Available, Processing, and Failed.
 *
 * Features:
 * - HTML5 video player with controls
 * - Automatic polling for processing recordings (every 30 seconds)
 * - Presigned URL expiration handling (60 minutes)
 * - Download button for available recordings
 * - Loading states for each status
 *
 * @example
 * ```html
 * <app-recording-player [sessionId]="session.id"></app-recording-player>
 * ```
 */
@Component({
  selector: 'app-recording-player',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recording-player.component.html',
  styleUrl: './recording-player.component.css'
})
export class RecordingPlayerComponent implements OnInit, OnDestroy {
  /**
   * Session ID to load recording for
   */
  @Input({ required: true }) sessionId!: string;

  recordingData: SessionRecordingResponse | null = null;
  isLoading: boolean = true;
  errorMessage: string | null = null;
  
  private pollingSubscription: Subscription | null = null;
  private readonly POLLING_INTERVAL_MS = 30000; // 30 seconds

  constructor(private sessionService: SessionService) {}

  ngOnInit(): void {
    this.loadRecording();
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  /**
   * Load recording data from API
   */
  private loadRecording(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.sessionService.getSessionRecording(this.sessionId).subscribe({
      next: (response) => {
        this.recordingData = response;
        this.isLoading = false;

        // Start polling if recording is still processing
        if (response.status === 'Processing') {
          this.startPolling();
        } else {
          this.stopPolling();
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'Failed to load recording. Please try again later.';
        this.stopPolling();
      }
    });
  }

  /**
   * Start polling for recording status updates
   */
  private startPolling(): void {
    // Stop any existing polling
    this.stopPolling();

    // Poll every 30 seconds
    this.pollingSubscription = interval(this.POLLING_INTERVAL_MS)
      .pipe(
        switchMap(() => this.sessionService.getSessionRecording(this.sessionId))
      )
      .subscribe({
        next: (response) => {
          this.recordingData = response;

          // Stop polling if recording is no longer processing
          if (response.status !== 'Processing') {
            this.stopPolling();
          }
        },
        error: () => {
          // Continue polling even on error
          console.error('Error polling recording status');
        }
      });
  }

  /**
   * Stop polling for recording status
   */
  private stopPolling(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = null;
    }
  }

  /**
   * Refresh recording data manually
   */
  refreshRecording(): void {
    this.loadRecording();
  }

  /**
   * Download recording file
   */
  downloadRecording(): void {
    if (this.recordingData?.recordingPlayUrl) {
      window.open(this.recordingData.recordingPlayUrl, '_blank');
    }
  }

  /**
   * Get formatted expiration time
   */
  get expirationTime(): string {
    if (!this.recordingData?.expiresAt) return '';
    
    const expiresAt = new Date(this.recordingData.expiresAt);
    return expiresAt.toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  }

  /**
   * Check if recording URL is expired or about to expire
   */
  get isExpiringSoon(): boolean {
    if (!this.recordingData?.expiresAt) return false;
    
    const expiresAt = new Date(this.recordingData.expiresAt);
    const now = new Date();
    const minutesUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60);
    
    return minutesUntilExpiry < 10; // Less than 10 minutes
  }

  /**
   * Check if recording is available
   */
  get isAvailable(): boolean {
    return this.recordingData?.status === 'Available' && this.recordingData?.isAvailable === true;
  }

  /**
   * Check if recording is processing
   */
  get isProcessing(): boolean {
    return this.recordingData?.status === 'Processing';
  }

  /**
   * Check if recording failed
   */
  get isFailed(): boolean {
    return this.recordingData?.status === 'Failed';
  }
}
