const services = new Set(["evenementiel", "sante", "entreprises", "chantiers", "autre"]);
const clean = (value) => typeof value === "string" ? value.trim() : "";
export function validateContact(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return { ok: false, error: "Données invalides." };
  if (clean(input.website)) return { ok: false, error: "Demande rejetée." };
  const name = clean(input.name);
  const email = clean(input.email);
  const organization = clean(input.organization);
  const phone = clean(input.phone);
  const service = clean(input.service);
  const message = clean(input.message);
  if (name.length < 2 || name.length > 100) return { ok: false, error: "Nom invalide." };
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "Courriel invalide." };
  if (organization.length > 120 || phone.length > 35) return { ok: false, error: "Coordonnées invalides." };
  if (!services.has(service)) return { ok: false, error: "Service invalide." };
  if (message.length < 15 || message.length > 3000) return { ok: false, error: "Veuillez préciser votre demande (15 à 3000 caractères)." };
  if (input.consent !== true) return { ok: false, error: "Consentement requis." };
  return { ok: true, data: { name, email, organization, phone, service, message } };
}
export function redactLogValue(input) {
  return typeof input === "string" ? input.replace(/[\r\n\t]/g, " ").slice(0, 120) : "";
}
