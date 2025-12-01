import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-rating-display',
  imports: [CommonModule],
  templateUrl: './rating-display.component.html'
})
export class RatingDisplayComponent {
  @Input() rating: number = 0;
  @Input() reviewCount?: number;

  get fullStars(): number[] {
    return Array(Math.floor(this.rating)).fill(0);
  }

  get hasHalfStar(): boolean {
    return this.rating % 1 !== 0;
  }

  get emptyStars(): number[] {
    const emptyCount = 5 - Math.ceil(this.rating);
    return Array(emptyCount).fill(0);
  }
}
