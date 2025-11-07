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
      firstName: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
        Validators.pattern(/^[a-zA-Z\s'-]+$/) // Only letters, spaces, hyphens, and apostrophes
      ]],
      lastName: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
        Validators.pattern(/^[a-zA-Z\s'-]+$/) // Only letters, spaces, hyphens, and apostrophes
      ]],
      email: ['', [
        Validators.required,
        Validators.email,
        Validators.maxLength(256)
      ]],
      phoneNumber: ['', [
        Validators.pattern(/^\+?[1-9]\d{1,14}$/) // E.164 international phone number format
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(100),
        this.passwordStrengthValidator
      ]],
      confirmPassword: ['', [Validators.required]],
      userType: ['client', Validators.required] // 'mentor' or 'client'
    }, {
      validators: this.passwordMatchValidator // Add cross-field validator
    });
  }

  /**
   * Custom validator to check password strength
   * Password must contain at least one uppercase, one lowercase, and one number
   * @param control The form control to validate
   * @returns Validation error object or null
   */
  passwordStrengthValidator(control: any): { [key: string]: boolean } | null {
    const value = control.value;

    if (!value) {
      return null; // Don't validate empty value (required validator handles that)
    }

    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumber = /\d/.test(value);

    const errors: { [key: string]: boolean } = {};

    if (!hasUpperCase) {
      errors['noUpperCase'] = true;
    }
    if (!hasLowerCase) {
      errors['noLowerCase'] = true;
    }
    if (!hasNumber) {
      errors['noNumber'] = true;
    }

    return Object.keys(errors).length > 0 ? errors : null;
  }

  /**
   * Custom validator to check if password and confirmPassword match
   * @param formGroup The form group to validate
   * @returns Validation error object or null
   */
  passwordMatchValidator(formGroup: FormGroup): { [key: string]: boolean } | null {
    const password = formGroup.get('password')?.value;
    const confirmPassword = formGroup.get('confirmPassword')?.value;

    // Only validate if both fields have values
    if (password && confirmPassword && password !== confirmPassword) {
      formGroup.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    // Clear the passwordMismatch error if passwords match
    const confirmPasswordControl = formGroup.get('confirmPassword');
    if (confirmPasswordControl?.hasError('passwordMismatch')) {
      const errors = confirmPasswordControl.errors;
      if (errors) {
        delete errors['passwordMismatch'];
        confirmPasswordControl.setErrors(Object.keys(errors).length > 0 ? errors : null);
      }
    }

    return null;
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
        this.notificationService.success(
          'Account created successfully!',
          'Welcome!'
        );

        // Email verification is always required
        // The verification token is sent via email, not returned in the response for security
        // Navigate to verification-sent page with email in state
        this.router.navigate(['/auth/verification-sent'], {
          state: { email: response.email || this.registerForm.value.email }
        });
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
