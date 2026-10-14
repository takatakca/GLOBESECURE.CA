import { getSession } from "./auth";
import { requestIsSameSite } from "./origin.mjs";
import { database } from "./db";
import { NextResponse } from "next/server";
export async function agentContext() {
  const session = await getSession();
  if (!session || !session.roles?.includes("globesecure_agent")) {
    return { error: NextResponse.json({ error: "Accès agent refusé." }, { status: 403 }) };
  }
  const pool = database();
  if (!pool) return { error: NextResponse.json({ error: "Base de données non configurée." }, { status: 503 }) };
  return { session, pool };
}
export function validOrigin(request) {
  return requestIsSameSite(request);
}
export function apiError(error) {
  if (error?.code === "23505") return NextResponse.json({ error: "Un quart est déjà actif." }, { status: 409 });
  return NextResponse.json({ error: "Opération temporairement indisponible." }, { status: 503 });
}
