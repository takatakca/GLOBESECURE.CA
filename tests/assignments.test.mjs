import test from "node:test";
import assert from "node:assert/strict";
import { parseAssignment, validAssignmentId } from "../lib/assignments.mjs";
const now = Date.parse("2026-10-15T10:00:00Z");
const good = {agentSub:"takatak-agent-01", title:"Surveillance d'accueil", siteLabel:"Établissement A", startsAt:"2026-10-15T12:00:00Z", endsAt:"2026-10-15T20:00:00Z"};
test("accepts future bounded schedules with explicit timezone",()=>assert.equal(parseAssignment(good,now)?.agentSub,good.agentSub));
test("rejects invalid, absent or forged timing",()=>{
  for(const input of [
    {...good,startsAt:"2026-10-15T12:00:00"},
    {...good,startsAt:"2026-10-15T12:00:00Z",endsAt:"2026-10-16T12:00:00Z"},
    {...good,startsAt:"2026-10-14T12:00:00Z"},
    {...good,startsAt:"2026-02-31T12:00:00Z"},
    {...good,agentSub:""},
    {...good,title:"bad"}
  ]) assert.equal(parseAssignment(input,now),null);
});
test("cancellation requires valid UUID",()=>{
  assert.ok(validAssignmentId("123e4567-e89b-42d3-a456-426614174000"));
  assert.equal(validAssignmentId("../other-tenant"),false);
});
