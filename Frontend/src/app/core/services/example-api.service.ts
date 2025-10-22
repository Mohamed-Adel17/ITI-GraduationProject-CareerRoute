import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AuthService } from './auth.service';

/**
 * Example service demonstrating how to use the auth interceptor
 * This file serves as a reference - adapt it to your actual API endpoints
 */
@Injectable({
  providedIn: 'root'
})
export class ExampleApiService {
  // TODO: Replace with environment.apiUrl in production
  private readonly apiUrl = 'http://localhost:5000/api';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  // ========== Authentication Endpoints (NO token attached) ==========

  /**
   * Login user and store tokens
   * The interceptor will NOT attach a token to this request
   */
  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/login`, { email, password })
      .pipe(
        tap((response: any) => {
          // Store tokens after successful login
          if (response.accessToken) {
            this.authService.setToken(response.accessToken);
          }
          if (response.refreshToken) {
            this.authService.setRefreshToken(response.refreshToken);
          }
        })
      );
  }

  /**
   * Register new user
   * The interceptor will NOT attach a token to this request
   */
  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register`, userData);
  }

  /**
   * Refresh access token using refresh token
   * The interceptor will NOT attach a token to this request
   */
  refreshToken(): Observable<any> {
    const refreshToken = this.authService.getRefreshToken();
    return this.http.post(`${this.apiUrl}/auth/refresh-token`, { refreshToken })
      .pipe(
        tap((response: any) => {
          if (response.accessToken) {
            this.authService.setToken(response.accessToken);
          }
        })
      );
  }

  // ========== Protected Endpoints (Token automatically attached) ==========

  /**
   * Get current user profile
   * The interceptor WILL automatically attach the Bearer token
   */
  getCurrentUser(): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/me`);
  }

  /**
   * Update user profile
   * The interceptor WILL automatically attach the Bearer token
   */
  updateUserProfile(userData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/me`, userData);
  }

  /**
   * Get list of mentors
   * The interceptor WILL automatically attach the Bearer token
   */
  getMentors(filters?: any): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/mentors`, { params: filters });
  }

  /**
   * Get mentor by ID
   * The interceptor WILL automatically attach the Bearer token
   */
  getMentorById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/mentors/${id}`);
  }

  /**
   * Book a session with a mentor
   * The interceptor WILL automatically attach the Bearer token
   */
  bookSession(sessionData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/sessions`, sessionData);
  }

  /**
   * Get user's booked sessions
   * The interceptor WILL automatically attach the Bearer token
   */
  getMySessions(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/sessions/my-sessions`);
  }

  /**
   * Cancel a session
   * The interceptor WILL automatically attach the Bearer token
   */
  cancelSession(sessionId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/sessions/${sessionId}`);
  }

  /**
   * Submit a review for a completed session
   * The interceptor WILL automatically attach the Bearer token
   */
  submitReview(sessionId: number, reviewData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/sessions/${sessionId}/review`, reviewData);
  }

  // ========== Admin Endpoints (Token automatically attached) ==========

  /**
   * Get admin dashboard statistics
   * The interceptor WILL automatically attach the Bearer token
   * Backend should verify admin role from token
   */
  getAdminStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/statistics`);
  }

  /**
   * Approve mentor application
   * The interceptor WILL automatically attach the Bearer token
   */
  approveMentor(mentorId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/mentors/${mentorId}/approve`, {});
  }

  // ========== Logout ==========

  /**
   * Logout user by clearing tokens
   * No API call needed - just clear local storage
   */
  logout(): void {
    this.authService.removeTokens();
    // Optionally, call backend to invalidate refresh token
    // this.http.post(`${this.apiUrl}/auth/logout`, {}).subscribe();
  }
}
