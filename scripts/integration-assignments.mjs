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
    for(let n=1;n<=5;n++) {
      const file="db/migrations/"+String(n).padStart(3,"0")+
        ["_init.sql","_incidents.sql","_tracking_consent.sql","_client_reports.sql","_assignments.sql"][n-1];
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
  assert.equal((await invoke("/api/supervision/assignments",agentA)).status,403,"agents cannot supervise");
  assert.equal((await invoke("/api/agent/roster",agentA,"POST")).status,200,"agent A registers");
  assert.equal((await invoke("/api/agent/roster",agentB,"POST")).status,200,"agent B registers");
  const roster=await invoke("/api/supervision/assignments",adminA);
  assert.equal(roster.status,200);
  assert.deepEqual(roster.payload.roster.map(x=>x.agent_sub),["agent-alpha"],"must not leak other tenant roster");
  const begins=new Date(Date.now()+2*3600_000);
  begins.setUTCSeconds(0,0);
  const ends=new Date(begins.getTime()+6*3600_000);
  const payload={agentSub:"agent-alpha",title:"Sécurité du bâtiment",siteLabel:"Site de test A",startsAt:begins.toISOString(),endsAt:ends.toISOString()};
  assert.equal((await invoke("/api/supervision/assignments",adminB,"POST",payload)).status,404,"cross-tenant agent cannot be assigned");
  const created=await invoke("/api/supervision/assignments",adminA,"POST",payload);
  assert.equal(created.status,201,JSON.stringify(created.payload));
  assert.equal((await invoke("/api/supervision/assignments",adminA,"POST",payload)).status,409,"overlapping hours denied");
  assert.equal((await invoke("/api/agent/assignments",clientA)).status,403,"client cannot see agent private schedules");
  const assigned=await invoke("/api/agent/assignments",agentA);
  assert.equal(assigned.status,200);
  assert.equal(assigned.payload.assignments.length,1);
  assert.equal((await invoke("/api/agent/assignments",agentB)).payload.assignments.length,0,"agent B cannot see agent A");
  const id=created.payload.assignment.id;
  assert.equal((await invoke("/api/supervision/assignments",adminB,"PATCH",{id,action:"cancel"})).status,404,"cross-tenant cancellation denied");
  assert.equal((await invoke("/api/supervision/assignments",adminA,"PATCH",{id,action:"cancel"})).status,200);
  assert.equal((await invoke("/api/agent/assignments",agentA)).payload.assignments[0].status,"cancelled");
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
  const csv=await fetch(base+"/api/supervision/timesheets?format=csv",{headers:{Cookie:adminA},signal:AbortSignal.timeout(10000)});
  assert.equal(csv.status,200);
  assert.match(csv.headers.get("content-type")||"",/text\/csv/);
  const content=await csv.text();
  assert.ok(content.includes("agent-alpha"));
  assert.ok(!content.includes("agent-beta"));
  assert.equal((await invoke("/api/supervision/timesheets?start=1900-01-01&end=2026-10-15",adminA)).status,400);
  console.log("Integration passed: auth roles, tenant isolation, assignments, pointage and safe export.");
}
try {await main();}
finally {
  if(server){server.kill("SIGTERM");await sleep(200);}
  await pool.end();
}
