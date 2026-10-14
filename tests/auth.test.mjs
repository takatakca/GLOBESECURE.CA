import test from "node:test";
import assert from "node:assert/strict";
import { accessFromClaims } from "../lib/claims.mjs";
const claims = { sub: "takatak-person-10", entitlements: ["globesecure_access"], "https://takatak.ca/roles": ["globesecure_agent"], "https://takatak.ca/tenant_id": "tenant_ca" };
test("accepts explicit GlobeSecure access for one tenant", () => {
  assert.deepEqual(accessFromClaims(claims), { sub: claims.sub, tenant: "tenant_ca", roles: ["globesecure_agent"], name: "" });
});
test("rejects absent entitlement", () => assert.equal(accessFromClaims({ ...claims, entitlements: [] }), null));
test("rejects mismatched role", () => assert.equal(accessFromClaims({ ...claims, "https://takatak.ca/roles": ["takatak_superadmin"] }), null));
test("rejects missing tenant", () => assert.equal(accessFromClaims({ ...claims, "https://takatak.ca/tenant_id": null }), null));
test("rejects malformed subject", () => assert.equal(accessFromClaims({ ...claims, sub: "" }), null));
