import { Routes } from '@angular/router';

/**
 * User routes - Protected by authGuard at parent level in app.routes.ts
 *
 * Implemented routes:
 * - apply-mentor: Apply to become a mentor
 *
 * Future routes to implement:
 * - dashboard: User dashboard
 * - profile: View profile
 * - profile/edit: Edit profile
 * - bookings: Booking management
 * - sessions: Session history
 * - payments: Payment history
 * - reviews/create/:sessionId: Create review
 * - messages: Chat/messaging
 */
export const USER_ROUTES: Routes = [
  {
    path: 'apply-mentor',
    loadComponent: () => import('../mentors/mentor-profile/mentor-application.component').then(m => m.MentorApplicationComponent),
    title: 'Become a Mentor - CareerRoute'
  }
  // TODO: Add user routes here as components are created
  // Example:
  // {
  //   path: 'dashboard',
  //   loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent)
  // },
];
