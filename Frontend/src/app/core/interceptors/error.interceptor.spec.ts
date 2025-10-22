import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { errorInterceptor } from './error.interceptor';
import { AuthService } from '../services/auth.service';

describe('errorInterceptor', () => {
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockAuthService: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    // Create mock services
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockAuthService = jasmine.createSpyObj('AuthService', ['removeTokens', 'getToken']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: Router, useValue: mockRouter },
        { provide: AuthService, useValue: mockAuthService }
      ]
    });

    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should handle 401 Unauthorized error and logout user', (done) => {
    const testUrl = '/api/test';

    httpClient.get(testUrl).subscribe({
      next: () => fail('should have failed with 401 error'),
      error: (error: any) => {
        expect(error.status).toBe(401);
        expect(error.message).toBe('Your session has expired. Please log in again.');
        expect(mockAuthService.removeTokens).toHaveBeenCalled();
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
        done();
      }
    });

    const req = httpMock.expectOne(testUrl);
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
  });

  it('should handle 403 Forbidden error', (done) => {
    const testUrl = '/api/test';

    httpClient.get(testUrl).subscribe({
      next: () => fail('should have failed with 403 error'),
      error: (error: any) => {
        expect(error.status).toBe(403);
        expect(error.message).toBe('You do not have permission to access this resource.');
        done();
      }
    });

    const req = httpMock.expectOne(testUrl);
    req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });
  });

  it('should handle 404 Not Found error', (done) => {
    const testUrl = '/api/test';

    httpClient.get(testUrl).subscribe({
      next: () => fail('should have failed with 404 error'),
      error: (error: any) => {
        expect(error.status).toBe(404);
        expect(error.message).toBe('The requested resource was not found.');
        done();
      }
    });

    const req = httpMock.expectOne(testUrl);
    req.flush('Not Found', { status: 404, statusText: 'Not Found' });
  });

  it('should handle 500 Internal Server Error', (done) => {
    const testUrl = '/api/test';

    httpClient.get(testUrl).subscribe({
      next: () => fail('should have failed with 500 error'),
      error: (error: any) => {
        expect(error.status).toBe(500);
        expect(error.message).toBe('A server error occurred. Please try again later.');
        done();
      }
    });

    const req = httpMock.expectOne(testUrl);
    req.flush('Internal Server Error', { status: 500, statusText: 'Internal Server Error' });
  });

  it('should handle 400 Bad Request with validation errors', (done) => {
    const testUrl = '/api/test';
    const validationErrors = {
      errors: {
        'Email': ['Email is required'],
        'Password': ['Password must be at least 6 characters']
      }
    };

    httpClient.post(testUrl, {}).subscribe({
      next: () => fail('should have failed with 400 error'),
      error: (error: any) => {
        expect(error.status).toBe(400);
        expect(error.message).toContain('Email is required');
        expect(error.message).toContain('Password must be at least 6 characters');
        done();
      }
    });

    const req = httpMock.expectOne(testUrl);
    req.flush(validationErrors, { status: 400, statusText: 'Bad Request' });
  });

  it('should handle 422 Unprocessable Entity with validation errors', (done) => {
    const testUrl = '/api/test';
    const validationErrors = {
      errors: {
        'Name': ['Name is required'],
        'Age': ['Age must be a positive number']
      }
    };

    httpClient.post(testUrl, {}).subscribe({
      next: () => fail('should have failed with 422 error'),
      error: (error: any) => {
        expect(error.status).toBe(422);
        expect(error.message).toContain('Name is required');
        expect(error.message).toContain('Age must be a positive number');
        done();
      }
    });

    const req = httpMock.expectOne(testUrl);
    req.flush(validationErrors, { status: 422, statusText: 'Unprocessable Entity' });
  });

  it('should handle 429 Too Many Requests error', (done) => {
    const testUrl = '/api/test';

    httpClient.get(testUrl).subscribe({
      next: () => fail('should have failed with 429 error'),
      error: (error: any) => {
        expect(error.status).toBe(429);
        expect(error.message).toBe('Too many requests. Please try again later.');
        done();
      }
    });

    const req = httpMock.expectOne(testUrl);
    req.flush('Too Many Requests', { status: 429, statusText: 'Too Many Requests' });
  });

  it('should handle network errors', (done) => {
    const testUrl = '/api/test';

    httpClient.get(testUrl).subscribe({
      next: () => fail('should have failed with network error'),
      error: (error: any) => {
        expect(error.status).toBe(0);
        expect(error.message).toBe('Unable to connect to the server. Please check your internet connection.');
        done();
      }
    });

    const req = httpMock.expectOne(testUrl);
    req.error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });
  });

  it('should handle 409 Conflict error', (done) => {
    const testUrl = '/api/test';

    httpClient.post(testUrl, {}).subscribe({
      next: () => fail('should have failed with 409 error'),
      error: (error: any) => {
        expect(error.status).toBe(409);
        expect(error.message).toBe('Resource already exists');
        done();
      }
    });

    const req = httpMock.expectOne(testUrl);
    req.flush({ message: 'Resource already exists' }, { status: 409, statusText: 'Conflict' });
  });

  it('should handle 503 Service Unavailable error', (done) => {
    const testUrl = '/api/test';

    httpClient.get(testUrl).subscribe({
      next: () => fail('should have failed with 503 error'),
      error: (error: any) => {
        expect(error.status).toBe(503);
        expect(error.message).toBe('The service is temporarily unavailable. Please try again later.');
        done();
      }
    });

    const req = httpMock.expectOne(testUrl);
    req.flush('Service Unavailable', { status: 503, statusText: 'Service Unavailable' });
  });
});
