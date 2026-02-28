import { getEnv } from "./env";
import type { ParsedWhatsAppMessage } from "@/types";

interface IncomingWhatsAppPayload {
  entry?: Array<{
    changes?: Array<{
      value?: {
        messages?: Array<{
          id: string;
          from: string;
          timestamp: string;
          type: string;
          text?: { body?: string };
        }>;
      };
    }>;
  }>;
}

export function parseIncomingWhatsAppMessage(payload: IncomingWhatsAppPayload): ParsedWhatsAppMessage | null {
  const message = payload.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  if (!message || message.type !== "text") {
    return null;
  }

  return {
    from: message.from,
    messageId: message.id,
    text: message.text?.body?.trim() ?? "",
    timestamp: message.timestamp,
  };
}

export async function sendWhatsAppTextMessage(to: string, body: string): Promise<void> {
  const phoneNumberId = getEnv("WHATSAPP_PHONE_NUMBER_ID");
  const token = getEnv("WHATSAPP_TOKEN");

  const response = await fetch(`https://graph.facebook.com/v22.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body },
    }),
  });

  if (!response.ok) {
    throw new Error(`WhatsApp send failed ${response.status}: ${await response.text()}`);
  }
}

export function verifyWhatsAppWebhook(mode: string | null, token: string | null, challenge: string | null): string | null {
  const verifyToken = getEnv("WHATSAPP_VERIFY_TOKEN");
  if (mode === "subscribe" && token === verifyToken && challenge) {
    return challenge;
  }
  return null;
}
