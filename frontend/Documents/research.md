# Research: Career Route Platform

**Phase 0 Output** | **Date**: 2025 | **Feature**: Career Route Mentorship Platform

## Purpose

This document resolves technical unknowns identified during planning and documents technology decisions with rationale.

---

## 1. Video Conferencing Integration

### Decision
**Zoom SDK for Web** (initial MVP) with fallback to **Twilio Video** or **WebRTC (SimpleWebRTC/Daily.co)** for cost optimization post-MVP.

### Rationale
- **Zoom SDK**: 
  - Well-documented API with .NET SDK support
  - Reliable infrastructure (99.9% uptime)
  - Users already familiar with Zoom interface
  - Easy integration: Generate meeting links programmatically
  - Free tier: 40-minute limit sufficient for 30-min sessions with buffer
  - Features: Screen sharing, recording, breakout rooms (for group sessions)
  
- **Cost**: $0 for basic features, $1400/month for Pro if scaling beyond 100 participants

### Alternatives Considered
- **Microsoft Teams**: Complex authentication (Azure AD), enterprise-focused
- **Google Meet**: Limited API, requires Google Workspace subscription
- **WebRTC (custom)**: High development effort, requires TURN/STUN servers, NAT traversal complexity
- **Twilio Video**: $0.004/min/participant, flexible but costlier at scale (~$240/month for 100 hrs)
- **Daily.co**: Clean API, $0.004/min, good middle ground

### Implementation Notes
- Use Zoom REST API to create meetings: `POST /v2/users/{userId}/meetings`
- Store meeting ID and join URL in Session entity
- Implement webhook for session start/end tracking
- Recording storage: Zoom cloud (free 1GB) → download to Azure Blob after session

---

## 2. Payment Gateway Integration

### Decision
**Stripe** for international payments + **Paymob** for Egyptian local payments (Meeza, InstaPay, mobile wallets)

### Rationale
- **Stripe**:
  - Industry standard for online payments (Visa, Mastercard, PayPal, Apple Pay)
  - Excellent .NET SDK (Stripe.net)
  - Automatic commission splits via Stripe Connect
  - PCI-DSS compliant (no need to handle card data)
  - Transparent pricing: 2.9% + $0.30 per transaction
  - Supports payment holds (authorize → capture after 72 hours)
  
- **Paymob**:
  - Dominant in Egypt/MENA region
  - Supports Meeza (local card network), InstaPay, Vodafone Cash, Orange Cash
  - Integration with Egyptian banks
  - Pricing: ~2.5% per transaction
  - REST API with .NET examples

### Alternatives Considered
- **PayPal only**: High fees (3.49% + fixed), limited mobile wallet support in Egypt
- **Fawry**: Egypt-specific, lacks international support
- **PayTabs**: MENA focus, less documentation

### Implementation Strategy
1. **Platform Commission Model**: 
   - Stripe Connect: Platform as "connected account" (15% commission auto-deducted)
   - Paymob: Manual calculation and transfer (capture full amount, calculate mentor payout separately)

2. **Payment Flow**:
   ```
   User Books Session → Payment Gateway (Stripe/Paymob)
   → Success: Create Session record with status=Confirmed
   → Hold funds for 72 hours
   → Auto-release to mentor (minus 15% commission) if no dispute
   → Refund if cancelled within policy window
   ```

3. **Webhook Handling**:
   - Stripe: `payment_intent.succeeded`, `payment_intent.payment_failed`
   - Paymob: `transaction.successful`, `transaction.failed`

---

## 3. Authentication & Authorization Strategy

### Decision
**ASP.NET Identity** with **JWT tokens** for stateless API authentication, **refresh tokens** for extended sessions

### Rationale
- **ASP.NET Identity**:
  - Built-in framework for .NET applications
  - Handles user management, password hashing (PBKDF2), email confirmation
  - Role-based access control (User, Mentor, Admin)
  - Extensible: Custom claims, external providers (Google OAuth)
  
- **JWT**:
  - Stateless: No server-side session storage (scales horizontally)
  - Angular can store in localStorage/sessionStorage
  - Include claims: UserId, Role, Email
  - Short expiration (15 minutes) + refresh token (7 days)

### Alternatives Considered
- **Session-based auth**: Requires server-side state, doesn't scale well
- **OAuth2/OIDC (IdentityServer)**: Overkill for MVP, adds complexity
- **Firebase Auth**: Vendor lock-in, costs scale with users

### Implementation Details
1. **Registration Flow**:
   ```
   POST /api/auth/register
   → Create user in ASP.NET Identity
   → Send verification email (SendGrid)
   → Return 201 Created
   ```

2. **Login Flow**:
   ```
   POST /api/auth/login
   → Validate credentials
   → Generate JWT (15-min expiry) + Refresh Token (7-day expiry)
   → Return tokens + user profile
   ```

3. **Token Refresh**:
   ```
   POST /api/auth/refresh
   Body: { refreshToken }
   → Validate refresh token
   → Generate new JWT + Refresh Token
   → Invalidate old refresh token
   ```

4. **Authorization Policies**:
   - `[Authorize]`: Authenticated users only
   - `[Authorize(Roles = "Mentor")]`: Mentor-specific endpoints
   - `[Authorize(Roles = "Admin")]`: Admin dashboard
   - `[Authorize(Policy = "SessionOwner")]`: Custom policy for session participants

---

## 4. Real-Time Communication (Chat & Notifications)

### Decision
**SignalR** for real-time chat during 3-day window and in-app notifications

### Rationale
- **SignalR**:
  - Native to ASP.NET Core (minimal setup)
  - WebSocket-based with fallback to Server-Sent Events (SSE) and long polling
  - Automatic connection management and reconnection
  - Easy Angular integration via `@microsoft/signalr` npm package
  - Scales with Azure SignalR Service if needed

- **Use Cases**:
  - Post-session chat (3-day window)
  - Typing indicators
  - Real-time booking notifications
  - Session reminder popups

### Alternatives Considered
- **Pusher**: $49/month for 100 connections, external dependency
- **Socket.io**: Node.js-centric, awkward with .NET
- **Polling**: Inefficient, high server load

### Implementation
1. **SignalR Hub**:
   ```csharp
   public class ChatHub : Hub
   {
       public async Task SendMessage(string sessionId, string message)
       {
           await Clients.Group(sessionId).SendAsync("ReceiveMessage", message);
       }
   }
   ```

2. **Angular Client**:
   ```typescript
   const connection = new signalR.HubConnectionBuilder()
     .withUrl("/chatHub")
     .build();
   
   connection.on("ReceiveMessage", (message) => {
     // Update UI
   });
   ```

3. **Authorization**: Use JWT in SignalR connection (pass token in query string or header)

---

## 5. File Storage (Session Recordings & Attachments)

### Decision
**Azure Blob Storage** for production, **local file system** for development

### Rationale
- **Azure Blob Storage**:
  - Cost-effective: $0.018/GB/month (Hot tier)
  - Scalable: No capacity planning needed
  - Built-in CDN integration (Azure CDN)
  - .NET SDK: `Azure.Storage.Blobs`
  - Secure: SAS tokens for temporary access (stream-only, no download)
  - Automatic expiration: Lifecycle policies (delete after 3 days)

- **File Types**:
  - Session recordings (Zoom downloads): MP4, ~100MB per hour
  - Chat attachments: PDF, images (<10MB)

### Alternatives Considered
- **AWS S3**: Comparable pricing, but team unfamiliar
- **Local file system**: Not scalable, backup challenges
- **SQL Server FILESTREAM**: Limited to 2GB, performance issues

### Implementation
1. **Upload Flow**:
   ```csharp
   var blobClient = blobContainerClient.GetBlobClient(fileName);
   await blobClient.UploadAsync(fileStream);
   ```

2. **Secure Access** (stream-only):
   ```csharp
   var sasBuilder = new BlobSasBuilder
   {
       BlobContainerName = "recordings",
       BlobName = fileName,
       ExpiresOn = DateTimeOffset.UtcNow.AddHours(24)
   };
   var sasToken = blobClient.GenerateSasUri(sasBuilder);
   ```

3. **Auto-Expiration**:
   - Blob lifecycle management policy: Delete blobs older than 3 days in "recordings" container

---

## 6. Email Service

### Decision
**SendGrid** for transactional emails (verification, confirmations, reminders)

### Rationale
- **SendGrid**:
  - Free tier: 100 emails/day (sufficient for MVP)
  - Reliable delivery (99% inbox rate)
  - .NET SDK: `SendGrid.AspNet.Core`
  - Email templates with dynamic data
  - Analytics: Open rates, click tracking
  
- **Email Types**:
  - Account verification
  - Password reset
  - Booking confirmation
  - Session reminders (24h, 1h before)
  - Payment receipts
  - Dispute notifications

### Alternatives Considered
- **Mailgun**: Similar pricing, less .NET documentation
- **AWS SES**: $0.10/1000 emails, requires AWS account
- **SMTP (Gmail)**: Daily limits (500/day), not professional

### Implementation
```csharp
var client = new SendGridClient(apiKey);
var msg = new SendGridMessage
{
    From = new EmailAddress("noreply@careerroute.com"),
    Subject = "Session Confirmation",
    TemplateId = "d-abc123"
};
msg.AddTo(userEmail);
msg.SetTemplateData(new { mentorName, sessionDate });
await client.SendEmailAsync(msg);
```

---

## 7. Search & Filtering Optimization

### Decision
**SQL Server Full-Text Search** for MVP, migrate to **Elasticsearch** if search becomes bottleneck (>10k mentors)

### Rationale
- **SQL Server FTS**:
  - Built-in: No additional infrastructure
  - Sufficient for <1000 mentors
  - Supports keyword matching, ranking
  - Integrates with EF Core
  
- **When to migrate to Elasticsearch**:
  - >10k mentors
  - Complex filtering (faceted search)
  - <100ms response time requirement

### Implementation (SQL Server FTS)
```csharp
// EF Core query
var mentors = await _context.Mentors
    .Where(m => EF.Functions.FreeText(m.Bio, searchQuery) ||
                EF.Functions.FreeText(m.ExpertiseTags, searchQuery))
    .Include(m => m.Reviews)
    .Where(m => m.HourlyRate >= minPrice && m.HourlyRate <= maxPrice)
    .OrderByDescending(m => m.AverageRating)
    .ToListAsync();
```

### Alternatives Considered
- **Elasticsearch**: Overkill for MVP, requires separate service
- **Azure Cognitive Search**: $250/month minimum
- **LIKE queries**: Too slow, no ranking

---

## 8. Deployment Strategy

### Decision
**Docker containers** on **Azure App Service** (Backend + Frontend) + **Azure SQL Database**

### Rationale
- **Docker**:
  - Consistent environments (dev, staging, prod)
  - Easy CI/CD with GitHub Actions
  - Supports both Windows and Linux hosting
  
- **Azure App Service**:
  - Managed platform (no VM management)
  - Auto-scaling
  - Built-in SSL certificates
  - Pricing: ~$50/month (Basic tier) for MVP
  
- **Azure SQL Database**:
  - Managed SQL Server
  - Automatic backups
  - Pricing: ~$5/month (Basic tier, 2GB)

### Alternatives Considered
- **AWS**: Team unfamiliar, similar costs
- **On-premise**: High maintenance, no auto-scaling
- **Heroku**: Limited .NET support

### CI/CD Pipeline (GitHub Actions)
```yaml
# .github/workflows/backend-ci.yml
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Docker image
        run: docker build -t careerroute-api ./Backend
      - name: Run tests
        run: dotnet test ./Backend/CareerRoute.Tests
      - name: Deploy to Azure
        uses: azure/webapps-deploy@v2
```

---

## 9. Rate Limiting & Security

### Decision
**ASP.NET Core Rate Limiting Middleware** + **OWASP best practices**

### Rationale
- **Rate Limiting**:
  - Prevent brute-force attacks (login, registration)
  - Limit: 5 failed login attempts per 15 minutes per IP
  - API throttling: 100 requests/minute per user
  
- **Security Measures**:
  - HTTPS only (enforced)
  - Input validation (FluentValidation)
  - SQL injection prevention (parameterized queries via EF Core)
  - XSS prevention (Angular sanitization)
  - CORS: Whitelist frontend domain only
  - Helmet.js equivalent for .NET (NWebsec)

### Implementation
```csharp
// Program.cs
builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("api", opt =>
    {
        opt.PermitLimit = 100;
        opt.Window = TimeSpan.FromMinutes(1);
    });
});

app.UseRateLimiter();
```

---

## 10. Testing Strategy

### Decision
**Layered testing approach**: Unit tests (70%), Integration tests (20%), E2E tests (10%)

### Rationale
- **Unit Tests (xUnit + Moq)**:
  - Test business logic in isolation
  - Fast execution (<5 seconds for full suite)
  - Mock repositories and external services
  - Target: 80% code coverage
  
- **Integration Tests**:
  - Test API endpoints with real database (in-memory)
  - Verify EF Core queries
  - Test middleware and authentication
  
- **E2E Tests (Playwright)**:
  - Test critical user flows:
    - Registration → Login → Search Mentor → Book Session → Payment
    - Mentor: Create Profile → Approve Session → Join Video
  - Run on CI/CD before deployment

### Test Structure
```
CareerRoute.Tests/
├── Unit/
│   ├── Services/
│   │   └── SessionBookingServiceTests.cs
│   └── Controllers/
│       └── SessionsControllerTests.cs
├── Integration/
│   ├── API/
│   │   └── SessionsApiTests.cs
│   └── Database/
│       └── SessionRepositoryTests.cs
└── E2E/
    └── booking-flow.spec.ts
```

---

## Summary

All technical unknowns have been resolved with clear decisions. The architecture uses battle-tested technologies familiar to .NET developers, with clear migration paths for scaling (SQL FTS → Elasticsearch, Zoom → Twilio). Total estimated infrastructure cost for MVP: ~$60-80/month (Azure App Service + SQL + Blob Storage + SendGrid + Zoom).

**Next Phase**: Data model design and API contract generation.
