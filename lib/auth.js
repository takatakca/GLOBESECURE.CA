import { cookies } from "next/headers";
import { accessFromClaims } from "./claims.mjs";
export { accessFromClaims } from "./claims.mjs";
import { SignJWT, jwtVerify, createRemoteJWKSet } from "jose";
import { randomBytes, createHash, timingSafeEqual } from "node:crypto";

const SESSION_ISSUER = "globesecure.ca";
const SESSION_AUDIENCE = "globesecure-web";
export const ACCESS_ENTITLEMENT = "globesecure_access";
const prefix = (process.env.NEXT_PUBLIC_SITE_URL || "").startsWith("https://") ? "__Host-" : "";
export const sessionCookie = prefix + "gs_session";
export const oauthCookies = { state: prefix + "gs_oauth_state", verifier: prefix + "gs_oauth_verifier", nonce: prefix + "gs_oauth_nonce" };
export const cookieFlags = { httpOnly: true, secure: prefix !== "", sameSite: "lax", path: "/" };
export const configured = () => !!(process.env.TAKATAK_OIDC_ISSUER && process.env.TAKATAK_OIDC_CLIENT_ID && process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32);
export const baseUrl = () => (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
export const randomUrl = () => randomBytes(32).toString("base64url");
export const challenge = (verifier) => createHash("sha256").update(verifier).digest("base64url");
function secret() {
  if (!configured()) throw new Error("OIDC non configuré");
  return new TextEncoder().encode(process.env.SESSION_SECRET);
}
export function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const left = Buffer.from(a), right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
export async function oidcMetadata() {
  const issuer = process.env.TAKATAK_OIDC_ISSUER?.replace(/\/$/, "");
  if (!issuer) throw new Error("TAKATAK_OIDC_ISSUER manquant");
  const url = new URL(issuer);
  if (url.protocol !== "https:" && url.hostname !== "localhost") throw new Error("L'émetteur OIDC doit utiliser HTTPS");
  const res = await fetch(issuer + "/.well-known/openid-configuration", { cache: "no-store", signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error("Découverte OIDC indisponible");
  const data = await res.json();
  if (data.issuer !== issuer || !data.authorization_endpoint || !data.token_endpoint || !data.jwks_uri) throw new Error("Configuration OIDC invalide");
  for (const endpoint of [data.authorization_endpoint, data.token_endpoint, data.jwks_uri]) {
    const parsed = new URL(endpoint);
    if (parsed.protocol !== "https:" && parsed.hostname !== "localhost") throw new Error("Endpoint OIDC non HTTPS");
  }
  return data;
}
export async function validateIdToken(token, config, nonce) {
  const jwks = createRemoteJWKSet(new URL(config.jwks_uri));
  const { payload } = await jwtVerify(token, jwks, {
    issuer: config.issuer, audience: process.env.TAKATAK_OIDC_CLIENT_ID,
    clockTolerance: 30
  });
  if (!safeEqual(payload.nonce, nonce) || !payload.sub) throw new Error("Jeton ou nonce invalide");
  return payload;
}
export async function setSession(response, profile) {
  const jwt = await new SignJWT(profile).setProtectedHeader({ alg: "HS256" }).setIssuer(SESSION_ISSUER).setAudience(SESSION_AUDIENCE).setIssuedAt().setExpirationTime("6h").sign(secret());
  response.cookies.set(sessionCookie, jwt, { ...cookieFlags, maxAge: 6 * 3600 });
}
export async function getSession() {
  if (!configured()) return null;
  const jwt = (await cookies()).get(sessionCookie)?.value;
  if (!jwt) return null;
  try {
    const { payload } = await jwtVerify(jwt, secret(), { issuer: SESSION_ISSUER, audience: SESSION_AUDIENCE, algorithms: ["HS256"] });
    if (typeof payload.sub !== "string" || typeof payload.tenant !== "string" || !Array.isArray(payload.roles)) return null;
    return { sub: payload.sub, tenant: payload.tenant, roles: payload.roles, name: payload.name || "" };
  } catch { return null; }
}
export { hasRole } from "./roles.mjs";
