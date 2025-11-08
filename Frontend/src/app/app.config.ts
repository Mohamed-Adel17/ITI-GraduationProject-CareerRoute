import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
// import { mockHttpInterceptor } from './core/interceptors/mock-http.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
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
