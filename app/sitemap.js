import { services } from "../lib/services";
export default function sitemap() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://globesecure.ca";
  return ["/", "/soumission", "/portail", "/confidentialite", ...services.map((s) => "/services/" + s.slug)].map((path) => ({ url: base + path, changeFrequency: "monthly", priority: path === "/" ? 1 : 0.6 }));
}
