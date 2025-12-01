import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
// import { mockHttpInterceptor } from './core/interceptors/mock-http.interceptor';

/**
 * Application Configuration
 *
 * Configures Angular application providers:
 * - Router with scroll behavior (scrolls to top on navigation)
 * - HTTP client with interceptors (auth, error handling)
 * - Animations for UI components
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    // Router with scroll behavior
    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'top', // Always scroll to top on navigation
        anchorScrolling: 'enabled'         // Enable anchor link scrolling (e.g., #section)
      })
    ),
    provideAnimations(), // Enable animations for notification component
    provideHttpClient(
      withInterceptors([
        // Auth Interceptor - KEEP THIS (attaches JWT token to requests)
        // IMPORTANT: Must run BEFORE mockHttpInterceptor so token is attached
        authInterceptor,
        // Mock HTTP Interceptor - REMOVE THIS LINE ONLY when backend is ready
        // mockHttpInterceptor,
        // Error Interceptor - KEEP THIS (handles HTTP errors globally)
        errorInterceptor
      ])
    )
  ]
};
