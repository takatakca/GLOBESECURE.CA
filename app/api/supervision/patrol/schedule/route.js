import {NextResponse} from "next/server";
import {getSession} from "../../../../../lib/auth";
import {database} from "../../../../../lib/db";
import {requestIsSameSite} from "../../../../../lib/origin.mjs";
import {readJsonBody,bodyFailure} from "../../../../../lib/read-json.mjs";
import {parsePatrolSchedule,parsePatrolCancellation,patrolDueStatus,patrolScheduleFrom,patrolScheduleSelect,exportPatrolReport} from "../../../../../lib/patrol-schedule.mjs";
export const runtime="nodejs";
export const dynamic="force-dynamic";
async function access(){
  const session=await getSession();
  if(!session?.roles?.includes("globesecure_supervisor"))return {error:NextResponse.json({error:"Accès supervision refusé."},{status:403})};
  const pool=database();
  if(!pool)return {error:NextResponse.json({error:"Base de données non configurée."},{status:503})};
  return {session,pool};
}
export async function GET(request){
  const ctx=await access();
  if(ctx.error)return ctx.error;
  const format=new URL(request.url).searchParams.get("format")||"json";
  if(!["json","csv"].includes(format))return NextResponse.json({error:"Format demandé invalide."},{status:400});
  try{
    const result=await ctx.pool.query(
      patrolScheduleSelect+patrolScheduleFrom+
      " WHERE p.tenant_id=$1 AND a.ends_at>=now()-interval '7 days' ORDER BY p.due_at ASC LIMIT 201",
      [ctx.session.tenant]);
    if(result.rowCount>200)return NextResponse.json({error:"Trop de rondes à afficher. Réduisez le nombre de planifications."},{status:422});
    const now=Date.now();
    const plans=result.rows.map(p=>({...p,display_status:patrolDueStatus(p,now)}));
    if(format==="csv")return new Response(exportPatrolReport(plans),{headers:{
      "Content-Type":"text/csv; charset=utf-8",
      "Content-Disposition":'attachment; filename="globesecure-rondes-planifiees.csv"',
      "Cache-Control":"no-store","X-Content-Type-Options":"nosniff"
    }});
    return NextResponse.json({plans,checked_at:new Date(now).toISOString()},{headers:{"Cache-Control":"no-store"}});
  }catch{return NextResponse.json({error:"Suivi des rondes indisponible."},{status:503});}
}
export async function POST(request){
  const ctx=await access();
  if(ctx.error)return ctx.error;
  if(!requestIsSameSite(request))return NextResponse.json({error:"Origine invalide."},{status:403});
  let body;
  try{body=await readJsonBody(request);}catch(e){const f=bodyFailure(e);return NextResponse.json({error:f.message},{status:f.status});}
  const plan=parsePatrolSchedule(body);
  if(!plan)return NextResponse.json({error:"Affectation, point, échéance ou délai invalide."},{status:400});
  const client=await ctx.pool.connect().catch(()=>null);
  if(!client)return NextResponse.json({error:"Base de données inaccessible."},{status:503});
  try{
    await client.query("BEGIN");
    const eligible=await client.query(
      `SELECT a.starts_at,a.ends_at FROM gs_assignments a
       JOIN gs_patrol_checkpoints c ON c.tenant_id=a.tenant_id AND c.id=$3 AND c.site_id=a.site_id
       JOIN gs_sites s ON s.tenant_id=c.tenant_id AND s.id=c.site_id
       WHERE a.tenant_id=$1 AND a.id=$2 AND a.status='scheduled'
         AND a.ends_at>now() AND c.active=true AND s.active=true
       FOR SHARE OF a,c,s`,[ctx.session.tenant,plan.assignmentId,plan.checkpointId]);
    if(!eligible.rowCount){
      await client.query("ROLLBACK");
      return NextResponse.json({error:"Quart, site ou point absent/inactif dans votre organisation."},{status:404});
    }
    const period=eligible.rows[0];
    if(Date.parse(plan.dueAt)<new Date(period.starts_at).getTime()||Date.parse(plan.dueAt)>=new Date(period.ends_at).getTime()){
      await client.query("ROLLBACK");
      return NextResponse.json({error:"L'échéance doit être comprise dans les horaires de l'affectation."},{status:400});
    }
    const result=await client.query(
      "INSERT INTO gs_patrol_schedule(tenant_id,assignment_id,checkpoint_id,due_at,grace_minutes,created_by_sub) VALUES($1,$2,$3,$4,$5,$6) RETURNING id,assignment_id,checkpoint_id,due_at,grace_minutes,status",
      [ctx.session.tenant,plan.assignmentId,plan.checkpointId,plan.dueAt,plan.graceMinutes,ctx.session.sub]);
    await client.query("INSERT INTO gs_patrol_schedule_events(tenant_id,schedule_id,actor_sub,action) VALUES($1,$2,$3,'create')",[ctx.session.tenant,result.rows[0].id,ctx.session.sub]);
    await client.query("INSERT INTO gs_audit(tenant_id,actor_sub,action) VALUES($1,$2,'patrol.schedule.create')",[ctx.session.tenant,ctx.session.sub]);
    await client.query("COMMIT");
    return NextResponse.json({plan:result.rows[0]},{status:201,headers:{"Cache-Control":"no-store"}});
  }catch(e){
    await client.query("ROLLBACK").catch(()=>{});
    if(e?.code==="23505")return NextResponse.json({error:"Un contrôle est déjà planifié pour ce point et cette affectation."},{status:409});
    return NextResponse.json({error:"Planification indisponible."},{status:503});
  }finally{client.release();}
}
export async function PATCH(request){
  const ctx=await access();
  if(ctx.error)return ctx.error;
  if(!requestIsSameSite(request))return NextResponse.json({error:"Origine invalide."},{status:403});
  let body;
  try{body=await readJsonBody(request);}catch(e){const f=bodyFailure(e);return NextResponse.json({error:f.message},{status:f.status});}
  const change=parsePatrolCancellation(body);
  if(!change)return NextResponse.json({error:"Annulation invalide."},{status:400});
  const client=await ctx.pool.connect().catch(()=>null);
  if(!client)return NextResponse.json({error:"Base de données inaccessible."},{status:503});
  try{
    await client.query("BEGIN");
    const changed=await client.query(
      "UPDATE gs_patrol_schedule SET status='cancelled',cancelled_by_sub=$3,cancelled_at=now() WHERE tenant_id=$1 AND id=$2 AND status='scheduled' AND due_at>now() RETURNING id",
      [ctx.session.tenant,change.id,ctx.session.sub]);
    if(!changed.rowCount){
      await client.query("ROLLBACK");
      return NextResponse.json({error:"Contrôle introuvable, déjà dû ou déjà annulé."},{status:404});
    }
    await client.query("INSERT INTO gs_patrol_schedule_events(tenant_id,schedule_id,actor_sub,action) VALUES($1,$2,$3,'cancel')",[ctx.session.tenant,change.id,ctx.session.sub]);
    await client.query("INSERT INTO gs_audit(tenant_id,actor_sub,action) VALUES($1,$2,'patrol.schedule.cancel')",[ctx.session.tenant,ctx.session.sub]);
    await client.query("COMMIT");
    return NextResponse.json({ok:true},{headers:{"Cache-Control":"no-store"}});
  }catch{
    await client.query("ROLLBACK").catch(()=>{});
    return NextResponse.json({error:"Annulation indisponible."},{status:503});
  }finally{client.release();}
}
