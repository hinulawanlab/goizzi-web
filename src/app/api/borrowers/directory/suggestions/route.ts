import { NextResponse, type NextRequest } from "next/server";

import { getBorrowerSearchSuggestions } from "@/shared/services/borrowerService";
import { resolveStaffSessionFromRequest } from "@/shared/services/sessionService";

export const dynamic = "force-dynamic";

function parsePositiveInt(value: string | null, fallback: number): number {
  if (!value) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

export async function GET(request: NextRequest) {
  const session = await resolveStaffSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const search = (request.nextUrl.searchParams.get("q") ?? "").trim();
    const limit = parsePositiveInt(request.nextUrl.searchParams.get("limit"), 8);

    const suggestions = await getBorrowerSearchSuggestions(search, limit);
    return NextResponse.json({ suggestions }, { status: 200 });
  } catch (error) {
    console.error("Borrower search suggestions API failed:", error);
    return NextResponse.json({ error: "Unable to fetch borrower search suggestions." }, { status: 500 });
  }
}

