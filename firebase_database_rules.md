rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    /* =========================
       Shared helper
       ========================= */
    function isAuthenticated() {
      return request.auth != null;
    }

    function isAdminUid() {
      return request.auth != null
        && request.auth.uid in [
          "vr9fD7BrLbRyxDiOlTBkTyxxvgG3",
          "jx87T1OeBgNcquUU8uMXIT7KIp43"
        ];
    }

    function userDoc() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid));
    }

    function isStaff() {
      return isAdminUid()
        || (request.auth != null
          && exists(/databases/$(database)/documents/users/$(request.auth.uid))
          && userDoc().data.status == "active"
          && userDoc().data.role in ["admin", "manager", "team", "auditor"]);
    }

    function borrowerAccountDoc() {
      return get(/databases/$(database)/documents/borrowerAccounts/$(request.auth.uid));
    }

    function isBorrowerAuthFor(borrowerId) {
      return request.auth != null
        && (request.auth.uid == borrowerId
          || (exists(/databases/$(database)/documents/borrowerAccounts/$(request.auth.uid))
            && borrowerAccountDoc().data.borrowerId == borrowerId));
    }

    function isBorrowerSelfieRead(borrowerId) {
      return isBorrowerAuthFor(borrowerId)
        && resource.data.type == "selfie";
    }

    /* =========================
       Borrowers
       ========================= */
    match /borrowers/{borrowerId} {
      allow read, write: if isStaff();
      allow create: if isAuthenticated()
        && borrowerId == request.auth.uid
        && request.resource.data.borrowerId == request.auth.uid
        && request.resource.data.authUid == request.auth.uid;
      allow read, update: if isAuthenticated()
        && borrowerId == request.auth.uid;

      match /kyc/{docId} {
        allow read: if isStaff() || isBorrowerSelfieRead(borrowerId);
        allow create, update: if isStaff() || isBorrowerAuthFor(borrowerId);
        allow delete: if isStaff();
      }

      match /notes/{noteId} {
        allow read, write: if isStaff();
      }

      match /locationObservations/{obsId} {
        allow read, write: if isStaff();
      }
      
      match /application/{obsId} {
        allow read, write: if isStaff();
      }
      
      match /references/{referenceId} {
        allow read, write: if isStaff();
      }
    }

    /* =========================
       Borrower Keys
       ========================= */
    match /borrowerKeys/{keyId} {
      allow read, write: if isStaff();
    }

    /* =========================
       Loans
       ========================= */
    match /loans/{loanId} {
      allow read, write: if isStaff();

      match /payments/{paymentId} {
        allow read, write: if isStaff();
      }

      match /ledger/{entryId} {
        allow read, write: if isStaff();
      }

      match /documents/{docId} {
        allow read, write: if isStaff();
      }

      match /adjustments/{adjId} {
        allow read, write: if isStaff();
      }
    }

    /* =========================
       Branches
       ========================= */
    match /branches/{branchId} {
      allow read, write: if isStaff();
    }

    /* =========================
       Loan Products
       ========================= */
    match /loanProducts/{productId} {
      allow read, write: if isStaff();
    }

    /* =========================
       Pricing Policies
       ========================= */
    match /pricingPolicies/{policyId} {
      allow read, write: if isStaff();

      match /versions/{versionId} {
        allow read, write: if isStaff();
      }
    }

    /* =========================
       Users
       ========================= */
    match /users/{userId} {
      allow read: if isStaff();
      allow create, update, delete: if isAdminUid();
    }

    /* =========================
       Payment Instruments
       ========================= */
    match /paymentInstruments/{instrumentId} {
      allow read, write: if isStaff();
    }

    /* =========================
       Audit Logs
       ========================= */
    match /auditLogs/{logId} {
      allow read, write: if isStaff();
    }

    /* =========================
       Borrower Accounts (Auth Mapping)
       ========================= */
    match /borrowerAccounts/{userId} {
      allow read, write: if isAdminUid();
    }
    
    /* =========================
       Support (Read-only)
       ========================= */
    match /support/{docId} {
      allow read: if true;
      allow write: if false;
    }
    
    /* =========================
       Support (Read-only)
       ========================= */
    match /products/{docId} {
      allow read: if true;
      allow write: if false;
    }
  }
}


<!-- firebase_database_rules.md -->
<!-- Versioning -->
version: v1
lastUpdate: 12/28/2025-10:56AM
