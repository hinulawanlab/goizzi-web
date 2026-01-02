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
