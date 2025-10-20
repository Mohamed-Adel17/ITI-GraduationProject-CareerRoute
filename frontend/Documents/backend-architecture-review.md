# Backend Architecture Review: Clean Architecture Analysis

## Executive Summary

This document reviews the backend folder structure proposed in `plan.md` against clean architecture principles. Several violations were identified that could impact maintainability, testability, and scalability.

**Key Issues Found:**
- ❌ DTOs placed in Core layer (violates domain independence)
- ❌ Infrastructure service interfaces mixed with domain interfaces in Core
- ⚠️ Missing domain-specific folders (ValueObjects, DomainServices, Events)
- ⚠️ Exceptions not properly segregated by layer

**Status**: **Requires Refactoring** before implementation

---

## 1. Current Structure Analysis

### Current Backend Structure (from plan.md)

```
Backend/
├── CareerRoute.API/                        # ✅ Presentation Layer
│   ├── Controllers/
│   ├── Middleware/
│   ├── Filters/
│   ├── Program.cs
│   └── appsettings.json
│
├── CareerRoute.Core/                       # ⚠️ Domain Layer (has violations)
│   ├── Entities/                           # ✅ CORRECT
│   ├── Enums/                              # ✅ CORRECT
│   ├── Interfaces/                         # ❌ MIXED (repositories + infrastructure)
│   │   ├── IUserRepository.cs              # ✅ Domain interface
│   │   ├── IMentorRepository.cs            # ✅ Domain interface
│   │   ├── ISessionRepository.cs           # ✅ Domain interface
│   │   ├── IPaymentService.cs              # ❌ Infrastructure interface
│   │   ├── IVideoConferenceService.cs      # ❌ Infrastructure interface
│   │   ├── IEmailService.cs                # ❌ Infrastructure interface
│   │   └── IStorageService.cs              # ❌ Infrastructure interface
│   └── DTOs/                               # ❌ WRONG LAYER (belongs in Application)
│       ├── Auth/
│       ├── Users/
│       ├── Mentors/
│       ├── Sessions/
│       └── Payments/
│
├── CareerRoute.Application/                # ⚠️ Application Layer (incomplete)
│   ├── Services/                           # ✅ CORRECT
│   ├── Validators/                         # ✅ CORRECT
│   ├── Mappings/                           # ✅ CORRECT
│   └── Exceptions/                         # ⚠️ Should split (domain vs app)
│
├── CareerRoute.Infrastructure/             # ✅ Infrastructure Layer
│   ├── Data/
│   ├── Repositories/
│   ├── Services/
│   └── Identity/
│
└── CareerRoute.Tests/                      # ✅ Test Layer
```

---

## 2. Clean Architecture Violations

### 2.1 DTOs in Core Layer ❌

**Problem**: DTOs are data transfer objects used for external communication (API contracts, inter-layer data transfer). Placing them in the Core layer violates the **Dependency Inversion Principle** and makes the domain layer dependent on external concerns.

**Current Location**: `CareerRoute.Core/DTOs/`

**Why It's Wrong**:
```
Core (Domain) should be the innermost layer with ZERO external dependencies.
DTOs are used by Application/API layers to communicate with external systems.
Domain entities should not know about DTOs.
```

**Example Impact**:
```csharp
// WRONG: Domain layer depends on DTO
namespace CareerRoute.Core.Entities
{
    public class User
    {
        // If DTOs are in Core, you might be tempted to:
        public UserDto ToDto() { ... } // ❌ Domain knows about DTOs
    }
}

// CORRECT: DTOs in Application layer
namespace CareerRoute.Application.Services
{
    public class UserService
    {
        public UserDto GetUser(int id)
        {
            var user = _repository.GetById(id); // Domain entity
            return _mapper.Map<UserDto>(user);   // Map in Application layer
        }
    }
}
```

**Correct Location**: `CareerRoute.Application/DTOs/`

---

### 2.2 Infrastructure Service Interfaces in Core ❌

**Problem**: Interfaces for external services (payments, email, video conferencing, storage) should not be in the Core layer. These are infrastructure concerns, not domain concerns.

**Current Location**: `CareerRoute.Core/Interfaces/`
- `IPaymentService.cs`
- `IVideoConferenceService.cs`
- `IEmailService.cs`
- `IStorageService.cs`

**Why It's Wrong**:
```
Core should only contain:
  - Domain entity interfaces
  - Repository interfaces (for domain aggregates)
  - Domain service interfaces (for complex domain logic)

Infrastructure concerns like payment gateways, email providers, and storage
are implementation details that shouldn't pollute the domain layer.
```

**Dependency Issue**:
```
Current (WRONG):
Core defines IPaymentService → Infrastructure implements it
Problem: Core knows about infrastructure concerns

Correct:
Application defines IPaymentService → Infrastructure implements it
Benefit: Core remains pure, Application orchestrates infrastructure
```

**Example**:
```csharp
// WRONG: In Core layer
namespace CareerRoute.Core.Interfaces
{
    public interface IPaymentService // ❌ Infrastructure concern in domain
    {
        Task<PaymentResult> ProcessPayment(PaymentRequest request);
    }
}

// CORRECT: In Application layer
namespace CareerRoute.Application.Interfaces
{
    public interface IPaymentService // ✅ Application orchestrates infrastructure
    {
        Task<PaymentResult> ProcessPayment(PaymentRequest request);
    }
}
```

**Correct Location**: `CareerRoute.Application/Interfaces/`

---

### 2.3 Missing Domain-Specific Structures ⚠️

**Problem**: The Core layer is missing important domain-driven design patterns.

#### Missing: ValueObjects
```csharp
// Example: Instead of primitive obsession
public class Mentor
{
    public string Email { get; set; }        // ❌ No validation
    public decimal HourlyRate { get; set; }  // ❌ No currency info
}

// Better: Use Value Objects
public class Mentor
{
    public Email Email { get; private set; }           // ✅ Always valid
    public Money HourlyRate { get; private set; }      // ✅ With currency
}

public class Email : ValueObject
{
    public string Value { get; }
    public Email(string value)
    {
        if (!IsValid(value)) throw new InvalidEmailException();
        Value = value;
    }
}
```

#### Missing: DomainServices
```csharp
// Complex domain logic that doesn't fit in entities
public interface ISessionSchedulingService
{
    bool CanScheduleSession(Mentor mentor, DateTime proposedTime);
    void ValidateSessionOverlap(List<Session> existingSessions, Session newSession);
}
```

#### Missing: Domain Events
```csharp
// For loosely coupled domain logic
public class SessionBookedEvent : DomainEvent
{
    public int SessionId { get; set; }
    public int MentorId { get; set; }
    public int MenteeId { get; set; }
    public DateTime BookedAt { get; set; }
}
```

---

### 2.4 Exception Handling Not Segregated ⚠️

**Problem**: All exceptions are in `CareerRoute.Application/Exceptions/`, but domain exceptions should be in Core.

**Types of Exceptions**:

| Exception Type | Layer | Example |
|---------------|-------|---------|
| Domain Exceptions | **Core** | `EntityNotFoundException`, `BusinessRuleViolationException` |
| Application Exceptions | **Application** | `ValidationException`, `AuthorizationException` |
| Infrastructure Exceptions | **Infrastructure** | `DatabaseConnectionException`, `ExternalServiceException` |

**Example Structure**:
```csharp
// Core/Exceptions/DomainException.cs
namespace CareerRoute.Core.Exceptions
{
    public abstract class DomainException : Exception
    {
        protected DomainException(string message) : base(message) { }
    }
    
    public class EntityNotFoundException : DomainException
    {
        public EntityNotFoundException(string entityName, object id)
            : base($"{entityName} with id {id} not found") { }
    }
}

// Application/Exceptions/ApplicationException.cs
namespace CareerRoute.Application.Exceptions
{
    public class ValidationException : Exception
    {
        public ValidationException(string message) : base(message) { }
    }
}
```

---

## 3. Clean Architecture Principles Refresher

### The Dependency Rule

```
┌─────────────────────────────────────┐
│         External Systems            │
│    (Database, APIs, UI, etc.)       │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Infrastructure Layer           │
│  (EF Core, External Services)       │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Application Layer              │
│   (Use Cases, DTOs, Services)       │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│        Core (Domain) Layer          │
│  (Entities, Value Objects, Rules)   │
│         NO DEPENDENCIES             │
└─────────────────────────────────────┘
```

**Key Rule**: Dependencies flow INWARD. The Core layer has no dependencies on outer layers.

### Layer Responsibilities

| Layer | Responsibilities | What It Contains |
|-------|-----------------|------------------|
| **Core (Domain)** | Business logic, domain rules | Entities, Value Objects, Domain Services, Repository Interfaces, Domain Events, Domain Exceptions |
| **Application** | Use cases, orchestration, workflows | DTOs, Application Services, Validators, Mappers, Infrastructure Interfaces, Application Exceptions |
| **Infrastructure** | External concerns, data access | EF Core, Repositories, External Service Implementations, File Storage, Email Providers |
| **API (Presentation)** | User interface, HTTP concerns | Controllers, Middleware, Filters, API Models |

---

## 4. Proposed Corrected Structure

### Complete Refactored Backend Structure

```
Backend/
├── CareerRoute.API/                        # ✅ Presentation Layer
│   ├── Controllers/                        # API endpoints
│   │   ├── AuthController.cs
│   │   ├── UsersController.cs
│   │   ├── MentorsController.cs
│   │   ├── SessionsController.cs
│   │   ├── PaymentsController.cs
│   │   ├── CategoriesController.cs
│   │   ├── ReviewsController.cs
│   │   ├── ChatsController.cs
│   │   └── AdminController.cs
│   ├── Middleware/                         # Custom middleware
│   │   ├── ExceptionHandlingMiddleware.cs
│   │   ├── RateLimitingMiddleware.cs
│   │   └── RequestLoggingMiddleware.cs
│   ├── Filters/                            # Action filters
│   │   ├── ValidateModelFilter.cs
│   │   └── AuthorizationFilter.cs
│   ├── ViewModels/                         # NEW: API-specific request/response models
│   │   ├── Requests/
│   │   └── Responses/
│   ├── Extensions/                         # NEW: Service registration extensions
│   │   └── ServiceCollectionExtensions.cs
│   ├── Program.cs
│   ├── appsettings.json
│   └── appsettings.Development.json
│
├── CareerRoute.Core/                       # ✅ Domain Layer (Pure Domain Logic)
│   ├── Entities/                           # Domain models (Aggregates)
│   │   ├── User.cs
│   │   ├── Mentor.cs
│   │   ├── Session.cs
│   │   ├── Payment.cs
│   │   ├── Category.cs
│   │   ├── Review.cs
│   │   ├── ChatMessage.cs
│   │   ├── Dispute.cs
│   │   └── AdminLog.cs
│   │
│   ├── ValueObjects/                       # NEW: Immutable value objects
│   │   ├── Email.cs
│   │   ├── Money.cs
│   │   ├── PhoneNumber.cs
│   │   ├── TimeSlot.cs
│   │   └── Rating.cs
│   │
│   ├── Enums/                              # Shared enumerations
│   │   ├── SessionStatus.cs
│   │   ├── PaymentStatus.cs
│   │   ├── UserRole.cs
│   │   └── DisputeStatus.cs
│   │
│   ├── Interfaces/                         # Domain contracts only
│   │   ├── Repositories/                   # Repository interfaces
│   │   │   ├── IUserRepository.cs
│   │   │   ├── IMentorRepository.cs
│   │   │   ├── ISessionRepository.cs
│   │   │   ├── IPaymentRepository.cs
│   │   │   ├── IReviewRepository.cs
│   │   │   └── IUnitOfWork.cs
│   │   └── DomainServices/                 # Domain service interfaces
│   │       ├── ISessionSchedulingService.cs
│   │       └── IPricingService.cs
│   │
│   ├── DomainServices/                     # NEW: Complex domain logic
│   │   ├── SessionSchedulingService.cs     # Business rules for scheduling
│   │   └── PricingService.cs               # Commission calculation, discounts
│   │
│   ├── Exceptions/                         # NEW: Domain exceptions only
│   │   ├── DomainException.cs              # Base domain exception
│   │   ├── EntityNotFoundException.cs
│   │   ├── BusinessRuleViolationException.cs
│   │   ├── InvalidEntityStateException.cs
│   │   └── DuplicateEntityException.cs
│   │
│   ├── Events/                             # NEW: Domain events (optional)
│   │   ├── SessionBookedEvent.cs
│   │   ├── PaymentProcessedEvent.cs
│   │   ├── ReviewSubmittedEvent.cs
│   │   └── DisputeCreatedEvent.cs
│   │
│   └── Specifications/                     # NEW: Query specifications (optional)
│       ├── MentorSpecifications.cs
│       └── SessionSpecifications.cs
│
├── CareerRoute.Application/                # ✅ Application Layer (Use Cases)
│   ├── DTOs/                               # MOVED from Core
│   │   ├── Auth/
│   │   │   ├── LoginRequestDto.cs
│   │   │   ├── RegisterRequestDto.cs
│   │   │   └── TokenResponseDto.cs
│   │   ├── Users/
│   │   │   ├── UserDto.cs
│   │   │   └── UpdateUserDto.cs
│   │   ├── Mentors/
│   │   │   ├── MentorDto.cs
│   │   │   ├── MentorProfileDto.cs
│   │   │   └── MentorSearchDto.cs
│   │   ├── Sessions/
│   │   │   ├── SessionDto.cs
│   │   │   ├── BookSessionDto.cs
│   │   │   └── SessionDetailsDto.cs
│   │   └── Payments/
│   │       ├── PaymentDto.cs
│   │       └── PaymentRequestDto.cs
│   │
│   ├── Interfaces/                         # NEW: Infrastructure service contracts
│   │   ├── IPaymentService.cs              # MOVED from Core
│   │   ├── IVideoConferenceService.cs      # MOVED from Core
│   │   ├── IEmailService.cs                # MOVED from Core
│   │   ├── IStorageService.cs              # MOVED from Core
│   │   ├── INotificationService.cs
│   │   └── ICacheService.cs
│   │
│   ├── Services/                           # Application services (Use cases)
│   │   ├── UserService.cs
│   │   ├── MentorService.cs
│   │   ├── SessionBookingService.cs
│   │   ├── PaymentProcessingService.cs
│   │   ├── SearchService.cs
│   │   ├── ReviewService.cs
│   │   └── AdminService.cs
│   │
│   ├── UseCases/                           # NEW: Explicit use case handlers (optional)
│   │   ├── Sessions/
│   │   │   ├── BookSessionUseCase.cs
│   │   │   └── CancelSessionUseCase.cs
│   │   └── Payments/
│   │       └── ProcessRefundUseCase.cs
│   │
│   ├── Validators/                         # FluentValidation validators
│   │   ├── RegisterUserValidator.cs
│   │   ├── BookSessionValidator.cs
│   │   └── SubmitReviewValidator.cs
│   │
│   ├── Mappings/                           # AutoMapper profiles
│   │   ├── UserMappingProfile.cs
│   │   ├── MentorMappingProfile.cs
│   │   └── SessionMappingProfile.cs
│   │
│   ├── Exceptions/                         # Application-level exceptions
│   │   ├── ValidationException.cs
│   │   ├── AuthorizationException.cs
│   │   └── ApplicationException.cs
│   │
│   └── Behaviors/                          # NEW: Pipeline behaviors (MediatR)
│       ├── ValidationBehavior.cs
│       └── LoggingBehavior.cs
│
├── CareerRoute.Infrastructure/             # ✅ Infrastructure Layer
│   ├── Data/                               # EF Core context
│   │   ├── ApplicationDbContext.cs
│   │   ├── Configurations/                 # Entity configurations
│   │   │   ├── UserConfiguration.cs
│   │   │   ├── MentorConfiguration.cs
│   │   │   └── SessionConfiguration.cs
│   │   └── Migrations/
│   │
│   ├── Repositories/                       # Repository implementations
│   │   ├── UserRepository.cs
│   │   ├── MentorRepository.cs
│   │   ├── SessionRepository.cs
│   │   └── UnitOfWork.cs
│   │
│   ├── Services/                           # External service integrations
│   │   ├── Payments/
│   │   │   ├── StripePaymentService.cs
│   │   │   └── PaymobPaymentService.cs
│   │   ├── VideoConference/
│   │   │   └── ZoomVideoService.cs
│   │   ├── Email/
│   │   │   └── SendGridEmailService.cs
│   │   ├── Storage/
│   │   │   └── AzureBlobStorageService.cs
│   │   ├── Notifications/
│   │   │   └── FirebaseNotificationService.cs
│   │   └── Cache/
│   │       └── RedisCacheService.cs
│   │
│   ├── Identity/                           # ASP.NET Identity configuration
│   │   ├── ApplicationUser.cs
│   │   ├── ApplicationRole.cs
│   │   └── IdentityConfig.cs
│   │
│   └── Persistence/                        # NEW: Database seeding, migrations
│       ├── DbInitializer.cs
│       └── SeedData.cs
│
└── CareerRoute.Tests/
    ├── Unit/                               # Unit tests (xUnit + Moq)
    │   ├── Core/                           # NEW: Domain logic tests
    │   │   ├── Entities/
    │   │   ├── ValueObjects/
    │   │   └── DomainServices/
    │   ├── Application/                    # NEW: Application service tests
    │   │   ├── Services/
    │   │   └── Validators/
    │   └── API/                            # Controller tests
    │       └── Controllers/
    │
    ├── Integration/                        # Integration tests
    │   ├── API/                            # API integration tests
    │   ├── Database/                       # Database integration tests
    │   └── ExternalServices/               # External service integration tests
    │
    └── E2E/                                # End-to-end tests (Playwright)
        └── Scenarios/
```

---

## 5. Dependency Flow Diagrams

### Current Structure (WRONG)

```
┌─────────────────────────────────────────────────────────┐
│                     CareerRoute.API                     │
│                   (Presentation Layer)                  │
└────────────────────────┬────────────────────────────────┘
                         │ depends on
                         ▼
┌─────────────────────────────────────────────────────────┐
│                 CareerRoute.Application                 │
│                  (Application Layer)                    │
└────────────────────────┬────────────────────────────────┘
                         │ depends on
                         ▼
┌─────────────────────────────────────────────────────────┐
│                   CareerRoute.Core                      │
│  ❌ Contains DTOs (API concern)                         │
│  ❌ Contains IPaymentService (Infrastructure concern)   │
│                                                          │
│  Problem: Core knows about outer layer concerns!        │
└─────────────────────────────────────────────────────────┘
                         ▲
                         │ depends on (WRONG!)
┌────────────────────────┴────────────────────────────────┐
│              CareerRoute.Infrastructure                 │
│                (Infrastructure Layer)                   │
└─────────────────────────────────────────────────────────┘
```

### Corrected Structure (CORRECT)

```
┌─────────────────────────────────────────────────────────┐
│                     CareerRoute.API                     │
│   Controllers → Application Services → DTOs             │
└────────────────────────┬────────────────────────────────┘
                         │ references
                         ▼
┌─────────────────────────────────────────────────────────┐
│                 CareerRoute.Application                 │
│  ✅ DTOs (Data Transfer Objects)                        │
│  ✅ Application Services (Use Cases)                    │
│  ✅ Infrastructure Interfaces (IPaymentService, etc.)   │
│  ✅ Validators, Mappers                                 │
└─────┬───────────────────────────────────────────────┬───┘
      │ references                                    │ references
      ▼                                               ▼
┌─────────────────────────────────────┐   ┌──────────────────────────────┐
│        CareerRoute.Core             │   │  CareerRoute.Infrastructure  │
│  ✅ Entities, Value Objects         │   │  ✅ EF Core, Repositories     │
│  ✅ Domain Services                 │   │  ✅ External Services         │
│  ✅ Repository Interfaces           │   │     (implements interfaces   │
│  ✅ Business Rules                  │   │      from Application)       │
│  ✅ Domain Events                   │   └──────────┬───────────────────┘
│                                     │              │
│  NO DEPENDENCIES ON OUTER LAYERS   │              │ references
└─────────────────────────────────────┘              │
                    ▲                                │
                    │ implements interfaces          │
                    └────────────────────────────────┘
```

### Detailed Dependency Graph

```
┌───────────────────────────────────────────────────────────────┐
│                         API Layer                             │
│  • Controllers use Application Services                       │
│  • Controllers use DTOs for request/response                  │
│  • Middleware handles cross-cutting concerns                  │
│                                                                │
│  Dependencies: Application                                    │
└───────────────────────────────┬───────────────────────────────┘
                                │
                                ▼
┌───────────────────────────────────────────────────────────────┐
│                    Application Layer                          │
│  • Defines DTOs for data transfer                             │
│  • Defines interfaces for infrastructure (IPaymentService)    │
│  • Implements use cases using domain entities                 │
│  • Orchestrates domain logic and infrastructure               │
│                                                                │
│  Dependencies: Core                                           │
│  Implemented By: Infrastructure (for infrastructure services) │
└─────────────────┬─────────────────────────────────────────────┘
                  │
                  ▼
┌───────────────────────────────────────────────────────────────┐
│                        Core Layer                             │
│  • Contains domain entities (User, Mentor, Session)           │
│  • Contains value objects (Email, Money)                      │
│  • Contains domain services (business logic)                  │
│  • Contains repository interfaces (IUserRepository)           │
│  • Contains domain events                                     │
│                                                                │
│  Dependencies: NONE (Pure domain logic)                       │
└───────────────────────────────────────────────────────────────┘
                  ▲
                  │ implements
                  │
┌─────────────────┴─────────────────────────────────────────────┐
│                   Infrastructure Layer                        │
│  • Implements repository interfaces from Core                 │
│  • Implements service interfaces from Application             │
│  • EF Core, database access                                   │
│  • External API integrations                                  │
│                                                                │
│  Dependencies: Core, Application                              │
└───────────────────────────────────────────────────────────────┘
```

---

## 6. Migration Guide

### Step-by-Step Refactoring Instructions

#### Step 1: Move DTOs from Core to Application
```bash
# Move DTOs folder
mv Backend/CareerRoute.Core/DTOs Backend/CareerRoute.Application/DTOs
```

**Files to Update**:
- Update namespace references in all files from `CareerRoute.Core.DTOs` to `CareerRoute.Application.DTOs`
- Update `using` statements in services and controllers

#### Step 2: Create Application/Interfaces Folder
```bash
mkdir Backend/CareerRoute.Application/Interfaces
```

**Move Infrastructure Service Interfaces**:
- Move `IPaymentService.cs` from `Core/Interfaces/` to `Application/Interfaces/`
- Move `IVideoConferenceService.cs` from `Core/Interfaces/` to `Application/Interfaces/`
- Move `IEmailService.cs` from `Core/Interfaces/` to `Application/Interfaces/`
- Move `IStorageService.cs` from `Core/Interfaces/` to `Application/Interfaces/`

**Update Namespaces**:
```csharp
// Change from:
namespace CareerRoute.Core.Interfaces

// To:
namespace CareerRoute.Application.Interfaces
```

#### Step 3: Reorganize Core/Interfaces
```bash
mkdir Backend/CareerRoute.Core/Interfaces/Repositories
mkdir Backend/CareerRoute.Core/Interfaces/DomainServices
```

**Move Repository Interfaces**:
- Move `IUserRepository.cs` to `Core/Interfaces/Repositories/`
- Move `IMentorRepository.cs` to `Core/Interfaces/Repositories/`
- Move `ISessionRepository.cs` to `Core/Interfaces/Repositories/`

#### Step 4: Add Missing Domain Structures
```bash
mkdir Backend/CareerRoute.Core/ValueObjects
mkdir Backend/CareerRoute.Core/DomainServices
mkdir Backend/CareerRoute.Core/Events
```

**Create Example Value Object**:
```csharp
// Core/ValueObjects/Email.cs
namespace CareerRoute.Core.ValueObjects
{
    public class Email : ValueObject
    {
        public string Value { get; private set; }

        public Email(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
                throw new ArgumentException("Email cannot be empty");
            
            if (!IsValidEmail(value))
                throw new ArgumentException("Invalid email format");
            
            Value = value.ToLowerInvariant();
        }

        private bool IsValidEmail(string email)
        {
            return Regex.IsMatch(email, @"^[^@\s]+@[^@\s]+\.[^@\s]+$");
        }

        protected override IEnumerable<object> GetEqualityComponents()
        {
            yield return Value;
        }
    }
}
```

#### Step 5: Split Exceptions
```bash
mkdir Backend/CareerRoute.Core/Exceptions
```

**Move Domain Exceptions to Core**:
```csharp
// Core/Exceptions/DomainException.cs
namespace CareerRoute.Core.Exceptions
{
    public abstract class DomainException : Exception
    {
        protected DomainException(string message) : base(message) { }
    }
}

// Core/Exceptions/EntityNotFoundException.cs
namespace CareerRoute.Core.Exceptions
{
    public class EntityNotFoundException : DomainException
    {
        public EntityNotFoundException(string entityName, object id)
            : base($"{entityName} with id {id} not found") { }
    }
}
```

**Keep Application Exceptions in Application**:
```csharp
// Application/Exceptions/ValidationException.cs
namespace CareerRoute.Application.Exceptions
{
    public class ValidationException : Exception
    {
        public Dictionary<string, string[]> Errors { get; }

        public ValidationException(Dictionary<string, string[]> errors)
            : base("Validation failed")
        {
            Errors = errors;
        }
    }
}
```

#### Step 6: Update Project References

**CareerRoute.API.csproj**:
```xml
<ItemGroup>
  <ProjectReference Include="..\CareerRoute.Application\CareerRoute.Application.csproj" />
  <ProjectReference Include="..\CareerRoute.Infrastructure\CareerRoute.Infrastructure.csproj" />
</ItemGroup>
```

**CareerRoute.Application.csproj**:
```xml
<ItemGroup>
  <ProjectReference Include="..\CareerRoute.Core\CareerRoute.Core.csproj" />
</ItemGroup>
```

**CareerRoute.Infrastructure.csproj**:
```xml
<ItemGroup>
  <ProjectReference Include="..\CareerRoute.Core\CareerRoute.Core.csproj" />
  <ProjectReference Include="..\CareerRoute.Application\CareerRoute.Application.csproj" />
</ItemGroup>
```

**CareerRoute.Core.csproj**:
```xml
<ItemGroup>
  <!-- NO EXTERNAL PROJECT REFERENCES -->
</ItemGroup>
```

#### Step 7: Verify Dependencies
Run this check to ensure Core has no dependencies:
```bash
# Core should have NO dependencies on Application or Infrastructure
dotnet list Backend/CareerRoute.Core/CareerRoute.Core.csproj reference
# Expected output: No project references (except maybe test utilities)
```

---

## 7. Benefits of Corrected Structure

### 7.1 Maintainability ✅
- **Clear Separation of Concerns**: Each layer has distinct responsibilities
- **Easier to Locate Code**: Developers know exactly where to find/add code
- **Reduced Coupling**: Changes in infrastructure don't affect domain logic

### 7.2 Testability ✅
- **Pure Domain Logic**: Core layer can be tested without any external dependencies
- **Easy Mocking**: Infrastructure interfaces in Application layer are easy to mock
- **Fast Unit Tests**: Domain tests run without database or external services

**Example**:
```csharp
// Testing domain logic without infrastructure
[Fact]
public void SessionSchedulingService_PreventOverlappingSessions()
{
    // Arrange - Pure domain objects
    var service = new SessionSchedulingService();
    var existingSessions = new List<Session>
    {
        new Session { StartTime = DateTime.Now, Duration = 60 }
    };
    var newSession = new Session 
    { 
        StartTime = DateTime.Now.AddMinutes(30), 
        Duration = 60 
    };

    // Act & Assert - No database needed!
    Assert.Throws<BusinessRuleViolationException>(() =>
        service.ValidateSessionOverlap(existingSessions, newSession)
    );
}
```

### 7.3 Scalability ✅
- **Pluggable Infrastructure**: Easy to swap implementations (e.g., Stripe → PayPal)
- **Microservices Ready**: Core can be shared across multiple services
- **Independent Deployment**: Layers can evolve independently

### 7.4 Team Collaboration ✅
- **Parallel Development**: Teams can work on different layers simultaneously
- **Clear Contracts**: Interfaces define boundaries between layers
- **Onboarding**: New developers understand architecture quickly

### 7.5 Code Quality ✅
- **Enforces Best Practices**: Structure guides developers to write clean code
- **Prevents Circular Dependencies**: Compiler enforces dependency flow
- **Domain-Driven Design**: Encourages thinking in business terms

---

## 8. Comparison Table

| Aspect | Current Structure | Corrected Structure | Impact |
|--------|-------------------|---------------------|--------|
| **DTOs Location** | ❌ Core/DTOs | ✅ Application/DTOs | Domain layer stays pure |
| **Infrastructure Interfaces** | ❌ Core/Interfaces | ✅ Application/Interfaces | Core independent of infrastructure |
| **Value Objects** | ❌ Missing | ✅ Core/ValueObjects | Better domain modeling |
| **Domain Services** | ❌ Missing | ✅ Core/DomainServices | Complex domain logic has a home |
| **Exception Segregation** | ❌ All in Application | ✅ Split by layer | Clear exception hierarchy |
| **Domain Events** | ❌ Missing | ✅ Core/Events | Loosely coupled domain logic |
| **Core Dependencies** | ❌ Knows about DTOs, infrastructure | ✅ Zero dependencies | Truly independent domain |
| **Testability** | ⚠️ Domain tests need mocking | ✅ Pure domain testing | Faster, simpler tests |

---

## 9. Code Examples

### 9.1 Entity with Value Objects

**Before (Current)**:
```csharp
// Core/Entities/Mentor.cs
public class Mentor
{
    public int Id { get; set; }
    public string Email { get; set; }              // ❌ No validation
    public string PhoneNumber { get; set; }        // ❌ No format enforcement
    public decimal HourlyRate { get; set; }        // ❌ No currency info
    public string Bio { get; set; }
}
```

**After (Corrected)**:
```csharp
// Core/Entities/Mentor.cs
public class Mentor
{
    public int Id { get; private set; }
    public Email Email { get; private set; }           // ✅ Always valid
    public PhoneNumber PhoneNumber { get; private set; } // ✅ Format enforced
    public Money HourlyRate { get; private set; }      // ✅ With currency
    public string Bio { get; private set; }
    
    private Mentor() { } // EF Core constructor
    
    public Mentor(Email email, PhoneNumber phoneNumber, Money hourlyRate, string bio)
    {
        Email = email ?? throw new ArgumentNullException(nameof(email));
        PhoneNumber = phoneNumber ?? throw new ArgumentNullException(nameof(phoneNumber));
        HourlyRate = hourlyRate ?? throw new ArgumentNullException(nameof(hourlyRate));
        Bio = bio;
    }
    
    public void UpdateHourlyRate(Money newRate)
    {
        if (newRate.Amount < 10)
            throw new BusinessRuleViolationException("Hourly rate must be at least $10");
        
        HourlyRate = newRate;
    }
}

// Core/ValueObjects/Money.cs
public class Money : ValueObject
{
    public decimal Amount { get; private set; }
    public string Currency { get; private set; }
    
    public Money(decimal amount, string currency = "USD")
    {
        if (amount < 0)
            throw new ArgumentException("Amount cannot be negative");
        
        Amount = amount;
        Currency = currency;
    }
    
    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Amount;
        yield return Currency;
    }
}
```

### 9.2 Application Service Using Infrastructure Interface

**Before (Current - Wrong)**:
```csharp
// Core/Interfaces/IPaymentService.cs - ❌ In Core layer
namespace CareerRoute.Core.Interfaces
{
    public interface IPaymentService { }
}

// Application/Services/PaymentProcessingService.cs
namespace CareerRoute.Application.Services
{
    public class PaymentProcessingService
    {
        private readonly IPaymentService _paymentService; // ❌ Core interface
        
        public PaymentProcessingService(IPaymentService paymentService)
        {
            _paymentService = paymentService;
        }
    }
}
```

**After (Corrected)**:
```csharp
// Application/Interfaces/IPaymentService.cs - ✅ In Application layer
namespace CareerRoute.Application.Interfaces
{
    public interface IPaymentService
    {
        Task<PaymentResult> ProcessPayment(PaymentRequest request);
        Task<RefundResult> ProcessRefund(string paymentId);
    }
}

// Application/Services/PaymentProcessingService.cs
namespace CareerRoute.Application.Services
{
    public class PaymentProcessingService
    {
        private readonly IPaymentService _paymentService;
        private readonly ISessionRepository _sessionRepository; // ✅ Core interface
        
        public PaymentProcessingService(
            IPaymentService paymentService,
            ISessionRepository sessionRepository)
        {
            _paymentService = paymentService;
            _sessionRepository = sessionRepository;
        }
        
        public async Task<PaymentDto> ProcessSessionPayment(int sessionId)
        {
            // Get domain entity from Core repository
            var session = await _sessionRepository.GetByIdAsync(sessionId);
            if (session == null)
                throw new EntityNotFoundException(nameof(Session), sessionId);
            
            // Use infrastructure service to process payment
            var result = await _paymentService.ProcessPayment(new PaymentRequest
            {
                Amount = session.TotalAmount.Amount,
                Currency = session.TotalAmount.Currency
            });
            
            // Map to DTO and return
            return new PaymentDto { /* ... */ };
        }
    }
}

// Infrastructure/Services/Payments/StripePaymentService.cs - ✅ Implements Application interface
namespace CareerRoute.Infrastructure.Services.Payments
{
    public class StripePaymentService : IPaymentService // ✅ From Application layer
    {
        public async Task<PaymentResult> ProcessPayment(PaymentRequest request)
        {
            // Stripe implementation
        }
    }
}
```

### 9.3 Domain Service with Business Logic

```csharp
// Core/DomainServices/SessionSchedulingService.cs
namespace CareerRoute.Core.DomainServices
{
    public class SessionSchedulingService : ISessionSchedulingService
    {
        public bool CanScheduleSession(Mentor mentor, DateTime proposedTime)
        {
            // Business rule: Mentor must have at least 24 hours notice
            if (proposedTime < DateTime.UtcNow.AddHours(24))
                return false;
            
            // Business rule: Sessions only during business hours
            if (proposedTime.Hour < 9 || proposedTime.Hour > 18)
                return false;
            
            return true;
        }
        
        public void ValidateSessionOverlap(List<Session> existingSessions, Session newSession)
        {
            foreach (var existing in existingSessions)
            {
                var existingEnd = existing.StartTime.AddMinutes(existing.Duration);
                var newEnd = newSession.StartTime.AddMinutes(newSession.Duration);
                
                bool overlaps = 
                    (newSession.StartTime >= existing.StartTime && newSession.StartTime < existingEnd) ||
                    (newEnd > existing.StartTime && newEnd <= existingEnd);
                
                if (overlaps)
                    throw new BusinessRuleViolationException(
                        "New session overlaps with existing session");
            }
        }
    }
}
```

---

## 10. Recommendations

### Immediate Actions (High Priority)
1. ✅ **Move DTOs** from Core to Application layer
2. ✅ **Move Infrastructure Interfaces** from Core to Application layer
3. ✅ **Split Exceptions** by layer (domain exceptions in Core)
4. ✅ **Update Project References** to enforce dependency flow

### Short-Term Improvements (Medium Priority)
5. ✅ **Add ValueObjects Folder** and create Email, Money, PhoneNumber value objects
6. ✅ **Add DomainServices Folder** and move complex business logic
7. ✅ **Reorganize Core/Interfaces** into Repositories and DomainServices subfolders

### Long-Term Enhancements (Low Priority)
8. ⚠️ **Add Domain Events** for loosely coupled domain logic
9. ⚠️ **Add Specifications Pattern** for complex queries
10. ⚠️ **Consider CQRS** for read/write separation if needed

---

## 11. Conclusion

The current backend structure has several violations of clean architecture principles, primarily:
- DTOs in the Core layer
- Infrastructure service interfaces in the Core layer
- Missing domain-specific structures (value objects, domain services)
- Improper exception segregation

**Recommendation**: **Refactor before starting implementation** to avoid technical debt and ensure maintainability, testability, and scalability.

**Effort Estimate**: 2-3 days of refactoring work to align with clean architecture principles.

**Risk of Not Refactoring**: Increased technical debt, harder to test, difficult to swap implementations, circular dependencies, and poor separation of concerns.

---

## References

- **Clean Architecture** by Robert C. Martin
- **Domain-Driven Design** by Eric Evans
- **ASP.NET Core Architecture** - Microsoft Documentation
- **The Dependency Inversion Principle** - SOLID Principles

---

**Document Version**: 1.0  
**Last Updated**: 2024  
**Author**: Architecture Review Team  
**Status**: Approved for Implementation
