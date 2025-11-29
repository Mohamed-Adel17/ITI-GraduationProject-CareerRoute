# CareerRoute - The AI-Powered Mentorship Platform

## Presentation Guide Document

> **Purpose:** This document serves as a comprehensive reference guide for the team when preparing presentation slides. It contains detailed information about each section to ensure consistent and thorough coverage of all platform aspects.

---

## Table of Contents

### [Introduction (All Team)](#introduction-all-team)
- [Section 1: Title + Team + Outline](#section-1-title--team--outline)
- [Section 2: Problem Statement](#section-2-problem-statement)
- [Section 3: Solution Overview](#section-3-solution-overview)
- [Section 4: Related Work / Competitors](#section-4-related-work--competitors)
- [Section 5: Business Model & Target Audience](#section-5-business-model--target-audience)

### [Shehata — Technical Architecture](#shehata--technical-architecture)
- [Section 6: Tech Stack & Infrastructure](#section-6-tech-stack--infrastructure)
- [Section 7: Backend Architecture (Clean Architecture)](#section-7-backend-architecture-clean-architecture)
- [Section 8: Frontend Architecture (Angular)](#section-8-frontend-architecture-angular)
- [Section 9: Database Design & Entities](#section-9-database-design--entities)

### [Shoeib — User Journey & Authentication](#shoeib--user-journey--authentication)
- [Section 10: User Journey (Mentor & Mentee Flows)](#section-10-user-journey-mentor--mentee-flows)
- [Section 11: Authentication & User Management](#section-11-authentication--user-management)

### [Alyaa — Mentor Discovery & Session Management](#alyaa--mentor-discovery--session-management)
- [Section 12: Mentor Onboarding & Discovery](#section-12-mentor-onboarding--discovery)
- [Section 13: Session Scheduling & Lifecycle](#section-13-session-scheduling--lifecycle)

### [Abdelfattah — Payments, Admin & Notifications](#abdelfattah--payments-admin--notifications)
- [Section 14: Payments & Financial Model](#section-14-payments--financial-model)
- [Section 15: Admin Dashboard](#section-15-admin-dashboard)
- [Section 16: Notifications & Communication Layer](#section-16-notifications--communication-layer)

### [Adel — Video Conferencing & AI Intelligence](#adel--video-conferencing--ai-intelligence)
- [Section 17: Video Conferencing (Zoom Automation)](#section-17-video-conferencing-zoom-automation)
- [Section 18: AI-Powered Session Intelligence](#section-18-ai-powered-session-intelligence)

### [Hisham — Development Workflow, Demo & Closing](#hisham--development-workflow-demo--closing)
- [Section 19: Git/GitHub & Development Workflow (Optional)](#section-19-gitgithub--development-workflow-optional)
- [Section 20: Testing & Quality Assurance](#section-20-testing--quality-assurance)
- [Section 21: Live Demo](#section-21-live-demo)
- [Section 22: Future Roadmap](#section-22-future-roadmap)
- [Section 23: Conclusion & Q&A](#section-23-conclusion--qa)

### [Appendix: Quick Reference](#appendix-quick-reference)

---

# Introduction (All Team)

> **Sections 1-5** — Shared presentation by all team members

## Section 1: Title + Team + Outline

**Content to Include:**
- Project name: **CareerRoute**
- Tagline: "The AI-Powered Mentorship Platform"
- Team members with roles
- Brief presentation agenda/outline

---

## Section 2: Problem Statement

**Problem for Users (Students, Graduates, Early Professionals):**
- **Lack of guidance:** They don't know what exact skills are needed to succeed in their desired career paths
- **Information overload:** Free content on YouTube or social media is too generic, conflicting, and not tailored to their personal situation
- **Accessibility issues:** Formal coaching programs are often expensive, in English only, and not adapted to the local job market
- **Missed opportunities:** Without proper guidance, they waste months or years experimenting, choosing the wrong paths, or failing interviews

**Problem for Experts (Professionals with 3–10+ years of experience):**
- **Untapped value:** They hold practical, real-world knowledge but lack a structured channel to share and monetize it
- **Scattered platforms:** LinkedIn and Facebook groups allow knowledge sharing, but not in a professional, monetized, or organized way
- **Barrier to entry:** Starting private coaching requires marketing and trust-building—too complex for most individuals

**Core Need Statement:**
> There is a strong need for a centralized, easy-to-use, and trusted platform where learners can instantly access verified experts in their field, book short personalized sessions, and get practical, affordable career guidance. At the same time, experts need a platform that makes it simple to share their experience, build credibility, and earn income without the hassle of self-promotion or complicated setup.

---

## Section 3: Solution Overview

**For Users (Students, Graduates, Early Professionals):**
- **Simple onboarding & profile creation:** Users can quickly register, indicate their career interests, and discover relevant mentors
- **Verified mentors:** Only vetted professionals with real-world experience are listed, ensuring trustworthy guidance
- **Personalized sessions:** Instead of generic content, users can book short, focused 1:1 sessions tailored to their career goals
- **Affordable & accessible:** Sessions are offered at transparent, competitive prices adapted to the local market and language
- **Practical insights:** Direct, actionable advice on skills, interview preparation, and career decisions

**For Mentors (Professionals & Experts):**
- **Easy registration & profile setup:** Mentors showcase their expertise without needing to handle marketing or tech setup
- **Session management:** Mentors can list session types and set their own prices and availability
- **Monetization made simple:** Built-in payments allow experts to instantly monetize their knowledge
- **Professional platform:** Structured, trusted environment for mentorship

**Core Value Proposition:**
> Direct mentor-mentee matching, easy booking, and affordable sessions delivering a working solution without unnecessary complexity.

---

## Section 4: Related Work / Competitors

| Platform | Focus | Gap We Fill |
|----------|-------|-------------|
| **Calendly** | Scheduling only | No mentorship features, payments, or AI |
| **MentorCruise** | Long-term mentorship | Expensive, not localized for MENA |
| **Zoom** | Video conferencing | No booking, payments, or mentor discovery |
| **Topmate** | Creator monetization | Limited to creators, no career focus |
| **LinkedIn** | Professional networking | No structured mentorship or payments |

**Our Differentiators:**
- Arabic-first, localized for Egypt/MENA market
- Integrated end-to-end platform (discovery → booking → payment → video → AI insights)
- Local payment methods (Paymob, Vodafone Cash, InstaPay)
- AI-powered session intelligence

---

## Section 5: Business Model & Target Audience

**Target Audience:**

*Primary Users (Mentees):*
- University students & fresh graduates (18–28)
- Early-career professionals / juniors seeking upskilling or career switches
- Freelancers seeking mentorship to grow their business

*Secondary Users (Mentors):*
- Professionals with 3–10+ years of experience in Tech, Marketing, HR, Finance, Design
- Interested in sharing knowledge, building credibility, and generating side income

**Revenue Model:**
- **Platform Commission:** 15% of session fee (with plan to reduce to 12% for high-volume mentors)
- **72-hour Settlement:** Mentor payouts held for 48-72 hours or until mentee confirmation
- **Automatic Release:** After 72 hours if no disputes raised

**Future Revenue Streams (Post-MVP):**
- Featured listing ($10-50/week)
- Verified badge ($10-30 one-time)
- Sponsored webinars/events ($200-1,000 per event)
- Corporate partnerships

---

# Shehata — Technical Architecture

> **Sections 6-9** — Tech Stack, Backend, Frontend, Database

## Section 6: Tech Stack & Infrastructure

**Frontend:**
- **Framework:** Angular 20
- **Styling:** Tailwind CSS
- **Deployment:** Netlify

**Backend:**
- **Framework:** ASP.NET Core 8 Web API
- **Language:** C#
- **ORM:** Entity Framework Core
- **Deployment:** MonsterASP

**Database:**
- **Engine:** SQL Server (hosted on MonsterASP)

**External Integrations: (icons/images)**
| Service | Purpose |
|---------|---------|
| **Stripe** | International payments (USD) |
| **Paymob** | Local payments (EGP) - Cards & Wallets |
| **Zoom** | Video conferencing automation |
| **Deepgram** | AI transcription |
| **OpenAI** | Session summarization |
| **Cloudflare R2** | Recording storage |
| **SendGrid** | Transactional emails |
| **SignalR** | Real-time notifications |

---

## Section 7: Backend Architecture (Clean Architecture)

**Architecture Layers:**

```
┌─────────────────────────────────────────┐
│           CareerRoute.API               │
│  (Controllers, Middleware, Program.cs)  │
├─────────────────────────────────────────┤
│           CareerRoute.Core              │
│  (Entities, Interfaces, DTOs, Services) │
├─────────────────────────────────────────┤
│       CareerRoute.Infrastructure        │
│  (DbContext, Repositories, External)    │
└─────────────────────────────────────────┘
```

**Key Architectural Patterns:**
- **Service Layer Pattern:** Business logic encapsulated in services
- **Repository Pattern:** Data access abstraction
- **Options Pattern:** Configuration management (ZoomSettings, JwtSettings, PaymentSettings, etc.)
- **Dependency Injection:** All services registered in DI container
- **Factory Pattern:** Payment provider selection (Stripe vs Paymob)

**Configuration Examples:**
- `JwtSettings` - Token configuration
- `ZoomSettings` - Zoom API credentials
- `StripeSettings` - Stripe API keys
- `PaymobSettings` - Paymob integration keys
- `SendGridSettings` - Email service configuration

> **Reference:** See `Documents/diagrams/clean-architecture.md` for detailed Mermaid diagrams

---

## Section 8: Frontend Architecture (Angular)

**Project Structure:**
```
Frontend/src/app/
├── core/
│   ├── guards/        (auth.guard, role.guard)
│   ├── interceptors/  (auth.interceptor, error.interceptor)
│   └── services/      (auth, mentor, session, payment, etc.)
├── features/
│   ├── admin/         (mentor-approvals, admin dashboard)
│   ├── auth/          (login, register, email-verification, password-reset)
│   ├── mentor/        (profile, availability, sessions)
│   ├── mentors/       (search, list, detail, booking)
│   ├── payment/       (stripe, paymob-card, paymob-wallet)
│   ├── public/        (home)
│   └── user/          (profile, sessions)
└── shared/
    ├── components/    (header, mentor-card, session-card, modals)
    └── models/        (TypeScript interfaces)
```

**Key Frontend Patterns:**
- **Feature-based module organization**
- **Lazy loading for route modules**
- **HTTP Interceptors** for auth tokens and error handling
- **Route Guards** for authentication and role-based access
- **Reactive Forms** for complex form handling
- **Services** for API communication and state management

---

## Section 9: Database Design & Entities

**Core Entities:**
- **Users** - Base user information (Identity)
- **MentorProfiles** - Extended mentor data (bio, hourly rate, experience)
- **Categories** - Mentorship categories (Tech, Marketing, etc.)
- **Skills** - Unified skills library shared across platform
- **TimeSlots** - Mentor availability slots
- **Sessions** - Booked mentorship sessions
- **Payments** - Payment transactions and status
- **Reviews** - Session ratings and feedback

**Key Relationships:**
- User → MentorProfile (1:1 optional)
- MentorProfile → Categories (M:N)
- MentorProfile → Skills (M:N)
- MentorProfile → TimeSlots (1:N)
- Session → User (Mentee) + MentorProfile (Mentor)
- Session → Payment (1:1)
- Session → Review (1:1 optional)

**Database Features:**
- Entity Framework Core migrations
- Seed data for categories and skills
- Soft delete for data integrity

---

# Shoeib — User Journey & Authentication

> **Sections 10-11** — User flows and authentication system

## Section 10: User Journey (Mentor & Mentee Flows)

**Mentee Journey:**
```
Register → Browse Mentors → View Profile → Select Time Slot → 
Book Session → Make Payment → Receive Zoom Link → 
Join Session → View AI Summary & Session Record 
```

**Mentor Journey:**
```
Register → Apply as Mentor → Admin Approval → 
Complete Profile → Set Availability → 
Receive Booking → Host Session
```

**Session Lifecycle States:**
```
Pending → Confirmed → In Progress → Completed
                ↓
           Cancelled (with refund handling)
```

---

## Section 11: Authentication & User Management

**Core Components:**
- **JWT Authentication:** Secure token-based authentication
- **Refresh Tokens:** Long-lived tokens for seamless session renewal
- **ASP.NET Identity:** User management foundation

**Key Features:**

| Feature | Description |
|---------|-------------|
| **Email Verification** | SendGrid integration for account verification emails |
| **Password Reset** | Secure token-based password recovery flow |
| **Role Management** | Mentee vs Mentor roles with different permissions |
| **Unified Skills Library** | Shared skills database for consistent categorization |

**Authentication Flow:**
```
Login Request → Validate Credentials → Generate JWT + Refresh Token → 
Return Tokens → Client Stores Tokens → 
Subsequent Requests Include JWT in Header → 
Token Expiry → Use Refresh Token → Get New JWT
```

**Security Measures:**
- Password hashing with Identity
- Token expiration policies
- Role-based authorization attributes
- HTTPS enforcement

---

# Alyaa — Mentor Discovery & Session Management

> **Sections 12-13** — Mentor onboarding, discovery, and session lifecycle

## Section 12: Mentor Onboarding & Discovery

**Mentor Application Flow:**
```
User Registers → Applies as Mentor (Profile + Experience) → 
Application Submitted → Admin Reviews → 
Approved/Rejected → Mentor Notified → 
If Approved: Profile Goes Live
```

**Admin Review Process:**
- View pending applications
- Review mentor credentials and experience
- Approve or reject with reason
- Automated email notifications

**Mentor Approval Workflow:**
```
View Pending Applications → 
Review Mentor Details → 
Approve (Profile Goes Live) OR 
Reject with Reason (Notification Sent)
```

**Discovery Features:**

| Feature | Implementation |
|---------|----------------|
| **Search** | Full-text search on mentor name, bio, skills |
| **Category Filter** | Filter by specialization categories |
| **Price Filter** | Filter by hourly rate range |
| **Rating Filter** | Filter by minimum rating |
| **Sorting** | By rating, price, experience, newest |
| **Pagination** | Server-side pagination for performance |

**Mentor Profile Display:**
- Profile photo and bio
- Experience and credentials
- Skills and categories
- Hourly rate
- Average rating and review count
- Availability calendar preview

---

## Section 13: Session Scheduling & Lifecycle

**Time Slot Management:**
- **Duration Options:** 30 minutes or 60 minutes
- **Mentor Control:** Mentors set their own availability
- **Conflict Prevention:** System prevents double-booking

**Booking Flow:**
```
Select Mentor → View Available Slots → Choose Date/Time → 
Select Duration (30/60 min) → Confirm Booking → 
Proceed to Payment → Payment Success → 
Session Confirmed → Both Parties Notified
```

**Session States:**

| State | Description |
|-------|-------------|
| **Pending** | Booked, awaiting payment confirmation |
| **Confirmed** | Payment received, session scheduled |
| **In Progress** | Session currently happening |
| **Completed** | Session finished successfully |
| **Cancelled** | Session cancelled (with refund if applicable) |

**Cancellation & Refund Handling:**
- Cancellation policy enforcement
- Automatic refund processing based on timing
- Session-level refund handling
- Notification to both parties

**Rescheduling:**
- Request reschedule option
- New time slot selection
- Mutual confirmation required

---

# Abdelfattah — Payments, Admin & Notifications

> **Sections 14-16** — Payment system, admin dashboard, and notifications

## Section 14: Payments & Financial Model

**Dual Payment Gateway Architecture:**

| Gateway | Currency | Use Case |
|---------|----------|----------|
| **Stripe** | USD | International payments |
| **Paymob** | EGP | Egyptian local payments (Cards + Wallets) |

**Payment Methods Supported:**
- Credit/Debit Cards (Visa, MasterCard, Meeza)
- Digital Wallets (Vodafone Cash, Orange Cash via Paymob)
- Apple Pay / Google Pay (via Stripe)

**Technical Implementation:**
- **Factory Pattern:** Dynamic payment provider selection based on currency/region
- **Webhook Handlers:** Both Stripe and Paymob webhooks for payment status updates
- **Real-time Status:** SignalR integration for instant payment status updates in UI

**Financial Flow:**
```
Mentee Pays Full Amount → Platform Holds Payment → 
Session Completes → 72-hour Settlement Period → 
Platform Takes 15% Commission → 
Mentor Receives 85% Payout
```

**Refund Policy:**
- Full refund if cancelled 24+ hours before session
- Partial refund based on cancellation timing
- No refund for no-shows (mentee side)

**Webhook Processing:**
```
Payment Gateway → Webhook Endpoint → 
Validate Signature → Update Payment Status → 
Trigger SignalR Notification → Update UI in Real-time
```

---

## Section 15: Admin Dashboard

**Admin Capabilities:**

| Feature | Description |
|---------|-------------|
| **Mentor Approvals** | Review and approve/reject mentor applications |
| **User Management** | View and manage user accounts |
| **Category Management** | Add/edit mentorship categories |
| **Analytics Overview** | Platform statistics and metrics |

**Mentor Approval Workflow:**
```
View Pending Applications → 
Review Mentor Details → 
Approve (Profile Goes Live) OR 
Reject with Reason (Notification Sent)
```

**Admin Analytics (Future Enhancement):**
- Total users and mentors
- Session statistics
- Revenue metrics
- User growth trends

---

## Section 16: Notifications & Communication Layer

**Real-time Notifications (SignalR):**

| Event | Notification |
|-------|--------------|
| Payment status change | Instant UI update |
| Session booking | Real-time notification |
| Session reminder | Push notification |
| Session status change | Live status update |

**Email Notifications (SendGrid):**

| Trigger | Email Type |
|---------|------------|
| Registration | Welcome email |
| Email verification | Verification link |
| Password reset | Reset link |
| Session booked | Booking confirmation (both parties) |
| Session cancelled | Cancellation notice |
| Session reminder | 24-hour and 1-hour reminders |
| Payment received | Payment confirmation |

**SignalR Implementation:**
- Hub-based architecture
- User-specific connections
- Group notifications for session participants
- Automatic reconnection handling

---

# Adel — Video Conferencing & AI Intelligence

> **Sections 17-18** — Zoom integration and AI-powered features

## Section 17: Video Conferencing (Zoom Automation)

**Zoom Integration Features:**

| Feature | Description |
|---------|-------------|
| **Auto Meeting Creation** | Zoom meeting automatically created on booking confirmation |
| **Email Distribution** | Meeting link sent to both mentor and mentee |
| **Auto Meeting End** | Meetings automatically end 5 minutes after scheduled end time |
| **Webhook Handler** | Process Zoom events for session tracking |

**Technical Flow:**
```
Payment Confirmed → Trigger Zoom API → 
Create Meeting with Settings → 
Store Meeting ID & Links → 
Send Email with Join Links → 
Session Time: Both Join → 
End Time + 5 min: Auto-terminate
```

**Zoom Meeting Settings:**
- Waiting room enabled
- Host video on by default
- Recording enabled (cloud)
- Meeting duration based on booked slot

**Webhook Events Handled:**
- `meeting.started` - Session in progress
- `meeting.ended` - Session completed
- `recording.completed` - Recording ready for processing

---

## Section 18: AI-Powered Session Intelligence

**AI Pipeline Architecture:**
```
Zoom Recording Completed → 
Download Recording → 
Upload to Cloudflare R2 → 
Send to Deepgram (Transcription) → 
Send Transcript to OpenAI (Summarization) → 
Store Summary in Database → 
Display on Session Page
```

**Components:**

| Component | Service | Purpose |
|-----------|---------|---------|
| **Storage** | Cloudflare R2 | Secure recording storage |
| **Transcription** | Deepgram | Speech-to-text conversion |
| **Summarization** | OpenAI GPT | Generate session summary |

**Session Intelligence Output:**
- Full transcript (searchable)
- AI-generated summary with key points
- Action items extracted
- Topics discussed

**User Access:**
- Both mentor and mentee can view summary
- Transcript available for reference
- Summary displayed on session detail page

---

# Hisham — Development Workflow, Demo & Closing

> **Sections 19-23** — Git workflow, testing, demo, future roadmap, and conclusion

## Section 19: Git/GitHub & Development Workflow (Optional)

**Branching Strategy:**

```
main (production)
  │
  └── develop (integration)
        │
        ├── feature/backend-* (backend features)
        │
        ├── feature/frontend-* (frontend features)
        │
        └── deploy (deployment preparation)
```

**Branch Descriptions:**

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready code, protected branch |
| `develop` | Integration branch for all features |
| `feature/backend-*` | Backend feature development |
| `feature/frontend-*` | Frontend feature development |
| `deploy` | Deployment preparation and staging |

**Development Workflow:**
```
1. Create feature branch from develop
   git checkout -b feature/backend-payment-webhooks develop

2. Develop and commit changes
   git commit -m "feat: implement Stripe webhook handler"

3. Push and create Pull Request
   git push origin feature/backend-payment-webhooks
   → Create PR to develop

4. Code Review & Approval
   → Team reviews PR
   → Address feedback
   → Approve and merge

5. Integration Testing on develop
   → Test integrated features

6. Merge to main for release
   develop → main (via PR)
```

**Pull Request Guidelines:**
- Descriptive PR title and description
- Link to related issues/tasks
- Request review from team members
- All CI checks must pass
- At least one approval required

**Commit Message Convention:**
```
feat: add new feature
fix: bug fix
docs: documentation changes
refactor: code refactoring
test: adding tests
chore: maintenance tasks
```

---

## Section 20: Testing & Quality Assurance

**Testing Approach:**

| Type | Tool | Coverage |
|------|------|----------|
| **API Testing** | Postman Collections | E2E flows, edge cases |

**Postman Test Collections:**
- `CareerRoute-E2E-MenteeFlow` - Complete mentee journey
- `CareerRoute-E2E-MentorFlow` - Complete mentor journey
- `CareerRoute-Payment-Flow` - Payment scenarios
- `CareerRoute-NegativeTests` - Error handling and edge cases

**Quality Measures:**
- Code reviews on all PRs
- Consistent coding standards
- Error handling and logging
- Input validation

---

## Section 21: Live Demo

**Demo Flow (5 minutes):**

```
1. Sign In (as Mentee)
   → Show login flow

2. Search Mentor
   → Use filters (category, price)
   → Show search results

3. Book Session
   → View mentor profile
   → Select time slot
   → Confirm booking

4. Make Payment
   → Show payment flow
   → Real-time status update (SignalR)

5. View Zoom Link
   → Show session details with meeting link

6. View AI Summary (Pre-recorded session)
   → Show summary
```

**Demo Tips:**
- Have test accounts ready
- Pre-book a session for AI summary demo
- Have backup screenshots in case of issues

---

## Section 22: Future Roadmap

**Planned Enhancements:**

| Feature | Description | Priority |
|---------|-------------|----------|
| **AI Interview Preparation** | Mock interviews with AI feedback | High |
| **Smart Mentor Recommendations** | AI-powered mentor matching based on goals | High |
| **Mentee Progress Dashboard** | Track learning journey and achievements | Medium |
| **Mobile Apps** | Flutter-based iOS/Android apps | Medium |
| **Calendar Integration** | Google Calendar / Outlook sync | Medium |
| **Built-in Chat** | Post-session messaging (3-day window) | Medium |
| **Group Sessions** | Multiple mentees per session at reduced cost | Low |
| **AI Career Assistant** | 24/7 chatbot for career guidance | Low |

**From MVP Document - Additional Future Features:**
- Q&A Assistance (AI Career Knowledge Base)
- Smart Mentor Matching System
- Group Session Matching & Discounts
- Generative AI Integration (study plans, resume improvements)
- Recorded Sessions with access restrictions

---

## Section 23: Conclusion & Q&A

**Key Achievements:**
- ✅ Full-stack mentorship platform
- ✅ Dual payment gateway (Stripe + Paymob)
- ✅ Automated Zoom integration
- ✅ AI-powered session intelligence
- ✅ Real-time notifications
- ✅ Clean architecture implementation

**Technical Highlights:**
- Modern tech stack (Angular 20, .NET 8)
- Scalable architecture
- Multiple third-party integrations
- Localized for MENA market

**Team Acknowledgments:**
- [Add team member contributions]

**Q&A Session**



---


