import { redirect } from "next/navigation";
import Link from "next/link";
import { SiteHeader, SiteFooter } from "../page";
import { getSession } from "../../lib/auth";
import SupervisorBoard from "./SupervisorBoard";
import AssignmentManager from "./AssignmentManager";
import SupervisorTimesheets from "./SupervisorTimesheets";
import SupervisorRequests from "./SupervisorRequests";
import PatrolManager from "./PatrolManager";
export const metadata = { robots: { index: false, follow: false }, title: "Supervision opérationnelle" };
export const dynamic = "force-dynamic";
export default async function SupervisionPage() {
  const session = await getSession();
  if (!session?.roles.includes("globesecure_supervisor")) redirect("/portail");
  return <><SiteHeader /><main id="contenu"><section className="inner-hero"><div className="container"><Link href="/portail" className="back-link">← Portails</Link><span className="section-kicker">ACCÈS CONTRÔLÉ / SUPERVISION</span><h1>La vue des<br /><em>opérations.</em></h1><p>Les quarts actifs et les rapports sont limités à votre organisation. Les positions affichées reflètent le dernier point reçu et ne constituent pas un suivi continu garanti.</p></div></section><section className="section"><div className="container"><SupervisorBoard /><AssignmentManager /><SupervisorTimesheets /><PatrolManager /><SupervisorRequests /></div></section></main><SiteFooter /></>;
}
