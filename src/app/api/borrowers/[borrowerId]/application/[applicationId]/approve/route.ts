import { NextResponse, type NextRequest } from "next/server";

import { hasAdminCredentials } from "@/shared/singletons/firebaseAdmin";
import { approveBorrowerApplicationToLoan } from "@/shared/services/loanApprovalService";

interface ApprovalPayload {
  loanAmount?: number;
  loanInterest?: number;
  termMonths?: number;
  approvedAt?: string;
  actorName?: string;
  actorUserId?: string;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ borrowerId: string; applicationId: string }> }
) {
  if (!hasAdminCredentials()) {
    return NextResponse.json({ error: "Firebase Admin credentials are not configured." }, { status: 500 });
  }

  const { borrowerId, applicationId } = await context.params;
  if (!borrowerId || !applicationId) {
    return NextResponse.json({ error: "Missing borrower or application id." }, { status: 400 });
  }

  let payload: ApprovalPayload = {};
  try {
    payload = (await request.json()) as ApprovalPayload;
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  if (
    typeof payload.loanAmount !== "number" ||
    typeof payload.loanInterest !== "number" ||
    typeof payload.termMonths !== "number" ||
    typeof payload.approvedAt !== "string"
  ) {
    return NextResponse.json({ error: "Missing required approval fields." }, { status: 400 });
  }

  try {
    const result = await approveBorrowerApplicationToLoan({
      borrowerId,
      applicationId,
      loanAmount: payload.loanAmount,
      loanInterest: payload.loanInterest,
      termMonths: payload.termMonths,
      approvedAt: payload.approvedAt,
      actorName: payload.actorName,
      actorUserId: payload.actorUserId
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to approve loan.";
    const status = message.toLowerCase().includes("already exists") ? 409 : 500;
    console.warn("Unable to approve loan:", error);
    return NextResponse.json({ error: message }, { status });
  }
}
