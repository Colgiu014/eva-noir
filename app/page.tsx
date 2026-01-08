"use client";

import { useLanguage } from "@/lib/language-context";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import Script from "next/script";

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

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Eva Maria",
    description: "Elite model and exclusive content creator",
    url: "https://evamaria.com",
    image: "https://evamaria.com/eva-1.jpg",
    sameAs: [
      "https://instagram.com/evamaria",
      "https://twitter.com/evamaria",
      "https://tiktok.com/@evamaria",
    ],
    jobTitle: "Model & Content Creator",
    knowsAbout: ["Modeling", "Fashion", "Content Creation"],
  };

  return (
    <>
      <Script
        id="structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <main className="min-h-screen">
        <section className="pt-20 sm:pt-28 px-4 sm:px-6 lg:px-8 pb-12" aria-labelledby="hero-heading">
          <div className="max-w-7xl mx-auto">
            <header className="text-center mb-12 sm:mb-16 max-w-3xl mx-auto">
              <h1 id="hero-heading" className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-800 mb-6 sm:mb-8 drop-shadow-lg animate-[fadeIn_1s_ease-out]">
                {t("home.title")}
              </h1>
              <p className="text-lg sm:text-xl text-gray-700 leading-relaxed mb-8 sm:mb-10 drop-shadow">
                {t("home.subtitle")}
              </p>
              <button
                onClick={handleChatClick}
                className="px-8 sm:px-12 py-4 sm:py-5 glass-button text-gray-800 font-bold rounded-full text-base sm:text-lg shadow-xl hover:shadow-2xl transform transition-all duration-300 hover:scale-105 bg-gradient-to-r from-white/40 to-white/30 cursor-pointer"
                aria-label="Start chatting with Eva Maria"
              >
                {t("home.cta")}
              </button>
            </header>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6" role="list" aria-label="Photo gallery">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((index) => (
                <article
                  key={index}
                  onClick={handleChatClick}
                  className="glass-card rounded-3xl overflow-hidden cursor-pointer group"
                  role="listitem"
                  aria-label={`Eva Maria photo ${index} - Click to chat`}
                >
                  <div className="aspect-[3/4] relative overflow-hidden">
                    <img
                      src={`/eva-${index}.jpg`}
                      alt={`Eva Maria professional photo ${index} - Elite model and content creator`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                      loading={index <= 4 ? "eager" : "lazy"}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent group-hover:from-black/40 transition-all duration-500"></div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <style jsx>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </main>
    </>
  );
}
