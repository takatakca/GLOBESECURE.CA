const interests = new Set(["agent","supervision","operations","other"]);
export function validateCareer(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return { ok: false, error: "Demande invalide." };
  if (typeof input.website === "string" && input.website.trim()) return { ok: false, error: "Demande refusée." };
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const email = typeof input.email === "string" ? input.email.trim() : "";
  const city = typeof input.city === "string" ? input.city.trim() : "";
  const interest = typeof input.interest === "string" ? input.interest : "";
  const message = typeof input.message === "string" ? input.message.trim() : "";
  if (name.length < 2 || name.length > 100 || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "Nom ou courriel invalide." };
  if (city.length > 120 || !interests.has(interest)) return { ok: false, error: "Ville ou intérêt invalide." };
  if (message.length < 20 || message.length > 2000 || input.consent !== true) return { ok: false, error: "Message ou consentement invalide." };
  return { ok: true, data: { name, email, city, interest, message } };
}
