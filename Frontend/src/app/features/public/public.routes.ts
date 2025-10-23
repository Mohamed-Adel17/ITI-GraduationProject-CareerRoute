import { Routes } from '@angular/router';

/**
 * Public routes accessible without authentication
 *
 * Future routes to implement:
 * - home: Landing page
 * - about: About page
 * - mentors: Browse mentors
 * - mentors/:id: Mentor profile
 * - login, register, forgot-password, reset-password: Auth pages (with guestGuard)
 */
export const PUBLIC_ROUTES: Routes = [
  // TODO: Add public routes here as components are created
  // Example:
  // {
  //   path: '',
  //   loadComponent: () => import('./home/home.component').then(m => m.HomeComponent)
  // },
  // {
  //   path: 'login',
  //   canActivate: [guestGuard],
  //   loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent)
  // },
];
