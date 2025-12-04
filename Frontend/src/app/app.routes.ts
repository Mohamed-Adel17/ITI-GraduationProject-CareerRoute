import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { mentorRoleGuard, adminRoleGuard } from './core/guards/role.guard';
import { PaymentRedirectComponent } from './features/payment/payment-redirect/payment-redirect.component';
import { RescheduleReviewComponent } from './features/sessions/reschedule-review/reschedule-review.component';
import { SessionReviewComponent } from './features/sessions/session-review/session-review.component';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./features/public/public.routes').then(m => m.PUBLIC_ROUTES)
  },
  {
    path: 'payment-redirect',
    component: PaymentRedirectComponent
  },
  {
    path: 'sessions/reschedule/:rescheduleId',
    component: RescheduleReviewComponent,
    canActivate: [authGuard]
  },
  {
    path: 'sessions/:sessionId/review',
    component: SessionReviewComponent,
    canActivate: [authGuard],
    title: 'Leave a Review - CareerRoute'
  },
  {
    path: 'user',
    canActivate: [authGuard],
    loadChildren: () => import('./features/user/user.routes').then(m => m.USER_ROUTES)
  },
  {
    path: 'mentor',
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
