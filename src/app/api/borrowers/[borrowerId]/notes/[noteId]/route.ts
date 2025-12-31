import { NextResponse, type NextRequest } from "next/server";

import { hasAdminCredentials } from "@/shared/singletons/firebaseAdmin";
import { updateBorrowerNoteFlags } from "@/shared/services/borrowerNoteService";

interface NoteUpdatePayload {
  isActive?: boolean;
  callActive?: boolean;
  messageActive?: boolean;
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ borrowerId: string; noteId: string }> }
) {
  if (!hasAdminCredentials()) {
    return NextResponse.json({ error: "Firebase Admin credentials are not configured." }, { status: 500 });
  }

  const { borrowerId, noteId } = await context.params;
  if (!borrowerId || !noteId) {
    return NextResponse.json({ error: "Missing borrower or note id." }, { status: 400 });
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
    const note = await updateBorrowerNoteFlags(borrowerId, noteId, payload);
    return NextResponse.json({ note });
  } catch (error) {
    console.warn("Unable to update borrower note flags:", error);
    return NextResponse.json({ error: "Failed to update borrower note." }, { status: 500 });
  }
}
