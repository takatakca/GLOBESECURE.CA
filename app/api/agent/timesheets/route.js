import { NextResponse } from "next/server";
import { getSession } from "../../../../lib/auth";
import { database } from "../../../../lib/db";
import { timesheetPeriod } from "../../../../lib/timesheets.mjs";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request) {
  const session=await getSession();
  if(!session?.roles?.includes("globesecure_agent"))return NextResponse.json({error:"Accès agent refusé."},{status:403});
  const search=new URL(request.url).searchParams;
  const period=timesheetPeriod(search.get("start"),search.get("end"));
  if(!period)return NextResponse.json({error:"Période invalide (maximum 93 jours en UTC)."},{status:400});
  const pool=database();
  if(!pool)return NextResponse.json({error:"Base non configurée."},{status:503});
  try {
    const result=await pool.query(
      "SELECT s.id,s.started_at,s.stopped_at,round(extract(epoch from(s.stopped_at-s.started_at))/3600,2)::float AS hours,COALESCE(a.status,'unreviewed') AS review_status FROM gs_shifts s LEFT JOIN gs_shift_approvals a ON a.tenant_id=s.tenant_id AND a.shift_id=s.id WHERE s.tenant_id=$1 AND s.agent_sub=$2 AND s.stopped_at IS NOT NULL AND s.started_at >= $3 AND s.started_at < $4 ORDER BY s.started_at DESC LIMIT 501",
      [session.tenant,session.sub,period.start,period.until]);
    if(result.rows.length>500)return NextResponse.json({error:"Plus de 500 quarts trouvés. Réduisez la période."},{status:422});
    return NextResponse.json({period:{start:period.startDay,end:period.endDay},entries:result.rows},{headers:{"Cache-Control":"no-store"}});
  } catch{return NextResponse.json({error:"Historique indisponible."},{status:503});}
}
