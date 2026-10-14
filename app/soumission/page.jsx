import Link from "next/link";
import { SiteHeader, SiteFooter } from "../page";
import QuoteForm from "./QuoteForm";
export const dynamic = "force-dynamic";
export const metadata = { title: "Demander une soumission", description: "Décrivez vos besoins en sécurité privée à GlobeSecure." };
export default function QuotePage() {
  return <><SiteHeader /><main id="contenu"><section className="inner-hero"><div className="container"><Link className="back-link" href="/">← Accueil</Link><span className="section-kicker">CONTACT / PROJET</span><h1>Parlons de votre<br /><em>sécurité.</em></h1><p>Quelques informations suffisent pour amorcer la discussion. Ne transmettez pas de détails sensibles concernant vos dispositifs de sécurité.</p></div></section><section className="section quote-section"><div className="container quote-layout"><div><span className="section-kicker">UNE APPROCHE HUMAINE</span><h2>Une proposition adaptée commence ici.</h2><p>Précisez le type d’établissement, la période souhaitée et les grandes lignes du mandat. Nous examinerons votre demande lorsque notre canal de réception sera configuré et opérationnel.</p><div className="quote-aside">Vos renseignements sont utilisés pour traiter votre demande. Consultez notre <Link href="/confidentialite">avis de confidentialité</Link>.</div></div><QuoteForm enabled={Boolean(process.env.RESEND_API_KEY && process.env.CONTACT_TO_EMAIL && process.env.CONTACT_FROM_EMAIL)} /></div></section></main><SiteFooter /></>;
}
