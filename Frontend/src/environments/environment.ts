/**
 * Production Environment Configuration
 * This file is used when building the application for production (ng build)
 */
export const environment = {
  production: true,

  /**
   * API Configuration
   * Base URL for the backend API - REPLACE WITH YOUR PRODUCTION API URL
   */
  apiUrl: 'careerroute.runasp.net',

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
    // Disable debug logging in production
    enableDebugLogging: false,
    // Default pagination settings
    defaultPageSize: 10,
    maxPageSize: 100,
  },

  /**
   * External Service URLs
   */
  services: {
    // Zoom video conferencing
    zoomRedirectUrl: 'https://www.careerroute.com/zoom/callback',
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
      hubUrl: 'https://api.careerroute.com/hub/payment',
    },
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

  /**
   * Feature Flags
   * Enable/disable features in production
   */
  features: {
    enableChat: true,
    enablePayments: true,
    enableVideoConferencing: true,
    enableReviews: true,
    enableAdminDashboard: true,
  },
};
