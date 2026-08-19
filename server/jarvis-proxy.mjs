/**
 * J.A.R.V.I.S. — lokaler Dienst
 *
 * Hält die Schlüssel auf dem Rechner statt im Browser und stellt drei Dinge
 * bereit, die eine Website allein nicht kann:
 *
 *   /api/chat    Gespräch mit Claude
 *   /api/speak   Sprachausgabe über ElevenLabs
 *   /api/agent   Aufträge, die wirklich etwas auf diesem Rechner tun
 *
 *   cp server/.env.example server/.env     # Schlüssel dort eintragen
 *   npm install --prefix server
 *   node server/jarvis-proxy.mjs
 *
 * Die Schlüssel können auch als Umgebungsvariablen gesetzt werden; gesetzte
 * Variablen haben Vorrang vor der Datei.
 */

import './env.mjs';   // muss zuerst stehen — lädt server/.env
import { createServer } from 'node:http';
import { Readable } from 'node:stream';
import Anthropic from '@anthropic-ai/sdk';
import { runAgent, resolvePermission, stopRun, WORKSPACE } from './agent.mjs';

const PORT = Number(process.env.PORT || 8787);
const MAX_BODY_BYTES = 256 * 1024;
const MAX_TOKENS_CAP = 2048;
const MAX_MESSAGES = 40;
const MAX_SPEAK_CHARS = 2000;
const ELEVEN_KEY = process.env.ELEVENLABS_API_KEY || '';

// Standardmäßig nur lokale Seiten — sonst könnte jede beliebige Website
// diesen Proxy und damit das Guthaben des Schlüssels benutzen.
const ALLOWED = (process.env.JARVIS_ALLOWED_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const client = new Anthropic();   // liest ANTHROPIC_API_KEY bzw. das `ant`-Profil

/** Effort gibt es nur auf den aktuellen Modellen — Haiku 4.5 lehnt es ab. */
const supportsEffort = (model) => /^claude-(opus-5|sonnet-5|fable-5|opus-4-[678])/.test(model);

function originAllowed(origin) {
  if (!origin || origin === 'null') return true;                 // file:// oder direkter Aufruf
  if (ALLOWED.length) return ALLOWED.includes(origin);
  return /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(origin);
}

function cors(res, origin) {
  res.setHeader('Access-Control-Allow-Origin', origin && origin !== 'null' ? origin : '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
  res.setHeader('Vary', 'Origin');
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error('body too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

/** Nimmt nur an, was die Messages-API auch akzeptiert. */
function sanitize(payload) {
  const model = typeof payload.model === 'string' && payload.model.startsWith('claude-')
    ? payload.model
    : 'claude-opus-5';

  const messages = Array.isArray(payload.messages) ? payload.messages : [];
  const clean = messages
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map((m) => ({ role: m.role, content: m.content.slice(0, 8000) }))
    .slice(-MAX_MESSAGES);

  if (!clean.length) throw new Error('no valid messages');
  if (clean[0].role !== 'user') clean.shift();
  if (!clean.length) throw new Error('conversation must start with a user message');

  return {
    model,
    messages: clean,
    system: typeof payload.system === 'string' ? payload.system.slice(0, 8000) : undefined,
    max_tokens: Math.min(Number(payload.max_tokens) || 1024, MAX_TOKENS_CAP),
  };
}

export function createJarvisServer(deps = {}) {
  return createServer(async (req, res) => {
  const origin = req.headers.origin;
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (!originAllowed(origin)) {
    res.writeHead(403, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: 'origin not allowed' }));
    return;
  }

  cors(res, origin);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (url.pathname === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({
      ok: true,
      claudeKey: Boolean(process.env.ANTHROPIC_API_KEY),
      elevenKey: Boolean(ELEVEN_KEY),
      workspace: WORKSPACE,
    }));
    return;
  }

  /* ---- Agent: Auftrag ausführen ---- */
  if (req.method === 'POST' && url.pathname === '/api/agent') {
    let ask;
    try {
      ask = JSON.parse(await readBody(req));
    } catch (err) {
      res.writeHead(400, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: String(err.message || err) }));
      return;
    }

    const prompt = String(ask.prompt || '').slice(0, 8000).trim();
    if (!prompt) {
      res.writeHead(400, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: 'prompt fehlt' }));
      return;
    }

    res.writeHead(200, {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
    });

    const write = (event) => {
      if (!res.writableEnded) res.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    await runAgent({
      prompt,
      sessionId: typeof ask.sessionId === 'string' && ask.sessionId ? ask.sessionId : undefined,
      write,
      queryFn: deps.agentQuery,
    });

    if (!res.writableEnded) {
      res.write('data: [DONE]\n\n');
      res.end();
    }
    return;
  }

  /* ---- Agent: Rückfrage beantworten ---- */
  if (req.method === 'POST' && url.pathname === '/api/agent/permit') {
    let ask = {};
    try { ask = JSON.parse(await readBody(req)); } catch { /* als leer behandeln */ }
    const ok = resolvePermission(String(ask.id || ''), Boolean(ask.approved));
    res.writeHead(ok ? 200 : 404, { 'content-type': 'application/json' });
    res.end(JSON.stringify(ok ? { ok: true } : { error: 'Rückfrage nicht gefunden oder abgelaufen' }));
    return;
  }

  /* ---- Agent: Lauf abbrechen ---- */
  if (req.method === 'POST' && url.pathname === '/api/agent/stop') {
    let ask = {};
    try { ask = JSON.parse(await readBody(req)); } catch { /* als leer behandeln */ }
    const ok = stopRun(String(ask.runId || ''));
    res.writeHead(ok ? 200 : 404, { 'content-type': 'application/json' });
    res.end(JSON.stringify(ok ? { ok: true } : { error: 'kein solcher Lauf' }));
    return;
  }

  /* ---- Sprachausgabe: ElevenLabs, Schlüssel bleibt hier ---- */
  if (req.method === 'POST' && url.pathname === '/api/speak') {
    if (!ELEVEN_KEY) {
      res.writeHead(503, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: 'ELEVENLABS_API_KEY ist auf dem Server nicht gesetzt' }));
      return;
    }

    let ask;
    try {
      ask = JSON.parse(await readBody(req));
    } catch (err) {
      res.writeHead(400, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: String(err.message || err) }));
      return;
    }

    const text = String(ask.text || '').slice(0, MAX_SPEAK_CHARS).trim();
    const voiceId = String(ask.voice_id || '').trim();
    const modelId = String(ask.model_id || 'eleven_multilingual_v2').trim();
    const format = /^[a-z0-9_]+$/.test(String(ask.output_format || '')) ? ask.output_format : 'mp3_44100_128';

    if (!text || !/^[A-Za-z0-9]{8,40}$/.test(voiceId) || !/^[a-z0-9_]{3,40}$/.test(modelId)) {
      res.writeHead(400, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: 'text, voice_id oder model_id fehlt bzw. ist ungültig' }));
      return;
    }

    try {
      const upstream = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=${encodeURIComponent(format)}`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'xi-api-key': ELEVEN_KEY },
          body: JSON.stringify({ text, model_id: modelId }),
        },
      );

      if (!upstream.ok) {
        const detail = (await upstream.text()).slice(0, 400);
        console.error('[jarvis-proxy] elevenlabs', upstream.status, detail);
        res.writeHead(upstream.status, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ error: `ElevenLabs HTTP ${upstream.status}`, detail }));
        return;
      }

      res.writeHead(200, {
        'content-type': upstream.headers.get('content-type') || 'audio/mpeg',
        'cache-control': 'no-store',
      });
      Readable.fromWeb(upstream.body).pipe(res);
    } catch (err) {
      console.error('[jarvis-proxy] speak', err?.message || err);
      res.writeHead(502, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: String(err?.message || 'speak failed') }));
    }
    return;
  }

  if (req.method !== 'POST' || url.pathname !== '/api/chat') {
    res.writeHead(404, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: 'not found' }));
    return;
  }

  let request;
  try {
    request = sanitize(JSON.parse(await readBody(req)));
  } catch (err) {
    res.writeHead(400, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: String(err.message || err) }));
    return;
  }

  res.writeHead(200, {
    'content-type': 'text/event-stream; charset=utf-8',
    'cache-control': 'no-cache, no-transform',
    connection: 'keep-alive',
  });

  const write = (event) => res.write(`data: ${JSON.stringify(event)}\n\n`);

  try {
    const params = {
      model: request.model,
      max_tokens: request.max_tokens,
      messages: request.messages,
      ...(request.system ? { system: request.system } : {}),
      // Kurze, gesprochene Antworten — niedriger Aufwand hält die Latenz klein.
      ...(supportsEffort(request.model) ? { output_config: { effort: 'low' } } : {}),
    };

    const stream = client.messages.stream(params);

    req.on('close', () => {
      try { stream.abort(); } catch { /* schon beendet */ }
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        write({ type: 'content_block_delta', delta: { type: 'text_delta', text: event.delta.text } });
      }
    }

    const final = await stream.finalMessage();
    if (final.stop_reason === 'refusal') {
      write({ type: 'content_block_delta', delta: { type: 'text_delta', text: '\n[Die Anfrage wurde abgelehnt.]' } });
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    console.error('[jarvis-proxy]', err?.message || err);
    const status = err?.status ? ` (HTTP ${err.status})` : '';
    write({ type: 'error', error: { message: `${err?.message || 'request failed'}${status}` } });
    res.end();
  }
  });
}

/** Nur starten, wenn die Datei direkt aufgerufen wurde — Tests importieren sie. */
if (process.env.JARVIS_NO_AUTOSTART !== '1') {
  const { query } = await import('@anthropic-ai/claude-agent-sdk');
  const server = createJarvisServer({ agentQuery: query });

  server.listen(PORT, () => {
    console.log('J.A.R.V.I.S.');
    console.log(`  KI      → http://localhost:${PORT}/api/chat`);
    console.log(`  Stimme  → http://localhost:${PORT}/api/speak`);
    console.log(`  Agent   → http://localhost:${PORT}/api/agent`);
    console.log(`  Ordner  → ${WORKSPACE}`);
    if (!process.env.ANTHROPIC_API_KEY) {
      console.log('Hinweis: ANTHROPIC_API_KEY ist nicht gesetzt — KI-Modus und Agent brauchen ihn.');
    }
    if (!ELEVEN_KEY) {
      console.log('Hinweis: ELEVENLABS_API_KEY ist nicht gesetzt — die eigene Stimme bleibt aus.');
    }
  });
}
