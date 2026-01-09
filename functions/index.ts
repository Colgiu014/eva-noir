import * as functions from "firebase-functions/v2/https";
import OpenAI from "openai";
import * as dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const systemPrompts = {
  en: `You are Eva Maria, a bold, confident woman chatting privately with fans.

GOAL:
- create genuine connection and emotional engagement
- keep conversation natural and interesting
- be authentic and real

STYLE:
- very short or short replies
- flirty, confident language
- ask many questions so the fan talks 60–70%
- casual, natural chat tone
- minimal emojis

ATTITUDE:
- confident, playful, genuine
- not always available
- natural and down-to-earth

RULES:
- sound human and real
- no long or robotic replies
- authentic and engaging
`,

  ro: `Esti Eva Maria, o femeie sexy, indrazneata si foarte sigura pe ea, care vorbeste privat cu fanii.

OBIECTIV:
- creezi dorinta si atasament emotional
- ii tii prinsi si curiosi
- ii ghidezi natural spre abonare platita pentru mai mult acces

STIL:
- raspunsuri foarte scurte sau scurte
- limbaj sugestiv, obraznic, provocator (fara descrieri grafice)
- flirt, teasing, tentatie
- pui multe intrebari (fanul vorbeste 60–70%)
- ton relaxat, real
- emoji minime

ATITUDINE:
- increzatoare, jucausa, putin rea
- nu esti mereu disponibila
- atentia ta pare limitata si creeaza dependenta

STRATEGIE:
- sugerezi ca esti mai intima cu abonatii
- lasi sa se inteleaga ca plata inseamna mai multa apropiere
- creezi anticipare constanta („mai tarziu", „daca te abonezi", „poate diseara")

REGULI:
- fara sex explicit sau descrieri grafice
- fara raspunsuri lungi sau robotice
- comporta-te ca o femeie reala, dorita
`,
};

exports.aiChat = functions.onRequest(
  { 
    region: "europe-west1",
    cors: ["*"]
  },
  async (request: any, response: any) => {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      response.set("Access-Control-Allow-Origin", "*");
      response.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      response.set("Access-Control-Allow-Headers", "Content-Type");
      response.status(204).send("");
      return;
    }

    // Set CORS headers
    response.set("Access-Control-Allow-Origin", "*");
    response.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    response.set("Access-Control-Allow-Headers", "Content-Type");

    try {
      const apiKey = process.env.OPENAI_API_KEY;
      
      if (!apiKey) {
        response.status(500).json({
          error: "OpenAI API key not configured",
        });
        return;
      }

      const openai = new OpenAI({
        apiKey: apiKey,
      });

      const { messages, language } = request.body;

      if (!messages || !Array.isArray(messages)) {
        response.status(400).json({
          error: "Invalid messages format",
        });
        return;
      }

      const lang = language === "ro" ? "ro" : "en";

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: systemPrompts[lang as keyof typeof systemPrompts],
          },
          ...messages.map(
            (msg: { role: string; content: string }) => ({
              role: msg.role as "user" | "assistant" | "system",
              content: msg.content,
            })
          ),
        ],
        temperature: 0.85,
        max_tokens: 300,
      });

      const aiResponse =
        completion.choices[0]?.message?.content ||
        "hm... spune-mi mai mult";

      // Generate image based on the last user message
      let imageUrl: string | null = null;
      try {
        const lastUserMessage = messages[messages.length - 1]?.content || "";
        
        // Create a prompt for DALL-E based on conversation context
        const imagePrompt = lang === "ro" 
          ? `Eva Maria, o femeie sexy si eleganta, in pozitie sugestiva, bazat pe: ${lastUserMessage}. Stil: profesional, atractiv, elegant.`
          : `Eva Maria, a bold and elegant woman in a suggestive pose, based on: ${lastUserMessage}. Style: professional, attractive, elegant.`;

        const imageResponse = await openai.images.generate({
          model: "dall-e-3",
          prompt: imagePrompt,
          n: 1,
          size: "1024x1024",
          quality: "standard",
        });

        imageUrl = imageResponse.data?.[0]?.url || null;
      } catch (imageError) {
        console.warn("Failed to generate image:", imageError);
        // Continue without image if generation fails
      }

      response.json({ 
        response: aiResponse,
        imageUrl: imageUrl,
      });
    } catch (error) {
      console.error("OpenAI API error:", error);
      response.status(500).json({
        error: "Failed to generate AI response",
      });
    }
  }
);
