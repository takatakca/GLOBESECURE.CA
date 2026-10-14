import { NextResponse } from "next/server";
import { readJsonBody, bodyFailure } from "../../../../lib/read-json.mjs";
import { agentContext, validOrigin, apiError } from "../../../../lib/agent-access";
import { CONSENT_VERSION } from "../../../../lib/shifts.mjs";
export const runtime = "nodejs";
export async function POST(request) {
  const ctx = await agentContext();
  if (ctx.error) return ctx.error;
  if (!validOrigin(request)) return NextResponse.json({ error: "Origine invalide." }, { status: 403 });
  let body;
  try { body = await readJsonBody(request); } catch (error) { const failure = bodyFailure(error); return NextResponse.json({ error: failure.message }, { status: failure.status }); }
  if (body?.action !== "revoke" && !(body?.action === "grant" && body?.consent === true && body?.consentVersion === CONSENT_VERSION)) return NextResponse.json({ error: "Consentement invalide." }, { status: 400 });
  const client = await ctx.pool.connect().catch(() => null);
  if (!client) return NextResponse.json({ error: "Base inaccessible." }, { status: 503 });
  try {
    await client.query("BEGIN");
    const updated = body.action === "revoke" ?
      await client.query("UPDATE gs_shifts SET tracking_revoked_at=now() WHERE tenant_id=$1 AND agent_sub=$2 AND stopped_at IS NULL RETURNING id", [ctx.session.tenant, ctx.session.sub]) :
      await client.query("UPDATE gs_shifts SET tracking_revoked_at=NULL, consent_version=$3, consented_at=now() WHERE tenant_id=$1 AND agent_sub=$2 AND stopped_at IS NULL RETURNING id", [ctx.session.tenant, ctx.session.sub, CONSENT_VERSION]);
    if (!updated.rowCount) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Aucun quart actif." }, { status: 409 });
    }
    await client.query("INSERT INTO gs_audit (shift_id,tenant_id,actor_sub,action) VALUES ($1,$2,$3,$4)", [updated.rows[0].id,ctx.session.tenant,ctx.session.sub,body.action === "revoke" ? "tracking.revoke" : "tracking.grant"]);
    await client.query("COMMIT");
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch(e) {
    try { await client.query("ROLLBACK"); } catch {}
    return apiError(e);
  } finally { client.release(); }
}
