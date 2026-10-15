import test from "node:test";
import assert from "node:assert/strict";
import { timesheetPeriod,csvCell,exportTimesheets } from "../lib/timesheets.mjs";
const now=Date.parse("2026-10-15T12:00:00Z");
test("accepts bounded UTC day range",()=>{
  const p=timesheetPeriod("2026-10-01","2026-10-15",now);
  assert.equal(p.start,"2026-10-01T00:00:00.000Z");
  assert.equal(p.until,"2026-10-16T00:00:00.000Z");
});
test("refuses malformed and overly long ranges",()=>{
  for(const [start,end] of [["2026-02-31","2026-03-01"],["2026-01-01","2026-10-01"],["2026-10-16","2026-10-15"],["2026/10/01","2026-10-15"]])
    assert.equal(timesheetPeriod(start,end,now),null);
});
test("escapes spreadsheet injection, quotes and line breaks",()=>{
  assert.equal(csvCell("=HYPERLINK(1)"),'"\'=HYPERLINK(1)"');
  assert.equal(csvCell('a"b'),'"a""b"');
  const file=exportTimesheets([{agent_sub:"+cmd",started_at:"now",stopped_at:"later",hours:2.5}]);
  assert.ok(file.startsWith("\uFEFF"));
  assert.ok(file.includes('"\'+cmd"'));
});
