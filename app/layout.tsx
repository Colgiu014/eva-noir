import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { LanguageProvider } from "@/lib/language-context";
import Navigation from "@/components/Navigation";
import ConditionalFooter from "@/components/ConditionalFooter";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#ff69b4",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://evamaria.com"),
  title: {
    default: "Eva Maria | Elite Model & Exclusive Content Creator",
    template: "%s | Eva Maria",
  },
  description: "Connect with Eva Maria - Elite model and exclusive content creator. Premium photos, personalized chat experiences, and exclusive behind-the-scenes content. Join the exclusive community today.",
  keywords: [
    "Eva Maria",
    "model",
    "content creator",
    "exclusive content",
    "premium model",
    "elite model",
    "model portfolio",
    "fashion model",
    "influencer",
  ],
  authors: [{ name: "Eva Maria" }],
  creator: "Eva Maria",
  publisher: "Eva Maria",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: "ro_RO",
    url: "https://evamaria.com",
    siteName: "Eva Maria",
    title: "Eva Maria | Elite Model & Exclusive Content Creator",
    description: "Connect with Eva Maria - Elite model and exclusive content creator. Premium photos, personalized chat experiences, and exclusive behind-the-scenes content.",
    images: [
      {
        url: "/eva-1.jpg",
        width: 1200,
        height: 630,
        alt: "Eva Maria - Elite Model",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Eva Maria | Elite Model & Exclusive Content Creator",
    description: "Connect with Eva Maria - Elite model and exclusive content creator. Premium photos and personalized chat experiences.",
    images: ["/eva-1.jpg"],
    creator: "@evamaria",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180" },
    ],
  },
  manifest: "/manifest.json",
  category: "entertainment",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${dmSans.variable} antialiased font-[family-name:var(--font-dm-sans)]`}
      >
        <LanguageProvider>
          <AuthProvider>
            <Navigation />
            {children}
            <ConditionalFooter />
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
