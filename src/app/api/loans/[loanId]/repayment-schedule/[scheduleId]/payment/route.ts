import { NextResponse, type NextRequest } from "next/server";

import { db } from "@/shared/singletons/firebaseAdmin";
import { resolveStaffSessionFromRequest } from "@/shared/services/sessionService";

interface PaymentPayload {
  action?: "apply" | "edit";
  dueDate?: string;
  amountPaidAmount?: number;
  breakdown?: {
    principalAmount?: number;
    interestAmount?: number;
    financeChargeAmount?: number;
    lateChargeAmount?: number;
    otherAmount?: number;
  };
  remarks?: string;
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  return null;
}

function resolveDueDate(value: unknown, fallback: unknown): string {
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) {
      return new Date(parsed).toISOString().split("T")[0];
    }
  }
  if (typeof fallback === "string") {
    return fallback;
  }
  return new Date().toISOString().split("T")[0];
}

function formatTimestamp(value: unknown): string {
  if (!value) {
    return "N/A";
  }

  if (typeof value === "string") {
    return value.split("T")[0];
  }

  if (value instanceof Date) {
    return value.toISOString().split("T")[0];
  }

  if (typeof (value as { toDate?: () => Date }).toDate === "function") {
    return ((value as { toDate?: () => Date }).toDate as () => Date)().toISOString().split("T")[0];
  }

  const toMillisFn = (value as { toMillis?: () => number }).toMillis;
  if (typeof toMillisFn === "function") {
    return new Date(toMillisFn()).toISOString().split("T")[0];
  }

  const seconds = (value as { _seconds?: number })._seconds;
  if (typeof seconds === "number") {
    return new Date(seconds * 1000).toISOString().split("T")[0];
  }

  return "N/A";
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ loanId: string; scheduleId: string }> }
) {
  const session = await resolveStaffSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { loanId, scheduleId } = await context.params;
  if (!loanId || !scheduleId) {
    return NextResponse.json({ error: "Missing loan or schedule id." }, { status: 400 });
  }
  if (!db) {
    return NextResponse.json({ error: "Firestore Admin client is not initialized." }, { status: 500 });
  }

  let payload: PaymentPayload;
  try {
    payload = (await request.json()) as PaymentPayload;
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const action = payload.action ?? "apply";
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

  const loanRef = db.collection("loans").doc(loanId);
  const scheduleRef = loanRef.collection("repaymentSchedule").doc(scheduleId);
  const scheduleDoc = await scheduleRef.get();
  if (!scheduleDoc.exists) {
    return NextResponse.json({ error: "Schedule not found." }, { status: 404 });
  }

  const scheduleData = scheduleDoc.data() || {};
  const existingPaymentId = typeof scheduleData.paymentId === "string" ? scheduleData.paymentId : null;

  if (action === "apply" && existingPaymentId) {
    return NextResponse.json({ error: "Payment already applied. Edit instead." }, { status: 400 });
  }
  if (action === "edit" && !existingPaymentId) {
    return NextResponse.json({ error: "No existing payment to edit." }, { status: 400 });
  }

  const updatedAt = new Date().toISOString();
  const dueDate = resolveDueDate(payload.dueDate, scheduleData.dueDate);
  const historyRef = scheduleRef.collection("paymentHistory");
  const batch = db.batch();

  if (action === "edit" && existingPaymentId) {
    const reversalRef = historyRef.doc();
    batch.set(reversalRef, {
      status: "reversed",
      amountPaidAmount: scheduleData.amountPaidAmount ?? 0,
      breakdown: scheduleData.breakdown ?? {},
      remarks: scheduleData.remarks ?? "",
      createdAt: updatedAt,
      reversalOfPaymentId: existingPaymentId
    });
  }

  const paymentRef = historyRef.doc();
  batch.set(paymentRef, {
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
      dueDate,
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
      paymentId: paymentRef.id,
      paidAt: updatedAt,
      updatedAt
    },
    { merge: true }
  );

  await batch.commit();

  return NextResponse.json({
    entry: {
      scheduleId,
      dueDate,
      installmentNumber: scheduleData.installmentNumber,
      scheduleType: scheduleData.scheduleType,
      expectedPaymentAmount: scheduleData.expectedPaymentAmount,
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
      paidAt: updatedAt,
      updatedAt
    }
  });
}
