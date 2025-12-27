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
  isApproved?: boolean;
  isWaived?: boolean;
  createdAt?: string;
}
