import { Routes } from '@angular/router';
import { pendingMentorGuard, approvedMentorGuard } from '../../core/guards/role.guard';

/**
 * Mentor routes - Protected by different guards based on approval status
 *
 * Route Guard Strategy:
 * - application-pending: pendingMentorGuard (allows both pending and approved mentors)
 * - All other routes: approvedMentorGuard (only approved mentors, redirects pending to application-pending)
 *
 * Implemented routes:
 * - application-pending: Application status page for pending mentors
 * - profile: Mentor profile view (own profile, read-only) - APPROVED ONLY
 * - profile/edit: Edit mentor profile - APPROVED ONLY
 * - manage-availability: Manage time slots and availability - APPROVED ONLY
 *
 * Future routes to implement:
 * - dashboard: Mentor dashboard
 * - sessions: Session management
 * - bookings: Booking requests
 * - earnings: Earnings/payments
 * - reviews: Reviews received
 * - settings: Mentor settings
 */
export const MENTOR_ROUTES: Routes = [
  {
    path: 'application-pending',
    loadComponent: () => import('./application-pending/application-pending.component').then(m => m.ApplicationPendingComponent),
    canActivate: [pendingMentorGuard],
    title: 'Application Pending - CareerRoute'
  },
  {
    path: 'profile',
    loadComponent: () => import('./mentor-profile/mentor-profile.component').then(m => m.MentorProfileComponent),
    canActivate: [approvedMentorGuard],
    title: 'My Mentor Profile - CareerRoute'
  },
  {
    path: 'profile/edit',
    loadComponent: () => import('./edit-mentor-profile/edit-mentor-profile.component').then(m => m.EditMentorProfileComponent),
    canActivate: [approvedMentorGuard],
    title: 'Edit Mentor Profile - CareerRoute'
  },
  {
    path: 'manage-availability',
    loadComponent: () => import('./manage-availability/manage-availability').then(m => m.ManageAvailabilityComponent),
    canActivate: [approvedMentorGuard],
    title: 'Manage Availability - CareerRoute'
  },

  // TODO: Add more mentor routes here as components are created
  // All future mentor routes should use approvedMentorGuard
  // Example:
  // {
  //   path: 'dashboard',
  //   loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
  //   canActivate: [approvedMentorGuard],
  //   title: 'Mentor Dashboard - CareerRoute'
  // },
];
