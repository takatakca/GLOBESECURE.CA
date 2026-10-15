export const MAX_SHIFT_HOURS = 16;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const iso = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/;
export function parseAssignment(input, now = Date.now()) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const agentSub = typeof input.agentSub === "string" ? input.agentSub.trim() : "";
  const title = typeof input.title === "string" ? input.title.trim() : "";
  const siteLabel = typeof input.siteLabel === "string" ? input.siteLabel.trim() : "";
  if (!agentSub || agentSub.length > 200 || title.length < 5 || title.length > 140 || siteLabel.length < 3 || siteLabel.length > 180) return null;
  if (!iso.test(input.startsAt || "") || !iso.test(input.endsAt || "")) return null;
  const starts = Date.parse(input.startsAt), ends = Date.parse(input.endsAt);
  if (!Number.isFinite(starts) || !Number.isFinite(ends)) return null;
  // Guard invalid calendar timestamps (e.g. February 31) by requiring a
  // round-trip for explicit UTC entries, and never relying on browser timezone.
  for (const [raw, epoch] of [[input.startsAt,starts],[input.endsAt,ends]]) {
    if (raw.endsWith("Z") && raw.slice(0,16) !== new Date(epoch).toISOString().slice(0,16)) return null;
  }
  if (starts < now - 5 * 60_000 || starts > now + 120 * 86400_000 || ends <= starts || ends - starts > MAX_SHIFT_HOURS * 3600_000) return null;
  return { agentSub, title, siteLabel, startsAt: new Date(starts).toISOString(), endsAt: new Date(ends).toISOString() };
}
export function validAssignmentId(input) {
  return typeof input === "string" && uuid.test(input);
}
