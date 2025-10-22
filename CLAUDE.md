# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Career Route** is a full-stack mentorship platform graduation project built with ASP.NET Core 8.0 (Backend) and Angular 20 (Frontend). The platform connects mentees with mentors for career guidance through virtual mentorship sessions.

**Core Features:**
- User and mentor registration with role-based authentication
- Browse/search mentors by specialization and filters
- Book and manage mentorship sessions with integrated video conferencing
- Payment processing with commission splits
- Admin dashboard for platform management
- Real-time chat using SignalR

## Repository Structure

```
.
├── Backend/              # ASP.NET Core 8.0 Web API
│   ├── Backend.sln       # Solution file
│   ├── CareerRoute.API/             # Presentation layer
│   ├── CareerRoute.Core/            # Domain + Application layer (currently combined)
│   └── CareerRoute.Infrastructure/  # Data access and external services
├── Frontend/             # Angular 20 application
│   └── src/app/          # Application components
└── Documents/            # Project documentation
    ├── backend-architecture-review.md
    ├── git-branching-strategy.md
    └── specifications.md
```

## Backend Architecture

The backend follows **Clean Architecture principles** with three main projects:

### Layer Structure

1. **CareerRoute.API** (Presentation Layer)
   - Controllers for REST API endpoints
   - Middleware (exception handling, rate limiting, logging)
   - Filters for validation and authorization
   - Dependencies: Core, Infrastructure

2. **CareerRoute.Core** (Domain + Application Layer - Currently Combined)
   - `Domain/Entities/`: Domain models
   - `Domain/Interfaces/`: Repository contracts
   - `DTOs/`: Data transfer objects (Auth, Users, Sessions)
   - `Services/`: Application services and domain logic
   - `Validators/`: FluentValidation rules
   - `Mappings/`: AutoMapper profiles
   - `Exceptions/`: Custom exceptions
   - Dependencies: None (should be dependency-free)

3. **CareerRoute.Infrastructure** (Infrastructure Layer)
   - `Data/`: Entity Framework Core DbContext and configurations
   - `Repositories/`: Repository implementations
   - `Services/`: External service integrations (email, payment, storage, video conferencing)
   - Dependencies: Core

### Important Architecture Note

**⚠️ Architecture Violation Exists**: According to Documents/backend-architecture-review.md, the current structure has DTOs in the Core layer, which violates Clean Architecture. DTOs should be moved to an Application layer or remain in Core only if truly domain-centric. Be aware of this when making architectural decisions.

**Dependency Flow**: API → Infrastructure → Core (Core should have NO dependencies)

## Common Development Commands

### Backend (.NET)

```bash
# Navigate to backend
cd Backend

# Restore dependencies
dotnet restore

# Build solution
dotnet build

# Run API (from Backend/CareerRoute.API/)
cd CareerRoute.API
dotnet run

# Run tests (when test project exists)
dotnet test

# Add EF Core migration
dotnet ef migrations add MigrationName --project CareerRoute.Infrastructure --startup-project CareerRoute.API

# Update database
dotnet ef database update --project CareerRoute.Infrastructure --startup-project CareerRoute.API

# List migrations
dotnet ef migrations list --project CareerRoute.Infrastructure --startup-project CareerRoute.API

# Remove last migration (if not applied)
dotnet ef migrations remove --project CareerRoute.Infrastructure --startup-project CareerRoute.API
```

### Frontend (Angular)

```bash
# Navigate to frontend
cd Frontend

# Install dependencies
npm install

# Start development server (http://localhost:4200)
npm start
# or
ng serve

# Build for production
npm run build
# or
ng build

# Run tests
npm test
# or
ng test

# Generate component
ng generate component component-name

# Generate service
ng generate service services/service-name

# Generate module
ng generate module modules/module-name
```

## Configuration

### Backend Configuration

The backend uses `appsettings.json` for configuration. A template file exists at:
- `Backend/CareerRoute.API/appsettings.TEMPLATE.json`

**Required Configuration Sections:**
- `ConnectionStrings`: SQL Server database connection
- `JwtSettings`: JWT authentication (SecretKey, Issuer, Audience, token expiration)
- `EmailSettings`: SendGrid for email notifications
- `PaymentSettings`: Stripe integration (15% platform commission)
- `StorageSettings`: Azure Blob Storage for file uploads
- `VideoConferencingSettings`: Zoom API for virtual sessions
- `SignalRSettings`: Real-time chat configuration
- `RateLimitSettings`: API rate limiting (100 requests per 60 seconds default)
- `ApplicationSettings`: Business rules (session duration, booking windows, pricing limits)

**Never commit actual appsettings.json with secrets** - use appsettings.TEMPLATE.json as reference.

### Frontend Configuration

- Angular CLI configuration in `angular.json`
- Prettier configuration embedded in `package.json`
- Bootstrap 5.3.8 for styling

## Git Workflow

This project follows a **Git Flow branching strategy**. See `Documents/git-branching-strategy.md` for complete details.

### Branch Structure

```
main (production-ready)
  └── develop (integration branch)
      ├── feature/backend/<feature-name>
      ├── feature/frontend/<feature-name>
      └── bugfix/<description>
```

### Working on Features

```bash
# Always branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/backend/my-feature

# Commit frequently with conventional commits
git commit -m "feat(auth): Add JWT token generation"
git commit -m "fix(booking): Resolve double-booking issue"

# Push and create PR to develop
git push -u origin feature/backend/my-feature
```

### Commit Message Format

Use **Conventional Commits**:
```
<type>(<scope>): <description>

Types: feat, fix, docs, style, refactor, test, chore, perf
Examples:
  feat(auth): Add user registration endpoint
  fix(sessions): Resolve timezone bug in booking calendar
  docs(api): Update authentication documentation
  test(payments): Add unit tests for Stripe integration
```

### Branch Naming Convention

```
feature/backend/<feature-name>    # Backend features
feature/frontend/<feature-name>   # Frontend features
feature/<shared-feature-name>     # Full-stack features
bugfix/<description>              # Bug fixes
release/<version>                 # Release branches
```

## Key Technologies

### Backend Stack
- .NET 8.0
- ASP.NET Core Web API
- Entity Framework Core 8.0.21 (SQL Server)
- ASP.NET Identity for authentication
- JWT Bearer authentication
- SignalR for real-time communication
- AspNetCoreRateLimit for API rate limiting
- Swagger/Swashbuckle for API documentation

### Frontend Stack
- Angular 20.3.0
- Bootstrap 5.3.8
- RxJS 7.8.0
- Karma + Jasmine for testing

### External Integrations
- **Email**: SendGrid
- **Payments**: Stripe (15% platform commission)
- **Storage**: Azure Blob Storage
- **Video Conferencing**: Zoom API
- **Database**: SQL Server

## Testing Strategy

### Backend Testing
- Unit tests should use xUnit or NUnit (test project not yet created)
- Mock external services (IPaymentService, IEmailService, etc.)
- Test domain logic in Core layer independently
- Integration tests for API endpoints and database operations

### Frontend Testing
- Unit tests with Jasmine and Karma
- Run tests: `ng test`
- Test files located alongside components (*.spec.ts)

## Domain Model Key Entities

Based on the architecture, the main domain entities include:
- **User**: Platform users (mentees)
- **Mentor**: Service providers with profiles and specializations
- **Session**: Scheduled mentorship sessions with video conference links
- **Payment**: Transaction records with commission tracking
- **Category**: Specialization categories for mentor discovery
- **Review**: Post-session ratings and feedback
- **ChatMessage**: Real-time messaging between users and mentors

## API Development Guidelines

### When adding new endpoints:

1. Define entity in `CareerRoute.Core/Domain/Entities/`
2. Create repository interface in `CareerRoute.Core/Domain/Interfaces/`
3. Implement repository in `CareerRoute.Infrastructure/Repositories/`
4. Create DTOs in `CareerRoute.Core/DTOs/`
5. Add service in `CareerRoute.Core/Services/`
6. Implement controller in `CareerRoute.API/Controllers/`
7. Add validation in `CareerRoute.Core/Validators/`
8. Configure EF mapping in `CareerRoute.Infrastructure/Data/`

### Running the API locally:

1. Ensure SQL Server is running
2. Update connection string in `appsettings.Development.json`
3. Run migrations: `dotnet ef database update`
4. Start API: `dotnet run` from CareerRoute.API directory
5. Access Swagger UI: `https://localhost:<port>/swagger`

## Frontend Development Guidelines

### Component Organization
- Follow Angular standalone components pattern (v20+)
- Place shared components in `src/app/shared/`
- Feature modules should be self-contained
- Use services for API communication and state management

### Styling
- Bootstrap 5.3.8 is available globally
- Component-specific styles in `.css` files alongside components
- Global styles in `src/styles.css`

## Important Business Rules

These are defined in `ApplicationSettings` configuration:
- Minimum session duration: 30 minutes
- Maximum session duration: 180 minutes
- Minimum advance booking: 24 hours
- Cancellation window: 24 hours (full refund if >48 hours)
- Platform commission: 15%
- Session price range: $20 - $500

## Documentation Resources

- **Architecture Review**: `Documents/backend-architecture-review.md` - Detailed Clean Architecture analysis with refactoring recommendations
- **Git Strategy**: `Documents/git-branching-strategy.md` - Complete Git workflow and conventions
- **Specifications**: `Documents/specifications.md` - User stories and acceptance criteria
- **API Contracts**: `Documents/contracts/` - API endpoint specifications

## Common Troubleshooting

### Backend Issues

**Database connection fails:**
- Verify SQL Server is running
- Check connection string in appsettings.json
- Ensure database exists or run `dotnet ef database update`

**Migration errors:**
- Always specify both `--project` (Infrastructure) and `--startup-project` (API)
- Run from Backend directory: `dotnet ef migrations add Name --project CareerRoute.Infrastructure --startup-project CareerRoute.API`

### Frontend Issues

**Port 4200 already in use:**
- Use: `ng serve --port 4201`

**Module not found errors:**
- Run: `npm install`
- Clear cache: `npm cache clean --force && npm install`

## Development Environment Setup

1. **Install Prerequisites:**
   - .NET 8.0 SDK
   - Node.js 18+ and npm
   - SQL Server (LocalDB or full instance)
   - Git

2. **Clone and Setup Backend:**
   ```bash
   cd Backend
   dotnet restore
   cp CareerRoute.API/appsettings.TEMPLATE.json CareerRoute.API/appsettings.Development.json
   # Edit appsettings.Development.json with your configuration
   dotnet ef database update --project CareerRoute.Infrastructure --startup-project CareerRoute.API
   cd CareerRoute.API
   dotnet run
   ```

3. **Clone and Setup Frontend:**
   ```bash
   cd Frontend
   npm install
   npm start
   ```

4. **Verify Setup:**
   - Backend API: https://localhost:<port>/swagger
   - Frontend: http://localhost:4200
