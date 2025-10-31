import { Routes } from '@angular/router';
import { guestGuard } from '../../core/guards/auth.guard';

/**
 * Public routes accessible without authentication
 *
 * Auth routes (login, register, etc.) use guestGuard to prevent
 * authenticated users from accessing them.
 *
 * Future routes to implement:
 * - home: Landing page
 * - about: About page
 * - mentors: Browse mentors
 * - mentors/:id: Mentor profile
 */
export const PUBLIC_ROUTES: Routes = [
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
  // TODO: Add more auth routes as components are created:
  // {
  //   path: 'auth/forgot-password',
  //   loadComponent: () => import('../auth/password-reset/password-reset.component').then(m => m.PasswordResetComponent),
  //   title: 'Forgot Password - CareerRoute'
  // },
  // {
  //   path: 'auth/verify-email',
  //   loadComponent: () => import('../auth/email-verification/email-verification.component').then(m => m.EmailVerificationComponent),
  //   title: 'Verify Email - CareerRoute'
  // },
];
