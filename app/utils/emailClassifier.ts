interface EmailInput {
  from: string;
  subject: string;
  snippet: string;
}

const IMPORTANT_KEYWORDS = ["urgent", "invoice", "payment", "proposal", "meeting", "contract"];

export function isImportantEmail(email: EmailInput): boolean {
  const text = `${email.from} ${email.subject} ${email.snippet}`.toLowerCase();
  return IMPORTANT_KEYWORDS.some((keyword) => text.includes(keyword));
}
