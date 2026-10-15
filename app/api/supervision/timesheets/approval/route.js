import { NextResponse } from "next/server";
import { getSession } from "../../../../../lib/auth";
import { database } from "../../../../../lib/db";
import { requestIsSameSite } from "../../../../../lib/origin.mjs";
import { readJsonBody,bodyFailure } from "../../../../../lib/read-json.mjs";
import { parseApproval } from "../../../../../lib/approval.mjs";
export const runtime="nodejs";
export async function POST(request) {
  const session=await getSession();
  if(!session?.roles?.includes("globesecure_supervisor"))return NextResponse.json({error:"Accès supervision refusé."},{status:403});
  if(!requestIsSameSite(request))return NextResponse.json({error:"Origine invalide."},{status:403});
  let body;
  try {body=await readJsonBody(request);}catch(error) {
    const result=bodyFailure(error);
    return NextResponse.json({error:result.message},{status:result.status});
  }
  const approval=parseApproval(body);
  if(!approval)return NextResponse.json({error:"Décision ou identifiant invalide."},{status:400});
  const pool=database();
  if(!pool)return NextResponse.json({error:"Base non configurée."},{status:503});
  const client=await pool.connect().catch(()=>null);
  if(!client)return NextResponse.json({error:"Base inaccessible."},{status:503});
  try {
    await client.query("BEGIN");
    const shift=await client.query(
      "SELECT id FROM gs_shifts WHERE id=$1 AND tenant_id=$2 AND stopped_at IS NOT NULL FOR UPDATE",
      [approval.shiftId,session.tenant]);
    if(!shift.rowCount){
      await client.query("ROLLBACK");
      return NextResponse.json({error:"Quart terminé introuvable pour cette organisation."},{status:404});
    }
    const old=await client.query("SELECT status FROM gs_shift_approvals WHERE tenant_id=$1 AND shift_id=$2 FOR UPDATE",[session.tenant,approval.shiftId]);
    if((old.rows[0]?.status||"unreviewed")===approval.status){
      await client.query("ROLLBACK");
      return NextResponse.json({error:"Ce quart possède déjà cet état."},{status:409});
    }
    if(approval.action==="revoke"&&!old.rowCount) {
      await client.query("ROLLBACK");
      return NextResponse.json({error:"Aucune approbation à retirer."},{status:409});
    }
    await client.query(
      "INSERT INTO gs_shift_approvals(tenant_id,shift_id,status,reviewer_sub) VALUES ($1,$2,$3,$4) ON CONFLICT(tenant_id,shift_id) DO UPDATE SET status=excluded.status,reviewer_sub=excluded.reviewer_sub,updated_at=now()",
      [session.tenant,approval.shiftId,approval.status,session.sub]);
    await client.query(
      "INSERT INTO gs_shift_approval_events(tenant_id,shift_id,reviewer_sub,action,note) VALUES($1,$2,$3,$4,$5)",
      [session.tenant,approval.shiftId,session.sub,approval.action,approval.note]);
    await client.query("INSERT INTO gs_audit(shift_id,tenant_id,actor_sub,action) VALUES($1,$2,$3,$4)",[approval.shiftId,session.tenant,session.sub,"timesheet."+approval.action]);
    await client.query("COMMIT");
    return NextResponse.json({ok:true,status:approval.status},{headers:{"Cache-Control":"no-store"}});
  }catch{
    await client.query("ROLLBACK").catch(()=>{});
    return NextResponse.json({error:"Décision de pointage indisponible."},{status:503});
  }finally{client.release();}
}
