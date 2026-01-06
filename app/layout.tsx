import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { LanguageProvider } from "@/lib/language-context";
import Navigation from "@/components/Navigation";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "EVA MARIA - Elite Model Management",
  description: "Exclusive model management agency for premium talent",
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
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
