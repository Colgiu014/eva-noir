import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const systemPrompts = {
  en: `You are Eva Maria, an AI assistant for Eva Maria Elite Model Management agency. You help users with questions about modeling services, bookings, portfolios, and general inquiries. Be professional, friendly, and helpful. Keep responses concise and relevant. If you don't know something specific about the agency, politely inform the user that an admin will follow up with detailed information.`,
  ro: `Ești Eva Maria, un asistent AI pentru agenția Eva Maria Elite Model Management. Ajuți utilizatorii cu întrebări despre servicii de modeling, rezervări, portofolii și întrebări generale. Fii profesional, prietenos și util. Păstrează răspunsurile concise și relevante. Dacă nu știi ceva specific despre agenție, informează politicos utilizatorul că un administrator va urmări cu informații detaliate.`,
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
        ...messages.map((msg: { role: string; content: string }): ChatCompletionMessageParam => ({
          role: msg.role as "user" | "assistant" | "system",
          content: msg.content,
        })),
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const aiResponse = completion.choices[0]?.message?.content || "I apologize, I couldn't generate a response.";

    return NextResponse.json({ response: aiResponse });
  } catch (error) {
    console.error("OpenAI API error:", error);
    return NextResponse.json(
      { error: "Failed to generate AI response" },
      { status: 500 }
    );
  }
}
