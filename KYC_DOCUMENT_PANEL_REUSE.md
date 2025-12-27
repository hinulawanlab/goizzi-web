# Reusable KYC Document Panel (Reference)

Purpose: document the reusable KYC document panel, image viewer, and data flow for document tabs (Bank Statements, Payslips, Property Titles, Others, Proof of Billing).

## 1) What it does
- Renders KYC entries per `type` as rows (one row per `kycId`).
- Shows up to 5 rows, sorted by `createdAt` (newest first).
- Loads signed image URLs per `kycId` and displays image thumbnails.
- Clicking an image opens a reusable viewer modal.
- Provides shared decision actions: approve / reject / waive / unwaive.
- Writes decision notes using the provided `documentType` (fallback to tab label).

## 2) Core components
- `src/components/borrowers/BorrowerKycDocumentPanel.tsx`
  - Generic panel used by all KYC document tabs.
- `src/components/borrowers/BorrowerKycImageViewer.tsx`
  - Simple modal viewer (open on image click).
- `src/components/borrowers/BorrowerKycDecisionSection.tsx`
  - Shared decision buttons + action states UI.
- `src/components/borrowers/useKycImageLoader.ts`
  - Shared signed URL loader with retry and timeout.

## 3) Row behavior and limits
- Each row maps to a distinct `kycId`.
- Rows are sorted by `createdAt` descending.
- Only the first 5 rows render (no "view more").

## 4) Image loading
- Signed URLs are requested per `kycId` via `/api/borrowers/{borrowerId}/kyc/{kycId}/images`.
- The loader handles:
  - empty refs
  - timeouts
  - retry on timeout
  - error and empty states
- If URLs are empty, show an inline empty image state.

## 5) Decision flow
- Decisions use `/api/borrowers/{borrowerId}/kyc/{kycId}/decision`.
- Payload includes `documentType` so notes read as:
  - "Bank statements approved."
  - "Payslips rejected."
- Same actions for all KYC types: approve, reject, waive, unwaive.

## 6) Per-tab wiring
The generic panel is wrapped by type-specific components that pass metadata fields:

- Bank Statements
  - `type: "bankStatement"`
  - Fields: `bankName`, `accountName`, `accountNumber`
  - Component: `src/components/borrowers/BorrowerBankStatementPanel.tsx`

- Payslips
  - `type: "paySlip"`
  - Fields: `employer`
  - Component: `src/components/borrowers/BorrowerPayslipPanel.tsx`

- Property Titles
  - `type: "propertyTitle"`
  - Fields: none (for now)
  - Component: `src/components/borrowers/BorrowerPropertyTitlePanel.tsx`

- Proof of Billing
  - `type: "proofOfBilling"`
  - Fields: none (for now)
  - Component: `src/components/borrowers/BorrowerProofOfBillingPanel.tsx`

- Others
  - `type: "others"`
  - Fields: `documentDescription`
  - Component: `src/components/borrowers/BorrowerOtherDocumentPanel.tsx`

## 7) Service integration
KYC queries live in:
- `src/shared/services/kycService.ts`

Each tab passes its result list into `BorrowerApplicationTabSection`.

## 8) Adding a new document tab
1) Add a KYC type + interface in `src/shared/types/kyc.ts`.
2) Add service fetcher in `src/shared/services/kycService.ts` (query by `type`, order by `createdAt`).
3) Create a small wrapper component for the tab that calls `BorrowerKycDocumentPanel`.
4) Wire the list into `src/app/borrowers/[borrowerId]/application/[applicationId]/page.tsx`.
5) Add tab label in `src/components/borrowers/borrowerApplicationTypes.ts`.

## 9) Viewer behavior
- Clicking an image opens `BorrowerKycImageViewer`.
- Viewer currently supports open/close only.
- Future viewer actions will be added later.

