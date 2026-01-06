# AI Chat Setup Guide

This guide will help you set up the AI-powered chat feature for Eva Noir that responds automatically in Romanian and English.

## Prerequisites

- An OpenAI account with API access
- OpenAI API key

## Setup Steps

### 1. Get Your OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to **API Keys** section
4. Click **Create new secret key**
5. Copy the key (you won't be able to see it again)

### 2. Configure Environment Variables

1. Create a `.env.local` file in the root of your project:

```bash
touch .env.local
```

2. Add your OpenAI API key to `.env.local`:

```env
OPENAI_API_KEY=sk-your-actual-api-key-here
```

**Important:** Never commit your `.env.local` file to version control. It's already in `.gitignore`.

### 3. Update .gitignore

Ensure your `.gitignore` file includes:

```
.env*.local
.env
```

### 4. Restart the Development Server

After adding the environment variable, restart your development server:

```bash
npm run dev
```

## How It Works

### Language Detection

The AI automatically responds in the language selected by the user:
- **English (`en`)**: Professional English responses
- **Romanian (`ro`)**: Professional Romanian responses

### AI Personality

The AI assistant is configured to:
- Represent Eva Maria Elite Model Management
- Provide helpful information about modeling services
- Be professional, friendly, and concise
- Acknowledge when it needs human admin follow-up

### Message Flow

1. User sends a message in the chat
2. System automatically calls OpenAI API with:
   - Last 5 messages for context
   - Current language setting
   - Eva Maria's personality prompt
3. AI generates a response in the selected language
4. Response is sent as an admin message
5. User sees the response in real-time

## API Configuration

### Model Used

- **gpt-4o-mini** - Fast and cost-effective model
- Can be changed in `app/api/ai-chat/route.ts`

### Parameters

```typescript
model: "gpt-4o-mini"
temperature: 0.7        // Balanced creativity
max_tokens: 500         // Concise responses
```

### Cost Considerations

GPT-4o-mini pricing (as of 2026):
- Input: ~$0.15 / 1M tokens
- Output: ~$0.60 / 1M tokens

For a typical chat session:
- ~100 tokens per user message
- ~200 tokens per AI response
- Cost per exchange: ~$0.0001

## Customization

### Modify AI Personality

Edit the system prompts in [app/api/ai-chat/route.ts](app/api/ai-chat/route.ts):

```typescript
const systemPrompts = {
  en: `Your custom English prompt...`,
  ro: `Promptul tău personalizat în română...`,
};
```

### Change AI Model

Replace `gpt-4o-mini` with another model:
- `gpt-4o` - More capable (higher cost)
- `gpt-3.5-turbo` - Faster, cheaper (if available)

### Adjust Response Length

Modify `max_tokens` parameter (default: 500):
- Shorter (200-300): More concise
- Longer (800-1000): More detailed

### Context History

Currently uses last 5 messages. Adjust in [app/chat/page.tsx](app/chat/page.tsx):

```typescript
const conversationHistory = messages
  .slice(-10) // Change to -10 for more context
  .map((msg) => ({
    role: msg.isAdmin ? "assistant" : "user",
    content: msg.text,
  }));
```

## Testing

1. Start your development server
2. Navigate to `/chat` page
3. Send a message in English
4. Wait for AI response
5. Switch language to Romanian (RO)
6. Send a message in Romanian
7. Verify AI responds in Romanian

## Troubleshooting

### "OpenAI API key not configured" Error

**Solution:** Make sure `.env.local` exists and contains `OPENAI_API_KEY`

### AI Not Responding

1. Check browser console for errors
2. Verify API key is valid
3. Check OpenAI account has credits
4. Restart development server

### Wrong Language Responses

- Ensure language context is working
- Check system prompts in `route.ts`
- Verify `language` parameter is passed correctly

### Slow Responses

- Normal latency: 1-3 seconds
- If slower, consider:
  - Reducing `max_tokens`
  - Using a faster model
  - Checking internet connection

## Production Deployment

### Vercel

Add environment variable in Vercel dashboard:

1. Go to your project settings
2. Navigate to **Environment Variables**
3. Add `OPENAI_API_KEY` with your key
4. Redeploy your application

### Other Platforms

Add `OPENAI_API_KEY` environment variable according to your platform's documentation.

## Security Notes

- ✅ API key stored server-side only
- ✅ Never exposed to client
- ✅ API route handles all OpenAI communication
- ⚠️ Monitor API usage to prevent abuse
- ⚠️ Consider rate limiting in production

## Support

For issues related to:
- OpenAI API: [OpenAI Help Center](https://help.openai.com/)
- This implementation: Check Firebase and Next.js documentation

## Additional Resources

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [OpenAI Node.js SDK](https://github.com/openai/openai-node)
