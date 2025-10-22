# Error Interceptor Usage Guide

## Overview

The error interceptor automatically handles HTTP errors across your entire Angular application. It provides centralized error handling, user-friendly error messages, and automatic logout on 401 Unauthorized errors.

## Features

### Automatic Error Handling

The interceptor handles the following error scenarios:

- **400 Bad Request**: Extracts and formats validation errors from ASP.NET Core
- **401 Unauthorized**: Automatically logs out the user and redirects to login
- **403 Forbidden**: Displays permission denied message
- **404 Not Found**: Resource not found message
- **409 Conflict**: Handles duplicate resource errors
- **422 Unprocessable Entity**: Extracts FluentValidation errors
- **429 Too Many Requests**: Rate limiting message
- **500 Internal Server Error**: Generic server error message
- **503 Service Unavailable**: Service temporarily down message
- **Network Errors**: Connection issues and CORS errors

### Error Response Format

All errors are transformed into a consistent format:

```typescript
{
  status: number,           // HTTP status code
  message: string,          // User-friendly error message
  originalError: HttpErrorResponse  // Original error for debugging
}
```

## Usage Examples

### Basic Usage in Components

```typescript
import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-user-profile',
  template: `
    <div *ngIf="errorMessage" class="alert alert-danger">
      {{ errorMessage }}
    </div>
    <!-- Your component template -->
  `
})
export class UserProfileComponent {
  errorMessage: string = '';

  constructor(private http: HttpClient) {}

  loadUserProfile() {
    this.http.get('/api/users/profile').subscribe({
      next: (data) => {
        // Handle success
        console.log('Profile loaded:', data);
      },
      error: (error) => {
        // Error is already processed by the interceptor
        this.errorMessage = error.message;
        console.error('Error loading profile:', error);
      }
    });
  }
}
```

### Handling Validation Errors

```typescript
import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-register',
  template: `
    <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
      <div *ngIf="errorMessage" class="alert alert-danger">
        {{ errorMessage }}
      </div>

      <input formControlName="email" placeholder="Email" />
      <input formControlName="password" type="password" placeholder="Password" />
      <button type="submit">Register</button>
    </form>
  `
})
export class RegisterComponent {
  registerForm: FormGroup;
  errorMessage: string = '';

  constructor(
    private http: HttpClient,
    private fb: FormBuilder
  ) {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit() {
    if (this.registerForm.valid) {
      this.http.post('/api/auth/register', this.registerForm.value).subscribe({
        next: (response) => {
          console.log('Registration successful:', response);
          // Navigate to login or dashboard
        },
        error: (error) => {
          // The interceptor extracts validation errors automatically
          // For 400 Bad Request, error.message will contain:
          // "Email is required; Password must be at least 6 characters"
          this.errorMessage = error.message;
        }
      });
    }
  }
}
```

### Handling Specific Error Status Codes

```typescript
import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-booking',
  template: `
    <div *ngIf="errorMessage" [ngClass]="errorClass">
      {{ errorMessage }}
    </div>
  `
})
export class BookingComponent {
  errorMessage: string = '';
  errorClass: string = '';

  constructor(private http: HttpClient) {}

  createBooking(bookingData: any) {
    this.http.post('/api/bookings', bookingData).subscribe({
      next: (response) => {
        console.log('Booking created:', response);
      },
      error: (error) => {
        this.errorMessage = error.message;

        // Handle specific status codes for custom behavior
        switch (error.status) {
          case 409:
            // Conflict - booking slot already taken
            this.errorClass = 'alert alert-warning';
            // Maybe show alternative time slots
            break;
          case 403:
            // Forbidden - user doesn't have permission
            this.errorClass = 'alert alert-danger';
            break;
          case 422:
            // Validation error
            this.errorClass = 'alert alert-danger';
            break;
          default:
            this.errorClass = 'alert alert-danger';
        }
      }
    });
  }
}
```

### Using with Services

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MentorService {
  private apiUrl = '/api/mentors';

  constructor(private http: HttpClient) {}

  getMentors(): Observable<any> {
    return this.http.get(this.apiUrl).pipe(
      catchError((error) => {
        // Error is already processed by interceptor
        // You can add service-specific error handling here
        console.error('Error in MentorService:', error.message);

        // Re-throw to let components handle it
        return throwError(() => error);
      })
    );
  }

  getMentorById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`).pipe(
      catchError((error) => {
        if (error.status === 404) {
          console.warn(`Mentor with ID ${id} not found`);
        }
        return throwError(() => error);
      })
    );
  }
}
```

### Global Error Display with Toast/Snackbar

```typescript
import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

// If using a toast service (example)
@Component({
  selector: 'app-payment',
  template: `<!-- Your template -->`
})
export class PaymentComponent {
  constructor(
    private http: HttpClient,
    // private toastService: ToastService  // Your toast service
  ) {}

  processPayment(paymentData: any) {
    this.http.post('/api/payments', paymentData).subscribe({
      next: (response) => {
        // this.toastService.success('Payment processed successfully');
      },
      error: (error) => {
        // Display error message in toast
        // this.toastService.error(error.message);
        console.error('Payment error:', error.message);
      }
    });
  }
}
```

## Automatic 401 Handling

When a 401 Unauthorized error occurs:

1. The interceptor automatically calls `authService.removeTokens()`
2. User is redirected to `/login`
3. No manual intervention needed in components

```typescript
// This will automatically logout and redirect on 401
this.http.get('/api/protected-resource').subscribe({
  next: (data) => console.log(data),
  error: (error) => {
    // If 401, user is already logged out and redirected
    // You can still handle other errors here
    if (error.status !== 401) {
      console.error('Error:', error.message);
    }
  }
});
```

## Debugging

The interceptor logs detailed error information to the console:

```typescript
// Console output format:
{
  status: 404,
  message: "The requested resource was not found.",
  url: "/api/users/123",
  method: "GET",
  error: { /* original error object */ }
}
```

## Best Practices

1. **Always handle the error callback** in subscriptions to prevent unhandled errors
2. **Display user-friendly messages** from `error.message`
3. **Check error.status** for specific error handling if needed
4. **Don't duplicate error handling** - the interceptor handles common cases
5. **Use error.originalError** for debugging complex issues

## Error Message Customization

If you need to customize error messages, you can wrap the HTTP call:

```typescript
loadData() {
  this.http.get('/api/data').subscribe({
    error: (error) => {
      // Override interceptor message for specific cases
      if (error.status === 404) {
        this.errorMessage = 'No data available at this time.';
      } else {
        this.errorMessage = error.message; // Use interceptor message
      }
    }
  });
}
```

## Integration with Backend

The interceptor is designed to work with ASP.NET Core error responses:

### ASP.NET Core Model Validation (400)

```json
{
  "errors": {
    "Email": ["Email is required"],
    "Password": ["Password must be at least 6 characters"]
  }
}
```

### FluentValidation (422)

```json
{
  "errors": {
    "Name": ["Name is required"],
    "Age": ["Age must be a positive number"]
  }
}
```

### Custom Error Messages

```json
{
  "message": "Resource already exists"
}
```

All these formats are automatically parsed and presented as user-friendly messages.
