import test from "node:test";
import assert from "node:assert/strict";
import { normalizedUrl, extractPublicPage } from "../scripts/inventory-site.mjs";
test("public domain scope excludes admin and external URLs", ()=>{
  assert.equal(normalizedUrl("/services"),"https://globesecure.ca/services");
  assert.equal(normalizedUrl("https://www.globesecure.ca/equipe?tracking=1"),"https://globesecure.ca/equipe");
  assert.equal(normalizedUrl("https://elsewhere.ca/"),null);
  assert.equal(normalizedUrl("/wp-admin/dashboard"),null);
  assert.equal(normalizedUrl("/img/logo.png"),null);
});
test("extract visible page text and links",()=>{
  const html='<html><head><title>Globe Secure</title></head><body><h1>Notre mission</h1><p>Sécurité &amp; surveillance</p><script>private info</script><a href="/equipe">Équipe</a><a href="https://other.ca">autre</a></body></html>';
  const x=extractPublicPage(html,"https://globesecure.ca/");
  assert.equal(x.title,"Globe Secure");
  assert.equal(x.headings[0].text,"Notre mission");
  assert.ok(x.text.includes("Sécurité & surveillance"));
  assert.ok(!x.text.includes("private info"));
  assert.deepEqual(x.internalLinks,["https://globesecure.ca/equipe"]);
});
