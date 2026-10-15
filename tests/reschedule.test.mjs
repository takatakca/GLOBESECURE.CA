import test from "node:test";
import assert from "node:assert/strict";
import {parseReschedule} from "../lib/reschedule.mjs";
const valid={assignmentId:"123e4567-e89b-42d3-a456-426614174000",agentSub:"agent-1",title:"Protection de nuit",siteId:"123e4567-e89b-42d3-a456-426614174001",startsAt:"2026-10-16T18:00:00Z",endsAt:"2026-10-17T02:00:00Z"};
const now=Date.parse("2026-10-15T12:00:00Z");
test("rescheduling validates ID, site and date boundaries",()=>{
  assert.equal(parseReschedule(valid,now)?.assignmentId,valid.assignmentId);
  assert.equal(parseReschedule({...valid,assignmentId:"another-tenant"},now),null);
  assert.equal(parseReschedule({...valid,siteId:"invalid"},now),null);
  assert.equal(parseReschedule({...valid,endsAt:"2026-10-19T02:00:00Z"},now),null);
});
