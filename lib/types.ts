export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderEmail: string;
  text: string;
  timestamp: Date;
  isAdmin: boolean;
  imageUrl?: string;
}

export interface Chat {
  id: string;
  userId: string;
  userEmail: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadByAdmin: boolean;
  unreadByUser: boolean;
}

export interface UserProfile {
  uid: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: Date;
  profilePicture?: string;
}
