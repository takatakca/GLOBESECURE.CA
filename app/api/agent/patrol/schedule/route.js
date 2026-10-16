import {NextResponse} from "next/server";
import {getSession} from "../../../../../lib/auth";
import {database} from "../../../../../lib/db";
import {patrolDueStatus,patrolScheduleSelect,patrolScheduleFrom} from "../../../../../lib/patrol-schedule.mjs";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(){
  const session=await getSession();
  if(!session?.roles?.includes("globesecure_agent"))return NextResponse.json({error:"Accès agent refusé."},{status:403});
  const pool=database();
  if(!pool)return NextResponse.json({error:"Base de données non configurée."},{status:503});
  try{
    const rows=await pool.query(
      patrolScheduleSelect+patrolScheduleFrom+
      " WHERE p.tenant_id=$1 AND a.agent_sub=$2 AND p.status='scheduled' AND a.status='scheduled' AND a.ends_at>=now()-interval '7 days' ORDER BY p.due_at ASC LIMIT 101",
      [session.tenant,session.sub]);
    if(rows.rowCount>100)return NextResponse.json({error:"Trop de rondes pour une seule page."},{status:422});
    const now=Date.now();
    return NextResponse.json({plans:rows.rows.map(p=>({...p,display_status:patrolDueStatus(p,now)})),checked_at:new Date(now).toISOString()},{headers:{"Cache-Control":"no-store"}});
  }catch{return NextResponse.json({error:"Programme de ronde indisponible."},{status:503});}
}
