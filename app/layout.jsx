import "./globals.css";
export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://globesecure.ca"),
  title: { default: "GlobeSecure | Sécurité privée, présence humaine", template: "%s | GlobeSecure" },
  description: "GlobeSecure : services de sécurité privée pour événements, établissements de santé, entreprises et chantiers au Canada.",
  robots: { index: true, follow: true },
  openGraph: { type: "website", locale: "fr_CA", siteName: "GlobeSecure" }
};
export default function RootLayout({ children }) {
  return <html lang="fr"><body>{children}</body></html>;
}
