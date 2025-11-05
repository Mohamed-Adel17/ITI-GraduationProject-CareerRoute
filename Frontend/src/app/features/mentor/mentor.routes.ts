import { Routes } from '@angular/router';

/**
 * Mentor routes - Protected by mentorRoleGuard at parent level in app.routes.ts
 *
 * Future routes to implement:
 * - dashboard: Mentor dashboard
 * - profile: Mentor profile view (public-facing)
 * - profile/edit: Edit mentor profile (TODO: Create MentorProfileEditPageComponent)
 * - sessions: Session management
 * - bookings: Booking requests
 * - availability: Availability calendar
 * - earnings: Earnings/payments
 * - reviews: Reviews received
 * - settings: Mentor settings
 */
export const MENTOR_ROUTES: Routes = [
  // TODO: Create MentorProfileEditPageComponent that uses MentorProfileFormComponent in edit mode
  // This component should:
  // 1. Load current mentor's profile using MentorService.getCurrentMentorProfile()
  // 2. Pass mentor data to MentorProfileFormComponent with mode='edit'
  // 3. Handle form submission with MentorService.updateCurrentMentorProfile()
  //
  // {
  //   path: 'profile/edit',
  //   loadComponent: () => import('../mentors/mentor-profile/mentor-profile-edit-page.component').then(m => m.MentorProfileEditPageComponent),
  //   title: 'Edit Mentor Profile - CareerRoute'
  // }

  // TODO: Add more mentor routes here as components are created
  // Example:
  // {
  //   path: 'dashboard',
  //   loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent)
  // },
];
