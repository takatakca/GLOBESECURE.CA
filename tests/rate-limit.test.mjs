import test from "node:test";
import assert from "node:assert/strict";
import { requestThrottle } from "../lib/rate-limit.mjs";
const make = (ip) => ({ headers: new Headers({ "x-real-ip": ip }) });
test("untrusted proxy headers do not bypass limits", () => {
  delete process.env.GLOBESECURE_TRUST_PROXY_HEADERS;
  for (let n = 0; n < 30; n++) assert.equal(requestThrottle(make("203.0.113." + n), "test-untrusted", 1000), false);
  assert.equal(requestThrottle(make("198.51.100.4"), "test-untrusted", 1000), true);
});
test("trusted proxy IP is isolated and window resets", () => {
  process.env.GLOBESECURE_TRUST_PROXY_HEADERS = "true";
  try {
    for (let n=0; n<5; n++) assert.equal(requestThrottle(make("203.0.113.55"),"test-trusted", 1000), false);
    assert.equal(requestThrottle(make("203.0.113.55"),"test-trusted",1000), true);
    assert.equal(requestThrottle(make("198.51.100.66"),"test-trusted",1000), false);
    assert.equal(requestThrottle(make("203.0.113.55"),"test-trusted", 601001), false);
  } finally { delete process.env.GLOBESECURE_TRUST_PROXY_HEADERS; }
});
