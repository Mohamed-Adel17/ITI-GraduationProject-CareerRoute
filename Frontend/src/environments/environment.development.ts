/**
 * Development Environment Configuration
 * This file is used when running the application in development mode (ng serve)
 */
export const environment = {
  production: false,

  /**
   * API Configuration
   * Base URL for the backend API
   *
   * For testing with mock HTTP interceptor:
   */
  // apiUrl: 'http://localhost:4200/api',

  /**
   * Uncomment below when backend is ready on localhost:5000
   */
  apiUrl: 'http://localhost:5119/api',

  /**
   * Authentication Configuration
   */
  auth: {
    // Token storage keys
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
    // Enable debug logging in development
    enableDebugLogging: true,
    // Default pagination settings
    defaultPageSize: 10,
    maxPageSize: 100,
  },

  /**
   * External Service URLs
   */
  services: {
    // Zoom video conferencing (if using separate frontend integration)
    zoomRedirectUrl: 'http://localhost:4200/zoom/callback',
  },

  /**
   * Payment Provider Configuration
   */
  payment: {
    // Stripe configuration
    stripe: {
      publishableKey: 'pk_test_51SQj1nB7cctyvNSxIOsiv6EM6mcrIZ2nP9MUq8Q8oXZm5TOFh7wI8yjvWWvC8A8m6wgKaEPHZ3k5XZYZUTWncbe100STm2bT8X', // Replace with actual Stripe test key
    },
    // Paymob configuration
    paymob: {
      iframeId: '983026', // Replace with actual Paymob iframe ID
      apiUrl: 'https://accept.paymob.com/api/acceptance',
    },
    // SignalR hub for real-time payment status updates
    signalr: {
      hubUrl: 'https://localhost:7023/hub/payment',
    },
  },

  /**
   * Feature Flags
   * Enable/disable features for development testing
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
