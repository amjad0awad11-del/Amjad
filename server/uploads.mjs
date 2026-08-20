/**
 * J.A.R.V.I.S. — Dateien annehmen
 *
 * Bilder, Videos und Dokumente landen im Arbeitsordner des Agenten, damit
 * er damit arbeiten kann. Der Browser schickt die reinen Bytes; Name und
 * Typ stehen im Kopf der Anfrage. Kein Multipart, kein Zwischenspeicher im
 * Arbeitsspeicher — die Daten laufen direkt auf die Platte.
 *
 * Zwei Dinge sind hier wichtig:
 *   - der Name kommt vom Browser und darf deshalb nirgendwo hinzeigen
 *   - eine Datei darf den Rechner nicht vollschreiben
 */

import { createWriteStream } from 'node:fs';
import { mkdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Transform } from 'node:stream';

/** 200 MB reicht für ein Handyvideo und bleibt weit unter jeder Platte. */
export const MAX_UPLOAD_BYTES = Number(process.env.JARVIS_MAX_UPLOAD_BYTES || 200 * 1024 * 1024);

/** Unterordner im Arbeitsordner — so bleibt das Hochgeladene beisammen. */
export const UPLOAD_DIR = 'uploads';

/** Grössen so schreiben, wie sie jemand vorliest — nicht „0 MB". */
export function prettySize(bytes) {
  if (bytes >= 1024 * 1024) return `${Math.round(bytes / 1024 / 1024)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} bytes`;
}

/**
 * Aus einem beliebigen Namen einen machen, der sicher im Arbeitsordner liegt.
 *
 * Es zählt nur der letzte Teil des Pfads, und davon nur harmlose Zeichen.
 * „../../.ssh/id_rsa" wird so zu „id_rsa".
 */
export function safeName(raw) {
  const base = path.basename(String(raw || '').replace(/\\/g, '/')).trim();
  const cleaned = base
    .replace(/[^\p{L}\p{N}._ -]/gu, '')
    .replace(/\s+/g, ' ')
    .replace(/^[.\s]+/, '')          // keine versteckten Dateien, kein „.."
    .slice(0, 120)
    .trim();
  if (!cleaned || cleaned === '.' || cleaned === '..') return '';
  return cleaned;
}

/** Endung aus dem gemeldeten Typ raten, wenn der Name keine hat. */
const EXT_FOR_TYPE = {
  'image/jpeg': '.jpg', 'image/png': '.png', 'image/gif': '.gif',
  'image/webp': '.webp', 'image/heic': '.heic', 'image/svg+xml': '.svg',
  'video/mp4': '.mp4', 'video/quicktime': '.mov', 'video/webm': '.webm',
  'audio/mpeg': '.mp3', 'audio/wav': '.wav', 'audio/mp4': '.m4a',
  'application/pdf': '.pdf', 'text/plain': '.txt', 'text/csv': '.csv',
  'application/json': '.json', 'application/zip': '.zip',
};

/** Einen freien Namen finden, statt etwas zu überschreiben. */
async function freeName(dir, name) {
  const ext = path.extname(name);
  const stem = name.slice(0, name.length - ext.length) || 'file';
  for (let i = 0; i < 500; i++) {
    const candidate = i === 0 ? name : `${stem}-${i}${ext}`;
    try {
      await stat(path.join(dir, candidate));
    } catch {
      return candidate;   // gibt es noch nicht
    }
  }
  return `${stem}-${Date.now()}${ext}`;
}

/**
 * Eine Datei aus der Anfrage in den Arbeitsordner schreiben.
 *
 * @param {import('node:http').IncomingMessage} req
 * @param {object} opts
 * @param {string} opts.workspace  Arbeitsordner des Agenten
 * @param {string} opts.name       gewünschter Dateiname (aus dem Kopf)
 * @param {string} [opts.type]     gemeldeter Inhaltstyp
 * @returns {Promise<{name: string, path: string, relative: string, size: number, type: string}>}
 */
export async function receiveUpload(req, { workspace, name, type = '' }) {
  let clean = safeName(name);
  if (!clean) clean = 'upload';
  if (!path.extname(clean) && EXT_FOR_TYPE[type]) clean += EXT_FOR_TYPE[type];

  const dir = path.join(workspace, UPLOAD_DIR);
  await mkdir(dir, { recursive: true });

  const finalName = await freeName(dir, clean);
  const target = path.join(dir, finalName);

  // Doppelter Boden: der Pfad muss im Arbeitsordner liegen, egal was
  // safeName durchgelassen hat.
  const resolved = path.resolve(target);
  if (!resolved.startsWith(path.resolve(dir) + path.sep)) {
    throw new Error('The file name points outside the working folder.');
  }

  let size = 0;
  const limit = new Transform({
    transform(chunk, _enc, done) {
      size += chunk.length;
      if (size > MAX_UPLOAD_BYTES) {
        done(new Error(`The file is larger than ${prettySize(MAX_UPLOAD_BYTES)}.`));
        return;
      }
      done(null, chunk);
    },
  });

  try {
    await pipeline(req, limit, createWriteStream(resolved));
  } catch (err) {
    // Halbe Datei nicht liegen lassen.
    await rm(resolved, { force: true }).catch(() => {});
    throw err;
  }

  if (!size) {
    await rm(resolved, { force: true }).catch(() => {});
    throw new Error('The file was empty.');
  }

  return {
    name: finalName,
    path: resolved,
    relative: path.join(UPLOAD_DIR, finalName),
    size,
    type: String(type || '').slice(0, 100),
  };
}
