rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    /* =========================
       Shared helper
       ========================= */
    function isAuthenticated() {
      return request.auth != null;
    }

    /* =========================
       Borrowers
       ========================= */
    match /borrowers/{borrowerId} {
      allow read, write: if isAuthenticated();

      match /kyc/{docId} {
        allow read, write: if isAuthenticated();
      }

      match /locationObservations/{obsId} {
        allow read, write: if isAuthenticated();
      }
      
      match /kyc/{kycId} {
        allow read, write: if isAuthenticated();
      }

      match /notes/{noteId} {
        allow read, write: if isAuthenticated();
      }
      
      match /application/{obsId} {
        allow read, write: if isAuthenticated();
      }
      
      match /references/{referenceId} {
        allow read, write: if isAuthenticated();
      }
    }

    /* =========================
       Borrower Keys
       ========================= */
    match /borrowerKeys/{keyId} {
      allow read, write: if isAuthenticated();
    }

    /* =========================
       Loans
       ========================= */
    match /loans/{loanId} {
      allow read, write: if isAuthenticated();

      match /payments/{paymentId} {
        allow read, write: if isAuthenticated();
      }

      match /ledger/{entryId} {
        allow read, write: if isAuthenticated();
      }

      match /documents/{docId} {
        allow read, write: if isAuthenticated();
      }

      match /adjustments/{adjId} {
        allow read, write: if isAuthenticated();
      }
    }

    /* =========================
       Branches
       ========================= */
    match /branches/{branchId} {
      allow read, write: if isAuthenticated();
    }

    /* =========================
       Loan Products
       ========================= */
    match /loanProducts/{productId} {
      allow read, write: if isAuthenticated();
    }

    /* =========================
       Pricing Policies
       ========================= */
    match /pricingPolicies/{policyId} {
      allow read, write: if isAuthenticated();

      match /versions/{versionId} {
        allow read, write: if isAuthenticated();
      }
    }

    /* =========================
       Users
       ========================= */
    match /users/{userId} {
      allow read, write: if isAuthenticated();
    }

    /* =========================
       Payment Instruments
       ========================= */
    match /paymentInstruments/{instrumentId} {
      allow read, write: if isAuthenticated();
    }

    /* =========================
       Audit Logs
       ========================= */
    match /auditLogs/{logId} {
      allow read, write: if isAuthenticated();
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
lastUpdate: 12/27/2025-3:27PM