import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { EmailVerificationRequest } from '../../../shared/models/auth.model';

/**
 * EmailVerificationComponent
 *
 * Handles email verification when user clicks verification link from email.
 * Automatically verifies email on component load by extracting token and userId from URL.
 *
 * Features:
 * - Automatic verification on component load
 * - Token and userId extraction from URL query parameters
 * - Loading spinner during verification
 * - Success message with auto-redirect to login or dashboard
 * - Error message with option to resend verification email
 * - Support for auto-login after successful verification
 * - Responsive design with Tailwind CSS
 * - Dark mode support
 *
 * URL Format:
 * `/auth/verify-email?email=user@example.com&token=abc123`
 *
 * @example
 * ```html
 * <app-email-verification></app-email-verification>
 * ```
 *
 * User Flow:
 * 1. User receives verification email after registration
 * 2. User clicks verification link: `/auth/verify-email?email=user@example.com&token=abc`
 * 3. Component extracts email and token from URL
 * 4. Component automatically calls AuthService.verifyEmail()
 * 5. On success: Show success message → redirect to login/dashboard
 * 6. On error: Show error message with option to resend email
 */
@Component({
  selector: 'app-email-verification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './email-verification.component.html',
  styleUrl: './email-verification.component.css'
})
export class EmailVerificationComponent implements OnInit {
  /** Current verification state */
  verificationState: 'loading' | 'success' | 'error' = 'loading';

  /** Success message to display */
  successMessage: string | null = null;

  /** Error message to display */
  errorMessage: string | null = null;

  /** User email extracted from URL */
  email: string | null = null;

  /** Token extracted from URL */
  token: string | null = null;

  /** Whether auto-login is enabled after verification */
  autoLogin: boolean = false;

  /** Countdown timer for redirect (in seconds) */
  redirectCountdown: number = 3;

  /** Interval ID for countdown timer */
  private countdownInterval: any;

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Check if user is already logged in
    if (this.authService.isAuthenticated()) {
      this.notificationService.info('You are already logged in.');
      this.router.navigate(['/user/dashboard']);
      return;
    }

    // Extract email and token from URL query parameters
    this.email = this.route.snapshot.queryParams['email'];
    this.token = this.route.snapshot.queryParams['token'];

    // Validate that both parameters are present
    if (!this.email || !this.token) {
      this.verificationState = 'error';
      this.errorMessage = 'Invalid verification link. The link is missing required parameters.';
      return;
    }

    // Automatically verify email on load
    this.verifyEmail();
  }

  /**
   * Verify email using token and email from URL
   */
  private verifyEmail(): void {
    // Set loading state
    this.verificationState = 'loading';

    // Prepare verification request
    const request: EmailVerificationRequest = {
      email: this.email!,
      token: this.token!
    };

    // Call AuthService to verify email
    this.authService.verifyEmail(request).subscribe({
      next: (response) => {
        console.log('Email verification successful:', response);

        // Set success state
        this.verificationState = 'success';

        // Check if auto-login is enabled
        // Note: Message comes from ApiResponse wrapper (handled by backend), not from response data
        if (response.autoLogin && response.loginToken) {
          this.autoLogin = true;
          this.successMessage = 'Email verified successfully! Logging you in...';

          // AuthService.verifyEmail() has already handled token storage and auth state update

          // Start countdown and redirect to dashboard
          this.startRedirectCountdown('/user/dashboard');
        } else {
          this.successMessage = 'Email verified successfully! You can now log in.';
          // Start countdown and redirect to login
          this.startRedirectCountdown('/auth/login');
        }
      },
      error: (error) => {
        console.error('Email verification failed:', error);

        // Set error state
        this.verificationState = 'error';
        this.errorMessage = error.message || 'Email verification failed. The link may be invalid or expired.';
      }
    });
  }

  /**
   * Start countdown timer and redirect to specified route
   */
  private startRedirectCountdown(redirectUrl: string): void {
    // Clear any existing countdown
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }

    // Start countdown
    this.countdownInterval = setInterval(() => {
      this.redirectCountdown--;

      if (this.redirectCountdown <= 0) {
        clearInterval(this.countdownInterval);
        this.router.navigate([redirectUrl]);
      }
    }, 1000);
  }

  /**
   * Resend verification email
   * Note: This requires implementing ResendVerificationEmailRequest
   * For now, we'll redirect to a help page or show instructions
   */
  resendVerificationEmail(): void {
    // TODO: Implement resend verification email functionality
    // For now, redirect to login with a message
    this.notificationService.info('Please log in to resend verification email from your account settings.');
    this.router.navigate(['/auth/login']);
  }

  /**
   * Navigate to login page manually (cancel countdown)
   */
  goToLogin(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    this.router.navigate(['/auth/login']);
  }

  /**
   * Navigate to home page
   */
  goToHome(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    this.router.navigate(['/']);
  }

  /**
   * Cleanup on component destroy
   */
  ngOnDestroy(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }
}
