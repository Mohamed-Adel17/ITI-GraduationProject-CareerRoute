# Role-Based Authorization Guard - Advanced Usage Guide

## Overview

The `role.guard.ts` provides a sophisticated, flexible system for role-based authorization in Angular applications. It offers multiple strategies for role checking, custom redirects, and helper functions for component-level role validation.

## Key Features

✅ **Multiple Role Strategies** - Check for ANY role, ALL roles, or DENY specific roles
✅ **Flexible Configuration** - Use route data or factory functions
✅ **Custom Redirects** - Define specific redirect paths per route
✅ **Composite Logic** - Combine allowed, required, and denied roles
✅ **Helper Functions** - Component-level role checking utilities
✅ **ASP.NET Core Compatible** - Handles standard .NET JWT role claims
✅ **Child Route Support** - Protect entire route hierarchies
✅ **Type Safe** - Full TypeScript support

## Available Guards

### 1. `roleGuard` - Data-Driven Role Guard

Reads role configuration from route data.

```typescript
{
  path: 'admin',
  component: AdminComponent,
  canActivate: [roleGuard],
  data: {
    roles: {
      allowedRoles: ['Admin', 'SuperAdmin'],
      redirectTo: '/access-denied'
    }
  }
}
```

### 2. `createRoleGuard(config)` - Factory Function

Creates a guard with specific configuration.

```typescript
{
  path: 'premium',
  component: PremiumComponent,
  canActivate: [createRoleGuard({
    allowedRoles: ['Premium', 'VIP'],
    deniedRoles: ['Banned'],
    redirectTo: '/upgrade'
  })]
}
```

### 3. `requireAnyRole(roles)` - At Least One Role

User must have at least ONE of the specified roles.

```typescript
{
  path: 'moderation',
  component: ModerationComponent,
  canActivate: [requireAnyRole(['Admin', 'Moderator', 'Support'])]
}
```

### 4. `requireAllRoles(roles)` - All Roles Required

User must have ALL of the specified roles.

```typescript
{
  path: 'super-admin',
  component: SuperAdminComponent,
  canActivate: [requireAllRoles(['Admin', 'SuperUser'])]
}
```

### 5. `denyRoles(roles)` - Deny Specific Roles

Deny access if user has ANY of the specified roles.

```typescript
{
  path: 'user-area',
  component: UserAreaComponent,
  canActivate: [denyRoles(['Banned', 'Suspended'])]
}
```

### 6. Pre-Configured Guards

Convenience guards for common roles:

```typescript
// Mentor-only routes
{
  path: 'mentor/dashboard',
  component: MentorDashboardComponent,
  canActivate: [mentorRoleGuard]
}

// Admin-only routes
{
  path: 'admin',
  component: AdminComponent,
  canActivate: [adminRoleGuard]
}

// User-only routes
{
  path: 'user-profile',
  component: UserProfileComponent,
  canActivate: [userRoleGuard]
}

// Premium features
{
  path: 'premium-features',
  component: PremiumFeaturesComponent,
  canActivate: [premiumRoleGuard] // Redirects to /upgrade
}
```

## Configuration Options

### RoleGuardConfig Interface

```typescript
interface RoleGuardConfig {
  /** User must have at least ONE of these roles */
  allowedRoles?: string[];

  /** User must have ALL of these roles */
  requiredRoles?: string[];

  /** User must NOT have any of these roles */
  deniedRoles?: string[];

  /** Custom redirect path (default: '/unauthorized') */
  redirectTo?: string;

  /** Redirect to login if not authenticated (default: true) */
  redirectToLogin?: boolean;
}
```

## Usage Patterns

### Pattern 1: Simple Role Check

Allow access to users with Admin or Moderator role:

```typescript
export const routes: Routes = [
  {
    path: 'moderation',
    component: ModerationComponent,
    canActivate: [requireAnyRole(['Admin', 'Moderator'])]
  }
];
```

### Pattern 2: Multiple Required Roles

Require user to have BOTH Admin AND Auditor roles:

```typescript
export const routes: Routes = [
  {
    path: 'audit-logs',
    component: AuditLogsComponent,
    canActivate: [requireAllRoles(['Admin', 'Auditor'])]
  }
];
```

### Pattern 3: Complex Role Logic

Combine allowed, required, and denied roles:

```typescript
export const routes: Routes = [
  {
    path: 'special-access',
    component: SpecialAccessComponent,
    canActivate: [createRoleGuard({
      allowedRoles: ['Premium', 'VIP', 'Admin'],  // Must have at least one
      requiredRoles: ['Verified'],                 // Must have this
      deniedRoles: ['Suspended', 'Banned'],        // Must not have any
      redirectTo: '/access-denied'
    })]
  }
];
```

**Logic Execution Order:**
1. Check authentication
2. Check denied roles (highest priority)
3. Check required roles (must have all)
4. Check allowed roles (must have at least one)

### Pattern 4: Custom Redirect Path

Redirect to specific page instead of default `/unauthorized`:

```typescript
export const routes: Routes = [
  {
    path: 'premium-content',
    component: PremiumContentComponent,
    canActivate: [createRoleGuard({
      allowedRoles: ['Premium'],
      redirectTo: '/upgrade-subscription'
    })]
  }
];
```

### Pattern 5: Route Data Configuration

Use route data for dynamic configuration:

```typescript
export const routes: Routes = [
  {
    path: 'analytics',
    component: AnalyticsComponent,
    canActivate: [roleGuard],
    data: {
      roles: {
        allowedRoles: ['Admin', 'Analyst'],
        requiredRoles: ['DataAccess'],
        redirectTo: '/request-access'
      }
    }
  }
];
```

### Pattern 6: Protect Child Routes

Apply guard to parent route to protect all children:

```typescript
export const routes: Routes = [
  {
    path: 'mentor',
    canActivate: [mentorRoleGuard],
    canActivateChild: [roleGuardChild],
    children: [
      { path: 'dashboard', component: MentorDashboardComponent },
      { path: 'sessions', component: MentorSessionsComponent },
      { path: 'earnings', component: MentorEarningsComponent }
    ]
  }
];
```

### Pattern 7: Prevent Banned Users

Deny access to users with specific roles:

```typescript
export const routes: Routes = [
  {
    path: 'community',
    component: CommunityComponent,
    canActivate: [denyRoles(['Banned', 'Suspended', 'Muted'])]
  }
];
```

## Helper Functions for Components

Use helper functions for conditional rendering in components:

### hasRole(authService, role)

Check if user has a specific role:

```typescript
import { Component, inject } from '@angular/core';
import { AuthService } from './core/services/auth.service';
import { hasRole } from './core/guards/role.guard';

@Component({
  selector: 'app-dashboard',
  template: `
    <div *ngIf="isAdmin">
      <h2>Admin Controls</h2>
      <!-- Admin-only content -->
    </div>
  `
})
export class DashboardComponent {
  private authService = inject(AuthService);
  isAdmin = hasRole(this.authService, 'Admin');
  isMentor = hasRole(this.authService, 'Mentor');
}
```

### hasAnyRole(authService, roles)

Check if user has at least one of the specified roles:

```typescript
import { Component, inject } from '@angular/core';
import { AuthService } from './core/services/auth.service';
import { hasAnyRole } from './core/guards/role.guard';

@Component({
  selector: 'app-toolbar',
  template: `
    <button *ngIf="canModerate" (click)="openModerationPanel()">
      Moderate
    </button>
  `
})
export class ToolbarComponent {
  private authService = inject(AuthService);
  canModerate = hasAnyRole(this.authService, ['Admin', 'Moderator']);
}
```

### hasAllRoles(authService, roles)

Check if user has all of the specified roles:

```typescript
import { Component, inject } from '@angular/core';
import { AuthService } from './core/services/auth.service';
import { hasAllRoles } from './core/guards/role.guard';

@Component({
  selector: 'app-audit',
  template: `
    <div *ngIf="canAudit">
      <!-- Audit interface -->
    </div>
  `
})
export class AuditComponent {
  private authService = inject(AuthService);
  canAudit = hasAllRoles(this.authService, ['Admin', 'Auditor']);
}
```

### getUserRoles(authService)

Get all user roles:

```typescript
import { Component, OnInit, inject } from '@angular/core';
import { AuthService } from './core/services/auth.service';
import { getUserRoles } from './core/guards/role.guard';

@Component({
  selector: 'app-profile',
  template: `
    <div>
      <h3>Your Roles</h3>
      <span *ngFor="let role of userRoles" class="badge">{{ role }}</span>
    </div>
  `
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);
  userRoles: string[] = [];

  ngOnInit() {
    this.userRoles = getUserRoles(this.authService);
  }
}
```

## Complete Example: Career Route Application

```typescript
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import {
  roleGuard,
  roleGuardChild,
  createRoleGuard,
  requireAnyRole,
  requireAllRoles,
  denyRoles,
  mentorRoleGuard,
  adminRoleGuard,
  userRoleGuard,
  premiumRoleGuard
} from './core/guards/role.guard';

export const routes: Routes = [
  // Public routes - no guards
  {
    path: '',
    component: HomeComponent
  },

  // Authenticated users only - any role
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard]
  },

  // User role specific
  {
    path: 'bookings',
    component: BookingsComponent,
    canActivate: [userRoleGuard]
  },

  // Mentor-only routes
  {
    path: 'mentor',
    canActivate: [mentorRoleGuard],
    canActivateChild: [roleGuardChild],
    children: [
      { path: 'dashboard', component: MentorDashboardComponent },
      { path: 'sessions', component: MentorSessionsComponent },
      { path: 'availability', component: SetAvailabilityComponent }
    ]
  },

  // Admin-only routes
  {
    path: 'admin',
    canActivate: [adminRoleGuard],
    canActivateChild: [roleGuardChild],
    children: [
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'users', component: UsersManagementComponent },
      { path: 'settings', component: PlatformSettingsComponent }
    ]
  },

  // Multiple roles allowed (Admin OR Moderator)
  {
    path: 'moderation',
    component: ModerationPanelComponent,
    canActivate: [requireAnyRole(['Admin', 'Moderator'])]
  },

  // Multiple roles required (Admin AND Auditor)
  {
    path: 'audit',
    component: AuditLogsComponent,
    canActivate: [requireAllRoles(['Admin', 'Auditor'])]
  },

  // Premium features with custom redirect
  {
    path: 'premium',
    component: PremiumFeaturesComponent,
    canActivate: [premiumRoleGuard] // Redirects to /upgrade
  },

  // Complex role logic
  {
    path: 'advanced-analytics',
    component: AdvancedAnalyticsComponent,
    canActivate: [createRoleGuard({
      allowedRoles: ['Admin', 'Analyst'],
      requiredRoles: ['DataAccess'],
      deniedRoles: ['RestrictedAccess'],
      redirectTo: '/request-access'
    })]
  },

  // Deny banned users from community features
  {
    path: 'community',
    component: CommunityComponent,
    canActivate: [denyRoles(['Banned', 'Suspended'])]
  },

  // Using route data
  {
    path: 'reports',
    component: ReportsComponent,
    canActivate: [roleGuard],
    data: {
      roles: {
        allowedRoles: ['Admin', 'Manager'],
        redirectTo: '/unauthorized'
      }
    }
  }
];
```

## JWT Token Role Formats

The guard automatically handles multiple JWT role claim formats:

### Standard "role" claim

```json
{
  "sub": "user123",
  "email": "user@example.com",
  "role": "Admin"
}
```

### Multiple roles in "role" claim (array)

```json
{
  "sub": "user123",
  "email": "user@example.com",
  "role": ["User", "Mentor"]
}
```

### "roles" claim (array)

```json
{
  "sub": "user123",
  "email": "user@example.com",
  "roles": ["Admin", "Moderator"]
}
```

### ASP.NET Core Identity claim

```json
{
  "sub": "user123",
  "email": "user@example.com",
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role": "Admin"
}
```

### ASP.NET Core with multiple roles

```json
{
  "sub": "user123",
  "email": "user@example.com",
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role": ["Admin", "User"]
}
```

## Backend JWT Configuration (ASP.NET Core)

Configure your backend to include role claims:

```csharp
// TokenService.cs
public string GenerateToken(User user)
{
    var claims = new List<Claim>
    {
        new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
        new Claim(ClaimTypes.Email, user.Email),
        new Claim(ClaimTypes.Name, user.Username),

        // Add role claim (recommended)
        new Claim("role", user.Role),

        // OR use standard ClaimTypes.Role (creates long claim name in JWT)
        new Claim(ClaimTypes.Role, user.Role)
    };

    // For users with multiple roles
    foreach (var role in user.Roles)
    {
        claims.Add(new Claim("role", role));
    }

    var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["JwtSettings:SecretKey"]));
    var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

    var token = new JwtSecurityToken(
        issuer: _configuration["JwtSettings:Issuer"],
        audience: _configuration["JwtSettings:Audience"],
        claims: claims,
        expires: DateTime.UtcNow.AddHours(1),
        signingCredentials: credentials
    );

    return new JwtSecurityTokenHandler().WriteToken(token);
}
```

## Debugging

The guard provides detailed console logging:

```javascript
// Success
INFO: 'Role Guard: Authorization successful. User roles: [Admin]'

// Denied - missing allowed role
WARN: 'Role Guard: User doesn't have allowed role(s). User roles: [User], Allowed (any): [Admin]'

// Denied - missing required role
WARN: 'Role Guard: User missing required role(s). User roles: [Admin], Required (all): [Admin, SuperUser]'

// Denied - has denied role
WARN: 'Role Guard: User has denied role(s). User roles: [User, Banned], Denied: [Banned, Suspended]'

// Not authenticated
WARN: 'Role Guard: User not authenticated, redirecting to login'
```

## Best Practices

1. **Use specific guards for common roles** - `mentorRoleGuard` is clearer than `createRoleGuard({ allowedRoles: ['Mentor'] })`
2. **Combine with authGuard** - Role guards include authentication checks, but you can combine them for clarity
3. **Use child guards for hierarchies** - Protect entire route trees with `canActivateChild`
4. **Provide meaningful redirects** - Use custom redirect paths to guide users
5. **Test role combinations** - Ensure complex role logic works as expected
6. **Use helper functions in components** - Don't duplicate role checking logic
7. **Keep role names consistent** - Match backend role names exactly
8. **Handle missing roles gracefully** - Provide clear unauthorized pages

## Common Scenarios

### Scenario 1: Mentor Dashboard Access
- User has 'Mentor' role → Access granted
- User has 'User' role → Redirected to `/unauthorized`

### Scenario 2: Admin Panel with Auditor
- User has ['Admin', 'Auditor'] → Access granted
- User has ['Admin'] only → Redirected to `/unauthorized` (missing required role)

### Scenario 3: Premium Content
- User has 'Premium' role → Access granted
- User has 'User' role → Redirected to `/upgrade`

### Scenario 4: Banned User
- User has ['User', 'Banned'] → Denied access (has denied role)
- User has ['User'] → Access granted

## Difference from auth.guard.ts

| Feature | auth.guard.ts | role.guard.ts |
|---------|---------------|---------------|
| Purpose | Authentication check | Role-based authorization |
| Complexity | Simple auth check | Advanced role logic |
| Configuration | None | Flexible (allowed/required/denied) |
| Redirects | Always to /login | Customizable |
| Use Case | Protect any authenticated route | Protect role-specific routes |
| Helper Functions | No | Yes (hasRole, hasAnyRole, etc.) |

**When to use each:**
- Use `authGuard` for routes that just need authentication
- Use `role.guard.ts` guards for fine-grained role-based access control
- Combine both for maximum clarity (optional, as role guards include auth check)

## Migration from auth.guard.ts

If you're using role-based guards from `auth.guard.ts`, you can migrate to `role.guard.ts` for more features:

```typescript
// Before (auth.guard.ts)
import { mentorGuard } from './core/guards/auth.guard';

// After (role.guard.ts) - more features
import { mentorRoleGuard } from './core/guards/role.guard';

// Or use advanced features
import { createRoleGuard } from './core/guards/role.guard';

canActivate: [createRoleGuard({
  allowedRoles: ['Mentor'],
  deniedRoles: ['Suspended'],
  redirectTo: '/mentor-suspended'
})]
```

Both work identically for simple cases, but `role.guard.ts` offers more advanced options.
