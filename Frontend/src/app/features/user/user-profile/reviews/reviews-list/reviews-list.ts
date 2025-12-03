import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { Review, ReviewService } from '../../../../../core/services/review.service';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AddReviewModalComponent } from '../add-review-modal/add-review-modal';

@Component({
  selector: 'app-reviews-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AddReviewModalComponent],
  templateUrl: './reviews-list.html',
  styleUrls: ['./reviews-list.css']
})
export class ReviewsListComponent implements OnInit, OnChanges {
  @Input() mentorId!: number;
  @Input() sessionEnded?: boolean; // new input to show evaluation area
  reviews: Review[] = [];
  avgRating: number = 0;

  evaluationForm: FormGroup;

  constructor(private reviewService: ReviewService, private fb: FormBuilder) {
    this.evaluationForm = this.fb.group({
      rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
      comment: ['']
    });
  }

  ngOnInit(): void {
    if (this.mentorId != null) this.loadReviews();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['mentorId'] && this.mentorId != null) {
      this.loadReviews();
    }
  }

  loadReviews() {
    this.reviewService.getMentorReviews(this.mentorId).subscribe(reviews => {
      this.reviews = reviews;
      this.avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / (reviews.length || 1);
    });
  }

  onReviewAdded(review: Review) {
    this.reviews.push(review);
    this.avgRating = this.reviews.reduce((sum, r) => sum + r.rating, 0) / this.reviews.length;
  }

  // new method to submit the evaluation shown after session ends
  submitEvaluation() {
    if (this.evaluationForm.invalid || this.mentorId == null) return;

    const newReview: Partial<Review> = {
      rating: this.evaluationForm.value.rating,
      comment: this.evaluationForm.value.comment,
      sessionId: 101,  // mock data, replace as needed
      menteeId: 1,     // mock data, replace with real user id
      mentorId: this.mentorId
    };

    this.reviewService.addReview(newReview).subscribe(review => {
      this.onReviewAdded(review);
      this.evaluationForm.reset({ rating: 5, comment: '' });
    });
  }
}
