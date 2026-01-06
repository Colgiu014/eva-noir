"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import { sendMessage, subscribeToMessages, subscribeToChats, markChatAsRead } from "@/lib/chat";
import { Message, Chat } from "@/lib/types";

export default function AdminPage() {
  const { user, userProfile, loading } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
      return;
    }

    if (!loading && userProfile && userProfile.role !== "admin") {
      router.push("/");
      alert("Access denied. Admin only.");
    }
  }, [user, userProfile, loading, router]);

  useEffect(() => {
    if (!userProfile || userProfile.role !== "admin") return;

    const unsubscribe = subscribeToChats((chatList) => {
      setChats(chatList);
    });

    return () => unsubscribe();
  }, [userProfile]);

  useEffect(() => {
    if (!selectedChat) return;

    const unsubscribe = subscribeToMessages(selectedChat.id, (msgs) => {
      setMessages(msgs);
      markChatAsRead(selectedChat.id, true);
    });

    return () => unsubscribe();
  }, [selectedChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    if (!newMessage.trim() || !selectedChat || !user || !user.email) return;

    setSending(true);
    try {
      await sendMessage(selectedChat.id, user.uid, user.email, newMessage, true);
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 border-4 border-gray-700 border-t-[#ff4747] rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-500">{t("account.loading")}</p>
        </div>
      </div>
    );
  }

  if (!user || !userProfile || userProfile.role !== "admin") {
    return null;
  }

  return (
    <div className="flex h-screen bg-black pt-20">
      <aside className="w-80 bg-black border-r border-gray-800 flex flex-col">
        <header className="p-4 border-b border-gray-800">
          <div className="mb-2">
            <h1 className="text-xl font-bold text-white">{t("admin.title")}</h1>
          </div>
          <p className="text-sm text-gray-400">{t("admin.allChats")}</p>
        </header>

        <div className="flex-1 overflow-y-auto">
          {chats.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <p>{t("admin.noChats")}</p>
            </div>
          ) : (
            chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => setSelectedChat(chat)}
                className={`w-full p-4 border-b border-gray-800 text-left hover:bg-gray-900 transition-colors ${
                  selectedChat?.id === chat.id ? "bg-gray-900" : ""
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-white">
                    {chat.userEmail}
                  </span>
                  {chat.unreadByAdmin && (
                    <span className="w-2 h-2 bg-[#ff4747] rounded-full"></span>
                  )}
                </div>
                <p className="text-sm text-gray-400 truncate">
                  {chat.lastMessage || "No messages yet"}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {chat.lastMessageTime.toLocaleString()}
                </p>
              </button>
            ))
          )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            <header className="bg-black border-b border-gray-800 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {selectedChat.userEmail[0].toUpperCase()}
                </div>
                <h2 className="text-xl font-semibold text-white">
                  {selectedChat.userEmail}
                </h2>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 bg-black">
              <div className="max-w-4xl mx-auto space-y-3 sm:space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 mt-12 sm:mt-20">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <p>{t("admin.noMessages")}</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.isAdmin ? "justify-end" : "justify-start"
                      } group`}
                    >
                      <div className="flex items-end gap-1.5 sm:gap-2 max-w-[85%] sm:max-w-[75%]">
                        {!message.isAdmin && (
                          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-800 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {message.senderEmail[0].toUpperCase()}
                          </div>
                        )}
                        <div
                          className={`px-3 sm:px-4 py-2 sm:py-3 rounded-2xl ${
                            message.isAdmin
                              ? "bg-[#ff4747] text-white rounded-br-none"
                              : "bg-gray-900 text-white rounded-bl-none"
                          }`}
                        >
                          <p className="break-words text-sm sm:text-base">{message.text}</p>
                          <div className="text-[10px] sm:text-xs opacity-60 mt-0.5 sm:mt-1">
                            {message.timestamp.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                        {message.isAdmin && (
                          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-[#ff4747] to-[#ff6b6b] rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            A
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <footer className="bg-black border-t border-gray-800 p-4">
              <form onSubmit={handleSend} className="max-w-4xl mx-auto flex gap-2 sm:gap-3">
                <div className="flex-1 relative" ref={emojiPickerRef}>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={t("admin.typeMessage")}
                    className="w-full px-4 sm:px-5 py-2.5 sm:py-3 bg-gray-900 border border-gray-800 rounded-full text-sm sm:text-base text-white placeholder-gray-500 focus:outline-none focus:border-[#ff4747] transition-colors pr-10 sm:pr-12"
                    disabled={sending}
                  />
                  
                  {showEmojiPicker && (
                    <div className="absolute bottom-full right-0 mb-2 bg-gray-900 border border-gray-800 rounded-2xl p-3 shadow-2xl z-50 w-64">
                      <div className="grid grid-cols-6 gap-2">
                        {emojis.map((emoji, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handleEmojiClick(emoji)}
                            className="text-2xl hover:bg-gray-800 rounded-lg p-2 transition-colors"
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
                    className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="w-10 h-10 sm:w-12 sm:h-12 bg-[#ff4747] hover:bg-[#ff3333] text-white rounded-full flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#ff4747] flex-shrink-0"
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
            </footer>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-black">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <p className="text-gray-500 text-lg">{t("admin.selectChat")}</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
