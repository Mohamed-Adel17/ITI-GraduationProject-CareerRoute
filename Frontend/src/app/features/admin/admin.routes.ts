import { Routes } from '@angular/router';

/**
 * Admin routes - Protected by adminRoleGuard at parent level in app.routes.ts
 */
export const ADMIN_ROUTES: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
    title: 'Admin Dashboard'
  },
  {
    path: 'mentor-approvals',
    loadComponent: () => import('./mentor-approvals/mentor-approvals.component').then(m => m.MentorApprovalsComponent),
    title: 'Mentor Approvals - Admin'
  },
  {
    path: 'payouts',
    loadComponent: () => import('./payout-management/payout-management.component').then(m => m.PayoutManagementComponent),
    title: 'Payout Management - Admin'
  },
  {
    path: 'disputes',
    loadComponent: () => import('./dispute-management/dispute-management.component').then(m => m.DisputeManagementComponent),
    title: 'Dispute Management - Admin'
  },
  {
    path: 'categories',
    loadComponent: () => import('./category-management/category-management.component').then(m => m.CategoryManagementComponent),
    title: 'Category Management - Admin'
  },
  {
    path: 'skills',
    loadComponent: () => import('./skills-management/skills-management.component').then(m => m.SkillsManagementComponent),
    title: 'Skills Management - Admin'
  },
  {
    path: 'users',
    loadComponent: () => import('./user-management/user-management.component').then(m => m.UserManagementComponent),
    title: 'User Management - Admin'
  }
];
