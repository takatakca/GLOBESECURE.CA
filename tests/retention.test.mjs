import test from "node:test";
import assert from "node:assert/strict";
import { retentionDays } from "../lib/retention.mjs";
test("accepts a configured retention within bounds", () => { assert.equal(retentionDays("30"),30); assert.equal(retentionDays("365"),365); });
test("refuses missing and unsafe retention", () => { for (const value of ["", "0", "-1", "366", "12.5", "foo", null]) assert.equal(retentionDays(value),null); });
