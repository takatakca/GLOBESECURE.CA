import { NextResponse } from "next/server";
import { readJsonBody, bodyFailure } from "../../../lib/read-json.mjs";
import { requestIsSameSite } from "../../../lib/origin.mjs";
import { validateCareer } from "../../../lib/careers.mjs";
import { requestThrottle } from "../../../lib/rate-limit.mjs";
export const runtime = "nodejs";
export async function POST(request) {
  if (!requestIsSameSite(request)) return NextResponse.json({ error: "Origine invalide." }, { status: 403 });
  if (process.env.PRIVACY_POLICY_APPROVED !== "true") return NextResponse.json({ error: "Réception des candidatures non activée." }, { status: 503 });
  if (!process.env.RESEND_API_KEY || !process.env.CAREERS_TO_EMAIL || !process.env.CONTACT_FROM_EMAIL) return NextResponse.json({ error: "Le service de candidature n'est pas encore disponible." }, { status: 503 });
  if (requestThrottle(request, "careers")) return NextResponse.json({ error: "Trop de demandes. Réessayez plus tard." }, { status: 429 });
  let body;
  try { body = await readJsonBody(request); } catch (error) {
    const failure = bodyFailure(error);
    return NextResponse.json({ error: failure.message }, { status: failure.status });
  }
  const validated = validateCareer(body);
  if (!validated.ok) return NextResponse.json({ error: validated.error }, { status: 400 });
  const { name, email, city, interest, message } = validated.data;
  const content = ["Demande de contact carrière GlobeSecure", "Nom : "+name,"Courriel : "+email,"Ville : "+city,"Intérêt : "+interest,"",message].join("\n");
  try {
    const result = await fetch("https://api.resend.com/emails", {
      method:"POST",
      headers:{Authorization:"Bearer "+process.env.RESEND_API_KEY,"Content-Type":"application/json"},
      body:JSON.stringify({from:process.env.CONTACT_FROM_EMAIL,to:[process.env.CAREERS_TO_EMAIL],reply_to:email,subject:"Contact carrière GlobeSecure — "+interest,text:content}),
      signal:AbortSignal.timeout(10000)
    });
    if (!result.ok) return NextResponse.json({error:"Transmission indisponible. Réessayez plus tard."},{status:502});
    return NextResponse.json({ok:true},{status:201});
  } catch { return NextResponse.json({error:"Transmission indisponible. Réessayez plus tard."},{status:502}); }
}
