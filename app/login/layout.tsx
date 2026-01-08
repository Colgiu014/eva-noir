import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your Eva Maria account. Access exclusive content, personalized chat experiences, and premium features.",
  openGraph: {
    title: "Sign In | Eva Maria",
    description: "Sign in to your Eva Maria account. Access exclusive content and personalized experiences.",
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
