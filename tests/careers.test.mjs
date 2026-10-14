import test from "node:test";
import assert from "node:assert/strict";
import { validateCareer } from "../lib/careers.mjs";
const base = { name: "Camille Exemple", email: "camille@example.ca", city: "Montréal", interest: "agent", message: "Je souhaite être contacté pour des possibilités de travail.", consent: true, website: "" };
test("validates a small recruitment enquiry", () => assert.equal(validateCareer(base).ok, true));
test("rejects absent consent and spam", () => {
  assert.equal(validateCareer({...base,consent:false}).ok,false);
  assert.equal(validateCareer({...base,website:"spam"}).ok,false);
});
test("rejects unsupported interests and too-short messages", () => {
  assert.equal(validateCareer({...base,interest:"admin"}).ok,false);
  assert.equal(validateCareer({...base,message:"Hi"}).ok,false);
});
