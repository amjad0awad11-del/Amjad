/**
 * J.A.R.V.I.S. — den Anthropic-Schlüssel aus der Oberfläche setzen.
 *
 * Bisher führte der einzige Weg über einen Texteditor und eine Datei, die
 * man erst finden muss. Das ist genau die Stelle, an der es reihenweise
 * schiefgeht: ein Leerzeichen zu viel, ein Zeilenende aus Windows, die
 * falsche Datei, oder der Dienst läuft noch mit dem alten Wert weiter.
 *
 * Hier steht deshalb der andere Weg: der Schlüssel kommt aus dem Browser,
 * wird geprüft, in `server/.env` geschrieben und sofort im laufenden Dienst
 * gesetzt — ohne Neustart.
 *
 * Erreichbar ist das nur über 127.0.0.1; der Dienst horcht nirgendwo sonst.
 */

import { readFileSync, writeFileSync, existsSync, chmodSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const ENV_FILE = process.env.JARVIS_ENV_FILE || path.join(HERE, '.env');

/** Wie ein Anthropic-Schlüssel aussieht. Grob, aber es fängt Tippfehler. */
const SHAPE = /^sk-ant-[A-Za-z0-9_-]{20,}$/;

/**
 * Prüft einen Schlüssel und sagt bei Ablehnung, was daran nicht stimmt.
 *
 * @returns {{ok: true, key: string} | {ok: false, why: string}}
 */
export function checkKey(raw) {
  // Erst putzen: Leerzeichen, Anführungszeichen und ein Zeilenende aus
  // Windows kleben beim Kopieren gern mit dran und machen den Schlüssel
  // unbrauchbar, ohne dass man ihnen etwas ansieht.
  const key = String(raw ?? '')
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/\s+/g, '');

  if (!key) return { ok: false, why: 'The field was empty.' };
  if (key.startsWith('ANTHROPIC_API_KEY')) {
    return { ok: false, why: 'Paste only the key itself, without "ANTHROPIC_API_KEY=" in front of it.' };
  }
  if (!key.startsWith('sk-ant-')) {
    return { ok: false, why: 'An Anthropic key starts with "sk-ant-". This does not.' };
  }
  if (!SHAPE.test(key)) {
    return { ok: false, why: 'That looks like an incomplete key — copy the whole thing.' };
  }
  return { ok: true, key };
}

/**
 * Den Schlüssel in `server/.env` ablegen und im laufenden Dienst setzen.
 *
 * Andere Zeilen der Datei bleiben, wie sie sind — dort steht unter Umständen
 * der ElevenLabs-Schlüssel, und der geht niemanden verloren, nur weil hier
 * einer gesetzt wird.
 */
export function saveKey(name, value) {
  const line = `${name}=${value}`;
  let text = '';

  if (existsSync(ENV_FILE)) {
    try { text = readFileSync(ENV_FILE, 'utf8'); } catch { text = ''; }
  }

  const lines = text.replace(/^﻿/, '').split(/\r?\n/);
  let replaced = false;
  const next = lines.map((l) => {
    if (new RegExp(`^\\s*${name}\\s*=`).test(l)) {
      replaced = true;
      return line;
    }
    return l;
  });

  if (!replaced) {
    while (next.length && next[next.length - 1].trim() === '') next.pop();
    next.push(line);
  }

  writeFileSync(ENV_FILE, `${next.join('\n').replace(/\n+$/, '')}\n`, 'utf8');
  // Auf allem, was Rechte kennt: nur der Besitzer darf hineinsehen.
  try { chmodSync(ENV_FILE, 0o600); } catch { /* unter Windows nicht nötig */ }

  process.env[name] = value;
  return ENV_FILE;
}

/** Einen Schlüssel wieder entfernen — aus der Datei und aus dem Dienst. */
export function clearKey(name) {
  if (existsSync(ENV_FILE)) {
    try {
      const text = readFileSync(ENV_FILE, 'utf8').replace(/^﻿/, '');
      const kept = text.split(/\r?\n/).filter((l) => !new RegExp(`^\\s*${name}\\s*=`).test(l));
      writeFileSync(ENV_FILE, `${kept.join('\n').replace(/\n+$/, '')}\n`, 'utf8');
    } catch { /* dann bleibt die Datei eben, wie sie ist */ }
  }
  delete process.env[name];
}

/**
 * Nachsehen, ob der Schlüssel wirklich angenommen wird.
 *
 * Ein Schlüssel in der richtigen Form kann trotzdem widerrufen sein. Das
 * hier einmal zu fragen ist billiger, als es den Nutzer beim ersten Auftrag
 * herausfinden zu lassen.
 */
export async function verifyKey(key, fetchImpl = fetch) {
  // Dieselbe Variable, die auch das Anthropic-SDK kennt: wer hinter einem
  // eigenen Zugang sitzt, setzt sie ohnehin, und die Prüfung soll dann
  // dorthin gehen und nicht ins Leere.
  const base = (process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com').replace(/\/+$/, '');
  try {
    const res = await fetchImpl(`${base}/v1/models?limit=1`, {
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) return { ok: true };
    if (res.status === 401 || res.status === 403) {
      return { ok: false, why: 'Anthropic rejected the key. It may have been revoked — make a new one.' };
    }
    return { ok: false, why: `Anthropic answered with ${res.status}.`, soft: true };
  } catch {
    // Kein Netz heisst nicht, dass der Schlüssel falsch ist. Also behalten
    // und es sagen, statt ihn wegzuwerfen.
    return { ok: false, why: 'Could not reach Anthropic to check the key. It has been saved anyway.', soft: true };
  }
}
