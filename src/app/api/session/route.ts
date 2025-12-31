import { NextResponse, type NextRequest } from "next/server";

import { createStaffSessionCookie, getSessionCookieName, getSessionMaxAgeMs } from "@/shared/services/sessionService";

interface SessionPayload {
  idToken?: string;
}

export async function POST(request: NextRequest) {
  let payload: SessionPayload = {};
  try {
    payload = (await request.json()) as SessionPayload;
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const idToken = typeof payload.idToken === "string" ? payload.idToken.trim() : "";
  if (!idToken) {
    return NextResponse.json({ error: "Missing id token." }, { status: 400 });
  }

  try {
    const sessionCookie = await createStaffSessionCookie(idToken);
    const response = NextResponse.json({ status: "ok" });
    response.cookies.set(getSessionCookieName(), sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: Math.floor(getSessionMaxAgeMs() / 1000)
    });
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create session.";
    const status = message.toLowerCase().includes("not found") ? 403 : 500;
    console.warn("Session creation failed:", error);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ status: "ok" });
  response.cookies.set(getSessionCookieName(), "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });
  return response;
}
