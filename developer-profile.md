## UI preferences
- Icon-only action buttons should include a tooltip (title) and an aria-label for clarity and accessibility.
- Add cursor-pointer for clickables everytime

## Date and time format
- use firebase timestamp across the platform

## Retrospective
- 2025-12-31: prefer server-verified session cookies for staff-only access, and gate admin APIs with role checks.
- 2026-01-01: source location confidence thresholds from appConfig constants with fallback defaults; show no-data in confidence UI when summary is missing.
- 2026-01-01: keep borrower location observation UI focused on essentials; remove accuracy column when not reliable.
- 2026-01-01: recompute branch stats only when the branches route is navigated; avoid background fetching.
- 2026-01-02: default list-style payment edits to inline rows with a visible custom-payment row and retain toggle control for clarity.
- 2026-01-02: prefer plain row styling with standard inputs/buttons for dense payment entry screens.
- 2026-01-02: constrain payments list to a scrollable panel within the notes/actions height.
- 2026-01-02: avoid body-level scrolling on the loan payments view; keep scroll inside the payments table.
- 2026-03-05: for borrower directory, keep the page-size selector visible in the top header area (not beside bottom pagination), with default page size set to 100.
- 2026-03-05: borrower search must support deep matching of `fullName` across borrower subcollections, with partial token matches (e.g., `Doe` finds `John Doe`).
- 2026-03-05: in Borrower Map & Location, each observation row should support a staff-editable `Home`/`Work` type via inline dropdown and persist it to Firestore.
- 2026-03-05: borrower KYC image previews should support zoom-in/zoom-out/reset (including mouse-wheel zoom) for clearer staff verification.
- 2026-03-05: Maker tab should include a print action that opens browser print preview and uses compact print styles tuned for single-page output.
- 2026-03-05: Maker print output should include the latest borrower selfie at the upper-right, with fallback text when no selfie image is available.
- 2026-03-05: approved-loan `Print Loan Form` should open in preview-first mode (no auto-print), include maker+co-maker consent, display maker selfie at top-right, and target two pages.
- 2026-03-05: in approved application image tabs, enable per-image tick selection and print only selected items from the current tab with a tab-specific heading in Folio print layout.
- 2026-03-05: when application status is approved, KYC decision controls (approve/reject/waive) should stay visible but disabled/grey to prevent further status actions.
