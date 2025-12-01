import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export type EmptyStateType = 'sessions' | 'mentors' | 'search' | 'notifications' | 'generic';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="flex flex-col items-center justify-center py-12 px-4 text-center">
      <!-- Icon -->
      <div [class]="iconContainerClass">
        <ng-container [ngSwitch]="type">
          <!-- Sessions Icon -->
          <svg *ngSwitchCase="'sessions'" class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" 
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z">
            </path>
          </svg>
          
          <!-- Mentors Icon -->
          <svg *ngSwitchCase="'mentors'" class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" 
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z">
            </path>
          </svg>
          
          <!-- Search Icon -->
          <svg *ngSwitchCase="'search'" class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" 
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z">
            </path>
          </svg>
          
          <!-- Notifications Icon -->
          <svg *ngSwitchCase="'notifications'" class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" 
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9">
            </path>
          </svg>
          
          <!-- Generic Icon -->
          <svg *ngSwitchDefault class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" 
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4">
            </path>
          </svg>
        </ng-container>
      </div>

      <!-- Title -->
      <h3 class="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
        {{ title }}
      </h3>

      <!-- Description -->
      <p class="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-sm">
        {{ description }}
      </p>

      <!-- Action Button -->
      <div *ngIf="actionLabel" class="mt-6">
        <button 
          *ngIf="!actionRoute; else routerButton"
          (click)="actionClick.emit()"
          class="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-all duration-200 shadow-sm hover:shadow-md">
          <ng-container *ngTemplateOutlet="actionContent"></ng-container>
        </button>
        
        <ng-template #routerButton>
          <a 
            [routerLink]="actionRoute"
            class="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-all duration-200 shadow-sm hover:shadow-md">
            <ng-container *ngTemplateOutlet="actionContent"></ng-container>
          </a>
        </ng-template>
        
        <ng-template #actionContent>
          <svg *ngIf="actionIcon" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path *ngIf="actionIcon === 'search'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            <path *ngIf="actionIcon === 'plus'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
            <path *ngIf="actionIcon === 'refresh'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
          {{ actionLabel }}
        </ng-template>
      </div>
    </div>
  `
})
export class EmptyStateComponent {
  @Input() type: EmptyStateType = 'generic';
  @Input() title = 'No items found';
  @Input() description = 'There are no items to display at the moment.';
  @Input() actionLabel?: string;
  @Input() actionRoute?: string;
  @Input() actionIcon?: 'search' | 'plus' | 'refresh';
  
  @Output() actionClick = new EventEmitter<void>();

  get iconContainerClass(): string {
    return 'w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 dark:text-gray-500';
  }
}
