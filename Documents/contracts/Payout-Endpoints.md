# Payout Endpoints API Contract

**Frontend Framework:** Angular 20.3.0
**Expected Backend:** ASP.NET Core 8.0 Web API
**Base URL:** `http://localhost:5000/api`

---

## Overview

The Payout endpoints manage the withdrawal of funds by mentors. Mentors can request payouts from their available balance, and admins can process or cancel these requests.

**Key Payout Flow:**
1.  **Request:** Mentor requests a payout from their available balance.
2.  **Process:** Admin reviews and processes the payout (e.g., via bank transfer).
3.  **cancel:** Payout status is updated to Cancelled.

**Roles:**
-   **Mentor:** Can request payouts and view their own history.
-   **Admin:** Can view all payouts, search/filter payouts, and process/cancel them.

---

## Payout Endpoints

### 1. Request Payout

**Endpoint:** `POST /api/payouts/mentors/{mentorId}`
**Requires:** `Authorization: Bearer {token}`
**Roles:** Mentor

**Path Parameters:**
-   `mentorId` (string, GUID): The ID of the mentor requesting the payout.

**Request Body:**
```json
{
  "amount": 150.00
}
```

**Field Requirements:**
-   `amount` (required): Decimal, must be greater than 0 and less than or equal to available balance.

**Success Response (200):**
```json
{
    "data": {
        "id": "e6b5adf3-248c-4d35-8a18-a5bc98293665",
        "mentorId": "80a544d6-66dd-401f-be7f-61bcf1579578",
        "amount": 400,
        "status": "Pending",
        "failureReason": null,
        "requestedAt": "2025-12-03T21:30:24Z",
        "processedAt": null,
        "completedAt": null
    },
    "success": true,
    "message": "Payout request created successfully",
    "statusCode": 200,
    "errors": null
}
```

**Error Responses:**
-   **400 Bad Request:** Insufficient balance or invalid amount.
-   **401 Unauthorized:** Invalid token.
-   **403 Forbidden:** User is not the specified mentor.

---

### 2. Get Payout History (Mentor)

**Endpoint:** `GET /api/payouts/mentors/{mentorId}`
**Requires:** `Authorization: Bearer {token}`
**Roles:** Mentor

**Path Parameters:**
-   `mentorId` (string, GUID): The ID of the mentor.

**Query Parameters:**
-   `page` (int, default: 1)
-   `pageSize` (int, default: 10)

**Success Response (200):**
```json
{
    "data": {
        "payouts": [
            {
                "id": "e6b5adf3-248c-4d35-8a18-a5bc98293665",
                "mentorId": "80a544d6-66dd-401f-be7f-61bcf1579578",
                "amount": 400.00,
                "status": "Cancelled",
                "failureReason": null,
                "requestedAt": "2025-12-03T21:30:24Z",
                "processedAt": null,
                "completedAt": null
            },
            {
                "id": "8eafb124-0aa3-453d-b288-05bd54dd08ff",
                "mentorId": "80a544d6-66dd-401f-be7f-61bcf1579578",
                "amount": 251.00,
                "status": "Completed",
                "failureReason": null,
                "requestedAt": "2025-12-03T21:27:29Z",
                "processedAt": "2025-12-03T21:42:45Z",
                "completedAt": "2025-12-03T21:42:48Z"
            },
            {
                "id": "324142e5-96db-447e-96ce-1d826b5a6a11",
                "mentorId": "80a544d6-66dd-401f-be7f-61bcf1579578",
                "amount": 251.00,
                "status": "Failed",
                "failureReason": "Simulated payment processing failure",
                "requestedAt": "2025-12-03T21:22:05Z",
                "processedAt": "2025-12-03T21:40:49Z",
                "completedAt": null
            }
        ],
        "pagination": {
            "totalCount": 3,
            "currentPage": 1,
            "pageSize": 10,
            "totalPages": 1,
            "hasNextPage": false,
            "hasPreviousPage": false
        }
    },
    "success": true,
    "message": "Payout history retrieved successfully",
    "statusCode": 200,
    "errors": null
}```

---

### 3. Get Payout Details

**Endpoint:** `GET /api/payouts/{payoutId}`
**Requires:** `Authorization: Bearer {token}`
**Roles:** Admin, Mentor (own payouts only)

**Path Parameters:**
-   `payoutId` (string, GUID): The ID of the payout.

**Success Response (200):**
```json
{
    "data": {
        "id": "324142e5-96db-447e-96ce-1d826b5a6a11",
        "mentorId": "80a544d6-66dd-401f-be7f-61bcf1579578",
        "amount": 251.00,
        "status": "Pending",
        "failureReason": null,
        "requestedAt": "2025-12-03T21:22:05Z",
        "processedAt": null,
        "completedAt": null
    },
    "success": true,
    "message": "Payout details retrieved successfully",
    "statusCode": 200,
    "errors": null
}
```

---

### 4. Process Payout (Admin)

**Endpoint:** `POST /api/payouts/{payoutId}/process`
**Requires:** `Authorization: Bearer {token}`
**Roles:** Admin

**Path Parameters:**
-   `payoutId` (string, GUID): The ID of the payout.

**Success Response (200):**
```json
{
    "data": {
        "id": "8eafb124-0aa3-453d-b288-05bd54dd08ff",
        "mentorId": "80a544d6-66dd-401f-be7f-61bcf1579578",
        "amount": 251.00,
        "status": "Completed",
        "failureReason": null,
        "requestedAt": "2025-12-03T21:27:29Z",
        "processedAt": "2025-12-03T21:42:45Z",
        "completedAt": "2025-12-03T21:42:48Z"
    },
    "success": true,
    "message": "Payout processed successfully",
    "statusCode": 200,
    "errors": null
}
```

---

### 5. Cancel Payout (Admin)

**Endpoint:** `POST /api/payouts/{payoutId}/cancel`
**Requires:** `Authorization: Bearer {token}`
**Roles:** Admin

**Path Parameters:**
-   `payoutId` (string, GUID): The ID of the payout.

**Success Response (200):**
```json
{
    "data": {
        "id": "e6b5adf3-248c-4d35-8a18-a5bc98293665",
        "mentorId": "80a544d6-66dd-401f-be7f-61bcf1579578",
        "amount": 400.00,
        "status": "Cancelled",
        "failureReason": null,
        "requestedAt": "2025-12-03T21:30:24Z",
        "processedAt": null,
        "completedAt": null
    },
    "success": true,
    "message": "Payout cancelled successfully",
    "statusCode": 200,
    "errors": null
}
```

---

### 6. Search Payouts (Admin)

**Endpoint:** `GET /api/payouts/admin`
**Requires:** `Authorization: Bearer {token}`
**Roles:** Admin

**Description:** Allows admins to search and filter all payout requests in the system.

**Query Parameters (AdminPayoutFilterDto):**
-   `MentorId` (string, optional): Filter by specific mentor ID.
-   `MentorName` (string, optional): Partial match on mentor's name.
-   `Status` (enum, optional): Filter by status (0: Pending, 1: Processing, 2: Completed, 3: Failed, 4: Cancelled).
-   `MinAmount` (decimal, optional): Minimum payout amount.
-   `MaxAmount` (decimal, optional): Maximum payout amount.
-   `StartDate` (DateTime, optional): Filter requests created after this date.
-   `EndDate` (DateTime, optional): Filter requests created before this date.
-   `SortBy` (string, optional): Field to sort by ["amount","status","mentor"](default: "RequestedAt").
-   `SortDescending` (bool, optional): Sort direction (default: false).
-   `Page` (int, default: 1): Page number.
-   `PageSize` (int, default: 10): Items per page.

**Success Response (200):**
```json
{
    "data": {
        "payouts": [
            {
                "id": "324142e5-96db-447e-96ce-1d826b5a6a11",
                "mentorId": "80a544d6-66dd-401f-be7f-61bcf1579578",
                "mentorFirstName": "Nancy",
                "mentorLastName": "Taylor",
                "mentorEmail": "mentor13@test.com",
                "amount": 251.00,
                "status": "Failed",
                "failureReason": "Simulated payment processing failure",
                "requestedAt": "2025-12-03T21:22:05Z",
                "processedAt": "2025-12-03T21:40:49Z",
                "completedAt": null,
                "cancelledAt": null
            },
            {
                "id": "8eafb124-0aa3-453d-b288-05bd54dd08ff",
                "mentorId": "80a544d6-66dd-401f-be7f-61bcf1579578",
                "mentorFirstName": "Nancy",
                "mentorLastName": "Taylor",
                "mentorEmail": "mentor13@test.com",
                "amount": 251.00,
                "status": "Completed",
                "failureReason": null,
                "requestedAt": "2025-12-03T21:27:29Z",
                "processedAt": "2025-12-03T21:42:45Z",
                "completedAt": "2025-12-03T21:42:48Z",
                "cancelledAt": null
            },
            {
                "id": "e6b5adf3-248c-4d35-8a18-a5bc98293665",
                "mentorId": "80a544d6-66dd-401f-be7f-61bcf1579578",
                "mentorFirstName": "Nancy",
                "mentorLastName": "Taylor",
                "mentorEmail": "mentor13@test.com",
                "amount": 400.00,
                "status": "Cancelled",
                "failureReason": null,
                "requestedAt": "2025-12-03T21:30:24Z",
                "processedAt": null,
                "completedAt": null,
                "cancelledAt": "2025-12-03T21:43:55Z"
            }
        ],
        "pagination": {
            "totalCount": 3,
            "currentPage": 1,
            "pageSize": 10,
            "totalPages": 1,
            "hasNextPage": false,
            "hasPreviousPage": false
        }
    },
    "success": true,
    "message": "Payouts retrieved successfully",
    "statusCode": 200,
    "errors": null
}
```

---

## Enums Reference

### PayoutStatus
-   `0`: Pending
-   `1`: Processing
-   `2`: Completed
-   `3`: Failed
-   `4`: Cancelled
