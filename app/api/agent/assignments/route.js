import { NextResponse } from "next/server";
import { getSession } from "../../../../lib/auth";
import { database } from "../../../../lib/db";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  const session = await getSession();
  if (!session?.roles?.includes("globesecure_agent")) return NextResponse.json({error:"Accès agent refusé."},{status:403});
  const pool = database();
  if (!pool) return NextResponse.json({error:"Base de données non configurée."},{status:503});
  try {
    const result = await pool.query(
      "SELECT id,title,site_label,starts_at,ends_at,status FROM gs_assignments WHERE tenant_id=$1 AND agent_sub=$2 AND starts_at >= now()-interval '7 days' ORDER BY starts_at ASC LIMIT 100",
      [session.tenant,session.sub]);
    return NextResponse.json({assignments:result.rows},{headers:{"Cache-Control":"no-store"}});
  } catch {return NextResponse.json({error:"Affectations temporairement indisponibles."},{status:503});}
}
