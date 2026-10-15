import {NextResponse} from "next/server";
import {getSession} from "../../../../lib/auth";
import {database} from "../../../../lib/db";
import {requestIsSameSite} from "../../../../lib/origin.mjs";
import {readJsonBody,bodyFailure} from "../../../../lib/read-json.mjs";
import {issueCheckpointCode,checkpointDigest,parseCheckpoint,parseCheckpointToggle} from "../../../../lib/patrol.mjs";
export const runtime="nodejs";
export const dynamic="force-dynamic";
async function access(){
  const session=await getSession();
  if(!session?.roles?.includes("globesecure_supervisor"))return {error:NextResponse.json({error:"Accès supervision refusé."},{status:403})};
  const pool=database();
  if(!pool)return {error:NextResponse.json({error:"Base non configurée."},{status:503})};
  return {session,pool};
}
export async function GET(){
  const ctx=await access();
  if(ctx.error)return ctx.error;
  try{
    const checkpoints=await ctx.pool.query(
      "SELECT c.id,c.label,c.site_id,s.name AS site_name,c.active,c.created_at FROM gs_patrol_checkpoints c JOIN gs_sites s ON s.tenant_id=c.tenant_id AND s.id=c.site_id WHERE c.tenant_id=$1 ORDER BY c.created_at DESC LIMIT 201",
      [ctx.session.tenant]);
    if(checkpoints.rowCount>200)return NextResponse.json({error:"Plus de 200 points de contrôle. Contactez un administrateur pour la pagination."},{status:422});
    const visits=await ctx.pool.query(
      "SELECT v.id,v.agent_sub,v.visited_at,c.label,c.site_id,s.name AS site_name FROM gs_patrol_visits v JOIN gs_patrol_checkpoints c ON c.tenant_id=v.tenant_id AND c.id=v.checkpoint_id JOIN gs_sites s ON s.tenant_id=c.tenant_id AND s.id=c.site_id WHERE v.tenant_id=$1 ORDER BY v.visited_at DESC LIMIT 100",
      [ctx.session.tenant]);
    return NextResponse.json({checkpoints:checkpoints.rows,visits:visits.rows},{headers:{"Cache-Control":"no-store"}});
  }catch{return NextResponse.json({error:"Rondes indisponibles."},{status:503});}
}
export async function POST(request){
  const ctx=await access();
  if(ctx.error)return ctx.error;
  if(!requestIsSameSite(request))return NextResponse.json({error:"Origine invalide."},{status:403});
  let body;
  try{body=await readJsonBody(request);}catch(error){const failure=bodyFailure(error);return NextResponse.json({error:failure.message},{status:failure.status});}
  const validated=parseCheckpoint(body);
  if(!validated)return NextResponse.json({error:"Site ou nom du point invalide."},{status:400});
  const client=await ctx.pool.connect().catch(()=>null);
  if(!client)return NextResponse.json({error:"Base inaccessible."},{status:503});
  try{
    await client.query("BEGIN");
    const site=await client.query("SELECT id FROM gs_sites WHERE tenant_id=$1 AND id=$2 AND active=true FOR SHARE",[ctx.session.tenant,validated.siteId]);
    if(!site.rowCount){
      await client.query("ROLLBACK");
      return NextResponse.json({error:"Site inactif, absent ou hors de cette organisation."},{status:404});
    }
    const code=issueCheckpointCode();
    const digest=checkpointDigest(code);
    const record=await client.query(
      "INSERT INTO gs_patrol_checkpoints(tenant_id,site_id,label,code_digest,created_by_sub) VALUES($1,$2,$3,$4,$5) RETURNING id,label,site_id,active,created_at",
      [ctx.session.tenant,validated.siteId,validated.label,digest,ctx.session.sub]);
    await client.query("INSERT INTO gs_audit(tenant_id,actor_sub,action) VALUES($1,$2,'patrol.checkpoint.create')",[ctx.session.tenant,ctx.session.sub]);
    await client.query("COMMIT");
    // Never return code_digest, and never reveal the plaintext marker again after creation.
    return NextResponse.json({checkpoint:record.rows[0],code,notice:"Ce code n'est affiché qu'une seule fois. Conservez-le hors du système et ne le partagez qu'avec le personnel autorisé."},{status:201,headers:{"Cache-Control":"no-store"}});
  }catch{
    await client.query("ROLLBACK").catch(()=>{});
    return NextResponse.json({error:"Création du point de contrôle indisponible."},{status:503});
  }finally{client.release();}
}
export async function PATCH(request){
  const ctx=await access();
  if(ctx.error)return ctx.error;
  if(!requestIsSameSite(request))return NextResponse.json({error:"Origine invalide."},{status:403});
  let body;
  try{body=await readJsonBody(request);}catch(error){const failure=bodyFailure(error);return NextResponse.json({error:failure.message},{status:failure.status});}
  const change=parseCheckpointToggle(body);
  if(!change)return NextResponse.json({error:"Modification invalide."},{status:400});
  const client=await ctx.pool.connect().catch(()=>null);
  if(!client)return NextResponse.json({error:"Base inaccessible."},{status:503});
  try{
    await client.query("BEGIN");
    const updated=await client.query(
      "UPDATE gs_patrol_checkpoints SET active=$3,updated_at=now() WHERE tenant_id=$1 AND id=$2 AND active IS DISTINCT FROM $3 RETURNING id,label,site_id,active",
      [ctx.session.tenant,change.id,change.active]);
    if(!updated.rowCount){
      await client.query("ROLLBACK");
      return NextResponse.json({error:"Point introuvable ou déjà dans cet état."},{status:404});
    }
    await client.query("INSERT INTO gs_audit(tenant_id,actor_sub,action) VALUES($1,$2,$3)",[ctx.session.tenant,ctx.session.sub,change.active?"patrol.checkpoint.reactivate":"patrol.checkpoint.deactivate"]);
    await client.query("COMMIT");
    return NextResponse.json({checkpoint:updated.rows[0]},{headers:{"Cache-Control":"no-store"}});
  }catch{
    await client.query("ROLLBACK").catch(()=>{});
    return NextResponse.json({error:"Point de contrôle indisponible."},{status:503});
  }finally{client.release();}
}
