import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  // Auth bypass — all routes accessible without login
  return NextResponse.next({ request });
}
