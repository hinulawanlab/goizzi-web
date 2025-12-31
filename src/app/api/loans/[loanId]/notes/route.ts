import { NextResponse, type NextRequest } from "next/server";

import { hasAdminCredentials } from "@/shared/singletons/firebaseAdmin";
import { addLoanNote } from "@/shared/services/loanNoteService";
import { resolveStaffSessionFromRequest } from "@/shared/services/sessionService";

interface NotePayload {
  borrowerId?: string;
  applicationId?: string;
  type?: string;
  note?: string;
  createdByName?: string;
  createdByUserId?: string;
}

export async function POST(request: NextRequest, context: { params: Promise<{ loanId: string }> }) {
  const session = await resolveStaffSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!hasAdminCredentials()) {
    return NextResponse.json({ error: "Firebase Admin credentials are not configured." }, { status: 500 });
  }

  const { loanId } = await context.params;
  if (!loanId) {
    return NextResponse.json({ error: "Missing loan id." }, { status: 400 });
  }

  let payload: NotePayload = {};
  try {
    payload = (await request.json()) as NotePayload;
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  if (!payload.note || !payload.note.trim()) {
    return NextResponse.json({ error: "Note cannot be empty." }, { status: 400 });
  }

  try {
    const note = await addLoanNote({
      loanId,
      borrowerId: payload.borrowerId,
      applicationId: payload.applicationId,
      type: payload.type,
      note: payload.note,
      createdByName: payload.createdByName,
      createdByUserId: payload.createdByUserId
    });
    return NextResponse.json({ note });
  } catch (error) {
    console.warn("Unable to add loan note:", error);
    return NextResponse.json({ error: "Failed to add note." }, { status: 500 });
  }
}
