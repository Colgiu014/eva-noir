"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import {
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  deleteUser,
} from "firebase/auth";
import { doc, deleteDoc } from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { updateUserProfilePicture } from "@/lib/chat";
import Image from "next/image";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

export default function AccountPage() {
  const { user, userProfile, loading, logOut } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [deletePassword, setDeletePassword] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > MAX_FILE_SIZE) {
      showMessage("error", t("account.fileSizeError"));
      return;
    }

    if (!file.type.startsWith("image/")) {
      showMessage("error", t("account.imageTypeError"));
      return;
    }

    setUploadingImage(true);
    try {
      if (userProfile?.profilePicture) {
        try {
          const oldImageRef = ref(storage, `profile-pictures/${user.uid}`);
          await deleteObject(oldImageRef);
        } catch (error) {
          console.log("No old image to delete");
        }
      }

      const storageRef = ref(storage, `profile-pictures/${user.uid}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      await updateUserProfilePicture(user.uid, downloadURL);

      showMessage("success", t("account.profilePictureUpdated"));
      
      window.location.reload();
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      showMessage("error", t("account.profilePictureError"));
    } finally {
      setUploadingImage(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !currentPassword || !newPassword || !confirmNewPassword) return;

    if (newPassword !== confirmNewPassword) {
      showMessage("error", t("account.passwordMismatch"));
      return;
    }

    if (newPassword.length < 6) {
      showMessage("error", t("account.passwordTooShort"));
      return;
    }

    setIsUpdating(true);
    try {
      const credential = EmailAuthProvider.credential(user.email!, currentPassword);
      await reauthenticateWithCredential(user, credential);

      await updatePassword(user, newPassword);
      showMessage("success", t("account.passwordUpdated"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (error: any) {
      console.error("Error updating password:", error);
      if (error.code === "auth/wrong-password") {
        showMessage("error", t("account.wrongPassword"));
      } else if (error.code === "auth/weak-password") {
        showMessage("error", t("account.weakPassword"));
      } else {
        showMessage("error", t("account.passwordUpdateFailed"));
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || !deletePassword) return;

    setIsUpdating(true);
    try {
      const credential = EmailAuthProvider.credential(user.email!, deletePassword);
      await reauthenticateWithCredential(user, credential);

      await deleteDoc(doc(db, "users", user.uid));

      await deleteUser(user);

      showMessage("success", t("account.accountDeleted"));
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (error: any) {
      console.error("Error deleting account:", error);
      if (error.code === "auth/wrong-password") {
        showMessage("error", t("account.wrongPassword"));
      } else {
        showMessage("error", t("account.deleteFailed"));
      }
    } finally {
      setIsUpdating(false);
      setShowDeleteConfirm(false);
      setDeletePassword("");
    }
  };

  const handleLogout = async () => {
    await logOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-lg drop-shadow-lg">{t("account.loading")}</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen text-white pt-24 pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-gray-800">{t("account.title")}</h1>
          <p className="text-gray-700">{user.email}</p>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-2xl glass-light border shadow-xl ${
              message.type === "success"
                ? "border-green-400/40 text-green-100"
                : "border-red-400/40 text-red-100"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="space-y-6">
          <div className="glass-light border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <h2 className="text-xl font-bold mb-6 text-gray-800">{t("account.profilePicture")}</h2>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden glass-button border-2 border-white/40 shadow-2xl">
                  {userProfile?.profilePicture ? (
                    <Image
                      src={userProfile.profilePicture}
                      alt="Profile"
                      width={128}
                      height={128}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-16 h-16 text-white/50" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="px-6 py-3 glass-button bg-gradient-to-r from-pink-200/60 to-purple-200/60 text-gray-800 font-bold rounded-2xl transition-all shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 border border-white/30 cursor-pointer"
                >
                  {uploadingImage ? t("account.uploading") : t("account.uploadProfilePicture")}
                </button>
                <p className="mt-3 text-sm text-gray-600">
                  {t("account.maxFileSize")}
                </p>
              </div>
            </div>
          </div>

          <div className="glass-light border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <h2 className="text-xl font-bold mb-6 text-gray-800">{t("account.accountInfo")}</h2>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 px-4 glass-button rounded-2xl">
                <span className="text-gray-600 mb-1 sm:mb-0">{t("account.email")}</span>
                <span className="font-semibold text-gray-800">{user.email}</span>
              </div>
            </div>
          </div>

          {userProfile?.role === "admin" && (
            <div className="glass-light border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl">
              <h2 className="text-xl font-bold mb-6 text-gray-800">{t("account.quickActions")}</h2>
              <div className="grid grid-cols-1 gap-4">
                <button
                  onClick={() => router.push("/manage-7x9k2p4a")}
                  className="flex items-center gap-3 p-4 glass-button rounded-2xl transition-all transform hover:scale-105 shadow-lg cursor-pointer"
                >
                  <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div className="text-left">
                    <div className="font-semibold text-gray-800">{t("account.adminPanel")}</div>
                    <div className="text-sm text-gray-600">{t("account.managePlatform")}</div>
                  </div>
                </button>
              </div>
            </div>
          )}

          <div className="glass-light border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <h2 className="text-xl font-bold mb-6 text-gray-800">{t("account.changePassword")}</h2>
            <form onSubmit={handleUpdatePassword} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t("account.currentPassword")}
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder={t("account.currentPasswordPH")}
                  className="w-full px-4 py-3.5 glass-button rounded-2xl text-gray-800 placeholder-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all shadow-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t("account.newPassword")}
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t("account.newPasswordPH")}
                  className="w-full px-4 py-3.5 glass-button rounded-2xl text-gray-800 placeholder-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all shadow-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t("account.confirmPassword")}
                </label>
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder={t("account.confirmPasswordPH")}
                  className="w-full px-4 py-3.5 glass-button rounded-2xl text-gray-800 placeholder-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all shadow-lg"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isUpdating}
                className="w-full px-6 py-4 glass-button bg-gradient-to-r from-pink-500/30 to-purple-500/30 text-gray-700 font-bold rounded-2xl transition-all shadow-2xl hover:shadow-pink-500/40 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] border border-white/30 cursor-pointer"
              >
                {isUpdating ? t("account.updating") : t("account.updatePassword")}
              </button>
            </form>
          </div>

          <div className="glass-light border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <h2 className="text-xl font-bold mb-4 text-gray-800">{t("account.securityTips")}</h2>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-300 mt-0.5 flex-shrink-0 drop-shadow" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{t("account.tip1")}</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{t("account.tip2")}</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{t("account.tip3")}</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{t("account.tip4")}</span>
              </li>
            </ul>
          </div>

          <div className="glass-dark border border-red-400/30 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <p className="text-gray-700 mb-6">{t("account.deleteWarning")}</p>

            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-6 py-3 glass-button bg-red-500/30 hover:bg-red-500/50 text-gray-700 font-bold rounded-2xl transition-all shadow-xl hover:shadow-red-500/40 border border-red-400/40 cursor-pointer"
              >
                {t("account.deleteAccount")}
              </button>
            ) : (
              <div className="space-y-4">
                <div className="p-4 glass-dark border border-red-400/40 rounded-2xl backdrop-blur-xl">
                  <p className="text-red-700 font-bold mb-2">{t("account.cannotUndo")}</p>
                  <p className="text-gray-700">{t("account.confirmDelete")}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t("account.enterPassword")}
                  </label>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3.5 glass-button rounded-2xl text-gray-800 placeholder-gray-800 focus:outline-none focus:ring-2 focus:ring-red-400/40 transition-all shadow-lg"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={isUpdating || !deletePassword}
                    className="flex-1 px-6 py-3 glass-button bg-red-500/40 hover:bg-red-500/60 text-white font-bold rounded-2xl transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed border border-red-400/40 cursor-pointer"
                  >
                    {isUpdating ? t("account.deleting") : t("account.yesDelete")}
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeletePassword("");
                    }}
                    disabled={isUpdating}
                    className="flex-1 px-6 py-3 glass-button bg-gray-500/30 hover:bg-gray-500/50 text-gray-700 font-bold rounded-2xl transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed border border-white/30 cursor-pointer"
                  >
                    {t("account.cancel")}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-center pt-4">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-8 py-4 glass-button rounded-2xl transition-all transform hover:scale-105 shadow-lg cursor-pointer"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <div className="font-semibold text-gray-800">{t("account.logout")}</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
