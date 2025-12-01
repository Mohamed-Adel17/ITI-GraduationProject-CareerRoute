import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MentorCard } from '../../../shared/components/mentor-card/mentor-card';
import { Mentor } from '../../../shared/models/mentor.model';

/**
 * MentorListComponent
 *
 * @description
 * Pure presentation component that displays a grid of mentor cards.
 * Handles mentor display, navigation, loading states, and empty states.
 * Pagination is now handled by the parent component (MentorSearchComponent).
 *
 * Features:
 * - Responsive grid layout (1-4 columns based on screen size)
 * - Loading state with skeleton cards
 * - Empty state when no mentors found
 * - Click handling to navigate to mentor detail page
 * - Accessible with ARIA attributes
 *
 * @remarks
 * - Uses MentorCard component for individual mentor display
 * - Pagination controls are managed by parent component
 * - Part of US2 - Browse and Search for Mentors
 * - Responsive design with Tailwind CSS
 *
 * @example
 * ```html
 * <app-mentor-list
 *   [mentors]="mentorList"
 *   [loading]="isLoading"
 *   [showPagination]="false">
 * </app-mentor-list>
 * ```
 */
@Component({
  selector: 'app-mentor-list',
  standalone: true,
  imports: [CommonModule, MentorCard],
  templateUrl: './mentor-list.component.html',
  styleUrls: ['./mentor-list.component.css']
})
export class MentorListComponent {
  /**
   * Array of mentors to display
   */
  @Input() mentors: Mentor[] = [];

  /**
   * Loading state - shows skeleton cards when true
   */
  @Input() loading: boolean = false;

  /**
   * Number of skeleton cards to show during loading
   */
  @Input() skeletonCount: number = 12;

  /**
   * Whether to show pagination controls (deprecated - now handled by parent)
   */
  @Input() showPagination: boolean = false;

  constructor(private router: Router) {}

  /**
   * Handle mentor card click - navigate to mentor detail page
   * @param mentor The mentor that was clicked
   */
  onMentorClick(mentor: Mentor): void {
    this.router.navigate(['/mentors', mentor.id]);
  }

  /**
   * Check if mentors list is empty (not loading and no mentors)
   */
  get isEmpty(): boolean {
    return !this.loading && this.mentors.length === 0;
  }

  /**
   * Check if mentors list has data
   */
  get hasData(): boolean {
    return !this.loading && this.mentors.length > 0;
  }

  /**
   * Generate array for skeleton cards
   */
  get skeletonArray(): number[] {
    return Array(this.skeletonCount).fill(0);
  }

  /**
   * Track by function for ngFor optimization
   * @param index Array index
   * @param mentor Mentor object
   */
  trackByMentorId(index: number, mentor: Mentor): string {
    return mentor.id;
  }

  /**
   * Track by function for skeleton cards
   * @param index Array index
   */
  trackByIndex(index: number): number {
    return index;
  }
}
