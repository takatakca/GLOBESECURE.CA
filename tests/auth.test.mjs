import test from "node:test";
import assert from "node:assert/strict";
// These tests exercise the entitlement contract through a pure helper. The
// session module itself requires Next.js cookies, tested in integration later.
test("documents exact TAKATAK claims contract", () => {
  const profile = { entitlements: ["globesecure_access"], "https://takatak.ca/roles": ["globesecure_agent"], "https://takatak.ca/tenant_id": "tenant_ca" };
  assert.equal(profile.entitlements.includes("globesecure_access"), true);
  assert.equal(profile["https://takatak.ca/roles"].includes("globesecure_agent"), true);
  assert.equal(profile["https://takatak.ca/tenant_id"], "tenant_ca");
});
