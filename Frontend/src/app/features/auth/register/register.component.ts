import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { RegisterRequest } from '../../../shared/models/auth.model';

/**
 * RegisterComponent
 *
 * Handles user registration with email, password, name, phone, and role selection (User/Mentor).
 * Provides registration form with validation and role-based account creation.
 *
 * Features:
 * - Reactive form with email, password, name validation
 * - First name and last name fields (required)
 * - Phone number field (optional)
 * - Role selection (User as mentee, Mentor as service provider)
 * - Password visibility toggle
 * - Loading state during API call
 * - Error message display
 * - Links to login page
 * - Responsive design with features panel
 *
 * @example
 * ```html
 * <app-register></app-register>
 * ```
 */
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  loading = false;
  errorMessage: string | null = null;
  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Check if user is already logged in
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/user/dashboard']);
      return;
    }

    // Initialize registration form with validators
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: [''], // Optional field
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
      userType: ['client', Validators.required] // 'mentor' or 'client'
    });
  }

  /**
   * Getter for easy access to form controls in template
   */
  get firstName() {
    return this.registerForm.get('firstName')!;
  }

  get lastName() {
    return this.registerForm.get('lastName')!;
  }

  get email() {
    return this.registerForm.get('email')!;
  }

  get phoneNumber() {
    return this.registerForm.get('phoneNumber')!;
  }

  get password() {
    return this.registerForm.get('password')!;
  }

  get confirmPassword() {
    return this.registerForm.get('confirmPassword')!;
  }

  get userType() {
    return this.registerForm.get('userType')!;
  }

  /**
   * Toggles password visibility between text and password input types
   */
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  /**
   * Toggles confirm password visibility between text and password input types
   */
  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  /**
   * Handles form submission
   * Calls AuthService.register() and handles navigation based on verification requirements
   *
   * Responsibilities:
   * - Validate form input
   * - Call AuthService.register()
   * - Show success notification
   * - Navigate to email verification page or dashboard based on requiresEmailVerification
   * - Handle and display errors via NotificationService
   * - Clear password field on error for security
   * - Manage loading state
   */
  onSubmit(): void {
    // Clear previous error messages
    this.errorMessage = null;

    // Validate form
    if (this.registerForm.invalid) {
      // Mark all fields as touched to show validation errors
      this.registerForm.markAllAsTouched();
      return;
    }

    // Set loading state
    this.loading = true;

    // Prepare registration request
    const registerRequest: RegisterRequest = {
      email: this.registerForm.value.email,
      password: this.registerForm.value.password,
      confirmPassword: this.registerForm.value.confirmPassword,
      firstName: this.registerForm.value.firstName,
      lastName: this.registerForm.value.lastName,
      phoneNumber: this.registerForm.value.phoneNumber || undefined, // Optional
      registerAsMentor: this.registerForm.value.userType === 'mentor'
    };

    // Call AuthService to register
    this.authService.register(registerRequest).subscribe({
      next: (response) => {
        // Registration successful - AuthService has handled auth state updates
        console.log('Registration successful:', response);

        // Show success notification
        // Note: Message comes from ApiResponse wrapper (handled by backend), not from response data
        this.notificationService.success(
          'Account created successfully! Please check your email to verify your account.',
          'Welcome!'
        );

        // Navigate based on email verification requirement
        if (response.requiresEmailVerification) {
          // Email verification required - user should check their email for verification link
          // The verification token is sent via email, not returned in the response for security
          // Show info notification and stay on registration page or redirect to a "check email" page
          this.notificationService.info(
            `A verification email has been sent to ${response.email || 'your email'}. Please check your inbox and click the verification link to activate your account.`,
            'Verify Your Email',
            10000 // Show for 10 seconds
          );

          // Navigate to verify-email page without token (it will show instructions to check email)
          // Or navigate to home page
          this.router.navigate(['/']);
        } else {
          // Email verification not required, user can log in immediately
          this.router.navigate(['/auth/login']);
        }
      },
      error: (error) => {
        // Registration failed
        // ErrorInterceptor has already transformed the error
        console.error('Registration failed:', error);

        // Display error message via notification
        const errorMessage = error.message || 'Registration failed. Please try again.';
        this.notificationService.error(errorMessage, 'Registration Error');

        // Also display error in component for accessibility
        this.errorMessage = errorMessage;

        // Clear password field on error for security
        this.registerForm.patchValue({ password: '' });

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
