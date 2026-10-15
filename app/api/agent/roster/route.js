import { NextResponse } from "next/server";
import { getSession } from "../../../../lib/auth";
import { database } from "../../../../lib/db";
import { requestIsSameSite } from "../../../../lib/origin.mjs";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request) {
  const session = await getSession();
  if (!session?.roles?.includes("globesecure_agent")) return NextResponse.json({error:"Accès agent refusé."},{status:403});
  if (!requestIsSameSite(request)) return NextResponse.json({error:"Origine invalide."},{status:403});
  const pool = database();
  if (!pool) return NextResponse.json({error:"Base de données non configurée."},{status:503});
  try {
    await pool.query(
      "INSERT INTO gs_agent_roster(tenant_id,agent_sub) VALUES ($1,$2) ON CONFLICT(tenant_id,agent_sub) DO UPDATE SET last_seen_at=now()",
      [session.tenant,session.sub]);
    return NextResponse.json({ok:true},{headers:{"Cache-Control":"no-store"}});
  } catch {return NextResponse.json({error:"Inscription temporairement indisponible."},{status:503});}
}
