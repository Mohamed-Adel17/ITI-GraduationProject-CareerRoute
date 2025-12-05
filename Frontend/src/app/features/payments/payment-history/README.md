# Payment History Component

A comprehensive payment history display component for Career Route that shows user payment transactions with multi-currency support, pagination, and filtering capabilities.

## Overview

The Payment History Component displays a user's payment transaction history in a clean, organized interface with summary cards and a detailed transaction table. It supports multiple currencies (USD for Stripe, EGP for Paymob) and calculates global totals across all pages.

## Features

### Summary Cards (4 Cards)
- **Total Spent (USD)** - Displays total amount spent via Stripe payments
- **Total Spent (EGP)** - Displays total amount spent via Paymob payments
- **Total Refunded** - Shows refunded amounts in both USD and EGP
- **Net Spent (EGP)** - Combined net spending with USD converted to EGP at 1:50 rate

### Payment Transaction Table
- Paginated list (10 items per page)
- Columns: Date, Amount, Description, Status
- Currency-aware display (USD for Stripe, EGP for Paymob)
- Status badges with color coding
- Refund information displayed inline

### Filtering & Navigation
- Status filter dropdown (All, Completed, Pending, Refunded, Failed)
- Pagination controls with page numbers
- Page information ("Showing X to Y of Z payments")

### UI States
- **Loading State** - Spinner with loading message
- **Empty State** - Friendly message when no payments exist
- **Error State** - Error message for API failures (404 handled gracefully)
- **Responsive Design** - Works on mobile, tablet, and desktop
- **Dark Mode** - Full dark mode support

## Route

```typescript
path: '/user/payments/history'
title: 'Payment History - Career Route'
```

## API Integration

### Endpoint
```
GET /api/payments/history
```

### Query Parameters
- `page` (number) - Page number (default: 1)
- `pageSize` (number) - Items per page (default: 10)
- `status` (string, optional) - Filter by payment status

### Response Structure
```typescript
{
  payments: PaymentHistoryItem[];
  paginationMetadata: PaginationMetadata;
  summary: PaymentHistorySummary;
}
```

## Currency Handling

### Multi-Currency Display
- **Stripe payments**: Displayed in USD ($)
- **Paymob payments**: Displayed in EGP (E£)
- Each payment shows in its original currency

### Global Totals Calculation
The component fetches all payments (up to 1000 records) in the background to calculate accurate global totals:
- Totals are calculated across ALL payments, not just the current page
- USD and EGP totals are tracked separately
- Net spent combines both currencies by converting USD to EGP (1 USD = 50 EGP)

### Currency Conversion
```typescript
USD_TO_EGP_RATE = 50
combinedNetSpentEGP = (netSpentUSD × 50) + netSpentEGP
```

## Component Structure

### Files
```
payment-history/
├── payment-history.component.ts       # Component logic
├── payment-history.component.html     # Template
├── payment-history.component.scss     # Styles
└── README.md                          # This file
```

### Key Properties
```typescript
// Payment data
payments: PaymentHistoryItem[]
summary: PaymentHistorySummary | null
pagination: PaginationMetadata | null

// UI state
isLoading: boolean
errorMessage: string | null
selectedStatus: PaymentStatus | null

// Calculated totals
totalSpentUSD: number
totalSpentEGP: number
totalRefundedUSD: number
totalRefundedEGP: number
combinedNetSpentEGP: number
```

### Key Methods

#### Data Loading
- `loadPaymentHistory()` - Loads paginated payment list
- `loadAllPaymentsForSummary()` - Loads all payments for global totals

#### Formatting
- `formatAmount(payment)` - Formats amount with correct currency
- `formatRefundAmount(payment)` - Formats refund amount with currency
- `formatDate(dateString)` - Formats payment date

#### Navigation & Filtering
- `onPageChange(page)` - Handles pagination
- `onStatusFilter(status)` - Handles status filtering

#### UI Helpers
- `getStatusText(status)` - Returns human-readable status
- `getStatusBadgeClass(status)` - Returns Tailwind classes for status badge

## Error Handling

### 404 Errors (No Payment History)
- No error message shown
- Empty state displays instead
- Summary cards show $0.00 / E£0.00

### Other Errors
- Error message: "Failed to load payment history. Please try again."
- User can retry by refreshing or changing filters

## Usage Example

### Navigation
```typescript
// Navigate to payment history
router.navigate(['/user/payments/history']);
```

### Standalone Import
```typescript
import { PaymentHistoryComponent } from './features/payments/payment-history/payment-history.component';
```

## Dependencies

### Angular Modules
- `CommonModule` - Common directives (*ngIf, *ngFor)
- `FormsModule` - Two-way binding for status filter

### Services
- `PaymentService` - Handles API calls to payment endpoints

### Models
```typescript
import {
  PaymentHistoryItem,
  PaymentHistoryResponse,
  PaymentHistorySummary,
  PaymentStatus,
  PaginationMetadata
} from '../../../shared/models/payment.model';
```

## Styling

The component uses TailwindCSS utility classes for styling:
- Responsive grid layouts
- Dark mode variants
- Smooth transitions and hover effects
- Accessible form controls
- Status badge color coding

### Status Badge Colors
- **Completed** (Captured): Green
- **Pending**: Yellow
- **Refunded**: Blue
- **Failed**: Red
- **Authorized**: Gray

## Performance Considerations

### Pagination
- Main list loads only 10 items per page
- Reduces initial load time and improves UX

### Background Loading
- All payments fetched separately for summary calculation
- Does not block main UI
- Maximum 1000 records (configurable via `pageSize` parameter)

### Error Resilience
- Summary calculation failures handled silently
- Main data load failures show user-friendly messages
- 404 errors (no data) treated as valid empty state

## Testing Recommendations

### Manual Testing
1. **Empty State** - Test with no payment history
2. **Single Page** - Test with <10 payments
3. **Multiple Pages** - Test with >10 payments
4. **Filtering** - Test all status filters
5. **Multi-Currency** - Test with both USD and EGP payments
6. **Refunds** - Test payments with refunds
7. **Dark Mode** - Verify dark mode styling
8. **Responsive** - Test on mobile, tablet, desktop

### Edge Cases
- User with only USD payments
- User with only EGP payments
- User with only refunded payments
- Network errors during load
- Very large payment history (>1000 records)

## Future Enhancements

### Potential Features
- Export to CSV/PDF
- Date range filtering
- Search by mentor name or session topic
- Payment method filtering
- Detailed transaction view modal
- Receipt download
- Multi-select for bulk actions

### Performance Optimizations
- Virtual scrolling for large datasets
- Progressive loading (infinite scroll)
- Caching strategy for summary data
- Backend support for currency-specific totals

## Support

For issues or questions:
1. Check the component logs in browser console
2. Verify API endpoint is accessible
3. Confirm user authentication
4. Check backend payment history endpoint documentation

## Version History

- **v1.0.0** (2025-12-03)
  - Initial release
  - Multi-currency support (USD/EGP)
  - Global totals calculation
  - Status filtering
  - Pagination
  - Empty state handling
  - Dark mode support
