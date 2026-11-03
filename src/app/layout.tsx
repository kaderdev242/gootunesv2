import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Outfit, Syne } from "next/font/google";
import { Providers } from "./providers";
import { JsonLd } from "@/components/seo/JsonLd";
import { absoluteMediaUrl, organizationJsonLd, websiteJsonLd } from "@/lib/seo";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
    { media: "(prefers-color-scheme: light)", color: "#000000" },
  ],
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.gootunes.com",
  ),
  title: {
    default: "Gootunes — Achetez la musique directement auprès des artistes",
    template: "%s · Gootunes",
  },
  description:
    "Marketplace Direct-to-Fan pour l'Afrique. Achetez et vendez de la musique via Mobile Money. 80% reversés aux artistes.",
  applicationName: "Gootunes",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Gootunes",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/icons/icon-192.png",
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Gootunes",
    images: [
      {
        url: absoluteMediaUrl("/logo-gootunes.png"),
        alt: "Gootunes",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: [absoluteMediaUrl("/logo-gootunes.png")],
  },
};

function workerOrigin(): string | null {
  const raw =
    process.env.NEXT_PUBLIC_STREAM_WORKER_URL ||
    process.env.STREAM_WORKER_URL ||
    "https://gootunes-audio-stream.gootunes.workers.dev";
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Lecture audio : ouvre la connexion HTTPS vers le Worker dès le chargement,
  // pour que le premier « play » ne paie pas la négociation TLS.
  const audioOrigin = workerOrigin();

  return (
    <html
      lang="fr"
      className={`${outfit.variable} ${syne.variable} dark h-full antialiased`}
      data-theme="dark"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        {audioOrigin ? (
          <>
            <link rel="preconnect" href={audioOrigin} />
            <link rel="dns-prefetch" href={audioOrigin} />
          </>
        ) : null}
      </head>
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
        {process.env.NODE_ENV === "production" ? (
          <Script
            src="https://stats.prepax.io/script.js"
            data-website-id="22f5e187-5a81-43d8-8e7f-45df5e0c3b93"
            strategy="afterInteractive"
          />
        ) : null}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
