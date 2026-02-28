import { NextRequest, NextResponse } from "next/server";
import { verifyWhatsAppWebhook, parseIncomingWhatsAppMessage, sendWhatsAppTextMessage } from "@/app/lib/whatsapp";
import { parseIntent } from "@/app/utils/intentParser";
import { createMeetingEvent, fetchTodayMeetings } from "@/app/lib/calendar";
import { appendClientRecord } from "@/app/lib/sheets";
import { fetchUnreadEmailSummaries, createReplyDraft, sendEmail } from "@/app/lib/gmail";
import { draftEmailReply } from "@/app/lib/openai";
import { formatMeetingList } from "@/app/utils/meetingFormatter";
import type { MeetingRequest } from "@/types";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const challenge = verifyWhatsAppWebhook(
    request.nextUrl.searchParams.get("hub.mode"),
    request.nextUrl.searchParams.get("hub.verify_token"),
    request.nextUrl.searchParams.get("hub.challenge"),
  );

  if (!challenge) {
    return NextResponse.json({ error: "Webhook verification failed" }, { status: 403 });
  }

  return new NextResponse(challenge, { status: 200 });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const payload = await request.json();
    const message = parseIncomingWhatsAppMessage(payload);

    if (!message) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const intent = await parseIntent(message.text);

    switch (intent.intent) {
      case "schedule_meeting": {
        const details = intent.entities as Partial<MeetingRequest>;
        if (!details.clientName || !details.clientPhone || !details.clientEmail || !details.startDateTime || !details.endDateTime || !details.title) {
          await sendWhatsAppTextMessage(message.from, "Please provide full meeting details: name, phone, email, start, end, and title.");
          break;
        }

        const meeting = await createMeetingEvent(details as MeetingRequest);
        await appendClientRecord({
          name: details.clientName,
          phone: details.clientPhone,
          email: details.clientEmail,
          meetingDate: details.startDateTime,
        });

        await sendEmail(
          details.clientEmail,
          `Meeting confirmed: ${details.title}`,
          `Your meeting is confirmed.\nDate: ${details.startDateTime}\nGoogle Meet: ${meeting.meetLink}`,
        );

        await sendWhatsAppTextMessage(
          message.from,
          `Meeting scheduled successfully for ${details.clientName}. Meet link: ${meeting.meetLink}`,
        );
        break;
      }

      case "fetch_today_meetings": {
        const meetings = await fetchTodayMeetings();
        await sendWhatsAppTextMessage(message.from, formatMeetingList(meetings));
        break;
      }

      case "summarize_emails": {
        const emails = await fetchUnreadEmailSummaries(5);
        if (!emails.length) {
          await sendWhatsAppTextMessage(message.from, "No unread emails found.");
          break;
        }
        const report = emails
          .map((email, index) => `${index + 1}) ${email.subject} from ${email.from}\n${email.summary}`)
          .join("\n\n");
        await sendWhatsAppTextMessage(message.from, report);
        break;
      }

      case "reply_to_email": {
        const { messageId, instruction, context } = intent.entities as {
          messageId?: string;
          instruction?: string;
          context?: string;
        };

        if (!messageId || !instruction || !context) {
          await sendWhatsAppTextMessage(message.from, "For email reply, include messageId and your reply instruction.");
          break;
        }

        const reply = await draftEmailReply(context, instruction);
        await createReplyDraft(messageId, reply);
        await sendWhatsAppTextMessage(message.from, "Draft reply generated and saved in Gmail drafts.");
        break;
      }

      case "add_todo": {
        const todo = String(intent.entities.todo ?? message.text);
        await sendWhatsAppTextMessage(message.from, `Todo captured: ${todo}`);
        break;
      }

      default:
        await sendWhatsAppTextMessage(
          message.from,
          "I can help with: schedule meeting, today's meetings, summarize emails, reply to email, and add todo.",
        );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[whatsapp-webhook]", error);
    return NextResponse.json({ error: "Failed to process webhook" }, { status: 500 });
  }
}
