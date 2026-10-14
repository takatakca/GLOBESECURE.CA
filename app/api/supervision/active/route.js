import { NextResponse } from "next/server";
import { getSession } from "../../../../lib/auth";
import { database } from "../../../../lib/db";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  const session = await getSession();
  if (!session || !session.roles.includes("globesecure_supervisor")) return NextResponse.json({ error: "Accès supervision refusé." }, { status: 403 });
  const pool = database();
  if (!pool) return NextResponse.json({ error: "Base de données non configurée." }, { status: 503 });
  try {
    const shifts = await pool.query(
      "SELECT s.id,s.agent_sub,s.started_at,p.latitude,p.longitude,p.accuracy_m,p.recorded_at FROM gs_shifts s LEFT JOIN LATERAL (SELECT latitude,longitude,accuracy_m,recorded_at FROM gs_positions WHERE shift_id=s.id AND tenant_id=s.tenant_id ORDER BY recorded_at DESC LIMIT 1) p ON true WHERE s.tenant_id=$1 AND s.stopped_at IS NULL ORDER BY s.started_at DESC LIMIT 200",
      [session.tenant]);
    const incidents = await pool.query(
      "SELECT id,agent_sub,category,summary,created_at FROM gs_incidents WHERE tenant_id=$1 ORDER BY created_at DESC LIMIT 30",
      [session.tenant]);
    return NextResponse.json({ shifts: shifts.rows, incidents: incidents.rows, checkedAt: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Données temporairement indisponibles." }, { status: 503 });
  }
}
