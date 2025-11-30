import { Routes } from '@angular/router';
import { canApplyAsMentorGuard } from '../../core/guards/role.guard';

/**
 * User routes - Protected by authGuard at parent level in app.routes.ts
 *
 * Implemented routes:
 * - apply-mentor: Apply to become a mentor (only for users who registered as mentors)
 * - profile: View user profile
 * - profile/edit: Edit user profile
 * - sessions: View all sessions
 * - sessions/:id: View session details
 *
 * Future routes to implement:
 * - dashboard: User dashboard
 * - payments: Payment history
 * - reviews/create/:sessionId: Create review
 * - messages: Chat/messaging
 */
export const USER_ROUTES: Routes = [
  {
    path: 'apply-mentor',
    loadComponent: () => import('../mentors/mentor-application/mentor-application.component').then(m => m.MentorApplicationComponent),
    canActivate: [canApplyAsMentorGuard],
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
  },
  {
    path: 'sessions',
    loadComponent: () => import('./sessions/sessions.component').then(m => m.SessionsComponent),
    title: 'My Sessions - Career Route'
  },
  {
    path: 'sessions/:id',
    loadComponent: () => import('../../shared/components/session-details/session-details.component').then(m => m.SessionDetailsComponent),
    title: 'Session Details - Career Route'
  }
  // TODO: Add more user routes here as components are created
  // - dashboard - User dashboard
  // - payments - Payment history
];
