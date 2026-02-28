import { getEnv } from "./env";
import { getGoogleAccessToken } from "./googleAuth";
import type { ClientRecord } from "@/types";

export async function appendClientRecord(record: ClientRecord): Promise<void> {
  const accessToken = await getGoogleAccessToken();
  const spreadsheetId = getEnv("GOOGLE_SHEET_ID");

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Clients!A:D:append?valueInputOption=USER_ENTERED`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        values: [[record.name, record.phone, record.email, record.meetingDate]],
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Google Sheets append failed ${response.status}: ${await response.text()}`);
  }
}

