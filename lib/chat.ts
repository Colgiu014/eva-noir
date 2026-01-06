import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { Message, Chat, UserProfile } from "./types";

export const createUserProfile = async (uid: string, email: string, role: 'user' | 'admin' = 'user') => {
  const userRef = doc(db, "users", uid);
  await setDoc(userRef, {
    uid,
    email,
    role,
    createdAt: serverTimestamp(),
  });
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);
  
  if (userSnap.exists()) {
    const data = userSnap.data();
    return {
      uid: data.uid,
      email: data.email,
      role: data.role,
      createdAt: data.createdAt?.toDate() || new Date(),
      profilePicture: data.profilePicture || undefined,
    };
  }
  return null;
};

export const updateUserProfilePicture = async (uid: string, profilePictureUrl: string) => {
  const userRef = doc(db, "users", uid);
  await setDoc(userRef, {
    profilePicture: profilePictureUrl,
  }, { merge: true });
};

export const isUserAdmin = async (uid: string): Promise<boolean> => {
  const profile = await getUserProfile(uid);
  return profile?.role === 'admin';
};

export const getOrCreateChat = async (userId: string, userEmail: string): Promise<string> => {
  const chatsRef = collection(db, "chats");
  const q = query(chatsRef, where("userId", "==", userId));
  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    return querySnapshot.docs[0].id;
  }

  const newChat = await addDoc(chatsRef, {
    userId,
    userEmail,
    lastMessage: "",
    lastMessageTime: serverTimestamp(),
    unreadByAdmin: false,
    unreadByUser: false,
  });

  return newChat.id;
};

export const sendMessage = async (
  chatId: string,
  senderId: string,
  senderEmail: string,
  text: string,
  isAdmin: boolean
) => {
  const messagesRef = collection(db, "chats", chatId, "messages");
  await addDoc(messagesRef, {
    chatId,
    senderId,
    senderEmail,
    text,
    timestamp: serverTimestamp(),
    isAdmin,
  });

  const chatRef = doc(db, "chats", chatId);
  await updateDoc(chatRef, {
    lastMessage: text,
    lastMessageTime: serverTimestamp(),
    unreadByAdmin: isAdmin ? false : true,
    unreadByUser: isAdmin ? true : false,
  });
};

export const markChatAsRead = async (chatId: string, isAdmin: boolean) => {
  const chatRef = doc(db, "chats", chatId);
  await updateDoc(chatRef, {
    [isAdmin ? "unreadByAdmin" : "unreadByUser"]: false,
  });
};

export const subscribeToMessages = (
  chatId: string,
  callback: (messages: Message[]) => void
) => {
  const messagesRef = collection(db, "chats", chatId, "messages");
  const q = query(messagesRef, orderBy("timestamp", "asc"));

  return onSnapshot(q, (snapshot) => {
    const messages: Message[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        chatId: data.chatId,
        senderId: data.senderId,
        senderEmail: data.senderEmail,
        text: data.text,
        timestamp: data.timestamp?.toDate() || new Date(),
        isAdmin: data.isAdmin,
      };
    });
    callback(messages);
  });
};

export const subscribeToChats = (callback: (chats: Chat[]) => void) => {
  const chatsRef = collection(db, "chats");
  const q = query(chatsRef, orderBy("lastMessageTime", "desc"));

  return onSnapshot(q, (snapshot) => {
    const chats: Chat[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        userEmail: data.userEmail,
        lastMessage: data.lastMessage,
        lastMessageTime: data.lastMessageTime?.toDate() || new Date(),
        unreadByAdmin: data.unreadByAdmin || false,
        unreadByUser: data.unreadByUser || false,
      };
    });
    callback(chats);
  });
};

export const subscribeToUserChat = (userId: string, callback: (chat: Chat | null) => void) => {
  const chatsRef = collection(db, "chats");
  const q = query(chatsRef, where("userId", "==", userId));

  return onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      callback(null);
      return;
    }

    const doc = snapshot.docs[0];
    const data = doc.data();
    callback({
      id: doc.id,
      userId: data.userId,
      userEmail: data.userEmail,
      lastMessage: data.lastMessage,
      lastMessageTime: data.lastMessageTime?.toDate() || new Date(),
      unreadByAdmin: data.unreadByAdmin || false,
      unreadByUser: data.unreadByUser || false,
    });
  });
};
