import { getGoogleAccessToken } from "./googleAuth";
import type { MeetingRequest } from "@/types";

async function calendarFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const accessToken = await getGoogleAccessToken();
  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Calendar API error ${response.status}: ${await response.text()}`);
  }

  return (await response.json()) as T;
}

export async function createMeetingEvent(request: MeetingRequest): Promise<{ eventId: string; meetLink: string }> {
  const payload = {
    summary: request.title,
    description: request.description,
    start: { dateTime: request.startDateTime },
    end: { dateTime: request.endDateTime },
    attendees: [{ email: request.clientEmail }],
    conferenceData: {
      createRequest: {
        requestId: `waily-${Date.now()}`,
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    },
  };

  const data = await calendarFetch<{ id: string; hangoutLink?: string }>(
    "events?conferenceDataVersion=1&sendUpdates=all",
    { method: "POST", body: JSON.stringify(payload) },
  );

  return { eventId: data.id, meetLink: data.hangoutLink ?? "" };
}

export async function fetchTodayMeetings(): Promise<Array<{ start: string; title: string; meetLink?: string }>> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const data = await calendarFetch<{ items?: Array<{ summary?: string; start?: { dateTime?: string }; hangoutLink?: string }> }>(
    `events?singleEvents=true&orderBy=startTime&timeMin=${encodeURIComponent(start.toISOString())}&timeMax=${encodeURIComponent(end.toISOString())}`,
  );

  return (data.items ?? []).map((event) => ({
    start: event.start?.dateTime ?? "",
    title: event.summary ?? "Untitled meeting",
    meetLink: event.hangoutLink,
  }));
}
