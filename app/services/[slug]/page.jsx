import Link from "next/link";
import { notFound } from "next/navigation";
import { services, serviceBySlug } from "../../../lib/services";
import { SiteHeader, SiteFooter } from "../../page";
export function generateStaticParams() {
  return services.map((service) => ({ slug: service.slug }));
}
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const service = serviceBySlug(slug);
  return { title: service ? service.label : "Service" };
}
export default async function ServicePage({ params }) {
  const { slug } = await params;
  const service = serviceBySlug(slug);
  if (!service) notFound();
  return <><SiteHeader /><main id="contenu"><section className="inner-hero"><div className="container"><Link href="/#expertise" className="back-link">← Toutes les expertises</Link><span className="section-kicker">EXPERTISE / {service.number}</span><h1>{service.label}</h1><p>{service.summary}</p></div></section><section className="section"><div className="container service-detail"><div><span className="section-kicker">UNE APPROCHE ADAPTÉE</span><h2>Des dispositifs conçus<br />pour vos enjeux.</h2><p>{service.detail}</p></div><div className="detail-points">{service.points.map((point, i) => <div key={point}><span>0{i + 1}</span><strong>{point}</strong><span aria-hidden="true">↗</span></div>)}</div></div></section><section className="cta"><div className="container cta-inner"><div><span className="section-kicker">VOTRE PROJET</span><h2>Parlons de vos besoins.</h2><p>Une réponse adaptée commence par une bonne compréhension du terrain.</p></div><Link href="/soumission" className="button button-primary">Demander une soumission ↗</Link></div></section></main><SiteFooter /></>;
}
