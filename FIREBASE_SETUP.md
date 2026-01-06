# Firebase Authentication Setup Guide

## 1. Get Your Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click on "Project Settings" (gear icon)
4. Copy your Firebase config from the "Web" section
5. It should look like:
```javascript
{
  "apiKey": "AIzaSy...",
  "authDomain": "your-project.firebaseapp.com",
  "projectId": "your-project",
  "storageBucket": "your-project.appspot.com",
  "messagingSenderId": "1234567890",
  "appId": "1:1234567890:web:abc123..."
}
```

## 2. Update Environment Variables

Edit `.env.local` and fill in your Firebase credentials:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## 3. Enable Email/Password Authentication in Firebase

1. Go to Firebase Console → Your Project
2. Click "Authentication" in the left menu
3. Go to "Sign-in method" tab
4. Enable "Email/Password" provider

## 4. Test the Application

Run your development server:
```bash
npm run dev
```

Then visit:
- Sign Up: `http://localhost:3000/signup`
- Log In: `http://localhost:3000/login`
- Home: `http://localhost:3000`

## Files Created

- **`lib/firebase.ts`** - Firebase configuration
- **`lib/auth-context.tsx`** - Authentication context provider
- **`app/signup/page.tsx`** - Sign up page
- **`app/login/page.tsx`** - Login page
- **`.env.local`** - Environment variables (fill with your credentials)

## Usage in Components

```tsx
"use client";

import { useAuth } from "@/lib/auth-context";

export default function MyComponent() {
  const { user, logOut, loading } = useAuth();

  if (loading) return <p>Loading...</p>;

  if (user) {
    return <p>Welcome, {user.email}</p>;
  }

  return <p>Please log in</p>;
}
```

## Features Included

✅ Email/Password Sign Up
✅ Email/Password Log In
✅ User Session Management
✅ Protected Auth Routes
✅ Navigation Bar with Auth Status
✅ Error Handling
✅ Loading States
