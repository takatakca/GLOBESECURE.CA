import { NextResponse } from "next/server";
import { readJsonBody, bodyFailure } from "../../../../lib/read-json.mjs";
import { agentContext, validOrigin, apiError } from "../../../../lib/agent-access";
import { startInput, stopInput, positionInput, CONSENT_VERSION } from "../../../../lib/shifts.mjs";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  const ctx = await agentContext();
  if (ctx.error) return ctx.error;
  try {
    const result = await ctx.pool.query("SELECT id, started_at, (tracking_revoked_at IS NULL) AS consent_active FROM gs_shifts WHERE tenant_id = $1 AND agent_sub = $2 AND stopped_at IS NULL LIMIT 1", [ctx.session.tenant, ctx.session.sub]);
    return NextResponse.json({ active: result.rows[0] || null, consentVersion: CONSENT_VERSION }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) { return apiError(e); }
}
export async function POST(request) {
  const ctx = await agentContext();
  if (ctx.error) return ctx.error;
  if (!validOrigin(request)) return NextResponse.json({ error: "Origine invalide." }, { status: 403 });
  let body;
  try { body = await readJsonBody(request); } catch (error) { const failure = bodyFailure(error); return NextResponse.json({ error: failure.message }, { status: failure.status }); }
  if (!startInput(body) && !stopInput(body)) return NextResponse.json({ error: "Action ou consentement invalide." }, { status: 400 });
  const client = await ctx.pool.connect().catch(() => null);
  if (!client) return NextResponse.json({ error: "Base inaccessible." }, { status: 503 });
  try {
    await client.query("BEGIN");
    let shift;
    if (body.action === "start") {
      const inserted = await client.query(
        "INSERT INTO gs_shifts (tenant_id, agent_sub, consent_version, consented_at) VALUES ($1,$2,$3,now()) RETURNING id, started_at",
        [ctx.session.tenant, ctx.session.sub, CONSENT_VERSION]);
      shift = inserted.rows[0];
      const pos = positionInput(body.position);
      await client.query(
        "INSERT INTO gs_positions (shift_id, tenant_id, latitude, longitude, accuracy_m, event_type) VALUES ($1,$2,$3,$4,$5,'start')",
        [shift.id, ctx.session.tenant, pos.latitude, pos.longitude, pos.accuracy]);
    } else {
      const stopped = await client.query(
        "UPDATE gs_shifts SET stopped_at = now() WHERE tenant_id = $1 AND agent_sub = $2 AND stopped_at IS NULL RETURNING id, started_at, stopped_at",
        [ctx.session.tenant, ctx.session.sub]);
      if (stopped.rowCount !== 1) {
        await client.query("ROLLBACK");
        return NextResponse.json({ error: "Aucun quart actif." }, { status: 409 });
      }
      shift = stopped.rows[0];
      const pos = positionInput(body.position);
      if (pos) await client.query(
        "INSERT INTO gs_positions (shift_id, tenant_id, latitude, longitude, accuracy_m, event_type) VALUES ($1,$2,$3,$4,$5,'stop')",
        [shift.id, ctx.session.tenant, pos.latitude, pos.longitude, pos.accuracy]);
    }
    await client.query("INSERT INTO gs_audit (shift_id, tenant_id, actor_sub, action) VALUES ($1,$2,$3,$4)", [shift.id, ctx.session.tenant, ctx.session.sub, body.action === "start" ? "shift.start" : "shift.stop"]);
    await client.query("COMMIT");
    return NextResponse.json({ ok: true, shift }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    try { await client.query("ROLLBACK"); } catch {}
    return apiError(e);
  } finally { client.release(); }
}
