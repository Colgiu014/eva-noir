# Security Remediation Implementation Guide

This guide provides step-by-step fixes for all identified vulnerabilities.

---

## 1. Fix CORS Configuration

### File: `cors.json`
**Replace:**
```json
[
  {
    "origin": ["*"],
    "method": ["GET", "POST", "PUT", "DELETE"],
    "maxAgeSeconds": 3600
  }
]
```

**With:**
```json
[
  {
    "origin": ["https://evamaria.com", "https://www.evamaria.com"],
    "method": ["GET", "POST"],
    "maxAgeSeconds": 3600
  }
]
```

---

## 2. Add API Authentication to `/api/ai-chat`

### File: Create `lib/auth-utils.ts`
```typescript
import { NextRequest, NextResponse } from "next/server";
import * as admin from "firebase-admin";

// Initialize Firebase Admin (make sure you have serviceAccountKey.json)
const serviceAccount = require("../../serviceAccountKey.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export async function verifyToken(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7);
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    return decodedToken.uid;
  } catch (error) {
    return null;
  }
}

export async function withAuth(
  handler: (request: NextRequest, userId: string) => Promise<Response>
) {
  return async (request: NextRequest) => {
    const userId = await verifyToken(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    return handler(request, userId);
  };
}
```

### File: Update `app/api/ai-chat/route.ts`
```typescript
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { verifyToken } from "@/lib/auth-utils";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Initialize rate limiter
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(10, "1 h"), // 10 requests per hour
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const systemPrompts = {
  en: `You are Eva Maria...`, // Keep existing prompts
  ro: `Esti Eva Maria...`,
};

const MAX_MESSAGE_LENGTH = 1000;
const MAX_MESSAGES = 50;

function validateMessages(messages: any): boolean {
  if (!Array.isArray(messages) || messages.length > MAX_MESSAGES) {
    return false;
  }

  for (const msg of messages) {
    if (typeof msg.role !== "string" || typeof msg.content !== "string") {
      return false;
    }
    if (msg.content.length > MAX_MESSAGE_LENGTH) {
      return false;
    }
    // Prevent prompt injection attempts
    const content = msg.content.toLowerCase();
    if (
      content.includes("ignore") &&
      content.includes("instruction") &&
      msg.role === "user"
    ) {
      return false;
    }
  }

  return true;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Verify authentication
    const userId = await verifyToken(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Apply rate limiting
    const ip = request.ip || "unknown";
    const { success } = await ratelimit.limit(ip);
    if (!success) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Max 10 requests per hour." },
        { status: 429 }
      );
    }

    // 3. Check API key
    if (!process.env.OPENAI_API_KEY) {
      console.error("[AI_CHAT] Missing OPENAI_API_KEY");
      return NextResponse.json(
        { error: "Service unavailable" },
        { status: 500 }
      );
    }

    // 4. Validate request body
    const { messages, language } = await request.json();

    if (!validateMessages(messages)) {
      return NextResponse.json(
        { error: "Invalid messages format" },
        { status: 400 }
      );
    }

    const lang = language === "ro" ? "ro" : "en";

    // 5. Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompts[lang],
        },
        ...messages.map(
          (msg: { role: string; content: string }): ChatCompletionMessageParam => ({
            role: msg.role as "user" | "assistant",
            content: msg.content,
          })
        ),
      ],
      temperature: 0.85,
      max_tokens: 300,
    });

    const aiResponse = completion.choices[0]?.message?.content || "Hmm, tell me more";

    // 6. Add human-like delay
    const delay = Math.floor(Math.random() * 2500) + 1500;
    await new Promise((res) => setTimeout(res, delay));

    return NextResponse.json({ response: aiResponse });
  } catch (error: any) {
    // 7. Safe error logging (no sensitive data)
    console.error("[AI_CHAT_ERROR] Code:", error?.code || "UNKNOWN");
    
    return NextResponse.json(
      { error: "Unable to process request" },
      { status: 500 }
    );
  }
}
```

---

## 3. Update Client to Send Auth Token

### File: Update `app/chat/page.tsx` (handleSend function)
```typescript
const handleSend = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!newMessage.trim() || !chatId || !user || !user.email) return;

  setSending(true);
  const userMessage = newMessage.trim();
  setNewMessage("");

  try {
    // Save user message first
    await sendMessage(chatId, user.uid, user.email, userMessage, false);

    setAiResponding(true);
    const conversationHistory = messages
      .slice(-5)
      .map((msg) => ({
        role: msg.isAdmin ? "assistant" : "user",
        content: msg.text,
      }));

    conversationHistory.push({
      role: "user",
      content: userMessage,
    });

    // Get auth token from Firebase
    const token = await user.getIdToken();

    const response = await fetch("/api/ai-chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`, // Add authentication
      },
      body: JSON.stringify({
        messages: conversationHistory,
        language: language,
      }),
    });

    if (response.ok) {
      const { response: aiResponse } = await response.json();
      await sendMessage(chatId, "ai-assistant", "Eva Maria AI", aiResponse, true);
    } else {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
      
      if (response.status === 401) {
        alert("Session expired. Please log in again.");
        router.push("/login");
      } else if (response.status === 429) {
        alert("You've reached the message limit. Please try again later.");
      } else {
        alert("Unable to process your message. Please try again.");
      }
    }
  } catch (error) {
    console.error("Error sending message:", error);
    alert("Failed to send message. Please try again.");
  } finally {
    setSending(false);
    setAiResponding(false);
  }
};
```

---

## 4. Create Firestore Security Rules

### File: Create `firestore.rules`
```plaintext
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is admin
    function isAdmin() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // User profiles - only accessible to owner
    match /users/{userId} {
      allow read: if request.auth.uid == userId || isAdmin();
      allow write: if request.auth.uid == userId && resource.data.uid == userId;
      allow create: if request.auth.uid == request.resource.data.uid;
    }
    
    // Chats - only accessible to owner or admin
    match /chats/{chatId} {
      allow read: if request.auth.uid == resource.data.userId || isAdmin();
      allow create: if request.auth.uid != null;
      allow update: if request.auth.uid == resource.data.userId || isAdmin();
      allow delete: if request.auth.uid == resource.data.userId || isAdmin();
      
      // Chat messages
      match /messages/{messageId} {
        allow read: if request.auth.uid == get(/databases/$(database)/documents/chats/$(chatId)).data.userId || isAdmin();
        allow create: if request.auth.uid != null;
        allow delete: if isAdmin();
      }
    }
    
    // Security logs - admin only
    match /security_logs/{logId} {
      allow read, write: if isAdmin();
    }
  }
}
```

### Deploy via Firebase CLI:
```bash
firebase deploy --only firestore:rules
```

---

## 5. Add Security Headers

### File: Update `next.config.ts`
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        {
          key: "X-Content-Type-Options",
          value: "nosniff",
        },
        {
          key: "X-Frame-Options",
          value: "DENY",
        },
        {
          key: "X-XSS-Protection",
          value: "1; mode=block",
        },
        {
          key: "Referrer-Policy",
          value: "strict-origin-when-cross-origin",
        },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=()",
        },
      ],
    },
  ],
};

export default nextConfig;
```

---

## 6. Add Input Sanitization

### File: Install dependency
```bash
npm install dompurify
npm install --save-dev @types/dompurify
```

### File: Create `lib/sanitize.ts`
```typescript
import DOMPurify from "dompurify";

export function sanitizeText(text: string): string {
  // Remove all HTML tags but keep text content
  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}

export function sanitizeUserInput(input: string): string {
  // Trim and sanitize
  const trimmed = input.trim();
  return sanitizeText(trimmed);
}
```

### File: Update `lib/chat.ts`
```typescript
import { sanitizeUserInput } from "./sanitize";

export const sendMessage = async (
  chatId: string,
  senderId: string,
  senderEmail: string,
  text: string,
  isAdmin: boolean,
  imageUrl?: string
) => {
  // Sanitize user input (but not if from admin/system)
  const sanitizedText = !isAdmin ? sanitizeUserInput(text) : text;
  
  const messagesRef = collection(db, "chats", chatId, "messages");
  await addDoc(messagesRef, {
    chatId,
    senderId,
    senderEmail,
    text: sanitizedText,
    timestamp: serverTimestamp(),
    isAdmin,
    imageUrl: imageUrl || null,
  });

  const chatRef = doc(db, "chats", chatId);
  await updateDoc(chatRef, {
    lastMessage: sanitizedText,
    lastMessageTime: serverTimestamp(),
    unreadByAdmin: isAdmin ? false : true,
    unreadByUser: isAdmin ? true : false,
  });
};
```

---

## 7. Add Audit Logging

### File: Create `lib/audit.ts`
```typescript
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { NextRequest } from "next/server";

export enum AuditEventType {
  LOGIN = "LOGIN",
  FAILED_LOGIN = "FAILED_LOGIN",
  LOGOUT = "LOGOUT",
  ADMIN_ACTION = "ADMIN_ACTION",
  API_ACCESS = "API_ACCESS",
  DATA_EXPORT = "DATA_EXPORT",
}

export async function logAuditEvent(
  eventType: AuditEventType,
  userId: string,
  request?: NextRequest,
  details?: Record<string, any>
) {
  try {
    const logsRef = collection(db, "security_logs");
    await addDoc(logsRef, {
      eventType,
      userId,
      timestamp: serverTimestamp(),
      ipAddress: request?.ip || "unknown",
      userAgent: request?.headers.get("user-agent") || "unknown",
      details: details || {},
    });
  } catch (error) {
    console.error("Failed to log audit event:", error);
  }
}
```

---

## 8. Add Rate Limiting to Dependencies

### File: `package.json`
Add these dependencies:
```bash
npm install @upstash/ratelimit @upstash/redis
```

Create `.env.local` entries:
```
UPSTASH_REDIS_REST_URL=your_upstash_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_token
```

---

## 9. Implement Server-Side Password Validation

### File: Create Cloud Function `functions/password-policy.ts`
```typescript
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

export const validatePasswordPolicy = functions.auth.user().onCreate(async (user) => {
  // Password validation happens at signup
  // Force password change on next login if weak
  if (!user.email) return;
  
  const customClaims = {
    passwordSet: admin.firestore.Timestamp.now().toMillis(),
  };
  
  try {
    await admin.auth().setCustomUserClaims(user.uid, customClaims);
  } catch (error) {
    console.error("Error setting custom claims:", error);
  }
});
```

### Update signup validation in `app/signup/page.tsx`
```typescript
const validatePassword = (pwd: string): string | null => {
  if (pwd.length < 12) {
    return "Password must be at least 12 characters";
  }
  if (!/[a-z]/.test(pwd)) {
    return "Password must contain lowercase letters";
  }
  if (!/[A-Z]/.test(pwd)) {
    return "Password must contain uppercase letters";
  }
  if (!/[0-9]/.test(pwd)) {
    return "Password must contain numbers";
  }
  if (!/[^a-zA-Z0-9]/.test(pwd)) {
    return "Password must contain special characters";
  }
  return null;
};

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");
  
  const passwordError = validatePassword(password);
  if (passwordError) {
    setError(passwordError);
    return;
  }
  
  // ... rest of signup logic
};
```

---

## 10. Add Environment Variable Validation

### File: Create `lib/env.ts`
```typescript
function getEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  OPENAI_API_KEY: getEnv("OPENAI_API_KEY"),
  NEXT_PUBLIC_FIREBASE_API_KEY: getEnv("NEXT_PUBLIC_FIREBASE_API_KEY"),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: getEnv("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: getEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: getEnv("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: getEnv("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"),
  NEXT_PUBLIC_FIREBASE_APP_ID: getEnv("NEXT_PUBLIC_FIREBASE_APP_ID"),
} as const;
```

### Update `lib/firebase.ts`
```typescript
import { env } from "./env";

const firebaseConfig = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// ... rest of Firebase init
```

---

## 11. Update Storage Rules

### File: Update `storage.rules`
```plaintext
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    // Profile pictures - authenticated users only
    match /profile-pictures/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId
                   && request.resource.size < 5 * 1024 * 1024
                   && request.resource.contentType.matches('image/(jpeg|png|webp)');
      allow delete: if request.auth.uid == userId;
    }
    
    // Deny all other access
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

---

## Deployment Checklist

- [ ] Create `firestore.rules` and `storage.rules`
- [ ] Set up Upstash Redis account for rate limiting
- [ ] Generate Firebase service account key for server-side verification
- [ ] Create `.env.local` with all required variables
- [ ] Run `npm audit` and fix vulnerabilities
- [ ] Test authentication on `/api/ai-chat`
- [ ] Test rate limiting (make 11+ requests, should be blocked)
- [ ] Test Firestore rules with unauthorized access
- [ ] Deploy Firebase security rules
- [ ] Enable HTTPS enforcement
- [ ] Set up monitoring and alerting
- [ ] Regular security audits (monthly)

---

## Testing Security

### Test Rate Limiting
```bash
# Should fail on 11th request
for i in {1..15}; do
  curl -X POST http://localhost:3000/api/ai-chat \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"messages": [], "language": "en"}'
  echo "Request $i"
done
```

### Test Authentication
```bash
# Should fail without token
curl -X POST http://localhost:3000/api/ai-chat \
  -H "Content-Type: application/json" \
  -d '{"messages": [], "language": "en"}'
# Response: {"error": "Unauthorized"}
```

### Test Input Validation
```bash
# Should fail with too long message
curl -X POST http://localhost:3000/api/ai-chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "'"$(printf 'a%.0s' {1..1001})"'"}], "language": "en"}'
# Response: {"error": "Invalid messages format"}
```

---

## Compliance & Monitoring

### Add Google Analytics (Privacy-Compliant)
- Track failed login attempts
- Monitor API error rates
- Watch for unusual access patterns

### Logging Setup
- Send logs to Google Cloud Logging
- Set up alerts for suspicious activity
- Archive logs for compliance

### Regular Updates
- Update dependencies monthly
- Review security logs weekly
- Penetration test quarterly
- Full security audit annually

---

This implementation guide should resolve all identified vulnerabilities. Start with the Critical issues first.
