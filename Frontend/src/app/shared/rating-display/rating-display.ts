import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-rating-display',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rating-display.html',
  styleUrls: ['./rating-display.css']
})
export class RatingDisplayComponent {
  @Input() rating: number = 0;
  @Input() totalReviews?: number;

  get fullStars(): number[] {
    return Array(Math.floor(this.rating)).fill(0);
  }

  get hasHalfStar(): boolean {
    const decimal = this.rating - Math.floor(this.rating);
    return decimal >= 0.5;
  }

  get emptyStars(): number[] {
    return Array(5 - Math.ceil(this.rating)).fill(0);
  }
}

