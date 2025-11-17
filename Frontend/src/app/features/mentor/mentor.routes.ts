import { Routes } from '@angular/router';

/**
 * Mentor routes - Protected by mentorRoleGuard at parent level in app.routes.ts
 *
 * Implemented routes:
 * - profile: Mentor profile view (own profile, read-only)
 * - profile/edit: Edit mentor profile
 *
 * Future routes to implement:
 * - dashboard: Mentor dashboard
 * - sessions: Session management
 * - bookings: Booking requests
 * - availability: Availability calendar
 * - earnings: Earnings/payments
 * - reviews: Reviews received
 * - settings: Mentor settings
 */
export const MENTOR_ROUTES: Routes = [
  {
    path: 'profile',
    loadComponent: () => import('./mentor-profile/mentor-profile.component').then(m => m.MentorProfileComponent),
    title: 'My Mentor Profile - CareerRoute'
  },
  {
    path: 'profile/edit',
    loadComponent: () => import('./edit-mentor-profile/edit-mentor-profile.component').then(m => m.EditMentorProfileComponent),
    title: 'Edit Mentor Profile - CareerRoute'
  },

  // TODO: Add more mentor routes here as components are created
  // Example:
  // {
  //   path: 'dashboard',
  //   loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
  //   title: 'Mentor Dashboard - CareerRoute'
  // },
];
