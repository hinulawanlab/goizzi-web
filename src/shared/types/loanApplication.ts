export interface ApplicationBorrower {
  age?: string;
  birthplace?: string;
  citizenship?: string;
  civilStatus?: string;
  course?: string;
  currentAddress?: string;
  dateOfBirth?: string;
  dependents?: string;
  educationAttainment?: string;
  email?: string;
  facebookAccount?: string;
  facebookAccountName?: string;
  fatherName?: string;
  fullName?: string;
  gender?: string;
  homeOwnership?: string;
  mobileNumber?: string;
  motherMaidenName?: string;
  nickname?: string;
  provincialAddress?: string;
  provincialSameAsCurrent?: boolean;
  yearsAtAddress?: string;
}

export interface BorrowerAssets {
  details?: string;
  estimatedValue?: string;
  selections?: string[];
}

export interface BorrowerIncome {
  employerAddress?: string;
  employerContact?: string;
  employerName?: string;
  netIncome?: string;
  occupation?: string;
  yearsInRole?: string;
}

export interface CoMaker {
  age?: string;
  citizenship?: string;
  civilStatus?: string;
  currentAddress?: string;
  dependents?: string;
  email?: string;
  facebookAccount?: string;
  facebookAccountName?: string;
  fullName?: string;
  homeOwnership?: string;
  mobileNumber?: string;
  nickname?: string;
  provincialAddress?: string;
  relationshipToBorrower?: string;
  yearsAtAddress?: string;
}

export interface CoMakerIncome {
  employerAddress?: string;
  employerContact?: string;
  employerName?: string;
  netIncome?: string;
  occupation?: string;
  yearsInRole?: string;
}

export interface SpouseInfo {
  address?: string;
  contactNumber?: string;
  employerContact?: string;
  employerName?: string;
  fullName?: string;
  netIncome?: string;
  nickname?: string;
  occupation?: string;
  yearsInRole?: string;
}

export interface LoanDetails {
  amountApplied?: string;
  productId?: string;
  productName?: string;
  purpose?: string;
  term?: string;
}

export interface MarketingInfo {
  source?: string;
}

export interface LoanApplication {
  applicationId: string;
  status: string;
  createdAt?: string;
  submittedAt?: string;
  updatedAt?: string;
  statusUpdatedByName?: string;
  statusUpdatedByUserId?: string;
  manualVerified?: string[];
  manuallyVerifiedBy?: string;
  borrower: ApplicationBorrower;
  borrowerAssets?: BorrowerAssets;
  borrowerIncome?: BorrowerIncome;
  coMaker?: CoMaker;
  coMakerIncome?: CoMakerIncome;
  spouse?: SpouseInfo;
  loanDetails?: LoanDetails;
  marketing?: MarketingInfo;
}
