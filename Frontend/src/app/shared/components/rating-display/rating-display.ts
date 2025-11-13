import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-rating-display',
  imports: [CommonModule],
  templateUrl: './rating-display.html',
  styleUrl: './rating-display.css'
})
export class RatingDisplay implements OnChanges {
  @Input() rating: number = 0;
  @Input() showNumericRating: boolean = true;
  @Input() maxStars: number = 5;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';

  stars: ('full' | 'half' | 'empty')[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['rating'] || changes['maxStars']) {
      this.calculateStars();
    }
  }

  private calculateStars(): void {
    this.stars = [];
    const clampedRating = Math.max(0, Math.min(this.rating, this.maxStars));

    for (let i = 1; i <= this.maxStars; i++) {
      const diff = clampedRating - (i - 1);

      if (diff >= 1) {
        this.stars.push('full');
      } else if (diff >= 0.5) {
        this.stars.push('half');
      } else {
        this.stars.push('empty');
      }
    }
  }

  get starSizeClass(): string {
    const sizeMap = {
      'sm': 'w-4 h-4',
      'md': 'w-5 h-5',
      'lg': 'w-6 h-6'
    };
    return sizeMap[this.size];
  }

  get textSizeClass(): string {
    const sizeMap = {
      'sm': 'text-sm',
      'md': 'text-base',
      'lg': 'text-lg'
    };
    return sizeMap[this.size];
  }
}
