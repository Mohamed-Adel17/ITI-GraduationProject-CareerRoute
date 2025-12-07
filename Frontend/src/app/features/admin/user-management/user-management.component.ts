import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminNavComponent } from '../../../shared/components/admin-nav/admin-nav.component';
import { UserService } from '../../../core/services/user.service';
import { MentorService } from '../../../core/services/mentor.service';
import { User } from '../../../shared/models/user.model';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminNavComponent],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css']
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  loading = true;
  pendingMentorCount = 0;
  searchTerm = '';

  // View details modal
  selectedUser: User | null = null;

  constructor(
    private userService: UserService,
    private mentorService: MentorService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
    this.loadPendingCount();
  }

  loadUsers(): void {
    this.loading = true;
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.applyFilter();
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  loadPendingCount(): void {
    this.mentorService.getPendingMentorApplications().subscribe({
      next: (apps) => this.pendingMentorCount = apps.length
    });
  }

  applyFilter(): void {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredUsers = this.users;
    } else {
      this.filteredUsers = this.users.filter(u =>
        u.firstName.toLowerCase().includes(term) ||
        u.lastName.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term)
      );
    }
  }

  viewDetails(user: User): void {
    this.selectedUser = user;
  }

  closeModal(): void {
    this.selectedUser = null;
  }

  getFullName(user: User): string {
    return `${user.firstName} ${user.lastName}`;
  }

  getCareerInterestNames(user: User): string[] {
    return user.careerInterests?.map(s => s.name) || [];
  }
}
