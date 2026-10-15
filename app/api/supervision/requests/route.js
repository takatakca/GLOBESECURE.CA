import {NextResponse} from "next/server";
import {getSession} from "../../../../lib/auth";
import {database} from "../../../../lib/db";
import {requestIsSameSite} from "../../../../lib/origin.mjs";
import {readJsonBody,bodyFailure} from "../../../../lib/read-json.mjs";
import {validateRequestDecision} from "../../../../lib/client-requests.mjs";
export const runtime="nodejs";
export const dynamic="force-dynamic";
async function supervisorAccess(){
  const session=await getSession();
  if(!session?.roles?.includes("globesecure_supervisor"))return {error:NextResponse.json({error:"Accès supervision refusé."},{status:403})};
  const pool=database();
  if(!pool)return {error:NextResponse.json({error:"Base non configurée."},{status:503})};
  return {session,pool};
}
export async function GET(){
  const ctx=await supervisorAccess();
  if(ctx.error)return ctx.error;
  try{
    const records=await ctx.pool.query(
      "SELECT id,author_sub,service,title,description,status,created_at,updated_at FROM gs_client_requests WHERE tenant_id=$1 ORDER BY created_at DESC LIMIT 201",
      [ctx.session.tenant]);
    if(records.rowCount>200)return NextResponse.json({error:"Trop de demandes pour cette page. Pagination nécessaire."},{status:422});
    return NextResponse.json({requests:records.rows},{headers:{"Cache-Control":"no-store"}});
  }catch{return NextResponse.json({error:"Demandes indisponibles."},{status:503});}
}
export async function PATCH(request){
  const ctx=await supervisorAccess();
  if(ctx.error)return ctx.error;
  if(!requestIsSameSite(request))return NextResponse.json({error:"Origine invalide."},{status:403});
  let body;
  try{body=await readJsonBody(request);}catch(error){
    const failure=bodyFailure(error);
    return NextResponse.json({error:failure.message},{status:failure.status});
  }
  const action=validateRequestDecision(body);
  if(!action)return NextResponse.json({error:"Décision invalide."},{status:400});
  const conn=await ctx.pool.connect().catch(()=>null);
  if(!conn)return NextResponse.json({error:"Base inaccessible."},{status:503});
  try{
    await conn.query("BEGIN");
    const updated=await conn.query(
      "UPDATE gs_client_requests SET status=$4,reviewer_sub=$5,updated_at=now() WHERE tenant_id=$1 AND id=$2 AND status=$3 RETURNING id,status,updated_at",
      [ctx.session.tenant,action.id,action.from,action.status,ctx.session.sub]);
    if(!updated.rowCount){
      await conn.query("ROLLBACK");
      return NextResponse.json({error:"Demande absente de cette organisation ou transition interdite."},{status:409});
    }
    await conn.query(
      "INSERT INTO gs_client_request_events(tenant_id,request_id,actor_sub,action,internal_note) VALUES($1,$2,$3,$4,$5)",
      [ctx.session.tenant,action.id,ctx.session.sub,action.action,action.note]);
    await conn.query("INSERT INTO gs_audit(tenant_id,actor_sub,action) VALUES($1,$2,$3)",[ctx.session.tenant,ctx.session.sub,"request."+action.action]);
    await conn.query("COMMIT");
    return NextResponse.json({request:updated.rows[0]},{headers:{"Cache-Control":"no-store"}});
  }catch{
    await conn.query("ROLLBACK").catch(()=>{});
    return NextResponse.json({error:"Modification indisponible."},{status:503});
  }finally{conn.release();}
}
