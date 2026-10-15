import test from "node:test";
import assert from "node:assert/strict";
import { hasRole } from "../lib/roles.mjs";
test("only explicit entitlements of the matching role render the appropriate portal",()=>{
  assert.equal(hasRole({roles:["globesecure_agent"]},"globesecure_agent"),true);
  assert.equal(hasRole({roles:["globesecure_admin"]},"globesecure_agent"),false);
  assert.equal(hasRole({roles:["globesecure_admin"]},"globesecure_supervisor"),false);
  assert.equal(hasRole({roles:["globesecure_supervisor"]},"globesecure_agent"),false);
  assert.equal(hasRole(null,"globesecure_agent"),false);
});
