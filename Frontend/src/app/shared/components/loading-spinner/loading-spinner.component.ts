import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type SpinnerVariant = 'primary' | 'white' | 'gray';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="containerClass" role="status" aria-label="Loading">
      <svg 
        [class]="spinnerClass" 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24"
        aria-hidden="true">
        <circle 
          class="opacity-25" 
          cx="12" 
          cy="12" 
          r="10" 
          stroke="currentColor" 
          stroke-width="4">
        </circle>
        <path 
          class="opacity-75" 
          fill="currentColor" 
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
        </path>
      </svg>
      <span *ngIf="text" [class]="textClass">{{ text }}</span>
      <span class="sr-only">Loading...</span>
    </div>
  `,
  styles: [`
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
  `]
})
export class LoadingSpinnerComponent {
  @Input() size: SpinnerSize = 'md';
  @Input() variant: SpinnerVariant = 'primary';
  @Input() text?: string;
  @Input() centered = false;
  @Input() fullScreen = false;

  get containerClass(): string {
    const classes = ['inline-flex', 'items-center', 'gap-2'];
    
    if (this.centered) {
      classes.push('justify-center', 'w-full');
    }
    
    if (this.fullScreen) {
      classes.push('fixed', 'inset-0', 'bg-white/80', 'dark:bg-gray-900/80', 'z-50', 'flex', 'justify-center', 'items-center');
    }
    
    return classes.join(' ');
  }

  get spinnerClass(): string {
    const sizeClasses: Record<SpinnerSize, string> = {
      xs: 'w-3 h-3',
      sm: 'w-4 h-4',
      md: 'w-6 h-6',
      lg: 'w-8 h-8',
      xl: 'w-12 h-12'
    };

    const variantClasses: Record<SpinnerVariant, string> = {
      primary: 'text-primary',
      white: 'text-white',
      gray: 'text-gray-400'
    };

    return `animate-spin ${sizeClasses[this.size]} ${variantClasses[this.variant]}`;
  }

  get textClass(): string {
    const sizeClasses: Record<SpinnerSize, string> = {
      xs: 'text-xs',
      sm: 'text-sm',
      md: 'text-sm',
      lg: 'text-base',
      xl: 'text-lg'
    };

    const variantClasses: Record<SpinnerVariant, string> = {
      primary: 'text-gray-600 dark:text-gray-300',
      white: 'text-white',
      gray: 'text-gray-500 dark:text-gray-400'
    };

    return `${sizeClasses[this.size]} ${variantClasses[this.variant]}`;
  }
}
