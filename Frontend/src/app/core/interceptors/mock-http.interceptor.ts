// import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
// import { Observable, of, throwError } from 'rxjs';
// import { delay } from 'rxjs/operators';

// /**
//  * Mock HTTP Interceptor for Frontend Testing
//  * Functional interceptor pattern for Angular 15+
//  */

// // Mock database (persisted in localStorage to survive page refreshes and navigation)
// const MOCK_USERS_KEY = 'mockUsers';
// const MOCK_CATEGORIES_KEY = 'mockCategories';
// const MOCK_STORAGE = localStorage; // Use localStorage instead of sessionStorage for persistence

// function getMockUsers(): any[] {
//   const stored = MOCK_STORAGE.getItem(MOCK_USERS_KEY);
//   if (stored) {
//     return JSON.parse(stored);
//   }
//   // Default user if no stored users - complete profile structure
//   const defaultUsers = [
//     {
//       id: '1',
//       email: 'test@example.com',
//       password: 'Test1234!',
//       firstName: 'John',
//       lastName: 'Doe',
//       phoneNumber: '+1 (555) 123-4567',
//       profilePictureUrl: 'https://i.pravatar.cc/150?img=12',
//       careerInterests: ['Software Development', 'Data Science', 'Machine Learning'],
//       careerGoals: 'Become a senior software engineer specializing in AI and machine learning within the next 2 years.',
//       registrationDate: new Date('2024-01-15').toISOString(),
//       lastLoginDate: new Date().toISOString(),
//       isActive: true,
//       roles: ['User'],
//       isMentor: false,
//       emailConfirmed: true
//     }
//   ];
//   saveMockUsers(defaultUsers);
//   return defaultUsers;
// }

// function saveMockUsers(users: any[]): void {
//   MOCK_STORAGE.setItem(MOCK_USERS_KEY, JSON.stringify(users));
// }

// let mockUsers = getMockUsers();

// // Mock categories database
// function getMockCategories(): any[] {
//   const stored = MOCK_STORAGE.getItem(MOCK_CATEGORIES_KEY);
//   if (stored) {
//     return JSON.parse(stored);
//   }
//   // Default categories if no stored categories
//   const defaultCategories = [
//     // Career Interests
//     { id: '1', name: 'Software Development', description: 'Building software applications', type: 'CareerInterest', isActive: true, displayOrder: 1, icon: '💻', createdAt: new Date().toISOString() },
//     { id: '2', name: 'Data Science', description: 'Analyzing and interpreting complex data', type: 'CareerInterest', isActive: true, displayOrder: 2, icon: '📊', createdAt: new Date().toISOString() },
//     { id: '3', name: 'Machine Learning', description: 'Building intelligent systems', type: 'CareerInterest', isActive: true, displayOrder: 3, icon: '🤖', createdAt: new Date().toISOString() },
//     { id: '4', name: 'Artificial Intelligence', description: 'Creating AI solutions', type: 'CareerInterest', isActive: true, displayOrder: 4, icon: '🧠', createdAt: new Date().toISOString() },
//     { id: '5', name: 'Cloud Computing', description: 'Cloud infrastructure and services', type: 'CareerInterest', isActive: true, displayOrder: 5, icon: '☁️', createdAt: new Date().toISOString() },
//     { id: '6', name: 'DevOps', description: 'Development and operations integration', type: 'CareerInterest', isActive: true, displayOrder: 6, icon: '🔧', createdAt: new Date().toISOString() },
//     { id: '7', name: 'Cybersecurity', description: 'Protecting systems and data', type: 'CareerInterest', isActive: true, displayOrder: 7, icon: '🔒', createdAt: new Date().toISOString() },
//     { id: '8', name: 'Mobile Development', description: 'iOS and Android app development', type: 'CareerInterest', isActive: true, displayOrder: 8, icon: '📱', createdAt: new Date().toISOString() },
//     { id: '9', name: 'Web Development', description: 'Building web applications', type: 'CareerInterest', isActive: true, displayOrder: 9, icon: '🌐', createdAt: new Date().toISOString() },
//     { id: '10', name: 'Database Administration', description: 'Managing databases', type: 'CareerInterest', isActive: true, displayOrder: 10, icon: '🗄️', createdAt: new Date().toISOString() },
//     { id: '11', name: 'UI/UX Design', description: 'User interface and experience design', type: 'CareerInterest', isActive: true, displayOrder: 11, icon: '🎨', createdAt: new Date().toISOString() },
//     { id: '12', name: 'Project Management', description: 'Managing projects and teams', type: 'CareerInterest', isActive: true, displayOrder: 12, icon: '📋', createdAt: new Date().toISOString() },
//     { id: '13', name: 'Business Analysis', description: 'Analyzing business requirements', type: 'CareerInterest', isActive: true, displayOrder: 13, icon: '📈', createdAt: new Date().toISOString() },
//     { id: '14', name: 'Quality Assurance', description: 'Testing and quality control', type: 'CareerInterest', isActive: true, displayOrder: 14, icon: '✅', createdAt: new Date().toISOString() },
//     { id: '15', name: 'Network Engineering', description: 'Network infrastructure', type: 'CareerInterest', isActive: true, displayOrder: 15, icon: '🌐', createdAt: new Date().toISOString() },
//     { id: '16', name: 'Blockchain', description: 'Blockchain and cryptocurrency', type: 'CareerInterest', isActive: true, displayOrder: 16, icon: '⛓️', createdAt: new Date().toISOString() },
//     { id: '17', name: 'Game Development', description: 'Creating video games', type: 'CareerInterest', isActive: true, displayOrder: 17, icon: '🎮', createdAt: new Date().toISOString() },
//     { id: '18', name: 'IoT', description: 'Internet of Things', type: 'CareerInterest', isActive: true, displayOrder: 18, icon: '📡', createdAt: new Date().toISOString() },
//     { id: '19', name: 'Embedded Systems', description: 'Embedded hardware/software', type: 'CareerInterest', isActive: true, displayOrder: 19, icon: '🔌', createdAt: new Date().toISOString() },
//     { id: '20', name: 'Other', description: 'Other career interests', type: 'CareerInterest', isActive: true, displayOrder: 20, icon: '➕', createdAt: new Date().toISOString() },

//     // Mentor Specializations (examples)
//     { id: '21', name: 'Backend Development', description: 'Server-side development', type: 'MentorSpecialization', isActive: true, displayOrder: 1, icon: '⚙️', createdAt: new Date().toISOString() },
//     { id: '22', name: 'Frontend Development', description: 'Client-side development', type: 'MentorSpecialization', isActive: true, displayOrder: 2, icon: '🖥️', createdAt: new Date().toISOString() },
//     { id: '23', name: 'Full Stack Development', description: 'End-to-end development', type: 'MentorSpecialization', isActive: true, displayOrder: 3, icon: '🔗', createdAt: new Date().toISOString() }
//   ];
//   saveMockCategories(defaultCategories);
//   return defaultCategories;
// }

// function saveMockCategories(categories: any[]): void {
//   MOCK_STORAGE.setItem(MOCK_CATEGORIES_KEY, JSON.stringify(categories));
// }

// let mockCategories = getMockCategories();

// // Store tokens in localStorage for persistence across page refreshes
// const MOCK_TOKENS_KEY = 'mockTokens';

// function getMockTokens(): Map<string, { userId: string; email: string; expiration: number }> {
//   const stored = MOCK_STORAGE.getItem(MOCK_TOKENS_KEY);
//   if (stored) {
//     try {
//       const tokensArray = JSON.parse(stored);
//       return new Map(tokensArray);
//     } catch (e) {
//       return new Map();
//     }
//   }
//   return new Map();
// }

// function saveMockTokens(tokens: Map<string, { userId: string; email: string; expiration: number }>): void {
//   const tokensArray = Array.from(tokens.entries());
//   MOCK_STORAGE.setItem(MOCK_TOKENS_KEY, JSON.stringify(tokensArray));
// }

// const mockTokens = getMockTokens();

// let initialized = false;

// export const mockHttpInterceptor: HttpInterceptorFn = (req, next) => {
//   if (!initialized) {
//     console.log('[MOCK HTTP INTERCEPTOR] Initialized - Ready to mock auth, user, and category endpoints');
//     console.log('[MOCK HTTP INTERCEPTOR] Test credentials: test@example.com / Test1234!');
//     console.log('[MOCK HTTP INTERCEPTOR] Available mock endpoints: /auth/*, /api/users/*, /api/categories');
//     initialized = true;
//   }

//   // Mock auth, user, and category endpoints
//   const shouldMock = req.url.includes('/auth/') || req.url.includes('/api/users') || req.url.includes('/api/categories');

//   if (!shouldMock) {
//     return next(req);
//   }

//   console.log('[MOCK] Intercepting:', req.method, req.url);

//   // Route to appropriate mock handler
//   if (req.url.includes('/login') && req.method === 'POST') {
//     return mockLogin(req);
//   }
//   if (req.url.includes('/register') && req.method === 'POST') {
//     return mockRegister(req);
//   }
//   if (req.url.includes('/forgot-password') && req.method === 'POST') {
//     return mockForgotPassword(req);
//   }
//   if (req.url.includes('/reset-password') && req.method === 'POST') {
//     return mockResetPassword(req);
//   }
//   if (req.url.includes('/verify-email') && req.method === 'POST') {
//     return mockVerifyEmail(req);
//   }
//   if (req.url.includes('/resend-verification') && req.method === 'POST') {
//     return mockResendVerificationEmail(req);
//   }
//   if (req.url.includes('/refresh') && req.method === 'POST') {
//     return mockRefreshToken(req);
//   }

//   // User profile endpoints - matches /api/users/{userId}
//   if (req.url.match(/\/api\/users\/[^/]+$/) && req.method === 'GET') {
//     return mockGetUserProfile(req);
//   }
//   if (req.url.match(/\/api\/users\/[^/]+$/) && req.method === 'PUT') {
//     return mockUpdateUserProfile(req);
//   }

//   // Category endpoints
//   if (req.url.includes('/api/categories') && req.method === 'GET') {
//     return mockGetCategories(req);
//   }
//   if (req.url.match(/\/api\/categories\/[^/]+$/) && req.method === 'GET') {
//     return mockGetCategoryById(req);
//   }
//   if (req.url.includes('/api/categories') && req.method === 'POST') {
//     return mockCreateCategory(req);
//   }
//   if (req.url.match(/\/api\/categories\/[^/]+$/) && req.method === 'PUT') {
//     return mockUpdateCategory(req);
//   }
//   if (req.url.match(/\/api\/categories\/[^/]+$/) && req.method === 'DELETE') {
//     return mockDeleteCategory(req);
//   }

//   // Default: pass through
//   return next(req);
// };

// // ===================== MOCK ENDPOINTS =====================

// function mockLogin(req: any): Observable<any> {
//   const { email, password } = req.body;

//   console.log('[MOCK LOGIN] Request:', { email });

//   if (!email || !password) {
//     console.log('[MOCK LOGIN] Validation failed - missing fields');
//     return throwHttpError(400, 'Email and password are required', {
//       email: email ? [] : ['Email is required'],
//       password: password ? [] : ['Password is required']
//     });
//   }

//   const user = mockUsers.find(u => u.email === email);
//   if (!user || user.password !== password) {
//     console.log('[MOCK LOGIN] Invalid credentials for email:', email);
//     return throwHttpError(401, 'Invalid email or password', null);
//   }

//   const mockToken = generateMockJWT(user);
//   const mockRefreshToken = 'refresh_token_' + Math.random().toString(36).substring(7);

//   console.log('[MOCK LOGIN] Generated token:', mockToken.substring(0, 50) + '...');

//   // Reload tokens from localStorage to get latest data, then add new token
//   const currentTokens = getMockTokens();

//   // Remove any existing tokens for this user (prevent duplicate sessions)
//   for (const [token, data] of currentTokens.entries()) {
//     if (data.userId === user.id) {
//       currentTokens.delete(token);
//       console.log('[MOCK LOGIN] Removed old token for user:', user.id);
//     }
//   }

//   // Add new token
//   currentTokens.set(mockToken, {
//     userId: user.id,
//     email: user.email,
//     expiration: Date.now() + 3600000
//   });
//   saveMockTokens(currentTokens); // Persist tokens

//   console.log('[MOCK LOGIN] Saved token to mockTokens map');
//   console.log('[MOCK LOGIN] Total tokens in map:', currentTokens.size);
//   console.log('[MOCK LOGIN] Saved to localStorage:', MOCK_TOKENS_KEY);

//   const response = {
//     success: true,
//     message: 'Login successful',
//     token: mockToken,
//     refreshToken: mockRefreshToken,
//     user: {
//       id: user.id,
//       email: user.email,
//       firstName: user.firstName,
//       lastName: user.lastName,
//       emailConfirmed: user.emailConfirmed,
//       roles: user.roles,
//       isMentor: user.isMentor
//     }
//   };

//   console.log('[MOCK LOGIN] Success for:', email);
//   return of(new HttpResponse({
//     status: 200,
//     body: response
//   })).pipe(delay(500));
// }

// function mockRegister(req: any): Observable<any> {
//   const { email, password, confirmPassword, firstName, lastName, userType, registerAsMentor } = req.body;

//   // Support both naming conventions
//   const isMentor = registerAsMentor !== undefined ? registerAsMentor : (userType === 'mentor');
//   const firstName_val = firstName && firstName.trim() ? firstName : 'User';
//   const lastName_val = lastName && lastName.trim() ? lastName : 'Account';

//   console.log('[MOCK REGISTER] Request:', { email, isMentor });

//   // Validate required fields - firstName/lastName can be empty, they'll use defaults
//   if (!email || !password || !confirmPassword) {
//     console.log('[MOCK REGISTER] Validation failed - missing required fields');
//     return throwHttpError(400, 'Email and password are required', {
//       email: email ? [] : ['Email is required'],
//       password: password ? [] : ['Password is required'],
//       confirmPassword: confirmPassword ? [] : ['Confirm password is required']
//     });
//   }

//   if (!isValidEmail(email)) {
//     return throwHttpError(400, 'Invalid email format', {
//       email: ['Please enter a valid email address']
//     });
//   }

//   if (password.length < 8) {
//     return throwHttpError(400, 'Password must be at least 8 characters', {
//       password: ['Password must be at least 8 characters']
//     });
//   }

//   if (password !== confirmPassword) {
//     return throwHttpError(400, 'Passwords do not match', {
//       confirmPassword: ['Passwords do not match']
//     });
//   }

//   if (mockUsers.some(u => u.email === email)) {
//     console.log('[MOCK REGISTER] Email already exists:', email);
//     return throwHttpError(400, 'Email already registered', {
//       email: ['Email already in use']
//     });
//   }

//   const newUser = {
//     id: Math.random().toString(36).substring(7),
//     email,
//     password,
//     firstName: firstName_val,
//     lastName: lastName_val,
//     roles: [isMentor ? 'Mentor' : 'User'],
//     isMentor: isMentor,
//     emailConfirmed: false
//   };

//   mockUsers.push(newUser);
//   saveMockUsers(mockUsers); // Persist to sessionStorage

//   const verificationToken = 'verify_' + Math.random().toString(36).substring(7);
//   localStorage.setItem(`verify_${newUser.id}`, verificationToken);

//   const response = {
//     success: true,
//     message: 'Registration successful',
//     requiresEmailVerification: true,
//     userId: newUser.id,
//     email: newUser.email
//   };

//   console.log('[MOCK REGISTER] Success for:', email);
//   console.log('[MOCK REGISTER] User ID:', newUser.id);
//   console.log('[MOCK REGISTER] Verification link: /auth/verify-email?userId=' + newUser.id + '&token=' + verificationToken);

//   return of(new HttpResponse({
//     status: 200,
//     body: response
//   })).pipe(delay(1000));
// }

// function mockForgotPassword(req: any): Observable<any> {
//   const { email } = req.body;

//   console.log('[MOCK FORGOT PASSWORD] Request:', { email });

//   if (!email) {
//     return throwHttpError(400, 'Email is required', {
//       email: ['Email is required']
//     });
//   }

//   if (!isValidEmail(email)) {
//     return throwHttpError(400, 'Invalid email format', {
//       email: ['Please enter a valid email address']
//     });
//   }

//   const resetToken = 'reset_token_' + Math.random().toString(36).substring(7);
//   localStorage.setItem(`reset_${email}`, resetToken);

//   const resetLink = `/auth/reset-password?email=${encodeURIComponent(email)}&token=${resetToken}`;
//   console.log('[MOCK FORGOT PASSWORD] Reset link generated:');
//   console.log('[MOCK FORGOT PASSWORD] ' + window.location.origin + resetLink);

//   const response = {
//     success: true,
//     message: 'If an account with that email exists, a password reset link has been sent.'
//   };

//   return of(new HttpResponse({
//     status: 200,
//     body: response
//   })).pipe(delay(800));
// }

// function mockResetPassword(req: any): Observable<any> {
//   const { email, token, newPassword, confirmPassword } = req.body;

//   console.log('[MOCK RESET PASSWORD] Request:', { email, token });

//   if (!email || !token || !newPassword || !confirmPassword) {
//     console.log('[MOCK RESET PASSWORD] Missing required fields');
//     return throwHttpError(400, 'All fields are required', null);
//   }

//   if (newPassword.length < 8) {
//     return throwHttpError(400, 'Password must be at least 8 characters', {
//       newPassword: ['Password must be at least 8 characters']
//     });
//   }

//   const storedToken = localStorage.getItem(`reset_${email}`);
//   console.log('[MOCK RESET PASSWORD] Stored token:', storedToken);
//   console.log('[MOCK RESET PASSWORD] Received token:', token);

//   if (!storedToken) {
//     console.log('[MOCK RESET PASSWORD] No stored token found for email:', email);
//     console.log('[MOCK RESET PASSWORD] Available reset tokens:',
//       Object.keys(localStorage).filter(k => k.startsWith('reset_')));
//     return throwHttpError(400, 'Invalid or expired password reset link.', null);
//   }

//   if (storedToken !== token) {
//     console.log('[MOCK RESET PASSWORD] Token mismatch for email:', email);
//     return throwHttpError(400, 'Invalid or expired password reset link.', null);
//   }

//   if (newPassword !== confirmPassword) {
//     return throwHttpError(400, 'Passwords do not match', {
//       confirmPassword: ['Passwords do not match']
//     });
//   }

//   // Reload users from storage to ensure we have the latest data
//   mockUsers = getMockUsers();

//   const user = mockUsers.find(u => u.email === email);
//   if (!user) {
//     console.log('[MOCK RESET PASSWORD] User not found with email:', email);
//     console.log('[MOCK RESET PASSWORD] Available users:', mockUsers.map(u => ({ id: u.id, email: u.email })));
//     return throwHttpError(400, 'User not found', null);
//   }

//   const oldPassword = user.password;
//   user.password = newPassword;
//   saveMockUsers(mockUsers); // Persist updated user
//   localStorage.removeItem(`reset_${email}`);

//   const response = {
//     success: true,
//     message: 'Your password has been reset successfully.'
//   };

//   console.log('[MOCK RESET PASSWORD] Success for:', email);
//   console.log('[MOCK RESET PASSWORD] New password: ' + newPassword);

//   return of(new HttpResponse({
//     status: 200,
//     body: response
//   })).pipe(delay(800));
// }

// function mockVerifyEmail(req: any): Observable<any> {
//   const { userId, token } = req.body;

//   console.log('[MOCK VERIFY EMAIL] Request:', { userId, token });

//   if (!userId || !token) {
//     console.log('[MOCK VERIFY EMAIL] Missing userId or token');
//     return throwHttpError(400, 'Invalid verification request', null);
//   }

//   const storedToken = localStorage.getItem(`verify_${userId}`);
//   console.log('[MOCK VERIFY EMAIL] Stored token:', storedToken);
//   console.log('[MOCK VERIFY EMAIL] Received token:', token);

//   if (!storedToken) {
//     console.log('[MOCK VERIFY EMAIL] No stored token found for userId:', userId);
//     console.log('[MOCK VERIFY EMAIL] Available keys:', Object.keys(localStorage));
//     return throwHttpError(400, 'Invalid or expired verification link', null);
//   }

//   if (storedToken !== token) {
//     console.log('[MOCK VERIFY EMAIL] Token mismatch for userId:', userId);
//     return throwHttpError(400, 'Invalid or expired verification link', null);
//   }

//   // Reload users from storage to ensure we have the latest data
//   mockUsers = getMockUsers();

//   const user = mockUsers.find(u => u.id === userId);
//   if (!user) {
//     console.log('[MOCK VERIFY EMAIL] User not found with id:', userId);
//     console.log('[MOCK VERIFY EMAIL] Available users:', mockUsers.map(u => ({ id: u.id, email: u.email })));
//     return throwHttpError(400, 'User not found', null);
//   }

//   user.emailConfirmed = true;
//   saveMockUsers(mockUsers); // Persist updated user
//   localStorage.removeItem(`verify_${userId}`);

//   const loginToken = generateMockJWT(user);
//   const refreshToken = 'refresh_token_' + Math.random().toString(36).substring(7);

//   // Store token for auto-login - reload tokens to get latest data
//   const currentTokens = getMockTokens();

//   // Remove any existing tokens for this user (prevent duplicate sessions)
//   for (const [token, data] of currentTokens.entries()) {
//     if (data.userId === user.id) {
//       currentTokens.delete(token);
//     }
//   }

//   currentTokens.set(loginToken, {
//     userId: user.id,
//     email: user.email,
//     expiration: Date.now() + 3600000
//   });
//   saveMockTokens(currentTokens);

//   const response = {
//     success: true,
//     message: 'Email verified successfully',
//     autoLogin: true,
//     loginToken: loginToken,
//     refreshToken: refreshToken,
//     user: {
//       id: user.id,
//       email: user.email,
//       firstName: user.firstName,
//       lastName: user.lastName,
//       emailConfirmed: true,
//       roles: user.roles,
//       isMentor: user.isMentor
//     }
//   };

//   console.log('[MOCK VERIFY EMAIL] Success for userId:', userId);

//   return of(new HttpResponse({
//     status: 200,
//     body: response
//   })).pipe(delay(800));
// }

// function mockResendVerificationEmail(req: any): Observable<any> {
//   const { email } = req.body;

//   console.log('[MOCK RESEND VERIFICATION] Request:', { email });

//   if (!email) {
//     return throwHttpError(400, 'Email is required', null);
//   }

//   const verificationToken = 'verify_' + Math.random().toString(36).substring(7);
//   const user = mockUsers.find(u => u.email === email);

//   if (user) {
//     localStorage.setItem(`verify_${user.id}`, verificationToken);
//     const verifyLink = `/auth/verify-email?userId=${user.id}&token=${verificationToken}`;
//     console.log('[MOCK RESEND VERIFICATION] Verification link: ' + window.location.origin + verifyLink);
//   }

//   const response = {
//     success: true,
//     message: 'Verification email has been sent. Please check your inbox.'
//   };

//   return of(new HttpResponse({
//     status: 200,
//     body: response
//   })).pipe(delay(600));
// }

// function mockRefreshToken(req: any): Observable<any> {
//   const { token } = req.body;

//   console.log('[MOCK REFRESH TOKEN] Request received');

//   if (!token) {
//     return throwHttpError(401, 'Invalid token', null);
//   }

//   // Reload tokens from localStorage to get latest data
//   const currentTokens = getMockTokens();
//   const tokenData = currentTokens.get(token);
//   if (!tokenData) {
//     return throwHttpError(401, 'Token not found', null);
//   }

//   const user = mockUsers.find(u => u.id === tokenData.userId);
//   if (!user) {
//     return throwHttpError(401, 'User not found', null);
//   }

//   const newToken = generateMockJWT(user);
//   const newRefreshToken = 'refresh_token_' + Math.random().toString(36).substring(7);

//   // Store new token (use currentTokens to ensure we're saving to the latest Map)
//   currentTokens.set(newToken, {
//     userId: user.id,
//     email: user.email,
//     expiration: Date.now() + 3600000
//   });
//   saveMockTokens(currentTokens);

//   const response = {
//     success: true,
//     token: newToken,
//     refreshToken: newRefreshToken
//   };

//   console.log('[MOCK REFRESH TOKEN] Success');

//   return of(new HttpResponse({
//     status: 200,
//     body: response
//   })).pipe(delay(300));
// }

// // ===================== USER PROFILE ENDPOINTS =====================

// function mockGetUserProfile(req: any): Observable<any> {
//   const urlParts = req.url.split('/');
//   const userId = urlParts[urlParts.length - 1];

//   console.log('[MOCK GET USER PROFILE] Request for userId:', userId);
//   console.log('[MOCK GET USER PROFILE] Request URL:', req.url);

//   // Extract token from Authorization header
//   const authHeader = req.headers.get('Authorization');
//   console.log('[MOCK GET USER PROFILE] Authorization header:', authHeader);

//   if (!authHeader || !authHeader.startsWith('Bearer ')) {
//     console.log('[MOCK GET USER PROFILE] No valid authorization header');
//     return throwHttpError(401, 'Unauthorized', null);
//   }

//   const token = authHeader.substring(7);
//   console.log('[MOCK GET USER PROFILE] Token extracted:', token.substring(0, 50) + '...');

//   // Reload tokens from localStorage to get latest data (IMPORTANT: prevents stale token issues)
//   const currentTokens = getMockTokens();
//   console.log('[MOCK GET USER PROFILE] Available tokens in map:', currentTokens.size);
//   console.log('[MOCK GET USER PROFILE] Token keys:', Array.from(currentTokens.keys()).map(k => k.substring(0, 50) + '...'));

//   const tokenData = currentTokens.get(token);
//   console.log('[MOCK GET USER PROFILE] Token data found:', tokenData);

//   if (!tokenData) {
//     console.log('[MOCK GET USER PROFILE] Invalid token - not found in mockTokens map');
//     console.log('[MOCK GET USER PROFILE] Checking localStorage for mockTokens...');
//     const storedTokens = localStorage.getItem(MOCK_TOKENS_KEY);
//     console.log('[MOCK GET USER PROFILE] Stored tokens:', storedTokens ? 'exists' : 'not found');
//     return throwHttpError(401, 'Invalid or expired token', null);
//   }

//   // Reload users to get latest data
//   mockUsers = getMockUsers();

//   const user = mockUsers.find(u => u.id === userId);
//   if (!user) {
//     console.log('[MOCK GET USER PROFILE] User not found:', userId);
//     return throwHttpError(404, 'User not found', null);
//   }

//   // Check if requesting user matches the profile (users can only view their own profile)
//   if (tokenData.userId !== userId) {
//     console.log('[MOCK GET USER PROFILE] Unauthorized access attempt');
//     return throwHttpError(403, 'You can only view your own profile', null);
//   }

//   // Return complete user profile (excluding password)
//   const { password, ...userProfile } = user;

//   const response = {
//     success: true,
//     data: userProfile
//   };

//   console.log('[MOCK GET USER PROFILE] Success for userId:', userId);

//   return of(new HttpResponse({
//     status: 200,
//     body: response
//   })).pipe(delay(400));
// }

// function mockUpdateUserProfile(req: any): Observable<any> {
//   const urlParts = req.url.split('/');
//   const userId = urlParts[urlParts.length - 1];
//   const updateData = req.body;

//   console.log('[MOCK UPDATE USER PROFILE] Request for userId:', userId);
//   console.log('[MOCK UPDATE USER PROFILE] Update data:', updateData);

//   // Extract token from Authorization header
//   const authHeader = req.headers.get('Authorization');
//   if (!authHeader || !authHeader.startsWith('Bearer ')) {
//     console.log('[MOCK UPDATE USER PROFILE] No valid authorization header');
//     return throwHttpError(401, 'Unauthorized', null);
//   }

//   const token = authHeader.substring(7);

//   // Reload tokens from localStorage to get latest data
//   const currentTokens = getMockTokens();
//   const tokenData = currentTokens.get(token);

//   if (!tokenData) {
//     console.log('[MOCK UPDATE USER PROFILE] Invalid token');
//     return throwHttpError(401, 'Invalid or expired token', null);
//   }

//   // Reload users to get latest data
//   mockUsers = getMockUsers();

//   const userIndex = mockUsers.findIndex(u => u.id === userId);
//   if (userIndex === -1) {
//     console.log('[MOCK UPDATE USER PROFILE] User not found:', userId);
//     return throwHttpError(404, 'User not found', null);
//   }

//   // Check if requesting user matches the profile
//   if (tokenData.userId !== userId) {
//     console.log('[MOCK UPDATE USER PROFILE] Unauthorized access attempt');
//     return throwHttpError(403, 'You can only update your own profile', null);
//   }

//   // Validate required fields
//   if (!updateData.firstName || updateData.firstName.trim().length < 2) {
//     return throwHttpError(400, 'Validation failed', {
//       firstName: ['First name must be at least 2 characters']
//     });
//   }

//   if (!updateData.lastName || updateData.lastName.trim().length < 2) {
//     return throwHttpError(400, 'Validation failed', {
//       lastName: ['Last name must be at least 2 characters']
//     });
//   }

//   // Update user profile
//   const updatedUser = {
//     ...mockUsers[userIndex],
//     firstName: updateData.firstName,
//     lastName: updateData.lastName,
//     phoneNumber: updateData.phoneNumber || mockUsers[userIndex].phoneNumber,
//     profilePictureUrl: updateData.profilePictureUrl || mockUsers[userIndex].profilePictureUrl,
//     careerInterests: updateData.careerInterests || mockUsers[userIndex].careerInterests,
//     careerGoals: updateData.careerGoals || mockUsers[userIndex].careerGoals
//   };

//   mockUsers[userIndex] = updatedUser;
//   saveMockUsers(mockUsers);

//   // Return updated profile (excluding password)
//   const { password, ...userProfile } = updatedUser;

//   const response = {
//     success: true,
//     message: 'Profile updated successfully',
//     data: userProfile
//   };

//   console.log('[MOCK UPDATE USER PROFILE] Success for userId:', userId);

//   return of(new HttpResponse({
//     status: 200,
//     body: response
//   })).pipe(delay(600));
// }

// // ===================== UTILITIES =====================

// function generateMockJWT(user: any): string {
//   const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
//   const expiration = Math.floor(Date.now() / 1000) + 3600;

//   const payload = btoa(JSON.stringify({
//     sub: user.id,
//     email: user.email,
//     given_name: user.firstName,
//     family_name: user.lastName,
//     email_verified: user.emailConfirmed,
//     roles: user.roles,
//     is_mentor: user.isMentor,
//     exp: expiration,
//     iat: Math.floor(Date.now() / 1000)
//   }));

//   const signature = btoa('mock_signature');
//   return `${header}.${payload}.${signature}`;
// }

// function isValidEmail(email: string): boolean {
//   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//   return emailRegex.test(email);
// }

// function throwHttpError(status: number, message: string, errors: any): Observable<never> {
//   const errorResponse = {
//     success: false,
//     message,
//     errors
//   };

//   console.log('[MOCK] HTTP Error:', status, message);

//   return throwError(() => ({
//     status,
//     statusText: message,
//     error: errorResponse,
//     message: errorResponse.message
//   })).pipe(delay(300));
// }

// // ===================== CATEGORY ENDPOINTS =====================

// function mockGetCategories(req: any): Observable<any> {
//   console.log('[MOCK GET CATEGORIES] Request received');
//   console.log('[MOCK GET CATEGORIES] URL:', req.url);

//   // Parse query parameters for filtering by type
//   const url = new URL(req.url, 'http://localhost');
//   const typeParam = url.searchParams.get('type');

//   // Reload categories to get latest data
//   mockCategories = getMockCategories();

//   let filteredCategories = mockCategories;

//   // Filter by type if provided
//   if (typeParam) {
//     filteredCategories = mockCategories.filter(cat => cat.type === typeParam);
//     console.log('[MOCK GET CATEGORIES] Filtering by type:', typeParam);
//   }

//   // Filter only active categories
//   filteredCategories = filteredCategories.filter(cat => cat.isActive);

//   // Sort by displayOrder and name
//   filteredCategories.sort((a, b) => {
//     if (a.displayOrder !== b.displayOrder) {
//       return a.displayOrder - b.displayOrder;
//     }
//     return a.name.localeCompare(b.name);
//   });

//   const response = {
//     success: true,
//     message: 'Categories retrieved successfully',
//     data: filteredCategories,
//     totalCount: filteredCategories.length
//   };

//   console.log('[MOCK GET CATEGORIES] Returning', filteredCategories.length, 'categories');

//   return of(new HttpResponse({
//     status: 200,
//     body: response
//   })).pipe(delay(300));
// }

// function mockGetCategoryById(req: any): Observable<any> {
//   const urlParts = req.url.split('/');
//   const categoryId = urlParts[urlParts.length - 1];

//   console.log('[MOCK GET CATEGORY BY ID] Request for categoryId:', categoryId);

//   // Reload categories to get latest data
//   mockCategories = getMockCategories();

//   const category = mockCategories.find(c => c.id === categoryId);
//   if (!category) {
//     console.log('[MOCK GET CATEGORY BY ID] Category not found:', categoryId);
//     return throwHttpError(404, 'Category not found', null);
//   }

//   const response = {
//     success: true,
//     data: category
//   };

//   console.log('[MOCK GET CATEGORY BY ID] Success for categoryId:', categoryId);

//   return of(new HttpResponse({
//     status: 200,
//     body: response
//   })).pipe(delay(200));
// }

// function mockCreateCategory(req: any): Observable<any> {
//   const categoryData = req.body;

//   console.log('[MOCK CREATE CATEGORY] Request:', categoryData);

//   // Check authorization (admin only)
//   const authHeader = req.headers.get('Authorization');
//   if (!authHeader || !authHeader.startsWith('Bearer ')) {
//     console.log('[MOCK CREATE CATEGORY] No valid authorization header');
//     return throwHttpError(401, 'Unauthorized', null);
//   }

//   const token = authHeader.substring(7);

//   // Reload tokens from localStorage to get latest data
//   const currentTokens = getMockTokens();
//   const tokenData = currentTokens.get(token);

//   if (!tokenData) {
//     console.log('[MOCK CREATE CATEGORY] Invalid token');
//     return throwHttpError(401, 'Invalid or expired token', null);
//   }

//   // Validate required fields
//   if (!categoryData.name || !categoryData.type) {
//     return throwHttpError(400, 'Validation failed', {
//       name: categoryData.name ? [] : ['Name is required'],
//       type: categoryData.type ? [] : ['Type is required']
//     });
//   }

//   // Check if category name already exists
//   if (mockCategories.some(c => c.name.toLowerCase() === categoryData.name.toLowerCase() && c.type === categoryData.type)) {
//     return throwHttpError(400, 'Category with this name already exists for this type', {
//       name: ['Category name already exists']
//     });
//   }

//   // Create new category
//   const newCategory = {
//     id: (mockCategories.length + 1).toString(),
//     name: categoryData.name,
//     description: categoryData.description || '',
//     type: categoryData.type,
//     icon: categoryData.icon || '',
//     displayOrder: categoryData.displayOrder || mockCategories.length + 1,
//     isActive: true,
//     createdAt: new Date().toISOString(),
//     updatedAt: new Date().toISOString()
//   };

//   mockCategories.push(newCategory);
//   saveMockCategories(mockCategories);

//   const response = {
//     success: true,
//     message: 'Category created successfully',
//     data: newCategory
//   };

//   console.log('[MOCK CREATE CATEGORY] Success, created category:', newCategory.id);

//   return of(new HttpResponse({
//     status: 201,
//     body: response
//   })).pipe(delay(400));
// }

// function mockUpdateCategory(req: any): Observable<any> {
//   const urlParts = req.url.split('/');
//   const categoryId = urlParts[urlParts.length - 1];
//   const updateData = req.body;

//   console.log('[MOCK UPDATE CATEGORY] Request for categoryId:', categoryId);
//   console.log('[MOCK UPDATE CATEGORY] Update data:', updateData);

//   // Check authorization (admin only)
//   const authHeader = req.headers.get('Authorization');
//   if (!authHeader || !authHeader.startsWith('Bearer ')) {
//     console.log('[MOCK UPDATE CATEGORY] No valid authorization header');
//     return throwHttpError(401, 'Unauthorized', null);
//   }

//   const token = authHeader.substring(7);

//   // Reload tokens from localStorage to get latest data
//   const currentTokens = getMockTokens();
//   const tokenData = currentTokens.get(token);

//   if (!tokenData) {
//     console.log('[MOCK UPDATE CATEGORY] Invalid token');
//     return throwHttpError(401, 'Invalid or expired token', null);
//   }

//   // Reload categories to get latest data
//   mockCategories = getMockCategories();

//   const categoryIndex = mockCategories.findIndex(c => c.id === categoryId);
//   if (categoryIndex === -1) {
//     console.log('[MOCK UPDATE CATEGORY] Category not found:', categoryId);
//     return throwHttpError(404, 'Category not found', null);
//   }

//   // Update category
//   const updatedCategory = {
//     ...mockCategories[categoryIndex],
//     name: updateData.name !== undefined ? updateData.name : mockCategories[categoryIndex].name,
//     description: updateData.description !== undefined ? updateData.description : mockCategories[categoryIndex].description,
//     icon: updateData.icon !== undefined ? updateData.icon : mockCategories[categoryIndex].icon,
//     displayOrder: updateData.displayOrder !== undefined ? updateData.displayOrder : mockCategories[categoryIndex].displayOrder,
//     isActive: updateData.isActive !== undefined ? updateData.isActive : mockCategories[categoryIndex].isActive,
//     updatedAt: new Date().toISOString()
//   };

//   mockCategories[categoryIndex] = updatedCategory;
//   saveMockCategories(mockCategories);

//   const response = {
//     success: true,
//     message: 'Category updated successfully',
//     data: updatedCategory
//   };

//   console.log('[MOCK UPDATE CATEGORY] Success for categoryId:', categoryId);

//   return of(new HttpResponse({
//     status: 200,
//     body: response
//   })).pipe(delay(400));
// }

// function mockDeleteCategory(req: any): Observable<any> {
//   const urlParts = req.url.split('/');
//   const categoryId = urlParts[urlParts.length - 1];

//   console.log('[MOCK DELETE CATEGORY] Request for categoryId:', categoryId);

//   // Check authorization (admin only)
//   const authHeader = req.headers.get('Authorization');
//   if (!authHeader || !authHeader.startsWith('Bearer ')) {
//     console.log('[MOCK DELETE CATEGORY] No valid authorization header');
//     return throwHttpError(401, 'Unauthorized', null);
//   }

//   const token = authHeader.substring(7);

//   // Reload tokens from localStorage to get latest data
//   const currentTokens = getMockTokens();
//   const tokenData = currentTokens.get(token);

//   if (!tokenData) {
//     console.log('[MOCK DELETE CATEGORY] Invalid token');
//     return throwHttpError(401, 'Invalid or expired token', null);
//   }

//   // Reload categories to get latest data
//   mockCategories = getMockCategories();

//   const categoryIndex = mockCategories.findIndex(c => c.id === categoryId);
//   if (categoryIndex === -1) {
//     console.log('[MOCK DELETE CATEGORY] Category not found:', categoryId);
//     return throwHttpError(404, 'Category not found', null);
//   }

//   // Remove category
//   mockCategories.splice(categoryIndex, 1);
//   saveMockCategories(mockCategories);

//   const response = {
//     success: true,
//     message: 'Category deleted successfully'
//   };

//   console.log('[MOCK DELETE CATEGORY] Success for categoryId:', categoryId);

//   return of(new HttpResponse({
//     status: 200,
//     body: response
//   })).pipe(delay(400));
// }
