import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-admin-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="flex gap-1 border-b border-gray-200">
      <a routerLink="/admin/dashboard" routerLinkActive="text-primary border-primary" [routerLinkActiveOptions]="{exact: true}"
         class="px-4 py-2 text-sm font-medium border-b-2 border-transparent hover:text-gray-900 hover:border-gray-300"
         [class.text-gray-600]="!isActive('dashboard')">
        Dashboard
      </a>
      <a routerLink="/admin/mentor-approvals" routerLinkActive="text-primary border-primary"
         class="px-4 py-2 text-sm font-medium border-b-2 border-transparent hover:text-gray-900 hover:border-gray-300 flex items-center gap-2"
         [class.text-gray-600]="!isActive('mentor-approvals')">
        Mentor Approvals
        <span *ngIf="pendingMentorCount > 0" class="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
          {{ pendingMentorCount }}
        </span>
      </a>
      <a routerLink="/admin/payouts" routerLinkActive="text-primary border-primary"
         class="px-4 py-2 text-sm font-medium border-b-2 border-transparent hover:text-gray-900 hover:border-gray-300"
         [class.text-gray-600]="!isActive('payouts')">
        Payouts
      </a>
      <a routerLink="/admin/disputes" routerLinkActive="text-primary border-primary"
         class="px-4 py-2 text-sm font-medium border-b-2 border-transparent hover:text-gray-900 hover:border-gray-300"
         [class.text-gray-600]="!isActive('disputes')">
        Disputes
      </a>
      <a routerLink="/admin/categories" routerLinkActive="text-primary border-primary"
         class="px-4 py-2 text-sm font-medium border-b-2 border-transparent hover:text-gray-900 hover:border-gray-300"
         [class.text-gray-600]="!isActive('categories')">
        Categories
      </a>
      <a routerLink="/admin/skills" routerLinkActive="text-primary border-primary"
         class="px-4 py-2 text-sm font-medium border-b-2 border-transparent hover:text-gray-900 hover:border-gray-300"
         [class.text-gray-600]="!isActive('skills')">
        Skills
      </a>
      <a routerLink="/admin/users" routerLinkActive="text-primary border-primary"
         class="px-4 py-2 text-sm font-medium border-b-2 border-transparent hover:text-gray-900 hover:border-gray-300"
         [class.text-gray-600]="!isActive('users')">
        Users
      </a>
    </nav>
  `
})
export class AdminNavComponent {
  @Input() activeTab: string = '';
  @Input() pendingMentorCount: number = 0;

  isActive(tab: string): boolean {
    return this.activeTab === tab;
  }
}
