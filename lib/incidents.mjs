export const categories = ["access", "safety", "property", "medical", "other"];
export function validIncident(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const category = typeof raw.category === "string" ? raw.category : "";
  const summary = typeof raw.summary === "string" ? raw.summary.trim() : "";
  if (!categories.includes(category) || summary.length < 20 || summary.length > 4000) return null;
  return { category, summary };
}
