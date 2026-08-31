import type { NextConfig } from "next";

// Admin-only tool handling owner/pet PII (NFR-5 in docs/requeriments.md) — locked down
// by default. Extend connect-src/img-src here as real integrations land:
//   - Supabase (client + REST):        https://*.supabase.co
//   - Nominatim geocoding (server-side only, no browser call needed)
//   - Maps deep links (Waze/Google Maps) and wa.me are top-level navigations,
//     not fetch/frame targets, so they don't need a CSP entry.
//
// script-src needs 'unsafe-inline' — the App Router streams RSC payloads via
// inline <script> tags (self.__next_f.push(...)), and without a nonce (see
// node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md)
// there's no way to allow those selectively. 'unsafe-eval' is dev-only:
// React uses eval() there to reconstruct server error stacks in the browser.
// Upgrading to a per-request nonce (drops 'unsafe-inline', forces every page
// to render dynamically) is a reasonable next hardening step, not done here.
const isDev = process.env.NODE_ENV === "development";
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  // Supabase Auth (signInWithPassword/getSession/signOut — the frontend never
  // queries tables directly, see src/modules/shared/lib/supabase-client.ts).
  // localhost:3001 is the NestJS API in local dev; once it's deployed, add its
  // real origin here too (it isn't yet — no Render URL exists at time of writing).
  `connect-src 'self' https://*.supabase.co${isDev ? " http://localhost:3001" : ""}`,
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
