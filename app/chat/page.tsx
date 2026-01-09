"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import { getOrCreateChat, sendMessage, subscribeToMessages, markChatAsRead } from "@/lib/chat";
import { Message } from "@/lib/types";
import Image from "next/image";

export default function ChatPage() {
  const { user, userProfile, loading } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [aiResponding, setAiResponding] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && user.email) {
      getOrCreateChat(user.uid, user.email).then((id) => {
        setChatId(id);
      });
    }
  }, [user]);

  useEffect(() => {
    if (!chatId) return;

    const unsubscribe = subscribeToMessages(chatId, (msgs) => {
      setMessages(msgs);
      markChatAsRead(chatId, false);
    });

    return () => unsubscribe();
  }, [chatId]);

  useEffect(() => {
    const handleScroll = () => {
      if (!messagesContainerRef.current) return;
      
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShouldAutoScroll(isNearBottom);
    };

    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  useEffect(() => {
    if (shouldAutoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, shouldAutoScroll]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!sending && !aiResponding) {
      inputRef.current?.focus();
    }
  }, [sending, aiResponding]);

  const emojis = [
    "😊", "😂", "❤️", "😍", "🥰", "😘", "😎", "🤗", "🙌", "👍",
    "👏", "🙏", "💪", "✨", "🎉", "🔥", "💯", "⭐", "💖", "😉",
    "😇", "🤔", "😅", "😢", "😭", "🥺", "😴", "🤩", "😱", "🎊"
  ];

  const handleEmojiClick = (emoji: string) => {
    setNewMessage((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatId || !user || !user.email) return;

    setSending(true);
    const userMessage = newMessage.trim();
    setNewMessage("");

    try {
      await sendMessage(chatId, user.uid, user.email, userMessage, false);

      setAiResponding(true);
      const conversationHistory = messages
        .slice(-5) // Last 5 messages for context
        .map((msg) => ({
          role: msg.isAdmin ? "assistant" : "user",
          content: msg.text,
        }));

      conversationHistory.push({
        role: "user",
        content: userMessage,
      });

      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: conversationHistory,
          language: language,
        }),
      });

      if (response.ok) {
        const { response: aiResponse, imageUrl } = await response.json();
        await sendMessage(chatId, "ai-assistant", "Eva Maria AI", aiResponse, true, imageUrl);
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        console.error("Failed to get AI response:", response.status, errorData);
        alert(`AI response failed: ${errorData.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message");
    } finally {
      setSending(false);
      setAiResponding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-white/70 text-lg drop-shadow-lg">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen pt-20 pb-4">
      <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 mb-4">
        <div className="max-w-4xl mx-auto">
          <div className="glass-light rounded-3xl shadow-2xl overflow-hidden border border-white/20">
            <div className="flex items-center gap-2 sm:gap-3 p-4 sm:p-5 border-b border-white/20 glass-dark">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden shadow-xl border-2 border-white/30">
                <Image
                  src="/eva-avatar.jpg"
                  alt="Eva Maria"
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-white drop-shadow-lg">{t("chat.support")}</h1>
              </div>
            </div>
            
            <div ref={messagesContainerRef} className="p-4 sm:p-6 space-y-3 sm:space-y-4 min-h-[500px] max-h-[600px] overflow-y-auto">
              {messages.length === 0 ? (
                <div className="text-center py-12 sm:py-20 px-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 glass-button rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-2xl">
                    <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-white/80 text-base sm:text-lg font-semibold mb-2 drop-shadow">{t("chat.noMessages")}</p>
                  <p className="text-white/50 text-xs sm:text-sm drop-shadow">{t("chat.startConversation")}</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isAdmin ? "justify-start" : "justify-end"} group`}
                  >
                    <div className="flex items-end gap-1.5 sm:gap-2 max-w-[85%] sm:max-w-[75%]">
                      {message.isAdmin && (
                        <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full overflow-hidden border-2 border-white/40 flex-shrink-0 shadow-lg">
                          <Image
                            src="/eva-avatar.jpg"
                            alt="Eva Maria"
                            width={36}
                            height={36}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div
                        className={`px-3 sm:px-4 py-2 sm:py-3 rounded-2xl shadow-xl backdrop-blur-md ${
                          message.isAdmin
                            ? "glass-button text-gray-700 rounded-bl-none border border-white/30"
                            : "bg-gradient-to-br from-pink-500/40 to-purple-500/40 glass-button text-gray-700 rounded-br-none border border-white/40 shadow-pink-500/30"
                        }`}
                      >
                        <p className="break-words text-sm sm:text-base drop-shadow">{message.text}</p>
                        {message.imageUrl && (
                          <div className="mt-2 sm:mt-3 rounded-lg overflow-hidden max-w-xs">
                            <Image
                              src={message.imageUrl}
                              alt="AI generated image"
                              width={400}
                              height={400}
                              className="w-full h-auto object-cover rounded-lg"
                            />
                          </div>
                        )}
                        <div className="text-[10px] sm:text-xs opacity-70 mt-0.5 sm:mt-1 drop-shadow">
                          {message.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                      {!message.isAdmin && (
                        <div className="w-7 h-7 sm:w-9 sm:h-9 glass-button border border-white/30 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold flex-shrink-0 shadow-lg overflow-hidden">
                          {userProfile?.profilePicture ? (
                            <Image
                              src={userProfile.profilePicture}
                              alt="User"
                              width={36}
                              height={36}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            user.email?.[0].toUpperCase()
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
              {aiResponding && (
                <div className="flex justify-start group">
                  <div className="flex items-end gap-1.5 sm:gap-2 max-w-[85%] sm:max-w-[75%]">
                    <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full overflow-hidden border-2 border-white/40 flex-shrink-0 shadow-lg">
                      <Image
                        src="/eva-avatar.jpg"
                        alt="Eva Maria"
                        width={36}
                        height={36}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="px-3 sm:px-4 py-2 sm:py-3 rounded-2xl glass-button text-white rounded-bl-none shadow-xl border border-white/30">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full animate-bounce shadow-lg" style={{ animationDelay: '0ms' }}></span>
                          <span className="w-2 h-2 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full animate-bounce shadow-lg" style={{ animationDelay: '150ms' }}></span>
                          <span className="w-2 h-2 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full animate-bounce shadow-lg" style={{ animationDelay: '300ms' }}></span>
                        </div>
                        <span className="text-xs sm:text-sm text-white/70 drop-shadow">{language === "ro" ? "Eva Maria scrie..." : "Eva Maria is typing..."}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

            <div className="border-t border-white/20 glass-dark backdrop-blur-xl">
              <form onSubmit={handleSend} className="px-3 sm:px-6 py-3 sm:py-4 flex gap-2 sm:gap-3">
          <div className="flex-1 relative" ref={emojiPickerRef}>
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={t("chat.placeholder")}
              className="w-full px-4 sm:px-5 py-2.5 sm:py-3 glass-button border-2 border-white/30 rounded-full text-sm sm:text-base text-gray-800 placeholder-gray-800 focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-400/20 transition-all pr-10 sm:pr-12 shadow-lg"
              disabled={sending}
            />
            
            {showEmojiPicker && (
              <div className="absolute bottom-full right-0 mb-2 glass-light border border-white/30 rounded-3xl p-4 shadow-2xl z-50 w-64">
                <div className="grid grid-cols-6 gap-2">
                  {emojis.map((emoji, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleEmojiClick(emoji)}
                      className="text-2xl hover:bg-white/20 rounded-xl p-2 transition-all transform hover:scale-110 cursor-pointer"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-700 hover:text-gray-700 transition-colors p-1 rounded-lg hover:bg-white/10 cursor-pointer"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
          <button
            type="submit"
            disabled={sending || aiResponding || !newMessage.trim()}
            className="w-10 h-10 sm:w-12 sm:h-12 glass-button bg-gradient-to-r from-pink-500/40 to-purple-500/40 hover:from-pink-500/60 hover:to-purple-500/60 text-gray-700 rounded-full flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-pink-500/40 disabled:hover:to-purple-500/40 flex-shrink-0 shadow-2xl hover:shadow-pink-500/40 hover:scale-110 active:scale-95 border border-white/30 cursor-pointer"
          >
            {sending ? (
              <svg className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            ) : (
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
