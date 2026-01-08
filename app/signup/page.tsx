"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import Link from "next/link";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const getPasswordStrength = (pwd: string) => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (pwd.length >= 12) strength++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^a-zA-Z0-9]/.test(pwd)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(password);
  const hasMinLength = password.length >= 8;
  const hasUpperLower = /[a-z]/.test(password) && /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^a-zA-Z0-9]/.test(password);
  const router = useRouter();
  const { signUp } = useAuth();
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    if (!hasSymbol) {
      setError("Password must contain at least one symbol");
      setLoading(false);
      return;
    }

    if (!hasNumber) {
      setError("Password must contain at least one number");
      setLoading(false);
      return;
    }

    try {
      await signUp(email, password);
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black text-gray-800 tracking-tight mb-2 drop-shadow-lg">{t("signup.title")}</h1>
        </div>

        <div className="glass-light rounded-3xl p-8 sm:p-10 shadow-2xl">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">{t("signup.heading")}</h2>

          {error && (
            <div className="mb-4 p-4 glass-dark rounded-2xl border border-red-400/30 text-red-200 text-sm backdrop-blur-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t("signup.email")}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3.5 glass-button rounded-2xl text-gray-800 placeholder-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all shadow-lg"
                placeholder={t("signup.emailPlaceholder")}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t("signup.password")}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3.5 pr-12 glass-button rounded-2xl text-gray-800 placeholder-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all shadow-lg"
                  placeholder={t("signup.passwordPlaceholder")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800 transition-colors p-1 rounded-lg hover:bg-white/30 cursor-pointer"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {password && (
                <div className="mt-3">
                  <div className="flex gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                          i < passwordStrength
                            ? passwordStrength <= 2
                              ? "bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.6)]"
                              : passwordStrength <= 3
                              ? "bg-yellow-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]"
                              : "bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]"
                            : "bg-white/20"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-800 font-medium">
                    {passwordStrength <= 2 && t("signup.passwordWeak")}
                    {passwordStrength === 3 && t("signup.passwordMedium")}
                    {passwordStrength === 4 && t("signup.passwordStrong")}
                    {passwordStrength === 5 && t("signup.passwordVeryStrong")}
                  </p>
                </div>
              )}
              <div className="mt-3 space-y-1.5 text-xs">
                <div className={`flex items-center gap-2 ${hasMinLength ? "text-green-600" : "text-gray-600"}`}>
                  <span className="font-bold">{hasMinLength ? "✓" : "○"}</span>
                  <span>{t("signup.rule1")}</span>
                </div>
                <div className={`flex items-center gap-2 ${hasUpperLower ? "text-green-600" : "text-gray-600"}`}>
                  <span className="font-bold">{hasUpperLower ? "✓" : "○"}</span>
                  <span>{t("signup.rule2")}</span>
                </div>
                <div className={`flex items-center gap-2 ${hasNumber ? "text-green-600" : "text-gray-600"}`}>
                  <span className="font-bold">{hasNumber ? "✓" : "○"}</span>
                  <span>{t("signup.rule3")}</span>
                </div>
                <div className={`flex items-center gap-2 ${hasSymbol ? "text-green-600" : "text-gray-600"}`}>
                  <span className="font-bold">{hasSymbol ? "✓" : "○"}</span>
                  <span>{t("signup.rule4")}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t("signup.confirmPassword")}
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3.5 pr-12 glass-button rounded-2xl text-gray-800 placeholder-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all shadow-lg"
                  placeholder={t("signup.passwordPlaceholder")}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800 transition-colors p-1 rounded-lg hover:bg-white/30 cursor-pointer"
                >
                  {showConfirmPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 px-4 py-4 glass-button disabled:opacity-50 disabled:cursor-not-allowed text-gray-800 font-bold rounded-2xl transition-all shadow-xl hover:shadow-2xl transform hover:scale-[1.02] bg-gradient-to-r from-pink-200/60 to-purple-200/60 disabled:transform-none cursor-pointer"
            >
              {loading ? t("signup.buttonLoading") : t("signup.button")}
            </button>
          </form>

          <p className="text-center text-gray-700 text-sm mt-6">
            {t("signup.haveAccount")}{" "}
            <Link href="/login" className="text-gray-900 font-bold hover:text-gray-700 transition-colors">
              {t("signup.loginLink")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
