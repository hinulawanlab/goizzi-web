import { NextResponse, type NextRequest } from "next/server";

import { hasAdminCredentials } from "@/shared/singletons/firebaseAdmin";
import { clearBorrowerFollowUp } from "@/shared/services/borrowerFollowUpService";
import { resolveStaffSessionFromRequest } from "@/shared/services/sessionService";

export async function POST(request: NextRequest, context: { params: Promise<{ borrowerId: string }> }) {
  const session = await resolveStaffSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!hasAdminCredentials()) {
    return NextResponse.json({ error: "Firebase Admin credentials are not configured." }, { status: 500 });
  }

  const { borrowerId } = await context.params;
  if (!borrowerId) {
    return NextResponse.json({ error: "Missing borrower id." }, { status: 400 });
  }

  try {
    await clearBorrowerFollowUp(borrowerId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.warn("Unable to clear borrower follow-up:", error);
    return NextResponse.json({ error: "Failed to clear borrower follow-up." }, { status: 500 });
  }
}
