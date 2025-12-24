# Goizzi UI Feedback Contract (General UI Instructions & Preferences)

Purpose: ensure user feedback is always visible, consistent, measurable, and enforced across the mobile app and web CMS.
General Icons: lucide-react

---

## 1) UI Feedback Contract (Non-negotiables)

### 1.1 Every action has 4 user-visible states
For any user-triggered action (Save, Post Payment, Reverse, Create Loan, Update KYC, etc.) the UI **must** show:

1) **Idle**
- Button enabled
- Inputs editable

2) **Working**
- Button disabled (prevents double submit)
- Spinner/progress indicator
- Clear message: “Posting payment…” / “Saving borrower…”

3) **Success**
- Confirmation banner/toast + clear summary:  
  - “Payment posted. Balance updated.”
- Optional “View details” link to the created/updated record

4) **Failure**
- Human-readable error message
- Clear next step: “Fix allocation totals” / “Retry”
- If retryable, show a retry action (button/link)

**Rule:** Never leave users uncertain whether the action succeeded.

---

### 1.2 Optimistic UI policy
- **Allowed optimistic updates** (safe, non-financial):
  - Notes, comments, UI preferences, non-critical profile fields
- **Not allowed optimistic updates** (financial/audit):
  - Posting payments
  - Reversing payments
  - Creating/closing loans
  - Any ledger-affecting write

**Rule:** Financial actions must confirm from committed results (transaction / server response).

---

### 1.3 Inline validation before submit
- Validate required fields during input (not only on submit).
- For payments, show live validation:
  - **Payment Total vs Allocation Sum** indicator
  - Disable submit until valid

**Rule:** Prevent predictable errors early.

---

### 1.4 Audit context is always visible for finance records
When displaying a payment/ledger-affecting record, show at minimum:
- Status: `Posted` / `Reversed` / `Pending`
- `Encoded by`, `Encoded at`
- `Paid at`
- `Method` + `Reference No`
- If reversed: show reversal reason + link to reversal record

**Rule:** Users should be able to answer “who did what, when, and why” from the UI.

---

### 1.5 List screens must handle all states
Every list screen must implement:
- **Loading** state (skeleton or spinner; never blank)
- **Empty** state (what it means + what to do next)
- **Error** state (message + retry)
- **Content** state (data list)

**Rule:** No list screen ships without Empty and Error states.

---

### 1.6 Offline and slow-network behavior
- If offline:
  - Allow browsing cached data if available (read-only)
  - Disable financial actions with an explicit reason: “Offline. Cannot post payments.”
- If slow:
  - Show progress indicator within 300–500ms
  - Avoid “frozen screen” perception

**Rule:** Users must understand whether the app is waiting, blocked, or completed.

---

### 1.7 Confirmation patterns
- Destructive actions (Reverse Payment, Close Loan):
  - Confirmation dialog
  - Show impact summary (amount, loanId, borrower)
  - Require a **reason** text for reversals
- Non-destructive actions:
  - Toast/snackbar confirmation is usually sufficient

**Rule:** High-impact actions require explicit confirmation and traceability.

---

## 2) UI Preferences (Consistency & Speed)

### 2.1 Standard component usage (no ad-hoc patterns)
Build and reuse these components across all screens:

- `AsyncButton`
  - Handles: idle/working/success/failure
  - Supports idempotency keys where relevant

- `ScreenStateView`
  - Handles: loading/empty/error/content

- `InlineValidationRow`
  - Shows per-field validation and system constraints

- `ResultBanner`
  - Standard success/failure summary with optional “View details”

**Rule:** Screens must not implement custom loading/error logic unless justified.

---

### 2.2 Standard error mapping (human-friendly messages)
Map known error types to consistent UX messages:

- `AllocationMismatchError`
  - “Allocation total must equal payment total.”
- `ConflictError` (duplicate borrower key)
  - “Borrower already exists (same phone/ID).”
- `NotFoundError`
  - “Record not found. Refresh and try again.”
- `TransientNetworkError`
  - “Network issue. Retry.”

**Rule:** Never show raw exceptions or stack traces to end users.

---

### 2.3 Prevent double-submits
For any write action:
- Disable the primary action while working
- Use idempotency key on the backend/transaction boundary when possible
- Ensure success/failure returns the screen to a stable state

**Rule:** User cannot accidentally post the same payment twice.

---

### 2.4 Search/filter persistence
For list dashboards (loans due list, borrower search):
- Persist last-used filters per user/device
- Keep search terms visible and editable

**Rule:** The app should feel stable and predictable between sessions.

---

## 3) Enforcement (So Feedback Is Always Observed)

### 3.1 PR checklist (required)
Any PR that changes UI must answer:

- Does every action implement the 4 states?
- Is validation shown before submit?
- What happens on offline?
- How are errors mapped to readable messages?
- How is double-submit prevented?
- Is there success confirmation and a “View details” path?

---

### 3.2 Instrumentation (measure compliance)
Log privacy-safe events:

- `ACTION_STARTED`
- `ACTION_SUCCEEDED`
- `ACTION_FAILED`

Include:
- `screenName`
- `actionName`
- `latencyMs` (or bucket)
- `errorType` (not raw message)
- `isOffline` flag

Metrics to monitor:
- Failure rate per action
- Retry rate per action
- Median time-to-success
- Abandon rate (started but no completion)

**Rule:** If you can’t measure it, you can’t improve it.

---

### 3.3 In-app feedback hook (fast debugging)
Add “Report issue” on critical finance screens:
- Borrower profile
- Loan details
- Post payment
- Payment detail
- Reverse payment dialog

Attach minimal context (no PII):
- loanId, paymentId, timestamp, screenName, actionName

---

## 4) Minimum Critical Screens (Goizzi MVP)
These screens must comply fully with the contract:

1. Borrower search
2. Borrower profile (loans list)
3. Loan details (balances + payments + ledger)
4. Post payment (manual allocation)
5. Reverse payment

---

## 5) Recommended next step (implementation order)
1. Implement shared components (`AsyncButton`, `ScreenStateView`, `ResultBanner`)
2. Implement standard error mapping
3. Implement Post Payment screen using the contract (vertical slice)
4. Roll the same patterns out to the remaining screens

---
End of document.
