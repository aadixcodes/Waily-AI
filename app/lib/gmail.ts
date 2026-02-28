import { getGoogleAccessToken } from "./googleAuth";
import { summarizeEmail } from "./openai";
import { isImportantEmail } from "@/app/utils/emailClassifier";
import type { EmailSummary } from "@/types";

interface GmailMessageHeader {
  name: string;
  value: string;
}

interface GmailMessage {
  id: string;
  snippet: string;
  payload?: { headers?: GmailMessageHeader[] };
}

async function gmailFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const accessToken = await getGoogleAccessToken();
  const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Gmail API error ${response.status}: ${await response.text()}`);
  }

  return (await response.json()) as T;
}

function getHeader(message: GmailMessage, key: string): string {
  return (
    message.payload?.headers?.find((header) => header.name.toLowerCase() === key.toLowerCase())?.value ?? ""
  );
}

export async function fetchUnreadEmailSummaries(limit = 5): Promise<EmailSummary[]> {
  const list = await gmailFetch<{ messages?: Array<{ id: string }> }>(
    `messages?q=is:unread&maxResults=${limit}`,
  );

  if (!list.messages?.length) {
    return [];
  }

  const results: EmailSummary[] = [];
  for (const message of list.messages) {
    const detail = await gmailFetch<GmailMessage>(`messages/${message.id}?format=metadata`);
    const from = getHeader(detail, "From");
    const subject = getHeader(detail, "Subject");
    const isImportant = isImportantEmail({ from, subject, snippet: detail.snippet });
    const summary = await summarizeEmail(`From: ${from}\nSubject: ${subject}\n${detail.snippet}`);

    results.push({
      id: detail.id,
      from,
      subject,
      snippet: detail.snippet,
      summary,
      isImportant,
    });
  }

  return results;
}

export async function createReplyDraft(messageId: string, replyBody: string): Promise<void> {
  await gmailFetch("drafts", {
    method: "POST",
    body: JSON.stringify({
      message: {
        threadId: messageId,
          raw: btoa(`Content-Type: text/plain; charset=\"UTF-8\"\n\n${replyBody}`).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, ''),
      },
    }),
  });
}

export async function sendEmail(to: string, subject: string, body: string): Promise<void> {
    const rawMessage = btoa(
    `To: ${to}\r\nSubject: ${subject}\r\nContent-Type: text/plain; charset=\"UTF-8\"\r\n\r\n${body}`,
  ).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

  await gmailFetch("messages/send", {
    method: "POST",
    body: JSON.stringify({ raw: rawMessage }),
  });
}
