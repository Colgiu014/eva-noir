import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chat",
  description: "Chat directly with Eva Maria. Get personalized responses, exclusive content, and a unique connection experience.",
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: "Chat with Eva Maria",
    description: "Chat directly with Eva Maria. Get personalized responses and exclusive content.",
  },
};

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
