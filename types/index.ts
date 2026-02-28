export type IntentType =
  | "schedule_meeting"
  | "fetch_today_meetings"
  | "summarize_emails"
  | "reply_to_email"
  | "add_todo"
  | "unknown";

export interface IntentResult {
  intent: IntentType;
  confidence: number;
  entities: Record<string, unknown>;
}

export interface ParsedWhatsAppMessage {
  from: string;
  messageId: string;
  text: string;
  timestamp: string;
}

export interface EmailSummary {
  id: string;
  from: string;
  subject: string;
  snippet: string;
  summary: string;
  isImportant: boolean;
}

export interface ClientRecord {
  name: string;
  phone: string;
  email: string;
  meetingDate: string;
}

export interface MeetingRequest {
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  startDateTime: string;
  endDateTime: string;
  title: string;
  description?: string;
}
