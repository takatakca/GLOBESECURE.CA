import { NextResponse } from "next/server";
import { agentContext, validOrigin, apiError } from "../../../../lib/agent-access";
import { validIncident } from "../../../../lib/incidents.mjs";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  const ctx = await agentContext();
  if (ctx.error) return ctx.error;
  try {
    const records = await ctx.pool.query("SELECT id,category,summary,created_at FROM gs_incidents WHERE tenant_id=$1 AND agent_sub=$2 ORDER BY created_at DESC LIMIT 20", [ctx.session.tenant, ctx.session.sub]);
    return NextResponse.json({ incidents: records.rows }, { headers: { "Cache-Control": "no-store" } });
  } catch(e) { return apiError(e); }
}
export async function POST(request) {
  const ctx = await agentContext();
  if (ctx.error) return ctx.error;
  if (!validOrigin(request)) return NextResponse.json({ error: "Origine invalide." }, { status: 403 });
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Format invalide." }, { status: 400 }); }
  const incident = validIncident(body);
  if (!incident) return NextResponse.json({ error: "Catégorie ou description invalide (20 à 4000 caractères)." }, { status: 400 });
  const client = await ctx.pool.connect().catch(() => null);
  if (!client) return NextResponse.json({ error: "Base inaccessible." }, { status: 503 });
  try {
    await client.query("BEGIN");
    const active = await client.query("SELECT id FROM gs_shifts WHERE tenant_id=$1 AND agent_sub=$2 AND stopped_at IS NULL FOR UPDATE", [ctx.session.tenant, ctx.session.sub]);
    if (!active.rowCount) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Un quart actif est requis pour créer un rapport." }, { status: 409 });
    }
    const result = await client.query("INSERT INTO gs_incidents (shift_id, tenant_id, agent_sub, category, summary) VALUES ($1,$2,$3,$4,$5) RETURNING id,created_at", [active.rows[0].id, ctx.session.tenant, ctx.session.sub, incident.category, incident.summary]);
    await client.query("INSERT INTO gs_audit (shift_id, tenant_id, actor_sub, action) VALUES ($1,$2,$3,'incident.create')", [active.rows[0].id, ctx.session.tenant, ctx.session.sub]);
    await client.query("COMMIT");
    return NextResponse.json({ ok: true, incident: result.rows[0] }, { status: 201 });
  } catch(e) {
    try { await client.query("ROLLBACK"); } catch {}
    return apiError(e);
  } finally { client.release(); }
}
