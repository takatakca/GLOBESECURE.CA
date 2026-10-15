// Isolated CI integration test. NEVER point this at a production database.
import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
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
  const conn=await pool.connect();
  try {
    for(let n=1;n<=9;n++) {
      const file="db/migrations/"+String(n).padStart(3,"0")+
        ["_init.sql","_incidents.sql","_tracking_consent.sql","_client_reports.sql","_assignments.sql","_shift_approvals.sql","_sites.sql","_assignment_changes.sql","_client_requests.sql"][n-1];
      await conn.query(await readFile(file,"utf8"));
      console.log("Applied "+file);
    }
  } finally {conn.release();}
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
  // Exercise real clock-in and clock-out, then verify isolated time records.
  const loc={latitude:45.5,longitude:-73.6,accuracy:12};
  assert.equal((await invoke("/api/agent/shifts",agentA,"POST",{action:"start",consent:true,consentVersion:"2026-10-14",position:loc})).status,200);
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
  console.log("Integration passed: auth roles, tenant isolation, assignments, pointage, approval and client service requests.");
}
try {await main();}
finally {
  if(server){server.kill("SIGTERM");await sleep(200);}
  await pool.end();
}
