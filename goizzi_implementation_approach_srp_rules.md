# Goizzi Implementation Approach (SRP + Programming Rules)

This document turns the Firestore schema into an implementation plan that is:
- **SRP-aligned** (clear responsibilities)
- **Audit-safe** for money
- **Test-driven** for risky logic
- **Tool-enforced** so quality is automatic, not “by discipline”

---

## 1) Design from invariants (non-negotiables)

These are rules that must always be true, regardless of UI or workflow.

### Financial invariants
- **Payments are immutable**: do not edit posted payments; corrections happen via **reversals/adjustments**.
- **Allocation must sum to payment**:
  - `principal + interest + fees + penalties == paymentTotal`
- **Loan balances are derived** from ledger + stored summaries:
  - Summaries exist for performance, but must always be reconcilable from ledger.
- **Money writes are atomic**:
  - Posting a payment updates: `payment doc + ledger entries + loan summary` together.
- **Borrower uniqueness** is enforced transactionally:
  - `/borrowerKeys/*` mapping prevents duplicates across branches.

### Data invariants
- No unbounded arrays in a single document (use subcollections).
- All money amounts are stored in **minor units** (e.g., centavos) as integers.
- Every record that matters has:
  - `createdAt`, `createdBy`, and a stable identifier.

---

## 2) Architectural layers (strict boundaries)

Use a layered structure so domain logic stays clean and testable.

### A) Domain Layer (pure logic; no Firebase)
**What lives here**
- Entities / value objects:
  - `Money`, `BorrowerId`, `LoanId`, `PaymentId`
  - `Allocation` (principal/interest/fees/penalties)
- Rules and validations:
  - allocation sum check, negative checks, currency checks
- Domain errors:
  - `AllocationMismatch`, `NegativeAmount`, `InvalidStatusTransition`, etc.

**SRP rule**
- Domain code must not import Firestore/HTTP/UI code.
- Domain functions are deterministic and easy to unit test.

---

### B) Application Layer (use-cases / orchestrators)
Each use-case is one business action:
- `CreateBorrowerUseCase`
- `CreateLoanUseCase`
- `PostPaymentUseCase`
- `ReversePaymentUseCase`
- `ApplyFeeAssessmentUseCase` (optional, if you standardize fees later)
- `RecomputeLoanSummaryUseCase` (repair/reconciliation utility)

**What it does**
- Orchestrates repositories
- Enforces transaction boundaries
- Converts domain errors into application results

**SRP rule**
- One use-case = one workflow.
- Use-cases do not contain Firestore-specific mapping.

---

### C) Data Layer (Firebase/Firestore implementation)
**What lives here**
- Repository implementations:
  - `BorrowerRepositoryFirestore`
  - `LoanRepositoryFirestore`
  - `PaymentRepositoryFirestore`
  - `LedgerRepositoryFirestore`
- DTOs + mappers (Firestore <-> domain)
- Transaction runner and idempotency helpers

**SRP rule**
- Data layer does persistence and queries; it does not decide business rules.

---

### D) Presentation Layer (UI)
- Android: MVVM (ViewModel + UI state)
- Web: controller/store pattern
- UI never posts directly to Firestore; it calls **use-cases**.

---

## 3) Where money writes happen (client vs server)

### Recommended long-term
**Centralize money commands server-side** (Cloud Functions / backend API):
- Stronger security
- Consistent audit trails
- Easier to enforce invariants

### If starting client-side
- Still structure code as if there is a “command service”.
- Later you can swap implementation (client -> server) without rewriting domain.

**Guiding rule**
- Money-affecting operations must pass through *one* command boundary:
  - `postPayment()`, `reversePayment()`, `createLoan()`

---

## 4) First vertical slice: “Post Payment”

This flow forces you to implement:
- Validation
- Transactional writes
- Ledger generation
- Loan summary update
- Audit logging
- Tests

### PostPaymentUseCase: steps
1. Load loan (ensure exists, status allows posting).
2. Validate `Allocation` (sum == total; non-negative).
3. Create payment record (immutable).
4. Generate ledger entries from allocation.
5. Write in a transaction:
   - `payments/{paymentId}`
   - `ledger/{entryId}*`
   - Update `loans/{loanId}.balances/totals/lastPaymentAt`
6. Write optional audit log entry.

---

## 5) Error model (no generic exceptions)

Define a stable error taxonomy.

### Domain errors (pure)
- `AllocationMismatchError`
- `NegativeMoneyError`
- `CurrencyMismatchError`
- `InvalidLoanStatusError`

### Application errors (workflow / environment)
- `NotFoundError`
- `ConflictError` (duplicate borrower key)
- `PermissionError`
- `TransientNetworkError`
- `UnknownError`

### Result type recommendation
Return `Result<Success, Failure>` or sealed outcomes.
Do not throw exceptions for expected validation problems.

---

## 6) Programming rules (enforced by tooling)

### Code rules
- No `!!` / unsafe calls (use guards and null-safe flows).
- Functions ≤ **4 parameters**:
  - Use parameter objects: `PostPaymentCommand`.
- Naming:
  - intention-revealing names
  - class/interface names 3–40 chars
- Avoid duplication (DRY), prefer small reusable pure functions.

### Defensive programming
- Use guards early:
  - `require(amount > 0)`
  - `require(allocationSum == total)`
- Structured logging (e.g., Timber for Android) with correlation IDs.

### Tooling
- Kotlin: `ktlint` + `detekt`
- JS/TS: `eslint` + `prettier`
- CI:
  - tsx + tsc + lint + tests required

---

## 7) Testing strategy (TDD aligned to risk)

### Unit tests (Domain)
- Allocation sum check
- Ledger entry generation from payment allocation
- Reversal logic (negating entries)
- Money arithmetic (minor units, overflow checks)

### Use-case tests (Application)
- Posting payment calls repositories correctly
- Reversal produces correct write set
- Duplicate borrower key -> conflict error

### Integration tests (Firestore Emulator)
- Transaction atomicity:
  - payment + ledger + loan summary commit together
- Idempotency:
  - repeated post command does not double-apply

### Reconciliation tests
- Recompute balances from ledger matches stored summaries.

---

## 8) Suggested module / folder layout

Example (Kotlin/Android, adaptable to web):
- `domain/`
  - `model/` (Money, Ids, Allocation)
  - `rules/` (validators, ledger builders)
  - `error/`
- `application/`
  - `usecase/`
  - `dto/` (commands like PostPaymentCommand)
- `data/`
  - `firestore/` (collections, queries, dto)
  - `repo/` (interfaces + implementations)
  - `tx/` (transaction runner, idempotency)
- `presentation/`
  - `viewmodel/`
  - `ui/`

---

## 9) Idempotency + audit (required for finance)

### Idempotency
- Every money command includes an idempotency key:
  - `commandId` or `paymentId` pre-generated
- Transaction checks for existing paymentId before writing.

### Audit trail
- Store `createdByUserId`, `createdAt`, `source`
- Optional global `/auditLogs` entry for each money action:
  - `PAYMENT_POSTED`, `PAYMENT_REVERSED`, `LOAN_CREATED`

---

## 10) Next step if we continue
Pick one workflow to spec precisely (recommended: **Post Payment**):
- Define domain types and validators
- Define repository interfaces
- Define transaction write set
- Write unit tests first
- Implement data layer + emulator tests

## 11) Tests
- Write and run tests, covering happy paths, edge cases, and failure modes.
- Ensure lint cleanliness and maintain at least 95% production-level confidence.
- run the following npx tsc, npm test, npm run lint and make sure it passed