import { NextResponse } from "next/server";

import { auth, db, hasAdminCredentials } from "@/shared/singletons/firebaseAdmin";
import { cancelLoanAndApplication, closeLoanEarly, updateLoanDetails } from "@/shared/services/loanUpdateService";

interface LoanUpdatePayload {
  action?: "update" | "proceed" | "cancel" | "close";
  borrowerId?: string;
  applicationId?: string;
  principalAmount?: number;
  termMonths?: number;
  interestRate?: number;
  paymentFrequency?: number;
  startDate?: string;
  reason?: string;
}

function getAuthToken(request: Request): string | null {
  const header = request.headers.get("Authorization");
  if (!header) {
    return null;
  }
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return null;
  }
  return token;
}

async function resolveActorUid(request: Request): Promise<string | null> {
  if (!auth) {
    return null;
  }
  const token = getAuthToken(request);
  if (!token) {
    return null;
  }
  const decoded = await auth.verifyIdToken(token);
  return decoded.uid ?? null;
}

async function isAdminRole(uid: string): Promise<boolean> {
  if (!db) {
    return false;
  }
  const doc = await db.collection("users").doc(uid).get();
  if (!doc.exists) {
    return false;
  }
  const data = doc.data() as { status?: string; role?: string } | undefined;
  return data?.status === "active" && data?.role === "admin";
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ loanId: string }> }
) {
  if (!hasAdminCredentials()) {
    return NextResponse.json({ error: "Firebase Admin credentials are not configured." }, { status: 500 });
  }

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
  const reason = payload.reason?.trim();

  try {
    if (action === "close") {
      if (!reason) {
        return NextResponse.json({ error: "Reason is required." }, { status: 400 });
      }
      const actorUserId = await resolveActorUid(request);
      if (!actorUserId) {
        return NextResponse.json({ error: "Missing authorization token." }, { status: 401 });
      }
      const isAdmin = await isAdminRole(actorUserId);
      if (!isAdmin) {
        return NextResponse.json({ error: "Only admins can close loans early." }, { status: 403 });
      }
      const result = await closeLoanEarly({
        loanId,
        reason,
        actorUserId,
        borrowerId: payload.borrowerId,
        applicationId: payload.applicationId
      });
      return NextResponse.json({ status: "closed", updatedAt: result.updatedAt });
    }

    if (action === "cancel") {
      if (!reason) {
        return NextResponse.json({ error: "Reason is required." }, { status: 400 });
      }
      const actorUserId = (await resolveActorUid(request)) ?? undefined;
      const result = await cancelLoanAndApplication({
        loanId,
        borrowerId: payload.borrowerId,
        applicationId: payload.applicationId,
        reason,
        actorUserId
      });
      return NextResponse.json({ status: "cancelled", updatedAt: result.updatedAt });
    }

    const updateResult = await updateLoanDetails({
      loanId,
      principalAmount: payload.principalAmount,
      termMonths: payload.termMonths,
      interestRate: payload.interestRate,
      paymentFrequency: payload.paymentFrequency,
      startDate: payload.startDate,
      status: action === "proceed" ? "active" : undefined,
      action
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
