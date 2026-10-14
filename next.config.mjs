/** Build on GitHub Actions; deploy standalone output to MochaHost without building there. */
const nextConfig = {
  output: "standalone",
  env: { NEXT_PUBLIC_BUILD_SHA: process.env.GLOBESECURE_BUILD_SHA || "local" },
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    const policy = "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; img-src 'self' data:; font-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'";
    return [{
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
        ...(process.env.NODE_ENV === "production" ? [{ key: "Content-Security-Policy", value: policy }] : [])
      ]
    }];
  }
};
export default nextConfig;
