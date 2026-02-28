import { detectIntent } from "@/app/lib/openai";
import type { IntentResult } from "@/types";

export async function parseIntent(message: string): Promise<IntentResult> {
  return detectIntent(message);
}
