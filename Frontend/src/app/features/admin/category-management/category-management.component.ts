import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminNavComponent } from '../../../shared/components/admin-nav/admin-nav.component';
import { CategoryService } from '../../../core/services/category.service';
import { MentorService } from '../../../core/services/mentor.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Category } from '../../../shared/models/category.model';

@Component({
  selector: 'app-category-management',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminNavComponent],
  templateUrl: './category-management.component.html',
  styleUrls: ['./category-management.component.css']
})
export class CategoryManagementComponent implements OnInit {
  categories: Category[] = [];
  loading = true;
  pendingMentorCount = 0;

  // Modal state
  showModal = false;
  editingCategory: Category | null = null;
  form = { name: '', description: '', iconUrl: '' };
  saving = false;

  // Toggle active state
  togglingId: number | null = null;

  constructor(
    private categoryService: CategoryService,
    private mentorService: MentorService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadPendingCount();
  }

  loadCategories(): void {
    this.loading = true;
    this.categoryService.getAllCategoriesForAdmin().subscribe({
      next: (categories) => {
        this.categories = categories;
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

  openCreateModal(): void {
    this.editingCategory = null;
    this.form = { name: '', description: '', iconUrl: '' };
    this.showModal = true;
  }

  openEditModal(category: Category): void {
    this.editingCategory = category;
    this.form = {
      name: category.name,
      description: category.description || '',
      iconUrl: category.iconUrl || ''
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingCategory = null;
  }

  save(): void {
    if (!this.form.name.trim()) return;
    this.saving = true;

    const data = {
      name: this.form.name.trim(),
      description: this.form.description.trim() || undefined,
      iconUrl: this.form.iconUrl.trim() || undefined
    };

    const request = this.editingCategory
      ? this.categoryService.updateCategory(this.editingCategory.id, data)
      : this.categoryService.createCategory(data);

    request.subscribe({
      next: () => {
        this.notificationService.success(this.editingCategory ? 'Category updated' : 'Category created');
        this.closeModal();
        this.loadCategories();
        this.saving = false;
      },
      error: () => this.saving = false
    });
  }

  toggleActive(cat: Category): void {
    this.togglingId = cat.id;
    this.categoryService.updateCategory(cat.id, { isActive: !cat.isActive }).subscribe({
      next: () => {
        this.notificationService.success(cat.isActive ? 'Category deactivated' : 'Category activated');
        this.togglingId = null;
        this.loadCategories();
      },
      error: () => this.togglingId = null
    });
  }
}
