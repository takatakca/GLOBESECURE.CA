import { NextResponse } from "next/server";
import { configured, randomUrl, challenge, oidcMetadata, oauthCookies, cookieFlags, baseUrl } from "../../../../lib/auth";
export const runtime = "nodejs";
export async function GET() {
  if (!configured()) return NextResponse.json({ error: "Authentification non configurée." }, { status: 503 });
  try {
    const oidc = await oidcMetadata();
    const verifier = randomUrl(), state = randomUrl(), nonce = randomUrl();
    const redirect = new URL(oidc.authorization_endpoint);
    redirect.searchParams.set("response_type", "code");
    redirect.searchParams.set("client_id", process.env.TAKATAK_OIDC_CLIENT_ID);
    redirect.searchParams.set("redirect_uri", baseUrl() + "/api/auth/callback");
    redirect.searchParams.set("scope", "openid profile email");
    redirect.searchParams.set("state", state);
    redirect.searchParams.set("nonce", nonce);
    redirect.searchParams.set("code_challenge", challenge(verifier));
    redirect.searchParams.set("code_challenge_method", "S256");
    const response = NextResponse.redirect(redirect);
    for (const [key, value] of Object.entries({ state, verifier, nonce })) {
      response.cookies.set(oauthCookies[key], value, { ...cookieFlags, maxAge: 600 });
    }
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch { return NextResponse.json({ error: "Service d'identité indisponible." }, { status: 502 }); }
}
