import { NextResponse } from "next/server";

/**
 * Contact endpoint.
 *
 * Validates server-side, rejects honeypot hits, rate-limits by IP, and — for
 * now — logs the enquiry and returns 200. No third-party form scripts.
 */

export const runtime = "nodejs";

type Payload = {
  name?: unknown;
  email?: unknown;
  website?: unknown;
  budget?: unknown;
  message?: unknown;
  consent?: unknown;
  /** Honeypot: real people never fill this in. */
  company?: unknown;
};

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;

/**
 * In-memory rate limit. Adequate for a single instance; behind several
 * instances or on a serverless platform this needs a shared store.
 */
const hits = new Map<string, number[]>();

function rateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((time) => now - time < WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);

  // Keep the map from growing without bound on a long-running process.
  if (hits.size > 5000) {
    for (const [entry, times] of hits) {
      if (times.every((time) => now - time >= WINDOW_MS)) hits.delete(entry);
    }
  }

  return recent.length > MAX_PER_WINDOW;
}

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
const asString = (value: unknown) => (typeof value === "string" ? value.trim() : "");

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unbekannt";

  if (rateLimited(ip)) {
    return NextResponse.json(
      { ok: false, error: "Zu viele Anfragen. Bitte versuch es in einer Minute erneut." },
      { status: 429 }
    );
  }

  let payload: Payload;
  try {
    payload = (await request.json()) as Payload;
  } catch {
    return NextResponse.json({ ok: false, error: "Ungültige Anfrage." }, { status: 400 });
  }

  // Honeypot: answer as if everything went fine, but do nothing.
  if (asString(payload.company)) {
    return NextResponse.json({ ok: true });
  }

  const name = asString(payload.name);
  const email = asString(payload.email);
  const message = asString(payload.message);
  const website = asString(payload.website);
  const budget = asString(payload.budget);
  const consent = payload.consent === true;

  const fields: Record<string, string> = {};
  if (name.length < 2) fields.name = "Bitte trag deinen Namen ein.";
  if (!isEmail(email)) fields.email = "Bitte trag eine gültige E-Mail-Adresse ein.";
  if (message.length < 10) fields.message = "Schreib uns kurz, worum es geht.";
  if (!consent) fields.consent = "Ohne deine Zustimmung dürfen wir die Anfrage nicht verarbeiten.";

  if (Object.keys(fields).length > 0) {
    return NextResponse.json({ ok: false, fields }, { status: 422 });
  }

  // TODO: connect email provider (Resend/SMTP).
  // Replace this block with the real delivery call, e.g.
  //   await resend.emails.send({ from, to, subject, text });
  // and keep the response shape unchanged so the form needs no edits.
  console.info("[AMW] Neue Anfrage", {
    name,
    email,
    website: website || null,
    budget: budget || null,
    length: message.length,
  });

  return NextResponse.json({ ok: true });
}
