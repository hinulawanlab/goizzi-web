rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    match /borrowers/{borrowerId}/kyc/{kycId}/{fileName} {
      allow read: if (isBorrowerOwner(borrowerId) || isUser(request.auth.uid))
                  && isAllowedKycFile(fileName)
                  && isUnder2MbForRead();
      allow write: if (isBorrowerOwner(borrowerId) || isUser(request.auth.uid))
                   && isAllowedKycFile(fileName)
                   && isUnder2MbForWrite();
    }

    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}

function isBorrowerOwner(borrowerId) {
  return request.auth != null;
}

function isUser(userId) {
  return request.auth != null
    && exists(/databases/(default)/documents/users/$(userId));
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
lastUpdate: 12/27/2025-3:27PM