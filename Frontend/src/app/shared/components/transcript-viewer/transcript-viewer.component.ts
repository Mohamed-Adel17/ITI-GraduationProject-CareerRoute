import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SessionService } from '../../../core/services/session.service';
import { SessionTranscriptResponse } from '../../models/session.model';
import { NotificationService } from '../../../core/services/notification.service';

/**
 * TranscriptLine
 * Represents a parsed line of transcript with timestamp and speaker
 */
interface TranscriptLine {
    timestamp: string;
    speaker: string;
    text: string;
    fullLine: string;
}

/**
 * TranscriptViewerComponent
 *
 * Component for displaying AI-generated session transcripts.
 * Parses and displays transcript with timestamps and speaker labels.
 *
 * Features:
 * - Display formatted transcript with timestamps
 * - Search/filter functionality
 * - Copy to clipboard button
 * - Download as text file
 * - Loading and empty states
 *
 * @example
 * ```html
 * <app-transcript-viewer [sessionId]="session.id"></app-transcript-viewer>
 * ```
 */
@Component({
    selector: 'app-transcript-viewer',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './transcript-viewer.component.html',
    styleUrl: './transcript-viewer.component.css'
})
export class TranscriptViewerComponent implements OnInit {
    /**
     * Session ID to load transcript for
     */
    @Input({ required: true }) sessionId!: string;

    transcriptData: SessionTranscriptResponse | null = null;
    parsedLines: TranscriptLine[] = [];
    filteredLines: TranscriptLine[] = [];
    isLoading: boolean = true;
    errorMessage: string | null = null;
    searchQuery: string = '';

    constructor(
        private sessionService: SessionService,
        private notificationService: NotificationService
    ) { }

    ngOnInit(): void {
        this.loadTranscript();
    }

    /**
     * Load transcript data from API
     */
    private loadTranscript(): void {
        this.isLoading = true;
        this.errorMessage = null;

        this.sessionService.getSessionTranscript(this.sessionId).subscribe({
            next: (response) => {
                this.transcriptData = response;
                this.isLoading = false;

                if (response.isAvailable && response.transcript) {
                    this.parseTranscript(response.transcript);
                }
            },
            error: (error) => {
                this.isLoading = false;
                this.errorMessage = 'Failed to load transcript. Please try again later.';
            }
        });
    }

    /**
     * Parse transcript text into structured lines
     * Expected format: "[00:00] Speaker 0: Hello..."
     */
    private parseTranscript(transcript: string): void {
        const lines = transcript.split('\n').filter(line => line.trim() !== '');

        this.parsedLines = lines.map(line => {
            // Match pattern: [HH:MM] Speaker N: Text
            const match = line.match(/^\[(\d{2}:\d{2})\]\s*Speaker\s*(\d+):\s*(.+)$/);

            if (match) {
                return {
                    timestamp: match[1],
                    speaker: `Speaker ${match[2]}`,
                    text: match[3].trim(),
                    fullLine: line
                };
            }

            // Fallback for lines that don't match the pattern
            return {
                timestamp: '',
                speaker: '',
                text: line.trim(),
                fullLine: line
            };
        });

        this.filteredLines = [...this.parsedLines];
    }

    /**
     * Filter transcript lines based on search query
     */
    onSearchChange(): void {
        if (!this.searchQuery.trim()) {
            this.filteredLines = [...this.parsedLines];
            return;
        }

        const query = this.searchQuery.toLowerCase();
        this.filteredLines = this.parsedLines.filter(line =>
            line.text.toLowerCase().includes(query) ||
            line.speaker.toLowerCase().includes(query) ||
            line.timestamp.includes(query)
        );
    }

    /**
     * Copy transcript to clipboard
     */
    copyToClipboard(): void {
        if (!this.transcriptData?.transcript) return;

        navigator.clipboard.writeText(this.transcriptData.transcript).then(
            () => {
                this.notificationService.success('Transcript copied to clipboard', 'Success');
            },
            () => {
                this.notificationService.error('Failed to copy transcript', 'Error');
            }
        );
    }

    /**
     * Download transcript as text file
     */
    downloadTranscript(): void {
        if (!this.transcriptData?.transcript) return;

        const blob = new Blob([this.transcriptData.transcript], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `session-${this.sessionId}-transcript.txt`;
        link.click();
        window.URL.revokeObjectURL(url);

        this.notificationService.success('Transcript downloaded', 'Success');
    }

    /**
     * Clear search query
     */
    clearSearch(): void {
        this.searchQuery = '';
        this.onSearchChange();
    }

    /**
     * Refresh transcript data
     */
    refreshTranscript(): void {
        this.loadTranscript();
    }

    /**
     * Check if transcript is available
     */
    get isAvailable(): boolean {
        return this.transcriptData?.isAvailable === true && !!this.transcriptData?.transcript;
    }

    /**
     * Get total line count
     */
    get totalLines(): number {
        return this.parsedLines.length;
    }

    /**
     * Get filtered line count
     */
    get filteredLineCount(): number {
        return this.filteredLines.length;
    }

    /**
     * Check if search is active
     */
    get isSearching(): boolean {
        return this.searchQuery.trim() !== '';
    }
}
