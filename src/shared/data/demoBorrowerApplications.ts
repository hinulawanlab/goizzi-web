import type { LoanApplication } from "@/shared/types/loanApplication";

export const demoBorrowerApplications: Record<string, LoanApplication[]> = {
  "B-1001": [
    {
      applicationId: "APP-1001",
      status: "submitted",
      createdAt: "2025-12-26",
      submittedAt: "2025-12-26",
      updatedAt: "2025-12-26",
      borrower: {
        fullName: "Ana de la Cruz",
        mobileNumber: "+63 912 345 6789",
        email: "ana@example.com",
        dateOfBirth: "1985-05-03",
        civilStatus: "Married",
        currentAddress: "Makati City",
        provincialAddress: "Cebu City",
        provincialSameAsCurrent: false,
        homeOwnership: "Owned",
        yearsAtAddress: "10",
        educationAttainment: "College"
      },
      borrowerAssets: {
        details: "Property, vehicle",
        estimatedValue: "500000",
        selections: [
          "Property",
          "Vehicle"
        ]
      },
      borrowerIncome: {
        employerName: "Goizzi Corp",
        occupation: "Accounting",
        netIncome: "20000",
        yearsInRole: "4 years",
        employerAddress: "Makati City",
        employerContact: "0917"
      },
      coMaker: {
        fullName: "Markcus Go",
        relationshipToBorrower: "Coworker",
        mobileNumber: "09172",
        currentAddress: "Toledo"
      },
      coMakerIncome: {
        employerName: "Thi Inc",
        netIncome: "235000",
        occupation: "Operations",
        yearsInRole: "5 years"
      },
      spouse: {
        fullName: "Govann Hill",
        occupation: "Business",
        netIncome: "10000",
        contactNumber: "09172",
        address: "Toledo"
      },
      loanDetails: {
        amountApplied: "2000",
        productId: "regular",
        productName: "Personal Loan",
        purpose: "Additional Capital",
        term: "3"
      },
      marketing: {
        source: "Facebook"
      }
    },
    {
      applicationId: "APP-1000",
      status: "draft",
      createdAt: "2025-11-02",
      updatedAt: "2025-11-05",
      borrower: {
        fullName: "Ana de la Cruz",
        mobileNumber: "+63 912 345 6789",
        email: "ana@example.com",
        civilStatus: "Single",
        currentAddress: "Makati City",
        provincialSameAsCurrent: true
      },
      loanDetails: {
        amountApplied: "15000",
        productId: "regular",
        productName: "Personal Loan",
        purpose: "Home improvement",
        term: "6"
      }
    }
  ]
};
