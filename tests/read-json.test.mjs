import test from "node:test";
import assert from "node:assert/strict";
import { readJsonBody, BodyInputError, bodyFailure } from "../lib/read-json.mjs";
const make = (body, headers = {}) => new Request("https://globesecure.ca/api/contact", { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body });
test("accepts valid bounded JSON objects", async () => {
  assert.deepEqual(await readJsonBody(make('{"name":"GlobeSecure"}')), { name: "GlobeSecure" });
});
test("rejects invalid and array-only JSON", async () => {
  await assert.rejects(() => readJsonBody(make("not-json")), BodyInputError);
  await assert.rejects(() => readJsonBody(make("[1,2,3]")), BodyInputError);
});
test("rejects a declared large body", async () => {
  await assert.rejects(() => readJsonBody(make('{"text":"large"}', { "Content-Length": "100000" })), (error) => error.status === 413);
});
test("rejects large streamed body without content-length", async () => {
  const stream = new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('{"data":"'+ "a".repeat(20000) +'"}')); controller.close(); } });
  const request = new Request("https://globesecure.ca/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: stream, duplex: "half" });
  await assert.rejects(() => readJsonBody(request), (error) => error.status === 413);
});
test("rejects unexpected MIME type", async () => {
  await assert.rejects(() => readJsonBody(make("x", { "Content-Type": "text/plain" })), (error) => error.status === 415);
});
test("maps client errors without revealing implementation details", () => {
  assert.deepEqual(bodyFailure(new BodyInputError("too big", 413)), { message: "too big", status: 413 });
});
