import { Routes } from '@angular/router';

/**
 * Admin routes - Protected by adminRoleGuard at parent level in app.routes.ts
 *
 * Current routes:
 * - mentor-approvals: Review and approve/reject pending mentor applications
 *
 * Future routes to implement:
 * - dashboard: Admin dashboard
 * - users: User management
 * - mentors: Mentor management (full CRUD)
 * - sessions: Session monitoring
 * - categories: Category management
 * - payments: Payment tracking
 * - reports: Analytics/reporting
 * - settings: Platform settings
 */
export const ADMIN_ROUTES: Routes = [
  // Default redirect to mentor-approvals
  {
    path: '',
    redirectTo: 'mentor-approvals',
    pathMatch: 'full'
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

  // TODO: Add more admin routes here as components are created
];
