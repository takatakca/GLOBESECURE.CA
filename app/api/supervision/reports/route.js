import { NextResponse } from "next/server";
import { getSession } from "../../../../lib/auth";
import { database } from "../../../../lib/db";
import { requestIsSameSite } from "../../../../lib/origin.mjs";
import { validPublication } from "../../../../lib/reports.mjs";
export const runtime = "nodejs";
export async function POST(request) {
  const session = await getSession();
  if (!session?.roles?.includes("globesecure_supervisor")) return NextResponse.json({ error: "Accès supervision refusé." }, { status: 403 });
  if (!requestIsSameSite(request)) return NextResponse.json({ error: "Origine invalide." }, { status: 403 });
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Format invalide." }, { status: 400 }); }
  const report = validPublication(body);
  if (!report) return NextResponse.json({ error: "Contenu ou validation de publication invalide." }, { status: 400 });
  const pool = database();
  if (!pool) return NextResponse.json({ error: "Base non configurée." }, { status: 503 });
  const client = await pool.connect().catch(() => null);
  if (!client) return NextResponse.json({ error: "Base inaccessible." }, { status: 503 });
  try {
    await client.query("BEGIN");
    const incident = await client.query("SELECT id,shift_id FROM gs_incidents WHERE id=$1 AND tenant_id=$2", [report.incidentId,session.tenant]);
    if (!incident.rowCount) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Incident non trouvé pour cette organisation." }, { status: 404 });
    }
    const published = await client.query("INSERT INTO gs_client_reports (tenant_id,incident_id,title,body,reviewer_sub) VALUES ($1,$2,$3,$4,$5) RETURNING id,published_at", [session.tenant,report.incidentId,report.title,report.body,session.sub]);
    await client.query("INSERT INTO gs_audit (shift_id,tenant_id,actor_sub,action) VALUES ($1,$2,$3,'report.publish')", [incident.rows[0].shift_id,session.tenant,session.sub]);
    await client.query("COMMIT");
    return NextResponse.json({ ok: true, report: published.rows[0] }, { status: 201 });
  } catch(error) {
    try { await client.query("ROLLBACK"); } catch {}
    return NextResponse.json({ error: error?.code === "23505" ? "Un rapport est déjà publié pour cet incident." : "Publication momentanément indisponible." }, { status: error?.code === "23505" ? 409 : 503 });
  } finally { client.release(); }
}
