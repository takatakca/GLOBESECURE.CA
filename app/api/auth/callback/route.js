import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { configured, oauthCookies, cookieFlags, safeEqual, oidcMetadata, validateIdToken, accessFromClaims, setSession, baseUrl } from "../../../../lib/auth";
export const runtime = "nodejs";
function clearOauth(response) {
  for (const name of Object.values(oauthCookies)) response.cookies.set(name, "", { ...cookieFlags, maxAge: 0 });
  return response;
}
export async function GET(request) {
  const redirectError = () => clearOauth(NextResponse.redirect(baseUrl() + "/portail?auth=refuse"));
  if (!configured()) return redirectError();
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const jar = await cookies();
  const previous = jar.get(oauthCookies.state)?.value;
  const verifier = jar.get(oauthCookies.verifier)?.value;
  const nonce = jar.get(oauthCookies.nonce)?.value;
  if (!code || !verifier || !nonce || !safeEqual(state, previous)) return redirectError();
  try {
    const oidc = await oidcMetadata();
    const body = new URLSearchParams({
      grant_type: "authorization_code", code, redirect_uri: baseUrl() + "/api/auth/callback",
      client_id: process.env.TAKATAK_OIDC_CLIENT_ID, code_verifier: verifier
    });
    const headers = { "Content-Type": "application/x-www-form-urlencoded" };
    if (process.env.TAKATAK_OIDC_CLIENT_SECRET) {
      headers.Authorization = "Basic " + Buffer.from(process.env.TAKATAK_OIDC_CLIENT_ID + ":" + process.env.TAKATAK_OIDC_CLIENT_SECRET).toString("base64");
      body.delete("client_id");
    }
    const exchange = await fetch(oidc.token_endpoint, { method: "POST", headers, body, cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (!exchange.ok) return redirectError();
    const tokens = await exchange.json();
    if (typeof tokens.id_token !== "string") return redirectError();
    const claims = await validateIdToken(tokens.id_token, oidc, nonce);
    const profile = accessFromClaims(claims);
    if (!profile) return redirectError();
    const response = NextResponse.redirect(baseUrl() + "/portail");
    await setSession(response, profile);
    response.headers.set("Cache-Control", "no-store");
    return clearOauth(response);
  } catch { return redirectError(); }
}
