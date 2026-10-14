import { NextResponse } from "next/server";
import { getSession } from "../../../../lib/auth";
import { database } from "../../../../lib/db";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  const session = await getSession();
  if (!session?.roles?.includes("globesecure_client")) return NextResponse.json({ error: "Accès client refusé." }, { status: 403 });
  const pool = database();
  if (!pool) return NextResponse.json({ error: "Service de rapports non configuré." }, { status: 503 });
  try {
    const data = await pool.query("SELECT id,title,body,published_at FROM gs_client_reports WHERE tenant_id=$1 ORDER BY published_at DESC LIMIT 100", [session.tenant]);
    return NextResponse.json({ reports: data.rows }, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "Rapports temporairement indisponibles." }, { status: 503 }); }
}
