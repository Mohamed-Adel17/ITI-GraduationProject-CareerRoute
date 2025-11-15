import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { interval, Subscription } from 'rxjs';

/**
 * SendEmailVerificationComponent
 *
 * Handles email verification confirmation and resending for two scenarios:
 * 1. Email already sent (from registration): Shows confirmation with resend option
 * 2. Email NOT sent (from login/password-reset): Requires manual send
 *
 * Features:
 * - Automatic confirmation mode when email already sent (emailAlreadySent: true)
 * - Manual send mode when user must send verification (emailAlreadySent: false)
 * - Resend functionality with 60-second cooldown after sending
 * - Shows email address being verified
 * - Instructions for checking inbox and spam folder
 * - Links to login page and home page
 * - Responsive design matching auth flow
 * - Dark mode support
 *
 * @example
 * ```typescript
 * // From registration (email already sent by backend)
 * this.router.navigate(['/auth/send-email-verification'], {
 *   state: { email: 'user@example.com', emailAlreadySent: true }
 * });
 *
 * // From login/password-reset (user must manually send)
 * this.router.navigate(['/auth/send-email-verification'], {
 *   state: { email: 'user@example.com' }
 * });
 * ```
 */
@Component({
  selector: 'app-send-email-verification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './send-email-verification.component.html',
  styleUrl: './send-email-verification.component.css'
})
export class SendEmailVerificationComponent implements OnInit, OnDestroy {
  /** User's email address (passed via navigation state) */
  email: string = '';

  /** Loading state during API call */
  loading = false;

  /** Cooldown timer (seconds remaining) */
  sendCooldown = 0;

  /** Whether user can send/resend email */
  canSend = true;

  /** Whether email has been sent at least once */
  emailSent = false;

  /** Whether email was already sent automatically (from registration) */
  emailAlreadySent = false;

  /** Cooldown subscription for timer */
  private cooldownSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Get email from navigation state (passed from login/register/password-reset)
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state || history.state;

    this.email = state?.['email'] || '';
    this.emailAlreadySent = state?.['emailAlreadySent'] || false;

    // If email was already sent (e.g., from registration), set emailSent to true
    if (this.emailAlreadySent) {
      this.emailSent = true;
    }

    // If no email is provided, redirect to register page
    if (!this.email) {
      this.notificationService.warning(
        'Please provide an email address.',
        'Email Required'
      );
      this.router.navigate(['/auth/register']);
      return;
    }

    // Restore cooldown state from localStorage if it exists
    this.restoreCooldownState();
  }

  ngOnDestroy(): void {
    // Clean up cooldown subscription
    if (this.cooldownSubscription) {
      this.cooldownSubscription.unsubscribe();
    }
  }

  /**
   * Restore cooldown state from localStorage
   * Checks if there's an active cooldown for this email
   */
  private restoreCooldownState(): void {
    const cooldownKey = this.getCooldownKey();
    const savedExpiry = localStorage.getItem(cooldownKey);

    if (savedExpiry) {
      const expiryTime = parseInt(savedExpiry, 10);
      const now = Date.now();
      const remainingSeconds = Math.ceil((expiryTime - now) / 1000);

      if (remainingSeconds > 0) {
        // Cooldown is still active
        this.canSend = false;
        this.sendCooldown = remainingSeconds;
        this.emailSent = true; // Email was sent in previous session

        // Start countdown timer
        this.cooldownSubscription = interval(1000).subscribe(() => {
          this.sendCooldown--;

          if (this.sendCooldown <= 0) {
            this.canSend = true;
            this.cooldownSubscription?.unsubscribe();
            localStorage.removeItem(cooldownKey);
          }
        });
      } else {
        // Cooldown expired, clean up
        localStorage.removeItem(cooldownKey);
      }
    }
  }

  /**
   * Get localStorage key for this email's cooldown
   */
  private getCooldownKey(): string {
    return `email_verification_cooldown_${this.email}`;
  }

  /**
   * Send or resend verification email
   * User must manually click button to send
   */
  sendVerificationEmail(): void {
    if (!this.canSend || this.loading || !this.email) {
      return;
    }

    this.loading = true;

    this.authService.resendVerificationEmail({ email: this.email }).subscribe({
      next: () => {
        // Mark email as sent
        this.emailSent = true;

        // Success notification is shown by AuthService
        this.notificationService.success(
          'Verification email sent! Please check your inbox.',
          'Email Sent'
        );

        // Start cooldown timer
        this.startCooldown();
        this.loading = false;
      },
      error: (error) => {
        // Error interceptor has already processed the error
        const errorMessage = error.message || 'Failed to send verification email. Please try again.';
        this.notificationService.error(errorMessage, 'Send Failed');
        this.loading = false;
      }
    });
  }

  /**
   * Start 60-second cooldown timer to prevent spam
   * Persists expiry time to localStorage to survive page reloads
   */
  private startCooldown(): void {
    this.canSend = false;
    this.sendCooldown = 60; // 60 seconds cooldown

    // Save expiry time to localStorage (current time + 60 seconds)
    const expiryTime = Date.now() + (60 * 1000);
    const cooldownKey = this.getCooldownKey();
    localStorage.setItem(cooldownKey, expiryTime.toString());

    // Update countdown every second
    this.cooldownSubscription = interval(1000).subscribe(() => {
      this.sendCooldown--;

      if (this.sendCooldown <= 0) {
        this.canSend = true;
        this.cooldownSubscription?.unsubscribe();
        localStorage.removeItem(cooldownKey);
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
