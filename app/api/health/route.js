import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export function GET() {
  return NextResponse.json({ ok: true, service: "globesecure-web", release: process.env.NEXT_PUBLIC_BUILD_SHA || "unknown", timestamp: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } });
}
