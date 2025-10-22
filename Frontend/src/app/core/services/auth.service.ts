import { Injectable } from '@angular/core';

/**
 * Service for managing authentication tokens and user session
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';

  /**
   * Get the JWT access token from localStorage
   * @returns The access token or null if not found
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Get the refresh token from localStorage
   * @returns The refresh token or null if not found
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Store the access token in localStorage
   * @param token The JWT access token to store
   */
  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  /**
   * Store the refresh token in localStorage
   * @param refreshToken The refresh token to store
   */
  setRefreshToken(refreshToken: string): void {
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  /**
   * Remove tokens from localStorage (logout)
   */
  removeTokens(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Check if user is authenticated by verifying token existence
   * Note: This does NOT validate token expiration - server will handle that
   * @returns True if token exists, false otherwise
   */
  isAuthenticated(): boolean {
    return this.getToken() !== null;
  }

  /**
   * Decode JWT token to extract payload (without verification)
   * WARNING: This is client-side only - never trust this data for security decisions
   * @param token The JWT token to decode
   * @returns Decoded token payload or null if invalid
   */
  decodeToken(token: string): any {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  /**
   * Get user information from the stored token
   * @returns User info from token payload or null
   */
  getUserFromToken(): any {
    const token = this.getToken();
    return token ? this.decodeToken(token) : null;
  }

  /**
   * Check if token is expired (client-side check only)
   * @returns True if token is expired, false otherwise
   */
  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) return true;

    const expirationDate = new Date(decoded.exp * 1000);
    return expirationDate < new Date();
  }
}
