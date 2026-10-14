export function trustedOrigin(origin, canonical, development = false) {
  if (typeof origin !== "string") return false;
  try {
    const parsed = new URL(origin);
    if (parsed.origin !== origin || !["http:", "https:"].includes(parsed.protocol)) return false;
    const site = new URL(canonical);
    if (parsed.origin === site.origin) return true;
    return development && ["http://localhost:3000", "http://127.0.0.1:3000"].includes(parsed.origin);
  } catch { return false; }
}
export function requestIsSameSite(request) {
  return trustedOrigin(request.headers.get("origin"), process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000", process.env.NODE_ENV !== "production");
}
