import { Routes } from '@angular/router';

/**
 * Admin routes - Protected by adminRoleGuard at parent level in app.routes.ts
 *
 * Current routes:
 * - dashboard: Admin dashboard with stats overview
 * - mentor-approvals: Review and approve/reject pending mentor applications
 * - payouts: Process or cancel payout requests
 * - disputes: Review and resolve session disputes
 */
export const ADMIN_ROUTES: Routes = [
  // Default redirect to dashboard
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },

  // Dashboard - Overview with stats and quick actions
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./dashboard/admin-dashboard.component')
        .then(m => m.AdminDashboardComponent),
    title: 'Admin Dashboard'
  },

  // Mentor Approvals - Review and approve/reject pending applications
  {
    path: 'mentor-approvals',
    loadComponent: () =>
      import('./mentor-approvals/mentor-approvals.component')
        .then(m => m.MentorApprovalsComponent),
    title: 'Mentor Approvals - Admin'
  },

  // Payout Management - Admin can process or cancel payout requests
  {
    path: 'payouts',
    loadComponent: () =>
      import('./payout-management/payout-management.component')
        .then(m => m.PayoutManagementComponent),
    title: 'Payout Management - Admin'
  },

  // Dispute Management - Review and resolve session disputes
  {
    path: 'disputes',
    loadComponent: () =>
      import('./dispute-management/dispute-management.component')
        .then(m => m.DisputeManagementComponent),
    title: 'Dispute Management - Admin'
  }
];
