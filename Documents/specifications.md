# Feature Specification: Career Route - Complete Mentorship Platform

**Feature Branch**: `001-career-route-platform`  
**Created**: 2025  
**Status**: Draft  
**Input**: User description: "Career Route platform - Full stack implementation with ASP.NET Core, Entity Framework Core, and Angular for graduation project"

## User Scenarios & Testing

### User Story 1 - User and Mentor Registration & Profile Management (Priority: P1)

Students, graduates, and professionals can create accounts and build profiles to access or provide mentorship services on the platform.

**Why this priority**: Without user registration and profile management, the platform cannot function. This is the foundation for all other features and enables the basic user-mentor relationship.

**Independent Test**: Can be fully tested by creating user accounts (mentee and mentor roles), completing profile information, verifying email addresses, and viewing profile pages. Delivers immediate value by establishing user identity and credentials in the system.

**Acceptance Scenarios**:

1. **Given** a new visitor on the website, **When** they click "Sign Up" and provide email, password, and select role (User/Mentor), **Then** an account is created and verification email is sent
2. **Given** a registered user with unverified email, **When** they click the verification link in email, **Then** their account is activated and they can log in
3. **Given** a logged-in mentor, **When** they complete their profile with bio, expertise areas, certifications, and experience, **Then** their profile becomes visible to users searching for mentors
4. **Given** a logged-in user, **When** they indicate career interests and goals in their profile, **Then** the system can recommend relevant mentors
5. **Given** a user who forgot their password, **When** they request password reset via email, **Then** they receive a secure reset link and can create a new password
6. **Given** a logged-in user, **When** they update their profile information, **Then** changes are saved and reflected immediately across the platform

---

### User Story 2 - Browse and Search for Mentors (Priority: P1)

Users can discover mentors by browsing specialization categories and using search filters to find the best match for their needs.

**Why this priority**: This is the core discovery mechanism that connects users with mentors. Without effective search and filtering, users cannot find appropriate mentors, making the platform unusable.

**Independent Test**: Can be tested by creating several mentor profiles with different specializations, then using search keywords, category filters, price ranges, and ratings to verify correct results are returned. Delivers value by helping users efficiently find relevant mentors.

**Acceptance Scenarios**:

1. **Given** a user on the homepage, **When** they view the specialization categories (IT Careers, Leadership, Startup Advice, etc.), **Then** they see organized groups of mentors by category
2. **Given** a user searching for mentors, **When** they enter keywords like "Full-Stack Developer" or "Career Transition", **Then** relevant mentor profiles are displayed
3. **Given** search results displayed, **When** users apply filters for price range (e.g., $10-$50), session duration (30min/1hr), ratings (4+ stars), and availability, **Then** results are refined accordingly
4. **Given** filtered search results, **When** users sort by relevance, popularity, ratings, or lowest price, **Then** the list reorders to match the selected criteria
5. **Given** a user viewing search results, **When** they click on a mentor profile, **Then** they see detailed information including bio, expertise, certifications, pricing, ratings, reviews, and available time slots

---

### User Story 3 - Book and Manage Mentorship Sessions (Priority: P1)

Users can schedule mentorship sessions with mentors, receive confirmations, manage upcoming sessions, and attend virtual meetings.

**Why this priority**: This represents the core transaction of the platform - connecting users with mentors for actual sessions. Without booking functionality, the platform cannot deliver its primary value proposition.

**Independent Test**: Can be tested end-to-end by selecting a mentor, choosing an available time slot, completing payment, receiving confirmation with video link, and attending the session. Delivers complete value of the mentorship service.

**Acceptance Scenarios**:

1. **Given** a user viewing a mentor's profile, **When** they select session type (30min or 1hr), choose an available time slot from the calendar, and proceed to payment, **Then** a booking is created pending payment confirmation
2. **Given** a user completing payment, **When** payment is processed successfully, **Then** booking is confirmed, both parties receive email confirmation with session details and video conference link
3. **Given** a confirmed booking, **When** the session time approaches (24 hours before, 1 hour before), **Then** automated reminder notifications are sent via email
4. **Given** a user with upcoming sessions, **When** they view their dashboard, **Then** they see a list of all scheduled sessions with date, time, mentor name, topic, and video link
5. **Given** a user needing to reschedule, **When** they request rescheduling at least 24 hours before the session, **Then** the mentor is notified and can approve/suggest alternative times
6. **Given** a scheduled session time arrives, **When** either party clicks the video conference link, **Then** they join a secure virtual meeting room with video, audio, screen sharing capabilities
7. **Given** a session in progress, **When** the scheduled time expires, **Then** the system sends a notification and tracks session completion
8. **Given** a user wanting to cancel, **When** they cancel more than 48 hours before the session, **Then** they receive a full refund according to the cancellation policy

---

### User Story 4 - Admin Platform Management (Priority: P2)

Administrators can oversee platform operations, approve mentors, manage categories, monitor activity, and resolve disputes.

**Why this priority**: While not directly user-facing, admin capabilities are essential for maintaining platform quality, trust, and operational efficiency. This enables scaling and quality control.

**Independent Test**: Can be tested by logging in as admin, reviewing mentor applications, creating/editing categories, viewing analytics dashboards, and moderating content. Delivers value by ensuring platform integrity and mentor quality.

**Acceptance Scenarios**:

1. **Given** a new mentor registration submitted, **When** admin reviews the application with credentials and experience, **Then** admin can approve or reject with feedback
2. **Given** an admin logged into the dashboard, **When** they view analytics, **Then** they see metrics on total bookings, revenue, active users, session completion rates, and growth trends
3. **Given** an admin managing categories, **When** they create a new specialization category or edit existing ones, **Then** changes are reflected immediately in user-facing browse/search
4. **Given** user reports or disputes about sessions, **When** admin reviews the case with session history and communications, **Then** admin can issue refunds, warnings, or take corrective actions
5. **Given** admin monitoring platform activity, **When** they view user and mentor activity logs, **Then** they can identify unusual patterns, potential fraud, or policy violations

---

### User Story 5 - Payment Processing and History (Priority: P2)

The platform handles secure payment transactions, splits commissions, processes refunds, and maintains transparent payment history for users.

**Why this priority**: Reliable payment processing is critical for platform monetization and user trust, but it's a supporting feature that enables the core booking functionality (P1).

**Independent Test**: Can be tested by completing bookings with various payment methods, verifying commission splits (15%), processing refunds for cancellations, and viewing payment history. Delivers financial transparency and trust.

**Acceptance Scenarios**:

1. **Given** a user at checkout, **When** they select payment method (Visa, MasterCard, Meeza, InstaPay, Vodafone Cash, PayPal), **Then** they are directed to secure payment gateway
2. **Given** a successful payment, **When** the transaction completes, **Then** platform automatically deducts 15% commission and holds remaining amount for mentor payout
3. **Given** a completed session with no disputes, **When** 72 hours pass after session end, **Then** mentor's payment is automatically released minus platform commission
4. **Given** a cancelled session within refund policy, **When** cancellation is processed, **Then** user receives refund according to timing (full refund if 48+ hours before, partial or no refund otherwise)
5. **Given** a user viewing their payment history, **When** they access the payments section, **Then** they see chronological list of transactions with date, amount, mentor, session topic, and status (paid/refunded)
6. **Given** a mentor viewing earnings, **When** they access their financial dashboard, **Then** they see session earnings, platform commissions, pending payouts, and completed payouts with downloadable invoices

---

### User Story 6 - Post-Session Communication (3-Day Chat Window) (Priority: P3)

Users and mentors can communicate after sessions for clarifications and follow-ups within a limited 3-day window.

**Why this priority**: Enhances session value and user satisfaction, but the core mentorship service can function without it. This is a value-add feature that improves retention and outcomes.

**Independent Test**: Can be tested by completing a session, then exchanging messages between mentor and mentee for up to 3 days, verifying file attachments work, and confirming chat becomes read-only after 72 hours. Delivers enhanced support and relationship building.

**Acceptance Scenarios**:

1. **Given** a completed mentorship session, **When** the session ends, **Then** a 3-day chat window is automatically activated between user and mentor
2. **Given** an active chat window, **When** either party sends a message, **Then** the other receives an email/in-app notification and can respond
3. **Given** an ongoing post-session chat, **When** either party shares files (PDFs, images, links), **Then** files are securely uploaded and accessible to both parties
4. **Given** 72 hours have passed since session end, **When** the chat window expires, **Then** chat becomes read-only, both parties can view history but cannot send new messages
5. **Given** a user receiving multiple messages, **When** they view their chat notifications, **Then** they see unread message count and can navigate to active conversations

---

### User Story 7 - Group Sessions (Priority: P3)

Mentors can offer group mentorship sessions where multiple learners join at reduced per-person cost, fostering collaborative learning.

**Why this priority**: This is an alternative session format that increases accessibility and mentor reach, but the platform's core value is delivered through 1-on-1 sessions. Group sessions are an enhancement for scaling and affordability.

**Independent Test**: Can be tested by a mentor creating a group session with topic, max participants (3-10), and discounted pricing, then multiple users booking and joining the same session via video conference. Delivers affordable group learning experience.

**Acceptance Scenarios**:

1. **Given** a mentor creating a session, **When** they select "Group Session" type, set topic, max participants (3-10), date/time, and per-person price, **Then** the group session is listed for booking
2. **Given** a user browsing sessions, **When** they view group sessions, **Then** they see topic, mentor, price per person, available spots, and total enrolled count
3. **Given** a user booking a group session, **When** they complete registration and payment, **Then** their spot is confirmed and they receive session details including video link
4. **Given** a group session reaching capacity, **When** max participants is reached, **Then** the session is marked as "Full" and no longer accepts bookings
5. **Given** a scheduled group session time, **When** participants join the video conference, **Then** all participants and mentor can see/hear each other, share screens, and participate in Q&A
6. **Given** a mentor opting to record, **When** session recording is enabled with participant consent, **Then** recording is stored securely and made available only to registered participants

---

### User Story 8 - Ratings and Reviews (Priority: P3)

Users can rate and review mentors after sessions, helping others make informed decisions and maintaining quality standards.

**Why this priority**: Builds trust and quality feedback loop, but the platform can operate initially without reviews by relying on mentor verification. This becomes more important as the platform scales.

**Independent Test**: Can be tested by completing a session, submitting a rating (1-5 stars) and written review, then verifying it appears on the mentor's profile and influences search results. Delivers social proof and quality signals.

**Acceptance Scenarios**:

1. **Given** a completed session, **When** 24 hours pass and user hasn't left a review, **Then** user receives a prompt/email to rate their experience
2. **Given** a user submitting feedback, **When** they provide a rating (1-5 stars) and optional written review, **Then** the review is saved and appears on mentor's profile after moderation (if needed)
3. **Given** a mentor profile with multiple reviews, **When** users view the profile, **Then** they see average rating, total review count, and recent reviews
4. **Given** search results, **When** users filter by minimum rating (e.g., 4+ stars), **Then** only mentors meeting that threshold are displayed
5. **Given** a mentor receiving a poor rating, **When** their average rating falls below quality threshold, **Then** admin is notified for review and potential intervention

---

### Edge Cases

- What happens when a mentor's internet connection fails during a live session? (System should track partial completion, allow rescheduling without additional charge, and log technical issues)
- How does the system handle double-booking if a mentor accidentally opens the same time slot to multiple users? (First confirmed payment locks the slot, subsequent attempts show slot unavailable)
- What if a user disputes session quality or mentor no-show? (Admin review process triggers, funds held pending investigation, resolution within 5 business days)
- What happens when payment processing fails mid-transaction? (Booking is not confirmed, user is notified to retry, temporary hold released after 24 hours)
- How does the system handle users in different time zones selecting session times? (All times stored in UTC, displayed in user's local timezone with clear timezone indicators)
- What if a mentor wants to cancel a confirmed session? (Mentor can request cancellation, user receives full refund, mentor may receive warning for frequent cancellations)
- What happens when the 3-day chat window expires while a conversation is ongoing? (Chat becomes read-only, users notified 24 hours before expiry, option to book follow-up session for continued support)
- What if a group session has only 1-2 registrations by start time? (Mentor can choose to proceed, reschedule, or cancel with full refunds, minimum participant threshold can be set per session)
- How does the system handle mentors in multiple specialization categories? (Mentors can belong to multiple categories, each tag counts toward searchability and recommendations)
- What happens when a mentor attempts to withdraw earnings below minimum payout threshold? (System shows minimum threshold requirement, accumulates earnings until threshold met)
- What if a user tries to book back-to-back sessions with different mentors creating schedule conflicts? (System validates user availability, warns of conflicts, requires confirmation or time adjustment)

## Requirements

### Functional Requirements

**User Management**

- **FR-001**: System MUST allow users to register with email and password, selecting role (User/Mentor)
- **FR-002**: System MUST support optional social login via Google for faster registration
- **FR-003**: System MUST send verification emails upon registration and validate email addresses before account activation
- **FR-004**: System MUST provide password reset functionality via secure email links with token expiration (1 hour)
- **FR-005**: Users MUST be able to update their profiles including bio, career interests, goals, and profile photo
- **FR-006**: Mentors MUST be able to add expertise areas, certifications, years of experience, and hourly rates to profiles
- **FR-007**: System MUST authenticate users using secure session tokens and enforce role-based access control (User, Mentor, Admin)

**Mentor Discovery & Search**

- **FR-008**: System MUST organize mentors into predefined specialization categories (IT Careers, Leadership, Finance, Marketing, HR, Design, Startup Advice)
- **FR-009**: Users MUST be able to search mentors by keywords matching name, expertise tags, or bio content
- **FR-010**: System MUST provide filters for price range, session duration (30min/1hr), minimum rating, and availability (today, this week, custom date range)
- **FR-011**: System MUST support sorting search results by relevance (keyword match), popularity (total sessions), ratings (average score), and lowest price
- **FR-012**: System MUST display mentor profiles with bio, expertise, certifications, average rating, total reviews, pricing, and available time slots
- **FR-013**: Admin MUST be able to create, edit, and delete specialization categories

**Session Booking & Management**

- **FR-014**: Users MUST be able to select session type (30-minute or 1-hour), choose from mentor's available time slots, and proceed to payment
- **FR-015**: System MUST integrate with payment gateways (Stripe for international cards/PayPal, Paymob for local Egyptian options including Meeza, InstaPay, Vodafone Cash)
- **FR-016**: System MUST confirm bookings upon successful payment and send email confirmations to both parties with session details
- **FR-017**: System MUST generate unique, secure video conference links for each session (Zoom or WebRTC integration)
- **FR-018**: System MUST send automated reminder notifications 24 hours and 1 hour before scheduled sessions via email and in-app
- **FR-019**: Users MUST be able to view upcoming sessions dashboard showing date, time, mentor/user name, topic, and video link
- **FR-020**: Users MUST be able to request rescheduling at least 24 hours before session start, requiring mentor approval
- **FR-021**: Users MUST be able to cancel sessions with refund policy: full refund if cancelled 48+ hours before, 50% refund if 24-48 hours, no refund if less than 24 hours
- **FR-022**: System MUST support group sessions where mentors set max participants (3-10), topic, schedule, and per-person pricing
- **FR-023**: System MUST track session attendance, mark completion, and log any technical issues or early terminations

**Payment & Financial Management**

- **FR-024**: System MUST deduct 15% platform commission from each successful booking automatically
- **FR-025**: System MUST hold mentor payouts for 72 hours post-session or until user confirms satisfaction (no dispute)
- **FR-026**: System MUST automatically release mentor payments after 72-hour hold period if no disputes raised
- **FR-027**: System MUST process refunds according to cancellation policy timing and update payment status in real-time
- **FR-028**: Users MUST be able to view complete payment history with transaction date, amount, mentor, session topic, status (paid/refunded), and downloadable receipts
- **FR-029**: Mentors MUST be able to view earnings dashboard showing total earnings, platform commissions, pending payouts, completed payouts, and available balance
- **FR-030**: System MUST support minimum payout threshold and allow mentors to request withdrawals when threshold is met

**Communication & Engagement**

- **FR-031**: System MUST activate a 3-day chat window between user and mentor immediately after session completion
- **FR-032**: Chat MUST support text messages, file attachments (PDFs, images, links up to 10MB), and real-time notifications
- **FR-033**: System MUST automatically close chat to read-only mode after 72 hours from session end
- **FR-034**: System MUST send email and in-app notifications for new messages during active chat window
- **FR-035**: Users MUST be able to rate sessions (1-5 stars) and write optional reviews after completion
- **FR-036**: System MUST display average rating and recent reviews on mentor profiles
- **FR-037**: System MUST allow filtering search results by minimum rating threshold

**Admin Management**

- **FR-038**: Admin MUST be able to review and approve/reject mentor registration applications with feedback
- **FR-039**: Admin MUST have access to dashboard showing analytics: total users, total mentors, total sessions, revenue, growth trends, popular categories
- **FR-040**: Admin MUST be able to view and moderate user-generated content including reviews and reported issues
- **FR-041**: Admin MUST be able to manually process refunds, issue warnings, suspend accounts, or ban users/mentors for policy violations
- **FR-042**: System MUST log all admin actions for audit trail including timestamps and admin user IDs
- **FR-043**: Admin MUST be able to view dispute cases with session details, chat history, and participant claims to make informed decisions

**Security & Data Protection**

- **FR-044**: System MUST use HTTPS for all communications and secure storage for sensitive data (passwords hashed with bcrypt or stronger)
- **FR-045**: System MUST implement input validation and sanitization to prevent SQL injection, XSS, and other common attacks
- **FR-046**: System MUST enforce password complexity requirements (minimum 8 characters, mix of letters, numbers, symbols)
- **FR-047**: System MUST implement rate limiting on authentication endpoints to prevent brute force attacks (max 5 failed attempts per 15 minutes)
- **FR-048**: System MUST restrict video conference recordings to authorized participants only with no download capability (stream-only access)
- **FR-049**: System MUST log security events including failed login attempts, suspicious booking patterns, and unauthorized access attempts
- **FR-050**: System MUST comply with data protection regulations for user privacy, requiring consent for data collection and offering data deletion options

**Video Conferencing**

- **FR-051**: System MUST integrate with video conferencing service (Zoom API or custom WebRTC implementation) to generate meeting links
- **FR-052**: Video sessions MUST support screen sharing, audio/video controls, and real-time communication
- **FR-053**: System MUST enforce session time limits according to booked duration (30min or 60min) with countdown timers
- **FR-054**: Optional session recordings MUST require explicit consent from all participants before recording starts
- **FR-055**: Recorded sessions MUST be stored securely with token-based, stream-only access (no direct download) and auto-expire **3 days from session completion time** to align with post-session chat window and minimize storage costs while preserving privacy

### Key Entities

- **User**: Represents platform users (mentees) with profile including email, password hash, role, career interests, registration date, email verification status, and payment methods
- **Mentor**: Represents mentors with profile including bio, expertise areas (tags), certifications, years of experience, hourly rates (30min/1hr), average rating, total sessions completed, verification status, and availability calendar
- **Category**: Specialization categories (IT Careers, Leadership, etc.) for organizing mentors, includes name, description, icon, and count of associated mentors
- **Session**: Represents booked mentorship sessions with type (1-on-1 or group), duration, scheduled date/time (UTC), user ID, mentor ID, status (pending/confirmed/completed/cancelled), video link, price, and session notes
- **Payment**: Financial transactions including amount, payment method, status (pending/completed/refunded), platform commission (15%), mentor payout amount, transaction date, and associated session ID
- **Review**: User feedback after sessions including rating (1-5 stars), written review text, reviewer ID, mentor ID, session ID, timestamp, and moderation status
- **Chat Message**: Post-session communications with sender ID, recipient ID, message text, attachments, timestamp, session ID, and read status
- **Admin Log**: Audit trail of admin actions including admin user ID, action type, affected entity ID, timestamp, and action details
- **Dispute**: Records session disputes with complainant ID, respondent ID, session ID, claim description, evidence attachments, status (open/under review/resolved), admin notes, and resolution date

## Success Criteria

### Measurable Outcomes

**User Onboarding & Engagement**

- **SC-001**: New users can complete registration and profile setup in under 3 minutes
- **SC-002**: 80% of registered users successfully book their first session within 7 days of registration
- **SC-003**: Platform attracts and verifies at least 50 mentors across 7+ specialization categories within first 3 months of launch
- **SC-004**: 90% of users successfully find and view at least 3 relevant mentor profiles within 5 minutes of searching

**Session Booking & Completion**

- **SC-005**: Users can complete the entire booking flow (search, select mentor, choose time, pay) in under 5 minutes
- **SC-006**: Session completion rate reaches 95% (sessions attended vs. sessions booked) within first 3 months
- **SC-007**: Session rescheduling requests are processed and resolved within 24 hours with 90% mentor response rate
- **SC-008**: Technical issues (video/audio problems) affect less than 5% of total sessions

**Payment & Financial Operations**

- **SC-009**: Payment processing success rate exceeds 98% for all supported payment methods
- **SC-010**: Mentor payouts are processed automatically within 72 hours for 95% of completed sessions with no disputes
- **SC-011**: Refund processing completes within 5 business days for 100% of eligible cancellations
- **SC-012**: Platform achieves 15% commission revenue target on all successfully completed paid sessions

**Platform Quality & Trust**

- **SC-013**: Average mentor rating across platform remains above 4.2 out of 5 stars
- **SC-014**: 80% of completed sessions receive user ratings and reviews within 7 days
- **SC-015**: Admin resolves 90% of disputes within 5 business days with documented outcomes
- **SC-016**: User satisfaction score reaches 85% based on post-session surveys asking "Would you recommend this platform?"
- **SC-017**: Mentor retention rate (mentors active after 3 months) exceeds 70%

**Scalability & Performance**

- **SC-018**: Platform supports 500 concurrent users browsing and booking without performance degradation (page load under 3 seconds)
- **SC-019**: Search results load within 2 seconds even with 500+ mentor profiles in database
- **SC-020**: Video conference links are generated and delivered within 5 seconds of payment confirmation
- **SC-021**: System handles 100+ simultaneous sessions without service interruption

**Communication & Support**

- **SC-022**: 60% of completed sessions result in post-session chat activity within the 3-day window
- **SC-023**: Chat messages are delivered with notification within 30 seconds of sending during active window
- **SC-024**: Email notifications (confirmations, reminders) are delivered within 5 minutes of trigger event for 99% of cases

**Business Growth & Adoption**

- **SC-025**: Platform facilitates 100 completed sessions within first month of public launch
- **SC-026**: Monthly active users (MAU) grow by 20% month-over-month for first 6 months
- **SC-027**: Group sessions account for 15% of total bookings within 6 months of launch
- **SC-028**: User acquisition cost via university partnerships and social media remains below $5 per registered user
