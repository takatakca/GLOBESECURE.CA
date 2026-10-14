import { NextResponse } from "next/server";
import { readJsonBody, bodyFailure } from "../../../lib/read-json.mjs";
import { validateContact } from "../../../lib/contact.mjs";
import { requestIsSameSite } from "../../../lib/origin.mjs";
import { requestThrottle } from "../../../lib/rate-limit.mjs";
export const runtime = "nodejs";
export async function POST(request) {
  if (process.env.PRIVACY_POLICY_APPROVED !== "true") return NextResponse.json({ error: "Réception des soumissions non activée." }, { status: 503 });
  if (!requestIsSameSite(request)) return NextResponse.json({ error: "Origine invalide." }, { status: 403 });
  if (requestThrottle(request, "quote")) return NextResponse.json({ error: "Trop de demandes. Réessayez plus tard." }, { status: 429 });
  let body;
  try { body = await readJsonBody(request); } catch (error) { const failure = bodyFailure(error); return NextResponse.json({ error: failure.message }, { status: failure.status }); }
  const validation = validateContact(body);
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL;
  if (!apiKey || !to || !from) return NextResponse.json({ error: "Le canal de réception n'est pas encore disponible." }, { status: 503 });
  const { name, email, organization, phone, service, message } = validation.data;
  const text = ["Nouvelle demande GlobeSecure", "", "Nom : " + name, "Courriel : " + email, "Organisation : " + organization, "Téléphone : " + phone, "Mandat : " + service, "", message].join("\n");
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject: "Nouvelle soumission GlobeSecure — " + service, text, reply_to: email }),
      signal: AbortSignal.timeout(10000)
    });
    if (!response.ok) return NextResponse.json({ error: "Transmission indisponible. Réessayez plus tard." }, { status: 502 });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Transmission indisponible. Réessayez plus tard." }, { status: 502 });
  }
}
