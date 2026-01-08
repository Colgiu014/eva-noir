import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Join Eva Maria's exclusive community. Create your account to access premium content, personalized chat experiences, and behind-the-scenes content.",
  openGraph: {
    title: "Create Account | Eva Maria",
    description: "Join Eva Maria's exclusive community. Create your account today.",
  },
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
