# Frontend Environment Configuration Guide

This guide explains how to configure and use environment settings in the Career Route Angular frontend application.

## Overview

The application uses Angular's environment configuration system to manage different settings for development and production environments. This allows you to:

- Use different API endpoints for development and production
- Configure external service integrations (Stripe, Zoom, etc.)
- Enable/disable features using feature flags
- Manage application settings without changing code

## Environment Files

The following environment files are located in `src/environments/`:

| File | Purpose | Usage |
|------|---------|-------|
| `environment.development.ts` | Development configuration | Used by default when running `ng serve` |
| `environment.ts` | Production configuration | Used when building with `ng build` |
| `environment.TEMPLATE.ts` | Template/reference | Documentation and template for new environments |

## File Structure

Each environment file exports an `environment` object with the following structure:

```typescript
export const environment = {
  production: boolean,           // Production flag
  apiUrl: string,               // Backend API base URL
  auth: {                       // Authentication settings
    tokenKey: string,
    refreshTokenKey: string,
    tokenExpirationBuffer: number
  },
  app: {                        // Application settings
    name: string,
    version: string,
    enableDebugLogging: boolean,
    defaultPageSize: number,
    maxPageSize: number
  },
  services: {                   // External service configurations
    zoomRedirectUrl: string,
    stripePublicKey: string
  },
  features: {                   // Feature flags
    enableChat: boolean,
    enablePayments: boolean,
    enableVideoConferencing: boolean,
    enableReviews: boolean,
    enableAdminDashboard: boolean
  },
  session: {                    // Session management
    inactivityTimeout: number,
    timeoutWarning: number
  },
  upload: {                     // File upload settings
    maxProfilePictureSize: number,
    allowedImageFormats: string[],
    maxDocumentSize: number
  }
};
```

## Configuration Steps

### 1. Development Environment Setup

The development environment is already configured with sensible defaults. To customize:

1. Open `src/environments/environment.development.ts`
2. Update the following values:

```typescript
// API Configuration - Update if your backend runs on a different port
apiUrl: 'http://localhost:5000/api',

// Stripe Test Key - Get from https://dashboard.stripe.com/test/apikeys
services: {
  stripePublicKey: 'pk_test_YOUR_STRIPE_TEST_KEY_HERE',
}
```

### 2. Production Environment Setup

Before deploying to production:

1. Open `src/environments/environment.ts`
2. **REQUIRED**: Update these values:

```typescript
// Production API URL
apiUrl: 'https://api.careerroute.com/api',

// Production Stripe Key
services: {
  stripePublicKey: 'pk_live_YOUR_STRIPE_LIVE_KEY_HERE',
  zoomRedirectUrl: 'https://www.careerroute.com/zoom/callback'
}
```

### 3. Verify Angular Configuration

The `angular.json` file is already configured with file replacements. When building for production, Angular automatically replaces `environment.development.ts` with `environment.ts`.

Verify this configuration in `angular.json`:

```json
"configurations": {
  "production": {
    "fileReplacements": [
      {
        "replace": "src/environments/environment.development.ts",
        "with": "src/environments/environment.ts"
      }
    ],
    // ... other production settings
  }
}
```

## Using Environment Variables in Code

### Importing the Environment

Always import from `environment.development.ts` (Angular will replace it automatically in production):

```typescript
import { environment } from '../../../environments/environment.development';
```

### Example Usage in Services

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getUsers() {
    return this.http.get(`${this.apiUrl}/users`);
  }
}
```

### Example Usage in Components

```typescript
import { Component } from '@angular/core';
import { environment } from '../../../environments/environment.development';

@Component({
  selector: 'app-profile',
  template: '...'
})
export class ProfileComponent {
  maxFileSize = environment.upload.maxProfilePictureSize;

  onFileSelect(file: File) {
    const maxSizeBytes = this.maxFileSize * 1024 * 1024; // Convert MB to bytes
    if (file.size > maxSizeBytes) {
      alert(`File too large. Maximum size: ${this.maxFileSize}MB`);
    }
  }
}
```

### Using Feature Flags

```typescript
import { Component } from '@angular/core';
import { environment } from '../../../environments/environment.development';

@Component({
  selector: 'app-dashboard',
  template: `
    <div *ngIf="chatEnabled">
      <app-chat></app-chat>
    </div>
  `
})
export class DashboardComponent {
  chatEnabled = environment.features.enableChat;
}
```

## Running and Building

### Development Server

```bash
# Uses environment.development.ts automatically
npm start
# or
ng serve
```

### Production Build

```bash
# Uses environment.ts (via file replacement)
npm run build
# or
ng build
```

The production build will:
1. Replace `environment.development.ts` with `environment.ts`
2. Enable optimizations
3. Generate production-ready bundles in the `dist/` folder

### Testing Specific Configurations

To test the production configuration locally:

```bash
ng build --configuration production
ng serve --configuration production
```

## Configuration Properties Reference

### API Configuration

| Property | Type | Description | Example |
|----------|------|-------------|---------|
| `apiUrl` | string | Backend API base URL | `http://localhost:5000/api` |

### Authentication

| Property | Type | Description | Default |
|----------|------|-------------|---------|
| `auth.tokenKey` | string | LocalStorage key for access token | `'career_route_token'` |
| `auth.refreshTokenKey` | string | LocalStorage key for refresh token | `'career_route_refresh_token'` |
| `auth.tokenExpirationBuffer` | number | Seconds before expiration to refresh | `300` (5 min) |

### External Services

| Property | Type | Description |
|----------|------|-------------|
| `services.zoomRedirectUrl` | string | OAuth callback URL for Zoom integration |
| `services.stripePublicKey` | string | Stripe publishable key (pk_test_* or pk_live_*) |

### Feature Flags

| Property | Type | Description | Default |
|----------|------|-------------|---------|
| `features.enableChat` | boolean | Enable/disable real-time chat | `true` |
| `features.enablePayments` | boolean | Enable/disable payment processing | `true` |
| `features.enableVideoConferencing` | boolean | Enable/disable Zoom integration | `true` |
| `features.enableReviews` | boolean | Enable/disable mentor reviews | `true` |
| `features.enableAdminDashboard` | boolean | Enable/disable admin features | `true` |

### Session Management

| Property | Type | Description | Default |
|----------|------|-------------|---------|
| `session.inactivityTimeout` | number | Minutes of inactivity before auto-logout | `30` |
| `session.timeoutWarning` | number | Minutes before timeout to show warning | `5` |

### File Upload

| Property | Type | Description | Default |
|----------|------|-------------|---------|
| `upload.maxProfilePictureSize` | number | Max profile picture size in MB | `5` |
| `upload.allowedImageFormats` | string[] | Allowed MIME types for images | `['image/jpeg', 'image/png', 'image/jpg']` |
| `upload.maxDocumentSize` | number | Max document size in MB | `10` |

## Security Best Practices

### 1. Never Commit Secrets

While the current setup includes environment files in the repository, if your configuration contains sensitive secrets:

1. Add environment files to `.gitignore`:
   ```
   /src/environments/environment.ts
   /src/environments/environment.development.ts
   ```

2. Keep only the template file tracked:
   ```
   !/src/environments/environment.TEMPLATE.ts
   ```

### 2. Use Environment Variables for CI/CD

In production deployments, inject secrets via environment variables:

```bash
# Example: Replace values during build
sed -i "s|STRIPE_KEY_PLACEHOLDER|${STRIPE_PUBLISHABLE_KEY}|g" src/environments/environment.ts
ng build --configuration production
```

### 3. Separate Public and Private Keys

- **Frontend (Angular)**: Only use PUBLIC keys (Stripe publishable key: `pk_*`)
- **Backend (ASP.NET)**: Use SECRET keys (Stripe secret key: `sk_*`)

### 4. Validate Configuration

Consider adding a configuration validation service:

```typescript
@Injectable({ providedIn: 'root' })
export class ConfigValidationService {
  validateConfig(): void {
    if (environment.production && environment.apiUrl.includes('localhost')) {
      console.error('Production build using localhost API URL!');
    }

    if (environment.services.stripePublicKey.includes('YOUR_STRIPE')) {
      console.warn('Stripe key not configured!');
    }
  }
}
```

## Troubleshooting

### Problem: Changes to environment.ts not reflected

**Solution**: Angular caches the build. Clear the cache:
```bash
rm -rf .angular/cache
ng serve
```

### Problem: Production build uses wrong environment

**Solution**: Verify the `fileReplacements` configuration in `angular.json` under the production configuration.

### Problem: Environment import errors

**Solution**: Always import from `environment.development.ts`:
```typescript
// ✅ Correct
import { environment } from '../../../environments/environment.development';

// ❌ Wrong - don't import environment.ts directly
import { environment } from '../../../environments/environment';
```

### Problem: TypeScript errors after adding new properties

**Solution**: Make sure the new property exists in **both** `environment.ts` and `environment.development.ts` with the same structure.

## Adding New Environment Variables

To add a new configuration property:

1. **Update both environment files**:
   ```typescript
   // In environment.development.ts AND environment.ts
   export const environment = {
     // ... existing config
     newFeature: {
       apiKey: 'your-key',
       enabled: true
     }
   };
   ```

2. **Update the template**:
   ```typescript
   // In environment.TEMPLATE.ts
   newFeature: {
     apiKey: 'YOUR_API_KEY_HERE',
     enabled: true
   }
   ```

3. **Use in your code**:
   ```typescript
   import { environment } from '../../../environments/environment.development';

   if (environment.newFeature.enabled) {
     // Use environment.newFeature.apiKey
   }
   ```

## Integration with Backend

The backend API URL is configured in the environment files. Ensure coordination:

| Environment | Frontend URL | Backend URL |
|-------------|--------------|-------------|
| Development | `http://localhost:4200` | `http://localhost:5000` |
| Production | `https://www.careerroute.com` | `https://api.careerroute.com` |

### CORS Configuration

Ensure the backend's CORS policy allows requests from the frontend URL:

```csharp
// Backend: CareerRoute.API/Program.cs
builder.Services.AddCors(options => {
    options.AddPolicy("AllowFrontend", policy => {
        policy.WithOrigins("http://localhost:4200", "https://www.careerroute.com")
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});
```

## Related Documentation

- [Angular Environments Documentation](https://angular.dev/tools/cli/environments)
- [Project Git Workflow](../Documents/git-branching-strategy.md)
- [Backend API Configuration](../Backend/CareerRoute.API/appsettings.TEMPLATE.json)
- [Project Architecture](../Documents/backend-architecture-review.md)

## Support

For questions or issues with environment configuration:
1. Check the template file: `src/environments/environment.TEMPLATE.ts`
2. Review this documentation
3. Consult the team's configuration management practices
