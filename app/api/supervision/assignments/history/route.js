import {NextResponse} from "next/server";
import {getSession} from "../../../../../lib/auth";
import {database} from "../../../../../lib/db";
import {validAssignmentId} from "../../../../../lib/assignments.mjs";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(request){
  const session=await getSession();
  if(!session?.roles?.includes("globesecure_supervisor"))return NextResponse.json({error:"Accès supervision refusé."},{status:403});
  const id=new URL(request.url).searchParams.get("id");
  if(!validAssignmentId(id))return NextResponse.json({error:"Identifiant invalide."},{status:400});
  const pool=database();
  if(!pool)return NextResponse.json({error:"Base non configurée."},{status:503});
  try{
    const assignment=await pool.query("SELECT 1 FROM gs_assignments WHERE tenant_id=$1 AND id=$2",[session.tenant,id]);
    if(!assignment.rowCount)return NextResponse.json({error:"Affectation introuvable."},{status:404});
    const events=await pool.query(
      "SELECT actor_sub,previous_values,current_values,changed_at FROM gs_assignment_changes WHERE tenant_id=$1 AND assignment_id=$2 ORDER BY changed_at DESC,id DESC LIMIT 101",
      [session.tenant,id]);
    if(events.rowCount>100)return NextResponse.json({error:"Historique trop volumineux. Consultez un administrateur pour une extraction paginée."},{status:422});
    return NextResponse.json({events:events.rows},{headers:{"Cache-Control":"no-store"}});
  }catch{return NextResponse.json({error:"Historique indisponible."},{status:503});}
}
