import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionService } from '../../../core/services/session.service';
import { SessionSummaryResponse } from '../../models/session.model';
import { NotificationService } from '../../../core/services/notification.service';

/**
 * SummaryViewerComponent
 * Displays AI-generated session summary with markdown rendering.
 */
@Component({
  selector: 'app-summary-viewer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './summary-viewer.component.html',
  styleUrl: './summary-viewer.component.css'
})
export class SummaryViewerComponent implements OnInit {
  @Input({ required: true }) sessionId!: string;

  summaryData: SessionSummaryResponse | null = null;
  renderedHtml: string = '';
  isLoading = true;
  errorMessage: string | null = null;

  constructor(
    private sessionService: SessionService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadSummary();
  }

  private loadSummary(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.sessionService.getSessionSummary(this.sessionId).subscribe({
      next: (response) => {
        this.summaryData = response;
        this.renderedHtml = this.parseMarkdown(response.summary);
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        if (error?.status === 404) {
          this.summaryData = { sessionId: this.sessionId, summary: '', isAvailable: false };
        } else {
          this.errorMessage = 'Failed to load summary. Please try again later.';
        }
      }
    });
  }

  /** Simple markdown to HTML parser */
  private parseMarkdown(md: string): string {
    if (!md) return '';
    
    return md
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^[-*] (.+)$/gm, '<li>$1</li>')
      .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
      .replace(/\n{2,}/g, '</p><p>')
      .replace(/^(?!<[hul])(.+)$/gm, '<p>$1</p>')
      .replace(/<p><\/p>/g, '')
      .replace(/<p>(<[hul])/g, '$1')
      .replace(/(<\/[hul].*>)<\/p>/g, '$1');
  }

  copyToClipboard(): void {
    if (!this.summaryData?.summary) return;
    navigator.clipboard.writeText(this.summaryData.summary).then(
      () => this.notificationService.success('Summary copied to clipboard', 'Success'),
      () => this.notificationService.error('Failed to copy summary', 'Error')
    );
  }

  refreshSummary(): void {
    this.loadSummary();
  }
}
