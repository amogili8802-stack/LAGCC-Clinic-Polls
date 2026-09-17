// Normalizes phone numbers to digits-only (keeping a leading country code if
// present) so "(555) 123-4567", "555-123-4567" and "5551234567" all match.
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  // Drop a US country code prefix so 10 vs 11 digit entries still match.
  if (digits.length === 11 && digits.startsWith("1")) return digits.slice(1);
  return digits;
}

export function samePhone(a: string, b: string): boolean {
  const na = normalizePhone(a);
  const nb = normalizePhone(b);
  return na.length > 0 && na === nb;
}

// Formats a US number as +1XXXXXXXXXX for Twilio, if it looks like one.
// Falls back to the original string for anything else (already-international
// numbers, malformed input, etc.) rather than guessing.
export function toE164(raw: string): string {
  const digits = normalizePhone(raw);
  if (digits.length === 10) return `+1${digits}`;
  if (raw.trim().startsWith("+")) return raw.trim();
  return raw.trim();
}
