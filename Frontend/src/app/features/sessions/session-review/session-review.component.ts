import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { SessionService } from '../../../core/services/session.service';
import { ReviewService } from '../../../core/services/review.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { SessionDetailResponse, SessionStatus } from '../../../shared/models/session.model';
import { ReviewItem, CreateReviewRequest } from '../../../shared/models/review.model';
import { RatingDisplay } from '../../../shared/components/rating-display/rating-display';

/**
 * SessionReviewComponent
 *
 * Handles the review submission flow for completed sessions.
 * Route: /sessions/{sessionId}/review
 *
 * This route is accessed via:
 * 1. Email link sent 24 hours after session completion
 * 2. "Leave a Review" button on session details page
 *
 * Eligibility checks:
 * - User must be authenticated
 * - User must be the mentee of the session
 * - Session must be completed
 * - No existing review for this session
 */
@Component({
  selector: 'app-session-review',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, RatingDisplay],
  templateUrl: './session-review.component.html',
  styleUrl: './session-review.component.css'
})
export class SessionReviewComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly sessionService = inject(SessionService);
  private readonly reviewService = inject(ReviewService);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);

  session: SessionDetailResponse | null = null;
  existingReview: ReviewItem | null = null;
  isLoading = true;
  isSubmitting = false;
  errorMessage: string | null = null;

  // Eligibility state
  canReview = false;
  ineligibilityReason: string | null = null;

  // Form
  reviewForm: FormGroup;
  selectedRating = 0;
  hoverRating = 0;

  constructor() {
    this.reviewForm = this.fb.group({
      rating: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
      comment: ['', [Validators.minLength(5), Validators.maxLength(500)]]
    });
  }

  ngOnInit(): void {
    const sessionId = this.route.snapshot.paramMap.get('sessionId');
    if (sessionId) {
      this.loadSessionAndReview(sessionId);
    } else {
      this.errorMessage = 'Session ID not provided';
      this.isLoading = false;
    }
  }

  private loadSessionAndReview(sessionId: string): void {
    this.isLoading = true;
    this.errorMessage = null;

    // Load session details
    this.sessionService.getSessionById(sessionId).subscribe({
      next: (session) => {
        this.session = session;
        this.checkEligibility();
        this.loadExistingReview(sessionId);
      },
      error: (err) => {
        this.isLoading = false;
        if (err.status === 404) {
          this.errorMessage = 'Session not found';
        } else if (err.status === 403) {
          this.errorMessage = 'You do not have permission to view this session';
        } else {
          this.errorMessage = 'Failed to load session details';
        }
      }
    });
  }

  private loadExistingReview(sessionId: string): void {
    this.reviewService.getSessionReview(sessionId).subscribe({
      next: (review) => {
        this.existingReview = review;
        if (review) {
          this.canReview = false;
          this.ineligibilityReason = 'You have already reviewed this session';
        }
        this.isLoading = false;
      },
      error: () => {
        // No review exists or error - continue
        this.isLoading = false;
      }
    });
  }

  private checkEligibility(): void {
    if (!this.session) {
      this.canReview = false;
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.canReview = false;
      this.ineligibilityReason = 'Please log in to leave a review';
      return;
    }

    // Check if user is the mentee
    if (currentUser.id !== this.session.menteeId) {
      this.canReview = false;
      this.ineligibilityReason = 'Only the mentee can review this session';
      return;
    }

    // Check if session is completed
    if (this.session.status !== SessionStatus.Completed) {
      this.canReview = false;
      this.ineligibilityReason = 'Reviews can only be submitted for completed sessions';
      return;
    }

    this.canReview = true;
  }

  setRating(rating: number): void {
    this.selectedRating = rating;
    this.reviewForm.patchValue({ rating });
  }

  setHoverRating(rating: number): void {
    this.hoverRating = rating;
  }

  clearHoverRating(): void {
    this.hoverRating = 0;
  }

  get displayRating(): number {
    return this.hoverRating || this.selectedRating;
  }

  get commentLength(): number {
    return this.reviewForm.get('comment')?.value?.length || 0;
  }

  get hasCommentError(): boolean {
    const control = this.reviewForm.get('comment');
    return !!(control?.invalid && control?.touched);
  }

  get mentorName(): string {
    if (!this.session) return '';
    return `${this.session.mentorFirstName} ${this.session.mentorLastName}`;
  }

  submitReview(): void {
    if (!this.session || !this.canReview || this.reviewForm.invalid) {
      return;
    }

    if (this.selectedRating === 0) {
      this.notificationService.error('Please select a rating', 'Validation Error');
      return;
    }

    this.isSubmitting = true;

    const request: CreateReviewRequest = {
      rating: this.selectedRating,
      comment: this.reviewForm.value.comment?.trim() || undefined
    };

    this.reviewService.addReview(this.session.id, request).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.notificationService.success(
          'Thank you for your review!',
          'Review Submitted'
        );
        this.router.navigate(['/user/sessions']);
      },
      error: (err) => {
        this.isSubmitting = false;
        const message = err?.error?.message || 'Failed to submit review';
        this.notificationService.error(message, 'Error');
      }
    });
  }

  goBack(): void {
    if (this.session) {
      this.router.navigate(['/user/sessions', this.session.id]);
    } else {
      this.router.navigate(['/user/sessions']);
    }
  }
}
