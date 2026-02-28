const requiredEnv = [
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_REFRESH_TOKEN",
  "OPENAI_API_KEY",
  "WHATSAPP_TOKEN",
  "WHATSAPP_PHONE_NUMBER_ID",
  "WHATSAPP_VERIFY_TOKEN",
  "GOOGLE_SHEET_ID",
] as const;

export type EnvKey = (typeof requiredEnv)[number];

export function getEnv(key: EnvKey): string {
  const value = (globalThis as any).process?.env?.[key];
  if (!value) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value;
}

export function validateEnv(): void {
  for (const key of requiredEnv) {
    if (!(globalThis as any).process?.env?.[key]) {
      console.warn(`[env] Missing ${key}. Some API calls will fail until configured.`);
    }
  }
}
