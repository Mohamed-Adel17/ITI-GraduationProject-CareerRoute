import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { PasswordResetRequest, PasswordReset } from '../../../shared/models/auth.model';

/**
 * PasswordResetComponent
 *
 * Handles two-step password reset process:
 * - Step 1: Request reset (email input) - forgotPassword()
 * - Step 2: Reset password (token from URL + new password) - resetPassword()
 *
 * Features:
 * - Two-step password reset flow
 * - Email validation in step 1
 * - Password strength validation in step 2
 * - Token extraction from URL query parameters
 * - Password visibility toggle
 * - Loading states during API calls
 * - Error message display
 * - Success confirmation with redirect to login
 * - Responsive design with Tailwind CSS
 * - Dark mode support
 *
 * @example
 * Step 1 (Request Reset):
 * ```
 * Navigate to: /auth/forgot-password
 * User enters email → receives reset link via email
 * ```
 *
 * Step 2 (Reset Password):
 * ```
 * Navigate to: /auth/reset-password?email=user@example.com&token=abc123
 * User enters new password → password is reset → redirect to login
 * ```
 */
@Component({
  selector: 'app-password-reset',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './password-reset.component.html',
  styleUrl: './password-reset.component.css'
})
export class PasswordResetComponent implements OnInit {
  /** Current step: 1 = request reset (email), 2 = reset password (token + new password) */
  currentStep: 1 | 2 = 1;

  /** Form for step 1 (email input) */
  requestResetForm!: FormGroup;

  /** Form for step 2 (new password + confirmation) */
  resetPasswordForm!: FormGroup;

  /** Loading state for API calls */
  loading = false;

  /** Error message to display */
  errorMessage: string | null = null;

  /** Success message to display */
  successMessage: string | null = null;

  /** Show/hide password fields */
  showPassword = false;
  showConfirmPassword = false;

  /** Email extracted from URL (for step 2) */
  emailFromUrl: string | null = null;

  /** Reset token extracted from URL (for step 2) */
  tokenFromUrl: string | null = null;

  /** Email address from step 1 (for display in step 2 if navigating manually) */
  requestedEmail: string | null = null;

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
      this.router.navigate(['/user/dashboard']);
      return;
    }

    // Extract email and token from URL query parameters
    this.emailFromUrl = this.route.snapshot.queryParams['email'];
    this.tokenFromUrl = this.route.snapshot.queryParams['token'];

    // If both email and token are present in URL, go to step 2
    if (this.emailFromUrl && this.tokenFromUrl) {
      this.currentStep = 2;
      this.initializeResetPasswordForm();
    } else {
      // Otherwise, start at step 1 (request reset)
      this.currentStep = 1;
      this.initializeRequestResetForm();
    }
  }

  /**
   * Initialize form for step 1 (request password reset via email)
   */
  private initializeRequestResetForm(): void {
    this.requestResetForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  /**
   * Initialize form for step 2 (reset password with token)
   */
  private initializeResetPasswordForm(): void {
    this.resetPasswordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  /**
   * Custom validator to check if passwords match
   */
  private passwordMatchValidator(form: FormGroup): { [key: string]: boolean } | null {
    const password = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    return null;
  }

  /**
   * Getters for easy access to form controls in template (Step 1)
   */
  get email() {
    return this.requestResetForm?.get('email')!;
  }

  /**
   * Getters for easy access to form controls in template (Step 2)
   */
  get newPassword() {
    return this.resetPasswordForm?.get('newPassword')!;
  }

  get confirmPassword() {
    return this.resetPasswordForm?.get('confirmPassword')!;
  }

  /**
   * Toggle password visibility for new password field
   */
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  /**
   * Toggle password visibility for confirm password field
   */
  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  /**
   * Clear error and success messages
   */
  clearMessages(): void {
    this.errorMessage = null;
    this.successMessage = null;
  }

  /**
   * Handle step 1 form submission (request password reset)
   * Calls AuthService.forgotPassword() and handles UI feedback
   *
   * Responsibilities:
   * - Validate form input
   * - Call AuthService.forgotPassword()
   * - Show success message and notification
   * - Handle and display errors via NotificationService
   * - Manage loading state
   */
  onRequestResetSubmit(): void {
    // Clear previous messages
    this.clearMessages();

    // Validate form
    if (this.requestResetForm.invalid) {
      this.requestResetForm.markAllAsTouched();
      return;
    }

    // Set loading state
    this.loading = true;

    // Prepare request
    const request: PasswordResetRequest = {
      email: this.requestResetForm.value.email
    };

    // Store email for potential display
    this.requestedEmail = request.email;

    // Call AuthService
    this.authService.forgotPassword(request).subscribe({
      next: (response) => {
        console.log('Password reset request successful:', response);

        // Show success message in component
        this.successMessage = response.message || 'Password reset link has been sent to your email. Please check your inbox.';

        // Show success notification
        this.notificationService.success(
          'Please check your email for the password reset link.',
          'Email Sent'
        );

        // Clear the form
        this.requestResetForm.reset();

        this.loading = false;
      },
      error: (error) => {
        console.error('Password reset request failed:', error);

        // Display error message in component
        const errorMessage = error.message || 'Failed to send password reset email. Please try again.';
        this.errorMessage = errorMessage;

        // Show error notification
        this.notificationService.error(errorMessage, 'Request Failed');

        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  /**
   * Handle step 2 form submission (reset password with token)
   * Calls AuthService.resetPassword() and handles UI feedback
   *
   * Responsibilities:
   * - Validate form input
   * - Validate email and token from URL
   * - Call AuthService.resetPassword()
   * - Show success message and notification
   * - Navigate to login page after successful reset
   * - Handle and display errors via NotificationService
   * - Manage loading state
   */
  onResetPasswordSubmit(): void {
    // Clear previous messages
    this.clearMessages();

    // Validate form
    if (this.resetPasswordForm.invalid) {
      this.resetPasswordForm.markAllAsTouched();
      return;
    }

    // Ensure we have email and token from URL
    if (!this.emailFromUrl || !this.tokenFromUrl) {
      this.errorMessage = 'Invalid password reset link. Please request a new password reset.';
      this.notificationService.error(
        'The password reset link is invalid or expired. Please request a new one.',
        'Invalid Link'
      );
      return;
    }

    // Set loading state
    this.loading = true;

    // Prepare request
    const request: PasswordReset = {
      email: this.emailFromUrl,
      token: this.tokenFromUrl,
      newPassword: this.resetPasswordForm.value.newPassword,
      confirmPassword: this.resetPasswordForm.value.confirmPassword
    };

    // Call AuthService
    this.authService.resetPassword(request).subscribe({
      next: (response) => {
        console.log('Password reset successful:', response);

        // Show success message in component
        this.successMessage = response.message || 'Your password has been reset successfully. Redirecting to login...';

        // Show success notification
        this.notificationService.success(
          'Your password has been reset successfully.',
          'Password Reset'
        );

        // Redirect to login after 3 seconds
        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 3000);

        this.loading = false;
      },
      error: (error) => {
        console.error('Password reset failed:', error);

        // Display error message in component
        const errorMessage = error.message || 'Failed to reset password. The link may be expired or invalid. Please request a new password reset.';
        this.errorMessage = errorMessage;

        // Show error notification
        this.notificationService.error(errorMessage, 'Reset Failed');

        // Clear password fields on error for security
        this.resetPasswordForm.patchValue({
          newPassword: '',
          confirmPassword: ''
        });

        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  /**
   * Navigate back to step 1 from step 2 (if user wants to request a new reset link)
   */
  goBackToRequestReset(): void {
    this.currentStep = 1;
    this.clearMessages();
    this.initializeRequestResetForm();

    // Clear URL query parameters
    this.router.navigate(['/auth/forgot-password']);
  }
}
