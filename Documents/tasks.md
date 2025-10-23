# Tasks: Career Route Mentorship Platform

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Architecture Note (IMPORTANT)

**3-Layer Structure Approved (2025-10-23):**
- CareerRoute.API (Presentation)
- CareerRoute.Core (Domain + Application combined)
- CareerRoute.Infrastructure (Data + External Services)

**File paths in this document** reference `Backend/CareerRoute.Application/` for historical reasons, but should be interpreted as `Backend/CareerRoute.Core/` since we use the 3-layer approach. Application-layer concerns (DTOs, Services, Validators, Mappings, Exceptions) are located in the Core project alongside Domain entities.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- File paths follow Backend/Frontend structure from plan.md (3-layer architecture)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 [P] Create Backend solution structure: CareerRoute.API, CareerRoute.Core, CareerRoute.Infrastructure, CareerRoute.Tests (3-layer architecture - no separate Application project)
- [ ] T002 [P] Create Frontend Angular 20 project with routing and Bootstrap 5
- [ ] T003 [P] Setup .NET 8.0 dependencies: ASP.NET Core, Entity Framework Core, ASP.NET Identity
- [ ] T004 [P] Setup Frontend dependencies: Angular Material or ng-bootstrap, RxJS, HttpClient
- [ ] T005 [P] Create Database/Scripts folder with initial SQL scripts structure
- [ ] T006 [P] Setup CI/CD pipelines: .github/workflows/backend-ci.yml and frontend-ci.yml
- [ ] T007 [P] Configure backend appsettings.json and appsettings.Development.json templates
- [ ] T008 [P] Configure frontend environments: environment.ts and environment.development.ts
- [ ] T009 [P] Setup Docker configuration files for Backend and Frontend (optional for local dev)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T010 Create ApplicationDbContext in Backend/CareerRoute.Infrastructure/Data/ApplicationDbContext.cs with DbSet placeholders
- [ ] T011 Setup Entity Framework Core migrations framework and initial migration structure
- [ ] T012 Configure ASP.NET Identity with ApplicationUser extending IdentityUser in Backend/CareerRoute.Core/Entities/User.cs
- [ ] T013 Implement JWT authentication in Backend/CareerRoute.API/Program.cs with token generation and validation
- [ ] T014 Create authentication middleware and configure authorization policies (User, Mentor, Admin roles)
- [ ] T015 [P] Create base repository interface IRepository<T> in Backend/CareerRoute.Core/Interfaces/
- [ ] T016 [P] Create generic repository implementation in Backend/CareerRoute.Infrastructure/Repositories/Repository.cs
- [ ] T017 [P] Setup global exception handling middleware in Backend/CareerRoute.API/Middleware/ExceptionHandlingMiddleware.cs
- [ ] T018 [P] Setup request logging middleware in Backend/CareerRoute.API/Middleware/RequestLoggingMiddleware.cs
- [ ] T019 [P] Configure CORS policy for Frontend origin in Backend/CareerRoute.API/Program.cs
- [ ] T020 [P] Setup Swagger/OpenAPI documentation in Backend/CareerRoute.API/Program.cs
- [ ] T021 [P] Create base DTOs folder structure in Backend/CareerRoute.Core/DTOs/ (Auth, Users, Mentors, Sessions, Payments)
- [ ] T022 [P] Setup Angular HTTP interceptor for JWT token attachment in Frontend/src/app/core/interceptors/auth.interceptor.ts
- [ ] T023 [P] Setup Angular HTTP interceptor for error handling in Frontend/src/app/core/interceptors/error.interceptor.ts
- [ ] T024 [P] Create Angular authentication guard in Frontend/src/app/core/guards/auth.guard.ts
- [ ] T025 [P] Create Angular role-based guard in Frontend/src/app/core/guards/role.guard.ts
- [ ] T026 [P] Setup Angular routing module with lazy-loaded feature modules in Frontend/src/app/app.routes.ts
- [ ] T027 Seed initial Categories data (IT Careers, Leadership, Finance, Marketing, HR, Design, Startup Advice) in Database/Scripts/02_SeedCategories.sql

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - User and Mentor Registration & Profile Management (Priority: P1) 🎯 MVP

**Goal**: Enable users and mentors to create accounts, verify emails, complete profiles, and manage their information

**Independent Test**: Create user account → Verify email → Login → Update profile → Create mentor account → Complete mentor profile with bio/expertise → View profile

### Implementation for User Story 1

**Backend - Domain Layer**

- [ ] T028 [P] [US1] Create User entity in Backend/CareerRoute.Core/Entities/User.cs (extends ApplicationUser with FirstName, LastName, CareerInterests, etc.)
- [ ] T029 [P] [US1] Create Mentor entity in Backend/CareerRoute.Core/Entities/Mentor.cs (Bio, ExpertiseTags, YearsOfExperience, Rates, AverageRating, etc.)
- [ ] T030 [P] [US1] Create Category entity in Backend/CareerRoute.Core/Entities/Category.cs
- [ ] T031 [P] [US1] Create MentorCategory junction entity in Backend/CareerRoute.Core/Entities/MentorCategory.cs
- [ ] T032 [P] [US1] Create enums in Backend/CareerRoute.Core/Enums/: UserRole, MentorApprovalStatus

**Backend - DTOs**

- [ ] T033 [P] [US1] Create RegisterRequestDto and RegisterResponseDto in Backend/CareerRoute.Core/DTOs/Auth/
- [ ] T034 [P] [US1] Create LoginRequestDto and LoginResponseDto in Backend/CareerRoute.Core/DTOs/Auth/
- [ ] T035 [P] [US1] Create UserProfileDto and UpdateUserProfileDto in Backend/CareerRoute.Core/DTOs/Users/
- [ ] T036 [P] [US1] Create MentorProfileDto and UpdateMentorProfileDto in Backend/CareerRoute.Core/DTOs/Mentors/
- [ ] T037 [P] [US1] Create PasswordResetRequestDto and PasswordResetDto in Backend/CareerRoute.Core/DTOs/Auth/

**Backend - Database Configuration**

- [ ] T038 [P] [US1] Configure User entity mapping in Backend/CareerRoute.Infrastructure/Data/Configurations/UserConfiguration.cs
- [ ] T039 [P] [US1] Configure Mentor entity mapping in Backend/CareerRoute.Infrastructure/Data/Configurations/MentorConfiguration.cs
- [ ] T040 [P] [US1] Configure Category entity mapping in Backend/CareerRoute.Infrastructure/Data/Configurations/CategoryConfiguration.cs
- [ ] T041 [US1] Update ApplicationDbContext with DbSets for User, Mentor, Category, MentorCategory
- [ ] T042 [US1] Create and run EF Core migration for User Story 1 entities

**Backend - Repositories**

- [ ] T043 [P] [US1] Create IUserRepository interface in Backend/CareerRoute.Core/Interfaces/IUserRepository.cs
- [ ] T044 [P] [US1] Create IMentorRepository interface in Backend/CareerRoute.Core/Interfaces/IMentorRepository.cs
- [ ] T045 [P] [US1] Create ICategoryRepository interface in Backend/CareerRoute.Core/Interfaces/ICategoryRepository.cs
- [ ] T046 [P] [US1] Implement UserRepository in Backend/CareerRoute.Infrastructure/Repositories/UserRepository.cs
- [ ] T047 [P] [US1] Implement MentorRepository in Backend/CareerRoute.Infrastructure/Repositories/MentorRepository.cs
- [ ] T048 [P] [US1] Implement CategoryRepository in Backend/CareerRoute.Infrastructure/Repositories/CategoryRepository.cs

**Backend - Services**

- [ ] T049 [P] [US1] Create IEmailService interface in Backend/CareerRoute.Core/Interfaces/IEmailService.cs
- [ ] T050 [US1] Implement SendGridEmailService in Backend/CareerRoute.Infrastructure/Services/SendGridEmailService.cs (email verification, password reset)
- [ ] T051 [US1] Create IAuthService interface and implement AuthService in Backend/CareerRoute.Application/Services/AuthService.cs (register, login, JWT generation, password reset)
- [ ] T052 [US1] Create IUserService interface and implement UserService in Backend/CareerRoute.Application/Services/UserService.cs (profile CRUD)
- [ ] T053 [US1] Create IMentorService interface and implement MentorService in Backend/CareerRoute.Application/Services/MentorService.cs (mentor profile CRUD, category assignment)

**Backend - Validation**

- [ ] T054 [P] [US1] Create RegisterRequestValidator using FluentValidation in Backend/CareerRoute.Application/Validators/RegisterRequestValidator.cs
- [ ] T055 [P] [US1] Create UpdateUserProfileValidator in Backend/CareerRoute.Application/Validators/UpdateUserProfileValidator.cs
- [ ] T056 [P] [US1] Create UpdateMentorProfileValidator in Backend/CareerRoute.Application/Validators/UpdateMentorProfileValidator.cs

**Backend - API Controllers**

- [ ] T057 [US1] Implement AuthController in Backend/CareerRoute.API/Controllers/AuthController.cs (POST /register, POST /login, POST /refresh, POST /forgot-password, POST /reset-password, GET /verify-email)
- [ ] T058 [US1] Implement UsersController in Backend/CareerRoute.API/Controllers/UsersController.cs (GET /{id}, PUT /{id})
- [ ] T059 [US1] Implement MentorsController (partial) in Backend/CareerRoute.API/Controllers/MentorsController.cs (POST / for apply, PUT /{id} for update profile)

**Backend - AutoMapper**

- [ ] T060 [P] [US1] Create AutoMapper profile for User/Mentor entities in Backend/CareerRoute.Application/Mappings/UserMappingProfile.cs

**Frontend - Models**

- [ ] T061 [P] [US1] Create User model in Frontend/src/app/shared/models/user.model.ts
- [ ] T062 [P] [US1] Create Mentor model in Frontend/src/app/shared/models/mentor.model.ts
- [ ] T063 [P] [US1] Create Auth DTOs (RegisterRequest, LoginRequest, AuthResponse) in Frontend/src/app/shared/models/auth.model.ts

**Frontend - Services**

- [ ] T064 [US1] Create AuthService in Frontend/src/app/core/services/auth.service.ts (register, login, logout, token management, email verification, password reset)
- [ ] T065 [US1] Create UserService in Frontend/src/app/core/services/user.service.ts (get profile, update profile)
- [ ] T066 [US1] Create MentorService (partial) in Frontend/src/app/core/services/mentor.service.ts (apply as mentor, update mentor profile)

**Frontend - Auth Feature Module**

- [ ] T067 [P] [US1] Create LoginComponent in Frontend/src/app/features/auth/login/login.component.ts with template and styling
- [ ] T068 [P] [US1] Create RegisterComponent in Frontend/src/app/features/auth/register/register.component.ts with role selection (User/Mentor)
- [ ] T069 [P] [US1] Create PasswordResetComponent in Frontend/src/app/features/auth/password-reset/password-reset.component.ts
- [ ] T070 [P] [US1] Create EmailVerificationComponent in Frontend/src/app/features/auth/email-verification/email-verification.component.ts (handles ?token= query param)

**Frontend - User Dashboard Module**

- [ ] T071 [US1] Create UserProfileComponent in Frontend/src/app/features/user-dashboard/user-profile/user-profile.component.ts (view and edit user profile)
- [ ] T072 [US1] Create EditProfileComponent in Frontend/src/app/features/user-dashboard/edit-profile/edit-profile.component.ts (reactive forms for profile update)

**Frontend - Mentor Profile Module**

- [ ] T073 [US1] Create MentorProfileFormComponent in Frontend/src/app/features/mentors/mentor-profile/mentor-profile-form.component.ts (mentor-specific fields: bio, expertise, rates)
- [ ] T074 [US1] Create MentorApplicationComponent in Frontend/src/app/features/mentors/mentor-application/mentor-application.component.ts (apply to become mentor)

**Frontend - Shared Components**

- [ ] T075 [P] [US1] Create navigation header component in Frontend/src/app/shared/components/header/header.component.ts (login/register links, authenticated user menu)
- [ ] T076 [P] [US1] Create notification/toast service in Frontend/src/app/core/services/notification.service.ts

**Checkpoint**: At this point, User Story 1 should be fully functional - users can register, login, verify email, update profiles, and mentors can apply with full profiles

---

## Phase 4: User Story 2 - Browse and Search for Mentors (Priority: P1)

**Goal**: Enable users to discover mentors through category browsing, keyword search, and filtering by price, ratings, and availability

**Independent Test**: View categories → Browse mentors by category → Search by keyword → Apply filters (price, rating) → Sort results → View mentor detail page

### Implementation for User Story 2

**Backend - Services Enhancement**

- [ ] T077 [US2] Enhance IMentorService and MentorService with search/filter methods in Backend/CareerRoute.Application/Services/MentorService.cs (SearchMentors, GetByCategory, FilterByPrice, SortByRating)
- [ ] T078 [US2] Implement SQL Server Full-Text Search query in MentorRepository for keyword matching on Bio and ExpertiseTags

**Backend - DTOs**

- [ ] T079 [P] [US2] Create MentorSearchRequestDto in Backend/CareerRoute.Core/DTOs/Mentors/ (keywords, categoryId, minPrice, maxPrice, minRating, sortBy, page, pageSize)
- [ ] T080 [P] [US2] Create MentorSearchResponseDto with pagination metadata in Backend/CareerRoute.Core/DTOs/Mentors/
- [ ] T081 [P] [US2] Create MentorListItemDto (lightweight DTO for search results) in Backend/CareerRoute.Core/DTOs/Mentors/
- [ ] T082 [P] [US2] Create CategoryDto in Backend/CareerRoute.Core/DTOs/Categories/

**Backend - API Controllers**

- [ ] T083 [US2] Enhance MentorsController with GET / endpoint (search/filter mentors) in Backend/CareerRoute.API/Controllers/MentorsController.cs
- [ ] T084 [US2] Enhance MentorsController with GET /{id} endpoint (get mentor detail) in Backend/CareerRoute.API/Controllers/MentorsController.cs
- [ ] T085 [US2] Implement CategoriesController in Backend/CareerRoute.API/Controllers/CategoriesController.cs (GET / list all, GET /{id}/mentors)

**Backend - Database Optimization**

- [ ] T086 [US2] Create database index on Mentor: IX_Mentor_IsVerified_IsAvailable in migration
- [ ] T087 [US2] Create database index on Mentor: IX_Mentor_AverageRating in migration
- [ ] T088 [US2] Enable SQL Server Full-Text Search on Mentor.Bio and Mentor.ExpertiseTags columns in migration

**Frontend - Services**

- [ ] T089 [US2] Enhance MentorService with searchMentors(), getMentorById(), getMentorsByCategory() in Frontend/src/app/core/services/mentor.service.ts
- [ ] T090 [US2] Create CategoryService in Frontend/src/app/core/services/category.service.ts (getAllCategories, getMentorsByCategory)

**Frontend - Mentors Feature Module**

- [ ] T091 [US2] Create MentorListComponent in Frontend/src/app/features/mentors/mentor-list/mentor-list.component.ts (displays search results with pagination)
- [ ] T092 [US2] Create MentorCardComponent in Frontend/src/app/features/mentors/mentor-card/mentor-card.component.ts (reusable mentor preview card)
- [ ] T093 [US2] Create MentorDetailComponent in Frontend/src/app/features/mentors/mentor-detail/mentor-detail.component.ts (full mentor profile view)
- [ ] T094 [US2] Create MentorSearchComponent in Frontend/src/app/features/mentors/mentor-search/mentor-search.component.ts (search bar, filters, sort controls)
- [ ] T095 [US2] Create CategoryBrowseComponent in Frontend/src/app/features/mentors/category-browse/category-browse.component.ts (category grid/list view)

**Frontend - Shared Components**

- [ ] T096 [P] [US2] Create PaginationComponent in Frontend/src/app/shared/components/pagination/pagination.component.ts (reusable pagination controls)
- [ ] T097 [P] [US2] Create RatingDisplayComponent in Frontend/src/app/shared/components/rating-display/rating-display.component.ts (star rating display)
- [ ] T098 [P] [US2] Create FiltersPanelComponent in Frontend/src/app/shared/components/filters-panel/filters-panel.component.ts (price range, rating, duration filters)

**Frontend - State Management**

- [ ] T099 [US2] Create MentorSearchState service in Frontend/src/app/features/mentors/services/mentor-search-state.service.ts (manage search filters, results, pagination)

**Checkpoint**: At this point, User Story 2 should be fully functional - users can browse categories, search mentors, apply filters, sort results, and view detailed mentor profiles

---

## Phase 5: User Story 3 - Book and Manage Mentorship Sessions (Priority: P1)

**Goal**: Enable users to book sessions with mentors, complete payment, receive confirmations with video links, manage upcoming sessions, reschedule, cancel, and attend virtual meetings

**Independent Test**: Select mentor → Choose time slot → Complete payment → Receive confirmation email with video link → View in dashboard → Reschedule → Cancel → Join session

### Implementation for User Story 3

**Backend - Domain Layer**

- [ ] T100 [P] [US3] Create Session entity in Backend/CareerRoute.Core/Entities/Session.cs (MenteeId, MentorId, SessionType, Duration, ScheduledStartTime, Status, VideoConferenceLink, Price, etc.)
- [ ] T101 [P] [US3] Create Payment entity in Backend/CareerRoute.Core/Entities/Payment.cs (SessionId, Amount, PlatformCommission, MentorPayoutAmount, PaymentMethod, Status, TransactionId, etc.)
- [ ] T102 [P] [US3] Create enums: SessionType, SessionStatus, PaymentMethod, PaymentStatus, MentorPayoutStatus in Backend/CareerRoute.Core/Enums/

**Backend - DTOs**

- [ ] T103 [P] [US3] Create BookSessionRequestDto in Backend/CareerRoute.Core/DTOs/Sessions/ (MentorId, Duration, ScheduledStartTime, Topic)
- [ ] T104 [P] [US3] Create SessionDto and SessionDetailDto in Backend/CareerRoute.Core/DTOs/Sessions/
- [ ] T105 [P] [US3] Create PaymentRequestDto and PaymentResponseDto in Backend/CareerRoute.Core/DTOs/Payments/
- [ ] T106 [P] [US3] Create RescheduleSessionRequestDto and CancelSessionRequestDto in Backend/CareerRoute.Core/DTOs/Sessions/

**Backend - Database Configuration**

- [ ] T107 [P] [US3] Configure Session entity mapping in Backend/CareerRoute.Infrastructure/Data/Configurations/SessionConfiguration.cs
- [ ] T108 [P] [US3] Configure Payment entity mapping in Backend/CareerRoute.Infrastructure/Data/Configurations/PaymentConfiguration.cs
- [ ] T109 [US3] Update ApplicationDbContext with DbSets for Session and Payment
- [ ] T110 [US3] Create and run EF Core migration for Session and Payment entities
- [ ] T111 [US3] Create database index on Session: IX_Session_MentorId_ScheduledStartTime
- [ ] T112 [US3] Create database index on Session: IX_Session_MenteeId_Status
- [ ] T113 [US3] Create database index on Payment: IX_Payment_TransactionId (unique)

**Backend - External Service Integrations**

- [ ] T114 [P] [US3] Create IPaymentService interface in Backend/CareerRoute.Core/Interfaces/IPaymentService.cs
- [ ] T115 [US3] Implement StripePaymentService in Backend/CareerRoute.Infrastructure/Services/StripePaymentService.cs (authorize, capture, refund, webhooks)
- [ ] T116 [US3] Implement PaymobPaymentService in Backend/CareerRoute.Infrastructure/Services/PaymobPaymentService.cs (Egyptian payment methods)
- [ ] T117 [P] [US3] Create IVideoConferenceService interface in Backend/CareerRoute.Core/Interfaces/IVideoConferenceService.cs
- [ ] T118 [US3] Implement ZoomVideoService in Backend/CareerRoute.Infrastructure/Services/ZoomVideoService.cs (create meeting, generate join link)

**Backend - Repositories**

- [ ] T119 [P] [US3] Create ISessionRepository interface in Backend/CareerRoute.Core/Interfaces/ISessionRepository.cs
- [ ] T120 [P] [US3] Create IPaymentRepository interface in Backend/CareerRoute.Core/Interfaces/IPaymentRepository.cs
- [ ] T121 [P] [US3] Implement SessionRepository in Backend/CareerRoute.Infrastructure/Repositories/SessionRepository.cs
- [ ] T122 [P] [US3] Implement PaymentRepository in Backend/CareerRoute.Infrastructure/Repositories/PaymentRepository.cs

**Backend - Services**

- [ ] T123 [US3] Create ISessionBookingService interface and implement SessionBookingService in Backend/CareerRoute.Application/Services/SessionBookingService.cs (book session, validate availability, create payment)
- [ ] T124 [US3] Create IPaymentProcessingService interface and implement PaymentProcessingService in Backend/CareerRoute.Application/Services/PaymentProcessingService.cs (process payment, calculate commission, handle webhooks)
- [ ] T125 [US3] Enhance IEmailService with session confirmation and reminder email templates

**Backend - Validation**

- [ ] T126 [P] [US3] Create BookSessionRequestValidator in Backend/CareerRoute.Application/Validators/BookSessionRequestValidator.cs
- [ ] T127 [P] [US3] Create session overlap validation logic in SessionBookingService

**Backend - API Controllers**

- [ ] T128 [US3] Implement SessionsController in Backend/CareerRoute.API/Controllers/SessionsController.cs (POST / book, GET /{id}, GET /upcoming, PUT /{id}/reschedule, PUT /{id}/cancel, POST /{id}/start, POST /{id}/complete)
- [ ] T129 [US3] Implement PaymentsController in Backend/CareerRoute.API/Controllers/PaymentsController.cs (POST / process, GET /{id}, GET /history)
- [ ] T130 [US3] Implement webhook endpoints for Stripe and Paymob in PaymentsController (POST /webhooks/stripe, POST /webhooks/paymob)

**Backend - Background Jobs**

- [ ] T131 [US3] Create background job for session reminders (24h and 1h before) using Hangfire or similar
- [ ] T132 [US3] Create background job for automatic payment capture after 72-hour hold
- [ ] T133 [US3] Create background job for session no-show detection (15 minutes after scheduled start)

**Frontend - Models**

- [ ] T134 [P] [US3] Create Session model in Frontend/src/app/shared/models/session.model.ts
- [ ] T135 [P] [US3] Create Payment model in Frontend/src/app/shared/models/payment.model.ts
- [ ] T136 [P] [US3] Create BookingRequest DTOs in Frontend/src/app/shared/models/booking.model.ts

**Frontend - Services**

- [ ] T137 [US3] Create SessionService in Frontend/src/app/core/services/session.service.ts (bookSession, getUpcomingSessions, reschedule, cancel)
- [ ] T138 [US3] Create PaymentService in Frontend/src/app/core/services/payment.service.ts (processPayment, getPaymentHistory)

**Frontend - Sessions Feature Module**

- [ ] T139 [US3] Create SessionBookingComponent in Frontend/src/app/features/sessions/session-booking/session-booking.component.ts (select duration, time slot, proceed to payment)
- [ ] T140 [US3] Create AvailabilityCalendarComponent in Frontend/src/app/features/sessions/availability-calendar/availability-calendar.component.ts (display mentor's available slots)
- [ ] T141 [US3] Create SessionListComponent in Frontend/src/app/features/sessions/session-list/session-list.component.ts (upcoming sessions dashboard)
- [ ] T142 [US3] Create SessionDetailComponent in Frontend/src/app/features/sessions/session-detail/session-detail.component.ts (session details with video link, reschedule, cancel)
- [ ] T143 [US3] Create SessionRoomComponent in Frontend/src/app/features/sessions/session-room/session-room.component.ts (embedded video conference or redirect to Zoom)

**Frontend - Payment Feature Module**

- [ ] T144 [US3] Create PaymentCheckoutComponent in Frontend/src/app/features/payments/payment-checkout/payment-checkout.component.ts (payment method selection, Stripe/Paymob integration)
- [ ] T145 [US3] Create PaymentConfirmationComponent in Frontend/src/app/features/payments/payment-confirmation/payment-confirmation.component.ts (success/failure page)
- [ ] T146 [US3] Create PaymentHistoryComponent in Frontend/src/app/features/payments/payment-history/payment-history.component.ts (list of transactions)

**Frontend - Shared Components**

- [ ] T147 [P] [US3] Create DateTimePickerComponent in Frontend/src/app/shared/components/datetime-picker/datetime-picker.component.ts
- [ ] T148 [P] [US3] Create ConfirmationDialogComponent in Frontend/src/app/shared/components/confirmation-dialog/confirmation-dialog.component.ts (for cancel/reschedule confirmations)

**Frontend - Payment Integration**

- [ ] T149 [US3] Integrate Stripe.js SDK in Frontend (add to index.html and create wrapper service)
- [ ] T150 [US3] Integrate Paymob client SDK in Frontend (add script and create wrapper service)

**Checkpoint**: At this point, User Story 3 should be fully functional - users can book sessions, complete payments via Stripe/Paymob, receive confirmations, view upcoming sessions, reschedule, cancel, and join video sessions

---

## Phase 6: User Story 4 - Admin Platform Management (Priority: P2)

**Goal**: Enable admins to approve mentors, manage categories, view analytics, moderate content, and resolve disputes

**Independent Test**: Login as admin → Review pending mentor applications → Approve/reject mentors → Create/edit categories → View analytics dashboard → Review disputes

### Implementation for User Story 4

**Backend - Domain Layer**

- [ ] T151 [P] [US4] Create Dispute entity in Backend/CareerRoute.Core/Entities/Dispute.cs (SessionId, PaymentId, ComplainantId, DisputeType, Description, Status, ResolutionType, etc.)
- [ ] T152 [P] [US4] Create AdminLog entity in Backend/CareerRoute.Core/Entities/AdminLog.cs (AdminUserId, ActionType, TargetEntity, ActionDescription, OldValues, NewValues, etc.)
- [ ] T153 [P] [US4] Create enums: DisputeType, DisputeStatus, ResolutionType, AdminActionType in Backend/CareerRoute.Core/Enums/

**Backend - DTOs**

- [ ] T154 [P] [US4] Create MentorApplicationDto in Backend/CareerRoute.Core/DTOs/Admin/ (for pending approval review)
- [ ] T155 [P] [US4] Create ApproveMentorRequestDto and RejectMentorRequestDto in Backend/CareerRoute.Core/DTOs/Admin/
- [ ] T156 [P] [US4] Create PlatformAnalyticsDto in Backend/CareerRoute.Core/DTOs/Admin/
- [ ] T157 [P] [US4] Create DisputeDto and ResolveDisputeDto in Backend/CareerRoute.Core/DTOs/Admin/
- [ ] T158 [P] [US4] Create CreateCategoryDto and UpdateCategoryDto in Backend/CareerRoute.Core/DTOs/Categories/

**Backend - Database Configuration**

- [ ] T159 [P] [US4] Configure Dispute entity mapping in Backend/CareerRoute.Infrastructure/Data/Configurations/DisputeConfiguration.cs
- [ ] T160 [P] [US4] Configure AdminLog entity mapping in Backend/CareerRoute.Infrastructure/Data/Configurations/AdminLogConfiguration.cs
- [ ] T161 [US4] Update ApplicationDbContext with DbSets for Dispute and AdminLog
- [ ] T162 [US4] Create and run EF Core migration for Dispute and AdminLog entities
- [ ] T163 [US4] Create database index on Dispute: IX_Dispute_Status

**Backend - Repositories**

- [ ] T164 [P] [US4] Create IDisputeRepository interface in Backend/CareerRoute.Core/Interfaces/IDisputeRepository.cs
- [ ] T165 [P] [US4] Create IAdminLogRepository interface in Backend/CareerRoute.Core/Interfaces/IAdminLogRepository.cs
- [ ] T166 [P] [US4] Implement DisputeRepository in Backend/CareerRoute.Infrastructure/Repositories/DisputeRepository.cs
- [ ] T167 [P] [US4] Implement AdminLogRepository in Backend/CareerRoute.Infrastructure/Repositories/AdminLogRepository.cs

**Backend - Services**

- [ ] T168 [US4] Create IAdminService interface and implement AdminService in Backend/CareerRoute.Application/Services/AdminService.cs (approve/reject mentors, get analytics, moderate content)
- [ ] T169 [US4] Enhance ICategoryService and implement CategoryService for CRUD operations in Backend/CareerRoute.Application/Services/CategoryService.cs
- [ ] T170 [US4] Create audit logging logic in AdminService for all admin actions

**Backend - API Controllers**

- [ ] T171 [US4] Implement AdminController in Backend/CareerRoute.API/Controllers/AdminController.cs (GET /mentors/pending, PUT /mentors/{id}/approve, PUT /mentors/{id}/reject, GET /analytics, GET /disputes, PUT /disputes/{id}/resolve, GET /audit-logs)
- [ ] T172 [US4] Enhance CategoriesController with POST / and PUT /{id} endpoints (admin only) in Backend/CareerRoute.API/Controllers/CategoriesController.cs

**Backend - Authorization**

- [ ] T173 [US4] Add [Authorize(Roles = "Admin")] attribute to all admin endpoints
- [ ] T174 [US4] Create admin role seeding in Database/Scripts/03_SeedAdminUser.sql (admin@careerroute.com)

**Frontend - Models**

- [ ] T175 [P] [US4] Create Analytics model in Frontend/src/app/shared/models/analytics.model.ts
- [ ] T176 [P] [US4] Create Dispute model in Frontend/src/app/shared/models/dispute.model.ts
- [ ] T177 [P] [US4] Create AdminLog model in Frontend/src/app/shared/models/admin-log.model.ts

**Frontend - Services**

- [ ] T178 [US4] Create AdminService in Frontend/src/app/core/services/admin.service.ts (getPendingMentors, approveMentor, rejectMentor, getAnalytics, getDisputes, resolveDispute)
- [ ] T179 [US4] Enhance CategoryService with createCategory and updateCategory methods

**Frontend - Admin Feature Module**

- [ ] T180 [US4] Create AdminDashboardComponent in Frontend/src/app/features/admin/admin-dashboard/admin-dashboard.component.ts (analytics overview)
- [ ] T181 [US4] Create MentorApprovalsComponent in Frontend/src/app/features/admin/mentor-approvals/mentor-approvals.component.ts (list pending mentors)
- [ ] T182 [US4] Create MentorReviewComponent in Frontend/src/app/features/admin/mentor-review/mentor-review.component.ts (approve/reject modal)
- [ ] T183 [US4] Create CategoryManagementComponent in Frontend/src/app/features/admin/category-management/category-management.component.ts (CRUD categories)
- [ ] T184 [US4] Create DisputeListComponent in Frontend/src/app/features/admin/dispute-list/dispute-list.component.ts (list disputes)
- [ ] T185 [US4] Create DisputeDetailComponent in Frontend/src/app/features/admin/dispute-detail/dispute-detail.component.ts (resolve disputes)
- [ ] T186 [US4] Create AuditLogComponent in Frontend/src/app/features/admin/audit-log/audit-log.component.ts (view admin action logs)

**Frontend - Charts/Analytics**

- [ ] T187 [US4] Integrate Chart.js or ng2-charts in Frontend for analytics visualization
- [ ] T188 [US4] Create AnalyticsChartComponent in Frontend/src/app/features/admin/analytics-chart/analytics-chart.component.ts (bookings, revenue trends)

**Checkpoint**: At this point, User Story 4 should be fully functional - admins can manage mentor approvals, categories, view analytics, and handle disputes

---

## Phase 7: User Story 5 - Payment Processing and History (Priority: P2)

**Goal**: Enhanced payment management - view detailed payment history, mentor payout dashboard, refund processing, invoice generation

**Independent Test**: Complete payment → View payment history → View mentor earnings dashboard → Admin processes refund → Download invoice

### Implementation for User Story 5

**Backend - DTOs Enhancement**

- [ ] T189 [P] [US5] Create PaymentHistoryDto in Backend/CareerRoute.Core/DTOs/Payments/
- [ ] T190 [P] [US5] Create MentorEarningsDto in Backend/CareerRoute.Core/DTOs/Payments/
- [ ] T191 [P] [US5] Create RefundRequestDto in Backend/CareerRoute.Core/DTOs/Payments/

**Backend - Services Enhancement**

- [ ] T192 [US5] Enhance IPaymentProcessingService with GetPaymentHistory, GetMentorEarnings, ProcessRefund methods
- [ ] T193 [US5] Implement automatic payout calculation and mentor balance tracking in PaymentProcessingService

**Backend - Invoice Generation**

- [ ] T194 [US5] Create IPdfService interface in Backend/CareerRoute.Core/Interfaces/IPdfService.cs
- [ ] T195 [US5] Implement PdfService using iTextSharp or similar in Backend/CareerRoute.Infrastructure/Services/PdfService.cs (generate invoice PDFs)

**Backend - API Controllers Enhancement**

- [ ] T196 [US5] Enhance PaymentsController with GET /history, POST /{id}/refund, GET /{id}/invoice endpoints

**Backend - Background Jobs**

- [ ] T197 [US5] Create background job for automatic mentor payouts (weekly or threshold-based)

**Frontend - Payment Feature Enhancement**

- [ ] T198 [US5] Enhance PaymentHistoryComponent with filtering, sorting, and search capabilities
- [ ] T199 [US5] Create MentorEarningsComponent in Frontend/src/app/features/payments/mentor-earnings/mentor-earnings.component.ts (earnings dashboard for mentors)
- [ ] T200 [US5] Create InvoiceViewComponent in Frontend/src/app/features/payments/invoice-view/invoice-view.component.ts (download/view invoice)

**Frontend - Shared Components**

- [ ] T201 [P] [US5] Create ExportButtonComponent in Frontend/src/app/shared/components/export-button/export-button.component.ts (export payment history to CSV/PDF)

**Checkpoint**: At this point, User Story 5 should be fully functional - users and mentors have comprehensive payment history, mentors see earnings dashboard, admins can process refunds, invoices are generated

---

## Phase 8: User Story 6 - Post-Session Communication (3-Day Chat Window) (Priority: P3)

**Goal**: Enable mentors and mentees to communicate via chat for 72 hours after session completion with file attachments

**Independent Test**: Complete session → Send chat message → Receive notification → Upload attachment → Chat expires after 3 days → Verify read-only mode

### Implementation for User Story 6

**Backend - Domain Layer**

- [ ] T202 [P] [US6] Create ChatMessage entity in Backend/CareerRoute.Core/Entities/ChatMessage.cs (SessionId, SenderId, RecipientId, MessageText, AttachmentUrl, SentDate, IsRead, etc.)

**Backend - DTOs**

- [ ] T203 [P] [US6] Create SendMessageDto in Backend/CareerRoute.Core/DTOs/Chat/
- [ ] T204 [P] [US6] Create ChatMessageDto in Backend/CareerRoute.Core/DTOs/Chat/
- [ ] T205 [P] [US6] Create ChatHistoryDto in Backend/CareerRoute.Core/DTOs/Chat/

**Backend - Database Configuration**

- [ ] T206 [P] [US6] Configure ChatMessage entity mapping in Backend/CareerRoute.Infrastructure/Data/Configurations/ChatMessageConfiguration.cs
- [ ] T207 [US6] Update ApplicationDbContext with DbSet for ChatMessage
- [ ] T208 [US6] Create and run EF Core migration for ChatMessage entity
- [ ] T209 [US6] Create database index on ChatMessage: IX_ChatMessage_SessionId_SentDate

**Backend - External Service Integration**

- [ ] T210 [P] [US6] Create IStorageService interface in Backend/CareerRoute.Core/Interfaces/IStorageService.cs
- [ ] T211 [US6] Implement AzureBlobStorageService in Backend/CareerRoute.Infrastructure/Services/AzureBlobStorageService.cs (upload attachments, generate SAS tokens for access)

**Backend - SignalR Hub**

- [ ] T212 [US6] Create ChatHub in Backend/CareerRoute.API/Hubs/ChatHub.cs (SendMessage, MarkAsRead, JoinSessionChat methods)
- [ ] T213 [US6] Configure SignalR in Backend/CareerRoute.API/Program.cs

**Backend - Repositories**

- [ ] T214 [P] [US6] Create IChatMessageRepository interface in Backend/CareerRoute.Core/Interfaces/IChatMessageRepository.cs
- [ ] T215 [P] [US6] Implement ChatMessageRepository in Backend/CareerRoute.Infrastructure/Repositories/ChatMessageRepository.cs

**Backend - Services**

- [ ] T216 [US6] Create IChatService interface and implement ChatService in Backend/CareerRoute.Application/Services/ChatService.cs (send message, get history, validate 3-day window, upload attachment)

**Backend - API Controllers**

- [ ] T217 [US6] Implement ChatController in Backend/CareerRoute.API/Controllers/ChatsController.cs (POST /messages, GET /session/{sessionId}/messages, PUT /messages/{id}/read, POST /messages/upload-attachment)

**Backend - Background Jobs**

- [ ] T218 [US6] Create background job to auto-close chat windows after 72 hours (set messages to read-only in business logic)

**Frontend - Models**

- [ ] T219 [P] [US6] Create ChatMessage model in Frontend/src/app/shared/models/chat.model.ts

**Frontend - Services**

- [ ] T220 [US6] Create ChatService in Frontend/src/app/core/services/chat.service.ts (sendMessage, getChatHistory, markAsRead, uploadAttachment)
- [ ] T221 [US6] Create SignalRService in Frontend/src/app/core/services/signalr.service.ts (manage SignalR connection, subscribe to chat events)

**Frontend - Chat Feature Module**

- [ ] T222 [US6] Create ChatWindowComponent in Frontend/src/app/features/chat/chat-window/chat-window.component.ts (full chat interface with messages, input, file upload)
- [ ] T223 [US6] Create ChatMessageComponent in Frontend/src/app/features/chat/chat-message/chat-message.component.ts (individual message display)
- [ ] T224 [US6] Create ChatAttachmentComponent in Frontend/src/app/features/chat/chat-attachment/chat-attachment.component.ts (file upload and preview)

**Frontend - Real-time Integration**

- [ ] T225 [US6] Install @microsoft/signalr npm package in Frontend
- [ ] T226 [US6] Integrate SignalR connection in ChatService (connect on session page load, disconnect on leave)

**Frontend - Notifications**

- [ ] T227 [US6] Create NotificationService integration for new chat messages (toast/badge notifications)
- [ ] T228 [US6] Enhance EmailService to send email notifications for new chat messages

**Checkpoint**: At this point, User Story 6 should be fully functional - users and mentors can chat in real-time post-session, upload files, receive notifications, and chat auto-closes after 3 days

---

## Phase 9: User Story 7 - Group Sessions (Priority: P3)

**Goal**: Enable mentors to create group sessions with max participants, users to book group sessions at discounted rates, and handle group video conferencing

**Independent Test**: Mentor creates group session → Multiple users book same session → Session reaches capacity → All participants join video conference → Recording available to participants

### Implementation for User Story 7

**Backend - Domain Enhancement**

- [ ] T229 [US7] Enhance Session entity with MaxParticipants, CurrentParticipants fields for group sessions
- [ ] T230 [US7] Create SessionParticipant junction table/entity to track multiple participants per group session
- [ ] T231 [US7] Create migration for group session enhancements

**Backend - DTOs**

- [ ] T232 [P] [US7] Create CreateGroupSessionDto in Backend/CareerRoute.Core/DTOs/Sessions/
- [ ] T233 [P] [US7] Create GroupSessionDto in Backend/CareerRoute.Core/DTOs/Sessions/
- [ ] T234 [P] [US7] Create JoinGroupSessionDto in Backend/CareerRoute.Core/DTOs/Sessions/

**Backend - Services Enhancement**

- [ ] T235 [US7] Enhance ISessionBookingService with CreateGroupSession, JoinGroupSession, CheckCapacity methods
- [ ] T236 [US7] Enhance IVideoConferenceService to support group sessions (larger participant limits)

**Backend - API Controllers Enhancement**

- [ ] T237 [US7] Enhance SessionsController with POST /group (create group session), POST /group/{id}/join (join group session)

**Frontend - Models**

- [ ] T238 [P] [US7] Enhance Session model with group session fields

**Frontend - Services Enhancement**

- [ ] T239 [US7] Enhance SessionService with createGroupSession, joinGroupSession, getGroupSessions methods

**Frontend - Group Session Feature**

- [ ] T240 [US7] Create CreateGroupSessionComponent in Frontend/src/app/features/sessions/create-group-session/create-group-session.component.ts (mentor-only, create group session form)
- [ ] T241 [US7] Create GroupSessionListComponent in Frontend/src/app/features/sessions/group-session-list/group-session-list.component.ts (browse available group sessions)
- [ ] T242 [US7] Create GroupSessionDetailComponent in Frontend/src/app/features/sessions/group-session-detail/group-session-detail.component.ts (show participants, available spots)

**Checkpoint**: At this point, User Story 7 should be fully functional - mentors can create group sessions, users can join at discounted rates, sessions handle multiple participants

---

## Phase 10: User Story 8 - Ratings and Reviews (Priority: P3)

**Goal**: Enable users to rate and review mentors after sessions, display ratings on profiles, influence search results, and allow admin moderation

**Independent Test**: Complete session → Submit rating (1-5 stars) → Write review → Review appears on mentor profile → Review influences search ranking → Admin moderates review

### Implementation for User Story 8

**Backend - Domain Layer**

- [ ] T243 [P] [US8] Create Review entity in Backend/CareerRoute.Core/Entities/Review.cs (SessionId, MenteeId, MentorId, Rating, ReviewText, IsVisible, ModeratedBy, etc.)

**Backend - DTOs**

- [ ] T244 [P] [US8] Create CreateReviewDto in Backend/CareerRoute.Core/DTOs/Reviews/
- [ ] T245 [P] [US8] Create ReviewDto in Backend/CareerRoute.Core/DTOs/Reviews/
- [ ] T246 [P] [US8] Create UpdateReviewDto in Backend/CareerRoute.Core/DTOs/Reviews/

**Backend - Database Configuration**

- [ ] T247 [P] [US8] Configure Review entity mapping in Backend/CareerRoute.Infrastructure/Data/Configurations/ReviewConfiguration.cs
- [ ] T248 [US8] Update ApplicationDbContext with DbSet for Review
- [ ] T249 [US8] Create and run EF Core migration for Review entity
- [ ] T250 [US8] Create database index on Review: IX_Review_MentorId_IsVisible
- [ ] T251 [US8] Create database trigger to update Mentor.AverageRating and Mentor.TotalReviews on Review INSERT/UPDATE/DELETE

**Backend - Repositories**

- [ ] T252 [P] [US8] Create IReviewRepository interface in Backend/CareerRoute.Core/Interfaces/IReviewRepository.cs
- [ ] T253 [P] [US8] Implement ReviewRepository in Backend/CareerRoute.Infrastructure/Repositories/ReviewRepository.cs

**Backend - Services**

- [ ] T254 [US8] Create IReviewService interface and implement ReviewService in Backend/CareerRoute.Application/Services/ReviewService.cs (create review, get reviews for mentor, update mentor ratings, moderate review)

**Backend - Validation**

- [ ] T255 [P] [US8] Create CreateReviewValidator in Backend/CareerRoute.Application/Validators/CreateReviewValidator.cs (rating 1-5, min text length, session completed, one review per session)

**Backend - API Controllers**

- [ ] T256 [US8] Implement ReviewsController in Backend/CareerRoute.API/Controllers/ReviewsController.cs (POST / submit, GET /session/{sessionId}, PUT /{id}, DELETE /{id} admin only)

**Frontend - Models**

- [ ] T257 [P] [US8] Create Review model in Frontend/src/app/shared/models/review.model.ts

**Frontend - Services**

- [ ] T258 [US8] Create ReviewService in Frontend/src/app/core/services/review.service.ts (createReview, getReviewsForMentor, updateReview)

**Frontend - Review Feature**

- [ ] T259 [US8] Create WriteReviewComponent in Frontend/src/app/features/reviews/write-review/write-review.component.ts (star rating input, text area)
- [ ] T260 [US8] Create ReviewListComponent in Frontend/src/app/features/reviews/review-list/review-list.component.ts (display on mentor profile)
- [ ] T261 [US8] Create ReviewCardComponent in Frontend/src/app/features/reviews/review-card/review-card.component.ts (individual review display)

**Frontend - Shared Components**

- [ ] T262 [P] [US8] Create RatingInputComponent in Frontend/src/app/shared/components/rating-input/rating-input.component.ts (interactive star rating)

**Frontend - Integration**

- [ ] T263 [US8] Integrate ReviewListComponent into MentorDetailComponent
- [ ] T264 [US8] Add "Write Review" prompt in SessionDetailComponent after session completion

**Checkpoint**: At this point, User Story 8 should be fully functional - users can rate/review mentors, reviews display on profiles, influence search, and admins can moderate

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and final production readiness

**Security & Performance**

- [ ] T265 [P] Implement rate limiting middleware in Backend/CareerRoute.API/Middleware/RateLimitingMiddleware.cs (5 login attempts per 15 min, 100 API requests per minute)
- [ ] T266 [P] Add input sanitization for all user-generated content (XSS prevention)
- [ ] T267 [P] Implement HTTPS enforcement in Backend/CareerRoute.API/Program.cs
- [ ] T268 [P] Add SQL injection prevention verification (parameterized queries via EF Core)
- [ ] T269 [P] Implement security headers using NWebsec in Backend
- [ ] T270 [P] Add frontend route guards for all protected pages

**Error Handling & Logging**

- [ ] T271 [P] Enhance global exception handler with detailed error logging
- [ ] T272 [P] Add structured logging with Serilog in Backend
- [ ] T273 [P] Implement error tracking integration (e.g., Sentry) in Frontend

**Performance Optimization**

- [ ] T274 [P] Add caching strategy for frequently accessed data (categories, mentor list) using Redis or in-memory cache
- [ ] T275 [P] Optimize database queries with eager loading and pagination
- [ ] T276 [P] Implement lazy loading for Angular feature modules
- [ ] T277 [P] Add image optimization and CDN integration for profile pictures

**Documentation**

- [ ] T278 [P] Generate comprehensive Swagger/OpenAPI documentation with examples
- [ ] T279 [P] Create API usage guide in Docs/API/
- [ ] T280 [P] Document deployment process in Docs/Deployment/DeploymentGuide.md
- [ ] T281 [P] Create architecture diagram in Docs/Architecture/SystemArchitecture.md

**Testing & Quality**

- [ ] T282 [P] Add unit tests for critical business logic (payment processing, session booking)
- [ ] T283 [P] Add integration tests for API endpoints
- [ ] T284 [P] Add E2E tests for critical user flows (registration → booking → payment)
- [ ] T285 [P] Run security audit and penetration testing
- [ ] T286 [P] Perform load testing with 500 concurrent users

**Deployment Preparation**

- [ ] T287 [P] Configure production environment variables and secrets
- [ ] T288 [P] Setup Azure App Service deployment slots (staging, production)
- [ ] T289 [P] Configure Azure SQL Database with backups
- [ ] T290 [P] Setup Azure Blob Storage with lifecycle policies (3-day expiry)
- [ ] T291 [P] Configure SendGrid production API key and email templates
- [ ] T292 [P] Setup Stripe and Paymob production accounts and webhooks
- [ ] T293 [P] Configure Zoom production API credentials
- [ ] T294 [P] Setup monitoring and alerting (Application Insights or similar)
- [ ] T295 [P] Create database backup and recovery procedures

**Final Validation**

- [ ] T296 Run quickstart.md validation (verify all setup steps work)
- [ ] T297 Verify all 28 success criteria from spec.md are met
- [ ] T298 Conduct accessibility audit (WCAG 2.1 AA compliance)
- [ ] T299 Perform browser compatibility testing (Chrome, Firefox, Edge, Safari)
- [ ] T300 Conduct user acceptance testing with team

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup (Phase 1) completion - **BLOCKS all user stories**
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2) completion - Foundation for authentication
- **User Story 2 (Phase 4)**: Depends on Foundational (Phase 2) + User Story 1 completion - Needs Mentor entities
- **User Story 3 (Phase 5)**: Depends on Foundational (Phase 2) + User Story 1 + User Story 2 completion - Needs User and Mentor entities
- **User Story 4 (Phase 6)**: Depends on Foundational (Phase 2) + User Story 1 completion - Can run parallel with US2/US3
- **User Story 5 (Phase 7)**: Depends on User Story 3 completion - Enhances payment functionality
- **User Story 6 (Phase 8)**: Depends on User Story 3 completion - Requires Session entity
- **User Story 7 (Phase 9)**: Depends on User Story 3 completion - Enhances session functionality
- **User Story 8 (Phase 10)**: Depends on User Story 3 completion - Requires Session entity
- **Polish (Phase 11)**: Depends on all desired user stories being complete

### Critical Path for MVP (User Stories 1, 2, 3 only)

1. Phase 1: Setup → Phase 2: Foundational (completes ~T001-T027)
2. Phase 3: User Story 1 (completes ~T028-T076) - Registration & Profiles
3. Phase 4: User Story 2 (completes ~T077-T099) - Search & Browse (can partially overlap with US1 using different files)
4. Phase 5: User Story 3 (completes ~T100-T150) - Booking & Payment
5. Selected items from Phase 11: Polish (security, deployment)

**MVP Total**: ~150-180 tasks

### Parallel Opportunities

**Within Foundational Phase (Phase 2)**:

- T015-T016 (repositories), T017-T018 (middleware), T022-T025 (Angular interceptors/guards) can run in parallel

**Within User Story 1 (Phase 3)**:

- T028-T032 (entities) can run in parallel
- T033-T037 (DTOs) can run in parallel
- T038-T040 (configurations) can run in parallel
- T043-T048 (repositories) can run in parallel
- T054-T056 (validators) can run in parallel
- T061-T063 (frontend models) can run in parallel
- T067-T070 (auth components) can run in parallel
- T075-T076 (shared components) can run in parallel

**Across User Stories**:

- After Foundational completes: US1, US4 can start in parallel (different domains)
- After US1 completes: US2 and US4 can run in parallel
- After US3 completes: US5, US6, US7, US8 can all run in parallel (if staffed)

**Team of 6 Developers - Suggested Allocation**:

- **Week 1-2**: All 6 on Setup + Foundational (pair programming)
- **Week 3-4**:
  - Developers 1-2: User Story 1 backend
  - Developers 3-4: User Story 1 frontend
  - Developers 5-6: User Story 4 (admin) in parallel
- **Week 5-6**:
  - Developers 1-2: User Story 2 backend
  - Developers 3-4: User Story 2 frontend
  - Developers 5-6: Continue User Story 4
- **Week 7-9**:
  - Developers 1-3: User Story 3 backend (complex: payment + video)
  - Developers 4-6: User Story 3 frontend
- **Week 10**:
  - All 6: Integration testing and bug fixes for MVP (US1-3)
- **Week 11-12**:
  - Developers 1-2: User Story 5 (payment history)
  - Developers 3-4: User Story 6 (chat)
  - Developers 5-6: User Stories 7-8 (group sessions, reviews)

---

## Parallel Example: User Story 1 Backend Entities

```bash
# Launch all entity creation tasks together:
Task T028: "Create User entity in Backend/CareerRoute.Core/Entities/User.cs"
Task T029: "Create Mentor entity in Backend/CareerRoute.Core/Entities/Mentor.cs"
Task T030: "Create Category entity in Backend/CareerRoute.Core/Entities/Category.cs"
Task T031: "Create MentorCategory junction entity in Backend/CareerRoute.Core/Entities/MentorCategory.cs"
Task T032: "Create enums in Backend/CareerRoute.Core/Enums/"
```

## Parallel Example: User Story 3 Frontend Components

```bash
# Launch all session component creation tasks together:
Task T139: "Create SessionBookingComponent"
Task T140: "Create AvailabilityCalendarComponent"
Task T141: "Create SessionListComponent"
Task T142: "Create SessionDetailComponent"
Task T143: "Create SessionRoomComponent"
```

---

## Implementation Strategy

### MVP First (User Stories 1, 2, 3 Only)

1. Complete Phase 1: Setup (~9 tasks)
2. Complete Phase 2: Foundational (~18 tasks) - **CRITICAL BLOCKER**
3. Complete Phase 3: User Story 1 (~49 tasks) - Registration & Profiles
4. Complete Phase 4: User Story 2 (~23 tasks) - Search & Browse
5. Complete Phase 5: User Story 3 (~51 tasks) - Booking & Payment
6. **STOP and VALIDATE**: Test end-to-end user flow
7. Add selected polish tasks (security, deployment basics)
8. Deploy MVP

**MVP Total**: ~150 tasks, estimated 10-12 weeks with 6 developers

### Incremental Delivery

1. **Foundation Milestone**: Setup + Foundational complete (~27 tasks, week 1-2)
2. **MVP v0.1**: Add User Story 1 → Authentication working (week 3-4)
3. **MVP v0.2**: Add User Story 2 → Search working (week 5-6)
4. **MVP v1.0**: Add User Story 3 → Full booking flow working (week 7-9) → **FIRST DEPLOYABLE VERSION**
5. **v1.1**: Add User Story 4 → Admin panel (week 10)
6. **v1.2**: Add User Story 5 → Enhanced payments (week 11)
7. **v1.3**: Add User Stories 6-8 → Chat, groups, reviews (week 12)
8. **v2.0**: Polish + production deployment (week 13+)

### Parallel Team Strategy

With 6 full-stack .NET developers:

1. **Weeks 1-2**: Team completes Setup + Foundational together (pair programming, knowledge sharing)
2. **Weeks 3-4**: Split into 3 pairs:
   - Pair A: US1 backend entities + services
   - Pair B: US1 frontend auth + profile components
   - Pair C: US4 admin backend (can start early)
3. **Weeks 5-6**: Regroup:
   - Pair A: US2 backend search + filtering
   - Pair B: US2 frontend search UI
   - Pair C: US4 admin frontend
4. **Weeks 7-9**: All hands on US3 (most complex):
   - 3 devs on backend (payment integration, video service, session booking)
   - 3 devs on frontend (booking flow, payment checkout, session management)
5. **Week 10**: Full team integration testing, bug fixes, MVP validation
6. **Weeks 11-12**: Split again for P2/P3 features
7. **Week 13+**: Production deployment, monitoring, polish

---

## Task Summary

**Total Tasks**: 300
**Tasks by Phase**:

- Phase 1 (Setup): 9 tasks
- Phase 2 (Foundational): 18 tasks
- Phase 3 (US1 - Registration): 49 tasks
- Phase 4 (US2 - Search): 23 tasks
- Phase 5 (US3 - Booking): 51 tasks
- Phase 6 (US4 - Admin): 36 tasks
- Phase 7 (US5 - Payment History): 13 tasks
- Phase 8 (US6 - Chat): 27 tasks
- Phase 9 (US7 - Group Sessions): 15 tasks
- Phase 10 (US8 - Reviews): 22 tasks
- Phase 11 (Polish): 37 tasks

**MVP Scope (US1-3)**: 150 tasks
**Full Platform (All US)**: 300 tasks

**Parallel Opportunities**:

- Phase 1: 8 of 9 tasks can run in parallel
- Phase 2: 12 of 18 tasks can run in parallel
- Within each user story: 30-50% of tasks can run in parallel
- Across user stories: After foundational, up to 3 user stories can proceed in parallel with proper team allocation

**Independent Test Criteria** (from spec.md):

- **US1**: Create account → Verify email → Login → Update profile ✅
- **US2**: Browse categories → Search → Filter → View profile ✅
- **US3**: Book session → Pay → Receive confirmation → Join video ✅
- **US4**: Admin login → Approve mentor → View analytics ✅
- **US5**: View payment history → See mentor earnings → Download invoice ✅
- **US6**: Complete session → Send chat → Upload file → Chat expires ✅
- **US7**: Create group session → Multiple users join → Video conference ✅
- **US8**: Submit review → View on profile → Influence search ✅

---

## Notes

- **[P] markers**: Tasks with different files and no dependencies can run in parallel
- **[Story] labels**: Map each task to specific user story for traceability and independent delivery
- **Foundational phase is CRITICAL**: No user story work can begin until Phase 2 completes
- **MVP recommendation**: Focus on US1-3 (150 tasks) for first deployment
- **Each user story is independently testable**: Can validate and deploy incrementally
- **Tests are NOT included**: Not requested in specification - add if TDD approach desired
- **Commit frequently**: After each task or logical group of parallel tasks
- **Validate at checkpoints**: Test each user story independently before proceeding
- **File paths are explicit**: All task descriptions include exact file locations per plan.md structure
