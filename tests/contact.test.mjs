import test from "node:test";
import assert from "node:assert/strict";
import { validateContact } from "../lib/contact.mjs";
const valid = { name: "Marie Tremblay", email: "marie@example.ca", organization: "Exemple", phone: "514-555-5555", service: "evenementiel", message: "Besoin de surveillance pour notre événement.", consent: true, website: "" };
test("accepts valid request and trims its fields", () => {
  const result = validateContact({ ...valid, name: "  Marie Tremblay  " });
  assert.equal(result.ok, true);
  assert.equal(result.data.name, "Marie Tremblay");
});
test("rejects missing consent", () => assert.equal(validateContact({ ...valid, consent: false }).ok, false));
test("rejects invalid service", () => assert.equal(validateContact({ ...valid, service: "inconnu" }).ok, false));
test("rejects honeypot submissions", () => assert.equal(validateContact({ ...valid, website: "https://spam.test" }).ok, false));
test("rejects too short messages", () => assert.equal(validateContact({ ...valid, message: "Bonjour" }).ok, false));
test("rejects bad emails", () => assert.equal(validateContact({ ...valid, email: "bad" }).ok, false));
test("rejects missing object", () => assert.equal(validateContact(null).ok, false));
