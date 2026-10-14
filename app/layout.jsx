import "./globals.css";
export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://globesecure.ca"),
  title: { default: "GlobeSecure | Experts en sécurité au Québec", template: "%s | GlobeSecure" },
  description: "GlobeSecure : services de sécurité privée pour événements, chantiers, hôpitaux, entreprises, commerces et réponse aux alarmes au Québec.",
  robots: { index: true, follow: true },
  openGraph: { type: "website", locale: "fr_CA", siteName: "GlobeSecure" }
};
export default function RootLayout({ children }) {
  return <html lang="fr"><body><a className="skip-link" href="#contenu">Aller au contenu</a>{children}</body></html>;
}
