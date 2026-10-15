import test from "node:test";
import assert from "node:assert/strict";
import {validateClientRequest,validateRequestDecision} from "../lib/client-requests.mjs";
const good={service:"chantiers",title:"Protection du chantier",description:"Besoin de surveillance pendant un chantier de plusieurs jours.",consent:true};
test("validates consented client requests without browser-controlled tenancy",()=>{
  assert.deepEqual(validateClientRequest({...good,tenantId:"other-tenant"}),{
    service:good.service,title:good.title,description:good.description
  });
  assert.equal(validateClientRequest({...good,consent:false}),null);
  assert.equal(validateClientRequest({...good,service:"not-a-real-service"}),null);
  assert.equal(validateClientRequest({...good,description:"trop bref"}),null);
});
test("accepts only valid explicit supervisor workflow transitions",()=>{
  const id="123e4567-e89b-42d3-a456-426614174000";
  assert.equal(validateRequestDecision({id,action:"acknowledge"})?.from,"submitted");
  assert.equal(validateRequestDecision({id,action:"close"})?.status,"closed");
  assert.equal(validateRequestDecision({id,action:"delete"}),null);
  assert.equal(validateRequestDecision({id:"../other",action:"close"}),null);
  assert.equal(validateRequestDecision({id,action:"close",note:"x".repeat(501)}),null);
});
