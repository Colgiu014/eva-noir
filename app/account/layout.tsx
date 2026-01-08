import { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Account",
  description: "Manage your Eva Maria account settings, profile picture, password, and preferences.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
