import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MentorCard } from '../../../shared/components/mentor-card/mentor-card';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { Mentor } from '../../../shared/models/mentor.model';

/**
 * MentorListComponent
 *
 * @description
 * Container component that displays a grid of mentor cards with pagination controls.
 * Handles mentor display, navigation, loading states, and empty states.
 *
 * Features:
 * - Responsive grid layout (1-4 columns based on screen size)
 * - Pagination integration with PaginationComponent
 * - Loading state with skeleton cards
 * - Empty state when no mentors found
 * - Click handling to navigate to mentor detail page
 * - Page change event emission
 * - Accessible with ARIA attributes
 *
 * @remarks
 * - Uses MentorCard component for individual mentor display
 * - Uses PaginationComponent for pagination controls
 * - Part of US2 - Browse and Search for Mentors
 * - Responsive design with Tailwind CSS
 *
 * @example
 * ```html
 * <app-mentor-list
 *   [mentors]="mentorList"
 *   [totalCount]="156"
 *   [currentPage]="2"
 *   [pageSize]="12"
 *   [loading]="isLoading"
 *   (pageChange)="onPageChange($event)">
 * </app-mentor-list>
 * ```
 */
@Component({
  selector: 'app-mentor-list',
  standalone: true,
  imports: [CommonModule, MentorCard, PaginationComponent],
  templateUrl: './mentor-list.component.html',
  styleUrls: ['./mentor-list.component.css']
})
export class MentorListComponent {
  /**
   * Array of mentors to display
   */
  @Input() mentors: Mentor[] = [];

  /**
   * Total number of mentors in the dataset (for pagination)
   */
  @Input() totalCount: number = 0;

  /**
   * Current active page (1-indexed)
   */
  @Input() currentPage: number = 1;

  /**
   * Number of mentors per page
   */
  @Input() pageSize: number = 12;

  /**
   * Loading state - shows skeleton cards when true
   */
  @Input() loading: boolean = false;

  /**
   * Number of skeleton cards to show during loading
   */
  @Input() skeletonCount: number = 12;

  /**
   * Whether to show pagination controls
   */
  @Input() showPagination: boolean = true;

  /**
   * Event emitted when page changes
   */
  @Output() pageChange = new EventEmitter<number>();

  /**
   * Event emitted when page size changes
   */
  @Output() pageSizeChange = new EventEmitter<number>();

  constructor(private router: Router) {}

  /**
   * Handle mentor card click - navigate to mentor detail page
   * @param mentor The mentor that was clicked
   */
  onMentorClick(mentor: Mentor): void {
    this.router.navigate(['/mentors', mentor.id]);
  }

  /**
   * Handle page change event from pagination component
   * @param page New page number
   */
  onPageChange(page: number): void {
    this.pageChange.emit(page);
  }

  /**
   * Handle page size change event from pagination component
   * @param pageSize New page size
   */
  onPageSizeChange(pageSize: number): void {
    this.pageSizeChange.emit(pageSize);
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
