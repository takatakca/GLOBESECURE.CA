import {NextResponse} from "next/server";
import {getSession} from "../../../../../lib/auth";
import {database} from "../../../../../lib/db";
import {requestIsSameSite} from "../../../../../lib/origin.mjs";
import {readJsonBody,bodyFailure} from "../../../../../lib/read-json.mjs";
import {parseReschedule} from "../../../../../lib/reschedule.mjs";
export const runtime="nodejs";
export async function POST(request){
  const session=await getSession();
  if(!session?.roles?.includes("globesecure_supervisor"))return NextResponse.json({error:"Accès supervision refusé."},{status:403});
  if(!requestIsSameSite(request))return NextResponse.json({error:"Origine invalide."},{status:403});
  let body;
  try{body=await readJsonBody(request);}catch(error){
    const result=bodyFailure(error);
    return NextResponse.json({error:result.message},{status:result.status});
  }
  const desired=parseReschedule(body);
  if(!desired)return NextResponse.json({error:"Identifiant ou nouveaux horaires invalides."},{status:400});
  const pool=database();
  if(!pool)return NextResponse.json({error:"Base non configurée."},{status:503});
  const client=await pool.connect().catch(()=>null);
  if(!client)return NextResponse.json({error:"Base inaccessible."},{status:503});
  try{
    await client.query("BEGIN");
    const existing=await client.query(
      "SELECT id,agent_sub,title,site_id,site_label,starts_at,ends_at FROM gs_assignments WHERE tenant_id=$1 AND id=$2 AND status='scheduled' AND starts_at>now() FOR UPDATE",
      [session.tenant,desired.assignmentId]);
    if(!existing.rowCount){
      await client.query("ROLLBACK");
      return NextResponse.json({error:"Affectation future active introuvable."},{status:404});
    }
    // Create/reschedule requests for the same agent are serialized.
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1),hashtext($2))",[session.tenant,desired.agentSub]);
    const roster=await client.query("SELECT 1 FROM gs_agent_roster WHERE tenant_id=$1 AND agent_sub=$2 FOR KEY SHARE",[session.tenant,desired.agentSub]);
    if(!roster.rowCount){
      await client.query("ROLLBACK");
      return NextResponse.json({error:"Agent non inscrit dans votre organisation."},{status:404});
    }
    let siteLabel=desired.siteLabel;
    if(desired.siteId){
      const site=await client.query("SELECT name FROM gs_sites WHERE tenant_id=$1 AND id=$2 AND active=true FOR SHARE",[session.tenant,desired.siteId]);
      if(!site.rowCount){
        await client.query("ROLLBACK");
        return NextResponse.json({error:"Site inactif ou hors de cette organisation."},{status:404});
      }
      siteLabel=site.rows[0].name;
    }
    const conflicts=await client.query(
      "SELECT 1 FROM gs_assignments WHERE tenant_id=$1 AND agent_sub=$2 AND id<>$5 AND status='scheduled' AND starts_at<$4 AND ends_at>$3 LIMIT 1",
      [session.tenant,desired.agentSub,desired.startsAt,desired.endsAt,desired.assignmentId]);
    if(conflicts.rowCount){
      await client.query("ROLLBACK");
      return NextResponse.json({error:"Cet agent possède déjà un quart sur la période indiquée."},{status:409});
    }
    const prior=existing.rows[0];
    const updated=await client.query(
      "UPDATE gs_assignments SET agent_sub=$3,title=$4,site_id=$5,site_label=$6,starts_at=$7,ends_at=$8 WHERE tenant_id=$1 AND id=$2 RETURNING id,agent_sub,title,site_id,site_label,starts_at,ends_at,status",
      [session.tenant,desired.assignmentId,desired.agentSub,desired.title,desired.siteId,siteLabel,desired.startsAt,desired.endsAt]);
    const next=updated.rows[0];
    const shape=row=>({agentSub:row.agent_sub,title:row.title,siteId:row.site_id,siteLabel:row.site_label,startsAt:row.starts_at,endsAt:row.ends_at});
    await client.query(
      "INSERT INTO gs_assignment_changes(tenant_id,assignment_id,actor_sub,previous_values,current_values) VALUES($1,$2,$3,$4,$5)",
      [session.tenant,desired.assignmentId,session.sub,JSON.stringify(shape(prior)),JSON.stringify(shape(next))]);
    await client.query("INSERT INTO gs_audit(tenant_id,actor_sub,action) VALUES($1,$2,'assignment.reschedule')",[session.tenant,session.sub]);
    await client.query("COMMIT");
    return NextResponse.json({assignment:next},{headers:{"Cache-Control":"no-store"}});
  }catch{
    await client.query("ROLLBACK").catch(()=>{});
    return NextResponse.json({error:"Modification indisponible."},{status:503});
  }finally{client.release();}
}
