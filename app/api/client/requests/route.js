import {NextResponse} from "next/server";
import {getSession} from "../../../../lib/auth";
import {database} from "../../../../lib/db";
import {requestIsSameSite} from "../../../../lib/origin.mjs";
import {readJsonBody,bodyFailure} from "../../../../lib/read-json.mjs";
import {validateClientRequest} from "../../../../lib/client-requests.mjs";
export const runtime="nodejs";
export const dynamic="force-dynamic";
async function clientAccess(){
  const session=await getSession();
  if(!session?.roles?.includes("globesecure_client"))return {error:NextResponse.json({error:"Accès client refusé."},{status:403})};
  const pool=database();
  if(!pool)return {error:NextResponse.json({error:"Base non configurée."},{status:503})};
  return {session,pool};
}
export async function GET(){
  const ctx=await clientAccess();
  if(ctx.error)return ctx.error;
  try {
    const records=await ctx.pool.query(
      "SELECT id,service,title,description,status,created_at,updated_at FROM gs_client_requests WHERE tenant_id=$1 AND author_sub=$2 ORDER BY created_at DESC LIMIT 101",
      [ctx.session.tenant,ctx.session.sub]);
    if(records.rowCount>100)return NextResponse.json({error:"Historique trop volumineux. Veuillez contacter le service de supervision."},{status:422});
    return NextResponse.json({requests:records.rows},{headers:{"Cache-Control":"no-store"}});
  }catch{return NextResponse.json({error:"Demandes indisponibles."},{status:503});}
}
export async function POST(request){
  const ctx=await clientAccess();
  if(ctx.error)return ctx.error;
  if(!requestIsSameSite(request))return NextResponse.json({error:"Origine invalide."},{status:403});
  if(process.env.PRIVACY_POLICY_APPROVED!=="true")return NextResponse.json({error:"Collecte de demandes non activée."},{status:503});
  let body;
  try{body=await readJsonBody(request);}catch(error){
    const failure=bodyFailure(error);
    return NextResponse.json({error:failure.message},{status:failure.status});
  }
  const data=validateClientRequest(body);
  if(!data)return NextResponse.json({error:"Type, description ou consentement invalide."},{status:400});
  const conn=await ctx.pool.connect().catch(()=>null);
  if(!conn)return NextResponse.json({error:"Base indisponible."},{status:503});
  try {
    await conn.query("BEGIN");
    // Enforce a durable per-identity quota without trusting spoofable IP headers.
    await conn.query("SELECT pg_advisory_xact_lock(hashtext($1),hashtext($2))",[ctx.session.tenant,ctx.session.sub]);
    const quota=await conn.query(
      "SELECT count(*)::int AS used FROM gs_client_requests WHERE tenant_id=$1 AND author_sub=$2 AND created_at>=now()-interval '24 hours'",
      [ctx.session.tenant,ctx.session.sub]);
    if(quota.rows[0].used>=10){
      await conn.query("ROLLBACK");
      return NextResponse.json({error:"Maximum de 10 demandes par 24 h atteint pour ce compte."},{status:429});
    }
    const created=await conn.query(
      "INSERT INTO gs_client_requests(tenant_id,author_sub,service,title,description) VALUES($1,$2,$3,$4,$5) RETURNING id,service,title,description,status,created_at,updated_at",
      [ctx.session.tenant,ctx.session.sub,data.service,data.title,data.description]);
    await conn.query("INSERT INTO gs_audit(tenant_id,actor_sub,action) VALUES($1,$2,'request.submit')",[ctx.session.tenant,ctx.session.sub]);
    await conn.query("COMMIT");
    return NextResponse.json({request:created.rows[0]},{status:201,headers:{"Cache-Control":"no-store"}});
  }catch{
    await conn.query("ROLLBACK").catch(()=>{});
    return NextResponse.json({error:"Enregistrement indisponible."},{status:503});
  }finally{conn.release();}
}
