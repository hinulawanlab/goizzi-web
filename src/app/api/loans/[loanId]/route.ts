import { NextResponse } from "next/server";

import { cancelLoanAndApplication, updateLoanDetails } from "@/shared/services/loanUpdateService";

interface LoanUpdatePayload {
  action?: "update" | "proceed" | "cancel";
  borrowerId?: string;
  applicationId?: string;
  principalAmount?: number;
  termMonths?: number;
  paymentFrequency?: number;
  startDate?: string;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ loanId: string }> }
) {
  const { loanId } = await context.params;
  if (!loanId) {
    return NextResponse.json({ error: "Missing loan id." }, { status: 400 });
  }

  let payload: LoanUpdatePayload;
  try {
    payload = (await request.json()) as LoanUpdatePayload;
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const action = payload.action ?? "update";

  try {
    if (action === "cancel") {
      const result = await cancelLoanAndApplication({
        loanId,
        borrowerId: payload.borrowerId,
        applicationId: payload.applicationId
      });
      return NextResponse.json({ status: "cancelled", updatedAt: result.updatedAt });
    }

    const updateResult = await updateLoanDetails({
      loanId,
      principalAmount: payload.principalAmount,
      termMonths: payload.termMonths,
      paymentFrequency: payload.paymentFrequency,
      startDate: payload.startDate,
      status: action === "proceed" ? "active" : undefined
    });

    return NextResponse.json({
      status: action === "proceed" ? "active" : "updated",
      updatedAt: updateResult.updatedAt
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update loan.";
    console.warn("Unable to update loan:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
