import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReviewService } from '../../../../core/services/review.service';
import { RatingDisplay } from '../../../../shared/components/rating-display/rating-display';
import {
  ReviewItem,
  MentorReviewsResponse,
  getReviewerDisplayName,
  formatReviewDateRelative
} from '../../../../shared/models/review.model';

/**
 * MentorReviewsSectionComponent
 *
 * Displays reviews for a mentor on the mentor detail page.
 * Fetches reviews from GET /api/mentors/{mentorId}/reviews endpoint.
 * Includes pagination support.
 */
@Component({
  selector: 'app-mentor-reviews-section',
  standalone: true,
  imports: [CommonModule, RatingDisplay],
  templateUrl: './mentor-reviews-section.html',
  styleUrl: './mentor-reviews-section.css'
})
export class MentorReviewsSectionComponent implements OnInit, OnChanges {
  @Input() mentorId!: string;
  @Input() totalReviews: number = 0;
  @Input() averageRating: number = 0;

  reviews: ReviewItem[] = [];
  isLoading = false;
  errorMessage: string | null = null;

  // Pagination
  currentPage = 1;
  pageSize = 5;
  totalPages = 0;
  hasNextPage = false;
  hasPreviousPage = false;

  constructor(private reviewService: ReviewService) {}

  ngOnInit(): void {
    if (this.mentorId) {
      this.loadReviews();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mentorId'] && !changes['mentorId'].firstChange && this.mentorId) {
      this.currentPage = 1;
      this.loadReviews();
    }
  }

  loadReviews(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.reviewService.getMentorReviews(this.mentorId, this.currentPage, this.pageSize)
      .subscribe({
        next: (response: MentorReviewsResponse) => {
          this.reviews = response.reviews;
          this.totalPages = response.pagination.totalPages;
          this.hasNextPage = response.pagination.hasNextPage;
          this.hasPreviousPage = response.pagination.hasPreviousPage;
          this.isLoading = false;
        },
        error: (err) => {
          this.isLoading = false;
          if (err.status === 404) {
            this.reviews = [];
          } else {
            this.errorMessage = 'Failed to load reviews';
          }
        }
      });
  }

  nextPage(): void {
    if (this.hasNextPage) {
      this.currentPage++;
      this.loadReviews();
    }
  }

  previousPage(): void {
    if (this.hasPreviousPage) {
      this.currentPage--;
      this.loadReviews();
    }
  }

  getReviewerName(review: ReviewItem): string {
    return getReviewerDisplayName(review);
  }

  getRelativeDate(dateString: string): string {
    return formatReviewDateRelative(dateString);
  }

  getInitials(review: ReviewItem): string {
    const firstInitial = review.menteeFirstName?.charAt(0) || '';
    const lastInitial = review.menteeLastName?.charAt(0) || '';
    return (firstInitial + lastInitial).toUpperCase() || '?';
  }

  get hasReviews(): boolean {
    return this.reviews.length > 0;
  }
}
