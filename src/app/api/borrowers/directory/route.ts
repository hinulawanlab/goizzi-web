import { NextResponse, type NextRequest } from "next/server";

import { getBorrowerDirectoryPage, searchBorrowerDirectory } from "@/shared/services/borrowerService";
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
    const page = parsePositiveInt(request.nextUrl.searchParams.get("page"), 1);
    const pageSize = parsePositiveInt(request.nextUrl.searchParams.get("pageSize"), 100);
    const search = (request.nextUrl.searchParams.get("search") ?? "").trim();

    const result = search
      ? await searchBorrowerDirectory(search, page, pageSize)
      : await getBorrowerDirectoryPage(page, pageSize);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Borrower directory API failed:", error);
    return NextResponse.json({ error: "Unable to fetch borrower directory." }, { status: 500 });
  }
}

