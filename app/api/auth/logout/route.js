import { NextResponse } from "next/server";
import { sessionCookie, cookieFlags, baseUrl } from "../../../../lib/auth";
export const runtime = "nodejs";
export async function POST(request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== baseUrl()) return NextResponse.json({ error: "Origine invalide." }, { status: 403 });
  const response = NextResponse.redirect(baseUrl() + "/portail", { status: 303 });
  response.cookies.set(sessionCookie, "", { ...cookieFlags, maxAge: 0 });
  return response;
}
