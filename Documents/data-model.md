# Data Model: Career Route Platform

**Phase 1 Output** | **Date**: 2025

## Core Entities

### 1. User (ApplicationUser)
- Id: string (PK, GUID)
- Email, PasswordHash, EmailConfirmed (from ASP.NET Identity)
- FirstName, LastName, PhoneNumber, ProfilePictureUrl
- CareerInterests, CareerGoals
- RegistrationDate, LastLoginDate, IsActive

**Relationships**: One-to-Many with Session, Payment, Review, ChatMessage, Dispute

### 2. Mentor
- Id: string (PK, FK → User.Id)
- Bio, ExpertiseTags, YearsOfExperience, Certifications
- Rate30Min, Rate60Min
- AverageRating, TotalReviews, TotalSessionsCompleted
- IsVerified, ApprovalStatus (Pending/Approved/Rejected)

**Relationships**: Many-to-Many with Category, One-to-Many with Session, Review

### 3. Category
- Id: int (PK)
- Name, Description, IconUrl, DisplayOrder, IsActive

**Seed Data**: IT Careers, Leadership, Finance, Marketing, HR, Design, Startup Advice

### 4. Session
- Id: int (PK)
- MenteeId, MentorId (FKs)
- SessionType (OneOnOne/Group), Duration (30/60 min)
- ScheduledStartTime, ScheduledEndTime, Status
- VideoConferenceLink, RecordingUrl, RecordingExpiryDate (3 days)
- Price, MaxParticipants, CurrentParticipants

**States**: Pending → Confirmed → InProgress → Completed / Cancelled / NoShow

### 5. Payment
- Id: int (PK)
- SessionId, UserId, MentorId (FKs)
- Amount, PlatformCommission (15%), MentorPayoutAmount
- PaymentMethod (Stripe/Paymob/PayPal), TransactionId
- Status (Pending/Authorized/Captured/Refunded)
- MentorPayoutStatus (Pending/Paid/Held)

**Business Rule**: 72-hour hold before mentor payout

### 6. Review
- Id: int (PK)
- SessionId, MenteeId, MentorId (FKs)
- Rating (1-5), ReviewText
- IsVisible (moderation flag)

### 7. ChatMessage
- Id: int (PK)
- SessionId, SenderId, RecipientId (FKs)
- MessageText, AttachmentUrl, SentDate, IsRead

**Business Rule**: Active for 3 days post-session

### 8. Dispute
- Id: int (PK)
- SessionId, PaymentId, ComplainantId, RespondentId (FKs)
- DisputeType, Description, Status (Open/UnderReview/Resolved)
- ResolutionType, RefundAmount

### 9. AdminLog (Audit Trail)
- Id: int (PK)
- AdminUserId, ActionType, TargetEntity, TargetEntityId
- ActionDescription, OldValues, NewValues (JSON)
- IPAddress, CreatedDate

## Indexes
- Mentor: `IX_Mentor_IsVerified_IsAvailable`
- Session: `IX_Session_MentorId_ScheduledStartTime`
- Payment: `IX_Payment_TransactionId` (unique)
- Review: `IX_Review_MentorId_IsVisible`

**Total Tables**: 10 + ASP.NET Identity (5) = 15
