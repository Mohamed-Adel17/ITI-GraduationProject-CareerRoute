import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  DisputeStatus,
  DisputeResolution,
  getDisputeStatusText,
  getDisputeStatusColor,
  getResolutionText
} from '../../models/dispute.model';

/**
 * DisputeStatusBadgeComponent
 *
 * Reusable badge component for displaying dispute status with appropriate colors.
 */
@Component({
  selector: 'app-dispute-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="badge" [ngClass]="statusColorClass">
      {{ statusText }}
    </span>
    <span *ngIf="showResolution && resolution" class="resolution-text">
      ({{ resolutionText }}<span *ngIf="refundAmount"> - {{ refundAmount | number:'1.2-2' }} EGP</span>)
    </span>
  `,
  styles: [`
    :host {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
    }
    .badge {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
      font-weight: 500;
      border-radius: 0.25rem;
    }
    .resolution-text {
      font-size: 0.75rem;
      color: #6b7280;
    }
  `]
})
export class DisputeStatusBadgeComponent {
  @Input({ required: true }) status!: DisputeStatus;
  @Input() resolution?: DisputeResolution | null;
  @Input() refundAmount?: number | null;
  @Input() showResolution: boolean = true;

  get statusText(): string {
    return getDisputeStatusText(this.status);
  }

  get statusColorClass(): string {
    return getDisputeStatusColor(this.status);
  }

  get resolutionText(): string {
    return this.resolution ? getResolutionText(this.resolution) : '';
  }
}
