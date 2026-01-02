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
