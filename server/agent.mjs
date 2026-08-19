/**
 * J.A.R.V.I.S. — Agent
 *
 * Führt gesprochene oder getippte Aufträge auf diesem Rechner aus. Der
 * eigentliche Agent kommt aus dem Claude Agent SDK; hier liegt drumherum:
 *
 *   - ein Arbeitsordner, aus dem der Agent nicht herausarbeitet
 *   - eine Obergrenze für Schritte und Kosten
 *   - die Rückfrage im Browser, bevor etwas verändert wird
 *
 * Der Ablauf ist bewusst so gebaut, dass „nichts tun" der Standard ist:
 * Alles, was den Rechner verändert, braucht ein ausdrückliches Ja.
 */

import { randomUUID } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { humanError } from './errors.mjs';

export const WORKSPACE = process.env.JARVIS_WORKSPACE
  || path.join(os.homedir(), 'jarvis-workspace');

const MAX_TURNS = Number(process.env.JARVIS_AGENT_MAX_TURNS || 40);
const MAX_BUDGET_USD = Number(process.env.JARVIS_AGENT_BUDGET_USD || 2);
const PERMISSION_TIMEOUT_MS = Number(process.env.JARVIS_PERMISSION_TIMEOUT_MS || 120000);

/** Werkzeuge, die nur lesen — die fragen nicht jedes Mal nach. */
const READ_ONLY = new Set(
  (process.env.JARVIS_AUTO_ALLOW || 'Read,Glob,Grep,TodoWrite')
    .split(',').map((s) => s.trim()).filter(Boolean),
);

/** Was der Agent gar nicht erst versuchen soll. */
const DISALLOWED = [
  'Bash(sudo:*)',
  'Bash(rm -rf /:*)',
  'Bash(shutdown:*)',
  'Bash(reboot:*)',
  'Bash(mkfs:*)',
  'Bash(dd:*)',
];

const pending = new Map();   // Freigabe-ID → { resolve, timer }
const runs = new Map();      // Lauf-ID → AbortController

/** Kurzfassung eines Werkzeugaufrufs für die Rückfrage im Browser. */
export function describeTool(name, input) {
  if (!input || typeof input !== 'object') return '';
  const short = (v, n = 300) => String(v ?? '').slice(0, n);
  switch (name) {
    case 'Bash': return short(input.command);
    case 'Write': return short(input.file_path);
    case 'Edit':
    case 'NotebookEdit': return short(input.file_path);
    case 'Read': return short(input.file_path);
    case 'Glob': return short(input.pattern);
    case 'Grep': return short(input.pattern);
    case 'TodoWrite': return '';
    case 'WebFetch': return short(input.url);
    case 'WebSearch': return short(input.query);
    default: {
      try { return short(JSON.stringify(input)); } catch { return ''; }
    }
  }
}

/** Antwort des Nutzers auf eine Rückfrage. */
export function resolvePermission(id, approved) {
  const entry = pending.get(id);
  if (!entry) return false;
  pending.delete(id);
  clearTimeout(entry.timer);
  entry.resolve({
    approved: Boolean(approved),
    reason: approved ? 'vom Nutzer freigegeben' : 'vom Nutzer abgelehnt',
  });
  return true;
}

/** Laufenden Auftrag abbrechen. */
export function stopRun(runId) {
  const ctrl = runs.get(runId);
  if (!ctrl) return false;
  ctrl.abort();
  runs.delete(runId);
  return true;
}

export function activeRuns() {
  return runs.size;
}

/**
 * Einen Auftrag ausführen und den Fortschritt über `write` melden.
 *
 * @param {object}   opts
 * @param {string}   opts.prompt     Auftrag in normaler Sprache
 * @param {string}   [opts.sessionId] frühere Sitzung fortsetzen
 * @param {Function} opts.write      SSE-Sender: write(objekt)
 * @param {Function} opts.queryFn    Agent-Einstieg (für Tests austauschbar)
 */
export async function runAgent({ prompt, sessionId, write, queryFn }) {
  if (typeof queryFn !== 'function') {
    write({ type: 'error', message: 'Der Agent ist nicht eingerichtet (kein Einstiegspunkt übergeben).' });
    return;
  }

  try {
    await mkdir(WORKSPACE, { recursive: true });
  } catch (err) {
    write({ type: 'error', message: `Der Arbeitsordner ${WORKSPACE} lässt sich nicht anlegen: ${err?.message || err}` });
    return;
  }

  const runId = randomUUID();
  const session = sessionId || randomUUID();
  const ctrl = new AbortController();
  runs.set(runId, ctrl);

  write({ type: 'start', runId, sessionId: session, workspace: WORKSPACE });

  /**
   * Rückfrage an den Browser.
   *
   * Signatur und Rückgabewert stammen aus den Typdefinitionen des SDK
   * (`CanUseTool` in sdk.d.ts): (toolName, input, { signal }) und
   * { behavior: 'allow' } bzw. { behavior: 'deny', message }.
   */
  const canUseTool = async (toolName, input, options) => {
    const detail = describeTool(toolName, input);

    if (READ_ONLY.has(toolName)) {
      write({ type: 'tool', name: toolName, detail, auto: true });
      return { behavior: 'allow' };
    }

    const id = randomUUID();
    write({ type: 'permission', id, tool: toolName, detail });

    return new Promise((resolve) => {
      // Eigenes Merkmal statt eines Blicks in `pending`: resolvePermission
      // räumt den Eintrag bereits vor dem Auflösen weg.
      let settled = false;
      let timer = null;

      const finish = (allowed, reason) => {
        if (settled) return;
        settled = true;
        pending.delete(id);
        clearTimeout(timer);
        resolve(allowed ? { behavior: 'allow' } : { behavior: 'deny', message: reason });
      };

      timer = setTimeout(
        () => finish(false, 'Keine Antwort innerhalb der Wartezeit — abgelehnt.'),
        PERMISSION_TIMEOUT_MS,
      );

      pending.set(id, { resolve: (answer) => finish(answer.approved, answer.reason), timer });
      options?.signal?.addEventListener('abort', () => finish(false, 'Abgebrochen.'), { once: true });
    });
  };

  const options = {
    cwd: WORKSPACE,
    permissionMode: 'default',
    disallowedTools: DISALLOWED,
    canUseTool,
    maxTurns: MAX_TURNS,
    maxBudgetUsd: MAX_BUDGET_USD,
    abortController: ctrl,
    ...(sessionId ? { resume: session } : { sessionId: session }),
    systemPrompt: {
      type: 'preset',
      preset: 'claude_code',
      append: [
        'Du bist J.A.R.V.I.S. und arbeitest für eine Person, die dir meist zuspricht statt zu tippen.',
        'Fasse dich in deinen Antworten kurz — höchstens drei Sätze — denn sie werden laut vorgelesen.',
        'Kein Markdown, keine Aufzählungszeichen, keine Emojis in der Antwort.',
        'Sag am Ende in einem Satz, was du tatsächlich getan hast und wo das Ergebnis liegt.',
        'Wenn ein Auftrag unklar ist, frag nach, statt zu raten.',
      ].join(' '),
    },
  };

  let text = '';
  let cost = 0;
  let liveSession = session;
  let sawSomething = false;
  let failure = null;

  try {
    for await (const message of queryFn({ prompt, options })) {
      if (ctrl.signal.aborted) break;

      switch (message.type) {
        // Der Inhalt liegt unter message.message.content — wie bei der
        // Messages-API, nicht direkt am Ereignis.
        case 'assistant': {
          for (const block of message.message?.content || []) {
            if (block.type === 'text' && block.text) {
              sawSomething = true;
              text += block.text;
              write({ type: 'text', text: block.text });
            } else if (block.type === 'tool_use') {
              sawSomething = true;
              write({ type: 'tool', name: block.name, detail: describeTool(block.name, block.input) });
            }
          }
          if (message.error) failure = String(message.error?.message || message.error);
          break;
        }

        // Werkzeugergebnisse kommen als user-Nachricht zurück.
        case 'user': {
          for (const block of message.message?.content || []) {
            if (block.type === 'tool_result' && block.is_error) {
              const body = typeof block.content === 'string' ? block.content : JSON.stringify(block.content ?? '');
              write({ type: 'tool_error', detail: String(body).slice(0, 300) });
            }
          }
          break;
        }

        case 'system': {
          if (message.subtype === 'init' && message.session_id) liveSession = message.session_id;
          break;
        }

        // Abschluss des Laufs — hier stehen Kosten, Sitzung und Endtext.
        case 'result': {
          cost = message.total_cost_usd ?? cost;
          if (message.session_id) liveSession = message.session_id;
          if (message.result && !text) {
            text = String(message.result);
            sawSomething = true;
            write({ type: 'text', text });
          }
          if (message.is_error || message.subtype !== 'success') {
            failure = String(message.result || message.subtype || 'Der Auftrag ist fehlgeschlagen.');
          }
          break;
        }

        default:
          break;   // Statusereignisse interessieren die Oberfläche nicht
      }
    }

    if (failure) {
      write({ type: 'error', message: humanError(new Error(failure)) });
    } else if (!sawSomething) {
      // Kein Text, kein Werkzeug: fast immer fehlt der Zugang. Das als
      // „erledigt" zu melden wäre eine Lüge.
      write({
        type: 'error',
        message: 'Der Agent hat nichts ausgeführt. Meist fehlt der Zugang: ANTHROPIC_API_KEY in server/.env eintragen und den Dienst neu starten.',
      });
    } else {
      write({ type: 'done', sessionId: liveSession, text: text.trim(), costUsd: cost });
    }
  } catch (err) {
    if (ctrl.signal.aborted) write({ type: 'stopped' });
    else write({ type: 'error', message: humanError(err) });
  } finally {
    runs.delete(runId);
    // Offene Rückfragen dieses Laufs nicht hängen lassen.
    for (const [id, entry] of pending) {
      clearTimeout(entry.timer);
      entry.resolve({ approved: false, reason: 'Lauf beendet' });
      pending.delete(id);
    }
  }
}
