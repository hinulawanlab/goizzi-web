export type ReferenceContactStatus = "pending" | "agreed" | "declined" | "no_response";

export interface BorrowerReference {
  referenceId: string;
  name: string;
  mobileNumber: string;
  address: string;
  createdAt: string;
  contactStatus: ReferenceContactStatus;
}
