"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";

export default function Navigation() {
  const { user, userProfile, loading, logOut } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();

  const handleLogOut = async () => {
    await logOut();
    router.push("/login");
  };

  if (pathname === "/login" || pathname === "/signup") {
    return null;
  }

  return (
    <header className="fixed top-0 left-0 right-0 border-b border-gray-800 bg-black/90 backdrop-blur-xl z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex items-center justify-between">
        <Link href="/" className="group cursor-pointer">
          <Image 
            src="/logo.svg" 
            alt="EVA MARIA" 
            width={180} 
            height={40} 
            className="h-8 sm:h-10 w-auto brightness-0 invert drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] 
                       group-hover:drop-shadow-[0_0_16px_rgba(255,255,255,0.6)] 
                       transition-all duration-300 ease-out" 
          />
        </Link>
        <nav className="flex items-center gap-2 sm:gap-4 lg:gap-8">
          <button
            onClick={() => setLanguage(language === "en" ? "ro" : "en")}
            className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-lg transition-all"
            title={language === "en" ? "Switch to Romanian" : "Comută la engleză"}
          >
            {language === "en" ? (
              <>
                <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg">
                  <rect width="60" height="30" fill="#012169"/>
                  <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6"/>
                  <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="4" clipPath="url(#clip)"/>
                  <path d="M30,0 L30,30 M0,15 L60,15" stroke="#fff" strokeWidth="10"/>
                  <path d="M30,0 L30,30 M0,15 L60,15" stroke="#C8102E" strokeWidth="6"/>
                </svg>
                <span className="hidden sm:inline text-xs text-white font-medium">EN</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg">
                  <rect width="20" height="30" fill="#002B7F"/>
                  <rect x="20" width="20" height="30" fill="#FCD116"/>
                  <rect x="40" width="20" height="30" fill="#CE1126"/>
                </svg>
                <span className="hidden sm:inline text-xs text-white font-medium">RO</span>
              </>
            )}
          </button>
          
          {loading ? (
            <div className="px-2 sm:px-4 py-2 text-xs sm:text-sm text-gray-400">{t("header.loading")}</div>
          ) : user ? (
            <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
              {userProfile?.role === 'admin' && (
                <Link
                  href="/manage-7x9k2p4a"
                  className="hidden md:inline-block px-3 sm:px-4 py-2 bg-[#ff4747] hover:bg-[#ff3333] text-white text-xs sm:text-sm font-semibold rounded transition-all"
                >
                  {t("header.admin")}
                </Link>
              )}
              <Link
                href="/account"
                className="px-3 sm:px-4 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-800 text-white text-xs sm:text-sm font-semibold rounded transition-all whitespace-nowrap flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="hidden sm:inline">{t("header.account")}</span>
              </Link>
              <Link
                href={userProfile?.role === 'admin' ? '/manage-7x9k2p4a' : '/chat'}
                className="px-3 sm:px-4 py-2 bg-[#ff4747] hover:bg-[#ff3333] text-white text-xs sm:text-sm font-semibold rounded transition-all whitespace-nowrap"
              >
                {t("header.chat")}
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/login"
                className="px-3 sm:px-4 py-2 text-white text-xs sm:text-sm font-semibold hover:text-gray-400 transition-colors whitespace-nowrap"
              >
                {t("header.login")}
              </Link>
              <Link
                href="/signup"
                className="px-3 sm:px-4 py-2 bg-[#ff4747] hover:bg-[#ff3333] text-white text-xs sm:text-sm font-semibold rounded transition-all whitespace-nowrap"
              >
                {t("header.signup")}
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
