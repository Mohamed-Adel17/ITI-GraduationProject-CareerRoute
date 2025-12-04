import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionService } from '../../../core/services/session.service';
import { NotificationService } from '../../../core/services/notification.service';
import { SessionStatus } from '../../models/session.model';

/**
 * AIPreparationGuideComponent
 * 
 * Displays AI-generated session preparation guide for mentors.
 * Features:
 * - Generate button (shown if not yet generated)
 * - Loading state while generating
 * - Formatted markdown display
 * - Copy to clipboard functionality
 * - Only visible to mentors, only before session completes
 */
@Component({
  selector: 'app-ai-preparation-guide',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ai-preparation-guide.component.html',
  styleUrl: './ai-preparation-guide.component.css'
})
export class AIPreparationGuideComponent implements OnInit, OnChanges {
  @Input({ required: true }) sessionId!: string;
  @Input() existingGuide?: string | null;
  @Input() generatedAt?: string | null;
  @Input() sessionStatus!: SessionStatus;
  @Input() topic?: string | null;
  @Input() notes?: string | null;

  preparationGuide: string | null = null;
  renderedHtml: string = '';
  isGenerating = false;
  errorMessage: string | null = null;
  guideGeneratedAt: string | null = null;

  constructor(
    private sessionService: SessionService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    if (this.existingGuide) {
      this.preparationGuide = this.existingGuide;
      this.guideGeneratedAt = this.generatedAt || null;
      this.renderedHtml = this.parseMarkdown(this.existingGuide);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['existingGuide'] && this.existingGuide) {
      this.preparationGuide = this.existingGuide;
      this.guideGeneratedAt = this.generatedAt || null;
      this.renderedHtml = this.parseMarkdown(this.existingGuide);
    }
  }

  get hasGuide(): boolean {
    return !!this.preparationGuide;
  }

  get canGenerate(): boolean {
    const activeStatuses = [
      SessionStatus.Pending,
      SessionStatus.Confirmed,
      SessionStatus.PendingReschedule,
      SessionStatus.InProgress
    ];
    return activeStatuses.includes(this.sessionStatus);
  }

  get hasSessionDetails(): boolean {
    return !!(this.topic?.trim() || this.notes?.trim());
  }

  get formattedGeneratedAt(): string {
    if (!this.guideGeneratedAt) return '';
    const date = new Date(this.guideGeneratedAt);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }


  generatePreparation(): void {
    if (this.isGenerating) return;

    this.isGenerating = true;
    this.errorMessage = null;

    this.sessionService.generatePreparation(this.sessionId).subscribe({
      next: (response) => {
        this.preparationGuide = response.preparationGuide;
        this.guideGeneratedAt = response.generatedAt;
        this.renderedHtml = this.parseMarkdown(response.preparationGuide);
        this.isGenerating = false;

        if (response.wasAlreadyGenerated) {
          this.notificationService.info('Showing previously generated guide', 'Info');
        } else {
          this.notificationService.success('Preparation guide generated!', 'Success');
        }
      },
      error: (error) => {
        this.isGenerating = false;
        const errorMsg = error?.error?.message || 'Failed to generate preparation guide. Please try again.';
        this.errorMessage = errorMsg;
        this.notificationService.error(errorMsg, 'Error');
      }
    });
  }

  private parseMarkdown(md: string): string {
    if (!md) return '';
    
    let html = md
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^[-*] (.+)$/gm, '<li>$1</li>')
      .replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
    
    html = html.replace(/(<li>[\s\S]*?<\/li>(\n)?)+/g, (match) => '<ul>' + match + '</ul>');
    
    return html
      .replace(/\n{2,}/g, '</p><p>')
      .replace(/^(?!<[hul])(.+)$/gm, '<p>$1</p>')
      .replace(/<p><\/p>/g, '')
      .replace(/<p>(<[hul])/g, '$1')
      .replace(/(<\/[hul].*>)<\/p>/g, '$1');
  }

  copyToClipboard(): void {
    if (!this.preparationGuide) return;
    navigator.clipboard.writeText(this.preparationGuide).then(
      () => this.notificationService.success('Guide copied to clipboard', 'Success'),
      () => this.notificationService.error('Failed to copy guide', 'Error')
    );
  }

  refreshGuide(): void {
    this.generatePreparation();
  }
}
