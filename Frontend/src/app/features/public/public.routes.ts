import { Routes } from '@angular/router';
import { guestGuard } from '../../core/guards/auth.guard';

/**
 * Public routes accessible without authentication
 *
 * Auth routes (login, register, etc.) use guestGuard to prevent
 * authenticated users from accessing them.
 *
 * Implemented routes:
 * - home: Landing page with hero section
 * - categories: Browse mentors by category (grid view)
 * - mentors: Browse and search mentors (list view with filters)
 * - mentors/:id: Individual mentor profile page
 *
 * Future routes to implement:
 * - about: About page
 */
export const PUBLIC_ROUTES: Routes = [
  // Home Route
  {
    path: '',
    loadComponent: () => import('./home/home.component').then(m => m.HomeComponent),
    title: 'CareerRoute - Expert Career Mentorship'
  },

  // Category Routes
  {
    path: 'categories',
    loadComponent: () => import('../mentors/category-browse/category-browse.component').then(m => m.CategoryBrowseComponent),
    title: 'Browse Categories - CareerRoute'
  },

  // Mentor Routes
  {
    path: 'mentors',
    loadComponent: () => import('../mentors/mentor-search/mentor-search.component').then(m => m.MentorSearchComponent),
    title: 'Find Mentors - CareerRoute'
  },
  {
    path: 'mentors/:id',
    loadComponent: () => import('../mentors/mentor-detail/mentor-detail.component').then(m => m.MentorDetailComponent),
    title: 'Mentor Profile - CareerRoute'
  },

  // Authentication Routes
  {
    path: 'auth/login',
    canActivate: [guestGuard],
    loadComponent: () => import('../auth/login/login.component').then(m => m.LoginComponent),
    title: 'Login - CareerRoute'
  },
  {
    path: 'auth/register',
    canActivate: [guestGuard],
    loadComponent: () => import('../auth/register/register.component').then(m => m.RegisterComponent),
    title: 'Register - CareerRoute'
  },
  {
    path: 'auth/forgot-password',
    canActivate: [guestGuard],
    loadComponent: () => import('../auth/password-reset/password-reset.component').then(m => m.PasswordResetComponent),
    title: 'Forgot Password - CareerRoute'
  },
  {
    path: 'auth/reset-password',
    canActivate: [guestGuard],
    loadComponent: () => import('../auth/password-reset/password-reset.component').then(m => m.PasswordResetComponent),
    title: 'Reset Password - CareerRoute'
  },
  {
    path: 'auth/verify-email',
    canActivate: [guestGuard],
    loadComponent: () => import('../auth/email-verification/email-verification.component').then(m => m.EmailVerificationComponent),
    title: 'Verify Email - CareerRoute'
  },
  {
    path: 'auth/send-email-verification',
    canActivate: [guestGuard],
    loadComponent: () => import('../auth/send-email-verification/send-email-verification.component').then(m => m.SendEmailVerificationComponent),
    title: 'Send Email Verification - CareerRoute'
  },
];
