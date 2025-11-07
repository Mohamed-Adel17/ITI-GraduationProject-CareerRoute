import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LoginRequest } from '../../../shared/models/auth.model';

/**
 * LoginComponent
 *
 * Handles user authentication with email and password.
 * Provides login form with validation, error handling, and "Remember Me" functionality.
 *
 * Features:
 * - Reactive form with email and password validation
 * - "Remember Me" checkbox for extended session
 * - Redirect to returnUrl after successful login
 * - Password visibility toggle
 * - Loading state during API call
 * - Error message display
 * - Links to register and forgot password pages
 *
 * @example
 * ```html
 * <app-login></app-login>
 * ```
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  loading = false;
  errorMessage: string | null = null;
  showPassword = false;
  returnUrl: string = '/user/dashboard';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Check if user is already logged in
    if (this.authService.isAuthenticated()) {
      this.router.navigate([this.returnUrl]);
      return;
    }

    // Extract returnUrl from query params (for redirecting after login)
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/user/dashboard';

    // Initialize login form with validators
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      rememberMe: [false]
    });
  }

  /**
   * Getter for easy access to form controls in template
   */
  get email() {
    return this.loginForm.get('email')!;
  }

  get password() {
    return this.loginForm.get('password')!;
  }

  /**
   * Toggles password visibility between text and password input types
   */
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  /**
   * Handles form submission
   * Orchestrates the login flow with notifications and navigation
   *
   * Responsibilities:
   * - Validate form input
   * - Call AuthService.login()
   * - Show success notification and navigate on success
   * - Handle and display errors via NotificationService
   * - Clear password field on error for security
   * - Manage loading state
   */
  onSubmit(): void {
    // Clear previous error messages
    this.errorMessage = null;

    // Validate form
    if (this.loginForm.invalid) {
      // Mark all fields as touched to show validation errors
      this.loginForm.markAllAsTouched();
      return;
    }

    // Set loading state
    this.loading = true;

    // Prepare login request
    const loginRequest: LoginRequest = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password,
      rememberMe: this.loginForm.value.rememberMe
    };

    // Call AuthService to login
    this.authService.login(loginRequest).subscribe({
      next: (response) => {
        // Login successful - AuthService has stored tokens and updated auth state
        console.log('Login successful:', response);

        // Show success notification
        this.notificationService.success(
          `Welcome back, ${response.user.firstName}!`,
          'Login Successful'
        );

        // Navigate to returnUrl or dashboard
        this.router.navigate([this.returnUrl]);
      },
      error: (error) => {
        // Login failed
        // ErrorInterceptor has already transformed the error
        console.error('Login failed:', error);

        // Check if error is due to unverified email (401 with specific message)
        // Backend throws UnauthenticatedException which returns 401
        if (error.status === 401 && error.message?.includes('verify your email')) {
          // Email not verified - automatically resend verification email and navigate
          this.handleUnverifiedEmail(this.loginForm.value.email);
          return;
        }

        // Display error message via notification
        const errorMessage = error.message || 'Login failed. Please check your credentials and try again.';
        this.notificationService.error(errorMessage, 'Login Error');

        // Also display error in component for accessibility
        this.errorMessage = errorMessage;

        // Clear password field on error for security
        this.loginForm.patchValue({ password: '' });

        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  /**
   * Handles unverified email error by resending verification email
   * and navigating to verification-sent page
   * @param email User's email address
   */
  private handleUnverifiedEmail(email: string): void {
    console.log('Handling unverified email for:', email);

    // Automatically resend verification email
    this.authService.resendVerificationEmail({ email }).subscribe({
      next: () => {
        // Success notification is shown by AuthService
        // Navigate to verification-sent page with email
        this.router.navigate(['/auth/verification-sent'], {
          state: { email }
        });
        this.loading = false;
      },
      error: (resendError) => {
        // Resend failed - still navigate to verification-sent page
        // But show error notification
        console.error('Failed to resend verification email:', resendError);

        // Navigate to verification-sent page anyway so user can manually retry
        this.router.navigate(['/auth/verification-sent'], {
          state: { email }
        });
        this.loading = false;
      }
    });
  }

  /**
   * Clears the error message when user starts typing
   */
  clearError(): void {
    this.errorMessage = null;
  }
}
