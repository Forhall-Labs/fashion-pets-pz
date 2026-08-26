import type { NextConfig } from "next";

// Admin-only tool handling owner/pet PII (NFR-5 in docs/requeriments.md) — locked down
// by default. Extend connect-src/img-src here as real integrations land:
//   - Supabase (client + REST):        https://*.supabase.co
//   - Nominatim geocoding (server-side only, no browser call needed)
//   - Maps deep links (Waze/Google Maps) and wa.me are top-level navigations,
//     not fetch/frame targets, so they don't need a CSP entry.
const csp = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
