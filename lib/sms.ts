// Thin Twilio wrapper. When TWILIO_* env vars aren't set (e.g. local dev,
// or before the club has a Twilio account), messages are logged to the
// console instead of sent, so the rest of the app works without it.

let twilioClient: import("twilio").Twilio | null | undefined;

// Trimmed so a stray leading/trailing space pasted into an env var (which
// still reads as "present") doesn't silently produce an invalid credential.
function envVar(name: string): string {
  return (process.env[name] || "").trim();
}

function getClient() {
  if (twilioClient !== undefined) return twilioClient;

  const sid = envVar("TWILIO_ACCOUNT_SID");
  const token = envVar("TWILIO_AUTH_TOKEN");

  if (!sid || !token) {
    twilioClient = null;
    return twilioClient;
  }

  // Lazy import so the twilio SDK is never touched when unconfigured.
  const Twilio = require("twilio");
  twilioClient = new Twilio(sid, token);
  return twilioClient;
}

export type SmsResult = { to: string; ok: boolean; error?: string };

export async function sendSms(to: string, body: string): Promise<SmsResult> {
  const client = getClient();
  const from = envVar("TWILIO_FROM_NUMBER");

  if (!client || !from) {
    const missing = [
      !envVar("TWILIO_ACCOUNT_SID") && "TWILIO_ACCOUNT_SID",
      !envVar("TWILIO_AUTH_TOKEN") && "TWILIO_AUTH_TOKEN",
      !from && "TWILIO_FROM_NUMBER",
    ].filter(Boolean);
    console.log(`[SMS not configured — missing ${missing.join(", ")} — would send to ${to}]\n${body}`);
    return { to, ok: true };
  }

  try {
    await client.messages.create({ to, from, body });
    return { to, ok: true };
  } catch (err) {
    console.error(`Failed to send SMS to ${to}:`, err);
    return { to, ok: false, error: err instanceof Error ? err.message : "unknown error" };
  }
}

// Sends the same message to a list of phone numbers, deduping so a parent
// with multiple kids in the same session only gets one text.
export async function sendBulkSms(numbers: string[], body: string): Promise<SmsResult[]> {
  const unique = Array.from(new Set(numbers.map((n) => n.trim()).filter(Boolean)));
  return Promise.all(unique.map((n) => sendSms(n, body)));
}
