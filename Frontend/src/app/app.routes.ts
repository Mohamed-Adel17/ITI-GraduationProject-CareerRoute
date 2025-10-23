import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { mentorRoleGuard, adminRoleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./features/public/public.routes').then(m => m.PUBLIC_ROUTES)
  },
  {
    path: 'user',
    canActivate: [authGuard],
    loadChildren: () => import('./features/user/user.routes').then(m => m.USER_ROUTES)
  },
  {
    path: 'mentor',
    canActivate: [mentorRoleGuard],
    loadChildren: () => import('./features/mentor/mentor.routes').then(m => m.MENTOR_ROUTES)
  },
  {
    path: 'admin',
    canActivate: [adminRoleGuard],
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES)
  },
  {
    path: 'errors',
    loadChildren: () => import('./features/errors/errors.routes').then(m => m.ERRORS_ROUTES)
  },
  {
    path: '**',
    redirectTo: 'errors/not-found'
  }
];
