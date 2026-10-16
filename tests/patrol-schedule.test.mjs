import test from "node:test";
import assert from "node:assert/strict";
import {parsePatrolSchedule,parsePatrolCancellation,patrolDueStatus,exportPatrolReport} from "../lib/patrol-schedule.mjs";
const now=Date.parse("2026-10-15T12:00:00Z");
const assignmentId="123e4567-e89b-42d3-a456-426614174000";
const checkpointId="123e4567-e89b-42d3-a456-426614174001";
const good={assignmentId,checkpointId,dueAt:"2026-10-15T14:00:00Z",graceMinutes:20};
test("bounded patrol schedules require explicit assignment, checkpoint, timezone and grace",()=>{
  assert.equal(parsePatrolSchedule(good,now)?.graceMinutes,20);
  for(const item of [
    {...good,dueAt:"2026-10-15T14:00:00"},
    {...good,dueAt:"2026-02-31T14:00:00Z"},
    {...good,assignmentId:"other-tenant"},
    {...good,graceMinutes:121},
    {...good,graceMinutes:"20"},
    {...good,dueAt:"2026-10-13T12:00:00Z"},
  ])assert.equal(parsePatrolSchedule(item,now),null);
});
test("schedule statuses distinguish due, overdue, completed and cancelled",()=>{
  const base={due_at:"2026-10-15T14:00:00Z",grace_minutes:15,status:"scheduled",visit_at:null};
  assert.equal(patrolDueStatus(base,now),"upcoming");
  assert.equal(patrolDueStatus(base,Date.parse("2026-10-15T13:55:00Z")),"due");
  assert.equal(patrolDueStatus(base,Date.parse("2026-10-15T14:16:00Z")),"overdue");
  assert.equal(patrolDueStatus({...base,visit_at:"2026-10-15T14:02:00Z"},now),"completed");
  assert.equal(patrolDueStatus({...base,status:"cancelled"}),"cancelled");
  assert.equal(patrolDueStatus({...base,assignment_status:"cancelled"}),"cancelled");
  assert.equal(patrolDueStatus({...base,checkpoint_active:false},Date.parse("2026-10-15T14:30:00Z")),"suspended");
  assert.equal(patrolDueStatus({...base,site_active:false},Date.parse("2026-10-15T14:30:00Z")),"suspended");
  assert.equal(patrolDueStatus({...base,visit_at:"2026-10-15T14:02:00Z",checkpoint_active:false}),"completed");
});
test("cancellation rejects unexpected actions and IDs",()=>{
  assert.deepEqual(parsePatrolCancellation({id:assignmentId,action:"cancel"}),{id:assignmentId});
  assert.equal(parsePatrolCancellation({id:"/other",action:"cancel"}),null);
  assert.equal(parsePatrolCancellation({id:assignmentId,action:"delete"}),null);
});

test("CSV report escapes formula injection, quotes and contains explicit current state",()=>{
  const csv=exportPatrolReport([{site_name:"=HYPERLINK(1)",checkpoint_label:'Porte "A"',assignment_title:"Ronde",agent_sub:"agent-x",due_at:new Date(now),grace_minutes:15,display_status:"overdue",visit_at:null}]);
  assert.ok(csv.startsWith("\uFEFF"));
  assert.ok(csv.includes('"\'=HYPERLINK(1)"'));
  assert.ok(csv.includes('"Porte ""A"""'));
  assert.ok(csv.includes('"overdue"'));
  assert.ok(!csv.includes("undefined"));
});
