import test from "node:test";
import assert from "node:assert/strict";
import { positionInput, startInput, stopInput, CONSENT_VERSION } from "../lib/shifts.mjs";
const position = { latitude: 45.5, longitude: -73.6, accuracy: 12 };
test("accepts bounded real geolocation", () => assert.deepEqual(positionInput(position), position));
test("blocks invalid location", () => {
  for (const value of [null, { ...position, latitude: 91 }, { ...position, longitude: -200 }, { ...position, accuracy: -1 }, { ...position, accuracy: "12" }]) assert.equal(positionInput(value), null);
});
test("requires explicit consent and version to start", () => {
  assert.equal(startInput({ action: "start", position, consent: true, consentVersion: CONSENT_VERSION }), true);
  assert.equal(startInput({ action: "start", position, consent: false, consentVersion: CONSENT_VERSION }), false);
  assert.equal(startInput({ action: "start", position, consent: true, consentVersion: "old" }), false);
});
test("allows stopping even if location was denied", () => assert.equal(stopInput({ action: "stop" }), true));
test("disallows bad stop payload", () => assert.equal(stopInput({ action: "stop", position: { latitude: 180 } }), false));
