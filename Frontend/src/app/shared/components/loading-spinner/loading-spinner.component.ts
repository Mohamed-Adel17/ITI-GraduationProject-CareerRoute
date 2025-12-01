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
      <img 
        src="/logo.png" 
        alt="Loading" 
        [class]="spinnerClass"
        aria-hidden="true" />
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
    @keyframes pulse-spin {
      0% {
        transform: rotate(0deg) scale(1);
        opacity: 1;
      }
      50% {
        transform: rotate(180deg) scale(1.1);
        opacity: 0.7;
      }
      100% {
        transform: rotate(360deg) scale(1);
        opacity: 1;
      }
    }
    .logo-spin {
      animation: pulse-spin 1.5s ease-in-out infinite;
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
      xs: 'w-4 h-4',
      sm: 'w-6 h-6',
      md: 'w-8 h-8',
      lg: 'w-12 h-12',
      xl: 'w-16 h-16'
    };

    return `logo-spin object-contain ${sizeClasses[this.size]}`;
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
