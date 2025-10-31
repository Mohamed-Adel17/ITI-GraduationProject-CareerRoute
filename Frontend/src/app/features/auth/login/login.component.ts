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
   * Calls AuthService.login() and navigates to dashboard or returnUrl on success
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
        // Login successful
        // AuthService already stored token and updated currentUser$
        console.log('Login successful:', response);

        // Navigate to returnUrl or dashboard
        this.router.navigate([this.returnUrl]);
      },
      error: (error) => {
        // Login failed
        // ErrorInterceptor already handled 401 and logged out if needed
        console.error('Login failed:', error);

        // Display error message
        this.errorMessage = error.message || 'Login failed. Please check your credentials and try again.';

        // Clear password field on error
        this.loginForm.patchValue({ password: '' });

        this.loading = false;
      },
      complete: () => {
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
