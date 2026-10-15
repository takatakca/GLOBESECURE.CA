import test from "node:test";
import assert from "node:assert/strict";
import {issueCheckpointCode,checkpointDigest,parseCheckpoint,parseCheckpointToggle,parseCheckpointRotation,parseVisit} from "../lib/patrol.mjs";
const id="123e4567-e89b-42d3-a456-426614174000";
test("checkpoint bearer code is 192-bit random and only a digest is stored",()=>{
  const a=issueCheckpointCode(),b=issueCheckpointCode();
  assert.equal(a.length,32);assert.notEqual(a,b);
  assert.match(checkpointDigest(a),/^[a-f0-9]{64}$/);
  assert.notEqual(checkpointDigest(a),checkpointDigest(b));
  assert.equal(checkpointDigest("1234"),null);
});
test("checkpoint creation and lifecycle restrict input",()=>{
  assert.deepEqual(parseCheckpoint({siteId:id,label:" Porte principale "}),{siteId:id,label:"Porte principale"});
  assert.equal(parseCheckpoint({siteId:"fake",label:"Entrée"}),null);
  assert.equal(parseCheckpoint({siteId:id,label:"Ab\ncd"}),null);
  assert.deepEqual(parseCheckpointToggle({id,active:false}),{id,active:false});
  assert.equal(parseCheckpointToggle({id,active:"false"}),null);
});
test("a visit requires a valid random code",()=>{
  const code=issueCheckpointCode();
  assert.equal(parseVisit({code})?.digest,checkpointDigest(code));
  assert.equal(parseVisit({code:"EXAMPLE"}),null);
});

test("rotation requires explicit action with a valid checkpoint UUID",()=>{
  const id="123e4567-e89b-42d3-a456-426614174000";
  assert.deepEqual(parseCheckpointRotation({id,action:"rotate"}),{id});
  assert.equal(parseCheckpointRotation({id,action:"delete"}),null);
  assert.equal(parseCheckpointRotation({id:"other-tenant",action:"rotate"}),null);
});
