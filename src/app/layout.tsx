import type { Metadata } from "next";
import { Outfit, Syne } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

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
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.gootunes.app",
  ),
  title: {
    default: "Gootunes — Achetez la musique directement auprès des artistes",
    template: "%s · Gootunes",
  },
  description:
    "Marketplace Direct-to-Fan pour l'Afrique. Achetez et vendez de la musique via Mobile Money. 80% reversés aux artistes.",
  icons: {
    icon: [{ url: "/icon-gootunes.png", type: "image/png" }],
    apple: "/icon-gootunes.png",
    shortcut: "/icon-gootunes.png",
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Gootunes",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${outfit.variable} ${syne.variable} dark h-full antialiased`}
      data-theme="dark"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
