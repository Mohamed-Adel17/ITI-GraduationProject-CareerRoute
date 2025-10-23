/**
 * Environment Configuration Template
 *
 * IMPORTANT: This is a template file. DO NOT commit actual environment files with secrets!
 *
 * Instructions:
 * 1. Copy this file to create your environment files:
 *    - environment.development.ts (for local development)
 *    - environment.ts (for production)
 * 2. Replace placeholder values with actual configuration
 * 3. Add environment.*.ts to .gitignore to prevent committing secrets
 *
 * The actual environment files are already created in this directory.
 * Update them with your specific configuration values.
 */
export const environment = {
  /**
   * Production flag
   * - Set to false for development
   * - Set to true for production
   */
  production: false,

  /**
   * API Configuration
   * Base URL for the backend API
   *
   * Examples:
   * - Development: 'http://localhost:5000/api'
   * - Production: 'https://api.careerroute.com/api'
   */
  apiUrl: 'http://localhost:5000/api',

  /**
   * Authentication Configuration
   */
  auth: {
    // Token storage keys in localStorage
    tokenKey: 'career_route_token',
    refreshTokenKey: 'career_route_refresh_token',
    // Token expiration buffer (in seconds) - refresh token before it expires
    tokenExpirationBuffer: 300, // 5 minutes
  },

  /**
   * Application Settings
   */
  app: {
    name: 'Career Route',
    version: '1.0.0',
    // Enable debug logging (true for dev, false for prod)
    enableDebugLogging: true,
    // Default pagination settings
    defaultPageSize: 10,
    maxPageSize: 100,
  },

  /**
   * External Service URLs
   */
  services: {
    // Zoom video conferencing redirect URL
    zoomRedirectUrl: 'http://localhost:4200/zoom/callback',

    // Stripe public key
    // Get test key from: https://dashboard.stripe.com/test/apikeys
    // Get live key from: https://dashboard.stripe.com/apikeys
    stripePublicKey: 'pk_test_YOUR_STRIPE_TEST_KEY_HERE',
  },

  /**
   * Feature Flags
   * Enable/disable features for testing or gradual rollout
   */
  features: {
    enableChat: true,
    enablePayments: true,
    enableVideoConferencing: true,
    enableReviews: true,
    enableAdminDashboard: true,
  },

  /**
   * Session Configuration
   */
  session: {
    // Auto-logout after inactivity (in minutes)
    inactivityTimeout: 30,
    // Session reminder before timeout (in minutes)
    timeoutWarning: 5,
  },

  /**
   * File Upload Configuration
   */
  upload: {
    // Maximum file size for profile pictures (in MB)
    maxProfilePictureSize: 5,
    // Allowed image formats
    allowedImageFormats: ['image/jpeg', 'image/png', 'image/jpg'],
    // Maximum file size for documents (in MB)
    maxDocumentSize: 10,
  },
};
