export interface PaymentBreakdown {
  principalAmount?: number;
  interestAmount?: number;
  financeChargeAmount?: number;
  lateChargeAmount?: number;
  otherAmount?: number;
}

export interface RepaymentScheduleEntry {
  scheduleId: string;
  dueDate: string;
  installmentNumber?: number;
  scheduleType?: "regular" | "custom";
  expectedPaymentAmount?: number;
  amountPaidAmount?: number;
  breakdown?: PaymentBreakdown;
  remarks?: string;
  paymentStatus?: "unpaid" | "paid";
  paidAt?: string;
  updatedAt?: string;
}
