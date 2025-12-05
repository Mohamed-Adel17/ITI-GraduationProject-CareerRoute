# Mentor Balance Endpoints API Contract

**Frontend Framework:** Angular 20.3.0
**Expected Backend:** ASP.NET Core 8.0 Web API
**Base URL:** `http://localhost:5000/api`

---

## Overview

The Mentor Balance endpoints allow mentors to view their financial status, including available balance for withdrawal, pending balance from recent sessions, and total lifetime earnings.

**Roles:**
-   **Mentor:** Can view their own balance.

---

## Balance Endpoints

### 1. Get Mentor Balance

**Endpoint:** `GET /api/balance/{mentorId}`
**Requires:** `Authorization: Bearer {token}`
**Roles:** Mentor

**Path Parameters:**
-   `mentorId` (string, GUID): The ID of the mentor.

**Success Response (200):**
```json
{
    "data": {
        "mentorId": "80a544d6-66dd-401f-be7f-61bcf1579578",
        "availableBalance": 9749.00,
        "pendingBalance": 0.00,
        "totalEarnings": 10000.00,
        "lastUpdated": "2025-12-03T21:43:56Z"
    },
    "success": true,
    "message": "Balance retrieved successfully",
    "statusCode": 200,
    "errors": null
}
```

**Error Responses:**
-   **401 Unauthorized:** Invalid token.
-   **403 Forbidden:** User is not the specified mentor.
-   **404 Not Found:** Balance record not found for the mentor.

---

## Field Definitions

-   **AvailableBalance**: Amount available for immediate payout withdrawal.
-   **PendingBalance**: Amount from recently completed sessions held during the holding period (typically 3 days).
-   **TotalEarnings**: Cumulative sum of all earnings from completed sessions.
-   **LastUpdated**: Timestamp of the last balance update.
