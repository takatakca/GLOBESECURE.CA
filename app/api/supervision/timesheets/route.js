import { NextResponse } from "next/server";
import { getSession } from "../../../../lib/auth";
import { database } from "../../../../lib/db";
import { timesheetPeriod,exportTimesheets } from "../../../../lib/timesheets.mjs";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request) {
  const session=await getSession();
  if(!session?.roles?.includes("globesecure_supervisor"))return NextResponse.json({error:"Accès supervision refusé."},{status:403});
  const search=new URL(request.url).searchParams;
  const period=timesheetPeriod(search.get("start"),search.get("end"));
  const format=search.get("format")||"json";
  if(!period||!["json","csv"].includes(format))return NextResponse.json({error:"Paramètres invalides (maximum 93 jours UTC)."},{status:400});
  const pool=database();
  if(!pool)return NextResponse.json({error:"Base non configurée."},{status:503});
  try {
    const result=await pool.query(
      "SELECT s.id,s.agent_sub,s.started_at,s.stopped_at,round(extract(epoch from(s.stopped_at-s.started_at))/3600,2)::float AS hours,COALESCE(a.status,'unreviewed') AS review_status FROM gs_shifts s LEFT JOIN gs_shift_approvals a ON a.tenant_id=s.tenant_id AND a.shift_id=s.id WHERE s.tenant_id=$1 AND s.stopped_at IS NOT NULL AND s.started_at >= $2 AND s.started_at < $3 ORDER BY s.started_at DESC LIMIT 2001",
      [session.tenant,period.start,period.until]);
    if(result.rows.length>2000)return NextResponse.json({error:"Plus de 2 000 quarts dans cette période. Réduisez la plage de dates pour un export complet."},{status:422});
    if(format==="csv"){
      const body=exportTimesheets(result.rows.map(row=>({...row,started_at:new Date(row.started_at).toISOString(),stopped_at:new Date(row.stopped_at).toISOString()})));
      return new Response(body,{headers:{"Content-Type":"text/csv; charset=utf-8","Content-Disposition":"attachment; filename=\"globesecure-pointages.csv\"","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
    }
    return NextResponse.json({period:{start:period.startDay,end:period.endDay},entries:result.rows,limit:2000},{headers:{"Cache-Control":"no-store"}});
  } catch{return NextResponse.json({error:"Pointages indisponibles."},{status:503});}
}
