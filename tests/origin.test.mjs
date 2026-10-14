import test from "node:test";
import assert from "node:assert/strict";
import { trustedOrigin } from "../lib/origin.mjs";
test("matches real production public origin behind reverse proxies", () => assert.equal(trustedOrigin("https://globesecure.ca", "https://globesecure.ca"), true));
test("rejects foreign origin, suffix attack, missing origin", () => { for(const value of ["https://evil.ca", "https://globesecure.ca.evil.ca", null, "null"]) assert.equal(trustedOrigin(value, "https://globesecure.ca"), false); });
test("allows localhost in development only", () => { assert.equal(trustedOrigin("http://localhost:3000","https://globesecure.ca",true), true); assert.equal(trustedOrigin("http://localhost:3000","https://globesecure.ca",false), false); });
