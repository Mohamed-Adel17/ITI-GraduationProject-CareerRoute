import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type SkeletonVariant = 'text' | 'circular' | 'rectangular' | 'card' | 'avatar';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="skeletonClass" [style.width]="width" [style.height]="height" aria-hidden="true">
      <ng-container *ngIf="variant === 'card'">
        <!-- Card skeleton layout -->
        <div class="p-4 space-y-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-600"></div>
            <div class="flex-1 space-y-2">
              <div class="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
              <div class="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
            </div>
          </div>
          <div class="space-y-2">
            <div class="h-3 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
            <div class="h-3 bg-gray-300 dark:bg-gray-600 rounded w-5/6"></div>
            <div class="h-3 bg-gray-300 dark:bg-gray-600 rounded w-4/6"></div>
          </div>
          <div class="flex gap-2 pt-2">
            <div class="h-8 bg-gray-300 dark:bg-gray-600 rounded flex-1"></div>
            <div class="h-8 bg-gray-300 dark:bg-gray-600 rounded flex-1"></div>
          </div>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .skeleton-base {
      background: linear-gradient(
        90deg,
        theme('colors.gray.200') 25%,
        theme('colors.gray.300') 50%,
        theme('colors.gray.200') 75%
      );
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }

    :host-context(.dark) .skeleton-base {
      background: linear-gradient(
        90deg,
        theme('colors.gray.700') 25%,
        theme('colors.gray.600') 50%,
        theme('colors.gray.700') 75%
      );
      background-size: 200% 100%;
    }

    @keyframes shimmer {
      0% {
        background-position: 200% 0;
      }
      100% {
        background-position: -200% 0;
      }
    }
  `]
})
export class SkeletonComponent {
  @Input() variant: SkeletonVariant = 'text';
  @Input() width?: string;
  @Input() height?: string;
  @Input() lines = 1;

  get skeletonClass(): string {
    const baseClass = 'skeleton-base';
    
    const variantClasses: Record<SkeletonVariant, string> = {
      text: `${baseClass} h-4 rounded`,
      circular: `${baseClass} rounded-full`,
      rectangular: `${baseClass} rounded-lg`,
      card: `${baseClass} rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700`,
      avatar: `${baseClass} w-10 h-10 rounded-full`
    };

    return variantClasses[this.variant];
  }
}
