import test from "node:test";
import assert from "node:assert/strict";
import { validIncident } from "../lib/incidents.mjs";
test("accepts a structured incident", () => assert.deepEqual(validIncident({ category: "access", summary: "Accès temporairement bloqué pendant l'événement." }), { category: "access", summary: "Accès temporairement bloqué pendant l'événement." }));
test("rejects unapproved categories", () => assert.equal(validIncident({ category: "other_sql", summary: "Accès temporairement bloqué pendant l'événement." }), null));
test("rejects empty and excessive incident", () => { assert.equal(validIncident({ category: "access", summary: "Court" }), null); assert.equal(validIncident({ category: "access", summary: "x".repeat(4001) }), null); });
