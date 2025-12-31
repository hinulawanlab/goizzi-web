import { NextResponse, type NextRequest } from "next/server";

import { hasAdminCredentials } from "@/shared/singletons/firebaseAdmin";
import { updateLoanNoteFlags } from "@/shared/services/loanNoteService";
import { resolveStaffSessionFromRequest } from "@/shared/services/sessionService";

interface NoteUpdatePayload {
  isActive?: boolean;
  callActive?: boolean;
  messageActive?: boolean;
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ loanId: string; noteId: string }> }
) {
  const session = await resolveStaffSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!hasAdminCredentials()) {
    return NextResponse.json({ error: "Firebase Admin credentials are not configured." }, { status: 500 });
  }

  const { loanId, noteId } = await context.params;
  if (!loanId || !noteId) {
    return NextResponse.json({ error: "Missing loan or note id." }, { status: 400 });
  }

  let payload: NoteUpdatePayload = {};
  try {
    payload = (await request.json()) as NoteUpdatePayload;
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const hasValidUpdate =
    typeof payload.isActive === "boolean" ||
    typeof payload.callActive === "boolean" ||
    typeof payload.messageActive === "boolean";
  if (!hasValidUpdate) {
    return NextResponse.json({ error: "Missing update fields." }, { status: 400 });
  }

  try {
    const note = await updateLoanNoteFlags(loanId, noteId, payload);
    return NextResponse.json({ note });
  } catch (error) {
    console.warn("Unable to update loan note flags:", error);
    return NextResponse.json({ error: "Failed to update loan note." }, { status: 500 });
  }
}
