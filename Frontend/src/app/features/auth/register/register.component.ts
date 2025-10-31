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
 * Handles user registration with email, password, and role selection (User/Mentor).
 * Provides registration form with validation and role-based account creation.
 *
 * Features:
 * - Reactive form with email, password validation
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
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
      userType: ['client', Validators.required] // 'mentor' or 'client'
    });
  }

  /**
   * Getter for easy access to form controls in template
   */
  get email() {
    return this.registerForm.get('email')!;
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
   * Calls AuthService.register() and navigates to appropriate dashboard
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
      firstName: '', // TODO: Add firstName field to form if needed
      lastName: '', // TODO: Add lastName field to form if needed
      registerAsMentor: this.registerForm.value.userType === 'mentor'
    };

    // Call AuthService to register
    this.authService.register(registerRequest).subscribe({
      next: (response) => {
        // Registration successful
        console.log('Registration successful:', response);

        // Show success notification
        this.notificationService.success(
          'Account created successfully! Please check your email to verify your account.',
          'Welcome!'
        );

        // Navigate based on role
        const redirectUrl = registerRequest.registerAsMentor
          ? '/mentor/profile-setup'
          : '/user/dashboard';
        this.router.navigate([redirectUrl]);
      },
      error: (error) => {
        // Registration failed
        console.error('Registration failed:', error);

        // Display error message
        this.errorMessage = error.message || 'Registration failed. Please try again.';

        // Clear password field on error
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
