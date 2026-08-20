/**
 * J.A.R.V.I.S. — Connectors
 *
 * Ein Connector ist ein MCP-Server: ein kleines Programm, das dem Agenten
 * zusätzliche Werkzeuge gibt. Damit reicht J.A.R.V.I.S. über den eigenen
 * Arbeitsordner hinaus — ein Ordner auf der Platte, eine Website, ein
 * Gedächtnis, das einen Neustart überlebt.
 *
 * Was eingeschaltet ist, steht in server/connectors.json. Die Datei gehört
 * dem Nutzer; hier wird sie nur gelesen und geschrieben. Schlüssel, die ein
 * Connector braucht, bleiben darin und verlassen den Rechner nie.
 *
 * Wichtig: eingeschaltet heisst nicht freigegeben. Jedes Werkzeug eines
 * Connectors läuft durch dieselbe Rückfrage wie alles andere — der Agent
 * fragt, bevor er es benutzt.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));

/**
 * Wo die Datei liegt — bei jedem Zugriff frisch gelesen, nicht einmal beim
 * Laden festgehalten. Sonst entscheidet die Reihenfolge der Importe darüber,
 * welche Datei gemeint ist, und ein Test schreibt in die echte.
 */
export function configPath() {
  return process.env.JARVIS_CONNECTORS || path.join(HERE, 'connectors.json');
}

/**
 * Was mitgeliefert wird.
 *
 * Alle vier sind veröffentlichte Pakete; `npx` lädt sie beim ersten Start
 * selbst. `needs` beschreibt die Felder, die im Browser abgefragt werden —
 * ohne ausgefüllte Pflichtfelder bleibt ein Connector aus.
 */
export const CATALOGUE = [
  {
    id: 'files',
    label: 'Your files',
    blurb: 'Read and write in one folder you choose — your Documents or Desktop, not just the working folder.',
    needs: [{
      key: 'folder',
      label: 'Folder',
      required: true,
      placeholder: path.join(os.homedir(), 'Documents'),
      hint: 'The agent may only touch this folder and what is inside it.',
    }],
    build: (s) => ({
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', s.folder],
    }),
  },
  {
    id: 'browser',
    label: 'A real browser',
    blurb: 'Open pages, click, fill in forms and take screenshots. This is what lets it work inside a site like Shopify or Canva.',
    needs: [],
    build: () => ({
      command: 'npx',
      args: ['-y', '@playwright/mcp@latest'],
    }),
  },
  {
    id: 'memory',
    label: 'Long memory',
    blurb: 'Remembers people, projects and decisions between sessions, instead of starting fresh every time.',
    needs: [],
    build: () => ({
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-memory'],
    }),
  },
  {
    id: 'thinking',
    label: 'Step-by-step thinking',
    blurb: 'Works a long job through in order rather than answering off the top of its head. Slower, steadier.',
    needs: [],
    build: () => ({
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-sequential-thinking'],
    }),
  },
];

const byId = new Map(CATALOGUE.map((c) => [c.id, c]));

/** Leere Vorgabe — jeder Connector aus, nichts eingetragen. */
const EMPTY = { connectors: {}, custom: [] };

export async function readConfig() {
  try {
    const raw = await readFile(configPath(), 'utf8');
    const parsed = JSON.parse(raw);
    return {
      connectors: parsed.connectors && typeof parsed.connectors === 'object' ? parsed.connectors : {},
      custom: Array.isArray(parsed.custom) ? parsed.custom : [],
    };
  } catch {
    return { ...EMPTY };   // keine Datei, kaputte Datei → alles aus
  }
}

export async function writeConfig(config) {
  const clean = {
    connectors: config.connectors && typeof config.connectors === 'object' ? config.connectors : {},
    custom: Array.isArray(config.custom) ? config.custom : [],
  };
  const file = configPath();
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(clean, null, 2) + '\n', 'utf8');
  return clean;
}

/** Fehlt ein Pflichtfeld, ist der Connector nicht benutzbar. */
export function missingFields(entry, settings = {}) {
  return (entry.needs || [])
    .filter((f) => f.required && !String(settings[f.key] || '').trim())
    .map((f) => f.key);
}

/**
 * Was der Browser anzeigt: der Katalog plus der Zustand jedes Eintrags.
 * Werte von Feldern, die wie ein Schlüssel aussehen, werden dabei nicht
 * mitgeschickt — sie bleiben auf dem Rechner.
 */
export async function listConnectors(config) {
  const { connectors, custom } = config || await readConfig();
  const items = CATALOGUE.map((entry) => {
    const saved = connectors[entry.id] || {};
    const settings = saved.settings || {};
    const missing = missingFields(entry, settings);
    return {
      id: entry.id,
      label: entry.label,
      blurb: entry.blurb,
      needs: entry.needs,
      enabled: Boolean(saved.enabled) && !missing.length,
      wanted: Boolean(saved.enabled),
      missing,
      // Geheimes nur als „ist gesetzt", alles andere im Klartext, damit
      // der Nutzer seinen Ordner im Feld wiedersieht.
      settings: Object.fromEntries((entry.needs || []).map((f) => [
        f.key,
        f.secret ? (settings[f.key] ? '••••••••' : '') : (settings[f.key] || ''),
      ])),
    };
  });

  return {
    items,
    custom: custom.map((c) => ({ name: c.name, kind: c.url ? 'url' : 'command', enabled: c.enabled !== false })),
  };
}

/**
 * Die Server bauen, die der Agent bekommt.
 *
 * @returns {Promise<{mcpServers: object, names: string[]}>}
 */
export async function buildMcpServers(config) {
  const { connectors, custom } = config || await readConfig();
  const mcpServers = {};
  const names = [];

  for (const entry of CATALOGUE) {
    const saved = connectors[entry.id];
    if (!saved?.enabled) continue;
    const settings = saved.settings || {};
    if (missingFields(entry, settings).length) continue;   // unvollständig → aus
    try {
      mcpServers[entry.id] = entry.build(settings);
      names.push(entry.id);
    } catch { /* dieser Connector eben nicht */ }
  }

  // Eigene Einträge: entweder ein Programm oder eine Adresse.
  for (const item of custom) {
    if (!item || item.enabled === false) continue;
    const name = String(item.name || '').replace(/[^a-z0-9_-]/gi, '').slice(0, 40);
    if (!name || mcpServers[name]) continue;
    if (item.url) {
      const type = item.type === 'sse' ? 'sse' : 'http';
      mcpServers[name] = {
        type,
        url: String(item.url),
        ...(item.headers && typeof item.headers === 'object' ? { headers: item.headers } : {}),
      };
      names.push(name);
    } else if (item.command) {
      mcpServers[name] = {
        command: String(item.command),
        ...(Array.isArray(item.args) ? { args: item.args.map(String) } : {}),
        ...(item.env && typeof item.env === 'object' ? { env: item.env } : {}),
      };
      names.push(name);
    }
  }

  return { mcpServers, names };
}

/**
 * Einen Katalog-Eintrag ein- oder ausschalten und seine Felder setzen.
 * Ein Feld, das als „••••••••" zurückkommt, ist unverändert — dann bleibt
 * der gespeicherte Wert stehen, statt ihn mit Punkten zu überschreiben.
 */
export async function updateConnector(id, { enabled, settings } = {}) {
  const entry = byId.get(id);
  if (!entry) throw new Error(`There is no connector called "${id}".`);

  const config = await readConfig();
  const before = config.connectors[id] || {};
  const merged = { ...(before.settings || {}) };

  for (const field of entry.needs || []) {
    const incoming = settings?.[field.key];
    if (incoming === undefined) continue;
    if (field.secret && /^•+$/.test(String(incoming))) continue;   // unverändert
    merged[field.key] = String(incoming).slice(0, 500);
  }

  config.connectors[id] = {
    enabled: enabled === undefined ? Boolean(before.enabled) : Boolean(enabled),
    settings: merged,
  };

  await writeConfig(config);
  return listConnectors(config);
}
