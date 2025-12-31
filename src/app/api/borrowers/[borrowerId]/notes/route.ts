import { NextResponse, type NextRequest } from "next/server";

import { hasAdminCredentials } from "@/shared/singletons/firebaseAdmin";
import { addBorrowerApplicationNote } from "@/shared/services/applicationAuditService";

interface NotePayload {
  applicationId?: string;
  type?: string;
  note?: string;
  createdByName?: string;
  createdByUserId?: string;
  borrowerId?: string;
  callActive?: boolean;
  isActive?: boolean;
  messageActive?: boolean;
}

export async function POST(request: NextRequest, context: { params: Promise<{ borrowerId: string }> }) {
  if (!hasAdminCredentials()) {
    return NextResponse.json({ error: "Firebase Admin credentials are not configured." }, { status: 500 });
  }

  const { borrowerId } = await context.params;
  if (!borrowerId) {
    return NextResponse.json({ error: "Missing borrower id." }, { status: 400 });
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
    const note = await addBorrowerApplicationNote({
      borrowerId,
      applicationId: payload.applicationId,
      type: payload.type,
      note: payload.note,
      createdByName: payload.createdByName,
      createdByUserId: payload.createdByUserId,
      callActive: payload.callActive,
      isActive: payload.isActive,
      messageActive: payload.messageActive
    });
    return NextResponse.json({ note });
  } catch (error) {
    console.warn("Unable to add borrower note:", error);
    return NextResponse.json({ error: "Failed to add note." }, { status: 500 });
  }
}
