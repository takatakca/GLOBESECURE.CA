import { NextResponse } from "next/server";
import { getSession } from "../../../../lib/auth";
import { database } from "../../../../lib/db";
import { requestIsSameSite } from "../../../../lib/origin.mjs";
import { readJsonBody,bodyFailure } from "../../../../lib/read-json.mjs";
import {parseSite,parseSiteChange} from "../../../../lib/sites.mjs";
export const runtime="nodejs";
export const dynamic="force-dynamic";
async function access() {
  const session=await getSession();
  if(!session?.roles?.includes("globesecure_supervisor")) return {error:NextResponse.json({error:"Accès supervision refusé."},{status:403})};
  const pool=database();
  if(!pool) return {error:NextResponse.json({error:"Base non configurée."},{status:503})};
  return {session,pool};
}
export async function GET(){
  const ctx=await access();
  if(ctx.error)return ctx.error;
  try {
    const sites=await ctx.pool.query(
      "SELECT id,name,city,active,created_at,updated_at FROM gs_sites WHERE tenant_id=$1 ORDER BY active DESC,name ASC LIMIT 501",
      [ctx.session.tenant]);
    if(sites.rowCount>500)return NextResponse.json({error:"Plus de 500 sites. Contactez votre administrateur pour un accès paginé."},{status:422});
    return NextResponse.json({sites:sites.rows},{headers:{"Cache-Control":"no-store"}});
  }catch{return NextResponse.json({error:"Sites indisponibles."},{status:503});}
}
export async function POST(request) {
  const ctx=await access();
  if(ctx.error)return ctx.error;
  if(!requestIsSameSite(request))return NextResponse.json({error:"Origine invalide."},{status:403});
  let body;
  try{body=await readJsonBody(request);}catch(error){
    const failure=bodyFailure(error);
    return NextResponse.json({error:failure.message},{status:failure.status});
  }
  const site=parseSite(body);
  if(!site)return NextResponse.json({error:"Nom ou ville du site invalide."},{status:400});
  const client=await ctx.pool.connect().catch(()=>null);
  if(!client)return NextResponse.json({error:"Base inaccessible."},{status:503});
  try{
    await client.query("BEGIN");
    const created=await client.query(
      "INSERT INTO gs_sites(tenant_id,name,city,created_by_sub) VALUES($1,$2,$3,$4) RETURNING id,name,city,active,created_at,updated_at",
      [ctx.session.tenant,site.name,site.city,ctx.session.sub]);
    await client.query("INSERT INTO gs_audit(tenant_id,actor_sub,action) VALUES($1,$2,'site.create')",[ctx.session.tenant,ctx.session.sub]);
    await client.query("COMMIT");
    return NextResponse.json({site:created.rows[0]},{status:201,headers:{"Cache-Control":"no-store"}});
  }catch(error){
    await client.query("ROLLBACK").catch(()=>{});
    return NextResponse.json({error:error?.code==="23505"?"Un site portant ce nom existe déjà.":"Création du site indisponible."},{status:error?.code==="23505"?409:503});
  }finally{client.release();}
}
export async function PATCH(request){
  const ctx=await access();
  if(ctx.error)return ctx.error;
  if(!requestIsSameSite(request))return NextResponse.json({error:"Origine invalide."},{status:403});
  let body;
  try{body=await readJsonBody(request);}catch(error){
    const failure=bodyFailure(error);
    return NextResponse.json({error:failure.message},{status:failure.status});
  }
  const change=parseSiteChange(body);
  if(!change)return NextResponse.json({error:"Modification de site invalide."},{status:400});
  const client=await ctx.pool.connect().catch(()=>null);
  if(!client)return NextResponse.json({error:"Base inaccessible."},{status:503});
  try{
    await client.query("BEGIN");
    const saved=await client.query(
      "UPDATE gs_sites SET active=$3,updated_by_sub=$4,updated_at=now() WHERE tenant_id=$1 AND id=$2 AND active IS DISTINCT FROM $3 RETURNING id,name,city,active,updated_at",
      [ctx.session.tenant,change.id,change.active,ctx.session.sub]);
    if(!saved.rowCount){
      await client.query("ROLLBACK");
      return NextResponse.json({error:"Site introuvable ou déjà dans cet état."},{status:404});
    }
    await client.query("INSERT INTO gs_audit(tenant_id,actor_sub,action) VALUES($1,$2,$3)",[ctx.session.tenant,ctx.session.sub,change.active?"site.reactivate":"site.deactivate"]);
    await client.query("COMMIT");
    return NextResponse.json({site:saved.rows[0]},{headers:{"Cache-Control":"no-store"}});
  }catch{
    await client.query("ROLLBACK").catch(()=>{});
    return NextResponse.json({error:"Modification temporairement indisponible."},{status:503});
  }finally{client.release();}
}
