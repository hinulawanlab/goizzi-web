# Goizzi Firestore (Firebase) Schema (v1)

This schema is optimized for:
- **Manual payment allocation** (staff decides how a payment is applied)
- **Accounting-grade auditability** (reversals/adjustments as new records, not edits)
- **No collectors workflow** (office encoding + ATM/deposit references)
- **Borrower identity shared across branches** (unique borrower across the company)
- Scale target: **50k–100k borrowers**
- **Every collection must have its own field documentID**

---

## Conventions

### Field Types (Firestore)
- `string`, `number`, `boolean`
- `timestamp` (Firestore Timestamp)
- `map` (object)
- `geopoint` (GeoPoint), or `map` `{lat, lng}` if you prefer
- `array` (avoid unbounded growth arrays; prefer subcollections)

### Status enums (suggested)
- Borrower: `active | blocked | archived`
- Loan: `draft | approved | active | delinquent | closed | writtenOff`
- Payment: `posted | reversed | pending`
- Ledger entry: `posted | reversed`

### Money
- Store amounts as **integer Amount units** (recommended), e.g. PHP centavos:
  - `amountAmount: number` (e.g., ₱100.00 → `10000`)
  - `currency: string` (e.g., `"PHP"`)

---

## Top-level Collections

```
/borrowers/{borrowerId}
/borrowerKeys/{keyId}
/borrowerAccounts/{userId}            (optional; borrower auth mapping)
/loans/{loanId}
/branches/{branchId}
/loanProducts/{productId}
/pricingPolicies/{policyId}/versions/{versionId}
/users/{userId}                       (optional; staff)
/paymentInstruments/{instrumentId}    (optional; ATM card metadata)
/auditLogs/{logId}                    (optional; global audit)
```

---

## 1) Borrowers

### `/borrowers/{borrowerId}`
Small, fast “profile header” document. Keep PII-heavy KYC in a subcollection.

**Fields**
- `fullName: string`
- `completeAddress: string`
- `phone: string` (E.164 recommended, e.g. `+63...`)
- `email: string?`
- `status: string` (`active|blocked|archived`)
- `createdAt: timestamp`
- `createdByUserId: string?`
- `primaryBranchId: string?` (where they usually transact)
- `borrowerId: string`

**Denormalized quick stats**
- `activeLoanCount: number`
- `lastLoanAt: timestamp?`
- `lastPaymentAt: timestamp?`

**Location summary (computed)**
- `locationSummary: map`
  - `usualAreaGeohash: string?`
  - `usualAreaLabel: string?` (e.g., `"Quezon City - Cubao"`)
  - `confidenceScore: number?` (0..1)
  - `updatedAt: timestamp?`

**App-level tuning**
- `/appConfig/constants` (single document per environment)
  - `LOCATION_CLUSTER_RADIUS_METERS: number` (meters to group raw GPS points)
  - `LOCATION_CLUSTER_MIN_POINTS: number` (minimum observations required for a cluster)
  - `RECENT_TOP_LOCATION_LIMIT: number` (how many top location clusters to store per borrower)

**Subcollections**
```
/borrowers/{borrowerId}/kyc/{docId}
/borrowers/{borrowerId}/locationObservations/{obsId}
/borrowers/{borrowerId}/references/{referenceId}
/borrowers/{borrowerId}/notes/{noteId}            (optional)
```

---

### `/borrowers/{borrowerId}/kyc/{docId}`
**Fields**
- `type: string` (e.g., `governmentId|proofOfAddress|proofOfBilling|selfie`)
- `idNumber: string?` (consider encryption/tokenization later)
- `issuer: string?`
- `expiryDate: timestamp?`
- `storageRefs: array` (Cloud Storage paths/URLs; keep small)
- `documentType: string?` (used for proof of billing)
- `isApproved: boolean?`
- `verifiedAt: timestamp?`
- `verifiedByUserId: string?`
- `createdAt: timestamp`

> Security rules should restrict this more tightly than `/borrowers`.

---

### `/borrowers/{borrowerId}/locationObservations/{obsId}`
Raw signals used to compute “usual location.” Keep event-based.

**Fields**
- `capturedAt: timestamp`
- `source: string` (`appOpen|payment|officeVisit|manual|auto`)
- `geohash: string?`
- `geo: geopoint?`
- `accuracyMeters: number?`
- `branchId: string?`
- `loanId: string?`
- `paymentId: string?`

**Retention suggestion**
- Keep raw observations **90–180 days**, keep `locationSummary` long-term.

---

### `/borrowers/{borrowerId}/notes/{noteId}` (optional)
**Fields**
- `note: string`
- `applicationId: string?` (links a note to a loan application)
- `createdAt: timestamp`
- `createdByUserId: string`
- `createdByName: string?` (displayName snapshot)
- `noteId: string`

### `/borrowers/{borrowerId}/references/{referenceId}`
**Fields**
- `name: string`
- `mobileNumber: string`
- `address: string`
- `createdAt: timestamp`
- `referenceId: string`
- `contactStatus: string` (`pending|agreed|declined|no_response`)
- `updatedAt: timestamp?`

---

## 2) Borrower Uniqueness Keys (Company-wide)

### `/borrowerKeys/{keyId}`
Ensures borrower identity is unique across branches. Use **transactions** to enforce.

**Key format (recommended)**
- `phone:+63XXXXXXXXXX`
- `govid:SSS-...` / `govid:UMID-...`
- `email:...`

**Fields**
- `borrowerId: string`
- `keyType: string` (`phone|govid|email`)
- `keyValue: string`
- `createdAt: timestamp`
- `createdByUserId: string?`

**Uniqueness flow (transaction)**
1. Create `/borrowerKeys/{keyId}` if it does not exist
2. Create `/borrowers/{borrowerId}`

---

## 3) Loans (Top-level for dashboard queries)

### `/loans/{loanId}`
Top-level to support queries like “Branch X due today” without scanning borrowers.

**Identity**
- `borrowerId: string`
- `branchId: string`
- `productId: string`
- `pricingPolicyVersion: string` (or `policySnapshot: map`)

**Core terms**
- `status: string` (`draft|approved|active|delinquent|closed|writtenOff`)
- `currency: string` (e.g., `"PHP"`)
- `principalAmount: number`
- `loanInterest: number`
- `approvedAt: timestamp`
- `startDate: timestamp`
- `termDays: number?` / `termMonths: number?`
- `paymentFrequency: string` (`daily|weekly|monthly`)
- `maturityDate: timestamp?`

**Denormalized borrower fields (optional but useful for lists)**
- `borrowerName: string`
- `borrowerPhone: string`
- `applicationId: string?`

**Operational summary fields (updated after postings)**
- `nextDueDate: timestamp?`
- `daysPastDue: number` (computed nightly or on write)
- `lastPaymentAt: timestamp?`

**Accounting summary fields (fast read; derived from ledger)**
- `balances: map`
  - `principalOutstandingAmount: number`
  - `interestOutstandingAmount: number`
  - `feesOutstandingAmount: number`
  - `penaltiesOutstandingAmount: number`
  - `totalOutstandingAmount: number`
- `totals: map`
  - `totalPaidAmount: number`
  - `totalFeesChargedAmount: number`
  - `totalInterestChargedAmount: number`
  - `totalPenaltiesChargedAmount: number`

**Audit**
- `createdAt: timestamp`
- `createdByUserId: string`
- `updatedAt: timestamp`
- `version: number` (optimistic concurrency, optional)

**Subcollections**
```
/loans/{loanId}/payments/{paymentId}
/loans/{loanId}/ledger/{entryId}
/loans/{loanId}/documents/{docId}          (optional)
/loans/{loanId}/adjustments/{adjId}        (optional; can be ledger-only)
```

---

## 4) Payments (Manual allocation)

### `/loans/{loanId}/payments/{paymentId}`
A payment is the “receipt record.” Allocation is explicit because you apply manually.

**Fields**
- `status: string` (`posted|reversed|pending`)
- `amountAmount: number`
- `currency: string`
- `paidAt: timestamp`     (when borrower paid/deposited)
- `encodedAt: timestamp`  (when staff encoded)
- `encodedByUserId: string`
- `method: string` (`officeCash|bankDeposit|atmCard|transfer|other`)
- `referenceNo: string?` (deposit slip/txn id)
- `notes: string?`

**Manual allocation breakdown**
- `allocation: map`
  - `principalAmount: number`
  - `interestAmount: number`
  - `feesAmount: number`
  - `penaltiesAmount: number`

**Optional payment-location**
- `geo: geopoint?`
- `geohash: string?`

**Validation rule (app/server)**
`allocation.principal + allocation.interest + allocation.fees + allocation.penalties == amountAmount`

---

## 5) Ledger (Accounting-grade audit trail)

### `/loans/{loanId}/ledger/{entryId}`
Immutable accounting story. Corrections happen via new entries (reversal/adjustment).

**Fields**
- `status: string` (`posted|reversed`)
- `type: string`
  - Examples: `principalDisbursed|feeCharged|interestAccrued|penaltyCharged|paymentApplied|adjustment|reversal`
- `bucket: string` (`principal|interest|fees|penalties`)
- `amountAmount: number` (positive or negative; choose one convention and stick to it)
- `currency: string`
- `effectiveDate: timestamp` (the date it “counts for”)
- `createdAt: timestamp`
- `createdByUserId: string`
- `reference: map?`
  - `paymentId: string?`
  - `adjustmentId: string?`
  - `externalRef: string?`
- `memo: string?`

**Posting a payment → ledger writes**
For each payment, write up to 4 `paymentApplied` entries using the manual allocation:
- principal (allocation.principalAmount)
- interest
- fees
- penalties

**Reversal pattern**
- Mark payment `status = reversed`
- Add new ledger entries that negate the original entries
- Keep originals untouched

---

## 6) Branches

### `/branches/{branchId}`
**Fields**
- `name: string`
- `address: string?`
- `geo: geopoint?`
- `createdAt: timestamp`
- `status: string` (`active|inactive`)
- `branchId: string`

---

## 7) Loan Products & Pricing Policies

### `/loanProducts/{productId}`
**Fields**
- `name: string`
- `description: string?`
- `status: string` (`active|inactive`)
- `defaultPolicyId: string?`

### `/pricingPolicies/{policyId}/versions/{versionId}`
Versioned rules so older loans keep their original terms.

**Fields**
- `version: string` (e.g., `"v3"`)
- `effectiveFrom: timestamp`
- `rules: map` (structure defined by you; examples)
  - `processingFeeAmount: number?`
  - `monthlyServiceFeeAmount: number?`
  - `monthlyCollectionFeeAmount: number?`
  - `interestRateMonthlyBps: number?` (bps = basis points)
  - `penaltyRule: map?`
- `createdAt: timestamp`
- `createdByUserId: string`

> Even if fees are “manual” today, keeping policy versions helps you later standardize and report.

---

## 8) Users (Staff) — optional

### `/users/{userId}`
**Fields**
- `displayName: string`
- `role: string` (`admin|team|manager|auditor`)
- `branchId: string?`
- `status: string` (`active|inactive`)
- `createdAt: timestamp`

---

## 9) Payment Instruments — optional (ATM card given to you)

### `/paymentInstruments/{instrumentId}`
Only store minimal, non-sensitive metadata. Avoid storing full card details.

**Fields**
- `borrowerId: string`
- `type: string` (`atmCard|bankAccount|other`)
- `label: string?` (e.g., `"BPI ATM - borrower provided"`)
- `last4: string?`
- `status: string` (`active|inactive`)
- `createdAt: timestamp`

---

## 10) Audit Logs — optional but helpful

### `/auditLogs/{logId}`
Global log of important actions (payment posted, reversal, loan created).

**Fields**
- `actorUserId: string`
- `action: string` (`PAYMENT_POSTED|PAYMENT_REVERSED|LOAN_CREATED|...`)
- `entityType: string` (`borrower|loan|payment|ledger`)
- `entityId: string`
- `createdAt: timestamp`
- `details: map?` (small)

---

## Required Composite Indexes (Recommended)

Firestore automatically indexes single fields. Create composite indexes for common queries:

### Loans dashboard queries
1. **Due today / next due list (per branch)**
- Collection: `/loans`
- Filters: `branchId ==`, `status in [active, delinquent]`
- Order: `nextDueDate asc`
- Index: `(branchId, status, nextDueDate)`

2. **Delinquency list**
- Filters: `branchId ==`, `status == delinquent`
- Order: `daysPastDue desc`
- Index: `(branchId, status, daysPastDue)`

3. **Borrower loans**
- Filters: `borrowerId ==`
- Order: `startDate desc`
- Index: `(borrowerId, startDate)`

### Payments listing (within a loan)
- Subcollection: `/loans/{loanId}/payments`
- Order: `paidAt desc`
- Usually no composite needed unless filtering by status + date.

---

## Transaction Boundaries (Strongly Recommended)

### Create borrower (unique identity)
Use a Firestore **transaction**:
- Create `/borrowerKeys/phone:+63...`
- Create `/borrowers/{borrowerId}`

---

## 2.1) Borrower Accounts (Auth Mapping) - optional

Use only if borrower Auth UID is not the same as `borrowerId`. This maps a Firebase Auth user to a borrower record.

### `/borrowerAccounts/{userId}`
**Fields**
- `borrowerId: string`
- `createdAt: timestamp`
- `createdByUserId: string?`

### Post payment (atomic accounting)
Use a **transaction** or **Cloud Function** with idempotency:
- Create `/payments/{paymentId}`
- Create 1–4 `/ledger/{entryId}` entries
- Update `/loans/{loanId}` summary balances + `lastPaymentAt`

### Reverse payment
- Update payment `status = reversed`
- Create reversal ledger entries
- Update loan summary balances

---

## Security / Privacy Notes (Schema-level)
- Keep KYC in `/borrowers/{borrowerId}/kyc` to apply stricter rules.
- Consider separating highly sensitive identifiers (gov ID numbers) into dedicated docs if needed later.
- Location raw events should have retention + limited access.

---

## Minimal “MVP Query Set” this schema supports well
- Find borrower by phone (via `/borrowerKeys/phone:+63...`)
- List borrower loans (`/loans where borrowerId == ...`)
- Branch due list (`/loans where branchId == ... order by nextDueDate`)
- Post payment with manual allocation + audit-ready ledger
- Explain balances using ledger history

---
End of schema.
