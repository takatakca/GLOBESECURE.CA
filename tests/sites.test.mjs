import test from "node:test";
import assert from "node:assert/strict";
import {parseSite,parseSiteChange,validSiteId} from "../lib/sites.mjs";
const id="123e4567-e89b-42d3-a456-426614174000";
test("accepts only bounded site names",()=>{
  assert.deepEqual(parseSite({name:" Édifice Alpha ",city:" Montréal "}),{name:"Édifice Alpha",city:"Montréal"});
  assert.equal(parseSite({name:"  ",city:""}),null);
  assert.equal(parseSite({name:"B".repeat(141)}),null);
  assert.equal(parseSite({name:"Site\nInjection"}),null);
  assert.equal(parseSite({name:"Édifice",city:"B".repeat(121)}),null);
});
test("site lifecycle requires explicit boolean and UUID",()=>{
  assert.equal(validSiteId(id),true);
  assert.deepEqual(parseSiteChange({id,action:"setActive",active:false}),{id,active:false});
  assert.equal(parseSiteChange({id,action:"delete",active:false}),null);
  assert.equal(parseSiteChange({id,action:"setActive",active:"false"}),null);
  assert.equal(parseSiteChange({id:"../escape",action:"setActive",active:true}),null);
});
