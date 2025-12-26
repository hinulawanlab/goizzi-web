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
