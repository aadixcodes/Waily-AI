# Waily AI (Next.js App Router, Backend-Only)

Waily AI is a **production-oriented backend-only assistant** that operates entirely via WhatsApp.
There is **no UI**, **no frontend pages**, and **no dashboard**. All interactions happen through WhatsApp messages and API route handlers.

## Features

- WhatsApp Cloud API webhook (verification + incoming text handling)
- OpenAI intent detection and entity extraction
- Gmail integration (fetch unread, summarize, classify important, draft replies, send confirmation emails)
- Google Calendar integration (create meetings with Google Meet links, fetch today's meetings)
- Google Sheets integration (append new client records)
- Automated cron endpoint for important-email alerts every 5 minutes

## Project Structure

```txt
app/
  api/
    webhook/whatsapp/route.ts
    cron/check-emails/route.ts
  lib/
    env.ts
    googleAuth.ts
    whatsapp.ts
    gmail.ts
    calendar.ts
    sheets.ts
    openai.ts
  utils/
    intentParser.ts
    emailClassifier.ts
    meetingFormatter.ts
types/
  index.ts
```

## Environment Variables

Create a `.env.local` file from `.env.example`.

```bash
cp .env.example .env.local
```

Required variables:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REFRESH_TOKEN`
- `OPENAI_API_KEY`
- `WHATSAPP_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_VERIFY_TOKEN`
- `GOOGLE_SHEET_ID`
- `OWNER_WHATSAPP_NUMBER` (for automatic cron alerts)

## Google Cloud Setup

1. Create a Google Cloud project.
2. Enable APIs:
   - Gmail API
   - Google Calendar API
   - Google Sheets API
3. Configure OAuth consent screen.
4. Create OAuth2 credentials (Web application).
5. Generate a refresh token with scopes:
   - `https://www.googleapis.com/auth/gmail.modify`
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/spreadsheets`
6. Add OAuth credentials + refresh token to `.env.local`.

## WhatsApp Cloud API Setup

1. Create a Meta developer app and enable WhatsApp Cloud API.
2. Get your permanent access token (`WHATSAPP_TOKEN`).
3. Copy your phone number ID (`WHATSAPP_PHONE_NUMBER_ID`).
4. Configure webhook URL:
   - Verify endpoint: `GET /api/webhook/whatsapp`
   - Message endpoint: `POST /api/webhook/whatsapp`
5. Set verify token in Meta app and `.env.local` as `WHATSAPP_VERIFY_TOKEN`.
6. Subscribe to the `messages` webhook field.

## Local Development

```bash
npm run dev
```

Server starts on `http://localhost:3000`.

## Test Webhook Locally

Use ngrok (or similar) to expose local server:

```bash
ngrok http 3000
```

Set webhook URL in Meta to:

```txt
https://<your-ngrok-domain>/api/webhook/whatsapp
```

Verification request from Meta should succeed when `hub.verify_token` equals your `WHATSAPP_VERIFY_TOKEN`.

## Cron Automation (Every 5 Minutes)

Create a Vercel cron job for:

- Path: `/api/cron/check-emails`
- Schedule: `*/5 * * * *`

When important unread emails are found:
1. The system summarizes with OpenAI.
2. Sends summary to `OWNER_WHATSAPP_NUMBER`.

## Deployment to Vercel

1. Push repository to GitHub.
2. Import project into Vercel.
3. Set all environment variables in Vercel Project Settings.
4. Deploy.
5. Add cron configuration in `vercel.json` (optional) or via Vercel dashboard.

Example `vercel.json`:

```json
{
  "crons": [
    { "path": "/api/cron/check-emails", "schedule": "*/5 * * * *" }
  ]
}
```

## Command Capabilities via WhatsApp

The AI classifies WhatsApp instructions into:

- `schedule_meeting`
- `fetch_today_meetings`
- `summarize_emails`
- `reply_to_email`
- `add_todo`

Responses are always sent back via WhatsApp.

