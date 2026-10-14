import Link from "next/link";
import { SiteHeader, SiteFooter } from "../page";
import QuoteForm from "../soumission/QuoteForm";
export const dynamic = "force-dynamic";
export const metadata = { title: "Contacter GlobeSecure", description: "Coordonnées du siège social de GlobeSecure à Montréal et demande de soumission." };
export default function ContactPage() {
  const enabled=Boolean(process.env.RESEND_API_KEY && process.env.CONTACT_TO_EMAIL && process.env.CONTACT_FROM_EMAIL && process.env.PRIVACY_POLICY_APPROVED === "true");
  return <><SiteHeader /><main id="contenu"><section className="inner-hero"><div className="container"><Link href="/" className="back-link">← Accueil</Link><span className="section-kicker">GLOBESECURE / CONTACT</span><h1>Parlons de <em>votre sécurité.</em></h1><p>Un mandat de surveillance, un événement ou une demande d'information ? Voici les coordonnées et les renseignements publiés sur le site GlobeSecure.</p></div></section><section className="section quote-section"><div className="container quote-layout"><div><span className="section-kicker">SIÈGE SOCIAL · MONTRÉAL</span><h2>Venez nous trouver.</h2><p>7405B Rue Vérité<br />Montréal, Québec</p><h3>Heures de bureau affichées</h3><p>Lundi au vendredi, 8 h à 18 h. Le site actuel indique également un service de répartition 24 h/24 et 7 j/7, à confirmer pour chaque mandat.</p><p>Pour une proposition adaptée, décrivez les grandes lignes de votre demande sans transmettre de renseignements confidentiels.</p><p className="quote-aside">Les coordonnées téléphoniques et les adresses de courriel doivent être validées avant leur publication. Consultez notre <Link href="/confidentialite">avis de confidentialité</Link>.</p></div><QuoteForm enabled={enabled}/></div></section></main><SiteFooter /></>;
}
