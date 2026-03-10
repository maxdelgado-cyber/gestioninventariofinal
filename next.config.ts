import type { NextConfig } from "next";

// When building for Electron desktop (.exe / .dmg), images cannot use
// Next.js server-side optimization (no server running), so we disable it.
// For web deployment (Vercel / any server), optimization is enabled.
const isElectron = process.env.BUILD_TARGET === "electron";

const securityHeaders = [
    { key: "X-DNS-Prefetch-Control", value: "on" },
    { key: "X-Frame-Options", value: "SAMEORIGIN" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
    poweredByHeader: false,

    images: {
        // Electron serves files locally — image optimization requires a server
        unoptimized: isElectron,
        remotePatterns: [
            {
                protocol: "https",
                hostname: "*.supabase.co",
                pathname: "/storage/v1/object/public/**",
            },
        ],
    },

    // Security headers only make sense for web deployments
    ...(isElectron ? {} : {
        async headers() {
            return [
                {
                    source: "/(.*)",
                    headers: securityHeaders,
                },
            ];
        },
    }),
};

export default nextConfig;
