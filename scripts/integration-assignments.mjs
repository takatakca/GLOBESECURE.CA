// Isolated CI integration test. NEVER point this at a production database.
import { spawn,spawnSync } from "node:child_process";
import { SignJWT } from "jose";
import pg from "pg";
import assert from "node:assert/strict";

const uri = process.env.DATABASE_URL;
const parsed = uri ? new URL(uri) : null;
if (process.env.GLOBESECURE_ALLOW_TEST_DB !== "true" || !parsed ||
    !["localhost","127.0.0.1"].includes(parsed.hostname) ||
    parsed.pathname !== "/globesecure_test") {
  throw new Error("Refusing to run against any non-local or non-disposable database");
}
const pool = new pg.Pool({connectionString:uri});
let server;
const base = "http://127.0.0.1:3078";
const secret = new TextEncoder().encode(process.env.SESSION_SECRET);
const sleep = ms => new Promise(resolve=>setTimeout(resolve,ms));
async function session(sub,tenant,role) {
  const jwt=await new SignJWT({sub,tenant,roles:[role],name:sub})
    .setProtectedHeader({alg:"HS256"}).setIssuer("globesecure.ca")
    .setAudience("globesecure-web").setIssuedAt().setExpirationTime("1h").sign(secret);
  return "__Host-gs_session="+jwt;
}
async function invoke(path,roleCookie,method="GET",body) {
  const response=await fetch(base+path,{
    method,
    headers:{"Cookie":roleCookie,"Origin":"https://globesecure.ca",...(body ? {"Content-Type":"application/json"}:{})},
    ...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(10000)
  });
  const payload=await response.json();
  return {status:response.status,payload};
}
async function main() {
  // The same guarded, checksum-tracked migration runner that staging will use.
  const migrationEnv={...process.env,GLOBESECURE_DEPLOYMENT_ENV:"ci",GLOBESECURE_MIGRATE_ENABLED:"true",GLOBESECURE_BACKUP_VERIFIED:"true"};
  for(let attempt=0;attempt<2;attempt++){
    const run=spawnSync(process.execPath,["scripts/migrate-db.mjs","--apply"],{
      env:migrationEnv,encoding:"utf8",timeout:25000
    });
    if(run.status!==0)throw Error("Guarded migration run failed: "+(run.stderr||run.stdout).slice(-1000));
    assert.match(run.stdout,attempt===0?/APPLIED 011_patrol_schedule.sql/:/VERIFIED 011_patrol_schedule.sql/);
    console.log("Guarded migration pass "+(attempt+1)+" succeeded");
  }
  server=spawn(process.execPath,[".next/standalone/server.js"],{
    env:{...process.env,PORT:"3078",HOSTNAME:"127.0.0.1"},stdio:["ignore","pipe","pipe"]
  });
  server.stdout.on("data",()=>{});server.stderr.on("data",()=>{});
  let ready=false;
  for(let i=0;i<35;i++) {
    if(server.exitCode!==null)throw new Error("Standalone server exited early");
    try{const r=await fetch(base+"/api/health");if(r.ok){ready=true;break;}}catch{}
    await sleep(400);
  }
  assert.ok(ready,"standalone server not ready");
  const agentA=await session("agent-alpha","tenant-a","globesecure_agent");
  const agentB=await session("agent-beta","tenant-b","globesecure_agent");
  const adminA=await session("supervisor-alpha","tenant-a","globesecure_supervisor");
  const adminB=await session("supervisor-beta","tenant-b","globesecure_supervisor");
  const clientA=await session("client-alpha","tenant-a","globesecure_client");
  const clientB=await session("client-beta","tenant-b","globesecure_client");
  const clientC=await session("client-charlie","tenant-a","globesecure_client");
  const agentC=await session("agent-gamma","tenant-a","globesecure_agent");
  assert.equal((await invoke("/api/supervision/assignments",agentA)).status,403,"agents cannot supervise");
  assert.equal((await invoke("/api/agent/roster",agentA,"POST")).status,200,"agent A registers");
  assert.equal((await invoke("/api/agent/roster",agentB,"POST")).status,200,"agent B registers");
  const roster=await invoke("/api/supervision/assignments",adminA);
  assert.equal(roster.status,200);
  assert.deepEqual(roster.payload.roster.map(x=>x.agent_sub),["agent-alpha"],"must not leak other tenant roster");
  assert.equal((await invoke("/api/agent/roster",agentC,"POST")).status,200,"second agent registers in tenant A");
  // Sites are owned by their tenant; supervisors do not gain another tenant's sites.
  assert.equal((await invoke("/api/supervision/sites",agentA)).status,403);
  const siteResult=await invoke("/api/supervision/sites",adminA,"POST",{name:"Édifice Alpha",city:"Montréal"});
  assert.equal(siteResult.status,201,JSON.stringify(siteResult.payload));
  const siteA=siteResult.payload.site;
  assert.equal((await invoke("/api/supervision/sites",adminA,"POST",{name:"édifice alpha",city:"Montréal"})).status,409,"duplicate tenant site must be rejected");
  assert.equal((await invoke("/api/supervision/sites",adminB,"POST",{name:"Édifice Alpha",city:"Québec"})).status,201,"other tenant may have same site name");
  assert.deepEqual((await invoke("/api/supervision/sites",adminA)).payload.sites.map(item=>item.city),["Montréal"],"cross-tenant site must not leak");
  assert.equal((await invoke("/api/supervision/sites",adminB,"PATCH",{id:siteA.id,action:"setActive",active:false})).status,404,"cannot deactivate another tenant site");
  const begins=new Date(Date.now()+2*3600_000);
  begins.setUTCSeconds(0,0);
  const ends=new Date(begins.getTime()+6*3600_000);
  const payload={agentSub:"agent-alpha",title:"Sécurité du bâtiment",siteId:siteA.id,siteLabel:"FAUX LIBELLÉ FOURNI",startsAt:begins.toISOString(),endsAt:ends.toISOString()};
  assert.equal((await invoke("/api/supervision/assignments",adminB,"POST",payload)).status,404,"cross-tenant agent cannot be assigned");
  const otherTenantSite=await invoke("/api/supervision/assignments",adminB,"POST",{...payload,agentSub:"agent-beta"});
  assert.equal(otherTenantSite.status,404,"cross-tenant site cannot be used even for a local agent");
  const created=await invoke("/api/supervision/assignments",adminA,"POST",payload);
  assert.equal(created.status,201,JSON.stringify(created.payload));
  assert.equal(created.payload.assignment.site_label,"Édifice Alpha","server must derive site name from database");
  assert.equal((await invoke("/api/supervision/assignments",adminA,"POST",payload)).status,409,"overlapping hours denied");
  const revisedStarts=new Date(begins.getTime()+9*3600_000).toISOString();
  const revisedEnds=new Date(ends.getTime()+9*3600_000).toISOString();
  const reschedule={...payload,assignmentId:created.payload.assignment.id,title:"Surveillance du soir",startsAt:revisedStarts,endsAt:revisedEnds};
  assert.equal((await invoke("/api/supervision/assignments/reschedule",agentA,"POST",reschedule)).status,403,"agent cannot reschedule");
  assert.equal((await invoke("/api/supervision/assignments/reschedule",adminB,"POST",reschedule)).status,404,"cannot modify another tenant's assignment");
  const changed=await invoke("/api/supervision/assignments/reschedule",adminA,"POST",reschedule);
  assert.equal(changed.status,200,JSON.stringify(changed.payload));
  assert.equal(changed.payload.assignment.title,"Surveillance du soir");
  assert.equal(changed.payload.assignment.site_label,"Édifice Alpha","server must keep canonical site label");
  assert.equal(new Date(changed.payload.assignment.starts_at).toISOString(),revisedStarts);
  const changeHistory=await pool.query(
    "SELECT tenant_id,actor_sub,previous_values,current_values FROM gs_assignment_changes WHERE assignment_id=$1",
    [reschedule.assignmentId]);
  assert.equal(changeHistory.rowCount,1,"schedule edit must be appended to audit");
  assert.equal(changeHistory.rows[0].tenant_id,"tenant-a");
  assert.equal(changeHistory.rows[0].actor_sub,"supervisor-alpha");
  assert.equal(changeHistory.rows[0].current_values.title,"Surveillance du soir");
  assert.equal((await invoke("/api/supervision/assignments/history?id="+reschedule.assignmentId,agentA)).status,403,"agent cannot read supervisor change history");
  assert.equal((await invoke("/api/supervision/assignments/history?id="+reschedule.assignmentId,adminB)).status,404,"history is tenant-isolated");
  const history=await invoke("/api/supervision/assignments/history?id="+reschedule.assignmentId,adminA);
  assert.equal(history.status,200);
  assert.equal(history.payload.events.length,1);
  assert.equal(history.payload.events[0].current_values.title,"Surveillance du soir");
  const gammaSchedule={...payload,agentSub:"agent-gamma",title:"Garde en parallèle",startsAt:revisedStarts,endsAt:revisedEnds};
  const gammaCreated=await invoke("/api/supervision/assignments",adminA,"POST",gammaSchedule);
  assert.equal(gammaCreated.status,201,JSON.stringify(gammaCreated.payload));
  assert.equal((await invoke("/api/supervision/assignments/reschedule",adminA,"POST",{...reschedule,agentSub:"agent-gamma"})).status,409,"reassignment cannot double-book the new agent");
  assert.equal((await invoke("/api/agent/assignments",clientA)).status,403,"client cannot see agent private schedules");
  const assigned=await invoke("/api/agent/assignments",agentA);
  assert.equal(assigned.status,200);
  assert.equal(assigned.payload.assignments.length,1);
  assert.equal((await invoke("/api/agent/assignments",agentB)).payload.assignments.length,0,"agent B cannot see agent A");
  const id=created.payload.assignment.id;
  assert.equal((await invoke("/api/supervision/assignments",adminB,"PATCH",{id,action:"cancel"})).status,404,"cross-tenant cancellation denied");
  assert.equal((await invoke("/api/supervision/assignments",adminA,"PATCH",{id,action:"cancel"})).status,200);
  assert.equal((await invoke("/api/agent/assignments",agentA)).payload.assignments[0].status,"cancelled");
  const reassign=await invoke("/api/supervision/assignments/reschedule",adminA,"POST",{
    ...gammaSchedule,assignmentId:gammaCreated.payload.assignment.id,agentSub:"agent-alpha"
  });
  assert.equal(reassign.status,200,JSON.stringify(reassign.payload));
  assert.equal(reassign.payload.assignment.agent_sub,"agent-alpha");
  assert.equal((await invoke("/api/agent/assignments",agentC)).payload.assignments.length,0,"previous assignee no longer sees reassigned work");
  assert.equal((await invoke("/api/agent/assignments",agentA)).payload.assignments.length,2,"new assignee sees reassigned work");

  assert.equal((await invoke("/api/supervision/sites",adminA,"PATCH",{id:siteA.id,action:"setActive",active:false})).status,200);
  assert.equal((await invoke("/api/supervision/assignments",adminA,"POST",payload)).status,404,"inactive site cannot be assigned");
  assert.equal((await invoke("/api/supervision/sites",adminA,"PATCH",{id:siteA.id,action:"setActive",active:true})).status,200);
  // A random checkpoint code is revealed once and never included in lists.
  assert.equal((await invoke("/api/supervision/patrol",agentA)).status,403,"agent cannot create or inspect checkpoints");
  const createdPoint=await invoke("/api/supervision/patrol",adminA,"POST",{siteId:siteA.id,label:"Entrée principale"});
  assert.equal(createdPoint.status,201,JSON.stringify(createdPoint.payload));
  const code=createdPoint.payload.code;
  const pointId=createdPoint.payload.checkpoint.id;
  assert.match(code,/^[A-Za-z0-9_-]{32}$/);
  assert.equal("code_digest" in createdPoint.payload.checkpoint,false,"digest must not leak");
  const sitesWithPoints=await invoke("/api/supervision/patrol",adminA);
  assert.equal(sitesWithPoints.payload.checkpoints.length,1);
  assert.ok(!JSON.stringify(sitesWithPoints.payload).includes(code),"secret never reappears after creation");
  assert.equal((await invoke("/api/supervision/patrol",adminB)).payload.checkpoints.length,0);
  assert.equal((await invoke("/api/supervision/patrol",adminB,"PATCH",{id:pointId,active:false})).status,404,"other tenant cannot disable point");
  assert.equal((await invoke("/api/agent/patrol",agentA,"POST",{code})).status,409,"cannot check in without an active shift");
  assert.equal((await invoke("/api/agent/patrol",agentB,"POST",{code})).status,404,"other tenant cannot use checkpoint token");
  const patrolStart=new Date(Date.now()+60000);
  patrolStart.setUTCSeconds(0,0);
  const patrolEnd=new Date(patrolStart.getTime()+50*60000);
  const patrolAssignment=await invoke("/api/supervision/assignments",adminA,"POST",{
    agentSub:"agent-alpha",siteId:siteA.id,title:"Ronde bâtiment alpha",
    startsAt:patrolStart.toISOString(),endsAt:patrolEnd.toISOString()
  });
  assert.equal(patrolAssignment.status,201,JSON.stringify(patrolAssignment.payload));
  const patrolId=patrolAssignment.payload.assignment.id;
  const dueAt=new Date(patrolStart.getTime()+60_000).toISOString();
  const scheduled=await invoke("/api/supervision/patrol/schedule",adminA,"POST",{
    assignmentId:patrolId,checkpointId:pointId,dueAt,graceMinutes:15
  });
  assert.equal(scheduled.status,201,JSON.stringify(scheduled.payload));
  const planId=scheduled.payload.plan.id;
  assert.equal((await invoke("/api/supervision/patrol/schedule",adminA,"POST",{
    assignmentId:patrolId,checkpointId:pointId,dueAt,graceMinutes:15
  })).status,409,"cannot double-plan a checkpoint for one assignment");
  assert.equal((await invoke("/api/supervision/patrol/schedule",agentA)).status,403,"agent cannot supervise patrol");
  assert.equal((await invoke("/api/supervision/patrol/schedule",adminB)).payload.plans.length,0,"supervisors isolated by tenant");
  assert.equal((await invoke("/api/supervision/patrol/schedule",adminB,"POST",{
    assignmentId:patrolId,checkpointId:pointId,dueAt,graceMinutes:15
  })).status,404,"cannot plan another tenant's assignment");
  assert.equal((await invoke("/api/agent/patrol/schedule",clientA)).status,403,"client cannot see staff patrol schedule");
  assert.equal((await invoke("/api/agent/patrol/schedule",agentB)).payload.plans.length,0,"other tenant agent cannot read schedule");
  assert.equal((await invoke("/api/agent/patrol/schedule",agentC)).payload.plans.length,0,"same tenant agent without assignment cannot see schedule");
  assert.equal((await invoke("/api/agent/patrol/schedule",agentA)).payload.plans.length,1);
  const missingPoint=await invoke("/api/supervision/patrol",adminA,"POST",{siteId:siteA.id,label:"Sortie arrière"});
  assert.equal(missingPoint.status,201);
  const missingPlan=await invoke("/api/supervision/patrol/schedule",adminA,"POST",{
    assignmentId:patrolId,checkpointId:missingPoint.payload.checkpoint.id,dueAt,graceMinutes:5
  });
  assert.equal(missingPlan.status,201);
  const cancelPoint=await invoke("/api/supervision/patrol",adminA,"POST",{siteId:siteA.id,label:"Contrôle à annuler"});
  assert.equal(cancelPoint.status,201);
  const cancellable=await invoke("/api/supervision/patrol/schedule",adminA,"POST",{
    assignmentId:patrolId,checkpointId:cancelPoint.payload.checkpoint.id,dueAt,graceMinutes:15
  });
  assert.equal(cancellable.status,201);
  const cancelledId=cancellable.payload.plan.id;
  assert.equal((await invoke("/api/supervision/patrol/schedule",adminB,"PATCH",{id:cancelledId,action:"cancel"})).status,404,"cross-tenant cancellation forbidden");
  assert.equal((await invoke("/api/supervision/patrol/schedule",adminA,"PATCH",{id:cancelledId,action:"cancel"})).status,200,"future patrol cancellation works");
  assert.equal((await invoke("/api/supervision/patrol/schedule",adminA,"PATCH",{id:cancelledId,action:"cancel"})).status,404,"double cancellation forbidden");

  // Exercise real clock-in and clock-out, then verify isolated time records.
  const loc={latitude:45.5,longitude:-73.6,accuracy:12};
  assert.equal((await invoke("/api/agent/shifts",agentA,"POST",{action:"start",consent:true,consentVersion:"2026-10-14",position:loc})).status,200);
  assert.equal((await invoke("/api/agent/patrol",clientA,"POST",{code})).status,403,"clients cannot perform patrols");
  const visit=await invoke("/api/agent/patrol",agentA,"POST",{code});
  assert.equal(visit.status,201,JSON.stringify(visit.payload));
  assert.equal(visit.payload.visit.label,"Entrée principale");
  const confirmed=await invoke("/api/supervision/patrol/schedule",adminA);
  const first=confirmed.payload.plans.find(p=>p.id===planId);
  assert.ok(first,JSON.stringify(confirmed.payload));
  assert.equal(first.display_status,"completed","same-tenant scheduled checkpoint is satisfied by valid scan");
  assert.equal((await invoke("/api/agent/patrol/schedule",agentA)).payload.plans.find(p=>p.id===planId)?.display_status,"completed");
  assert.equal(confirmed.payload.plans.find(p=>p.id===cancelledId)?.display_status,"cancelled");
  // In the disposable integration database only, simulate elapsed time so no real waits are required.
  await pool.query("UPDATE gs_patrol_schedule SET due_at=now()-interval '30 minutes' WHERE id=$1",[missingPlan.payload.plan.id]);
  const overdue=await invoke("/api/supervision/patrol/schedule",adminA);
  assert.equal(overdue.payload.plans.find(p=>p.id===missingPlan.payload.plan.id)?.display_status,"overdue","missing checkpoint must be flagged after grace period");
  assert.equal((await invoke("/api/agent/patrol/schedule",agentA)).payload.plans.find(p=>p.id===missingPlan.payload.plan.id)?.display_status,"overdue");
  assert.equal((await invoke("/api/supervision/patrol",adminA,"PATCH",{id:missingPoint.payload.checkpoint.id,active:false})).status,200);
  assert.equal((await invoke("/api/supervision/patrol/schedule",adminA)).payload.plans.find(p=>p.id===missingPlan.payload.plan.id)?.display_status,"suspended","inactive checkpoint must not trigger false overdue alert");
  assert.equal((await invoke("/api/supervision/patrol",adminA,"PATCH",{id:missingPoint.payload.checkpoint.id,active:true})).status,200);
  assert.equal((await invoke("/api/supervision/patrol/schedule",adminA)).payload.plans.find(p=>p.id===missingPlan.payload.plan.id)?.display_status,"overdue");


  assert.equal((await invoke("/api/agent/patrol",agentA,"POST",{code})).status,409,"one visit per checkpoint per shift");
  assert.equal((await invoke("/api/agent/patrol",agentB)).payload.visits.length,0,"other tenant's agent cannot see visit");
  assert.equal((await invoke("/api/supervision/patrol",adminB)).payload.visits.length,0,"other tenant supervisor cannot see visits");
  assert.equal((await invoke("/api/supervision/patrol",adminA)).payload.visits.length,1);
  assert.equal((await invoke("/api/supervision/patrol",adminA,"PATCH",{id:pointId,active:false})).status,200);
  assert.equal((await invoke("/api/agent/patrol",agentA,"POST",{code})).status,404,"disabled code rejected");
  assert.equal((await invoke("/api/supervision/patrol",adminA,"PATCH",{id:pointId,active:true})).status,200);

  assert.equal((await invoke("/api/agent/shifts",agentA,"POST",{action:"stop"})).status,200);
  const mine=await invoke("/api/agent/timesheets",agentA);
  assert.equal(mine.status,200,JSON.stringify(mine.payload));
  assert.equal(mine.payload.entries.length,1);
  assert.equal((await invoke("/api/agent/timesheets",agentB)).payload.entries.length,0,"other tenant cannot see timesheets");
  assert.equal((await invoke("/api/supervision/timesheets",clientA)).status,403,"client cannot export staff hours");
  const adminReport=await invoke("/api/supervision/timesheets",adminA);
  assert.equal(adminReport.status,200);
  assert.equal(adminReport.payload.entries.length,1);
  assert.equal((await invoke("/api/supervision/timesheets",adminB)).payload.entries.length,0,"tenant B cannot inspect tenant A hours");
  const shiftId=mine.payload.entries[0].id;
  assert.equal(mine.payload.entries[0].review_status,"unreviewed");
  assert.equal((await invoke("/api/supervision/timesheets/approval",agentA,"POST",{shiftId,action:"approve"})).status,403);
  assert.equal((await invoke("/api/supervision/timesheets/approval",adminB,"POST",{shiftId,action:"approve"})).status,404,"cross-tenant approval denied");
  assert.equal((await invoke("/api/supervision/timesheets/approval",adminA,"POST",{shiftId,action:"approve",note:"Vérifié en CI"})).status,200);
  assert.equal((await invoke("/api/supervision/timesheets/approval",adminA,"POST",{shiftId,action:"approve"})).status,409,"duplicate decision denied");
  assert.equal((await invoke("/api/agent/timesheets",agentA)).payload.entries[0].review_status,"approved");
  assert.equal((await invoke("/api/supervision/timesheets/approval",adminA,"POST",{shiftId,action:"revoke",note:"Correction demandée"})).status,200);
  assert.equal((await invoke("/api/agent/timesheets",agentA)).payload.entries[0].review_status,"revoked");
  const events=await pool.query("SELECT action,tenant_id FROM gs_shift_approval_events WHERE shift_id=$1 ORDER BY id",[shiftId]);
  assert.deepEqual(events.rows.map(e=>e.action),["approve","revoke"],"approval history is append-only");
  assert.ok(events.rows.every(e=>e.tenant_id==="tenant-a"));
  const csv=await fetch(base+"/api/supervision/timesheets?format=csv",{headers:{Cookie:adminA},signal:AbortSignal.timeout(10000)});
  assert.equal(csv.status,200);
  assert.match(csv.headers.get("content-type")||"",/text\/csv/);
  const content=await csv.text();
  assert.ok(content.includes("agent-alpha"));
  assert.ok(!content.includes("agent-beta"));
  assert.equal((await invoke("/api/supervision/timesheets?start=1900-01-01&end=2026-10-15",adminA)).status,400);
  // Authenticated service requests: own creator visibility and tenant-bound triage.
  const requestBody={
    service:"chantiers",title:"Surveillance de chantier",
    description:"Veuillez prévoir un agent pendant les travaux de rénovation de la bâtisse.",
    consent:true,tenantId:"forged-tenant"
  };
  assert.equal((await invoke("/api/client/requests",agentA,"POST",requestBody)).status,403);
  assert.equal((await invoke("/api/client/requests",clientA,"POST",{...requestBody,consent:false})).status,400);
  const submitted=await invoke("/api/client/requests",clientA,"POST",requestBody);
  assert.equal(submitted.status,201,JSON.stringify(submitted.payload));
  const requestId=submitted.payload.request.id;
  assert.equal((await invoke("/api/client/requests",clientA)).payload.requests.length,1);
  assert.equal((await invoke("/api/client/requests",clientB)).payload.requests.length,0,"tenant B cannot see A request");
  assert.equal((await invoke("/api/client/requests",clientC)).payload.requests.length,0,"other client in same tenant cannot see A request");
  assert.equal((await invoke("/api/supervision/requests",adminB)).payload.requests.length,0,"tenant B supervisor must not see A requests");
  assert.equal((await invoke("/api/supervision/requests",adminA)).payload.requests.length,1);
  assert.equal((await invoke("/api/supervision/requests",clientA)).status,403);
  assert.equal((await invoke("/api/supervision/requests",adminB,"PATCH",{id:requestId,action:"acknowledge"})).status,409,"cross-tenant update must fail");
  assert.equal((await invoke("/api/supervision/requests",adminA,"PATCH",{id:requestId,action:"close"})).status,409,"cannot close a request before acknowledgement");
  assert.equal((await invoke("/api/supervision/requests",adminA,"PATCH",{id:requestId,action:"acknowledge"})).status,200);
  assert.equal((await invoke("/api/supervision/requests",adminA,"PATCH",{id:requestId,action:"acknowledge"})).status,409,"no duplicate transitions");
  assert.equal((await invoke("/api/client/requests",clientA)).payload.requests[0].status,"acknowledged");
  assert.equal((await invoke("/api/supervision/requests",adminA,"PATCH",{id:requestId,action:"close"})).status,200);
  assert.equal((await invoke("/api/client/requests",clientA)).payload.requests[0].status,"closed");
  const requestEvents=await pool.query("SELECT action,tenant_id FROM gs_client_request_events WHERE request_id=$1 ORDER BY id",[requestId]);
  assert.deepEqual(requestEvents.rows.map(e=>e.action),["acknowledge","close"],"request lifecycle must be append-only");
  assert.ok(requestEvents.rows.every(e=>e.tenant_id==="tenant-a"));
  // Persistent quota: first request plus nine additional submissions is allowed,
  // but an eleventh request by the same TAKATAK identity is refused.
  for(let n=0;n<9;n++){
    const extra=await invoke("/api/client/requests",clientA,"POST",{...requestBody,title:"Demande supplémentaire "+n});
    assert.equal(extra.status,201,JSON.stringify(extra.payload));
  }
  assert.equal((await invoke("/api/client/requests",clientA,"POST",requestBody)).status,429,"durable 24h quota must reject request 11");
  // A second agent in the SAME tenant also needs an actual assignment at the checkpoint site.
  const gammaClock=await invoke("/api/agent/shifts",agentC,"POST",{action:"start",consent:true,consentVersion:"2026-10-14",position:loc});
  assert.equal(gammaClock.status,200,JSON.stringify(gammaClock.payload));
  assert.equal((await invoke("/api/agent/patrol",agentC,"POST",{code})).status,403,"same-tenant but unassigned agent must not scan");
  assert.equal((await invoke("/api/agent/shifts",agentC,"POST",{action:"stop"})).status,200);
  assert.equal((await invoke("/api/agent/patrol",agentA,"POST",{code})).status,409,"stopped shift cannot scan");
  const stored=await pool.query("SELECT code_digest FROM gs_patrol_checkpoints WHERE tenant_id=$1 AND id=$2",["tenant-a",pointId]);
  assert.equal(stored.rowCount,1);
  assert.notEqual(stored.rows[0].code_digest,code,"plaintext checkpoint secret must not be stored");
  assert.equal((await invoke("/api/supervision/patrol",adminB,"PATCH",{id:pointId,action:"rotate"})).status,404,"another tenant cannot rotate the marker");
  const rotated=await invoke("/api/supervision/patrol",adminA,"PATCH",{id:pointId,action:"rotate"});
  assert.equal(rotated.status,200,JSON.stringify(rotated.payload));
  const updatedCode=rotated.payload.code;
  assert.match(updatedCode,/^[A-Za-z0-9_-]{32}$/);
  assert.notEqual(updatedCode,code,"rotation must invalidate original marker");
  assert.equal((await invoke("/api/agent/patrol",agentA,"POST",{code})).status,404,"old code must be invalid after rotation");
  assert.equal((await invoke("/api/agent/patrol",agentA,"POST",{code:updatedCode})).status,409,"new code is recognized but stopped shift cannot visit");
  const postRotation=await invoke("/api/supervision/patrol",adminA);
  assert.equal(postRotation.payload.visits.length,1,"old visits must survive marker rotation");
  assert.ok(!JSON.stringify(postRotation.payload).includes(updatedCode),"rotated code must not be retrievable via GET");
  const auditRotation=await pool.query("SELECT 1 FROM gs_audit WHERE tenant_id=$1 AND action='patrol.checkpoint.rotate'",["tenant-a"]);
  assert.equal(auditRotation.rowCount,1,"rotation audited");

  console.log("Integration passed: roles, tenant isolation, assignments, patrol checkpoint scans, approval and client requests.");
}
try {await main();}
finally {
  if(server){server.kill("SIGTERM");await sleep(200);}
  await pool.end();
}
