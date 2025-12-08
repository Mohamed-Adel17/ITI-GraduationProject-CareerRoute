import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
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
   * Modal visibility state
   */
  showDetails = false;

  /**
   * Close modal on Escape key
   */
  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.showDetails) {
      this.showDetails = false;
    }
  }

  /**
   * Handle approve button click
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
   * Check if profile picture exists
   */
  get hasProfilePicture(): boolean {
    return !!this.application.profilePictureUrl;
  }

  /**
   * Get profile picture URL
   *
   * @returns Profile picture URL if available
   */
  get profilePictureUrl(): string | null {
    return this.application.profilePictureUrl || null;
  }

  /**
   * Get initials from full name for avatar fallback
   *
   * @returns Two-letter initials from the mentor's name
   */
  get initials(): string {
    if (!this.application.fullName) {
      return '??';
    }

    const nameParts = this.application.fullName.trim().split(/\s+/);

    if (nameParts.length === 1) {
      // Single name: take first two letters
      return nameParts[0].substring(0, 2).toUpperCase();
    }

    // Multiple names: take first letter of first and last name
    const firstInitial = nameParts[0].charAt(0).toUpperCase();
    const lastInitial = nameParts[nameParts.length - 1].charAt(0).toUpperCase();

    return firstInitial + lastInitial;
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
