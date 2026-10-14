import { NextResponse } from "next/server";
import { validateContact } from "../../../lib/contact.mjs";
import { requestIsSameSite } from "../../../lib/origin.mjs";
export const runtime = "nodejs";
const visits = new Map();
function limit(ip) {
  const now = Date.now();
  if (visits.size > 5000) for (const [key, val] of visits) if (now - val.start > 600000) visits.delete(key);
  const entry = visits.get(ip);
  if (!entry || now - entry.start > 600000) { visits.set(ip, { start: now, count: 1 }); return false; }
  entry.count += 1;
  return entry.count > 5;
}
export async function POST(request) {
  if (!requestIsSameSite(request)) return NextResponse.json({ error: "Origine invalide." }, { status: 403 });
  const ip = request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (limit(ip)) return NextResponse.json({ error: "Trop de demandes. Réessayez plus tard." }, { status: 429 });
  if (Number(request.headers.get("content-length")) > 12000) return NextResponse.json({ error: "Demande trop volumineuse." }, { status: 413 });
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Format invalide." }, { status: 400 }); }
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
