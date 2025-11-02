# Mock HTTP Interceptor - Reference Guide

## Quick Command Reference

### Start the App
```bash
npm start
# Opens http://localhost:4200
```

### Open Browser Console
```
Windows/Linux: F12
macOS: Cmd + Option + I
```

---

## Test Credentials
```
Email:    test@example.com
Password: Test1234!
```

---

## Complete Testing Flow

### 1. LOGIN TEST (Fastest - 2 minutes)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Go to http://localhost:4200/auth/login | Login form appears |
| 2 | Enter email: test@example.com | Email field filled |
| 3 | Enter password: Test1234! | Password field filled (hidden) |
| 4 | Click "Sign in" button | Form disabled, spinner shows |
| 5 | Wait 0.5 seconds | Success message appears |
| 6 | Watch the redirect | Dashboard loads (if configured) |
| 7 | Check browser console | `[MOCK LOGIN] Success for: test@example.com` |

**Verify:** localStorage has `auth_token` and `refresh_token`

---

### 2. REGISTER TEST (5 minutes)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Go to http://localhost:4200/auth/register | Register form appears |
| 2 | Enter email: john@example.com | Email field filled |
| 3 | Enter first name: John | First name field filled |
| 4 | Enter last name: Doe | Last name field filled |
| 5 | Enter password: SecurePass123! | Password field filled |
| 6 | Enter confirm: SecurePass123! | Confirm field filled |
| 7 | Select user type: Client | Radio button selected |
| 8 | Click "Create account" | Form disabled, spinner shows |
| 9 | Wait 1 second | Success message appears |
| 10 | Check browser console | See verification link |
| 11 | Copy verification link | Link format: `/auth/verify-email?userId=...&token=...` |
| 12 | Paste in address bar | Navigate to verification link |
| 13 | Wait 0.8 seconds | Success message, countdown shows |
| 14 | Auto-redirect happens | Dashboard loads (auto-login) |

**Verify:** New user created in mock database

---

### 3. PASSWORD RESET TEST (5 minutes)

#### STEP 1: Request Reset

| Step | Action | Expected |
|------|--------|----------|
| 1 | Go to http://localhost:4200/auth/forgot-password | Forgot password form appears |
| 2 | Enter email: test@example.com | Email field filled |
| 3 | Click "Send reset link" | Form disabled, spinner shows |
| 4 | Wait 0.8 seconds | Success message appears |
| 5 | Check browser console | Reset link printed |
| 6 | Look for console message | `[MOCK FORGOT PASSWORD] Reset link generated:` |
| 7 | Copy the reset link | URL in console starts with `http://localhost:4200/auth/reset-password?email=...&token=...` |

#### STEP 2: Reset Password

| Step | Action | Expected |
|------|--------|----------|
| 1 | Paste reset link in browser | Reset password form appears with email shown |
| 2 | Verify email | Email field should show: test@example.com |
| 3 | Enter password: NewPassword123! | New password field filled |
| 4 | Enter confirm: NewPassword123! | Confirm field filled |
| 5 | Click "Reset password" | Form disabled, spinner shows |
| 6 | Wait 0.8 seconds | Success message appears |
| 7 | Wait 3 seconds | Countdown timer shows: 3, 2, 1 |
| 8 | Auto-redirect happens | Redirects to /auth/login |
| 9 | Check browser console | `[MOCK RESET PASSWORD] Success for: test@example.com` |

#### STEP 3: Verify New Password Works

| Step | Action | Expected |
|------|--------|----------|
| 1 | You're now on login page | Login form appears |
| 2 | Enter email: test@example.com | Email field filled |
| 3 | Enter password: NewPassword123! | Password field filled (NEW PASSWORD) |
| 4 | Click "Sign in" | Form disabled, spinner shows |
| 5 | Wait 0.5 seconds | Success message appears |
| 6 | Watch the redirect | Dashboard loads |

✅ **Password reset successful!**

---

### 4. EMAIL VERIFICATION TEST (5 minutes)

#### Auto-Verify via Registration

| Step | Action | Expected |
|------|--------|----------|
| 1 | Complete Register Test (steps 1-10) | Verification link in console |
| 2 | Copy verification link | Format: `/auth/verify-email?userId=...&token=...` |
| 3 | Paste in address bar | Navigate to verification link |
| 4 | Form loads | Shows "Verifying..." spinner |
| 5 | Wait 0.8 seconds | Success message appears |
| 6 | Wait for countdown | Countdown shows: 3, 2, 1, 0 |
| 7 | Auto-redirect happens | Redirects to dashboard (auto-login) |

✅ **Email verification successful!**

---

## Console Output Reference

### Initialize
```
[MOCK HTTP INTERCEPTOR] Initialized - Ready to mock auth endpoints
[MOCK HTTP INTERCEPTOR] Test credentials: test@example.com / Test1234!
```

### Login Success
```
[MOCK] Intercepting: POST http://localhost:4200/api/auth/login
[MOCK LOGIN] Request: { email: 'test@example.com' }
[MOCK LOGIN] Success for: test@example.com
[MOCK LOGIN] Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Login Failure (Wrong Password)
```
[MOCK] Intercepting: POST http://localhost:4200/api/auth/login
[MOCK LOGIN] Request: { email: 'test@example.com' }
[MOCK LOGIN] Invalid credentials for email: test@example.com
[MOCK] HTTP Error: 401 Invalid email or password
```

### Register Success
```
[MOCK] Intercepting: POST http://localhost:4200/api/auth/register
[MOCK REGISTER] Request: { email: 'john@example.com', userType: 'client' }
[MOCK REGISTER] Success for: john@example.com
[MOCK REGISTER] User ID: abc123xyz
[MOCK REGISTER] Verification link: /auth/verify-email?userId=abc123xyz&token=verify_xyz789
```

### Register Duplicate Email
```
[MOCK] Intercepting: POST http://localhost:4200/api/auth/register
[MOCK REGISTER] Request: { email: 'test@example.com', userType: 'client' }
[MOCK REGISTER] Email already exists: test@example.com
[MOCK] HTTP Error: 400 Email already registered
```

### Forgot Password
```
[MOCK] Intercepting: POST http://localhost:4200/api/auth/forgot-password
[MOCK FORGOT PASSWORD] Request: { email: 'test@example.com' }
[MOCK FORGOT PASSWORD] Reset link generated:
[MOCK FORGOT PASSWORD] http://localhost:4200/auth/reset-password?email=test@example.com&token=reset_token_abc123xyz
[MOCK FORGOT PASSWORD] Copy and paste this link in your browser address bar to test password reset
```

### Reset Password Success
```
[MOCK] Intercepting: POST http://localhost:4200/api/auth/reset-password
[MOCK RESET PASSWORD] Request: { email: 'test@example.com' }
[MOCK RESET PASSWORD] Success for: test@example.com
[MOCK RESET PASSWORD] Old password: Test1234!
[MOCK RESET PASSWORD] New password: NewPassword123!
[MOCK RESET PASSWORD] Use these credentials to login
```

### Email Verification Success
```
[MOCK] Intercepting: POST http://localhost:4200/api/auth/verify-email
[MOCK VERIFY EMAIL] Request: { userId: 'abc123xyz' }
[MOCK VERIFY EMAIL] Success for userId: abc123xyz
[MOCK VERIFY EMAIL] Email verified: john@example.com
[MOCK VERIFY EMAIL] Auto-login token generated
```

---

## HTTP Status Codes

| Status | Scenario | Example |
|--------|----------|---------|
| 200 | Success | Login with correct credentials |
| 400 | Validation error | Invalid email, password too short |
| 401 | Authentication error | Invalid password, expired token |

---

## Form Validation Rules

### Email Field
- ✅ Required
- ✅ Valid format (must include @ and domain)
- ❌ Cannot be empty
- ❌ Cannot be invalid format

### Password Field (Login)
- ✅ Required
- ✅ Minimum 8 characters (if registering)
- ❌ Cannot be empty (login)
- ❌ Cannot be too short (register)

### Password Match (Register/Reset)
- ✅ Both fields must match exactly
- ❌ Passwords cannot differ
- ❌ Case-sensitive

### User Type (Register)
- ✅ Either "client" or "mentor"
- ❌ Cannot be empty

---

## Troubleshooting

### Issue: "Can't find login page"
**Solution:** Make sure routing is configured. Navigate to exact URL: `http://localhost:4200/auth/login`

### Issue: "Console is empty"
**Cause:** You haven't triggered any auth action yet
**Solution:** Try logging in - you'll see [MOCK] logs immediately

### Issue: "No verification link in console"
**Cause:** Console was cleared or registration failed
**Solution:** Open console before registering, look for blue text logs

### Issue: "Can't paste reset link"
**Cause:** Link might have been truncated
**Solution:** Right-click console message → Copy, then paste in address bar

### Issue: "Password reset link says invalid"
**Cause:** Token expired or was regenerated
**Solution:** Generate a new reset link (console keeps old ones, regenerate by doing forgot password again)

### Issue: "Already logged in, can't access auth pages"
**Cause:** guestGuard prevents authenticated users from auth pages
**Solution:**
- Open incognito/private window
- Or clear localStorage: `localStorage.clear()` in console
- Or logout first

### Issue: "New user I registered doesn't exist"
**Cause:** Mock database resets when page reloads
**Solution:** Test.com user persists, or register again

---

## Browser DevTools Tips

### Check Stored Tokens
In console, run:
```javascript
localStorage.getItem('auth_token')
localStorage.getItem('refresh_token')
```

### Check Mock Users
Open console → Application tab → Local Storage → Copy token output

### Clear All Data
In console, run:
```javascript
localStorage.clear()
sessionStorage.clear()
location.reload()
```

### Copy from Console
- Click any console message
- Right-click → Copy
- Paste in address bar

---

## Component Test Matrix

| Component | Test 1 | Test 2 | Test 3 |
|-----------|--------|--------|--------|
| Login | Valid creds | Invalid creds | Empty fields |
| Register | New user | Duplicate email | Mismatched passwords |
| Password Reset | Step 1 | Step 2 | New password login |
| Email Verify | Auto-verify | Countdown | Auto-login |

---

## Success Indicators

### Login Success ✅
- [ ] Form validates email is required
- [ ] Form validates password is required
- [ ] Valid credentials show success message
- [ ] Token saved to localStorage
- [ ] Redirects to dashboard
- [ ] Console shows [MOCK LOGIN] Success

### Register Success ✅
- [ ] Form validates all fields required
- [ ] Email validation works
- [ ] Password validation works (8+ chars)
- [ ] Password match validation works
- [ ] Duplicate email rejected
- [ ] New user created
- [ ] Verification link in console
- [ ] Redirects to verification page

### Password Reset Success ✅
- [ ] Step 1: Email validation works
- [ ] Step 1: Reset link generated
- [ ] Step 2: Token validation works
- [ ] Step 2: Password match validation works
- [ ] Step 2: Success message appears
- [ ] Auto-redirect to login
- [ ] New password works for login

### Email Verification Success ✅
- [ ] Automatic verification on load
- [ ] Countdown timer displays
- [ ] Auto-redirect happens
- [ ] Can login with verified email
- [ ] Console shows [MOCK VERIFY EMAIL] Success

---

## File Locations

```
Frontend/
├── MOCK_TESTING_QUICK_START.md ← Quick reference
├── IMPLEMENTATION_SUMMARY.md ← What was implemented
├── MOCK_INTERCEPTOR_REFERENCE.md ← This file
├── TESTING_GUIDE.md ← Detailed guide
└── src/app/
    └── core/interceptors/
        ├── mock-http.interceptor.ts ← The implementation
        └── README.md ← Technical docs
```

---

## Next Steps After Testing

1. ✅ Test all components (use this guide)
2. ✅ Verify all flows work
3. ✅ Check console logs
4. 📝 Create unit tests (see TESTING_GUIDE.md)
5. 🔧 Implement backend API
6. 🗑️ Remove MockHttpInterceptor
7. 🚀 Deploy to production

---

**Happy Testing!** 🎉

For more details, see MOCK_TESTING_QUICK_START.md or TESTING_GUIDE.md
