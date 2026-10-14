import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const source = JSON.parse(readFileSync(new URL("../content/live-site/inventory.json", import.meta.url), "utf8"));
const homepage = source.pages?.find((page) => page.url === "https://globesecure.ca/");
test("canonical snapshot retains long-form source rather than headings only", () => {
  assert.ok(homepage, "Original site page is absent");
  assert.ok(homepage.text.length >= 3000, "Archived site text was lost or truncated");
  for (const text of ["EVENT SECURITY","CONSTRUCTION SITE SURVEILLANCE","HOSPITAL SECURITY","CORPORATE SECURITY","RETAIL SECURITY","ALARM RESPONSE","Listening","Professionalism","Integrity","Precision"]) {
    assert.ok(homepage.text.includes(text), "Missing original source detail: " + text);
  }
});
test("all nine original public images remain mapped", () => {
  assert.equal(source.source, "https://globesecure.ca/");
  const images = ["logo.jpeg","globe1.jpeg","globe2.jpeg","event-security.jpeg","contruction.jpeg","hospital.jpeg","corporate.jpeg","retail.jpeg","alarm.jpeg"];
  for (const image of images) assert.ok(homepage.assets.includes("/" + image), "Missing original asset " + image);
});
test("stored data contains no anti-bot challenge", () => {
  assert.doesNotMatch(homepage.title,/one moment|just a moment/i);
  assert.doesNotMatch(homepage.text.slice(0,250),/checking your browser|challenge-platform/i);
});
