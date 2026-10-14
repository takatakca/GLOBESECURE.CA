import { isIP } from "node:net";
const entries = new Map();
const WINDOW = 10 * 60 * 1000;
export function requestThrottle(request, scope, now = Date.now()) {
  const trusted = process.env.GLOBESECURE_TRUST_PROXY_HEADERS === "true";
  const candidate = trusted ? (request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "") : "";
  const identity = trusted && isIP(candidate) ? candidate : "unverified-proxy";
  const limit = identity === "unverified-proxy" ? 30 : 5;
  if (entries.size > 5000) for (const [key, item] of entries) if (now - item.start >= WINDOW) entries.delete(key);
  const key = scope + ":" + identity;
  const prior = entries.get(key);
  if (!prior || now - prior.start >= WINDOW) {
    entries.set(key, { start: now, count: 1 });
    return false;
  }
  prior.count++;
  return prior.count > limit;
}
