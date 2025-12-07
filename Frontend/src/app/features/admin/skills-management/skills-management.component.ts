import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminNavComponent } from '../../../shared/components/admin-nav/admin-nav.component';
import { SkillService } from '../../../core/services/skill.service';
import { CategoryService } from '../../../core/services/category.service';
import { MentorService } from '../../../core/services/mentor.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Skill } from '../../../shared/models/skill.model';
import { Category } from '../../../shared/models/category.model';

@Component({
  selector: 'app-skills-management',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminNavComponent],
  templateUrl: './skills-management.component.html',
  styleUrls: ['./skills-management.component.css']
})
export class SkillsManagementComponent implements OnInit {
  skills: Skill[] = [];
  categories: Category[] = [];
  loading = true;
  pendingMentorCount = 0;

  // Filter
  filterCategoryId: number | null = null;

  // Modal state
  showModal = false;
  editingSkill: Skill | null = null;
  form = { name: '', categoryId: 0 };
  saving = false;

  // Toggle active state
  togglingId: number | null = null;

  constructor(
    private skillService: SkillService,
    private categoryService: CategoryService,
    private mentorService: MentorService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadSkills();
    this.loadPendingCount();
  }

  loadCategories(): void {
    this.categoryService.getAllCategories().subscribe({
      next: (categories) => this.categories = categories
    });
  }

  loadSkills(): void {
    this.loading = true;
    const categoryId = this.filterCategoryId || undefined;
    this.skillService.getAllSkillsForAdmin(categoryId).subscribe({
      next: (skills) => {
        this.skills = skills;
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

  onFilterChange(): void {
    this.loadSkills();
  }

  openCreateModal(): void {
    this.editingSkill = null;
    this.form = { name: '', categoryId: this.categories[0]?.id || 0 };
    this.showModal = true;
  }

  openEditModal(skill: Skill): void {
    this.editingSkill = skill;
    this.form = { name: skill.name, categoryId: skill.categoryId };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingSkill = null;
  }

  save(): void {
    if (!this.form.name.trim() || !this.form.categoryId) return;
    this.saving = true;

    const data = { name: this.form.name.trim(), categoryId: this.form.categoryId };

    const request = this.editingSkill
      ? this.skillService.updateSkill(this.editingSkill.id, data)
      : this.skillService.createSkill(data);

    request.subscribe({
      next: () => {
        this.notificationService.success(this.editingSkill ? 'Skill updated' : 'Skill created');
        this.closeModal();
        this.loadSkills();
        this.saving = false;
      },
      error: () => this.saving = false
    });
  }

  toggleActive(skill: Skill): void {
    this.togglingId = skill.id;
    this.skillService.updateSkill(skill.id, { isActive: !skill.isActive }).subscribe({
      next: () => {
        this.notificationService.success(skill.isActive ? 'Skill deactivated' : 'Skill activated');
        this.togglingId = null;
        this.loadSkills();
      },
      error: () => this.togglingId = null
    });
  }

  getCategoryName(categoryId: number): string {
    return this.categories.find(c => c.id === categoryId)?.name || '';
  }
}
