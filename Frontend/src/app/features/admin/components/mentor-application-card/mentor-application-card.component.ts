import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MentorListItem } from '../../../../shared/models/mentor.model';

/**
 * MentorApplicationCardComponent
 *
 * Displays a single mentor application in a card format with approve/reject actions.
 *
 * Features:
 * - Displays mentor profile information (name, bio, experience, certifications, etc.)
 * - Shows expertise tags as chips/badges
 * - Shows categories as chips/badges
 * - Displays pricing information (30min and 60min rates)
 * - Shows application date
 * - Provides Approve and Reject action buttons
 * - Responsive card design with Tailwind CSS
 * - Dark mode support
 *
 * @remarks
 * - Child component of MentorApprovalsComponent
 * - Emits events to parent for approve/reject actions
 * - Does not handle API calls directly
 * - Uses Tailwind CSS for all styling
 *
 * @example
 * ```html
 * <app-mentor-application-card
 *   [application]="mentorApplication"
 *   (approve)="onApprove($event)"
 *   (reject)="onReject($event)">
 * </app-mentor-application-card>
 * ```
 */
@Component({
  selector: 'app-mentor-application-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mentor-application-card.component.html',
  styleUrl: './mentor-application-card.component.css'
})
export class MentorApplicationCardComponent {
  /**
   * The mentor application data to display
   */
  @Input({ required: true }) application!: MentorListItem;

  /**
   * Emits mentor ID when approve button is clicked
   */
  @Output() approve = new EventEmitter<string>();

  /**
   * Emits mentor ID when reject button is clicked
   */
  @Output() reject = new EventEmitter<string>();

  /**
   * Bio expansion state
   */
  isBioExpanded = false;

  /**
   * Maximum bio length to show before truncation
   */
  readonly MAX_BIO_LENGTH = 150;

  /**
   * Handle approve button click
   *
   * Emits approve event with mentor ID to parent component
   */
  onApproveClick(): void {
    this.approve.emit(this.application.id);
  }

  /**
   * Handle reject button click
   *
   * Emits reject event with mentor ID to parent component
   */
  onRejectClick(): void {
    this.reject.emit(this.application.id);
  }

  /**
   * Toggle bio expansion
   */
  toggleBio(): void {
    this.isBioExpanded = !this.isBioExpanded;
  }

  /**
   * Get truncated bio text
   *
   * @returns Truncated bio if exceeds MAX_BIO_LENGTH, otherwise full bio
   */
  get truncatedBio(): string {
    if (!this.application.bio) {
      return '';
    }

    if (this.application.bio.length <= this.MAX_BIO_LENGTH) {
      return this.application.bio;
    }

    return this.application.bio.substring(0, this.MAX_BIO_LENGTH) + '...';
  }

  /**
   * Check if bio needs truncation
   *
   * @returns True if bio exceeds MAX_BIO_LENGTH
   */
  get shouldTruncateBio(): boolean {
    return !!this.application.bio && this.application.bio.length > this.MAX_BIO_LENGTH;
  }

  /**
   * Get profile picture URL or default avatar
   *
   * @returns Profile picture URL or default placeholder
   */
  get profilePictureUrl(): string {
    return this.application.profilePictureUrl || 'assets/images/default-avatar.png';
  }

  /**
   * Get formatted experience text
   *
   * @returns Human-readable experience text
   */
  get experienceText(): string {
    const years = this.application.yearsOfExperience;
    if (years === 0) {
      return 'Less than 1 year';
    }
    return `${years} ${years === 1 ? 'year' : 'years'}`;
  }

  /**
   * Get formatted application date
   *
   * @returns Human-readable date or relative time
   */
  get applicationDate(): string {
    if (!this.application.createdAt) {
      return 'Unknown';
    }

    const date = new Date(this.application.createdAt);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return 'Today';
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  }
}
