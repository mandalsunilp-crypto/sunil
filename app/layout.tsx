import type { Metadata } from "next";
import "./globals.css";
import { WhatsAppSupportButton } from "@/components/public/WhatsAppSupportButton";

export const metadata: Metadata = {
  title: {
    default: "Verified Hub — Premium AI Tools | Nepal",
    template: "%s | Verified Hub",
  },
  description:
    "Nepal's #1 trusted marketplace for premium AI subscriptions: ChatGPT Plus, Claude Pro, Midjourney, Cursor AI & more. Pay with eSewa, Khalti, or Digital Wallet. Instant delivery with warranty.",
  keywords: [
    "AI Tools Nepal",
    "ChatGPT Plus Nepal",
    "Claude Pro Nepal",
    "Midjourney Nepal",
    "Cursor AI Nepal",
    "eSewa Payment AI",
    "Khalti AI Tools",
    "AI Subscription Nepal",
    "Verified Hub",
  ],
  authors: [{ name: "Verified Hub", url: "https://verifiedhub.com.np" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Verified Hub",
    title: "Verified Hub — Premium AI Tools Nepal",
    description: "Nepal's trusted source for premium AI tool subscriptions with instant delivery, verified access & warranty.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" data-scroll-behavior="smooth">
      <head>
        {/* Critical resource preconnects for faster load */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cfyxvulzateipcpldemw.supabase.co" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://cfyxvulzateipcpldemw.supabase.co" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        {/* System font stack — zero web font latency */}
        <meta name="color-scheme" content="dark light" />
        <meta name="theme-color" content="#09090b" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body
        className="min-h-screen bg-[#09090b] text-neutral-100 flex flex-col antialiased selection:bg-purple-600 selection:text-white"
        style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}
      >
        {children}
        <WhatsAppSupportButton />
      </body>
    </html>
  );
}
