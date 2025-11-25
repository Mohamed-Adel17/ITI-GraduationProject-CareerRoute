# Payment Endpoints API Contract

**Frontend Framework:** Angular 20.3.0
**Expected Backend:** ASP.NET Core 8.0 Web API
**Base URL:** `http://localhost:5000/api`

---

## Overview

The Payment endpoints handle the processing of payments for mentorship sessions. The flow supports multiple providers (Stripe, Paymob) and methods (Card, Wallet).

**Key Payment Flow:**
1.  **Create Intent:** User initiates payment for a booked session. Backend returns a `clientSecret`.
2.  **Client-Side Processing:** Frontend uses the `clientSecret` to securely process payment with the provider (Stripe/Paymob).
3.  **Confirm:** Frontend confirms the payment to the backend (optional depending on webhook setup, but explicitly available).
4.  **History/Refund:** Users can view history; Admins can refund.

---

## Payment Endpoints

### 1. Create Payment Intent

**Endpoint:** `POST /api/payments/create-intent`
**Requires:** `Authorization: Bearer {token}`
**Roles:** User (Mentee)

**Request Body:**
```json
{
  "sessionId": "44444444-e29b-41d4-a716-446655440014",
  "paymentProvider": 1, // 1: Stripe, 2: Paymob
  "paymobPaymentMethod": 1 // Optional: 1: Card, 2: Wallet (only for Paymob)
}
```

**Field Requirements:**
-   `sessionId` (required): GUID of the session to pay for.
-   `paymentProvider` (required): Integer enum (1: Stripe, 2: Paymob).
-   `paymobPaymentMethod` (optional): Required if provider is Paymob (1: Card, 2: Wallet).

**Success Response (201):**
```json
{
  "success": true,
  "message": "Payment intent created successfully",
  "data": {
    "paymentIntentId": "pi_123456789",
    "clientSecret": "pi_123_secret_456",
    "amount": 45.00,
    "currency": "USD",
    "sessionId": "44444444-e29b-41d4-a716-446655440014",
    "paymentProvider": 1,
    "paymobPaymentMethod": null,
    "status": 0 // 0: Pending
  },
  "statusCode": 201,
  "errors": null
}
```

**Error Responses:**

-   **400 Bad Request (Business Rule):**
    ```json
    {
      "success": false,
      "data": null,
      "message": "Cannot create payment for session with status: Confirmed",
      "statusCode": 400,
      "errors": null
    }
    ```

-   **400 Bad Request (Validation):**
    ```json
    {
      "success": false,
      "data": null,
      "message": "Validation failed",
      "statusCode": 400,
      "errors": {
        "SessionId": ["Session ID is required"]
      }
    }
    ```

-   **401 Unauthorized:**
    ```json
    {
      "success": false,
      "data": null,
      "message": "User not authenticated",
      "statusCode": 401,
      "errors": null
    }
    ```

-   **403 Forbidden:**
    ```json
    {
      "success": false,
      "data": null,
      "message": "Access Denied",
      "statusCode": 403,
      "errors": null
    }
    ```

-   **404 Not Found:**
    ```json
    {
      "success": false,
      "data": null,
      "message": "Session not found",
      "statusCode": 404,
      "errors": null
    }
    ```

-   **409 Conflict:**
    ```json
    {
      "success": false,
      "data": null,
      "message": "Session already has a payment associated",
      "statusCode": 409,
      "errors": null
    }
    ```

**Backend Behavior:**
-   Validates session exists and belongs to user.
-   Calculates amount based on session/mentor rates.
-   Creates a payment intent with the selected provider.
-   Returns `clientSecret` for frontend processing.

---

### 2. Confirm Payment

**Endpoint:** `POST /api/payments/confirm`
**Requires:** `Authorization: Bearer {token}`
**Roles:** User (Mentee)

**Request Body:**
```json
{
  "paymentIntentId": "pi_123456789",
  "sessionId": "44444444-e29b-41d4-a716-446655440014"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Payment confirmed successfully. Your session is now booked!",
  "data": {
    "paymentId": "pi_123456789",
    "sessionId": "44444444-e29b-41d4-a716-446655440014",
    "amount": 45.00,
    "platformCommission": 6.75,
    "mentorPayoutAmount": 38.25,
    "paymentProvider": 1, // 1: Stripe
    "status": 1, // 1: Captured
    "transactionId": "txn_987654321",
    "paidAt": "2025-11-15T10:05:00Z",
    "session": {
      "id": "44444444-e29b-41d4-a716-446655440014",
      "status": 1, // 1: Confirmed
      "videoConferenceLink": "https://zoom.us/j/1234567890",
      "scheduledStartTime": "2025-11-15T14:00:00Z"
    }
  },
  "statusCode": 200,
  "errors": null
}
```

**Error Responses:**

-   **400 Bad Request:**
    ```json
    {
      "success": false,
      "data": null,
      "message": "Payment must be captured before it can be confirmed",
      "statusCode": 400,
      "errors": null
    }
    ```

-   **404 Not Found:**
    ```json
    {
      "success": false,
      "data": null,
      "message": "Payment not found",
      "statusCode": 404,
      "errors": null
    }
    ```

-   **409 Conflict:**
    ```json
    {
      "success": false,
      "data": null,
      "message": "Session has already been confirmed",
      "statusCode": 409,
      "errors": null
    }
    ```

**Backend Behavior:**
-   Verifies payment status with provider.
-   Updates local payment and session status to "Confirmed".

---

### 3. Get Payment History

**Endpoint:** `GET /api/payments/history`
**Requires:** `Authorization: Bearer {token}`
**Roles:** User, Admin

**Query Parameters:**
-   `page` (int, default: 1)
-   `pageSize` (int, default: 10)
-   `status` (optional): Filter by status (e.g., 2 for Confirmed)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Payment history retrieved successfully",
  "data": {
    "paginationMetadata": {
      "totalCount": 1,
      "pageSize": 10,
      "currentPage": 1,
      "totalPages": 1
    },
    "payments": [
      {
        "id": "pi_123",
        "sessionId": "44444444-e29b-41d4-a716-446655440014",
        "mentorName": "Sarah Johnson",
        "sessionTopic": "System Design",
        "amount": 45.00,
        "paymentProvider": 1, // 1: Stripe, 2: Paymob
        "status": 2, // 2: Confirmed
        "transactionId": "txn_987654321",
        "paidAt": "2025-11-15T10:00:00Z",
        "refundAmount": null,
        "refundedAt": null
      }
    ],
    "summary": {
      "totalSpent": 45.00,
      "totalRefunded": 0.00,
      "netSpent": 45.00
    }
  },
  "statusCode": 200,
  "errors": null
}
```

**Error Responses:**

-   **404 Not Found:**
    ```json
    {
      "success": false,
      "data": null,
      "message": "you don't have any payment history ",
      "statusCode": 404,
      "errors": null
    }
    ```

---

### 4. Get Payment By ID

**Endpoint:** `GET /api/payments/{paymentId}`
**Requires:** `Authorization: Bearer {token}`
**Roles:** User, Admin

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "pi_123",
    "sessionId": "44444444-e29b-41d4-a716-446655440014",
    "mentorName": "Sarah Johnson",
    "sessionTopic": "System Design",
    "amount": 45.00,
    "paymentProvider": 1,
    "status": 2, // 2: Confirmed
    "transactionId": "txn_987654321",
    "paidAt": "2025-11-15T10:00:00Z",
    "refundAmount": null,
    "refundedAt": null
  },
  "statusCode": 200,
  "errors": null
}
```

**Error Responses:**

-   **400 Bad Request:**
    ```json
    {
      "success": false,
      "data": null,
      "message": "Payment ID must be send",
      "statusCode": 400,
      "errors": null
    }
    ```

-   **404 Not Found:**
    ```json
    {
      "success": false,
      "data": null,
      "message": "Payment not found",
      "statusCode": 404,
      "errors": null
    }
    ```

---

### 5. Refund Payment

**Endpoint:** `POST /api/payments/{paymentId}/refund`
**Requires:** `Authorization: Bearer {token}`
**Roles:** Admin

**Request Body:**
```json
{
  "percentage": 50 // Percentage to refund (1-100)
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Payment refunded successfully",
  "data": {
    "paymentId": "pi_123",
    "refundAmount": 22.50,
    "refundPercentage": 50,
    "status": 4, // 4: Refunded
    "refundedAt": "2025-11-16T10:00:00Z"
  },
  "statusCode": 200,
  "errors": null
}
```

**Error Responses:**

-   **400 Bad Request:**
    ```json
    {
      "success": false,
      "data": null,
      "message": "Refund percentage must be between 1 and 100",
      "statusCode": 400,
      "errors": null
    }
    ```

-   **403 Forbidden:**
    ```json
    {
      "success": false,
      "data": null,
      "message": "Access Denied",
      "statusCode": 403,
      "errors": null
    }
    ```

-   **404 Not Found:**
    ```json
    {
      "success": false,
      "data": null,
      "message": "Payment not found",
      "statusCode": 404,
      "errors": null
    }
    ```

---

## Enums Reference

### PaymentProviderOptions
- `1`: Stripe
- `2`: Paymob

### PaymobPaymentMethodOptions
- `1`: Card
- `2`: EWallet

### PaymentStatusOptions
- `0`: Pending
- `1`: Captured
- `2`: Failed
- `3`: Refunded
- `4`: Canceled

### SessionStatusOptions
- `0`: Pending
- `1`: Confirmed
- `2`: InProgress
- `3`: Completed
- `4`: Cancelled
- `5`: NoShow
- `6`: PendingReschedule

---

## Client Secret Usage Explanation

The `clientSecret` returned by the **Create Payment Intent** endpoint is a crucial security token used by the **Frontend** to finalize the transaction directly with the payment provider. This ensures sensitive data (like credit card numbers) never touches your backend server.

### 1. Stripe
-   **Who uses it:** The Frontend (Angular).
-   **How:**
    -   The frontend installs `@stripe/stripe-js`.
    -   It calls `stripe.confirmCardPayment(clientSecret, { payment_method: { card: cardElement } })`.
    -   Stripe verifies the secret and the card details.
    -   If 3D Secure is needed, Stripe handles the modal automatically.
    -   Upon success, Stripe returns a confirmation to the frontend, which then calls the backend `confirm` endpoint (or relies on webhooks).

### 2. Paymob
-   **Card:**
    -   **Who uses it:** The Frontend.
    -   **How:** The `clientSecret` in this context typically maps to Paymob's **Payment Key**.
    -   The frontend uses this key to initialize the Paymob Iframe or SDK.
    -   Example: `https://accept.paymob.com/api/acceptance/iframes/{iframe_id}?payment_token={clientSecret}`.
    -   The user enters card details in the secure iframe.

-   **Wallet:**
    -   **Who uses it:** The Frontend.
    -   **How:**
            frontend must be call endpoint below then get redirect_url from response and redirect user to this url   
        -   **Endpoint:** `https://accept.paymob.com/api/acceptance/payments/pay`
        -   **Method:** `POST`
        -   **Request Body:**
```json
            {
              "payment_token": "{clientSecret}",
              "source": {
                "identifier": "{mobile_number}",
                "subtype": "WALLET"
              }
            }
```
            - `payment_token`: The `clientSecret` received from your backend
            - `identifier`: The user's mobile wallet number (e.g., "01XXXXXXXXX")
            - `subtype`: Always "WALLET" for mobile wallet payments
        
        -   **Response (Success):**
```json
            {
              "redirect_url": null
            }
```
            - `redirect_url`: The URL to redirect the user to after the payment is completed
        
        -   **Response (Error):**
```json
            {
              "detail": "Invalid mobile number format",
              "status_code": 400
            }
```
            or
```json
            {
              "detail": "Insufficient wallet balance",
              "status_code": 402
            }
```
        
        -   **Frontend Flow:**
            1. User enters their mobile wallet number
            2. Frontend calls the Paymob endpoint with the `clientSecret` and mobile number
            3. User receives otp on his mobile
            4. Frontend displays a "Pending Approval" screen
            5. Frontend either:
               - Polls your backend to check payment status, OR
               - Waits for your backend webhook to confirm completion
            6. Show success/failure message based on the final status

---

## Real-time Notifications (SignalR)

The API uses SignalR to provide real-time updates on payment status changes. This is particularly useful for handling asynchronous payment confirmations (e.g., webhooks) and updating the UI immediately.

### Connection
- **Hub URL:** `/hub/payment`

### Client Methods (Invoke on Server)
| Method Name | Parameters | Description |
| :--- | :--- | :--- |
| `JoinGroup` | `paymentIntentId` (string) | Joins a group specific to a payment intent to receive updates for it. |
| `LeaveGroup` | `paymentIntentId` (string) | Leaves the payment intent group. |

### Server Events (Listen on Client)
| Event Name | Payload | Description |
| :--- | :--- | :--- |
| `ReceivePaymentStatus` | `status` (enum) | Triggered when the payment status changes. The payload is the enum representation of the new status (e.g., "Captured", "Failed", "Canceled"). |

### Example Workflow
1.  **Connect:** Client connects to `/hub/payment`.
2.  **Join:** Client invokes `JoinGroup` with the `paymentIntentId` obtained from the `create-intent` endpoint.
3.  **Listen:** Client listens for the `ReceivePaymentStatus` event.
4.  **Update:** When the backend processes a webhook or confirms a payment, it sends a `ReceivePaymentStatus` event to the group.
5.  **React:** Client receives the event and updates the UI (e.g., shows success message, redirects to confirmation page).
6.  **Leave:** Client invokes `LeaveGroup` or disconnects when done.

## Testing Data (Test Cards)

### 1. Stripe Test Cards
Use these cards in the Stripe payment element or card input.

| Type | Card Number | Expiry | CVC | ZIP |
|------|-------------|--------|-----|-----|
| **Success** | `4242 4242 4242 4242` | Any Future | Any | Any |
| **Authentication Required (3DS)** | `4000 0027 6000 3184` | Any Future | Any | Any |
| **Declined (Generic)** | `4000 0000 0000 0002` | Any Future | Any | Any |
| **Insufficient Funds** | `4000 0000 0000 0099` | Any Future | Any | Any |

### 2. Paymob Test Cards
Use these cards in the Paymob iframe.

| Type | Card Number | Expiry | CVC | PIN / OTP |
|------|-------------|--------|-----|-----------|
| **Success (MasterCard)** | `5123 4567 8901 2346` | Any Future | `123` | `1234` |
| **Success (Visa)** | `4111 1111 1111 1111` | Any Future | `123` | `1234` |
| **Failure** | `5123 4567 8901 2346` | Any Future | `123` | Enter wrong OTP |

### 3. Paymob Test wallet
Use phone 01010101010
otp :123456

