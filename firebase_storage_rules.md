rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    match /borrowers/{borrowerId}/kyc/{kycId}/{fileName} {
      allow read: if isBorrowerSelfieRead(borrowerId, fileName)
                  && isUnder2MbForRead();
      allow write: if isBorrowerAuthFor(borrowerId)
                   && isAllowedKycFile(fileName)
                   && isUnder2MbForWrite();
    }

    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}

function borrowerAccountDoc() {
  return firestore.get(/databases/(default)/documents/borrowerAccounts/$(request.auth.uid));
}

function isBorrowerAuthFor(borrowerId) {
  return request.auth != null
    && (request.auth.uid == borrowerId
      || (firestore.exists(/databases/(default)/documents/borrowerAccounts/$(request.auth.uid))
        && borrowerAccountDoc().data.borrowerId == borrowerId));
}

function isBorrowerSelfieRead(borrowerId, fileName) {
  return isBorrowerAuthFor(borrowerId)
    && isSelfieFile(fileName);
}

function isAllowedKycFile(fileName) {
  return isGovernmentIdFile(fileName)
      || isSelfieFile(fileName)
      || isBillingProofFile(fileName)
      || isBankStatementFile(fileName)
      || isPayslipFile(fileName);
}

function isBankStatementFile(fileName) {
  return fileName.matches('bankStatement_page_\\d+\\.jpg');
}

function isPayslipFile(fileName) {
  return fileName.matches('payslip_page_\\d+\\.jpg');
}

function isBillingProofFile(fileName) {
  return fileName.matches('proofOfBilling_page_\\d+\\.jpg');
}

function isGovernmentIdFile(fileName) {
  return fileName == "governmentIdFront.jpg" || fileName == "governmentIdBack.jpg";
}

function isSelfieFile(fileName) {
  return fileName.matches('selfie_.*\\.jpg');
}

function isUnder2MbForRead() {
  return resource.size < 2 * 1024 * 1024;
}

function isUnder2MbForWrite() {
  return request.resource.size < 2 * 1024 * 1024;
}



<!-- firebase_storage_rules.md -->
<!-- Versioning -->
version: v1
lastUpdate: 12/28/2025-05:22PM
