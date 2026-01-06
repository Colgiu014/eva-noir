
"use client";

import { useLanguage } from "@/lib/language-context";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function Home() {
  const { t } = useLanguage();
  const router = useRouter();
  const { user } = useAuth();

  const handleChatClick = () => {
    if (user) {
      router.push("/chat");
    } else {
      router.push("/login");
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <section className="pt-20 sm:pt-28 px-4 sm:px-6 lg:px-8 pb-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16 max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
              {t("home.title")}
            </h1>
            <p className="text-base sm:text-lg text-gray-300 leading-relaxed mb-6 sm:mb-8">
              {t("home.subtitle")}
            </p>
            <button
              onClick={handleChatClick}
              className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-[#ff4747] to-[#ff6b6b] hover:from-[#ff3333] hover:to-[#ff4747] text-white font-semibold rounded-full transition-all transform hover:scale-105 shadow-lg hover:shadow-[#ff4747]/50 text-sm sm:text-base"
            >
              {t("home.cta")}
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-2xl bg-gray-900 border border-gray-800 hover:border-[#ff4747] transition-all duration-300 cursor-pointer"
              >
                <div className="aspect-[3/4] relative overflow-hidden">
                  <img
                    src={`/eva-${index}.jpg`}
                    alt={`Model ${index}`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
                </div>
                
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-800 bg-black py-6 sm:py-8 px-4 sm:px-6 lg:px-8 mt-20">
        <div className="max-w-7xl mx-auto text-center text-xs sm:text-sm text-gray-400">
          <p>{t("footer.rights")}</p>
        </div>
      </footer>
    </div>
  );
}
