import { Component, Output, EventEmitter, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators , ReactiveFormsModule } from '@angular/forms';
import { Review, ReviewService } from '../../../../../core/services/review.service';

@Component({
  selector: 'app-add-review-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './add-review-modal.html',
  styleUrls: ['./add-review-modal.css']
})
export class AddReviewModalComponent {
  @Input() mentorId?: number;
  @Output() reviewAdded = new EventEmitter<Review>();

  reviewForm: FormGroup;

  constructor(private fb: FormBuilder, private reviewService: ReviewService) {
    this.reviewForm = this.fb.group({
      rating: [null, Validators.required],
      comment: ['']
    });
  }

  submitReview() {
    if (this.reviewForm.invalid) return;

    const newReview: Partial<Review> = {
      rating: this.reviewForm.value.rating,
      comment: this.reviewForm.value.comment,
      sessionId: 101,  // mock data, later dynamic
      menteeId: 1,     // mock data, later from user
      mentorId: this.mentorId ?? 1   // use passed mentorId when available
    };

    this.reviewService.addReview(newReview).subscribe(review => {
      this.reviewAdded.emit(review);
      this.reviewForm.reset();
    });
  }
}