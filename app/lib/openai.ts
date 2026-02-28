import { getEnv } from "./env";
import type { IntentResult } from "@/types";

const OPENAI_BASE_URL = "https://api.openai.com/v1";

async function callOpenAI(systemPrompt: string, userPrompt: string): Promise<string> {
  const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getEnv("OPENAI_API_KEY")}`,
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      temperature: 0.1,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI response did not include message content");
  }
  return content;
}

export async function detectIntent(message: string): Promise<IntentResult> {
  const content = await callOpenAI(
    "You classify WhatsApp assistant commands. Return JSON with intent, confidence (0-1), and entities object. Valid intents: schedule_meeting, fetch_today_meetings, summarize_emails, reply_to_email, add_todo, unknown.",
    `Message: ${message}`,
  );

  const parsed = JSON.parse(content) as IntentResult;
  return {
    intent: parsed.intent ?? "unknown",
    confidence: parsed.confidence ?? 0,
    entities: parsed.entities ?? {},
  };
}

export async function summarizeEmail(rawEmailText: string): Promise<string> {
  const content = await callOpenAI(
    "Summarize email text for a business owner in <= 80 words. Return JSON {\"summary\": string}.",
    rawEmailText,
  );
  return (JSON.parse(content) as { summary: string }).summary;
}

export async function draftEmailReply(context: string, instruction: string): Promise<string> {
  const content = await callOpenAI(
    "Draft a professional and concise email reply. Return JSON {\"reply\": string}.",
    `Original email context: ${context}\n\nUser instruction: ${instruction}`,
  );
  return (JSON.parse(content) as { reply: string }).reply;
}
