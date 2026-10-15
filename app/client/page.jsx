import { redirect } from "next/navigation";
import Link from "next/link";
import { SiteHeader, SiteFooter } from "../page";
import { getSession } from "../../lib/auth";
import ClientReports from "./ClientReports";
import ClientRequests from "./ClientRequests";
export const metadata = { robots: { index: false, follow: false }, title: "Espace client" };
export const dynamic = "force-dynamic";
export default async function ClientPage() {
  const session = await getSession();
  if (!session?.roles?.includes("globesecure_client")) redirect("/portail");
  return <><SiteHeader /><main id="contenu"><section className="inner-hero"><div className="container"><Link href="/portail" className="back-link">← Portails</Link><span className="section-kicker">GLOBESECURE / CLIENT</span><h1>Vos opérations.<br /><em>Vos rapports.</em></h1><p>Seuls les rapports vérifiés et publiés pour votre organisation sont disponibles dans cet espace. Les notes internes et les positions des agents ne sont jamais publiées automatiquement.</p></div></section><section className="section"><div className="container"><ClientReports /><ClientRequests enabled={process.env.PRIVACY_POLICY_APPROVED==="true"} /></div></section></main><SiteFooter /></>;
}
