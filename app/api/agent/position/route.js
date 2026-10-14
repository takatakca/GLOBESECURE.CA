import { NextResponse } from "next/server";
import { agentContext, validOrigin, apiError } from "../../../../lib/agent-access";
import { positionInput } from "../../../../lib/shifts.mjs";
export const runtime = "nodejs";
export async function POST(request) {
  const ctx = await agentContext();
  if (ctx.error) return ctx.error;
  if (!validOrigin(request)) return NextResponse.json({ error: "Origine invalide." }, { status: 403 });
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Données invalides." }, { status: 400 }); }
  const pos = positionInput(body?.position);
  if (!pos) return NextResponse.json({ error: "Position invalide." }, { status: 400 });
  const client = await ctx.pool.connect().catch(() => null);
  if (!client) return NextResponse.json({ error: "Base inaccessible." }, { status: 503 });
  try {
    await client.query("BEGIN");
    const active = await client.query(
      "SELECT id FROM gs_shifts WHERE tenant_id = $1 AND agent_sub = $2 AND stopped_at IS NULL AND consented_at IS NOT NULL AND tracking_revoked_at IS NULL FOR UPDATE",
      [ctx.session.tenant, ctx.session.sub]);
    if (!active.rows.length) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Suivi interdit hors d'un quart actif et consenti." }, { status: 409 });
    }
    const shiftId = active.rows[0].id;
    const recent = await client.query(
      "SELECT 1 FROM gs_positions WHERE shift_id = $1 AND event_type = 'heartbeat' AND recorded_at > now() - interval '45 seconds' LIMIT 1",
      [shiftId]);
    if (recent.rows.length) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Mise à jour trop fréquente." }, { status: 429 });
    }
    await client.query(
      "INSERT INTO gs_positions (shift_id, tenant_id, latitude, longitude, accuracy_m, event_type) VALUES ($1,$2,$3,$4,$5,'heartbeat')",
      [shiftId, ctx.session.tenant, pos.latitude, pos.longitude, pos.accuracy]);
    await client.query("COMMIT");
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch(e) {
    try { await client.query("ROLLBACK"); } catch {}
    return apiError(e);
  } finally { client.release(); }
}
