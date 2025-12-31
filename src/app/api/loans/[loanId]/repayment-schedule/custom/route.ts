import { NextResponse, type NextRequest } from "next/server";

import { db } from "@/shared/singletons/firebaseAdmin";
import { resolveStaffSessionFromRequest } from "@/shared/services/sessionService";

interface CustomPaymentPayload {
  amountPaidAmount?: number;
  breakdown?: {
    principalAmount?: number;
    interestAmount?: number;
    financeChargeAmount?: number;
    lateChargeAmount?: number;
    otherAmount?: number;
  };
  remarks?: string;
  paidAt?: string;
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  return null;
}

function resolvePaidAt(value: unknown) {
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) {
      return new Date(parsed).toISOString().split("T")[0];
    }
  }
  return new Date().toISOString().split("T")[0];
}

export async function POST(request: NextRequest, context: { params: Promise<{ loanId: string }> }) {
  const session = await resolveStaffSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { loanId } = await context.params;
  if (!loanId) {
    return NextResponse.json({ error: "Missing loan id." }, { status: 400 });
  }
  if (!db) {
    return NextResponse.json({ error: "Firestore Admin client is not initialized." }, { status: 500 });
  }

  let payload: CustomPaymentPayload;
  try {
    payload = (await request.json()) as CustomPaymentPayload;
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const amountPaidAmount = toNumber(payload.amountPaidAmount);
  const breakdown = payload.breakdown ?? {};
  const principalAmount = toNumber(breakdown.principalAmount) ?? 0;
  const interestAmount = toNumber(breakdown.interestAmount) ?? 0;
  const financeChargeAmount = toNumber(breakdown.financeChargeAmount) ?? 0;
  const lateChargeAmount = toNumber(breakdown.lateChargeAmount) ?? 0;
  const otherAmount = toNumber(breakdown.otherAmount) ?? 0;

  if (amountPaidAmount === null) {
    return NextResponse.json({ error: "Amount paid is required." }, { status: 400 });
  }

  const breakdownSum = principalAmount + interestAmount + financeChargeAmount + lateChargeAmount + otherAmount;
  if (breakdownSum !== amountPaidAmount) {
    return NextResponse.json({ error: "Breakdown must equal amount paid." }, { status: 400 });
  }

  const paidAt = resolvePaidAt(payload.paidAt);
  const scheduleId = `custom-${Date.now()}`;
  const scheduleRef = db.collection("loans").doc(loanId).collection("repaymentSchedule").doc(scheduleId);
  const historyRef = scheduleRef.collection("paymentHistory").doc();
  const updatedAt = new Date().toISOString();

  const batch = db.batch();
  batch.set(historyRef, {
    status: "posted",
    amountPaidAmount,
    breakdown: {
      principalAmount,
      interestAmount,
      financeChargeAmount,
      lateChargeAmount,
      otherAmount
    },
    remarks: payload.remarks ?? "",
    createdAt: updatedAt
  });

  batch.set(
    scheduleRef,
    {
      scheduleType: "custom",
      dueDate: paidAt,
      amountPaidAmount,
      breakdown: {
        principalAmount,
        interestAmount,
        financeChargeAmount,
        lateChargeAmount,
        otherAmount
      },
      remarks: payload.remarks ?? "",
      paymentStatus: "paid",
      paymentId: historyRef.id,
      paidAt,
      updatedAt
    },
    { merge: true }
  );

  await batch.commit();

  return NextResponse.json({
    entry: {
      scheduleId,
      dueDate: paidAt,
      scheduleType: "custom",
      amountPaidAmount,
      breakdown: {
        principalAmount,
        interestAmount,
        financeChargeAmount,
        lateChargeAmount,
        otherAmount
      },
      remarks: payload.remarks ?? "",
      paymentStatus: "paid",
      paidAt,
      updatedAt
    }
  });
}
