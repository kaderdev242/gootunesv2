import type { NextConfig } from "next";

const securityHeaders = [
  // Empêche le clickjacking (intégration dans une <iframe>)
  { key: "X-Frame-Options", value: "DENY" },
  // Empêche le MIME sniffing (exécution de fichiers audio comme scripts)
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Réduit les infos de referrer envoyées aux tiers
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Force HTTPS pendant 2 ans (+ sous-domaines)
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Désactive la détection XSS legacy IE (comportement dangereux sur IE)
  { key: "X-XSS-Protection", value: "0" },
  // Permissions API — désactiver les fonctionnalités non nécessaires
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  // Content Security Policy
  // media-src : autorise le streaming audio depuis notre Worker Cloudflare + R2
  // blob: nécessaire pour l'<audio> HTML local (lecture depuis un Blob)
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Scripts : Next.js a besoin d'inline scripts pour l'hydratation
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cloud.umami.is",
      // Styles : Tailwind + Google Fonts
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Fonts
      "font-src 'self' https://fonts.gstatic.com",
      // Images : self + R2 public (souvent *.gootunes.app) + Cloudinary
      "img-src 'self' data: blob: https://*.r2.dev https://*.r2.cloudflarestorage.com https://*.gootunes.app https://*.cloudinary.com",
      // Audio : Worker Cloudflare (streaming) + R2 custom domain .app + blob
      "media-src 'self' blob: https://*.workers.dev https://*.r2.dev https://*.gootunes.app",
      // Connexions (fetch, WebSocket, Supabase realtime)
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.r2.dev https://*.workers.dev https://*.r2.cloudflarestorage.com https://*.gootunes.app https://cloud.umami.is https://gateway.umami.is",
      // Frames : interdit totalement
      "frame-src 'none'",
      "frame-ancestors 'none'",
      // Workers / Service Workers
      "worker-src 'self' blob:",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  // Dev uniquement : permet de tester le site en visiteur sur 127.0.0.1.
  allowedDevOrigins: ["127.0.0.1"],
  async redirects() {
    return [
      {
        source: "/discover",
        destination: "/",
        permanent: false,
      },
    ];
  },
  async headers() {
    return [
      {
        // Appliquer à toutes les routes
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "**.r2.dev",
      },
      {
        protocol: "https",
        hostname: "**.r2.cloudflarestorage.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
