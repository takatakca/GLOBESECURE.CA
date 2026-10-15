import test from "node:test";
import assert from "node:assert/strict";
import { parseApproval } from "../lib/approval.mjs";
const valid={shiftId:"123e4567-e89b-42d3-a456-426614174000",action:"approve",note:"Pointages vérifiés"};
test("accepts explicit approval and reversal",()=>{
  assert.equal(parseApproval(valid)?.status,"approved");
  assert.equal(parseApproval({...valid,action:"revoke"})?.status,"revoked");
});
test("rejects invalid actions and unbounded notes",()=>{
  for(const item of [{...valid,action:"edit-hours"},{...valid,shiftId:"not-uuid"},{...valid,note:"x".repeat(501)}])
    assert.equal(parseApproval(item),null);
});
