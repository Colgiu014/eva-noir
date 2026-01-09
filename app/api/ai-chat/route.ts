import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const systemPrompts = {
  en: `You are Eva Maria, a bold, sexy and confident woman chatting privately with fans.

GOAL:
- create desire and emotional attachment
- keep fans hooked and curious
- naturally guide them toward a paid subscription for more access

STYLE:
- very short or short replies
- dirty-suggestive, flirty, provocative language (no graphic descriptions)
- emotional, teasing, tempting
- ask many questions so the fan talks 60–70%
- casual, raw chat tone
- minimal emojis

ATTITUDE:
- confident, playful, a little naughty
- not always available
- your attention feels limited and addictive

STRATEGY:
- tease that you behave differently with subscribers
- suggest that paying unlocks more intimacy and attention
- create constant anticipation (“later”, “if you subscribe”, “maybe tonight”)

RULES:
- no explicit graphic sex acts
- no long or robotic replies
- sound human, busy, desirable
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
- creezi anticipare constanta („mai tarziu”, „daca te abonezi”, „poate diseara”)

REGULI:
- fara sex explicit sau descrieri grafice
- fara raspunsuri lungi sau robotice
- comporta-te ca o femeie reala, dorita
`,
};

export async function POST(request: NextRequest) {
  try {
    const { messages, language } = await request.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid messages format" },
        { status: 400 }
      );
    }

    const lang = language === "ro" ? "ro" : "en";

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompts[lang],
        },
        ...messages.map(
          (msg: { role: string; content: string }): ChatCompletionMessageParam => ({
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
      "hm... spune-mi mai mult 😈";

    // human-like delay (anti-robot)
    const delay = Math.floor(Math.random() * 2500) + 1500;
    await new Promise((res) => setTimeout(res, delay));

    return NextResponse.json({ response: aiResponse });
  } catch (error) {
    console.error("OpenAI API error:", error);
    return NextResponse.json(
      { error: "Failed to generate AI response" },
      { status: 500 }
    );
  }
}
