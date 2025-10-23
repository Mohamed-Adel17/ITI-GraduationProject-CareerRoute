# Authentication Guard Usage Guide

## Overview

The authentication guards provide comprehensive route protection for your Angular application. They handle authentication checks, role-based authorization, and automatic redirects.

## Available Guards

### 1. `authGuard` - Authentication Guard

Protects routes that require user authentication. Redirects to login if not authenticated or token is expired.

**Features:**
- Checks if user has a valid authentication token
- Validates token expiration (client-side check)
- Redirects to `/login` if not authenticated
- Preserves intended destination URL in `returnUrl` query parameter
- Automatically removes expired tokens

**Usage:**

```typescript
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { DashboardComponent } from './pages/dashboard/dashboard.component';

export const routes: Routes = [
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard]
  }
];
```

### 2. `guestGuard` - Guest Guard

Prevents authenticated users from accessing login/register pages. Redirects to dashboard if already logged in.

**Features:**
- Checks if user is already authenticated
- Redirects authenticated users to `/dashboard`
- Allows unauthenticated users to access public pages
- Useful for login, register, and forgot password pages

**Usage:**

```typescript
import { Routes } from '@angular/router';
import { guestGuard } from './core/guards/auth.guard';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [guestGuard]
  },
  {
    path: 'register',
    component: RegisterComponent,
    canActivate: [guestGuard]
  }
];
```

## Role-Based Guards

For role-based authorization, see the **enhanced role guards** in `role.guard.ts`:

- `mentorRoleGuard` - Mentor-only routes
- `adminRoleGuard` - Admin-only routes
- `userRoleGuard` - User-only routes
- `createRoleGuard()` - Custom role configurations
- `requireAnyRole()` - User needs at least one role
- `requireAllRoles()` - User needs all specified roles
- `denyRoles()` - User must not have specified roles

**See `role-guard-usage-example.md` for complete role guard documentation.**

## Complete Route Configuration Example

```typescript
import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';
import { mentorRoleGuard, adminRoleGuard } from './core/guards/role.guard';

// Import components
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { MentorDashboardComponent } from './pages/mentor/dashboard.component';
import { MentorSessionsComponent } from './pages/mentor/sessions.component';
import { AdminPanelComponent } from './pages/admin/admin-panel.component';
import { UnauthorizedComponent } from './pages/unauthorized/unauthorized.component';

export const routes: Routes = [
  // Public routes (no guard)
  {
    path: '',
    component: HomeComponent
  },
  {
    path: 'about',
    component: AboutComponent
  },

  // Guest-only routes (redirect to dashboard if authenticated)
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [guestGuard]
  },
  {
    path: 'register',
    component: RegisterComponent,
    canActivate: [guestGuard]
  },
  {
    path: 'forgot-password',
    component: ForgotPasswordComponent,
    canActivate: [guestGuard]
  },

  // Authenticated user routes
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard]
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [authGuard]
  },
  {
    path: 'bookings',
    component: BookingsComponent,
    canActivate: [authGuard]
  },

  // Mentor-only routes
  {
    path: 'mentor',
    canActivate: [mentorRoleGuard],
    children: [
      {
        path: 'dashboard',
        component: MentorDashboardComponent
      },
      {
        path: 'sessions',
        component: MentorSessionsComponent
      },
      {
        path: 'earnings',
        component: MentorEarningsComponent
      }
    ]
  },

  // Admin-only routes
  {
    path: 'admin',
    canActivate: [adminRoleGuard],
    children: [
      {
        path: 'dashboard',
        component: AdminPanelComponent
      },
      {
        path: 'users',
        component: AdminUsersComponent
      },
      {
        path: 'settings',
        component: AdminSettingsComponent
      }
    ]
  },

  // Error routes
  {
    path: 'unauthorized',
    component: UnauthorizedComponent
  },
  {
    path: '**',
    component: NotFoundComponent
  }
];
```

## Lazy Loading with Guards

Guards work seamlessly with lazy-loaded modules:

```typescript
export const routes: Routes = [
  {
    path: 'mentor',
    canActivate: [mentorRoleGuard],
    loadChildren: () => import('./features/mentor/mentor.routes').then(m => m.MENTOR_ROUTES)
  },
  {
    path: 'admin',
    canActivate: [adminRoleGuard],
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES)
  }
];
```

## Return URL Handling

After authentication, redirect users to their intended destination:

```typescript
import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-login',
  template: `
    <form (ngSubmit)="login()">
      <!-- Login form -->
    </form>
  `
})
export class LoginComponent implements OnInit {
  returnUrl: string = '/dashboard';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Get the return URL from query params
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
  }

  login() {
    // After successful login
    this.authService.login(credentials).subscribe({
      next: (response) => {
        // Save tokens
        this.authService.setToken(response.token);
        this.authService.setRefreshToken(response.refreshToken);

        // Redirect to intended destination
        this.router.navigateByUrl(this.returnUrl);
      }
    });
  }
}
```

## Role Configuration

For role claim configuration and advanced role-based authorization, see `role-guard-usage-example.md`.

## Combining Multiple Guards

You can combine guards for more complex scenarios:

```typescript
export const routes: Routes = [
  {
    path: 'mentor/premium',
    component: PremiumMentorComponent,
    canActivate: [authGuard, mentorRoleGuard, premiumSubscriptionGuard]
  }
];
```

All guards must pass for the route to be activated.

## Creating Custom Guards

You can create custom guards following the same pattern:

```typescript
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SubscriptionService } from '../services/subscription.service';

export const premiumSubscriptionGuard: CanActivateFn = (route, state) => {
  const subscriptionService = inject(SubscriptionService);
  const router = inject(Router);

  if (subscriptionService.hasPremiumSubscription()) {
    return true;
  }

  return router.createUrlTree(['/upgrade']);
};
```

## Error Handling

Create an unauthorized component to handle access denied scenarios:

```typescript
import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-unauthorized',
  template: `
    <div class="unauthorized-container">
      <h1>Access Denied</h1>
      <p>You don't have permission to access this resource.</p>
      <button (click)="goBack()">Go Back</button>
      <button (click)="goHome()">Go Home</button>
    </div>
  `
})
export class UnauthorizedComponent {
  constructor(private router: Router) {}

  goBack() {
    window.history.back();
  }

  goHome() {
    this.router.navigate(['/']);
  }
}
```

## Best Practices

1. **Always use guards for protected routes** - Don't rely on hiding UI elements alone
2. **Combine authGuard with role guards** - For role-specific routes, use `mentorRoleGuard` or `adminRoleGuard` (they include auth check)
3. **Create meaningful unauthorized pages** - Help users understand why they can't access a route
4. **Handle return URLs** - Always preserve the user's intended destination
5. **Test guards thoroughly** - Ensure all edge cases are covered
6. **Use child routes for sections** - Group related protected routes under a parent with the guard
7. **Keep tokens secure** - Never expose tokens in URLs or console logs in production

## Debugging

Enable console logging to debug guard behavior:

```typescript
// The guards already include console.warn and console.info messages
// Check browser console for messages like:
// - "Auth Guard: User not authenticated, redirecting to login"
// - "Role Guard: User role(s) [User] not authorized. Required: [Admin]"
```

## Testing Guards in Components

You can test guard behavior in your component tests:

```typescript
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

describe('Protected Component', () => {
  it('should redirect to login if not authenticated', () => {
    // Test implementation
  });
});
```

## Common Scenarios

### Scenario 1: User tries to access protected route without login
1. `authGuard` detects no token
2. Redirects to `/login?returnUrl=/dashboard`
3. After successful login, redirect to `/dashboard`

### Scenario 2: User with 'User' role tries to access admin route
1. `authGuard` passes (user is authenticated)
2. `adminRoleGuard` checks role
3. User has 'User' role, not 'Admin'
4. Redirects to `/unauthorized`

### Scenario 3: Authenticated user tries to access login page
1. `guestGuard` detects user is authenticated
2. Redirects to `/dashboard`
3. User cannot access login page while logged in

### Scenario 4: Token expires while browsing
1. Next route navigation triggers guard
2. Guard checks token expiration
3. Token is expired
4. Removes tokens and redirects to login
5. Error interceptor will also catch 401 responses from API calls
