import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove X-Powered-By header (cleaner responses)
  poweredByHeader: false,

  // Disable telemetry in production build
  // (telemetry is already disabled via NEXT_TELEMETRY_DISABLED env var but this is explicit)

  // Image optimization: allow all sources (Supabase storage, etc.)
  images: {
    unoptimized: true, // Electron serves locally; no CDN optimization needed
  },

};

export default nextConfig;
