import { NextResponse } from "next/server";
import { getSession } from "../../../../lib/auth";
import { database } from "../../../../lib/db";
import { requestIsSameSite } from "../../../../lib/origin.mjs";
import { parseAssignment,validAssignmentId } from "../../../../lib/assignments.mjs";
import { readJsonBody,bodyFailure } from "../../../../lib/read-json.mjs";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
async function supervisor() {
  const session = await getSession();
  if (!session?.roles?.includes("globesecure_supervisor")) return {error:NextResponse.json({error:"Accès supervision refusé."},{status:403})};
  const pool = database();
  if (!pool) return {error:NextResponse.json({error:"Base de données non configurée."},{status:503})};
  return {session,pool};
}
export async function GET() {
  const ctx = await supervisor();
  if (ctx.error) return ctx.error;
  try {
    const roster = await ctx.pool.query("SELECT agent_sub,registered_at FROM gs_agent_roster WHERE tenant_id=$1 ORDER BY registered_at DESC LIMIT 200",[ctx.session.tenant]);
    const assignments = await ctx.pool.query(
      "SELECT id,agent_sub,title,site_label,starts_at,ends_at,status,created_at FROM gs_assignments WHERE tenant_id=$1 AND ends_at>=now()-interval '14 days' ORDER BY starts_at ASC LIMIT 200",
      [ctx.session.tenant]);
    return NextResponse.json({roster:roster.rows,assignments:assignments.rows},{headers:{"Cache-Control":"no-store"}});
  } catch {return NextResponse.json({error:"Affectations indisponibles."},{status:503});}
}
export async function POST(request) {
  const ctx=await supervisor();
  if(ctx.error)return ctx.error;
  if(!requestIsSameSite(request))return NextResponse.json({error:"Origine invalide."},{status:403});
  let body;
  try {body=await readJsonBody(request);} catch(error) {
    const result=bodyFailure(error);
    return NextResponse.json({error:result.message},{status:result.status});
  }
  const assignment=parseAssignment(body);
  if(!assignment)return NextResponse.json({error:"Agent, mandat ou horaire invalide. Période maximale : 16 h; 120 jours d'avance."},{status:400});
  const client=await ctx.pool.connect().catch(()=>null);
  if(!client)return NextResponse.json({error:"Base inaccessible."},{status:503});
  try {
    await client.query("BEGIN");
    // Serialize writers for this tenant + agent, preventing parallel double-booking.
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1),hashtext($2))",[ctx.session.tenant,assignment.agentSub]);
    const enrolled=await client.query("SELECT 1 FROM gs_agent_roster WHERE tenant_id=$1 AND agent_sub=$2 FOR KEY SHARE",[ctx.session.tenant,assignment.agentSub]);
    if(!enrolled.rowCount) {
      await client.query("ROLLBACK");
      return NextResponse.json({error:"Agent non inscrit dans cette organisation."},{status:404});
    }
    const conflict=await client.query(
      "SELECT 1 FROM gs_assignments WHERE tenant_id=$1 AND agent_sub=$2 AND status='scheduled' AND starts_at < $4 AND ends_at > $3 LIMIT 1",
      [ctx.session.tenant,assignment.agentSub,assignment.startsAt,assignment.endsAt]);
    if(conflict.rowCount) {
      await client.query("ROLLBACK");
      return NextResponse.json({error:"Cet agent a déjà une affectation qui chevauche ce quart."},{status:409});
    }
    const saved=await client.query(
      "INSERT INTO gs_assignments(tenant_id,agent_sub,title,site_label,starts_at,ends_at,created_by_sub) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id,agent_sub,title,site_label,starts_at,ends_at,status",
      [ctx.session.tenant,assignment.agentSub,assignment.title,assignment.siteLabel,assignment.startsAt,assignment.endsAt,ctx.session.sub]);
    await client.query(
      "INSERT INTO gs_audit(tenant_id,actor_sub,action) VALUES($1,$2,'assignment.create')",
      [ctx.session.tenant,ctx.session.sub]);
    await client.query("COMMIT");
    return NextResponse.json({assignment:saved.rows[0]},{status:201,headers:{"Cache-Control":"no-store"}});
  } catch {
    await client.query("ROLLBACK").catch(()=>{});
    return NextResponse.json({error:"Enregistrement indisponible."},{status:503});
  } finally {client.release();}
}
export async function PATCH(request) {
  const ctx=await supervisor();
  if(ctx.error)return ctx.error;
  if(!requestIsSameSite(request))return NextResponse.json({error:"Origine invalide."},{status:403});
  let body;
  try {body=await readJsonBody(request);}catch(error) {
    const result=bodyFailure(error);
    return NextResponse.json({error:result.message},{status:result.status});
  }
  if(!validAssignmentId(body?.id)||body?.action!=="cancel")return NextResponse.json({error:"Annulation invalide."},{status:400});
  const client=await ctx.pool.connect().catch(()=>null);
  if(!client)return NextResponse.json({error:"Base inaccessible."},{status:503});
  try {
    await client.query("BEGIN");
    const cancelled=await client.query(
      "UPDATE gs_assignments SET status='cancelled',cancelled_by_sub=$3,cancelled_at=now() WHERE id=$1 AND tenant_id=$2 AND status='scheduled' RETURNING id",
      [body.id,ctx.session.tenant,ctx.session.sub]);
    if(!cancelled.rowCount) {
      await client.query("ROLLBACK");
      return NextResponse.json({error:"Affectation introuvable ou déjà annulée."},{status:404});
    }
    await client.query("INSERT INTO gs_audit(tenant_id,actor_sub,action) VALUES($1,$2,'assignment.cancel')",[ctx.session.tenant,ctx.session.sub]);
    await client.query("COMMIT");
    return NextResponse.json({ok:true},{headers:{"Cache-Control":"no-store"}});
  } catch {
    await client.query("ROLLBACK").catch(()=>{});
    return NextResponse.json({error:"Annulation indisponible."},{status:503});
  } finally {client.release();}
}
