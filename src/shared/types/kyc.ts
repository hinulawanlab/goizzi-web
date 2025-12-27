export interface BorrowerGovernmentIdKyc {
  borrowerId: string;
  kycId: string;
  idType?: string;
  idNumber?: string;
  frontStorageRef?: string;
  backStorageRef?: string;
  storageRefs?: string[];
  isApproved?: boolean;
  createdAt?: string;
}

export interface BorrowerProofOfBillingKyc {
  borrowerId: string;
  kycId: string;
  documentType?: string;
  storageRefs: string[];
  imageUrls?: string[];
  isApproved?: boolean;
  isWaived?: boolean;
  createdAt?: string;
}

export interface BorrowerBankStatementKyc {
  borrowerId: string;
  kycId: string;
  documentType?: string;
  accountName?: string;
  accountNumber?: string;
  bankName?: string;
  storageRefs: string[];
  imageUrls?: string[];
  isApproved?: boolean;
  isWaived?: boolean;
  createdAt?: string;
}

export interface BorrowerPayslipKyc {
  borrowerId: string;
  kycId: string;
  documentType?: string;
  employer?: string;
  storageRefs: string[];
  imageUrls?: string[];
  isApproved?: boolean;
  isWaived?: boolean;
  createdAt?: string;
}

export interface BorrowerPropertyTitleKyc {
  borrowerId: string;
  kycId: string;
  documentType?: string;
  storageRefs: string[];
  imageUrls?: string[];
  isApproved?: boolean;
  isWaived?: boolean;
  createdAt?: string;
}

export interface BorrowerOtherKyc {
  borrowerId: string;
  kycId: string;
  documentType?: string;
  documentDescription?: string;
  storageRefs: string[];
  imageUrls?: string[];
  isApproved?: boolean;
  isWaived?: boolean;
  createdAt?: string;
}
