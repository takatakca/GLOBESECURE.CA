import { redirect } from "next/navigation";
import Link from "next/link";
import { SiteHeader, SiteFooter } from "../page";
import { getSession, hasRole } from "../../lib/auth";
import AgentShift from "./AgentShift";
export const metadata = { title: "Espace agent" };
export const dynamic = "force-dynamic";
export default async function AgentPage() {
  const session = await getSession();
  if (!session || !hasRole(session, "globesecure_agent")) redirect("/portail");
  return <><SiteHeader /><main id="contenu"><section className="inner-hero agent-hero"><div className="container"><Link href="/portail" className="back-link">← Portails</Link><span className="section-kicker">GLOBESECURE / AGENT</span><h1>Mon quart<br /><em>de travail.</em></h1><p>Pointage volontaire et localisation limitée au quart actif. Le suivi fonctionne uniquement si la permission de votre appareil est accordée et si cet onglet demeure ouvert.</p></div></section><section className="section"><div className="container shift-layout"><div><span className="section-kicker">IDENTITÉ AUTHENTIFIÉE</span><h2>Bonjour{session.name ? ", " + session.name : ""}.</h2><p className="muted">Votre identité et votre organisation sont validées par TAKATAK Auth. Votre suivi ne peut pas démarrer sans consentement explicite.</p><p className="muted">Ne partagez jamais cet espace ou vos accès avec une autre personne.</p></div><AgentShift /></div></section></main><SiteFooter /></>;
}
