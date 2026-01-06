# Chat System Setup

## Overview
A real-time chat system has been implemented where users can communicate with the site admin. All data is stored in Firebase Firestore.

## Features

### For Users:
- **Chat Page** (`/chat`): Users can send messages to the admin
- Real-time message updates
- Read receipts
- Accessible after login

### For Admins:
- **Admin Dashboard** (`/admin`): View all user chats in one place
- See list of all conversations with users
- Real-time message updates
- Unread message indicators
- Respond to users directly

## Firebase Structure

### Collections:

1. **users** - User profiles
   ```
   {
     uid: string
     email: string
     role: 'user' | 'admin'
     createdAt: timestamp
   }
   ```

2. **chats** - Chat conversations
   ```
   {
     userId: string
     userEmail: string
     lastMessage: string
     lastMessageTime: timestamp
     unreadByAdmin: boolean
     unreadByUser: boolean
   }
   ```

3. **chats/{chatId}/messages** - Messages in a chat
   ```
   {
     chatId: string
     senderId: string
     senderEmail: string
     text: string
     timestamp: timestamp
     isAdmin: boolean
   }
   ```

## Setting Up an Admin User

### Option 1: Manual in Firebase Console
1. Go to Firebase Console → Firestore Database
2. Navigate to the `users` collection
3. Find the user document (by UID)
4. Edit the `role` field to `admin`

### Option 2: Via Code
You can modify the signup flow or create a one-time script to set a user as admin:

```typescript
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Update a user to admin role
await updateDoc(doc(db, "users", "USER_UID_HERE"), {
  role: "admin"
});
```

### Option 3: Firebase Functions (Recommended for Production)
Create a Cloud Function that only Firebase admins can call to promote users to admin role.

## Security Rules

Add these Firestore security rules to your Firebase project:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User profiles
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    
    // Chats - users can only see their own, admins can see all
    match /chats/{chatId} {
      allow read: if request.auth != null && (
        resource.data.userId == request.auth.uid ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
      );
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update: if request.auth != null && (
        resource.data.userId == request.auth.uid ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
      );
      
      // Messages subcollection
      match /messages/{messageId} {
        allow read: if request.auth != null && (
          get(/databases/$(database)/documents/chats/$(chatId)).data.userId == request.auth.uid ||
          get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
        );
        allow create: if request.auth != null && (
          get(/databases/$(database)/documents/chats/$(chatId)).data.userId == request.auth.uid ||
          get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
        );
      }
    }
  }
}
```

## Usage

1. **Users**: After logging in, click the "Chat" button in the navigation to start a conversation with the admin
2. **Admin**: After logging in with an admin account, click "Admin Dashboard" to see all user chats and respond

## Files Created/Modified

- `lib/firebase.ts` - Added Firestore initialization
- `lib/types.ts` - TypeScript types for chat data
- `lib/chat.ts` - Chat utility functions
- `lib/auth-context.tsx` - Updated to include user profiles
- `app/chat/page.tsx` - User chat page
- `app/admin/page.tsx` - Admin dashboard
- `app/page.tsx` - Added navigation links
