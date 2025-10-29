# Frontend Implementation Plan: User Story 1 - Registration & Profile Management

**Project:** Career Route Mentorship Platform
**Created:** 2025-10-26
**Status:** Ready for Implementation

---

## Table of Contents

1. [Overview](#overview)
2. [Current State Assessment](#current-state-assessment)
3. [Implementation Tasks](#implementation-tasks)
4. [Backend Integration](#backend-integration)
5. [Error Handling Strategy](#error-handling-strategy)
6. [Form Validation Strategy](#form-validation-strategy)
7. [State Management Approach](#state-management-approach)
8. [UI/UX Considerations](#uiux-considerations)
9. [Implementation Order](#implementation-order)
10. [Success Criteria](#success-criteria)
11. [Coordination with Backend](#coordination-with-backend)

---

## Overview

This plan covers the complete frontend implementation for **User Story 1: User and Mentor Registration & Profile Management**, including authentication flows, profile management, and backend integration.

### User Story 1 Goals

- Enable users and mentors to create accounts
- Support email verification
- Allow users to login and manage sessions
- Enable profile creation and updates
- Support mentor application with specialized profiles

### Technology Stack

- **Framework:** Angular 20.3.0
- **Styling:** Bootstrap 5.3.8
- **Forms:** Angular Reactive Forms
- **HTTP:** Angular HttpClient with interceptors
- **Routing:** Angular Router with guards

---

## Current State Assessment

### ✅ Completed Foundation (Phase 2)

The following foundational components are already implemented:

- **Auth Guard** (`core/guards/auth.guard.ts`) - Protects authenticated routes
- **Role Guard** (`core/guards/role.guard.ts`) - Enforces role-based access
- **Auth Interceptor** (`core/interceptors/auth.interceptor.ts`) - Adds JWT to requests
- **Error Interceptor** (`core/interceptors/error.interceptor.ts`) - Global error handling
- **Route Structure** - Lazy-loaded feature modules (public, user, mentor, admin, errors)
- **Auth Service Skeleton** (`core/services/auth.service.ts`) - Basic structure exists

### ❌ Missing Components (Need Implementation)

- TypeScript models/interfaces for User, Mentor, Auth
- Complete auth service implementation with all methods
- User service for profile management
- Mentor service for mentor profiles
- All UI components (login, register, profile, etc.)
- Notification service for user feedback
- Backend DTOs are empty (coordination needed)

---

## Implementation Tasks

### Phase 1: TypeScript Models & Interfaces (T061-T063)

**Location:** `Frontend/src/app/shared/models/`

#### Task T061: User Model (`user.model.ts`)

```typescript
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  careerInterests?: string[];
  profilePhotoUrl?: string;
  isEmailVerified: boolean;
  createdAt: Date;
}

export enum UserRole {
  User = 'User',
  Mentor = 'Mentor',
  Admin = 'Admin'
}

export interface UpdateUserProfile {
  firstName?: string;
  lastName?: string;
  careerInterests?: string[];
  profilePhotoUrl?: string;
}
```

**Purpose:** Defines the user entity structure matching backend User entity.

---

#### Task T062: Mentor Model (`mentor.model.ts`)

```typescript
export interface Mentor {
  id: string;
  userId: string;
  bio: string;
  expertiseTags: string[];
  yearsOfExperience: number;
  hourlyRate30Min: number;
  hourlyRate60Min: number;
  averageRating: number;
  totalReviews: number;
  isVerified: boolean;
  isAvailable: boolean;
  certifications?: string[];
  categories: Category[];
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  iconUrl?: string;
}

export interface CreateMentorProfile {
  bio: string;
  expertiseTags: string[];
  yearsOfExperience: number;
  hourlyRate30Min: number;
  hourlyRate60Min: number;
  certifications?: string[];
  categoryIds: string[];
}

export interface UpdateMentorProfile {
  bio?: string;
  expertiseTags?: string[];
  yearsOfExperience?: number;
  hourlyRate30Min?: number;
  hourlyRate60Min?: number;
  certifications?: string[];
  categoryIds?: string[];
  isAvailable?: boolean;
}
```

**Purpose:** Defines mentor entity and related DTOs for profile management.

---

#### Task T063: Auth Models (`auth.model.ts`)

```typescript
import { UserRole, User } from './user.model';

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
  expiresIn: number; // seconds
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordReset {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface EmailVerificationResponse {
  message: string;
  success: boolean;
}
```

**Purpose:** Defines authentication-related DTOs for API communication.

---

### Phase 2: Core Services (T064-T066)

**Location:** `Frontend/src/app/core/services/`

#### Task T064: Complete AuthService (`auth.service.ts`)

**Responsibilities:**
- Handle user authentication (login, register, logout)
- Manage JWT tokens (store, retrieve, refresh)
- Track current user state
- Email verification and password reset flows

**Key Methods:**

```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API_URL = environment.apiUrl;
  private readonly TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.loadCurrentUser();
  }

  // Authentication Methods
  register(request: RegisterRequest): Observable<AuthResponse>
  login(request: LoginRequest): Observable<AuthResponse>
  logout(): void
  refreshToken(): Observable<AuthResponse>

  // Password Management
  forgotPassword(email: string): Observable<void>
  resetPassword(request: PasswordReset): Observable<void>

  // Email Verification
  verifyEmail(token: string): Observable<EmailVerificationResponse>

  // Token Management
  getToken(): string | null
  getRefreshToken(): string | null
  setTokens(access: string, refresh: string): void
  removeTokens(): void

  // User State
  getCurrentUser(): Observable<User>
  isAuthenticated(): boolean
  hasRole(role: UserRole): boolean
}
```

**Backend Integration:**
- `POST /api/auth/register` → Register new user
- `POST /api/auth/login` → Login existing user
- `POST /api/auth/refresh` → Refresh access token
- `POST /api/auth/forgot-password` → Request password reset
- `POST /api/auth/reset-password` → Reset password with token
- `GET /api/auth/verify-email?token={token}` → Verify email address

**Implementation Notes:**
- Store tokens in `localStorage` (or `sessionStorage` based on rememberMe)
- Auto-refresh tokens when they expire
- Emit current user changes to subscribers
- Clear state on logout

---

#### Task T065: UserService (`user.service.ts`)

**Responsibilities:**
- Manage user profile data (CRUD operations)
- Handle profile photo uploads
- Retrieve current user information

**Key Methods:**

```typescript
@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly API_URL = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getUserProfile(id: string): Observable<User>
  getCurrentUserProfile(): Observable<User>
  updateProfile(id: string, updates: UpdateUserProfile): Observable<User>
  uploadProfilePhoto(file: File): Observable<string>
  deleteProfilePhoto(userId: string): Observable<void>
}
```

**Backend Integration:**
- `GET /api/users/me` → Get current authenticated user
- `GET /api/users/{id}` → Get specific user profile
- `PUT /api/users/{id}` → Update user profile
- `POST /api/users/{id}/photo` → Upload profile photo
- `DELETE /api/users/{id}/photo` → Remove profile photo

**Implementation Notes:**
- Use FormData for photo uploads
- Return photo URL from upload endpoint
- Cache current user data to reduce API calls

---

#### Task T066: MentorService (Partial) (`mentor.service.ts`)

**Responsibilities:**
- Apply as mentor (create mentor profile)
- Manage mentor profile information
- Retrieve mentor data

**Key Methods:**

```typescript
@Injectable({ providedIn: 'root' })
export class MentorService {
  private readonly API_URL = `${environment.apiUrl}/mentors`;

  constructor(private http: HttpClient) {}

  applyAsMentor(profileData: CreateMentorProfile): Observable<Mentor>
  getMentorProfile(id: string): Observable<Mentor>
  getCurrentMentorProfile(): Observable<Mentor>
  updateMentorProfile(id: string, updates: UpdateMentorProfile): Observable<Mentor>
  getCategories(): Observable<Category[]>
}
```

**Backend Integration:**
- `POST /api/mentors` → Apply as mentor (creates mentor profile)
- `GET /api/mentors/{id}` → Get specific mentor profile
- `GET /api/mentors/me` → Get current user's mentor profile
- `PUT /api/mentors/{id}` → Update mentor profile
- `GET /api/categories` → Get available categories

**Implementation Notes:**
- Mentor application requires User role upgrade
- Admin approval needed before mentor becomes active
- Categories are pre-seeded in database

---

### Phase 3: Notification Service (T076)

**Location:** `Frontend/src/app/core/services/`

#### Task T076: NotificationService (`notification.service.ts`)

**Responsibilities:**
- Display toast/snackbar notifications to users
- Handle success, error, warning, and info messages
- Auto-dismiss with configurable timeout
- Queue multiple notifications

**Key Methods:**

```typescript
@Injectable({ providedIn: 'root' })
export class NotificationService {
  success(message: string, duration?: number): void
  error(message: string, duration?: number): void
  warning(message: string, duration?: number): void
  info(message: string, duration?: number): void
  clear(): void
}
```

**Implementation Options:**

**Option 1: Bootstrap Toast (Recommended for MVP)**
- Use Bootstrap 5 toast component
- Simple, no external dependencies
- Lightweight

**Option 2: Angular Material Snackbar**
- Requires `@angular/material` installation
- More features and animations
- Larger bundle size

**Example Usage:**
```typescript
this.notificationService.success('Profile updated successfully!');
this.notificationService.error('Failed to upload photo. Please try again.');
```

---

### Phase 4: Authentication Components (T067-T070)

**Location:** `Frontend/src/app/features/auth/`

#### Task T067: Login Component

**Path:** `features/auth/login/login.component.ts`

**Features:**
- Reactive form with email & password fields
- "Remember me" checkbox
- Client-side validation (required, email format)
- Link to register page
- Link to forgot password page
- Error display (invalid credentials, account not verified)
- Loading state during API call
- Redirect to returnUrl after successful login

**Form Structure:**
```typescript
loginForm = this.fb.group({
  email: ['', [Validators.required, Validators.email]],
  password: ['', [Validators.required, Validators.minLength(8)]],
  rememberMe: [false]
});
```

**Template Elements:**
- Email input field
- Password input field (with show/hide toggle)
- Remember me checkbox
- Submit button (disabled while loading)
- Error message display area
- Links: "Forgot password?" | "Don't have an account? Register"

**User Flow:**
1. User enters email and password
2. Clicks "Login" button
3. Form validates input
4. API call to `/api/auth/login`
5. On success: Store tokens, navigate to dashboard or returnUrl
6. On error: Display error message from backend

---

#### Task T068: Register Component

**Path:** `features/auth/register/register.component.ts`

**Features:**
- Multi-field reactive form
- Role selection (User or Mentor)
- Password strength indicator
- Password match validation
- Terms & conditions checkbox
- Success message with email verification notice
- Navigate to login after registration

**Form Structure:**
```typescript
registerForm = this.fb.group({
  email: ['', [Validators.required, Validators.email]],
  password: ['', [Validators.required, Validators.minLength(8)]],
  confirmPassword: ['', Validators.required],
  firstName: ['', [Validators.required, Validators.minLength(2)]],
  lastName: ['', [Validators.required, Validators.minLength(2)]],
  role: ['User', Validators.required],
  acceptTerms: [false, Validators.requiredTrue]
}, { validators: this.passwordMatchValidator });
```

**Template Elements:**
- Email input
- First name input
- Last name input
- Password input (with strength indicator)
- Confirm password input
- Role selection (radio buttons or dropdown: User / Mentor)
- Terms & conditions checkbox
- Submit button
- Link: "Already have an account? Login"

**User Flow:**
1. User fills out registration form
2. Selects role (User or Mentor)
3. Accepts terms and conditions
4. Clicks "Register" button
5. Form validates (client-side)
6. API call to `/api/auth/register`
7. On success: Show message "Please check your email to verify your account"
8. Redirect to login page after 3 seconds

---

#### Task T069: Password Reset Component

**Path:** `features/auth/password-reset/password-reset.component.ts`

**Features:**
- Two-step process (request reset → reset password)
- Email input for reset request
- Token-based password reset form
- Password strength validation
- Success/error feedback

**Step 1: Request Reset**
```typescript
requestResetForm = this.fb.group({
  email: ['', [Validators.required, Validators.email]]
});
```

**Step 2: Reset Password** (activated by `?token=` query param)
```typescript
resetPasswordForm = this.fb.group({
  newPassword: ['', [Validators.required, Validators.minLength(8)]],
  confirmPassword: ['', Validators.required]
}, { validators: this.passwordMatchValidator });
```

**Template Elements:**
- Step 1: Email input, submit button
- Step 2: New password input, confirm password input, submit button
- Success/error messages
- Link back to login

**User Flow:**
1. **Request Reset:**
   - User enters email
   - API call to `/api/auth/forgot-password`
   - Success: "Check your email for reset instructions"
2. **Reset Password:**
   - User clicks email link with token
   - Component extracts token from URL
   - User enters new password
   - API call to `/api/auth/reset-password` with token
   - Success: "Password reset successfully. You can now login."
   - Redirect to login page

---

#### Task T070: Email Verification Component

**Path:** `features/auth/email-verification/email-verification.component.ts`

**Features:**
- Automatically verify email on component load
- Extract token from query params
- Display loading, success, or error state
- Redirect to login after successful verification

**Component Logic:**
```typescript
ngOnInit() {
  const token = this.route.snapshot.queryParams['token'];
  if (token) {
    this.verifyEmail(token);
  } else {
    this.error = 'Invalid verification link';
  }
}

verifyEmail(token: string) {
  this.loading = true;
  this.authService.verifyEmail(token).subscribe({
    next: (response) => {
      this.success = true;
      this.message = 'Email verified successfully!';
      setTimeout(() => this.router.navigate(['/auth/login']), 3000);
    },
    error: (error) => {
      this.error = error.error?.message || 'Verification failed';
    }
  });
}
```

**Template Elements:**
- Loading spinner
- Success message with checkmark icon
- Error message
- Countdown timer: "Redirecting to login in 3 seconds..."
- Manual "Go to Login" link

**User Flow:**
1. User clicks verification link from email
2. Component loads with token in URL
3. Automatic API call to `/api/auth/verify-email?token={token}`
4. On success: Show success message, redirect to login
5. On error: Show error message, provide link to request new verification email

---

### Phase 5: User Dashboard Components (T071-T072)

**Location:** `Frontend/src/app/features/user/`

#### Task T071: User Profile Component

**Path:** `features/user/user-profile/user-profile.component.ts`

**Features:**
- Display user information (read-only view)
- Show profile photo
- Display career interests as chips/tags
- Show account status (email verified)
- "Edit Profile" button

**Data Display:**
- Profile photo (with placeholder if not set)
- Full name
- Email address
- Career interests (as tags/chips)
- Account created date
- Email verification status badge

**Template Layout:**
```html
<div class="profile-card">
  <img [src]="user.profilePhotoUrl || 'assets/default-avatar.png'" />
  <h2>{{ user.firstName }} {{ user.lastName }}</h2>
  <p>{{ user.email }}</p>
  <span class="badge" [class.verified]="user.isEmailVerified">
    {{ user.isEmailVerified ? 'Verified' : 'Not Verified' }}
  </span>

  <div class="career-interests">
    <span *ngFor="let interest of user.careerInterests" class="badge">
      {{ interest }}
    </span>
  </div>

  <button (click)="editProfile()">Edit Profile</button>
</div>
```

**User Flow:**
1. Component loads current user data via `UserService.getCurrentUserProfile()`
2. Displays user information
3. User clicks "Edit Profile" → Navigate to edit component

---

#### Task T072: Edit Profile Component

**Path:** `features/user/edit-profile/edit-profile.component.ts`

**Features:**
- Pre-populated reactive form with current user data
- Profile photo upload with preview
- Career interests management (add/remove chips)
- Save and Cancel buttons
- Success/error notifications
- Navigate back to profile view after save

**Form Structure:**
```typescript
editProfileForm = this.fb.group({
  firstName: ['', [Validators.required, Validators.minLength(2)]],
  lastName: ['', [Validators.required, Validators.minLength(2)]],
  careerInterests: [[]],
  profilePhoto: [null]
});
```

**Template Elements:**
- First name input (pre-filled)
- Last name input (pre-filled)
- Career interests input (chip list with add/remove)
- Profile photo upload:
  - Current photo preview
  - File input button
  - Image preview after selection
  - Remove photo button
- Save button
- Cancel button (navigate back without saving)

**User Flow:**
1. Component loads current user data
2. Form is pre-populated with existing values
3. User makes changes (name, interests, photo)
4. Clicks "Save" button
5. **If photo changed:**
   - First upload photo via `UserService.uploadProfilePhoto(file)`
   - Get photo URL from response
6. **Update profile:**
   - API call to `UserService.updateProfile(userId, updates)`
7. On success:
   - Show success notification
   - Navigate back to profile view
   - Update current user in AuthService
8. On error: Show error notification

---

### Phase 6: Mentor Profile Components (T073-T074)

**Location:** `Frontend/src/app/features/mentors/`

#### Task T073: Mentor Profile Form Component

**Path:** `features/mentors/mentor-profile/mentor-profile-form.component.ts`

**Purpose:** Reusable form component for creating and editing mentor profiles

**Features:**
- Reactive form with mentor-specific fields
- Bio textarea with character counter
- Expertise tags input (chip-based)
- Years of experience (number input)
- Hourly rates for 30min and 60min sessions
- Categories multi-select
- Certifications list (dynamic add/remove)
- Form validation with error messages

**Form Structure:**
```typescript
mentorProfileForm = this.fb.group({
  bio: ['', [Validators.required, Validators.minLength(100), Validators.maxLength(1000)]],
  expertiseTags: [[], [Validators.required, Validators.minItems(3)]],
  yearsOfExperience: [0, [Validators.required, Validators.min(0), Validators.max(50)]],
  hourlyRate30Min: [0, [Validators.required, Validators.min(20), Validators.max(500)]],
  hourlyRate60Min: [0, [Validators.required, Validators.min(20), Validators.max(500)]],
  categoryIds: [[], Validators.required],
  certifications: [[]]
});
```

**Template Elements:**
- **Bio:** Textarea with character counter (100-1000 chars)
- **Expertise Tags:** Chip input (min 3 tags)
- **Years of Experience:** Number input
- **Session Rates:**
  - 30-minute rate ($20-$500)
  - 60-minute rate ($20-$500)
- **Categories:** Multi-select dropdown (pre-loaded from API)
- **Certifications:** Dynamic list with add/remove buttons
- Validation error messages

**Input/Output:**
```typescript
@Input() initialData?: Mentor; // For edit mode
@Output() formSubmit = new EventEmitter<CreateMentorProfile>();
```

---

#### Task T074: Mentor Application Component

**Path:** `features/mentors/mentor-application/mentor-application.component.ts`

**Purpose:** Full-page component for users to apply as mentors

**Features:**
- Uses `MentorProfileFormComponent`
- Wizard/stepper UI (optional for better UX)
- Information about mentor approval process
- Submit button
- Success message after submission

**Wizard Steps (Optional):**
1. **Introduction:** Explain mentor program and requirements
2. **Profile Information:** Use `MentorProfileFormComponent`
3. **Review & Submit:** Summary of entered information
4. **Confirmation:** Success message with next steps

**Template Structure:**
```html
<div class="mentor-application">
  <h1>Apply to Become a Mentor</h1>

  <div class="info-section">
    <p>Share your expertise and help others in their career journey!</p>
    <p>Note: Your application will be reviewed by our team within 3-5 business days.</p>
  </div>

  <app-mentor-profile-form
    (formSubmit)="onSubmit($event)">
  </app-mentor-profile-form>

  <div class="actions">
    <button (click)="onCancel()">Cancel</button>
  </div>
</div>
```

**User Flow:**
1. User (with "User" role) navigates to mentor application
2. Reads information about mentor program
3. Fills out mentor profile form
4. Reviews entered information
5. Clicks "Submit Application"
6. API call to `MentorService.applyAsMentor(profileData)`
7. On success:
   - Show success message
   - Display: "Your application is under review. You'll receive an email notification once approved."
   - Navigate to user dashboard
8. On error: Show error notification

**Backend Note:**
- Creates Mentor record with `IsVerified = false`
- Admin must approve before mentor becomes active

---

### Phase 7: Shared Components (T075)

**Location:** `Frontend/src/app/shared/components/`

#### Task T075: Header Navigation Component

**Path:** `shared/components/header/header.component.ts`

**Purpose:** Main navigation header with authentication-aware menu

**Features:**
- Logo and brand name
- Navigation links (changes based on auth state)
- User dropdown menu (when authenticated)
- Role-based navigation items
- Responsive mobile menu (Bootstrap collapse)

**Navigation Structure:**

**Unauthenticated:**
- Logo → Home
- Browse Mentors
- About
- Login (button)
- Register (button)

**Authenticated (User role):**
- Logo → Home
- Browse Mentors
- My Dashboard
- User Dropdown:
  - Profile
  - My Sessions
  - Payment History
  - Settings
  - Logout

**Authenticated (Mentor role):**
- Logo → Home
- My Dashboard
- Mentor Dropdown:
  - My Profile
  - My Sessions
  - Earnings
  - Settings
  - Logout

**Authenticated (Admin role):**
- Logo → Home
- Admin Dashboard
- Admin Dropdown:
  - Mentor Approvals
  - User Management
  - Analytics
  - Settings
  - Logout

**Template Structure:**
```html
<nav class="navbar navbar-expand-lg navbar-light bg-light">
  <div class="container">
    <a class="navbar-brand" routerLink="/">Career Route</a>

    <button class="navbar-toggler" (click)="toggleMenu()">
      <span class="navbar-toggler-icon"></span>
    </button>

    <div class="collapse navbar-collapse" [class.show]="isMenuOpen">
      <ul class="navbar-nav ms-auto">

        <!-- Unauthenticated -->
        <ng-container *ngIf="!(currentUser$ | async)">
          <li class="nav-item">
            <a class="nav-link" routerLink="/mentors">Browse Mentors</a>
          </li>
          <li class="nav-item">
            <a class="btn btn-outline-primary" routerLink="/auth/login">Login</a>
          </li>
          <li class="nav-item">
            <a class="btn btn-primary" routerLink="/auth/register">Register</a>
          </li>
        </ng-container>

        <!-- Authenticated -->
        <ng-container *ngIf="currentUser$ | async as user">
          <li class="nav-item dropdown">
            <a class="nav-link dropdown-toggle" (click)="toggleDropdown()">
              <img [src]="user.profilePhotoUrl || 'assets/default-avatar.png'" />
              {{ user.firstName }}
            </a>
            <ul class="dropdown-menu" [class.show]="isDropdownOpen">
              <li><a class="dropdown-item" routerLink="/user/profile">Profile</a></li>
              <li><a class="dropdown-item" routerLink="/user/sessions">My Sessions</a></li>
              <li><hr class="dropdown-divider"></li>
              <li><a class="dropdown-item" (click)="logout()">Logout</a></li>
            </ul>
          </li>
        </ng-container>

      </ul>
    </div>
  </div>
</nav>
```

**Component Logic:**
```typescript
export class HeaderComponent {
  currentUser$ = this.authService.currentUser$;
  isMenuOpen = false;
  isDropdownOpen = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
```

---

### Phase 8: Routing Configuration (T075)

**Update routing files to wire up all new components**

#### Update: `features/public/public.routes.ts`

```typescript
import { Routes } from '@angular/router';
import { guestGuard } from '../../core/guards/auth.guard';

export const PUBLIC_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadComponent: () => import('./home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'about',
    loadComponent: () => import('./about/about.component').then(m => m.AboutComponent)
  },
  {
    path: 'mentors',
    loadComponent: () => import('../mentors/mentor-list/mentor-list.component').then(m => m.MentorListComponent)
  },
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () => import('../auth/login/login.component').then(m => m.LoginComponent),
        canActivate: [guestGuard]
      },
      {
        path: 'register',
        loadComponent: () => import('../auth/register/register.component').then(m => m.RegisterComponent),
        canActivate: [guestGuard]
      },
      {
        path: 'forgot-password',
        loadComponent: () => import('../auth/password-reset/password-reset.component').then(m => m.PasswordResetComponent)
      },
      {
        path: 'verify-email',
        loadComponent: () => import('../auth/email-verification/email-verification.component').then(m => m.EmailVerificationComponent)
      }
    ]
  }
];
```

#### Update: `features/user/user.routes.ts`

```typescript
import { Routes } from '@angular/router';

export const USER_ROUTES: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'profile',
    loadComponent: () => import('./user-profile/user-profile.component').then(m => m.UserProfileComponent)
  },
  {
    path: 'profile/edit',
    loadComponent: () => import('./edit-profile/edit-profile.component').then(m => m.EditProfileComponent)
  },
  {
    path: 'apply-mentor',
    loadComponent: () => import('../mentors/mentor-application/mentor-application.component').then(m => m.MentorApplicationComponent)
  }
];
```

#### Update: `features/mentor/mentor.routes.ts`

```typescript
import { Routes } from '@angular/router';

export const MENTOR_ROUTES: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/mentor-dashboard.component').then(m => m.MentorDashboardComponent)
  },
  {
    path: 'profile',
    loadComponent: () => import('./profile/mentor-profile-edit.component').then(m => m.MentorProfileEditComponent)
  }
];
```

---

## Backend Integration

### Expected Backend Endpoints

#### Authentication Endpoints

| Method | Endpoint | Request Body | Response | Description |
|--------|----------|--------------|----------|-------------|
| POST | `/api/auth/register` | `RegisterRequestDto` | `AuthResponseDto` | Register new user |
| POST | `/api/auth/login` | `LoginRequestDto` | `AuthResponseDto` | Login existing user |
| POST | `/api/auth/refresh` | `RefreshTokenRequestDto` | `AuthResponseDto` | Refresh access token |
| POST | `/api/auth/forgot-password` | `{ email: string }` | `200 OK` | Send password reset email |
| POST | `/api/auth/reset-password` | `PasswordResetDto` | `200 OK` | Reset password with token |
| GET | `/api/auth/verify-email?token={token}` | - | `{ success: bool, message: string }` | Verify email address |

#### Users Endpoints

| Method | Endpoint | Request Body | Response | Description |
|--------|----------|--------------|----------|-------------|
| GET | `/api/users/me` | - | `UserDto` | Get current authenticated user |
| GET | `/api/users/{id}` | - | `UserDto` | Get specific user profile |
| PUT | `/api/users/{id}` | `UpdateUserDto` | `UserDto` | Update user profile |
| POST | `/api/users/{id}/photo` | `FormData (file)` | `{ photoUrl: string }` | Upload profile photo |
| DELETE | `/api/users/{id}/photo` | - | `200 OK` | Remove profile photo |

#### Mentors Endpoints

| Method | Endpoint | Request Body | Response | Description |
|--------|----------|--------------|----------|-------------|
| POST | `/api/mentors` | `CreateMentorProfileDto` | `MentorDto` | Apply as mentor |
| GET | `/api/mentors/me` | - | `MentorDto` | Get current user's mentor profile |
| GET | `/api/mentors/{id}` | `MentorDto` | Get specific mentor profile |
| PUT | `/api/mentors/{id}` | `UpdateMentorProfileDto` | `MentorDto` | Update mentor profile |

#### Categories Endpoints

| Method | Endpoint | Request Body | Response | Description |
|--------|----------|--------------|----------|-------------|
| GET | `/api/categories` | - | `CategoryDto[]` | Get all categories |

### Backend DTOs (Need Implementation)

**Current Status:** DTOs exist but are empty (internal classes with no properties)

**Required DTOs:**
- `RegisterRequestDto` - Empty, needs properties
- `LoginRequestDto` - Empty, needs properties
- `UserDto` - Empty, needs properties
- `UpdateUserDto` - Exists, needs verification
- `MentorDto` - Empty, needs properties
- `CreateMentorProfileDto` - Exists, needs verification

**Action Required:** Coordinate with backend team to populate these DTOs matching the frontend models.

---

## Error Handling Strategy

### 1. Global Error Interceptor (Already Implemented ✅)

The `error.interceptor.ts` handles all HTTP errors globally:

- **401 Unauthorized** → Logout user, redirect to `/auth/login`
- **403 Forbidden** → Show "Access denied" message
- **404 Not Found** → Log error (component handles display)
- **500 Server Error** → Show "Something went wrong" message
- **Network Error (status 0)** → Show "Cannot connect to server"

### 2. Component-Level Error Handling

Components should handle:
- **Form validation errors** (display inline)
- **Business logic errors** (e.g., "Email already exists")
- **Specific error scenarios** (e.g., invalid reset token)

**Example:**
```typescript
this.authService.login(this.loginForm.value).subscribe({
  next: (response) => {
    this.notificationService.success('Login successful!');
    this.router.navigate([this.returnUrl || '/user/dashboard']);
  },
  error: (error: HttpErrorResponse) => {
    // Global interceptor already handled redirect for 401
    // Handle specific business errors here
    if (error.status === 400) {
      this.errorMessage = error.error?.message || 'Invalid credentials';
    } else if (error.status === 403) {
      this.errorMessage = 'Please verify your email before logging in';
    }
  }
});
```

### 3. Notification Integration

Use `NotificationService` for user feedback:
- **Success actions:** "Profile updated successfully"
- **Error actions:** "Failed to update profile. Please try again."
- **Info messages:** "Please check your email for verification link"
- **Warnings:** "Session expired. Please login again."

---

## Form Validation Strategy

### Client-Side Validation

Use **Angular Reactive Forms** with built-in and custom validators.

#### Built-in Validators

```typescript
email: ['', [Validators.required, Validators.email]]
password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(50)]]
firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]]
bio: ['', [Validators.required, Validators.minLength(100), Validators.maxLength(1000)]]
hourlyRate: ['', [Validators.required, Validators.min(20), Validators.max(500)]]
```

#### Custom Validators

**Password Match Validator:**
```typescript
passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;

  return password === confirmPassword ? null : { passwordMismatch: true };
}
```

**Email Domain Validator (Optional):**
```typescript
emailDomainValidator(control: AbstractControl): ValidationErrors | null {
  const email = control.value;
  const allowedDomains = ['gmail.com', 'yahoo.com', 'outlook.com'];
  const domain = email?.split('@')[1];

  return allowedDomains.includes(domain) ? null : { invalidDomain: true };
}
```

### Validation Error Display

**Template Example:**
```html
<div class="form-group">
  <label for="email">Email</label>
  <input
    id="email"
    formControlName="email"
    class="form-control"
    [class.is-invalid]="email.invalid && (email.dirty || email.touched)">

  <div class="invalid-feedback" *ngIf="email.invalid && (email.dirty || email.touched)">
    <div *ngIf="email.errors?.['required']">Email is required</div>
    <div *ngIf="email.errors?.['email']">Please enter a valid email</div>
  </div>
</div>
```

### Backend Validation

Backend should also validate and return:
```json
{
  "errors": {
    "Email": ["Email is already registered"],
    "Password": ["Password must contain at least one uppercase letter"]
  }
}
```

Frontend displays these backend errors in the form.

---

## State Management Approach

### For MVP (User Story 1)

Use **Services with BehaviorSubject** for simple state management.

**No external state library needed** (NgRx, Akita, etc.) for this phase.

### AuthService State Management

```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  // Private subject (internal state)
  private currentUserSubject = new BehaviorSubject<User | null>(null);

  // Public observable (external consumers)
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadCurrentUser(); // Load on service initialization
  }

  private loadCurrentUser() {
    const token = this.getToken();
    if (token) {
      // Decode JWT or fetch user from API
      this.getCurrentUser().subscribe({
        next: (user) => this.currentUserSubject.next(user),
        error: () => this.currentUserSubject.next(null)
      });
    }
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/login', request).pipe(
      tap(response => {
        this.setTokens(response.accessToken, response.refreshToken);
        this.currentUserSubject.next(response.user); // Update state
      })
    );
  }

  logout() {
    this.removeTokens();
    this.currentUserSubject.next(null); // Clear state
  }
}
```

### Component Usage

```typescript
export class HeaderComponent {
  currentUser$ = this.authService.currentUser$; // Subscribe to state

  constructor(private authService: AuthService) {}
}
```

**Template:**
```html
<div *ngIf="currentUser$ | async as user">
  Welcome, {{ user.firstName }}!
</div>
```

### Benefits of This Approach

✅ Simple and lightweight
✅ No external dependencies
✅ Works well for small to medium apps
✅ Easy to understand and maintain
✅ Can migrate to NgRx later if needed

---

## UI/UX Considerations

### 1. Bootstrap 5.3.8 (Already Installed ✅)

**Use Bootstrap components:**
- **Forms:** `.form-control`, `.form-label`, `.form-select`
- **Buttons:** `.btn`, `.btn-primary`, `.btn-outline-secondary`
- **Cards:** `.card` for profile displays
- **Alerts:** `.alert` for error/success messages
- **Modals:** `.modal` for confirmations
- **Navbar:** `.navbar` for header navigation

**Form Validation Styles:**
```html
<input
  class="form-control"
  [class.is-invalid]="field.invalid && field.touched"
  [class.is-valid]="field.valid && field.dirty">
<div class="invalid-feedback">Error message</div>
<div class="valid-feedback">Looks good!</div>
```

### 2. Loading States

**Show spinners during API calls:**
```html
<button [disabled]="isLoading">
  <span *ngIf="isLoading" class="spinner-border spinner-border-sm"></span>
  {{ isLoading ? 'Saving...' : 'Save' }}
</button>
```

**Full-page loading:**
```html
<div *ngIf="isLoading" class="loading-overlay">
  <div class="spinner-border text-primary"></div>
</div>
```

### 3. Success/Error Feedback

**Toast Notifications:**
- Position: Top-right corner
- Auto-dismiss: 3-5 seconds
- Types: Success (green), Error (red), Warning (yellow), Info (blue)

**Inline Messages:**
```html
<div class="alert alert-success" *ngIf="successMessage">
  {{ successMessage }}
</div>
<div class="alert alert-danger" *ngIf="errorMessage">
  {{ errorMessage }}
</div>
```

### 4. Accessibility (WCAG 2.1 AA)

**Form Labels:**
```html
<label for="email">Email Address</label>
<input id="email" type="email" formControlName="email">
```

**ARIA Attributes:**
```html
<button aria-label="Close dialog">×</button>
<div role="alert">Error message</div>
```

**Keyboard Navigation:**
- All interactive elements reachable via Tab
- Forms submittable via Enter key
- Modals closeable via Escape key

### 5. Responsive Design

**Mobile-First Approach:**
- Use Bootstrap grid: `.container`, `.row`, `.col-*`
- Stack forms vertically on mobile
- Hamburger menu for navigation on small screens

**Breakpoints:**
```scss
// Extra small (< 576px) - Default
// Small (≥ 576px)
// Medium (≥ 768px)
// Large (≥ 992px)
// Extra large (≥ 1200px)
```

---

## Implementation Order

### Week 1: Foundation & Services

**Day 1-2: Models & Core Services**
1. ✅ Create `user.model.ts` (T061)
2. ✅ Create `mentor.model.ts` (T062)
3. ✅ Create `auth.model.ts` (T063)
4. ✅ Complete `auth.service.ts` (T064)

**Day 3-4: Supporting Services**
5. ✅ Implement `user.service.ts` (T065)
6. ✅ Implement `mentor.service.ts` (T066)
7. ✅ Create `notification.service.ts` (T076)

**Day 5: Testing Services**
8. Test AuthService methods with Postman/backend
9. Test UserService methods
10. Test MentorService methods

---

### Week 2: Authentication Components

**Day 1: Login**
11. ✅ Create `login.component.ts` (T067)
12. Build login form UI
13. Implement login logic
14. Test login flow

**Day 2: Register**
15. ✅ Create `register.component.ts` (T068)
16. Build registration form UI
17. Implement registration logic
18. Test registration flow

**Day 3: Password Reset**
19. ✅ Create `password-reset.component.ts` (T069)
20. Build request reset UI
21. Build reset password UI
22. Test password reset flow

**Day 4: Email Verification**
23. ✅ Create `email-verification.component.ts` (T070)
24. Implement verification logic
25. Test verification flow

**Day 5: Integration & Routing**
26. Update `public.routes.ts`
27. Test all auth routes
28. Fix bugs and refine UI

---

### Week 3: Profile Management

**Day 1-2: User Profile**
29. ✅ Create `user-profile.component.ts` (T071)
30. Build profile display UI
31. ✅ Create `edit-profile.component.ts` (T072)
32. Build edit form UI
33. Implement profile update logic
34. Test profile management

**Day 3-4: Mentor Profile**
35. ✅ Create `mentor-profile-form.component.ts` (T073)
36. Build mentor form UI (bio, expertise, rates)
37. ✅ Create `mentor-application.component.ts` (T074)
38. Build application wizard UI
39. Implement mentor application logic
40. Test mentor application flow

**Day 5: Header & Navigation**
41. ✅ Create `header.component.ts` (T075)
42. Build navigation UI (unauthenticated)
43. Build navigation UI (authenticated)
44. Implement user dropdown menu
45. Update `app.component.html` to include header
46. Test navigation and routing

---

### Week 4: Integration, Testing & Polish

**Day 1: Routing Integration**
47. ✅ Update `user.routes.ts` (T075)
48. ✅ Update `mentor.routes.ts` (T075)
49. Test all routes with guards
50. Test role-based navigation

**Day 2: End-to-End Testing**
51. ✅ Test complete registration flow
52. ✅ Test complete login flow
53. ✅ Test profile management flow
54. ✅ Test mentor application flow

**Day 3: Error Handling & Edge Cases**
55. Test error scenarios (network errors, 401, 403, 500)
56. Test form validation edge cases
57. Test token expiration and refresh
58. Test concurrent sessions

**Day 4: UI/UX Polish**
59. Improve loading states
60. Refine notification messages
61. Improve responsive design
62. Add accessibility attributes

**Day 5: Documentation & Handoff**
63. Document API integration
64. Create component usage examples
65. Write deployment notes
66. Final bug fixes

---

## Success Criteria Checklist

### User Registration & Authentication

- [ ] User can register with email, password, and role selection (User/Mentor)
- [ ] Registration sends verification email
- [ ] User receives confirmation message after registration
- [ ] Email verification link activates account
- [ ] User can login with verified credentials
- [ ] Login redirects to appropriate dashboard based on role
- [ ] Invalid credentials show clear error message
- [ ] Unverified email shows specific error message

### Password Management

- [ ] User can request password reset via email
- [ ] Password reset email contains valid token link
- [ ] User can set new password with reset token
- [ ] Expired token shows appropriate error
- [ ] Password reset success redirects to login

### Profile Management

- [ ] User can view their profile information
- [ ] User can edit first name, last name, career interests
- [ ] User can upload profile photo
- [ ] Profile photo preview shows before upload
- [ ] User can remove profile photo
- [ ] Profile updates save successfully
- [ ] Success notification appears after profile update
- [ ] Changes reflect immediately in header/profile view

### Mentor Application

- [ ] User can access mentor application form
- [ ] Form validates all required fields (bio, expertise, rates, categories)
- [ ] Bio requires 100-1000 characters
- [ ] Expertise requires minimum 3 tags
- [ ] Rates must be between $20-$500
- [ ] At least one category must be selected
- [ ] Application submits successfully
- [ ] User sees "Under Review" message after submission
- [ ] Mentor profile created with `isVerified = false`

### Navigation & Routing

- [ ] Header shows appropriate links based on auth state
- [ ] Unauthenticated users see Login/Register buttons
- [ ] Authenticated users see profile dropdown menu
- [ ] User dropdown includes Profile, Dashboard, Sessions, Logout
- [ ] Logout clears tokens and redirects to home
- [ ] Auth guard protects authenticated routes
- [ ] Role guard enforces role-based access
- [ ] Guest guard redirects authenticated users away from login/register

### Error Handling

- [ ] 401 errors automatically logout and redirect to login
- [ ] 403 errors show "Access denied" message
- [ ] 500 errors show user-friendly error message
- [ ] Network errors show connectivity message
- [ ] Form validation errors display inline
- [ ] Backend validation errors display in forms
- [ ] Toast notifications show for success/error actions

### Form Validation

- [ ] Email format validated
- [ ] Password minimum length enforced (8 characters)
- [ ] Password and confirm password must match
- [ ] Required fields show error when empty
- [ ] Number fields enforce min/max values
- [ ] Form submit button disabled when form invalid
- [ ] Validation errors clear when user corrects input

### User Experience

- [ ] Loading spinners show during API calls
- [ ] Buttons disable while processing
- [ ] Success messages appear after successful actions
- [ ] Error messages are clear and actionable
- [ ] Forms pre-populate with existing data in edit mode
- [ ] Navigation is intuitive and consistent
- [ ] Mobile responsive design works on all screen sizes
- [ ] Keyboard navigation works throughout the app

---

## Coordination with Backend Team

### Critical Action Items

#### 1. Populate Backend DTOs

**Current Issue:** DTOs exist but are empty (internal classes with no properties)

**Required DTOs to Populate:**

**Auth DTOs** (`Backend/CareerRoute.Core/DTOs/Auth/`)
- [ ] `RegisterRequestDto` - Add properties matching frontend `RegisterRequest`
- [ ] `LoginRequestDto` - Add properties matching frontend `LoginRequest`
- [ ] `AuthResponseDto` - Add properties matching frontend `AuthResponse`
- [ ] `PasswordResetRequestDto` - Add email property
- [ ] `PasswordResetDto` - Add token, newPassword, confirmPassword

**User DTOs** (`Backend/CareerRoute.Core/DTOs/Users/`)
- [ ] `UserDto` - Add properties matching frontend `User` model
- [ ] `UpdateUserDto` - Verify/add properties matching frontend `UpdateUserProfile`

**Mentor DTOs** (`Backend/CareerRoute.Core/DTOs/Mentors/`)
- [ ] `MentorDto` - Add properties matching frontend `Mentor` model
- [ ] `CreateMentorProfileDto` - Verify/add properties matching frontend `CreateMentorProfile`
- [ ] `UpdateMentorProfileDto` - Add properties matching frontend `UpdateMentorProfile`

**Category DTOs** (`Backend/CareerRoute.Core/DTOs/Categories/`)
- [ ] `CategoryDto` - Add id, name, description, iconUrl

---

#### 2. Implement API Controllers

**AuthController** (`Backend/CareerRoute.API/Controllers/AuthController.cs`)
- [ ] `POST /api/auth/register` → Register new user
- [ ] `POST /api/auth/login` → Authenticate user
- [ ] `POST /api/auth/refresh` → Refresh access token
- [ ] `POST /api/auth/forgot-password` → Send password reset email
- [ ] `POST /api/auth/reset-password` → Reset password with token
- [ ] `GET /api/auth/verify-email?token={token}` → Verify email

**UsersController** (`Backend/CareerRoute.API/Controllers/UsersController.cs`)
*Currently empty - needs full implementation*
- [ ] `GET /api/users/me` → Get current authenticated user
- [ ] `GET /api/users/{id}` → Get user by ID
- [ ] `PUT /api/users/{id}` → Update user profile
- [ ] `POST /api/users/{id}/photo` → Upload profile photo
- [ ] `DELETE /api/users/{id}/photo` → Delete profile photo

**MentorsController** (`Backend/CareerRoute.API/Controllers/MentorsController.cs`)
*Needs endpoints for User Story 1*
- [ ] `POST /api/mentors` → Apply as mentor
- [ ] `GET /api/mentors/me` → Get current user's mentor profile
- [ ] `GET /api/mentors/{id}` → Get mentor by ID
- [ ] `PUT /api/mentors/{id}` → Update mentor profile

**CategoriesController** (`Backend/CareerRoute.API/Controllers/CategoriesController.cs`)
*New controller needed*
- [ ] `GET /api/categories` → Get all categories

---

#### 3. API Response Format Agreement

**Standard Success Response:**
```json
{
  "data": { ... },
  "message": "Operation successful",
  "success": true
}
```

**Standard Error Response:**
```json
{
  "errors": {
    "Email": ["Email is already registered"],
    "Password": ["Password must be at least 8 characters"]
  },
  "message": "Validation failed",
  "success": false
}
```

**Validation Error Response (400):**
```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": {
    "Email": ["The Email field is required."],
    "Password": ["Password must be at least 8 characters"]
  }
}
```

---

#### 4. JWT Token Format

**Access Token Claims:**
```json
{
  "sub": "user-id-123",
  "email": "user@example.com",
  "role": "User",
  "exp": 1234567890,
  "iss": "CareerRoute",
  "aud": "CareerRoute"
}
```

**Token Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "refresh-token-string",
  "expiresIn": 3600,
  "user": {
    "id": "user-id-123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "User",
    "isEmailVerified": true
  }
}
```

---

#### 5. Email Service Integration

**Required Email Templates:**

1. **Email Verification**
   - Subject: "Verify your email - Career Route"
   - Body: Include verification link with token
   - Link format: `https://app.careerroute.com/auth/verify-email?token={token}`

2. **Password Reset**
   - Subject: "Reset your password - Career Route"
   - Body: Include reset link with token
   - Link format: `https://app.careerroute.com/auth/reset-password?token={token}`

3. **Welcome Email** (After verification)
   - Subject: "Welcome to Career Route!"
   - Body: Getting started guide

4. **Mentor Application Received**
   - Subject: "Your mentor application is under review"
   - Body: Timeline and next steps

---

#### 6. Testing Coordination

**API Testing Checklist:**

- [ ] Test all auth endpoints with Swagger
- [ ] Test user endpoints with valid tokens
- [ ] Test mentor endpoints with role authorization
- [ ] Verify email verification flow end-to-end
- [ ] Verify password reset flow end-to-end
- [ ] Test file upload for profile photos
- [ ] Test error responses match agreed format
- [ ] Test CORS configuration for frontend origin

**Integration Testing:**
- [ ] Frontend can successfully register user
- [ ] Frontend can successfully login user
- [ ] Frontend receives correct JWT token
- [ ] Frontend can access protected endpoints
- [ ] Frontend displays backend validation errors correctly
- [ ] Email verification link works from frontend
- [ ] Password reset link works from frontend

---

### Communication Points

**Daily Standups:**
- Report API endpoint completion status
- Discuss any API contract changes
- Resolve integration issues

**Weekly Integration Testing:**
- Full end-to-end testing of completed features
- Bug fixing session
- Performance testing

**Documentation:**
- Keep Swagger documentation up-to-date
- Document any API changes in shared document
- Update backend architecture review as needed

---

## Next Steps After Plan Approval

### Frontend Team Will:

1. **Create all TypeScript models** (`user.model.ts`, `mentor.model.ts`, `auth.model.ts`)
2. **Implement core services** (`auth.service.ts`, `user.service.ts`, `mentor.service.ts`, `notification.service.ts`)
3. **Build authentication components** (Login, Register, Password Reset, Email Verification)
4. **Build profile components** (User Profile, Edit Profile, Mentor Application)
5. **Build shared components** (Header navigation)
6. **Update routing configuration**
7. **Test with mock data initially**, then integrate with backend

### Backend Team Will:

1. **Populate all DTOs** with properties matching frontend models
2. **Implement AuthController endpoints**
3. **Implement UsersController endpoints**
4. **Implement MentorsController endpoints**
5. **Create CategoriesController**
6. **Setup email service integration** (SendGrid)
7. **Test all endpoints with Swagger**
8. **Coordinate with frontend on API testing**

### Integration Phase:

1. **API Contract Testing** - Verify request/response formats match
2. **Error Response Testing** - Ensure frontend handles all error scenarios
3. **Authentication Flow Testing** - End-to-end login, register, token refresh
4. **Profile Management Testing** - Update profiles, upload photos
5. **Mentor Application Testing** - Apply as mentor, admin approval flow

---

## Appendix

### A. Component File Structure

```
Frontend/src/app/
├── core/
│   ├── guards/
│   │   ├── auth.guard.ts ✅
│   │   └── role.guard.ts ✅
│   ├── interceptors/
│   │   ├── auth.interceptor.ts ✅
│   │   └── error.interceptor.ts ✅
│   └── services/
│       ├── auth.service.ts ⚠️ (Skeleton exists)
│       ├── user.service.ts ❌
│       ├── mentor.service.ts ❌
│       └── notification.service.ts ❌
├── features/
│   ├── auth/
│   │   ├── login/
│   │   │   ├── login.component.ts ❌
│   │   │   ├── login.component.html ❌
│   │   │   └── login.component.css ❌
│   │   ├── register/
│   │   │   ├── register.component.ts ❌
│   │   │   ├── register.component.html ❌
│   │   │   └── register.component.css ❌
│   │   ├── password-reset/
│   │   │   ├── password-reset.component.ts ❌
│   │   │   ├── password-reset.component.html ❌
│   │   │   └── password-reset.component.css ❌
│   │   └── email-verification/
│   │       ├── email-verification.component.ts ❌
│   │       ├── email-verification.component.html ❌
│   │       └── email-verification.component.css ❌
│   ├── user/
│   │   ├── user-profile/
│   │   │   ├── user-profile.component.ts ❌
│   │   │   ├── user-profile.component.html ❌
│   │   │   └── user-profile.component.css ❌
│   │   ├── edit-profile/
│   │   │   ├── edit-profile.component.ts ❌
│   │   │   ├── edit-profile.component.html ❌
│   │   │   └── edit-profile.component.css ❌
│   │   └── user.routes.ts ✅
│   └── mentors/
│       ├── mentor-profile/
│       │   ├── mentor-profile-form.component.ts ❌
│       │   ├── mentor-profile-form.component.html ❌
│       │   └── mentor-profile-form.component.css ❌
│       └── mentor-application/
│           ├── mentor-application.component.ts ❌
│           ├── mentor-application.component.html ❌
│           └── mentor-application.component.css ❌
└── shared/
    ├── components/
    │   └── header/
    │       ├── header.component.ts ❌
    │       ├── header.component.html ❌
    │       └── header.component.css ❌
    └── models/
        ├── user.model.ts ❌
        ├── mentor.model.ts ❌
        └── auth.model.ts ❌
```

**Legend:**
- ✅ = Implemented
- ⚠️ = Partially implemented
- ❌ = Not implemented

---

### B. Dependencies & Packages

**Current Dependencies** (`package.json`):
```json
{
  "dependencies": {
    "@angular/common": "^20.3.0",
    "@angular/compiler": "^20.3.0",
    "@angular/core": "^20.3.0",
    "@angular/forms": "^20.3.0",
    "@angular/platform-browser": "^20.3.0",
    "@angular/router": "^20.3.0",
    "bootstrap": "^5.3.8",
    "rxjs": "~7.8.0",
    "tslib": "^2.3.0",
    "zone.js": "~0.15.0"
  }
}
```

**No additional packages required for User Story 1!** ✅

All features can be implemented using existing dependencies.

---

### C. Environment Configuration

**Development** (`environment.development.ts`):
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000/api',
  tokenKey: 'access_token',
  refreshTokenKey: 'refresh_token'
};
```

**Production** (`environment.ts`):
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.careerroute.com/api',
  tokenKey: 'access_token',
  refreshTokenKey: 'refresh_token'
};
```

---

### D. Estimated Effort

**Total Estimated Time:** 4 weeks (160 hours)

**Breakdown:**
- Week 1: Models & Services (40 hours)
- Week 2: Auth Components (40 hours)
- Week 3: Profile Components (40 hours)
- Week 4: Integration & Testing (40 hours)

**Team Size:** 2 Frontend Developers

**Timeline:** 2 weeks with 2 developers working in parallel

---

## Conclusion

This plan provides a comprehensive roadmap for implementing **User Story 1: User and Mentor Registration & Profile Management** on the frontend of the Career Route platform.

By following this plan, we will deliver:
✅ Complete authentication system (register, login, email verification, password reset)
✅ User profile management (view, edit, photo upload)
✅ Mentor application workflow
✅ Role-based navigation
✅ Global error handling
✅ Responsive UI with Bootstrap
✅ Full backend integration

**Ready to begin implementation upon approval!** 🚀
