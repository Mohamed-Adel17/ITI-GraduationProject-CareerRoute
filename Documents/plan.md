# Implementation Plan: Career Route Mentorship Platform

## Summary

Career Route is a mentorship platform connecting students, graduates, and early professionals with experienced mentors for personalized career guidance. The platform enables 1-on-1 and group mentorship sessions with integrated video conferencing, payment processing (15% commission model), post-session chat, and comprehensive admin oversight. Technical implementation uses ASP.NET Core Web API backend with Entity Framework Core for data access, SQL Server for storage, and Angular frontend with Bootstrap styling.

## Technical Context

**Language/Version**: C# 12 / .NET 8.0 LTS (backend), TypeScript 5.x / Angular 17+ (frontend)  
**Primary Dependencies**: ASP.NET Core 8.0, Entity Framework Core 8.0, Angular 17, Bootstrap 5, ASP.NET Identity (auth), SignalR (real-time)  
**Storage**: SQL Server 2022 (primary database), Azure Blob Storage or local file system (session recordings, attachments)  
**Testing**: xUnit + Moq (backend unit tests), Jasmine + Karma (Angular unit tests), Playwright (E2E tests)  
**Target Platform**: Cross-platform deployment (Windows Server / Linux containers), modern browsers (Chrome, Firefox, Edge, Safari)
**Project Type**: Full-stack web application (separate backend API + frontend SPA)  
**Performance Goals**: 500 concurrent users, <3 second page load, <2 second search results, handle 100 simultaneous video sessions  
**Constraints**: <200ms API response time (p95), <5 second payment processing, 99% uptime during business hours, GDPR-compliant data handling  
**Scale/Scope**: MVP targets 50+ mentors, 500+ users in first 3 months, 100+ sessions/month, 7 specialization categories, ~15 API endpoints per domain

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

**Constitution Status**: No project-specific constitution file found. Using standard software engineering best practices:

### Quality Gates

✅ **Architecture Clarity**: Clear separation of concerns (API backend, SPA frontend, database layer)  
✅ **Technology Constraints**: All technologies specified by team requirements (ASP.NET Core, EF Core, Angular)  
✅ **Testability**: Testing strategy defined for all layers (xUnit, Jasmine, Playwright)  
✅ **Security Requirements**: Authentication, authorization, data protection, input validation specified in FR-044 to FR-050  
✅ **Scalability**: Performance goals and constraints clearly defined (500 concurrent users, <200ms API response)  
✅ **Data Integrity**: Entity relationships and validation rules defined in functional requirements

### Pre-Implementation Checklist

- [ ] Database schema design reviewed and approved
- [ ] API contracts documented (OpenAPI/Swagger spec)
- [ ] Authentication/authorization strategy confirmed (ASP.NET Identity + JWT)
- [ ] Payment gateway integration approach verified (Stripe + Paymob)
- [ ] Video conferencing integration decided (Zoom API vs WebRTC vs third-party)
- [ ] File storage strategy confirmed (Azure Blob vs local for MVP)
- [ ] Deployment target confirmed (Azure App Service vs Docker containers vs on-premise)

### Source Code (repository root)

```
CareerRoute/
├── Backend/
│   ├── CareerRoute.API/                    # Main Web API project
│   │   ├── Controllers/                    # API endpoints
│   │   │   ├── AuthController.cs
│   │   │   ├── UsersController.cs
│   │   │   ├── MentorsController.cs
│   │   │   ├── SessionsController.cs
│   │   │   ├── PaymentsController.cs
│   │   │   ├── CategoriesController.cs
│   │   │   ├── ReviewsController.cs
│   │   │   ├── ChatsController.cs
│   │   │   └── AdminController.cs
│   │   ├── Middleware/                     # Custom middleware
│   │   │   ├── ExceptionHandlingMiddleware.cs
│   │   │   ├── RateLimitingMiddleware.cs
│   │   │   └── RequestLoggingMiddleware.cs
│   │   ├── Filters/                        # Action filters
│   │   ├── Program.cs
│   │   ├── appsettings.json
│   │   └── appsettings.Development.json
│   │
│   ├── CareerRoute.Core/                   # Domain layer
│   │   ├── Entities/                       # Domain models
│   │   │   ├── User.cs
│   │   │   ├── Mentor.cs
│   │   │   ├── Session.cs
│   │   │   ├── Payment.cs
│   │   │   ├── Category.cs
│   │   │   ├── Review.cs
│   │   │   ├── ChatMessage.cs
│   │   │   ├── Dispute.cs
│   │   │   └── AdminLog.cs
│   │   ├── Enums/                          # Shared enumerations
│   │   ├── Interfaces/                     # Repository & service contracts
│   │   │   ├── IUserRepository.cs
│   │   │   ├── IMentorRepository.cs
│   │   │   ├── ISessionRepository.cs
│   │   │   ├── IPaymentService.cs
│   │   │   ├── IVideoConferenceService.cs
│   │   │   ├── IEmailService.cs
│   │   │   └── IStorageService.cs
│   │   └── DTOs/                           # Data transfer objects
│   │       ├── Auth/
│   │       ├── Users/
│   │       ├── Mentors/
│   │       ├── Sessions/
│   │       └── Payments/
│   │
│   ├── CareerRoute.Infrastructure/         # Infrastructure layer
│   │   ├── Data/                           # EF Core context
│   │   │   ├── ApplicationDbContext.cs
│   │   │   ├── Configurations/             # Entity configurations
│   │   │   └── Migrations/
│   │   ├── Repositories/                   # Repository implementations
│   │   ├── Services/                       # External service integrations
│   │   │   ├── StripePaymentService.cs
│   │   │   ├── PaymobPaymentService.cs
│   │   │   ├── ZoomVideoService.cs
│   │   │   ├── SendGridEmailService.cs
│   │   │   └── AzureBlobStorageService.cs
│   │   └── Identity/                       # ASP.NET Identity configuration
│   │
│   ├── CareerRoute.Application/            # Application layer (business logic)
│   │   ├── Services/                       # Business logic services
│   │   │   ├── UserService.cs
│   │   │   ├── MentorService.cs
│   │   │   ├── SessionBookingService.cs
│   │   │   ├── PaymentProcessingService.cs
│   │   │   ├── SearchService.cs
│   │   │   ├── ReviewService.cs
│   │   │   └── AdminService.cs
│   │   ├── Validators/                     # FluentValidation validators
│   │   ├── Mappings/                       # AutoMapper profiles
│   │   └── Exceptions/                     # Custom exceptions
│   │
│   └── CareerRoute.Tests/
│       ├── Unit/                           # Unit tests (xUnit)
│       │   ├── Services/
│       │   ├── Repositories/
│       │   └── Controllers/
│       ├── Integration/                    # Integration tests
│       │   ├── API/
│       │   └── Database/
│       └── E2E/                            # End-to-end tests (Playwright)
│
├── Frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/                       # Singleton services, guards
│   │   │   │   ├── auth/
│   │   │   │   ├── interceptors/
│   │   │   │   ├── guards/
│   │   │   │   └── services/
│   │   │   ├── shared/                     # Shared modules, components
│   │   │   │   ├── components/
│   │   │   │   ├── directives/
│   │   │   │   ├── pipes/
│   │   │   │   └── models/
│   │   │   ├── features/                   # Feature modules
│   │   │   │   ├── auth/
│   │   │   │   │   ├── login/
│   │   │   │   │   ├── register/
│   │   │   │   │   └── password-reset/
│   │   │   │   ├── mentors/
│   │   │   │   │   ├── mentor-list/
│   │   │   │   │   ├── mentor-detail/
│   │   │   │   │   └── mentor-profile/
│   │   │   │   ├── sessions/
│   │   │   │   │   ├── session-booking/
│   │   │   │   │   ├── session-list/
│   │   │   │   │   └── session-room/
│   │   │   │   ├── payments/
│   │   │   │   ├── reviews/
│   │   │   │   ├── chat/
│   │   │   │   ├── admin/
│   │   │   │   └── user-dashboard/
│   │   │   ├── app.component.ts
│   │   │   ├── app.routes.ts
│   │   │   └── app.config.ts
│   │   ├── assets/
│   │   ├── environments/
│   │   └── styles/
│   ├── angular.json
│   ├── package.json
│   └── tsconfig.json
│
├── Database/
│   ├── Scripts/
│   │   ├── 01_InitialSchema.sql
│   │   ├── 02_SeedCategories.sql
│   │   └── 03_SeedTestData.sql
│   └── Docs/
│       └── ERD.png
│
├── Docs/
│   ├── API/
│   │   └── swagger.json
│   ├── Architecture/
│   │   ├── SystemArchitecture.md
│   │   └── SecurityDesign.md
│   └── Deployment/
│       └── DeploymentGuide.md
│
└── .github/
    └── workflows/
        ├── backend-ci.yml
        └── frontend-ci.yml
```

**Structure Decision**: This is a full-stack web application with clear separation between backend (.NET) and frontend (Angular). The backend follows Clean Architecture principles with Core (domain), Infrastructure (data/external services), Application (business logic), and API (presentation) layers. The frontend follows Angular best practices with feature-based modules, shared components, and core services. This structure supports the 6-person team by enabling parallel development across layers and features.

**No violations detected** - Architecture follows standard industry patterns for full-stack web applications with appropriate separation of concerns.
