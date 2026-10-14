export default function robots() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://globesecure.ca";
  return { rules: { userAgent: "*", allow: "/", disallow: ["/api/"] }, sitemap: base + "/sitemap.xml" };
}
