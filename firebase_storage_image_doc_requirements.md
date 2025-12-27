# Firebase Image & Document Management Requirements

Purpose: keep borrower KYC images and documents secure, consistent, and auditable across web (staff) and mobile (borrower) apps.

---

## 1) Access Model (Current Decision)

### Staff (Web CMS)
- Staff can view all KYC images.
- Staff must access images via **signed URLs** (server-generated, short-lived).
- Direct Firebase Storage reads from the web app are **not allowed**.

### Borrowers (Mobile App)
- Borrowers can **upload** KYC images to their own borrower folder.
- Borrowers can **read only their own selfie**.
- Borrowers cannot read other KYC documents.

### Admin Whitelist
- Only the following admin UIDs can create/update `/users`:
  - `vr9fD7BrLbRyxDiOlTBkTyxxvgG3`
  - `jx87T1OeBgNcquUU8uMXIT7KIp43`

---

## 2) Storage Path Convention

KYC files must live under:

```
/borrowers/{borrowerId}/kyc/{kycId}/{fileName}
```

File name patterns are enforced by Storage rules (e.g. `governmentIdFront.jpg`, `selfie_*.jpg`, `proofOfBilling_page_1.jpg`).

---

## 3) Authentication & Authorization

### Staff
- Staff identity is defined by `/users/{uid}`.
- Required fields:
  - `status: "active"`
  - `role: "admin" | "manager" | "team" | "auditor"`

### Borrowers
One of these must be true:
- Borrower Auth UID **equals** `borrowerId`, or
- `/borrowerAccounts/{uid}` exists with `{ borrowerId }` mapping.

---

## 4) Required Rule Behavior

### Firestore
- `/users` writes only by admin UIDs.
- All CMS data (borrowers, loans, payments, notes, KYC) is **staff-only**.
- Borrowers may create/update their own KYC docs.
- Borrowers may read their **selfie KYC doc only**.

### Storage
- Borrowers can **write** KYC files under their own borrowerId.
- Borrowers can **read only selfie files** under their own borrowerId.
- Staff direct reads are **blocked** (must use signed URLs).

---

## 5) Signed URL Flow (Staff Read)

1. Web app obtains Firebase ID token.
2. Web app calls `/api/borrowers/{borrowerId}/kyc/{kycId}/images` with `Authorization: Bearer {token}`.
3. API verifies token and confirms staff eligibility.
4. API returns signed URLs (15-minute expiry).
5. Web app displays images using these URLs.

---

## 6) Implementation Checklist (Use Every Time)

### When changing image/doc features
- Confirm storage paths follow the KYC convention.
- Ensure filenames match allowed patterns.
- Verify staff reads use signed URLs only.
- Verify borrower reads are selfie-only.
- Verify borrower uploads are borrowerId scoped.
- Update and redeploy `firebase_storage_rules.md` and `firebase_database_rules.md`.
- Update `lastUpdate` timestamps at the bottom of those rule files.
- Add or update mapping in `/borrowerAccounts` when borrowerId != auth.uid.
- Run checks: `npx tsc`, `npm test`, `npm run lint`.

---

## 7) Risk Notes

- Do not allow direct Storage reads for staff; it bypasses auditability.
- Avoid exposing raw storage paths to unauthenticated clients.
- Keep signed URL expiration short (15 minutes).

---

## 8) Owner & Review

- Owner: Engineering
- Review: Admin whitelist holder(s)

