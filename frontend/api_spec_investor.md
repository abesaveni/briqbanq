# Brickbanq Investor API Specification

This document outlines the API endpoints required by the Investor frontend module. All endpoints should follow the standardized response format.

## Standard Response Format
```json
{
  "success": true,
  "data": { ... },
  "message": "OK",
  "error": null
}
```

---

## 1. Auctions & Bidding
Managed by `auctionService`.

### GET `/api/investor/auctions`
*   **Description**: Get all active/upcoming auctions.
*   **Response Data**: Array of auction/deal objects.

### GET `/api/investor/auctions/{id}`
*   **Description**: Get detailed information for a specific auction.
*   **Response Data**: Deal object enriched with images, metrics, financials, and details.

### POST `/api/investor/auctions/{id}/bid`
*   **Description**: Place a new bid on an auction.
*   **Body**: `{ "amount": number }`
*   **Response Data**: `{ "success": true, "bid": { "user": string, "amount": number, "timestamp": string } }`

### GET `/api/investor/auctions/{id}/bids`
*   **Description**: Get bid history for a specific auction.

### GET `/api/investor/auctions/{id}/documents`
*   **Description**: Get property documents for a specific auction.

---

## 2. Deals Marketplace
Managed by `dealsService`.

### GET `/api/investor/deals`
*   **Description**: Get all available properties in the marketplace.

### GET `/api/investor/deals/{id}`
*   **Description**: Get details for a specific deal.

### POST `/api/investor/deals/{id}/purchase`
*   **Description**: Execute a "Buy Now" purchase for a deal.
*   **Response Data**: Updated deal object with "Sold" status.

### PUT `/api/investor/deals/{id}`
*   **Description**: Update metadata or status for a deal (Admin/Lead functionality).

### POST `/api/investor/deals/{id}/notes`
*   **Description**: Add a staff/internal note to a deal.

### DELETE `/api/investor/deals/{id}/notes/{noteId}`
*   **Description**: Remove a note.

### PUT `/api/investor/deals/{id}/tasks/{taskId}/status`
*   **Description**: Update the status of a specific task within a deal.

---

## 3. Contracts
Managed by `contractService`.

### GET `/api/investor/contracts`
*   **Description**: Get all contracts associated with the logged-in investor.

### GET `/api/investor/contracts/{id}`
*   **Description**: Get specific contract details for viewing/signing.

### POST `/api/investor/contracts/{id}/sign`
*   **Description**: Submit digital signature data for a contract.

### POST `/api/investor/contracts/{id}/documents`
*   **Description**: Upload supportive documents for a contract (Multi-part form data).

---

## 4. Escrow & Funds
Managed by `escrowService`.

### GET `/api/investor/escrow`
*   **Description**: Get summary of funds held in escrow and settlement details.

### GET `/api/investor/escrow/transactions`
*   **Description**: Get transaction history for escrow releases.

### POST `/api/investor/escrow/{escrowId}/release/{transactionId}`
*   **Description**: Authorize the release of specific funds from escrow.

### POST `/api/investor/escrow/{escrowId}/authorize_all`
*   **Description**: Batch authorize all pending releases.

---

## 5. User Profile & Documents
Managed by `userService`.

### GET `/api/user/profile`
*   **Description**: Get the current user's profile information.

### PUT `/api/user/profile`
*   **Description**: Update profile details.

### GET `/api/user/settings`
*   **Description**: Get comprehensive account settings.

### PUT `/api/user/settings/{settingsType}`
*   **Description**: Update specific settings blocks (e.g., security, notifications).

### GET `/api/user/documents`
*   **Description**: Get documents uploaded by the investor during signup (Identity, Proof of Funds).

---

## 6. Security & Auth
Managed by `authService`.

### POST `/api/auth/change-password`
### POST `/api/auth/2fa/enable`
### POST `/api/auth/2fa/disable`
### GET `/api/auth/sessions`
*   **Description**: Get active login sessions across devices.
### DELETE `/api/auth/sessions/{id}`
*   **Description**: Force logout of a specific session.
### DELETE `/api/auth/sessions/logout-others`
*   **Description**: Force logout of all other sessions except the current one.

---

## 7. Notifications
Managed by `notificationService`.

### GET `/api/user/notifications`
*   **Description**: Get user notifications list.
### GET `/api/user/notification-preferences`
### PUT `/api/user/notification-preferences`
### PUT `/api/user/notifications/{id}/read`
### PUT `/api/user/notifications/read_all`
### DELETE `/api/user/notifications/{id}`
### DELETE `/api/user/notifications` (Clear all)

---

## 8. Reports & Analytics
Managed by `analyticsService`.

### GET `/api/investor/analytics/summary?range={range}`
*   **Parameters**: `range` (e.g., "Last 30 Days", "This Year")
### GET `/api/investor/analytics/charts?range={range}`
### GET `/api/investor/analytics/activity`
### GET `/api/investor/analytics/export?section={section}&format={format}`
*   **Parameters**: `section` (Financial Summary, etc.), `format` (pdf, csv)

---

## 9. Dynamic Forms
Managed by `formService`.

### GET `/api/forms`
*   **Description**: Get all available field-customizable forms.
### GET `/api/forms/{formId}/fields`
### POST `/api/forms/{formId}/fields`
### PATCH `/api/forms/{formId}/fields/{fieldId}`
### DELETE `/api/forms/{formId}/fields/{fieldId}`

---

## 10. Integrations
Managed by `integrationService`.

### GET `/api/integrations`
*   **Description**: Get status and config for external providers (PEXA, RPData, InfoTrack).
### POST `/api/integrations/{id}/test`
*   **Description**: Trigger a connection test for an API integration.
