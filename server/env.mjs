/**
 * Lädt `server/.env`, falls vorhanden — damit Schlüssel an einem Ort liegen,
 * der nie im Repository landet, und nicht bei jedem Start neu exportiert
 * werden müssen.
 *
 * Muss als erster Import stehen: Geschwister-Module lesen ihre Werte beim
 * Laden aus, und ES-Module werden in Reihenfolge der Imports ausgewertet.
 */

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const file = process.env.JARVIS_ENV_FILE || path.join(here, '.env');

/** Sparsamer Ersatz für ältere Node-Versionen ohne process.loadEnvFile. */
function parseInto(text) {
  for (const rawLine of text.replace(/^\uFEFF/, '').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    // Bereits gesetzte Umgebungsvariablen haben Vorrang.
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

if (existsSync(file)) {
  try {
    if (typeof process.loadEnvFile === 'function') process.loadEnvFile(file);
    else parseInto(readFileSync(file, 'utf8'));
    console.log(`Schlüssel aus ${file} geladen.`);
  } catch (err) {
    // Weigert sich der eingebaute Leser, nicht einfach aufgeben — sonst
    // startet der Dienst ohne Schlüssel und niemand weiß warum.
    try {
      parseInto(readFileSync(file, 'utf8'));
      console.log(`Schlüssel aus ${file} geladen (Ersatzleser).`);
    } catch (err2) {
      console.warn(`Konnte ${file} nicht lesen: ${err2?.message || err2}`);
    }
  }
}
