import { NextResponse } from "next/server";
import { sessionCookie, cookieFlags, baseUrl } from "../../../../lib/auth";
import { requestIsSameSite } from "../../../../lib/origin.mjs";
export const runtime = "nodejs";
export async function POST(request) {
  if (!requestIsSameSite(request)) return NextResponse.json({ error: "Origine invalide." }, { status: 403 });
  const response = NextResponse.redirect(baseUrl() + "/portail", { status: 303 });
  response.cookies.set(sessionCookie, "", { ...cookieFlags, maxAge: 0 });
  return response;
}
