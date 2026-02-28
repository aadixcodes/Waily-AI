import { NextResponse } from "next/server";
import { fetchUnreadEmailSummaries } from "@/app/lib/gmail";
import { sendWhatsAppTextMessage } from "@/app/lib/whatsapp";

export async function GET(): Promise<NextResponse> {
  try {
    const ownerPhone = (globalThis as any).process?.env?.OWNER_WHATSAPP_NUMBER;
    if (!ownerPhone) {
      return NextResponse.json({ error: "OWNER_WHATSAPP_NUMBER is not configured" }, { status: 400 });
    }

    const emails = await fetchUnreadEmailSummaries(10);
    const important = emails.filter((email) => email.isImportant);

    for (const email of important) {
      await sendWhatsAppTextMessage(
        ownerPhone,
        `Important email detected:\nFrom: ${email.from}\nSubject: ${email.subject}\nSummary: ${email.summary}`,
      );
    }

    return NextResponse.json({ ok: true, scanned: emails.length, important: important.length });
  } catch (error) {
    console.error("[cron-check-emails]", error);
    return NextResponse.json({ error: "Email check failed" }, { status: 500 });
  }
}
