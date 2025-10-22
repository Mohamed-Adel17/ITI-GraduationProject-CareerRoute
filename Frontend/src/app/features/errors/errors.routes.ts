import { Routes } from '@angular/router';

export const ERRORS_ROUTES: Routes = [
  {
    path: 'not-found',
    loadComponent: () => import('./not-found.component').then(m => m.NotFoundComponent)
  },
  {
    path: 'unauthorized',
    loadComponent: () => import('./unauthorized.component').then(m => m.UnauthorizedComponent)
  }
];
