import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { interval, Subscription } from 'rxjs';

/**
 * EmailVerificationSentComponent
 *
 * Displays confirmation that a verification email has been sent
 * and provides option to resend the verification email.
 *
 * Features:
 * - Shows email address where verification was sent
 * - Resend verification email functionality with cooldown
 * - Instructions for checking inbox and spam folder
 * - Links to login page and home page
 * - Responsive design matching auth flow
 * - Cooldown timer to prevent spam (60 seconds)
 *
 * @example
 * ```html
 * <app-email-verification-sent></app-email-verification-sent>
 * ```
 */
@Component({
  selector: 'app-email-verification-sent',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './email-verification-sent.component.html',
  styleUrl: './email-verification-sent.component.css'
})
export class EmailVerificationSentComponent implements OnInit, OnDestroy {
  email: string = '';
  loading = false;
  resendCooldown = 0;
  canResend = true;
  private cooldownSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Get email from navigation state (passed from register component)
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state || history.state;

    this.email = state?.['email'] || '';

    // If no email is provided, redirect to register page
    if (!this.email) {
      this.notificationService.warning(
        'Please complete registration first.',
        'Registration Required'
      );
      this.router.navigate(['/auth/register']);
    }
  }

  ngOnDestroy(): void {
    // Clean up cooldown subscription
    if (this.cooldownSubscription) {
      this.cooldownSubscription.unsubscribe();
    }
  }

  /**
   * Resend verification email
   */
  resendVerificationEmail(): void {
    if (!this.canResend || this.loading || !this.email) {
      return;
    }

    this.loading = true;

    this.authService.resendVerificationEmail({ email: this.email }).subscribe({
      next: () => {
        // Success notification is shown by AuthService
        this.startCooldown();
        this.loading = false;
      },
      error: (error) => {
        // Error interceptor has already processed the error
        const errorMessage = error.message || 'Failed to resend verification email. Please try again.';
        this.notificationService.error(errorMessage, 'Resend Failed');
        this.loading = false;
      }
    });
  }

  /**
   * Start cooldown timer to prevent spam
   */
  private startCooldown(): void {
    this.canResend = false;
    this.resendCooldown = 60; // 60 seconds cooldown

    // Update countdown every second
    this.cooldownSubscription = interval(1000).subscribe(() => {
      this.resendCooldown--;

      if (this.resendCooldown <= 0) {
        this.canResend = true;
        this.cooldownSubscription?.unsubscribe();
      }
    });
  }

  /**
   * Navigate to login page
   */
  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  /**
   * Navigate to home page
   */
  goToHome(): void {
    this.router.navigate(['/']);
  }
}
