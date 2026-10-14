import test from "node:test";
import assert from "node:assert/strict";
import { validPublication } from "../lib/reports.mjs";
const report = { incidentId: "123e4567-e89b-42d3-a456-426614174000", title: "Rapport du 14 octobre", body: "Compte rendu revu sans données personnelles et validé pour la publication.", reviewed: true };
test("allows only explicitly reviewed tenant report payload", () => assert.equal(validPublication(report)?.title, report.title));
test("requires reviewed flag", () => assert.equal(validPublication({ ...report, reviewed: false }), null));
test("rejects invalid incident identifier", () => assert.equal(validPublication({ ...report, incidentId: "not-a-uuid" }), null));
test("rejects too-short report", () => assert.equal(validPublication({ ...report, body: "Court" }), null));
