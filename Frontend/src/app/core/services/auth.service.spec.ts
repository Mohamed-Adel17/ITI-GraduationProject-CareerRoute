import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthService);
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    // Clean up after each test
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Token Management', () => {
    it('should store and retrieve access token', () => {
      const token = 'test-access-token';
      service.setToken(token);
      expect(service.getToken()).toBe(token);
    });

    it('should store and retrieve refresh token', () => {
      const refreshToken = 'test-refresh-token';
      service.setRefreshToken(refreshToken);
      expect(service.getRefreshToken()).toBe(refreshToken);
    });

    it('should remove all tokens', () => {
      service.setToken('access-token');
      service.setRefreshToken('refresh-token');
      service.removeTokens();
      expect(service.getToken()).toBeNull();
      expect(service.getRefreshToken()).toBeNull();
    });

    it('should return null when no token exists', () => {
      expect(service.getToken()).toBeNull();
      expect(service.getRefreshToken()).toBeNull();
    });
  });

  describe('Authentication Status', () => {
    it('should return true when user is authenticated', () => {
      service.setToken('test-token');
      expect(service.isAuthenticated()).toBe(true);
    });

    it('should return false when user is not authenticated', () => {
      expect(service.isAuthenticated()).toBe(false);
    });
  });

  describe('Token Decoding', () => {
    it('should decode a valid JWT token', () => {
      // Sample JWT token with payload: { sub: '123', name: 'John Doe', exp: 1234567890 }
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJuYW1lIjoiSm9obiBEb2UiLCJleHAiOjEyMzQ1Njc4OTB9.signature';
      const decoded = service.decodeToken(token);

      expect(decoded).toBeTruthy();
      expect(decoded.sub).toBe('123');
      expect(decoded.name).toBe('John Doe');
    });

    it('should return null for invalid token', () => {
      const invalidToken = 'invalid-token';
      const decoded = service.decodeToken(invalidToken);
      expect(decoded).toBeNull();
    });

    it('should get user from stored token', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJuYW1lIjoiSm9obiBEb2UiLCJleHAiOjEyMzQ1Njc4OTB9.signature';
      service.setToken(token);

      const user = service.getUserFromToken();
      expect(user).toBeTruthy();
      expect(user.name).toBe('John Doe');
    });

    it('should return null when no token is stored', () => {
      const user = service.getUserFromToken();
      expect(user).toBeNull();
    });
  });

  describe('Token Expiration', () => {
    it('should detect expired token', () => {
      // Token with exp in the past (timestamp: 1234567890 = Feb 2009)
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJuYW1lIjoiSm9obiBEb2UiLCJleHAiOjEyMzQ1Njc4OTB9.signature';
      service.setToken(expiredToken);

      expect(service.isTokenExpired()).toBe(true);
    });

    it('should detect valid token', () => {
      // Token with exp far in the future
      const futureTimestamp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const payload = btoa(JSON.stringify({ sub: '123', exp: futureTimestamp }));
      const validToken = `header.${payload}.signature`;
      service.setToken(validToken);

      expect(service.isTokenExpired()).toBe(false);
    });

    it('should return true when no token exists', () => {
      expect(service.isTokenExpired()).toBe(true);
    });
  });
});
