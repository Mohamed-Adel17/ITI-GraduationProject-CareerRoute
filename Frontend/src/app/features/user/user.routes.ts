import { Routes } from '@angular/router';

/**
 * User routes - Protected by authGuard at parent level in app.routes.ts
 *
 * Implemented routes:
 * - apply-mentor: Apply to become a mentor
 * - profile: View user profile
 * - profile/edit: Edit user profile
 *
 * Future routes to implement:
 * - dashboard: User dashboard
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
  },
  {
    path: 'profile',
    loadComponent: () => import('./user-profile/user-profile.component').then(m => m.UserProfileComponent),
    title: 'My Profile - Career Route'
  },
  {
    path: 'profile/edit',
    loadComponent: () => import('./edit-profile/edit-profile.component').then(m => m.EditProfileComponent),
    title: 'Edit Profile - Career Route'
  }
  // TODO: Add more user routes here as components are created
  // Example:
  // {
  //   path: 'dashboard',
  //   loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent)
  // },
];
