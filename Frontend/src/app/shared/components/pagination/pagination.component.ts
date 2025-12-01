import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * PaginationComponent
 *
 * Reusable pagination controls for paged data (mentor lists, search results).
 * Displays page numbers, prev/next buttons, and optional page size selector.
 *
 * Features:
 * - Calculates total pages and visible page numbers
 * - Smart ellipsis display for large page counts
 * - Emits events for page and page size changes
 * - Disables prev/next at boundaries
 * - Highlights current page
 * - Responsive design with Tailwind CSS
 * - Accessible with ARIA attributes
 *
 * @example
 * ```html
 * <app-pagination
 *   [totalItems]="156"
 *   [currentPage]="2"
 *   [pageSize]="10"
 *   [showPageSizeSelector]="true"
 *   (pageChange)="onPageChange($event)"
 *   (pageSizeChange)="onPageSizeChange($event)">
 * </app-pagination>
 * ```
 *
 * @remarks
 * - Follows design specs from CareerRoute-MVP-Design
 * - Uses Tailwind CSS for styling
 * - Part of US2 - Browse and Search for Mentors
 */
@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.css']
})
export class PaginationComponent implements OnInit, OnChanges {
  /**
   * Total number of items in the dataset
   */
  @Input() totalItems: number = 0;

  /**
   * Current active page (1-indexed)
   */
  @Input() currentPage: number = 1;

  /**
   * Number of items per page
   */
  @Input() pageSize: number = 10;

  /**
   * Whether to show the page size selector dropdown
   */
  @Input() showPageSizeSelector: boolean = true;

  /**
   * Available page size options for the selector
   */
  @Input() pageSizeOptions: number[] = [10, 20, 50, 100];

  /**
   * Maximum number of page buttons to display (excluding first, last, and ellipsis)
   */
  @Input() maxVisiblePages: number = 5;

  /**
   * Event emitted when page changes
   */
  @Output() pageChange = new EventEmitter<number>();

  /**
   * Event emitted when page size changes
   */
  @Output() pageSizeChange = new EventEmitter<number>();

  // Computed properties
  totalPages: number = 0;
  visiblePages: (number | string)[] = [];
  startItem: number = 0;
  endItem: number = 0;
  selectedPageSize: number = 12; // Track selected page size for dropdown

  ngOnInit(): void {
    // Initialize selectedPageSize with the input value
    this.selectedPageSize = this.pageSize;
  }

  ngOnChanges(changes: SimpleChanges): void {

    // Log specifically when pageSize changes
    if (changes['pageSize']) {
      // Update internal selected value
      this.selectedPageSize = this.pageSize;
    }
    // Recalculate pagination when inputs change
    this.calculatePagination();
  }

  /**
   * Calculate pagination metadata
   */
  private calculatePagination(): void {
    // Calculate total pages
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);

    // Ensure current page is within valid range
    if (this.currentPage < 1) {
      this.currentPage = 1;
    }
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    }

    // Calculate visible page numbers with ellipsis
    this.visiblePages = this.calculateVisiblePages();

    // Calculate item range for display (e.g., "Showing 11-20 of 156")
    this.startItem = this.totalItems === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
    this.endItem = Math.min(this.currentPage * this.pageSize, this.totalItems);
  }

  /**
   * Calculate which page numbers to display with smart ellipsis
   * Algorithm:
   * - Always show first and last page
   * - Show current page and surrounding pages
   * - Use ellipsis (...) for gaps
   *
   * Examples:
   * - Total 5 pages: [1, 2, 3, 4, 5]
   * - Total 10 pages, current 1: [1, 2, 3, ..., 10]
   * - Total 10 pages, current 5: [1, ..., 4, 5, 6, ..., 10]
   * - Total 10 pages, current 10: [1, ..., 8, 9, 10]
   */
  private calculateVisiblePages(): (number | string)[] {
    const pages: (number | string)[] = [];

    if (this.totalPages <= this.maxVisiblePages + 2) {
      // Show all pages if total is small
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
      return pages;
    }

    // Always show first page
    pages.push(1);

    // Calculate range around current page
    const leftBoundary = Math.max(2, this.currentPage - Math.floor(this.maxVisiblePages / 2));
    const rightBoundary = Math.min(this.totalPages - 1, this.currentPage + Math.floor(this.maxVisiblePages / 2));

    // Add left ellipsis if needed
    if (leftBoundary > 2) {
      pages.push('...');
    }

    // Add pages around current page
    for (let i = leftBoundary; i <= rightBoundary; i++) {
      pages.push(i);
    }

    // Add right ellipsis if needed
    if (rightBoundary < this.totalPages - 1) {
      pages.push('...');
    }

    // Always show last page
    if (this.totalPages > 1) {
      pages.push(this.totalPages);
    }

    return pages;
  }

  /**
   * Navigate to a specific page
   * @param page Page number to navigate to
   */
  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) {
      return;
    }
    this.currentPage = page;
    this.calculatePagination();
    this.pageChange.emit(page);
  }

  /**
   * Navigate to previous page
   */
  previousPage(): void {
    if (this.hasPreviousPage()) {
      this.goToPage(this.currentPage - 1);
    }
  }

  /**
   * Navigate to next page
   */
  nextPage(): void {
    if (this.hasNextPage()) {
      this.goToPage(this.currentPage + 1);
    }
  }

  /**
   * Check if there is a previous page
   */
  hasPreviousPage(): boolean {
    return this.currentPage > 1;
  }

  /**
   * Check if there is a next page
   */
  hasNextPage(): boolean {
    return this.currentPage < this.totalPages;
  }

  /**
   * Handle page size change
   * @param event Change event from select element
   */
  onPageSizeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const newPageSize = parseInt(target.value, 10);

    if (newPageSize === this.pageSize) {
      return;
    }

    // Calculate which page to show after page size change
    // Keep the first item of current page visible
    const firstItemIndex = (this.currentPage - 1) * this.pageSize;
    const newPage = Math.floor(firstItemIndex / newPageSize) + 1;

    this.pageSize = newPageSize;
    this.currentPage = newPage;
    this.calculatePagination();

    this.pageSizeChange.emit(newPageSize);
    this.pageChange.emit(newPage);
  }

  /**
   * Check if a page number is the current page
   * @param page Page number or ellipsis string
   */
  isCurrentPage(page: number | string): boolean {
    return typeof page === 'number' && page === this.currentPage;
  }

  /**
   * Check if a page item is an ellipsis
   * @param page Page number or ellipsis string
   */
  isEllipsis(page: number | string): boolean {
    return page === '...';
  }

  /**
   * Track by function for ngFor optimization
   * @param index Array index
   * @param page Page number or ellipsis
   */
  trackByPage(index: number, page: number | string): string | number {
    return typeof page === 'number' ? page : `ellipsis-${index}`;
  }
}
