import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

interface InfoSection {
  title?: string;
  content: string[];
}

@Component({
  selector: 'app-info-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <h1 class="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-8">{{ title }}</h1>
        
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 sm:p-8 space-y-6">
          <div *ngFor="let section of sections" class="space-y-3">
            <h2 *ngIf="section.title" class="text-xl font-semibold text-gray-900 dark:text-white">{{ section.title }}</h2>
            <p *ngFor="let paragraph of section.content" class="text-gray-600 dark:text-gray-300 leading-relaxed">
              {{ paragraph }}
            </p>
          </div>
        </div>
        
        <p *ngIf="lastUpdated" class="mt-6 text-sm text-gray-500 dark:text-gray-400">Last updated: {{ lastUpdated }}</p>
      </div>
    </div>
  `
})
export class InfoPageComponent {
  @Input() title = '';
  @Input() sections: InfoSection[] = [];
  @Input() lastUpdated?: string;
}
