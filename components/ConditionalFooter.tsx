"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";

export default function ConditionalFooter() {
  const pathname = usePathname();
  
  // Don't show footer on chat page or manage page
  if (pathname === "/chat" || pathname === "/manage-7x9k2p4a") {
    return null;
  }
  
  return <Footer />;
}
