# Routing Setup Plan (Lazy-Loaded Feature Modules)

## Objective

Set up Angular routing using lazy-loaded feature route files, wired into `src/app/app.routes.ts`, leveraging the existing guards in `src/app/core/guards/`.

## Current State

- `src/app/app.routes.ts` exports an empty `routes: Routes = []`.
- `src/app/app.config.ts` uses `provideRouter(routes)` and HTTP interceptors.
- Guards available in `src/app/core/guards/auth.guard.ts`:
  - `authGuard`
  - `guestGuard`
  - `mentorGuard`
  - `adminGuard`
  - `roleGuard(allowedRoles: string[])`
- Reference file with examples: `src/app/app.routes.example.ts.txt` (contains both direct component routes and an alternative lazy-loaded pattern).

## Plan Overview

We will implement the alternative approach (lazy-loaded feature route arrays) outlined in `app.routes.example.ts.txt`.

## Planned Changes

- **[files]** Create feature route files exporting route arrays:
  - `src/app/features/public/public.routes.ts`
  - `src/app/features/user/user.routes.ts`
  - `src/app/features/mentor/mentor.routes.ts`
  - `src/app/features/admin/admin.routes.ts`
  - `src/app/features/errors/errors.routes.ts`

- **[routing]** Update `src/app/app.routes.ts` to lazy-load feature routes:
  - Public (default): `path: ''`, `loadChildren: () => import('./features/public/public.routes').then(m => m.PUBLIC_ROUTES)`
  - User (authenticated): `path: 'user'`, `canActivate: [authGuard]`, lazy-load `USER_ROUTES`
  - Mentor: `path: 'mentor'`, `canActivate: [mentorGuard]`, lazy-load `MENTOR_ROUTES`
  - Admin: `path: 'admin'`, `canActivate: [adminGuard]`, lazy-load `ADMIN_ROUTES`
  - Errors: include `not-found` and `unauthorized` within errors feature; wildcard in root redirects to `not-found`.

- **[guards]** Apply guards at top-level lazy routes as above. For role-specific child routes inside features, optionally use `roleGuard([...])` at the child level where needed.

- **[components]** Route entries will use `loadComponent` to import standalone components where available. If any components are not yet present, we will add placeholder routes or adjust paths during implementation.

- **[preloading] (optional, later)** Consider enabling `withPreloading(PreloadAllModules)` to improve UX after initial load.

## Detailed Steps

1. **Create feature routes directories and files** [P]
   - `src/app/features/public/public.routes.ts`
   - `src/app/features/user/user.routes.ts`
   - `src/app/features/mentor/mentor.routes.ts`
   - `src/app/features/admin/admin.routes.ts`
   - `src/app/features/errors/errors.routes.ts`

2. **Define route arrays per feature** [P]
   - Export constants:
     - `export const PUBLIC_ROUTES: Routes = [ ... ]`
     - `export const USER_ROUTES: Routes = [ ... ]`
     - `export const MENTOR_ROUTES: Routes = [ ... ]`
     - `export const ADMIN_ROUTES: Routes = [ ... ]`
     - `export const ERRORS_ROUTES: Routes = [ ... ]`
   - Use `loadComponent: () => import('...').then(m => m.SomeComponent)` for standalone component pages.
   - Public routes to include: `home`, `about`, `mentors`, `mentors/:id`, auth pages guarded with `guestGuard` (`login`, `register`, `forgot-password`, `reset-password`).
   - User routes to include (behind `authGuard` at root): `dashboard`, `profile`, `profile/edit`, `bookings/*`, `sessions/*`, `payments`, `reviews/create/:sessionId`, `messages`.
   - Mentor routes (behind `mentorGuard` at root): `dashboard`, `profile`, `sessions`, `bookings`, `availability`, `earnings`, `reviews`, `settings`.
   - Admin routes (behind `adminGuard` at root): `dashboard`, `users`, `mentors`, `sessions`, `categories`, `payments`, `reports`, `settings`.
   - Errors routes: `unauthorized`, `not-found`.

3. **Wire feature routes in `app.routes.ts`**
   - Replace empty array with lazy-loaded entries:
     - `''` -> `PUBLIC_ROUTES`
     - `'user'` -> `USER_ROUTES` with `canActivate: [authGuard]`
     - `'mentor'` -> `MENTOR_ROUTES` with `canActivate: [mentorGuard]`
     - `'admin'` -> `ADMIN_ROUTES` with `canActivate: [adminGuard]`
     - Wildcard `**` -> redirect to `not-found`

4. **Verify router configuration** [P]
   - Ensure `app.config.ts` continues to call `provideRouter(routes)`.
   - Confirm guard imports match `src/app/core/guards/auth.guard.ts` exports.

5. **Test navigation and guards**
   - `ng serve`
   - Public pages load without auth.
   - Guest-only pages redirect to dashboard if already authenticated.
   - Auth-only pages require token; expired token redirects to `login` with `returnUrl`.
   - Mentor/admin sections enforce roles; unauthorized -> `unauthorized`.
   - Unknown routes redirect to `not-found`.

## Notes & Assumptions

- Components referenced in routes must exist as standalone components; otherwise, we will adjust paths or stub placeholders.
- Guard logic and interceptors are already implemented and registered.
- This plan introduces no code changes by itself; it documents the steps we will implement next.

## Acceptance Criteria

- `app.routes.ts` uses lazy-loaded feature routes for public, user, mentor, admin, and a wildcard redirect.
- Feature route files exist and export `Routes` arrays per feature.
- Guards (`authGuard`, `guestGuard`, `mentorGuard`, `adminGuard`) are correctly applied at appropriate route levels.
- Basic manual navigation validates redirects and guard behavior.
