export function validPublication(input) {
  if (!input || typeof input !== "object") return null;
  const incidentId = input.incidentId;
  const title = typeof input.title === "string" ? input.title.trim() : "";
  const body = typeof input.body === "string" ? input.body.trim() : "";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(incidentId || "")) return null;
  if (title.length < 5 || title.length > 140 || body.length < 40 || body.length > 5000 || input.reviewed !== true) return null;
  return { incidentId, title, body };
}
