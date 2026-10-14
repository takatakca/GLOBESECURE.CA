import assert from "node:assert/strict";
const base = (process.env.BASE_URL || "http://127.0.0.1:3077").replace(/\/$/, "");
const expected = process.env.EXPECTED_SHA;
async function fetchChecked(path, status = 200, options = {}) {
  const response = await fetch(base + path, { redirect: "manual", signal: AbortSignal.timeout(8000), ...options });
  assert.equal(response.status, status, path + ": wrong status");
  console.log(status + " " + path);
  return response;
}
const health = await (await fetchChecked("/api/health")).json();
assert.equal(health.service, "globesecure-web");
assert.equal(health.ok, true);
if (expected) assert.equal(health.release, expected, "Compiled SHA mismatch");
const pages = ["/", "/services", "/services/evenementiel", "/services/chantiers", "/services/sante", "/services/entreprises", "/services/commerces", "/services/alarmes", "/contact", "/carrieres", "/soumission", "/confidentialite", "/portail"];
for (const page of pages) {
  const response = await fetchChecked(page);
  assert.match(response.headers.get("content-type") || "", /html/i, page);
  const html = await response.text();
  assert.ok(html.includes("GlobeSecure") || html.includes("GLOBESECURE"), page + " missing brand");
}
const denied = ["/api/agent/shifts", "/api/client/reports", "/api/supervision/active"];
for (const route of denied) await fetchChecked(route, 403);
await fetchChecked("/api/auth/login", 503);
for (const route of ["/api/contact", "/api/careers"]) {
  await fetchChecked(route, 503, { method: "POST", headers: { origin: process.env.CANONICAL_ORIGIN || "https://globesecure.ca", "Content-Type": "application/json" }, body: "{}" });
}
const robots = await (await fetchChecked("/robots.txt")).text();
assert.match(robots, /Disallow: \/agent/);
assert.match(robots, /Disallow: \/client/);
const sitemap = await (await fetchChecked("/sitemap.xml")).text();
assert.match(sitemap, /services\/alarmes/);
assert.doesNotMatch(sitemap, /<loc>[^<]*\/(agent|client|supervision|portail)<\/loc>/);
console.log("All public pages and fail-closed API checks passed.");
