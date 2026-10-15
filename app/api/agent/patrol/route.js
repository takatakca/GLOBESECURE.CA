import {NextResponse} from "next/server";
import {getSession} from "../../../../lib/auth";
import {database} from "../../../../lib/db";
import {requestIsSameSite} from "../../../../lib/origin.mjs";
import {readJsonBody,bodyFailure} from "../../../../lib/read-json.mjs";
import {parseVisit} from "../../../../lib/patrol.mjs";
export const runtime="nodejs";
export const dynamic="force-dynamic";
async function access(){
  const session=await getSession();
  if(!session?.roles?.includes("globesecure_agent"))return {error:NextResponse.json({error:"Accès agent refusé."},{status:403})};
  const pool=database();
  if(!pool)return {error:NextResponse.json({error:"Base non configurée."},{status:503})};
  return {session,pool};
}
export async function GET(){
  const ctx=await access();
  if(ctx.error)return ctx.error;
  try{
    const visits=await ctx.pool.query(
      "SELECT v.id,v.visited_at,c.label,s.name AS site_name FROM gs_patrol_visits v JOIN gs_patrol_checkpoints c ON c.tenant_id=v.tenant_id AND c.id=v.checkpoint_id JOIN gs_sites s ON s.tenant_id=c.tenant_id AND s.id=c.site_id WHERE v.tenant_id=$1 AND v.agent_sub=$2 ORDER BY v.visited_at DESC LIMIT 50",
      [ctx.session.tenant,ctx.session.sub]);
    return NextResponse.json({visits:visits.rows},{headers:{"Cache-Control":"no-store"}});
  }catch{return NextResponse.json({error:"Passages indisponibles."},{status:503});}
}
export async function POST(request){
  const ctx=await access();
  if(ctx.error)return ctx.error;
  if(!requestIsSameSite(request))return NextResponse.json({error:"Origine invalide."},{status:403});
  let body;
  try{body=await readJsonBody(request);}catch(error){const failure=bodyFailure(error);return NextResponse.json({error:failure.message},{status:failure.status});}
  const visit=parseVisit(body);
  if(!visit)return NextResponse.json({error:"Code de contrôle invalide."},{status:400});
  const client=await ctx.pool.connect().catch(()=>null);
  if(!client)return NextResponse.json({error:"Base inaccessible."},{status:503});
  try{
    await client.query("BEGIN");
    const checkpoint=await client.query(
      "SELECT c.id,c.site_id,c.label,s.name AS site_name FROM gs_patrol_checkpoints c JOIN gs_sites s ON s.tenant_id=c.tenant_id AND s.id=c.site_id WHERE c.tenant_id=$1 AND c.code_digest=$2 AND c.active=true AND s.active=true FOR SHARE OF c,s",
      [ctx.session.tenant,visit.digest]);
    if(!checkpoint.rowCount){
      await client.query("ROLLBACK");
      return NextResponse.json({error:"Point de contrôle inconnu ou désactivé."},{status:404});
    }
    const shift=await client.query("SELECT id FROM gs_shifts WHERE tenant_id=$1 AND agent_sub=$2 AND stopped_at IS NULL FOR SHARE",[ctx.session.tenant,ctx.session.sub]);
    if(!shift.rowCount){
      await client.query("ROLLBACK");
      return NextResponse.json({error:"Un quart actif est obligatoire pour enregistrer un passage."},{status:409});
    }
    const linked=await client.query(
      "SELECT 1 FROM gs_assignments WHERE tenant_id=$1 AND agent_sub=$2 AND site_id=$3 AND status='scheduled' AND starts_at<=now()+interval '10 minutes' AND ends_at>now() LIMIT 1",
      [ctx.session.tenant,ctx.session.sub,checkpoint.rows[0].site_id]);
    if(!linked.rowCount){
      await client.query("ROLLBACK");
      return NextResponse.json({error:"Aucune affectation actuelle pour ce site."},{status:403});
    }
    const added=await client.query(
      "INSERT INTO gs_patrol_visits(tenant_id,checkpoint_id,shift_id,agent_sub) VALUES($1,$2,$3,$4) ON CONFLICT(tenant_id,shift_id,checkpoint_id) DO NOTHING RETURNING id,visited_at",
      [ctx.session.tenant,checkpoint.rows[0].id,shift.rows[0].id,ctx.session.sub]);
    if(!added.rowCount){
      await client.query("ROLLBACK");
      return NextResponse.json({error:"Passage déjà enregistré sur ce quart."},{status:409});
    }
    await client.query("INSERT INTO gs_audit(shift_id,tenant_id,actor_sub,action) VALUES($1,$2,$3,'patrol.visit')",[shift.rows[0].id,ctx.session.tenant,ctx.session.sub]);
    await client.query("COMMIT");
    return NextResponse.json({visit:{...added.rows[0],label:checkpoint.rows[0].label,site_name:checkpoint.rows[0].site_name}},{status:201,headers:{"Cache-Control":"no-store"}});
  }catch{
    await client.query("ROLLBACK").catch(()=>{});
    return NextResponse.json({error:"Enregistrement du passage indisponible."},{status:503});
  }finally{client.release();}
}
