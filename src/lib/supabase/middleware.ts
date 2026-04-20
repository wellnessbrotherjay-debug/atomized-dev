import { NextResponse, type NextRequest } from "next/server";
import { mockSupabaseClient } from "./mock-client";

export async function updateSession(request: NextRequest) {
  // Auth bypass — all routes accessible without login
  return NextResponse.next({ request });
}
