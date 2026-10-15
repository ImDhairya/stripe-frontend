# PayGate Frontend — Dashboard & Payment Command Center

The web dashboard and payment management interface for PayGate. Built with **React 18**, **Vite**, **TypeScript**, **Tailwind CSS**, **Zustand**, and **Radix UI**. It provides merchants and platform administrators with complete control over transactions, two-phase capture, refunds, webhook delivery inspection, and real-time observability.

---

## Table of Contents
1. [Tech Stack & UI Architecture](#tech-stack--ui-architecture)
2. [Application Directory Layout](#application-directory-layout)
3. [Page-by-Page Feature Tour](#page-by-page-feature-tour)
   - [Dashboard (`/`)](#1-dashboard-)
   - [Payments List & Search (`/payments`)](#2-payments-list--search-payments)
   - [Create Payment (`/payments/new`)](#3-create-payment-paymentsnew)
   - [Payment Detail & Action Center (`/payments/:id`)](#4-payment-detail--action-center-paymentsid)
   - [Webhooks Command Center (`/webhooks`)](#5-webhooks-command-center-webhooks)
   - [Observability & Audit (`/telemetry`)](#6-observability--audit-telemetry)
   - [Admin Console (`/admin`)](#7-admin-console-admin)
   - [Authentication & 1-Click Login (`/login`)](#8-authentication--1-click-login-login)
4. [Client API Architecture & Auth Flow](#client-api-architecture--auth-flow)
5. [Setup & Running Locally](#setup--running-locally)

---

## Tech Stack & UI Architecture

- **Framework:** React 18 + Vite (fast HMR and optimized Rolldown/Vite builds)
- **Language:** TypeScript 5.0 (Strict mode, zero `any` leaks)
- **Styling:** Tailwind CSS with Dark/Light design tokens and responsive layouts
- **State Management:** Zustand for lightweight auth session state
- **UI Components:** Radix UI primitives / Shadcn UI (Table, Dialog, Card, Badge, Button, Input)
- **Icons:** Lucide React
- **Notifications:** In-app toast notification queue (`useToast`)

---

## Application Directory Layout

```
frontend/src/
├── App.tsx                         # Router definitions & route guards
├── main.tsx                        # React DOM client root
├── index.css                       # Tailwind theme styles & CSS variables
├── api/                            # Strongly-typed HTTP fetch clients
│   ├── client.ts                   # Base apiFetch with cookie credentials & rate limit tracking
│   ├── auth.ts                     # Login, signup, logout, /auth/me
│   ├── payments.ts                 # Payments CRUD, capture, cancel, stats
│   ├── search.ts                   # Paginated multi-resource search client
│   ├── webhooks.ts                 # Webhook endpoints, events, test triggers
│   ├── system.ts                   # Telemetry, queue gauges, infrastructure latency
│   └── admin.ts                    # User tier management
├── components/
│   ├── layout/                     # AppShell (sidebar navigation, header, user tier badge)
│   ├── shared/                     # Reusable widgets (SearchBar, Pagination, StatusBadge, QuotaWarning)
│   ├── showcase/                   # Product showcase card
│   └── ui/                         # Base design system components (Button, Card, Table, Dialog, Badge)
├── hooks/                          # Custom React hooks (use-toast, use-mobile)
├── lib/
│   └── utils.ts                    # Minor-unit currency formatter (formatCurrency) and cn helper
└── pages/
    ├── auth/                       # LoginPage & SignupPage
    ├── dashboard/                  # DashboardPage (KPIs, recent payments, recent audit logs)
    ├── payments/                   # PaymentListPage, PaymentDetailPage, CheckoutPage
    ├── webhooks/                   # WebhookPage (endpoint manager & live delivery log)
    ├── telemetry/                  # TelemetryPage (live telemetry, stress tests, audit explorer)
    └── admin/                      # AdminPage (user tier management)
```

---

## Page-by-Page Feature Tour

### 1. Dashboard (`/`)
- **Real-Time Financial KPIs**: Directly powered by the backend's true SQL aggregation (`GET /api/v1/payments/stats`):
  - **Settled Volume**: Total successful transaction volume formatted in local currency.
  - **Authorized Hold Volume**: Funds reserved on customer cards awaiting capture.
  - **Success Rate %**: Ratio of successful vs failed payments.
  - **Delivery Health**: Status of asynchronous BullMQ background workers.
- **Recent Transactions**: Quick snapshot of the last 5 transactions with status badges.
- **Recent Audit Trail**: Live log of state mutations across the account.

### 2. Payments List & Search (`/payments`)
- **Paginated Table**: Displays amount, status badge, processor, timestamp, and quick-view action.
- **Search Bar**: Debounced multi-field search across payment ID, processor, currency, and status.
- **Interactive Sorting**:
  - Dedicated **Sort Toggle Button** (`Newest First (Desc)` / `Oldest First (Asc)`).
  - Clickable **Date** table header with dynamic sort direction arrows (`↑` / `↓`).
- **Pagination Controls**: Previous/Next navigation with entries count (`Showing 1 to 10 of 31 entries`) and total page counter (`Page 1 of 4`).

### 3. Create Payment (`/payments/new`)
- **Minor-Unit Currency Standard**: Clean currency input automatically converts standard units (e.g. `10.00`) into integer minor units (`1000`) before dispatching to the API.
- **Multi-Currency Support**: Choose between INR (₹), USD ($), EUR (€), and GBP (£).
- **Two-Phase Capture Method**:
  - **Automatic**: Immediate authorization and settlement.
  - **Manual (Authorize & Hold)**: Reserves funds on the card without settling.
- **Deterministic Decline Tip**: Clear helper indicating that entering amounts ending in `.99` (e.g. `₹10.99`) deterministically simulates card declines.

### 4. Payment Detail & Action Center (`/payments/:id`)
- **Lifecycle Stepper**: Visual timeline illustrating the payment's exact progress through the state machine (`Created` → `Processing` → `Authorized` → `Succeeded` / `Refunded`).
- **Contextual Action Modals**:
  - When in `Authorized` state:
    - **Capture Payment**: Supports full capture or partial capture (e.g. capture `₹300.00` of a `₹500.00` hold).
    - **Cancel Authorization**: Releases the hold back to the customer's card.
  - When in `Succeeded` state:
    - **Issue Refund**: Supports full refund or partial refund with custom reason notes.

### 5. Webhooks Command Center (`/webhooks`)
- **1-Click Built-in Sandbox Receiver**: Registers a local webhook target with one click (`/api/v1/webhook-endpoints/sandbox-receiver/:id`).
- **Reveal Signing Secret**: Toggle to inspect the cryptographic secret (`whsec_...`) used to sign outbound payloads.
- **Simulated Test Triggers**:
  - **Send Test Event (200 OK)**: Dispatches a real event and confirms HMAC-SHA256 signature verification.
  - **Simulate 3x Failure + Backoff**: Tests BullMQ worker resilience by forcing 3 consecutive failures, verifying exponential backoff rescheduling.
- **Live Delivery Log**: Real-time table polling every 3 seconds for pending jobs, showing HTTP status, attempt count (e.g. `1/5`), and an **Inspect Payload & HMAC** modal.

### 6. Observability & Audit (`/telemetry`)
- **Live System Latency**: Real-time Redis `PING` latency (ms) and PostgreSQL `SELECT 1` query latency (ms).
- **BullMQ Queue Depths**: Live gauges for Waiting, Active, Completed, Failed, and Delayed webhook jobs.
- **Interactive Architecture Stress-Tester**:
  - **Card 1: SHA-256 Idempotency Replay**: Fires 2 identical payment requests with the same key. The second request returns in <5ms from Redis without creating a second charge.
  - **Card 2: Idempotency Payload Tamper**: Fires a second request with an altered amount, triggering an instant `409 Conflict`.
  - **Card 3: Sliding-Window Rate Limit Burst**: Dispatches 12 concurrent requests to demonstrate the Redis sliding-window rate limiter (`429 Too Many Requests`).
- **Immutable Audit Trail Explorer**: Searchable, paginated audit table with JSON metadata modal and ASC/DESC sorting.

### 7. Admin Console (`/admin`)
- Accessible to platform administrators (`admin@paygate.com`).
- View all registered users and their monthly transaction tier (`Free` vs `Paid`).
- One-click tier toggling to simulate quota upgrades.

### 8. Authentication & 1-Click Login (`/login`)
- Clean email/password authentication backed by JWT HttpOnly cookies.
- **One-Click Demo Buttons**:
  - **Login as Assessor Admin** (`admin@paygate.com`)
  - **Login as Demo Merchant** (`merchant@paygate.com`)

---

## Client API Architecture & Auth Flow

1. **HttpOnly Cookie Authentication**:
   - Authentication tokens are never stored in `localStorage` or `sessionStorage` (preventing XSS theft).
   - Every fetch request in [`src/api/client.ts`](file://src/api/client.ts) uses `credentials: 'include'`.
2. **CORS & Rate Limit Visibility**:
   - Backend exposes headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `Retry-After`.
   - `client.ts` intercepts these headers to track API usage and quota limits.
3. **Currency Utilities**:
   - [`src/lib/utils.ts`](file://src/lib/utils.ts): `formatCurrency(amountMinor, currency)` formats minor integer units into clean localized strings (e.g. `1000` + `inr` → `₹10.00`).

---

## Setup & Running Locally

### Development Server
```bash
# Install dependencies
npm install

# Start Vite development server with HMR on http://localhost:5173
npm run dev
```

### Production Build & Type Check
```bash
# Run TypeScript compilation check and Vite production bundle
npm run build
```
This generates an optimized production bundle in `dist/` with zero TypeScript errors.
