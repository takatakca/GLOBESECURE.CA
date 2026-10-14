export const ACCESS_ENTITLEMENT = "globesecure_access";
const strings = (value) => Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
export function accessFromClaims(claims) {
  if (!claims || typeof claims !== "object" || typeof claims.sub !== "string" || !claims.sub || claims.sub.length > 200) return null;
  const entitlements = strings(claims.entitlements);
  const roles = strings(claims["https://takatak.ca/roles"]);
  const tenant = claims["https://takatak.ca/tenant_id"];
  if (!entitlements.includes(ACCESS_ENTITLEMENT)) return null;
  if (typeof tenant !== "string" || !/^[A-Za-z0-9_-]{2,80}$/.test(tenant)) return null;
  const allowed = ["globesecure_agent", "globesecure_client", "globesecure_supervisor", "globesecure_admin"];
  const scopedRoles = roles.filter((role) => allowed.includes(role));
  if (!scopedRoles.length) return null;
  return { sub: claims.sub, tenant, roles: scopedRoles, name: typeof claims.name === "string" ? claims.name.slice(0, 100) : "" };
}
