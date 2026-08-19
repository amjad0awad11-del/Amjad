/* =========================================================
   J.A.R.V.I.S. — Sprachassistent im Browser
   Kein Build-Schritt, keine Abhängigkeiten.

   Aufbau
   ------
   1. Speicher & Zustand      2. Sprachtexte (DE/EN)
   3. Hilfsfunktionen         4. Audio (Töne + Visualizer)
   5. Sprachausgabe (TTS)     6. Spracherkennung (STT)
   7. Fähigkeiten (Skills)    8. KI-Modus (Claude)
   9. Oberfläche & Start
   ========================================================= */
(() => {
  'use strict';

  /* =======================================================
     1. Speicher & Zustand
     ======================================================= */

  const KEY = {
    settings: 'jarvis.settings.v1',
    memory: 'jarvis.memory.v1',
  };

  const DEFAULT_SETTINGS = {
    lang: 'de-DE',
    voiceURI: '',
    rate: 1,
    pitch: 1,
    wake: false,
    speak: true,
    sfx: true,
    voice: {
      engine: 'elevenlabs',                           // browser | elevenlabs
      mode: 'proxy',                                  // proxy | direct
      proxyUrl: 'http://localhost:8787/api/speak',
      apiKey: '',
      voiceId: 'L1aJrPa7pLJEyYlh3Ilq',
      model: 'eleven_multilingual_v2',
    },
    agent: {
      enabled: false,
      url: 'http://localhost:8787/api/agent',
    },
    ai: {
      mode: 'off',                                    // off | proxy | direct
      proxyUrl: 'http://localhost:8787/api/chat',
      apiKey: '',
      model: 'claude-opus-5',
      persona: '',
    },
  };

  const DEFAULT_MEMORY = {
    tasks: [],     // { id, text, done }
    notes: [],     // { id, text, at }
    timers: [],    // { id, label, at, kind: 'timer' | 'reminder' }
    city: null,    // zuletzt genutzter Ort für das Wetter
    history: [],   // Gesprächsverlauf für den KI-Modus
  };

  const store = {
    read(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) return JSON.parse(JSON.stringify(fallback));
        const parsed = JSON.parse(raw);
        return Object.assign(JSON.parse(JSON.stringify(fallback)), parsed);
      } catch {
        return JSON.parse(JSON.stringify(fallback));
      }
    },
    write(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Speicher voll / privat */ }
    },
    drop(key) {
      try { localStorage.removeItem(key); } catch { /* egal */ }
    },
  };

  const settings = store.read(KEY.settings, DEFAULT_SETTINGS);
  settings.ai = Object.assign({}, DEFAULT_SETTINGS.ai, settings.ai || {});
  settings.voice = Object.assign({}, DEFAULT_SETTINGS.voice, settings.voice || {});
  settings.agent = Object.assign({}, DEFAULT_SETTINGS.agent, settings.agent || {});
  const memory = store.read(KEY.memory, DEFAULT_MEMORY);

  const state = {
    listening: false,     // Erkennung läuft
    speaking: false,      // TTS läuft
    thinking: false,      // Antwort wird erzeugt
    wantListen: false,    // Nutzer möchte zuhören (Auto-Neustart)
    booted: false,
    micAllowed: null,     // null = unbekannt
    voices: [],
    lastReply: '',
    ignoreUntil: 0,       // Rückkopplung vermeiden
  };

  const isDE = () => settings.lang.startsWith('de');

  /**
   * In einem eingebetteten Rahmen (etwa einer Vorschau) gibt der Browser das
   * Mikrofon nur frei, wenn die einbettende Seite es ausdrücklich erlaubt.
   * Tut sie das nicht, hilft keine Einstellung im Browser — deshalb wird das
   * hier erkannt und anders erklärt.
   */
  const EMBEDDED = (() => {
    try { return window.self !== window.top; } catch { return true; }
  })();

  /** Mikrofon gibt es nur über https oder auf localhost. */
  const SECURE = window.isSecureContext !== false;

  /**
   * Läuft die Seite von einem fremden Server (etwa GitHub Pages), kann sie
   * den Dienst auf localhost nicht erreichen — der Browser lässt solche
   * Anfragen von einer https-Seite nicht zu. KI-Modus über Proxy, Agent und
   * die Proxy-Stimme sind dort also nicht nur „aus", sondern unmöglich.
   */
  const LOCAL_OK = (() => {
    const h = window.location.hostname;
    if (!h || h === 'localhost' || h === '127.0.0.1' || h === '[::1]' || h === '::1') return true;
    return window.location.protocol !== 'https:';
  })();

  /* =======================================================
     2. Sprachtexte
     ======================================================= */

  const I18N = {
    de: {
      brandSub: 'Just A Rather Very Intelligent System',
      statusIdle: 'Bereit',
      statusListen: 'Ich höre …',
      statusThink: 'Ich denke nach …',
      statusSpeak: 'Antwort läuft',
      statusError: 'Fehler',
      logTitle: 'Protokoll',
      dashTitle: 'Systemübersicht',
      export: 'Export',
      clear: 'Leeren',
      stop: 'Stopp',
      close: 'Schließen',
      save: 'Speichern',
      resetAll: 'Alles zurücksetzen',
      settings: 'Einstellungen',
      helpTitle: 'Was J.A.R.V.I.S. kann',
      tapToTalk: 'Tippen zum Sprechen',
      listening: 'Ich höre zu …',
      thinking: 'Einen Moment …',
      wakeArmed: 'Wortwächter aktiv — sag „Jarvis“',
      cardTime: 'Zeit', cardWeather: 'Wetter', cardSystem: 'System',
      cardTasks: 'Aufgaben', cardNotes: 'Notizen', cardTimers: 'Timer & Erinnerungen',
      sysNet: 'Netz', sysBattery: 'Akku', sysMic: 'Mikrofon', sysAI: 'KI-Modus',
      tasksEmpty: 'Keine Aufgaben. Sag: „Füge Aufgabe … hinzu“',
      notesEmpty: 'Keine Notizen. Sag: „Notiere …“',
      timersEmpty: 'Nichts geplant. Sag: „Timer 5 Minuten“',
      weatherAsk: 'Frag: „Wie ist das Wetter?“',
      composerPh: 'Befehl eingeben … z. B. „Wie spät ist es?“',
      setLang: 'Sprache', setVoice: 'Systemstimme', setRate: 'Tempo', setPitch: 'Tonhöhe',
      voiceEngine: 'Sprachausgabe über', voiceBrowser: 'Systemstimme des Browsers',
      voiceEleven: 'ElevenLabs (eigene Stimme)', voiceKey: 'ElevenLabs-Schlüssel',
      voiceId: 'Stimm-ID', voiceModel: 'Stimm-Modell', voiceTest: 'Stimme testen',
      voiceSample: 'Systeme bereit. So klinge ich ab jetzt.', sysVoice: 'Stimme',
      sysAgent: 'Agent', agentTitle: 'Agent — Aufträge ausführen',
      agentIntro: 'Mit eingeschaltetem Agenten kann J.A.R.V.I.S. auf diesem Rechner wirklich etwas tun: Dateien anlegen, Projekte bauen, Befehle ausführen. Alles, was etwas verändert, fragt vorher nach.',
      agentOn: 'Agent einschalten', agentOnHint: 'Braucht den lokalen Dienst — ohne ihn passiert nichts',
      agentUrl: 'Agent-Adresse', agentRunning: 'Auftrag läuft', agentStop: 'Abbrechen',
      agentAsk: 'Darf ich das ausführen?', agentAllow: 'Erlauben', agentDeny: 'Ablehnen',
      agentAllowed: 'Freigegeben.', agentDenied: 'Abgelehnt.', agentStopped: 'Auftrag abgebrochen.',
      agentAuto: 'gelesen', agentDone: 'Auftrag erledigt.',
      agentOffline: 'Der Agent ist nicht erreichbar. Läuft der lokale Dienst? (node server/jarvis-proxy.mjs)',
      agentSpoken: 'Ich frage kurz nach: ',
      fillerHint: 'Wobei kann ich helfen?',
      remoteNotice: 'Diese Seite läuft im Netz, nicht auf deinem Rechner. Alles Eingebaute funktioniert hier — Zeit, Timer, Aufgaben, Notizen, Rechnen, Umrechnen. KI-Modus, Agent und die eigene Stimme brauchen den Dienst auf deinem Rechner und lassen sich hier nicht einschalten.',
      remoteUnknown: 'Dafür habe ich keinen eingebauten Befehl — und freie Fragen kann ich auf dieser Seite nicht beantworten, dafür fehlt der Dienst auf deinem Rechner. Was hier geht: „Wie spät ist es?", „Timer 10 Minuten", „Was ist 17 mal 23?", „Füge Aufgabe … hinzu", „Notiere …", „10 km in Meilen". Die ganze Liste zeigt „Hilfe".',
      remoteSetting: 'Auf dieser Online-Seite nicht verfügbar — dafür läuft der Dienst auf dem eigenen Rechner.',
      setWake: 'Wortwächter', setWakeHint: 'Dauerhaft zuhören und nur auf „Jarvis“ reagieren',
      setSpeak: 'Sprachausgabe', setSpeakHint: 'Antworten laut vorlesen',
      setSfx: 'Signaltöne', setSfxHint: 'Kurze Töne bei Start, Ende und Alarm',
      aiTitle: 'KI-Modus (Claude)',
      aiIntro: 'Ohne KI-Modus beantwortet J.A.R.V.I.S. alle eingebauten Befehle lokal. Mit KI-Modus gehen freie Fragen an die Claude-API.',
      aiConn: 'Verbindung', aiOff: 'Aus — nur lokale Befehle',
      aiProxy: 'Lokaler Proxy (empfohlen)', aiDirect: 'Direkt aus dem Browser (Schlüssel sichtbar)',
      aiProxyUrl: 'Proxy-Adresse', aiKey: 'API-Schlüssel', aiModel: 'Modell', aiPersona: 'Charakter',
      aiKeyWarn: 'Achtung: Der Schlüssel liegt dann im Browser-Speicher dieses Geräts und wird direkt an api.anthropic.com gesendet. Nur für lokale, private Nutzung.',

      // Boot
      bootLines: [
        'Initialisiere Kern …',
        'Lade Sprachmodule …',
        'Kalibriere Audioeingang …',
        'Verbinde Systemdienste …',
        'Alle Systeme bereit.',
      ],
      bootEnter: 'System starten',
      greetBoot: 'Alle Systeme online. Wie kann ich helfen?',

      // Antworten
      you: 'Du', me: 'J.A.R.V.I.S.', sys: 'System',
      unknown: 'Das habe ich nicht verstanden. Sag „Hilfe“ für eine Liste der Befehle.',
      unknownAI: 'Dafür habe ich keinen eingebauten Befehl. Schalte den KI-Modus in den Einstellungen ein, dann beantworte ich auch freie Fragen.',
      ok: 'Erledigt.',
      micDenied: 'Ich habe keinen Zugriff auf das Mikrofon. Bitte erlaube den Zugriff in den Browser-Einstellungen — meist über das Schloss-Symbol links in der Adresszeile.',
      micEmbedded: 'Hier ist die Seite in ein anderes Fenster eingebettet, und darin sperrt der Browser das Mikrofon grundsätzlich — daran ändert keine Einstellung etwas. Öffne die Seite in einem eigenen Tab, dann geht das Sprechen. Tippen funktioniert hier aber ganz normal.',
      micInsecure: 'Das Mikrofon gibt der Browser nur über eine gesicherte Verbindung frei (https oder localhost). Tippen funktioniert trotzdem.',
      micMissing: 'Dieser Browser unterstützt keine Spracherkennung. Nutze am besten Chrome oder Edge — die Texteingabe funktioniert aber überall.',
      ttsMissing: 'Dieser Browser kann nicht sprechen. Ich antworte weiterhin schriftlich.',
      offline: 'Dafür brauche ich eine Internetverbindung.',
      netError: 'Die Anfrage ist fehlgeschlagen.',
      saved: 'Einstellungen gespeichert.',
      resetDone: 'Alles zurückgesetzt.',
      copied: 'In die Zwischenablage kopiert.',
      langSet: 'Sprache auf Deutsch gestellt.',
      cleared: 'Protokoll geleert.',
    },

    en: {
      brandSub: 'Just A Rather Very Intelligent System',
      statusIdle: 'Ready',
      statusListen: 'Listening …',
      statusThink: 'Thinking …',
      statusSpeak: 'Speaking',
      statusError: 'Error',
      logTitle: 'Transcript',
      dashTitle: 'System overview',
      export: 'Export',
      clear: 'Clear',
      stop: 'Stop',
      close: 'Close',
      save: 'Save',
      resetAll: 'Reset everything',
      settings: 'Settings',
      helpTitle: 'What J.A.R.V.I.S. can do',
      tapToTalk: 'Tap to talk',
      listening: 'Listening …',
      thinking: 'One moment …',
      wakeArmed: 'Wake word armed — say “Jarvis”',
      cardTime: 'Time', cardWeather: 'Weather', cardSystem: 'System',
      cardTasks: 'Tasks', cardNotes: 'Notes', cardTimers: 'Timers & reminders',
      sysNet: 'Network', sysBattery: 'Battery', sysMic: 'Microphone', sysAI: 'AI mode',
      tasksEmpty: 'No tasks yet. Say: “Add task …”',
      notesEmpty: 'No notes yet. Say: “Note that …”',
      timersEmpty: 'Nothing scheduled. Say: “Set a timer for 5 minutes”',
      weatherAsk: 'Ask: “What’s the weather?”',
      composerPh: 'Type a command … e.g. “What time is it?”',
      setLang: 'Language', setVoice: 'System voice', setRate: 'Rate', setPitch: 'Pitch',
      voiceEngine: 'Speech output via', voiceBrowser: 'Browser system voice',
      voiceEleven: 'ElevenLabs (custom voice)', voiceKey: 'ElevenLabs key',
      voiceId: 'Voice ID', voiceModel: 'Voice model', voiceTest: 'Test voice',
      voiceSample: 'Systems ready. This is how I sound from now on.', sysVoice: 'Voice',
      sysAgent: 'Agent', agentTitle: 'Agent — carry out tasks',
      agentIntro: 'With the agent on, J.A.R.V.I.S. can actually do things on this machine: create files, build projects, run commands. Anything that changes something asks first.',
      agentOn: 'Enable agent', agentOnHint: 'Needs the local service — without it nothing happens',
      agentUrl: 'Agent address', agentRunning: 'Task running', agentStop: 'Stop',
      agentAsk: 'May I run this?', agentAllow: 'Allow', agentDeny: 'Deny',
      agentAllowed: 'Allowed.', agentDenied: 'Denied.', agentStopped: 'Task stopped.',
      agentAuto: 'read', agentDone: 'Task complete.',
      agentOffline: 'The agent is unreachable. Is the local service running? (node server/jarvis-proxy.mjs)',
      agentSpoken: 'Just checking: ',
      fillerHint: 'What can I help with?',
      remoteNotice: 'This page runs on the web, not on your computer. Everything built in works here — time, timers, tasks, notes, maths, conversions. AI mode, the agent and the custom voice need the service on your machine and cannot be switched on here.',
      remoteUnknown: 'I have no built-in command for that, and I cannot answer open questions on this page — that needs the service on your computer. What works here: “What time is it?”, “Set a timer for 10 minutes”, “What is 17 times 23?”, “Add task …”, “Note that …”, “10 km in miles”. Say “help” for the full list.',
      remoteSetting: 'Not available on this online page — it needs the service running on your own computer.',
      setWake: 'Wake word', setWakeHint: 'Keep listening and only react to “Jarvis”',
      setSpeak: 'Speech output', setSpeakHint: 'Read answers out loud',
      setSfx: 'Sound cues', setSfxHint: 'Short tones on start, end and alarms',
      aiTitle: 'AI mode (Claude)',
      aiIntro: 'Without AI mode J.A.R.V.I.S. answers every built-in command locally. With AI mode, open questions go to the Claude API.',
      aiConn: 'Connection', aiOff: 'Off — built-in commands only',
      aiProxy: 'Local proxy (recommended)', aiDirect: 'Direct from the browser (key is exposed)',
      aiProxyUrl: 'Proxy address', aiKey: 'API key', aiModel: 'Model', aiPersona: 'Persona',
      aiKeyWarn: 'Careful: the key is stored in this device’s browser storage and sent straight to api.anthropic.com. Local, private use only.',

      bootLines: [
        'Initialising core …',
        'Loading language modules …',
        'Calibrating audio input …',
        'Connecting system services …',
        'All systems ready.',
      ],
      bootEnter: 'Start system',
      greetBoot: 'All systems online. How can I help?',

      you: 'You', me: 'J.A.R.V.I.S.', sys: 'System',
      unknown: 'I did not catch that. Say “help” for a list of commands.',
      unknownAI: 'I have no built-in command for that. Turn on AI mode in the settings and I will answer open questions too.',
      ok: 'Done.',
      micDenied: 'I have no access to the microphone. Please allow it in your browser settings — usually via the padlock icon in the address bar.',
      micEmbedded: 'This page is embedded in another window, and browsers always block the microphone there — no setting changes that. Open the page in its own tab to talk. Typing works fine right here.',
      micInsecure: 'Browsers only allow the microphone over a secure connection (https or localhost). Typing still works.',
      micMissing: 'This browser has no speech recognition. Chrome or Edge work best — typing works everywhere.',
      ttsMissing: 'This browser cannot speak. I will keep answering in writing.',
      offline: 'I need an internet connection for that.',
      netError: 'The request failed.',
      saved: 'Settings saved.',
      resetDone: 'Everything reset.',
      copied: 'Copied to clipboard.',
      langSet: 'Language set to English.',
      cleared: 'Transcript cleared.',
    },
  };

  const t = (key) => (I18N[isDE() ? 'de' : 'en'][key] ?? key);

  /* =======================================================
     3. Hilfsfunktionen
     ======================================================= */

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const uid = () => Math.random().toString(36).slice(2, 9);
  const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /** Kleinbuchstaben, ohne Satzzeichen, mit normalisierten Umlauten für den Vergleich. */
  const norm = (s) => String(s || '')
    .toLowerCase()
    .replace(/[?!.,;:]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const locale = () => (isDE() ? 'de-DE' : 'en-US');

  const fmtTime = (d = new Date()) =>
    d.toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' });

  const fmtTimeFull = (d = new Date()) =>
    d.toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const fmtDate = (d = new Date()) =>
    d.toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const fmtNum = (n, digits = 0) =>
    Number(n).toLocaleString(locale(), { minimumFractionDigits: digits, maximumFractionDigits: digits });

  /** Zahlwörter → Zahl, für „fünf Minuten“ / „five minutes“. */
  const WORD_NUMBERS = {
    null: 0, eins: 1, ein: 1, eine: 1, zwei: 2, drei: 3, vier: 4, fünf: 5, funf: 5, sechs: 6,
    sieben: 7, acht: 8, neun: 9, zehn: 10, elf: 11, zwölf: 12, zwolf: 12, dreizehn: 13,
    vierzehn: 14, fünfzehn: 15, funfzehn: 15, zwanzig: 20, dreißig: 30, dreissig: 30,
    vierzig: 40, fünfzig: 50, funfzig: 50, sechzig: 60,
    zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8,
    nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
    twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60,
    half: 0.5, halbe: 0.5, halb: 0.5,
  };

  const parseNumber = (raw) => {
    if (raw == null) return null;
    const s = String(raw).trim().toLowerCase().replace(',', '.');
    if (/^-?\d+(\.\d+)?$/.test(s)) return parseFloat(s);
    if (s in WORD_NUMBERS) return WORD_NUMBERS[s];
    return null;
  };

  /** „vor 3 Minuten“ → „in 3 minutes“ als lesbare Dauer. */
  const humanDuration = (ms) => {
    const total = Math.max(0, Math.round(ms / 1000));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const parts = [];
    if (h) parts.push(`${h} ${isDE() ? (h === 1 ? 'Stunde' : 'Stunden') : (h === 1 ? 'hour' : 'hours')}`);
    if (m) parts.push(`${m} ${isDE() ? (m === 1 ? 'Minute' : 'Minuten') : (m === 1 ? 'minute' : 'minutes')}`);
    if (s && !h) parts.push(`${s} ${isDE() ? (s === 1 ? 'Sekunde' : 'Sekunden') : (s === 1 ? 'second' : 'seconds')}`);
    return parts.join(isDE() ? ' und ' : ' and ') || (isDE() ? '0 Sekunden' : '0 seconds');
  };

  const saveMemory = () => store.write(KEY.memory, memory);
  const saveSettings = () => store.write(KEY.settings, settings);

  const online = () => navigator.onLine !== false;

  /** fetch mit Zeitlimit — hängt nie unbegrenzt. */
  async function fetchJSON(url, options = {}, timeoutMs = 12000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...options, signal: ctrl.signal });
      if (!res.ok) {
        let detail = '';
        try { detail = (await res.text()).slice(0, 300); } catch { /* ignorieren */ }
        const err = new Error(`HTTP ${res.status}${detail ? ` — ${detail}` : ''}`);
        err.status = res.status;
        throw err;
      }
      return await res.json();
    } finally {
      clearTimeout(timer);
    }
  }

  /* =======================================================
     4. Audio — Signaltöne und Visualizer
     ======================================================= */

  const Audio_ = {
    ctx: null,
    analyser: null,
    stream: null,
    data: null,

    context() {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        this.ctx = new AC();
      }
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      return this.ctx;
    },

    /** Kurzer Sinuston. */
    beep(freq = 660, ms = 120, type = 'sine', gain = 0.05) {
      if (!settings.sfx) return;
      const ctx = this.context();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const vol = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      vol.gain.setValueAtTime(0, ctx.currentTime);
      vol.gain.linearRampToValueAtTime(gain, ctx.currentTime + 0.012);
      vol.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + ms / 1000);
      osc.connect(vol).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + ms / 1000 + 0.02);
    },

    chirpUp() { this.beep(520, 90); setTimeout(() => this.beep(780, 110), 80); },
    chirpDown() { this.beep(700, 90); setTimeout(() => this.beep(440, 120), 80); },
    alarm() {
      for (let i = 0; i < 4; i++) setTimeout(() => this.beep(880, 180, 'triangle', 0.08), i * 260);
    },

    /** Mikrofon-Pegel für den Visualizer — optional, scheitert leise. */
    async attach() {
      if (this.analyser) return true;
      if (!navigator.mediaDevices?.getUserMedia) return false;
      const ctx = this.context();
      if (!ctx) return false;
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const src = ctx.createMediaStreamSource(this.stream);
        this.analyser = ctx.createAnalyser();
        this.analyser.fftSize = 128;
        this.analyser.smoothingTimeConstant = 0.75;
        this.data = new Uint8Array(this.analyser.frequencyBinCount);
        src.connect(this.analyser);
        return true;
      } catch {
        this.analyser = null;
        return false;
      }
    },

    detach() {
      if (this.stream) {
        this.stream.getTracks().forEach((tr) => tr.stop());
        this.stream = null;
      }
      this.analyser = null;
      this.data = null;
    },

    /** 0..1-Pegel je Band; ohne Mikrofon eine ruhige Wellenform. */
    levels(count, phase) {
      const out = new Array(count);
      if (this.analyser && this.data) {
        this.analyser.getByteFrequencyData(this.data);
        const step = Math.max(1, Math.floor(this.data.length / count));
        for (let i = 0; i < count; i++) {
          let sum = 0;
          for (let j = 0; j < step; j++) sum += this.data[i * step + j] || 0;
          out[i] = (sum / step) / 255;
        }
        return out;
      }
      for (let i = 0; i < count; i++) {
        out[i] = 0.12 + 0.08 * Math.sin(phase * 1.6 + i * 0.45) + 0.05 * Math.sin(phase * 0.7 + i * 1.3);
      }
      return out;
    },
  };

  /* =======================================================
     5. Sprachausgabe
     ======================================================= */

  const TTS = {
    supported: typeof window.speechSynthesis !== 'undefined',

    loadVoices() {
      if (!this.supported) return [];
      state.voices = window.speechSynthesis.getVoices() || [];
      return state.voices;
    },

    pickVoice() {
      const voices = state.voices.length ? state.voices : this.loadVoices();
      if (!voices.length) return null;
      if (settings.voiceURI) {
        const exact = voices.find((v) => v.voiceURI === settings.voiceURI);
        if (exact) return exact;
      }
      const lang = settings.lang.toLowerCase();
      const base = lang.slice(0, 2);
      return voices.find((v) => v.lang.toLowerCase() === lang)
        || voices.find((v) => v.lang.toLowerCase().startsWith(base))
        || voices[0];
    },

    /** Markdown-Reste und URLs entfernen, damit nichts vorgelesen wird, was stört. */
    clean(text) {
      return String(text)
        .replace(/https?:\/\/\S+/g, isDE() ? 'ein Link' : 'a link')
        .replace(/[*_`#>|]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    },

    /* ---- gemeinsamer Ein-/Ausstieg ---- */

    began() {
      state.speaking = true;
      UI.setState('speaking');
    },

    ended() {
      state.speaking = false;
      // Kurze Sperre, damit die eigene Stimme nicht als Eingabe zurückkommt.
      state.ignoreUntil = Date.now() + 400;
      UI.setState(state.listening ? 'listening' : 'idle');
    },

    /* ---- ElevenLabs ---- */

    audio: null,
    audioUrl: '',
    failures: 0,          // nach zwei Fehlschlägen bleibt es bei der Systemstimme
    warned: false,

    /** Ist die gewählte Stimme gerade nutzbar? */
    useEleven() {
      const v = settings.voice;
      if (v.engine !== 'elevenlabs' || !v.voiceId) return false;
      if (this.failures >= 2) return false;
      if (v.mode === 'direct') return Boolean(v.apiKey);
      return Boolean(v.proxyUrl) && LOCAL_OK;   // Proxy nur auf dem eigenen Rechner
    },

    /** Einmaliger Hinweis, warum gerade die Systemstimme spricht. */
    warnOnce(reason) {
      if (this.warned) return;
      this.warned = true;
      UI.systemMsg(isDE()
        ? `Die eingestellte Stimme ist nicht erreichbar (${reason}). Ich spreche mit der Systemstimme weiter — Einstellungen → Stimme.`
        : `The configured voice is unreachable (${reason}). I will keep using the system voice — Settings → Voice.`);
    },

    async speakEleven(text) {
      const v = settings.voice;
      const direct = v.mode === 'direct';

      const url = direct
        ? `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(v.voiceId)}?output_format=mp3_44100_128`
        : v.proxyUrl;

      const headers = { 'content-type': 'application/json' };
      if (direct) headers['xi-api-key'] = v.apiKey;

      const body = { text, model_id: v.model };
      if (!direct) {
        body.voice_id = v.voiceId;
        body.output_format = 'mp3_44100_128';
      }

      const ctrl = new AbortController();
      this.abort = ctrl;
      const timer = setTimeout(() => ctrl.abort(), 20000);

      let blob;
      try {
        const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body), signal: ctrl.signal });
        if (!res.ok) {
          let detail = '';
          try { detail = (await res.text()).slice(0, 200); } catch { /* egal */ }
          throw new Error(`HTTP ${res.status}${detail ? ` — ${detail}` : ''}`);
        }
        blob = await res.blob();
      } finally {
        clearTimeout(timer);
        if (this.abort === ctrl) this.abort = null;
      }

      if (!blob || blob.size < 128) throw new Error('leere Audioantwort');

      this.releaseAudio();
      this.audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(this.audioUrl);
      this.audio = audio;
      audio.playbackRate = clamp(settings.rate, 0.5, 2);

      audio.onplay = () => this.began();
      audio.onended = () => { this.ended(); this.releaseAudio(); };
      audio.onerror = () => { this.ended(); this.releaseAudio(); };

      await audio.play();
      this.failures = 0;
    },

    releaseAudio() {
      if (this.audio) {
        try { this.audio.pause(); } catch { /* egal */ }
        this.audio.onplay = this.audio.onended = this.audio.onerror = null;
        this.audio = null;
      }
      if (this.audioUrl) {
        URL.revokeObjectURL(this.audioUrl);
        this.audioUrl = '';
      }
    },

    /* ---- Systemstimme ---- */

    speakBrowser(clean) {
      if (!this.supported) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(clean);
      const voice = this.pickVoice();
      if (voice) u.voice = voice;
      u.lang = voice?.lang || settings.lang;
      u.rate = clamp(settings.rate, 0.5, 2);
      u.pitch = clamp(settings.pitch, 0.4, 2);
      u.onstart = () => this.began();
      u.onend = u.onerror = () => this.ended();
      window.speechSynthesis.speak(u);
    },

    /* ---- öffentlicher Einstieg ---- */

    speak(text) {
      if (!settings.speak || !text) return;
      const clean = this.clean(text);
      if (!clean) return;

      this.stop();

      if (this.useEleven()) {
        this.speakEleven(clean).catch((err) => {
          if (err?.name === 'AbortError') return;   // absichtlich abgebrochen
          this.failures += 1;
          this.warnOnce(err.message || 'Fehler');
          UI.updateSystemCard();
          this.speakBrowser(clean);
        });
        return;
      }

      if (settings.voice.engine === 'elevenlabs') {
        this.warnOnce(isDE() ? 'kein Zugang hinterlegt' : 'no access configured');
      }
      this.speakBrowser(clean);
    },

    stop() {
      if (this.abort) {
        try { this.abort.abort(); } catch { /* egal */ }
        this.abort = null;
      }
      this.releaseAudio();
      if (this.supported) window.speechSynthesis.cancel();
      state.speaking = false;
      UI.setState(state.listening ? 'listening' : 'idle');
    },
  };

  /* =======================================================
     6. Spracherkennung
     ======================================================= */

  const STT = {
    Ctor: window.SpeechRecognition || window.webkitSpeechRecognition || null,
    rec: null,
    restartTimer: null,

    get supported() { return Boolean(this.Ctor); },

    build() {
      if (!this.supported) return null;
      const rec = new this.Ctor();
      rec.lang = settings.lang;
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 1;

      rec.onstart = () => {
        state.listening = true;
        state.micAllowed = true;
        UI.setState('listening');
        UI.setMicLive(true);
        UI.updateSystemCard();
      };

      rec.onresult = (event) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;
          if (result.isFinal) {
            STT.handleFinal(transcript);
          } else {
            interim += transcript;
          }
        }
        if (interim.trim()) UI.setHint(`„${interim.trim()}“`);
      };

      rec.onerror = (event) => {
        const err = event.error;
        if (err === 'not-allowed' || err === 'service-not-allowed') {
          state.micAllowed = false;
          state.wantListen = false;
          UI.systemMsg(t(EMBEDDED ? 'micEmbedded' : !SECURE ? 'micInsecure' : 'micDenied'), EMBEDDED ? 'system' : 'error');
          UI.setState('error');
        } else if (err === 'audio-capture') {
          state.micAllowed = false;
          state.wantListen = false;
          UI.systemMsg(isDE() ? 'Kein Mikrofon gefunden.' : 'No microphone found.', 'error');
        }
        // 'no-speech' und 'aborted' sind normal — onend startet neu.
        UI.updateSystemCard();
      };

      rec.onend = () => {
        state.listening = false;
        UI.setMicLive(false);
        if (state.wantListen) {
          // Chrome beendet die Erkennung regelmäßig von selbst — neu starten.
          clearTimeout(this.restartTimer);
          this.restartTimer = setTimeout(() => {
            if (state.wantListen) this.rawStart();
          }, 350);
        } else {
          UI.setState(state.speaking ? 'speaking' : 'idle');
          Audio_.detach();
        }
      };

      return rec;
    },

    handleFinal(transcript) {
      const text = String(transcript || '').trim();
      if (!text) return;
      if (Date.now() < state.ignoreUntil) return;   // eigene Sprachausgabe ignorieren
      if (state.speaking) return;

      UI.setHint('');

      if (settings.wake) {
        const n = norm(text);
        const m = n.match(/\b(?:hey\s+)?(?:jarvis|dscharvis|jervis|service)\b[\s,]*(.*)$/i);
        if (!m) return;                    // ohne Weckwort nichts tun
        const rest = m[1].trim();
        if (!rest) {
          Audio_.chirpUp();
          UI.setHint(isDE() ? 'Ich höre.' : 'I am listening.');
          return;
        }
        Brain.handle(rest, 'voice');
        return;
      }

      Brain.handle(text, 'voice');
    },

    rawStart() {
      if (!this.rec) this.rec = this.build();
      if (!this.rec) return;
      try {
        this.rec.start();
      } catch {
        // start() wirft, wenn bereits aktiv — unkritisch.
      }
    },

    /** Gibt den Grund zurück, warum das Mikrofon nicht geht — oder null. */
    blockedReason() {
      if (!this.supported) return 'micMissing';
      if (EMBEDDED) return 'micEmbedded';
      if (!SECURE) return 'micInsecure';
      return null;
    },

    async start() {
      const blocked = this.blockedReason();
      if (blocked) {
        UI.systemMsg(t(blocked), blocked === 'micEmbedded' ? 'system' : 'error');
        state.micAllowed = false;
        UI.updateSystemCard();
        return false;
      }
      state.wantListen = true;
      Audio_.context();
      await Audio_.attach();
      this.rawStart();
      Audio_.chirpUp();
      return true;
    },

    stop() {
      state.wantListen = false;
      clearTimeout(this.restartTimer);
      if (this.rec) {
        try { this.rec.stop(); } catch { /* nicht aktiv */ }
      }
      Audio_.detach();
      Audio_.chirpDown();
      UI.setMicLive(false);
      UI.setState(state.speaking ? 'speaking' : 'idle');
    },

    toggle() {
      if (state.wantListen) this.stop();
      else this.start();
    },

    /** Sprache gewechselt — Instanz neu bauen. */
    relang() {
      const was = state.wantListen;
      this.stop();
      this.rec = null;
      if (was) setTimeout(() => this.start(), 300);
    },
  };

  /* =======================================================
     7a. Rechner — eigener Parser, kein eval()
     ======================================================= */

  const Calc = {
    OPS: {
      '+': { prec: 1, assoc: 'L', fn: (a, b) => a + b },
      '-': { prec: 1, assoc: 'L', fn: (a, b) => a - b },
      '*': { prec: 2, assoc: 'L', fn: (a, b) => a * b },
      '/': { prec: 2, assoc: 'L', fn: (a, b) => a / b },
      '%': { prec: 2, assoc: 'L', fn: (a, b) => a % b },
      '^': { prec: 4, assoc: 'R', fn: (a, b) => Math.pow(a, b) },
      'u-': { prec: 3, assoc: 'R', unary: true, fn: (a) => -a },
    },

    FNS: {
      sqrt: Math.sqrt, abs: Math.abs, round: Math.round, floor: Math.floor,
      ceil: Math.ceil, sin: Math.sin, cos: Math.cos, tan: Math.tan,
      log: Math.log10, ln: Math.log, exp: Math.exp,
    },

    /** Gesprochene Rechenwörter in Symbole übersetzen. */
    spoken(text) {
      let s = ' ' + String(text).toLowerCase() + ' ';
      const map = [
        [/\bmultipliziert mit\b|\bmal\b|\btimes\b|\bmultiplied by\b/g, ' * '],
        [/\bgeteilt durch\b|\bdivided by\b|\bdurch\b|\bover\b/g, ' / '],
        [/\bhoch\b|\bto the power of\b|\bpower of\b/g, ' ^ '],
        [/\bquadrat\b|\bsquared\b/g, ' ^ 2 '],
        [/\bwurzel aus\b|\bquadratwurzel aus\b|\bsquare root of\b|\bwurzel\b/g, ' sqrt '],
        [/\bplus\b|\bund\b|\bpluss\b/g, ' + '],
        [/\bminus\b|\bweniger\b/g, ' - '],
        [/\bmodulo\b|\bmod\b|\brest von\b/g, ' % '],
        [/\bprozent von\b|\bpercent of\b/g, ' %% '],
        [/\bpi\b/g, ' 3.141592653589793 '],
        [/\bkomma\b/g, '.'],
      ];
      for (const [re, rep] of map) s = s.replace(re, rep);
      // „20 %% 80“ → 20/100*80
      s = s.replace(/(\d+(?:\.\d+)?)\s*%%\s*(\d+(?:\.\d+)?)/g, '($1/100*$2)');
      // Dezimalkomma zwischen Ziffern
      s = s.replace(/(\d),(\d)/g, '$1.$2');
      return s.trim();
    },

    tokenize(input) {
      const s = input.replace(/\s+/g, '');
      const tokens = [];
      let i = 0;
      let prev = null;  // 'num' | 'op' | '(' | ')' | 'fn'

      while (i < s.length) {
        const ch = s[i];

        if (/[0-9.]/.test(ch)) {
          let num = '';
          while (i < s.length && /[0-9.]/.test(s[i])) num += s[i++];
          if (!/^\d*\.?\d+$/.test(num)) return null;
          tokens.push({ t: 'num', v: parseFloat(num) });
          prev = 'num';
          continue;
        }

        if (/[a-zäöüß]/i.test(ch)) {
          let name = '';
          while (i < s.length && /[a-zäöüß]/i.test(s[i])) name += s[i++].toLowerCase();
          if (name === 'e') { tokens.push({ t: 'num', v: Math.E }); prev = 'num'; continue; }
          if (!(name in this.FNS)) return null;
          tokens.push({ t: 'fn', v: name });
          prev = 'fn';
          continue;
        }

        if (ch === '(') { tokens.push({ t: '(' }); prev = '('; i++; continue; }
        if (ch === ')') { tokens.push({ t: ')' }); prev = ')'; i++; continue; }

        if (ch === 'x' || ch === '×') { tokens.push({ t: 'op', v: '*' }); prev = 'op'; i++; continue; }
        if (ch === '÷' || ch === ':') { tokens.push({ t: 'op', v: '/' }); prev = 'op'; i++; continue; }

        if (ch in this.OPS || ch === '-') {
          const unary = ch === '-' && (prev === null || prev === 'op' || prev === '(');
          tokens.push({ t: 'op', v: unary ? 'u-' : ch });
          prev = 'op';
          i++;
          continue;
        }

        return null;   // unbekanntes Zeichen → keine Rechnung
      }
      return tokens.length ? tokens : null;
    },

    /** Shunting-Yard → RPN → auswerten. */
    evaluate(input) {
      const tokens = this.tokenize(this.spoken(input));
      if (!tokens) return null;
      if (!tokens.some((tok) => tok.t === 'op' || tok.t === 'fn')) return null;   // reine Zahl ist keine Aufgabe

      const out = [];
      const ops = [];

      for (const tok of tokens) {
        if (tok.t === 'num') { out.push(tok); continue; }
        if (tok.t === 'fn') { ops.push(tok); continue; }
        if (tok.t === 'op') {
          const o1 = this.OPS[tok.v];
          while (ops.length) {
            const top = ops[ops.length - 1];
            if (top.t === 'fn') { out.push(ops.pop()); continue; }
            if (top.t !== 'op') break;
            const o2 = this.OPS[top.v];
            const takes = (o1.assoc === 'L' && o1.prec <= o2.prec) || (o1.assoc === 'R' && o1.prec < o2.prec);
            if (!takes) break;
            out.push(ops.pop());
          }
          ops.push(tok);
          continue;
        }
        if (tok.t === '(') { ops.push(tok); continue; }
        if (tok.t === ')') {
          let found = false;
          while (ops.length) {
            const top = ops.pop();
            if (top.t === '(') { found = true; break; }
            out.push(top);
          }
          if (!found) return null;
          if (ops.length && ops[ops.length - 1].t === 'fn') out.push(ops.pop());
        }
      }
      while (ops.length) {
        const top = ops.pop();
        if (top.t === '(') return null;
        out.push(top);
      }

      const stack = [];
      for (const tok of out) {
        if (tok.t === 'num') { stack.push(tok.v); continue; }
        if (tok.t === 'fn') {
          if (!stack.length) return null;
          stack.push(this.FNS[tok.v](stack.pop()));
          continue;
        }
        const op = this.OPS[tok.v];
        if (op.unary) {
          if (!stack.length) return null;
          stack.push(op.fn(stack.pop()));
        } else {
          if (stack.length < 2) return null;
          const b = stack.pop();
          const a = stack.pop();
          stack.push(op.fn(a, b));
        }
      }

      if (stack.length !== 1) return null;
      const result = stack[0];
      return Number.isFinite(result) ? result : null;
    },

    pretty(n) {
      const rounded = Math.round(n * 1e10) / 1e10;
      const digits = Number.isInteger(rounded) ? 0 : Math.min(6, (String(rounded).split('.')[1] || '').length);
      return fmtNum(rounded, digits);
    },
  };

  /* =======================================================
     7b. Einheiten
     ======================================================= */

  const UNITS = {
    // Kanonische Basis je Größe, Faktor zur Basis
    km: { dim: 'len', f: 1000 }, kilometer: { dim: 'len', f: 1000 }, kilometern: { dim: 'len', f: 1000 },
    m: { dim: 'len', f: 1 }, meter: { dim: 'len', f: 1 }, metern: { dim: 'len', f: 1 },
    cm: { dim: 'len', f: 0.01 }, zentimeter: { dim: 'len', f: 0.01 },
    mm: { dim: 'len', f: 0.001 }, millimeter: { dim: 'len', f: 0.001 },
    mi: { dim: 'len', f: 1609.344 }, meile: { dim: 'len', f: 1609.344 }, meilen: { dim: 'len', f: 1609.344 },
    mile: { dim: 'len', f: 1609.344 }, miles: { dim: 'len', f: 1609.344 },
    ft: { dim: 'len', f: 0.3048 }, fuß: { dim: 'len', f: 0.3048 }, feet: { dim: 'len', f: 0.3048 }, foot: { dim: 'len', f: 0.3048 },
    in: { dim: 'len', f: 0.0254 }, zoll: { dim: 'len', f: 0.0254 }, inch: { dim: 'len', f: 0.0254 }, inches: { dim: 'len', f: 0.0254 },
    yd: { dim: 'len', f: 0.9144 }, yard: { dim: 'len', f: 0.9144 }, yards: { dim: 'len', f: 0.9144 },

    kg: { dim: 'mass', f: 1 }, kilo: { dim: 'mass', f: 1 }, kilogramm: { dim: 'mass', f: 1 }, kilogram: { dim: 'mass', f: 1 },
    g: { dim: 'mass', f: 0.001 }, gramm: { dim: 'mass', f: 0.001 }, gram: { dim: 'mass', f: 0.001 },
    t: { dim: 'mass', f: 1000 }, tonne: { dim: 'mass', f: 1000 }, tonnen: { dim: 'mass', f: 1000 },
    lb: { dim: 'mass', f: 0.45359237 }, pfund: { dim: 'mass', f: 0.5 }, pound: { dim: 'mass', f: 0.45359237 },
    pounds: { dim: 'mass', f: 0.45359237 }, lbs: { dim: 'mass', f: 0.45359237 },
    oz: { dim: 'mass', f: 0.0283495 }, unze: { dim: 'mass', f: 0.0283495 }, ounce: { dim: 'mass', f: 0.0283495 },

    l: { dim: 'vol', f: 1 }, liter: { dim: 'vol', f: 1 }, litre: { dim: 'vol', f: 1 }, litres: { dim: 'vol', f: 1 },
    ml: { dim: 'vol', f: 0.001 }, milliliter: { dim: 'vol', f: 0.001 },
    gal: { dim: 'vol', f: 3.785411784 }, gallone: { dim: 'vol', f: 3.785411784 }, gallon: { dim: 'vol', f: 3.785411784 },
    gallons: { dim: 'vol', f: 3.785411784 },

    kmh: { dim: 'speed', f: 1 }, 'km/h': { dim: 'speed', f: 1 },
    mph: { dim: 'speed', f: 1.609344 },
    ms: { dim: 'speed', f: 3.6 }, 'm/s': { dim: 'speed', f: 3.6 },
  };

  const TEMP_UNITS = {
    c: 'C', celsius: 'C', '°c': 'C', grad: 'C',
    f: 'F', fahrenheit: 'F', '°f': 'F',
    k: 'K', kelvin: 'K',
  };

  function convertUnits(value, from, to) {
    const f = String(from).toLowerCase().replace(/\.$/, '');
    const s = String(to).toLowerCase().replace(/\.$/, '');

    const label = (code) => (code === 'C' ? '°C' : code === 'F' ? '°F' : 'K');

    if (f in TEMP_UNITS && s in TEMP_UNITS) {
      const a = TEMP_UNITS[f];
      const b = TEMP_UNITS[s];
      let celsius = value;
      if (a === 'F') celsius = (value - 32) * 5 / 9;
      if (a === 'K') celsius = value - 273.15;
      let out = celsius;
      if (b === 'F') out = celsius * 9 / 5 + 32;
      if (b === 'K') out = celsius + 273.15;
      return { value: out, unit: label(b), from: label(a) };
    }

    const A = UNITS[f];
    const B = UNITS[s];
    if (!A || !B || A.dim !== B.dim) return null;
    return { value: value * A.f / B.f, unit: s, from: f };
  }

  /* =======================================================
     7c. Wetter (Open-Meteo, ohne Schlüssel)
     ======================================================= */

  const WEATHER_CODES = {
    0: ['klar', 'clear sky'], 1: ['überwiegend klar', 'mainly clear'], 2: ['teils bewölkt', 'partly cloudy'],
    3: ['bedeckt', 'overcast'], 45: ['neblig', 'foggy'], 48: ['Nebel mit Reifablagerung', 'depositing rime fog'],
    51: ['leichter Nieselregen', 'light drizzle'], 53: ['Nieselregen', 'drizzle'], 55: ['starker Nieselregen', 'dense drizzle'],
    56: ['gefrierender Nieselregen', 'freezing drizzle'], 57: ['starker gefrierender Nieselregen', 'dense freezing drizzle'],
    61: ['leichter Regen', 'light rain'], 63: ['Regen', 'rain'], 65: ['starker Regen', 'heavy rain'],
    66: ['gefrierender Regen', 'freezing rain'], 67: ['starker gefrierender Regen', 'heavy freezing rain'],
    71: ['leichter Schneefall', 'light snow'], 73: ['Schneefall', 'snow'], 75: ['starker Schneefall', 'heavy snow'],
    77: ['Schneegriesel', 'snow grains'],
    80: ['leichte Regenschauer', 'light rain showers'], 81: ['Regenschauer', 'rain showers'], 82: ['heftige Regenschauer', 'violent rain showers'],
    85: ['leichte Schneeschauer', 'light snow showers'], 86: ['starke Schneeschauer', 'heavy snow showers'],
    95: ['Gewitter', 'thunderstorm'], 96: ['Gewitter mit Hagel', 'thunderstorm with hail'],
    99: ['schweres Gewitter mit Hagel', 'severe thunderstorm with hail'],
  };

  const weatherText = (code) => {
    const pair = WEATHER_CODES[code];
    if (!pair) return isDE() ? 'unbekannt' : 'unknown';
    return isDE() ? pair[0] : pair[1];
  };

  const Weather = {
    async geocode(place) {
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(place)}&count=1&language=${isDE() ? 'de' : 'en'}&format=json`;
      const data = await fetchJSON(url);
      const hit = data?.results?.[0];
      if (!hit) return null;
      return { name: hit.name, country: hit.country, lat: hit.latitude, lon: hit.longitude };
    },

    async here() {
      if (!navigator.geolocation) return null;
      // Manche Browser rufen weder Erfolgs- noch Fehler-Callback auf, solange die
      // Freigabe aussteht — deshalb ein eigenes hartes Zeitlimit.
      return new Promise((resolve) => {
        let settled = false;
        const done = (v) => { if (!settled) { settled = true; resolve(v); } };
        const guard = setTimeout(() => done(null), 9000);
        navigator.geolocation.getCurrentPosition(
          (pos) => { clearTimeout(guard); done({ name: null, country: null, lat: pos.coords.latitude, lon: pos.coords.longitude }); },
          () => { clearTimeout(guard); done(null); },
          { timeout: 8000, maximumAge: 600000 },
        );
      });
    },

    async forecast(loc) {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}`
        + '&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,relative_humidity_2m'
        + '&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max'
        + '&forecast_days=2&timezone=auto';
      return fetchJSON(url);
    },

    async report(place) {
      if (!online()) return t('offline');

      let loc = null;
      if (place) {
        loc = await this.geocode(place);
        if (!loc) return isDE() ? `Den Ort „${place}“ finde ich nicht.` : `I cannot find a place called “${place}”.`;
      } else {
        loc = await this.here();
        if (!loc && memory.city) loc = memory.city;
        if (!loc) {
          return isDE()
            ? 'Ich weiß nicht, wo du bist. Frag mit Ortsangabe, zum Beispiel „Wetter in Berlin“.'
            : 'I do not know where you are. Ask with a place, for example “weather in Berlin”.';
        }
      }

      const data = await this.forecast(loc);
      const cur = data.current;
      const day = data.daily;
      const name = loc.name || (isDE() ? 'deinem Standort' : 'your location');

      memory.city = loc;
      saveMemory();

      const temp = Math.round(cur.temperature_2m);
      const feels = Math.round(cur.apparent_temperature);
      const desc = weatherText(cur.weather_code);
      const wind = Math.round(cur.wind_speed_10m);
      const hi = Math.round(day.temperature_2m_max[0]);
      const lo = Math.round(day.temperature_2m_min[0]);
      const rain = day.precipitation_probability_max?.[0];

      UI.setWeatherCard(`${temp}°`, `${name} — ${desc}`);

      if (isDE()) {
        return `In ${name} ist es ${desc} bei ${temp} Grad, gefühlt ${feels}. `
          + `Heute zwischen ${lo} und ${hi} Grad, Wind ${wind} Kilometer pro Stunde`
          + (rain != null ? `, Regenwahrscheinlichkeit ${rain} Prozent.` : '.');
      }
      return `In ${name} it is ${desc} at ${temp} degrees, feels like ${feels}. `
        + `Today between ${lo} and ${hi} degrees, wind ${wind} kilometres per hour`
        + (rain != null ? `, chance of rain ${rain} percent.` : '.');
    },
  };

  /* =======================================================
     7d. Wikipedia
     ======================================================= */

  async function wikiSummary(term) {
    if (!online()) return null;
    const host = isDE() ? 'de.wikipedia.org' : 'en.wikipedia.org';
    try {
      const url = `https://${host}/api/rest_v1/page/summary/${encodeURIComponent(term.trim())}`;
      const data = await fetchJSON(url, { headers: { Accept: 'application/json' } }, 9000);
      if (!data || data.type === 'https://mediawiki.org/wiki/HyperSwitch/errors/not_found') return null;
      if (!data.extract) return null;
      const text = String(data.extract).split(/(?<=[.!?])\s/).slice(0, 3).join(' ');
      return { text, url: data.content_urls?.desktop?.page || '' };
    } catch {
      return null;
    }
  }

  /* =======================================================
     7e. Timer & Erinnerungen
     ======================================================= */

  const Timers = {
    tick: null,

    add(label, at, kind = 'timer') {
      // Beim ersten Timer einmalig nach der Benachrichtigungsfreigabe fragen.
      if ('Notification' in window && Notification.permission === 'default') {
        try { Notification.requestPermission().catch(() => {}); } catch { /* egal */ }
      }
      const entry = { id: uid(), label, at, kind };
      memory.timers.push(entry);
      memory.timers.sort((a, b) => a.at - b.at);
      saveMemory();
      UI.renderTimers();
      this.ensureTick();
      return entry;
    },

    cancelAll() {
      const n = memory.timers.length;
      memory.timers = [];
      saveMemory();
      UI.renderTimers();
      return n;
    },

    cancel(id) {
      const i = memory.timers.findIndex((x) => x.id === id);
      if (i < 0) return false;
      memory.timers.splice(i, 1);
      saveMemory();
      UI.renderTimers();
      return true;
    },

    ensureTick() {
      if (this.tick) return;
      this.tick = setInterval(() => {
        const now = Date.now();
        const due = memory.timers.filter((x) => x.at <= now);
        if (due.length) {
          memory.timers = memory.timers.filter((x) => x.at > now);
          saveMemory();
          UI.renderTimers();
          for (const item of due) this.fire(item);
        }
      }, 1000);
    },

    fire(item) {
      Audio_.alarm();
      const msg = item.label
        ? (isDE() ? `Erinnerung: ${item.label}` : `Reminder: ${item.label}`)
        : (isDE() ? 'Der Timer ist abgelaufen.' : 'Your timer is up.');
      UI.say(msg);
      TTS.speak(msg);
      if ('Notification' in window && Notification.permission === 'granted') {
        try { new Notification('J.A.R.V.I.S.', { body: msg }); } catch { /* egal */ }
      }
    },
  };

  /* =======================================================
     7f. Fähigkeiten
     ======================================================= */

  const JOKES = {
    de: [
      'Ein SQL-Query betritt eine Bar, geht zu zwei Tischen und fragt: „Darf ich mich zu Ihnen setzen?“',
      'Es gibt 10 Arten von Menschen: die, die binär verstehen, und die, die es nicht tun.',
      'Warum können Programmierer Halloween und Weihnachten nicht auseinanderhalten? Weil 31 OKT gleich 25 DEZ ist.',
      'Ich würde ja einen Witz über UDP erzählen, aber du bekommst ihn vielleicht nicht.',
      'Mein Code funktioniert. Ich weiß nicht warum. Mein Code funktioniert nicht. Ich weiß nicht warum.',
    ],
    en: [
      'A SQL query walks into a bar, walks up to two tables and asks: “May I join you?”',
      'There are 10 kinds of people: those who understand binary and those who do not.',
      'Why do programmers confuse Halloween and Christmas? Because 31 OCT equals 25 DEC.',
      'I would tell you a UDP joke, but you might not get it.',
      'My code works. I have no idea why. My code does not work. I have no idea why.',
    ],
  };

  const SEARCH_ENGINES = {
    google: (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}`,
    youtube: (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`,
    wikipedia: (q) => `https://${isDE() ? 'de' : 'en'}.wikipedia.org/w/index.php?search=${encodeURIComponent(q)}`,
    maps: (q) => `https://www.google.com/maps/search/${encodeURIComponent(q)}`,
    github: (q) => `https://github.com/search?q=${encodeURIComponent(q)}`,
  };

  const KNOWN_SITES = {
    youtube: 'https://www.youtube.com', google: 'https://www.google.com',
    github: 'https://github.com', wikipedia: `https://${isDE() ? 'de' : 'en'}.wikipedia.org`,
    gmail: 'https://mail.google.com', maps: 'https://maps.google.com',
    amazon: 'https://www.amazon.de', spotify: 'https://open.spotify.com',
    netflix: 'https://www.netflix.com', linkedin: 'https://www.linkedin.com',
    instagram: 'https://www.instagram.com', chatgpt: 'https://claude.ai',
    claude: 'https://claude.ai', anthropic: 'https://www.anthropic.com',
  };

  /** Öffnet ein Fenster; wenn der Popup-Blocker greift, gibt es den Link zurück. */
  function openUrl(url, label) {
    let win = null;
    try { win = window.open(url, '_blank', 'noopener'); } catch { win = null; }
    if (win) {
      return isDE() ? `${label} geöffnet.` : `Opened ${label}.`;
    }
    return (isDE()
      ? `Der Browser hat das Fenster blockiert. Hier ist der Link: `
      : `The browser blocked the pop-up. Here is the link: `)
      + `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(label)}</a>`;
  }

  const SKILLS = [
    /* ---- Rückfrage des Agenten beantworten („ja" / „nein") ---- */
    {
      id: 'permit',
      re: /^(ja|jawohl|jep|klar|erlaube|erlauben|freigeben|freigabe|mach das|mache das|leg los|okay|ok|yes|yep|sure|approve|allow|go ahead|do it|nein|nee|ne|nicht|abgelehnt|ablehnen|lass es|stopp|stop|no|nope|deny|cancel)$/i,
      run(_m, text) {
        // Nur zuständig, solange der Agent tatsächlich auf eine Antwort wartet.
        if (!Agent.hasPending()) return null;
        const yes = /^(ja|jawohl|jep|klar|erlaube|erlauben|freigeben|freigabe|mach das|mache das|leg los|okay|ok|yes|yep|sure|approve|allow|go ahead|do it)$/i.test(norm(text));
        Agent.answerLatest(yes);
        return { text: yes ? t('agentAllowed') : t('agentDenied'), silent: true };
      },
    },

    /* ---- Sprachausgabe stoppen ---- */
    {
      id: 'stop',
      re: /^(stopp?|halt|ruhe|sei still|schweig|silence|be quiet|shut up|pause)$/i,
      run() {
        TTS.stop();
        return { text: isDE() ? 'Gut.' : 'Alright.', silent: true };
      },
    },

    /* ---- Protokoll leeren ---- */
    {
      id: 'clearLog',
      re: /((protokoll|verlauf|chatverlauf|log|transcript|history)\s*(leeren|löschen|lösch|clear|wipe|reset)|(lösche?|leere|clear|wipe)\s+(das\s+|the\s+|den\s+)?(protokoll|verlauf|chatverlauf|log|transcript|history))|^(clear|leeren)$/i,
      run() {
        UI.clearLog();
        memory.history = [];
        saveMemory();
        return { text: t('cleared'), silent: true };
      },
    },

    /* ---- Hilfe ---- */
    {
      id: 'help',
      re: /^(hilfe|help|befehle|commands|was kannst du|what can you do|kommandos)\b/i,
      run() {
        UI.openHelp();
        return isDE()
          ? 'Ich habe die Befehlsübersicht geöffnet. Kurz gesagt: Zeit, Datum, Wetter, Timer, Aufgaben, Notizen, Rechnen, Umrechnen, Wissen und Websuche.'
          : 'I opened the command overview. In short: time, date, weather, timers, tasks, notes, maths, conversions, knowledge and web search.';
      },
    },

    /* ---- Identität ---- */
    {
      id: 'identity',
      re: /(wer bist du|wie hei(ß|ss)t du|dein name|stell dich vor|who are you|what.s your name|introduce yourself)/i,
      run() {
        return isDE()
          ? 'Ich bin J.A.R.V.I.S. — dein Assistent im Browser. Ich verstehe gesprochene und getippte Befehle, arbeite die meisten davon direkt auf diesem Gerät ab und kann für freie Fragen die Claude-API nutzen.'
          : 'I am J.A.R.V.I.S. — your in-browser assistant. I understand spoken and typed commands, handle most of them right here on this device, and can use the Claude API for open questions.';
      },
    },

    /* ---- Begrüßung ---- */
    {
      id: 'greeting',
      re: /^(hallo|hi|hey|hei|moin|servus|guten (morgen|tag|abend)|good (morning|afternoon|evening)|hello|yo)\b/i,
      run() {
        const h = new Date().getHours();
        const de = h < 11 ? 'Guten Morgen' : h < 18 ? 'Guten Tag' : 'Guten Abend';
        const en = h < 11 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
        const open = memory.tasks.filter((x) => !x.done).length;
        const tail = open
          ? (isDE() ? ` Du hast ${open} offene ${open === 1 ? 'Aufgabe' : 'Aufgaben'}.` : ` You have ${open} open ${open === 1 ? 'task' : 'tasks'}.`)
          : '';
        return (isDE() ? `${de}. Was kann ich tun?` : `${en}. What can I do?`) + tail;
      },
    },

    /* ---- Dank ---- */
    {
      id: 'thanks',
      re: /^(danke|vielen dank|dankeschön|merci|thanks|thank you|thx)\b/i,
      run() {
        return isDE() ? 'Gern geschehen.' : 'My pleasure.';
      },
    },

    /* ---- Uhrzeit ---- */
    {
      id: 'time',
      re: /(wie sp(ä|a)t|uhrzeit|die zeit|what time|current time|time is it)/i,
      run() {
        const now = new Date();
        return isDE()
          ? `Es ist ${fmtTimeFull(now)} Uhr.`
          : `It is ${fmtTimeFull(now)}.`;
      },
    },

    /* ---- Datum ---- */
    {
      id: 'date',
      re: /(welches datum|welcher tag|datum heute|heutige datum|what.s the date|what date|what day is it|today.s date)/i,
      run() {
        return isDE() ? `Heute ist ${fmtDate()}.` : `Today is ${fmtDate()}.`;
      },
    },

    /* ---- Wetter ---- */
    {
      id: 'weather',
      re: /(wetter|temperatur|regnet|schneit|weather|temperature|forecast|is it raining)/i,
      async run(_m, text) {
        const n = norm(text);
        const place = (n.match(/\b(?:in|für|fuer|for|at)\s+([a-zäöüß\-\s]{2,40})$/i) || [])[1];
        try {
          return await Weather.report(place ? place.trim() : null);
        } catch (err) {
          return `${t('netError')} (${err.message})`;
        }
      },
    },

    /* ---- Timer ---- */
    {
      id: 'timerSet',
      re: /(timer|wecker|countdown|erinnere mich in|erinner mich in|remind me in|set a timer|stell(e)? (einen|nen)? timer)/i,
      run(_m, text) {
        const n = norm(text);

        if (/(zeig|liste|welche|list|show|laufen)/.test(n) && !/\d/.test(n)) {
          if (!memory.timers.length) return isDE() ? 'Es läuft kein Timer.' : 'No timers running.';
          const lines = memory.timers.map((x) => {
            const left = humanDuration(x.at - Date.now());
            return `• ${x.label || (isDE() ? 'Timer' : 'Timer')} — ${left} (${fmtTime(new Date(x.at))})`;
          });
          return (isDE() ? 'Aktive Timer:\n' : 'Active timers:\n') + lines.join('\n');
        }

        if (/(abbrech|abbrechen|lösch|stopp|stoppen|cancel|remove|clear)/.test(n)) {
          const n2 = Timers.cancelAll();
          return n2
            ? (isDE() ? `${n2} Timer abgebrochen.` : `Cancelled ${n2} timers.`)
            : (isDE() ? 'Es läuft kein Timer.' : 'There were no timers.');
        }

        // Dauer erkennen: „5 minuten“, „fünf minuten“, „1 stunde 30“, „90 sekunden“
        const unitRe = /(\d+(?:[.,]\d+)?|[a-zäöüß]+)\s*(stunden?|std|h|hours?|hrs?|minuten?|min|m|minutes?|sekunden?|sek|s|seconds?|secs?)\b/gi;
        let ms = 0;
        let found = false;
        let match;
        while ((match = unitRe.exec(n)) !== null) {
          const value = parseNumber(match[1]);
          if (value == null) continue;
          const unit = match[2].toLowerCase();
          let factor = 0;
          if (/^(stunden?|std|h|hours?|hrs?)$/.test(unit)) factor = 3600000;
          else if (/^(minuten?|min|m|minutes?)$/.test(unit)) factor = 60000;
          else if (/^(sekunden?|sek|s|seconds?|secs?)$/.test(unit)) factor = 1000;
          if (!factor) continue;
          ms += value * factor;
          found = true;
        }

        if (!found || ms <= 0) {
          return isDE()
            ? 'Wie lange? Zum Beispiel: „Timer 10 Minuten“ oder „Erinnere mich in 1 Stunde ans Lüften“.'
            : 'For how long? For example: “timer 10 minutes” or “remind me in 1 hour to stretch”.';
        }

        const labelMatch = n.match(/\b(?:an|ans|am|to|about|für|fuer)\s+(.{2,60})$/i);
        const label = labelMatch ? labelMatch[1].trim() : '';
        const at = Date.now() + ms;
        Timers.add(label, at, label ? 'reminder' : 'timer');
        Audio_.beep(880, 90);

        return isDE()
          ? `Timer gestellt: ${humanDuration(ms)}${label ? ` — ${label}` : ''}. Ich melde mich um ${fmtTime(new Date(at))} Uhr.`
          : `Timer set for ${humanDuration(ms)}${label ? ` — ${label}` : ''}. I will call you at ${fmtTime(new Date(at))}.`;
      },
    },

    /* ---- Erinnerung zu einer Uhrzeit ---- */
    {
      id: 'reminderAt',
      re: /(erinnere mich um|erinner mich um|remind me at|wecke mich um|wake me at)/i,
      run(_m, text) {
        const n = norm(text);
        const m = n.match(/(?:um|at)\s+(\d{1,2})(?::|\.|\s?uhr\s?)?(\d{2})?\s*(uhr|am|pm)?/i);
        if (!m) {
          return isDE() ? 'Zu welcher Uhrzeit?' : 'At what time?';
        }
        let hour = parseInt(m[1], 10);
        const minute = m[2] ? parseInt(m[2], 10) : 0;
        const suffix = (m[3] || '').toLowerCase();
        if (suffix === 'pm' && hour < 12) hour += 12;
        if (suffix === 'am' && hour === 12) hour = 0;
        if (hour > 23 || minute > 59) return isDE() ? 'Diese Uhrzeit gibt es nicht.' : 'That is not a valid time.';

        const at = new Date();
        at.setHours(hour, minute, 0, 0);
        if (at.getTime() <= Date.now()) at.setDate(at.getDate() + 1);

        const labelMatch = n.match(/\b(?:an|ans|am|to|about|für|fuer|dass|daran)\s+(.{2,60})$/i);
        const label = labelMatch ? labelMatch[1].trim() : '';
        Timers.add(label, at.getTime(), 'reminder');

        return isDE()
          ? `Erinnerung um ${fmtTime(at)} Uhr gespeichert${label ? `: ${label}` : ''}.`
          : `Reminder saved for ${fmtTime(at)}${label ? `: ${label}` : ''}.`;
      },
    },

    /* ---- Aufgaben ---- */
    {
      id: 'tasks',
      re: /(aufgabe|aufgaben|task|tasks|todo|to-do|einkaufsliste|meine liste)/i,
      run(_m, text) {
        const n = norm(text);
        const open = () => memory.tasks.filter((x) => !x.done);

        if (/(zeig|liste|welche|was steht|list|show|what.s on)/.test(n)) {
          if (!memory.tasks.length) return isDE() ? 'Deine Liste ist leer.' : 'Your list is empty.';
          const lines = memory.tasks.map((x, i) => `${i + 1}. ${x.done ? '✓ ' : ''}${x.text}`);
          return (isDE() ? 'Deine Aufgaben:\n' : 'Your tasks:\n') + lines.join('\n');
        }

        if (/(alle (löschen|lösch|entfernen)|liste leeren|clear (all|the list)|delete all|remove all)/.test(n)) {
          const count = memory.tasks.length;
          memory.tasks = [];
          saveMemory();
          UI.renderTasks();
          return isDE() ? `${count} Aufgaben gelöscht.` : `Deleted ${count} tasks.`;
        }

        if (/(erledigt|fertig|abhaken|done|complete|finished|check off)/.test(n)) {
          const numMatch = n.match(/\b(\d+)\b/);
          let target = null;
          if (numMatch) {
            target = memory.tasks[parseInt(numMatch[1], 10) - 1];
          } else {
            const words = n.replace(/.*(erledigt|fertig|abhaken|done|complete|finished|check off)/, '').trim();
            if (words) target = memory.tasks.find((x) => !x.done && x.text.toLowerCase().includes(words));
            if (!target) target = open()[0];
          }
          if (!target) return isDE() ? 'Ich finde diese Aufgabe nicht.' : 'I cannot find that task.';
          target.done = true;
          saveMemory();
          UI.renderTasks();
          return isDE() ? `„${target.text}“ ist erledigt. Noch ${open().length} offen.` : `“${target.text}” is done. ${open().length} left.`;
        }

        // sonst: hinzufügen
        let body = text
          .replace(/^\s*(füge|fuege|add|neue|new|erstelle|create|setz|put)\s+/i, '')
          .replace(/\b(die|eine|der|a|an|the)\s+/i, '')
          .replace(/\b(aufgaben?|tasks?|to-?dos?|einkaufsliste|meine liste)\b/i, '')
          .replace(/\b(hinzu|hinzufügen|auf die liste|to (my|the) list|to my tasks)\b/i, '')
          .replace(/^[\s:,-]+|[\s:,-]+$/g, '')
          .trim();

        if (!body) {
          return isDE()
            ? 'Was soll auf die Liste? Sag zum Beispiel: „Füge Aufgabe Milch kaufen hinzu“.'
            : 'What should I add? Say for example: “add task buy milk”.';
        }

        memory.tasks.push({ id: uid(), text: body, done: false });
        saveMemory();
        UI.renderTasks();
        return isDE() ? `Notiert: ${body}. Damit hast du ${open().length} offene Aufgaben.` : `Added: ${body}. That makes ${open().length} open tasks.`;
      },
    },

    /* ---- Notizen ---- */
    {
      id: 'notes',
      re: /(notiz|notizen|notier|notiere|merk dir|merke dir|note that|notes?\b|remember that|write down)/i,
      run(_m, text) {
        const n = norm(text);

        if (/(zeig|liste|welche|vorlesen|list|show|read)/.test(n) && !/(notier|merk|write down|remember that)/.test(n)) {
          if (!memory.notes.length) return isDE() ? 'Du hast keine Notizen.' : 'You have no notes.';
          const lines = memory.notes.map((x, i) => `${i + 1}. ${x.text}`);
          return (isDE() ? 'Deine Notizen:\n' : 'Your notes:\n') + lines.join('\n');
        }

        if (/(alle löschen|löschen|lösche|clear|delete all|remove all)/.test(n)) {
          const count = memory.notes.length;
          memory.notes = [];
          saveMemory();
          UI.renderNotes();
          return isDE() ? `${count} Notizen gelöscht.` : `Deleted ${count} notes.`;
        }

        const body = text
          .replace(/^\s*(bitte\s+)?(notier(e)?|merk(e)? dir|schreib(e)? auf|note that|note|remember that|write down)\s*/i, '')
          .replace(/^[\s:,-]+/, '')
          .trim();

        if (!body) return isDE() ? 'Was soll ich notieren?' : 'What should I note down?';

        memory.notes.unshift({ id: uid(), text: body, at: Date.now() });
        memory.notes = memory.notes.slice(0, 100);
        saveMemory();
        UI.renderNotes();
        return isDE() ? `Notiert: ${body}` : `Noted: ${body}`;
      },
    },

    /* ---- Einheiten umrechnen ---- */
    {
      id: 'convert',
      re: /(\d+(?:[.,]\d+)?)\s*([a-zäöüß°/]+(?:\s+[a-zäöüß°/]+)?)\s+(?:in|nach|to|as)\s+([a-zäöüß°/]+(?:\s+[a-zäöüß°/]+)?)/i,
      run(m) {
        const value = parseFloat(String(m[1]).replace(',', '.'));
        // „Grad Celsius" / „degrees C" auf die reine Einheit kürzen
        const strip = (u) => String(u)
          .replace(/\b(grad|grade|degrees?|einheiten?|units?)\b/gi, '')
          .replace(/\s+/g, ' ')
          .trim();
        const from = strip(m[2]);
        const to = strip(m[3]);
        if (!from || !to) return null;
        const res = convertUnits(value, from, to);
        if (!res) return null;   // kein passendes Paar → nächster Skill
        // Nachkommastellen an die Größenordnung anpassen — „6,213712 Meilen“ hilft niemandem.
        const abs = Math.abs(res.value);
        const digits = abs >= 100 ? 1 : abs >= 10 ? 2 : abs >= 1 ? 3 : 4;
        const shown = Calc.pretty(Number(res.value.toFixed(digits)));
        return `${fmtNum(value, value % 1 ? 2 : 0)} ${res.from} = ${shown} ${res.unit}`;
      },
    },

    /* ---- Rechnen ---- */
    {
      id: 'calc',
      re: /(rechne|berechne|calculate|compute|wie ?viel ist|was ist|what is|what.s|how much is|wurzel aus|quadratwurzel|square root of|sqrt|hoch \d|to the power of|prozent von|percent of|^[\d(].*[-+*/^%x×÷].*)/i,
      run(_m, text) {
        const expr = text
          .replace(/^\s*(bitte\s+)?(rechne mir|rechne|berechne|calculate|compute|wie ?viel ist|was ist|what is|what.s|how much is)\s*/i, '')
          .replace(/[?]+$/, '')
          .trim();
        const result = Calc.evaluate(expr);
        if (result === null) return null;   // keine Rechnung → nächster Skill (z. B. Wissen)
        return `${expr.replace(/\s+/g, ' ')} = ${Calc.pretty(result)}`;
      },
    },

    /* ---- Zufall ---- */
    {
      id: 'random',
      re: /(würfel|wuerfel|würfle|dice|roll a die|münze|muenze|coin|kopf oder zahl|heads or tails|zufallszahl|random number|zufällige zahl)/i,
      run(_m, text) {
        const n = norm(text);
        if (/(münze|muenze|coin|kopf oder zahl|heads or tails)/.test(n)) {
          const heads = Math.random() < 0.5;
          return isDE() ? `${heads ? 'Kopf' : 'Zahl'}.` : `${heads ? 'Heads' : 'Tails'}.`;
        }
        const range = n.match(/(?:zwischen|between|von|from)\s+(-?\d+)\s*(?:und|and|bis|to)\s+(-?\d+)/i);
        if (range) {
          const lo = Math.min(parseInt(range[1], 10), parseInt(range[2], 10));
          const hi = Math.max(parseInt(range[1], 10), parseInt(range[2], 10));
          const value = lo + Math.floor(Math.random() * (hi - lo + 1));
          return isDE() ? `${value}.` : `${value}.`;
        }
        if (/(zufallszahl|random number|zufällige zahl)/.test(n)) {
          return `${1 + Math.floor(Math.random() * 100)}`;
        }
        const sides = parseInt((n.match(/\b(?:w|d)(\d{1,3})\b/) || [])[1] || '6', 10);
        return isDE() ? `Eine ${1 + Math.floor(Math.random() * sides)}.` : `A ${1 + Math.floor(Math.random() * sides)}.`;
      },
    },

    /* ---- Witz ---- */
    {
      id: 'joke',
      re: /(witz|scherz|joke|make me laugh|erheiter)/i,
      run() {
        const list = JOKES[isDE() ? 'de' : 'en'];
        return list[Math.floor(Math.random() * list.length)];
      },
    },

    /* ---- Systembericht ---- */
    {
      id: 'status',
      re: /(systemstatus|status|diagnose|diagnostics|bericht|report|wie geht es dir|how are you)/i,
      async run() {
        const bits = [];
        bits.push(isDE() ? `Uhrzeit ${fmtTime()}` : `Time ${fmtTime()}`);
        bits.push(online() ? (isDE() ? 'Netzwerk verbunden' : 'network connected') : (isDE() ? 'offline' : 'offline'));
        bits.push(isDE()
          ? `Mikrofon ${STT.supported ? (state.micAllowed === false ? 'gesperrt' : 'bereit') : 'nicht verfügbar'}`
          : `microphone ${STT.supported ? (state.micAllowed === false ? 'blocked' : 'ready') : 'unavailable'}`);
        bits.push(isDE()
          ? `KI-Modus ${settings.ai.mode === 'off' ? 'aus' : 'an'}`
          : `AI mode ${settings.ai.mode === 'off' ? 'off' : 'on'}`);

        if (navigator.getBattery) {
          try {
            const bat = await navigator.getBattery();
            bits.push(isDE()
              ? `Akku ${Math.round(bat.level * 100)} Prozent${bat.charging ? ', lädt' : ''}`
              : `battery ${Math.round(bat.level * 100)} percent${bat.charging ? ', charging' : ''}`);
          } catch { /* nicht verfügbar */ }
        }

        const open = memory.tasks.filter((x) => !x.done).length;
        bits.push(isDE()
          ? `${open} offene ${open === 1 ? 'Aufgabe' : 'Aufgaben'}, ${memory.timers.length} ${memory.timers.length === 1 ? 'Timer' : 'Timer'}`
          : `${open} open ${open === 1 ? 'task' : 'tasks'}, ${memory.timers.length} ${memory.timers.length === 1 ? 'timer' : 'timers'}`);

        return (isDE() ? 'Alle Systeme laufen. ' : 'All systems nominal. ') + bits.join(', ') + '.';
      },
    },

    /* ---- Sprache wechseln ---- */
    {
      id: 'language',
      re: /(sprich (deutsch|englisch|english|german)|speak (german|english|deutsch)|switch to (german|english)|auf (deutsch|englisch) (umstellen|wechseln))/i,
      run(_m, text) {
        const wantsEN = /(englisch|english)/i.test(text);
        settings.lang = wantsEN ? 'en-US' : 'de-DE';
        saveSettings();
        UI.applyLanguage();
        STT.relang();
        return t('langSet');
      },
    },

    /* ---- Sprachausgabe steuern ---- */
    {
      id: 'voiceControl',
      re: /(schneller|langsamer|lauter|leiser|faster|slower|sprich nicht|nicht mehr sprechen|stop talking|stumm|mute|unmute|sprich wieder|speak again)/i,
      run(_m, text) {
        const n = norm(text);
        if (/(sprich nicht|nicht mehr sprechen|stop talking|stumm|mute)/.test(n)) {
          settings.speak = false;
          saveSettings();
          UI.syncSettingsForm();
          TTS.stop();
          return { text: isDE() ? 'Sprachausgabe aus. Ich antworte schriftlich.' : 'Speech output off. I will answer in writing.', silent: true };
        }
        if (/(unmute|sprich wieder|speak again|sprachausgabe an)/.test(n)) {
          settings.speak = true;
          saveSettings();
          UI.syncSettingsForm();
          return isDE() ? 'Sprachausgabe wieder an.' : 'Speech output back on.';
        }
        if (/(schneller|faster)/.test(n)) settings.rate = clamp(settings.rate + 0.15, 0.6, 1.6);
        if (/(langsamer|slower)/.test(n)) settings.rate = clamp(settings.rate - 0.15, 0.6, 1.6);
        if (/(lauter|higher|hoch)/.test(n)) settings.pitch = clamp(settings.pitch + 0.1, 0.5, 1.5);
        if (/(leiser|tiefer|lower)/.test(n)) settings.pitch = clamp(settings.pitch - 0.1, 0.5, 1.5);
        saveSettings();
        UI.syncSettingsForm();
        return isDE() ? `Tempo ${settings.rate.toFixed(2)}, Tonhöhe ${settings.pitch.toFixed(2)}.` : `Rate ${settings.rate.toFixed(2)}, pitch ${settings.pitch.toFixed(2)}.`;
      },
    },

    /* ---- Vollbild ---- */
    {
      id: 'fullscreen',
      re: /(vollbild|fullscreen|ganzer bildschirm)/i,
      run() {
        try {
          if (document.fullscreenElement) document.exitFullscreen();
          else document.documentElement.requestFullscreen();
        } catch { /* verweigert */ }
        return { text: t('ok'), silent: true };
      },
    },

    /* ---- Letzte Antwort kopieren ---- */
    {
      id: 'copy',
      re: /(kopiere das|kopier das|copy that|in die zwischenablage|copy to clipboard)/i,
      async run() {
        if (!state.lastReply) return isDE() ? 'Es gibt noch nichts zu kopieren.' : 'There is nothing to copy yet.';
        try {
          await navigator.clipboard.writeText(state.lastReply);
          return { text: t('copied'), silent: true };
        } catch {
          return isDE() ? 'Der Browser lässt das Kopieren nicht zu.' : 'The browser refused clipboard access.';
        }
      },
    },

    /* ---- Websuche / Seite öffnen ---- */
    {
      id: 'open',
      re: /(such(e)? (nach|auf)|google|youtube|öffne|oeffne|open|zeig mir .* auf|search for|look up on)/i,
      run(_m, text) {
        const n = norm(text);

        const engineMatch = n.match(/\b(google|youtube|wikipedia|maps|karten|github)\b/);
        const engine = engineMatch ? (engineMatch[1] === 'karten' ? 'maps' : engineMatch[1]) : null;

        let query = text
          .replace(/^\s*(bitte\s+)?(such(e)?|search|look up|zeig mir|show me|öffne|oeffne|open)\s*/i, '')
          .replace(/\b(nach|for|auf|on|in)\b/i, ' ')
          .replace(/\b(google|youtube|wikipedia|maps|karten|github)\b/i, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        // „öffne youtube“ ohne Suchbegriff → Startseite
        if (!query && engine && KNOWN_SITES[engine]) {
          return openUrl(KNOWN_SITES[engine], engine);
        }
        if (!query) {
          const site = Object.keys(KNOWN_SITES).find((k) => n.includes(k));
          if (site) return openUrl(KNOWN_SITES[site], site);
          return isDE() ? 'Wonach soll ich suchen?' : 'What should I search for?';
        }

        const build = SEARCH_ENGINES[engine || 'google'];
        return openUrl(build(query), `${engine || 'Google'}: ${query}`);
      },
    },

    /* ---- Wissen (Wikipedia) ---- */
    {
      id: 'knowledge',
      re: /^(wer (ist|war|sind)|was (ist|sind|war)|erzähl mir (etwas )?über|erzaehl mir (etwas )?ueber|erkläre|erklaere|who (is|was|are)|what (is|are|was)|tell me about|explain)\b/i,
      async run(_m, text) {
        const term = text
          .replace(/^\s*(wer (ist|war|sind)|was (ist|sind|war)|erzähl mir (etwas )?über|erzaehl mir (etwas )?ueber|erkläre( mir)?|erklaere( mir)?|who (is|was|are)|what (is|are|was)|tell me about|explain)\s*/i, '')
          .replace(/^(der|die|das|ein|eine|the|a|an)\s+/i, '')
          .replace(/[?.!]+$/, '')
          .trim();

        if (!term) return null;

        const hit = await wikiSummary(term);
        if (!hit) return null;   // nichts gefunden → KI-Modus oder Standardantwort

        const link = hit.url
          ? `\n\n<a href="${esc(hit.url)}" target="_blank" rel="noopener">Wikipedia</a>`
          : '';
        return { text: hit.text + link, speak: hit.text };
      },
    },
  ];

  /* =======================================================
     8. KI-Modus — Claude Messages API
     ======================================================= */

  const AI = {
    // Der Proxy liegt auf diesem Rechner; von einer fremden https-Seite ist er
    // nicht erreichbar. Der Direktweg zu api.anthropic.com dagegen schon.
    enabled: () => settings.ai.mode === 'direct'
      || (settings.ai.mode === 'proxy' && LOCAL_OK),

    defaultPersona() {
      return isDE()
        ? 'Du bist J.A.R.V.I.S., ein ruhiger, präziser und höflicher Assistent. '
          + 'Antworte knapp — höchstens drei Sätze — denn deine Antwort wird laut vorgelesen. '
          + 'Verzichte auf Markdown, Aufzählungszeichen und Emojis. Sag offen, wenn du etwas nicht weißt.'
        : 'You are J.A.R.V.I.S., a calm, precise and courteous assistant. '
          + 'Keep answers short — three sentences at most — because they are read out loud. '
          + 'No markdown, no bullet points, no emoji. Say plainly when you do not know something.';
    },

    systemPrompt() {
      const persona = settings.ai.persona?.trim() || this.defaultPersona();
      const open = memory.tasks.filter((x) => !x.done);
      const context = [
        isDE() ? `Aktuelle Zeit: ${fmtTimeFull()} am ${fmtDate()}.` : `Current time: ${fmtTimeFull()} on ${fmtDate()}.`,
        isDE() ? `Antworte auf Deutsch.` : `Answer in English.`,
        open.length
          ? (isDE() ? `Offene Aufgaben des Nutzers: ${open.map((x) => x.text).join('; ')}.` : `The user's open tasks: ${open.map((x) => x.text).join('; ')}.`)
          : '',
      ].filter(Boolean).join(' ');
      return `${persona}\n\n${context}`;
    },

    endpoint() {
      return settings.ai.mode === 'direct'
        ? 'https://api.anthropic.com/v1/messages'
        : settings.ai.proxyUrl;
    },

    headers() {
      if (settings.ai.mode === 'direct') {
        return {
          'content-type': 'application/json',
          'x-api-key': settings.ai.apiKey,
          'anthropic-version': '2023-06-01',
          // Erlaubt den Aufruf direkt aus dem Browser (CORS).
          'anthropic-dangerous-direct-browser-access': 'true',
        };
      }
      return { 'content-type': 'application/json' };
    },

    /**
     * Fragt Claude und schreibt die Antwort schrittweise in `onDelta`.
     * Verarbeitet sowohl SSE-Streams als auch einfache JSON-Antworten,
     * damit eigene Proxys beide Formen liefern dürfen.
     */
    async ask(userText, onDelta) {
      if (settings.ai.mode === 'direct' && !settings.ai.apiKey) {
        throw new Error(isDE()
          ? 'Es ist kein API-Schlüssel hinterlegt.'
          : 'No API key configured.');
      }
      if (settings.ai.mode === 'proxy' && !settings.ai.proxyUrl) {
        throw new Error(isDE() ? 'Es ist keine Proxy-Adresse hinterlegt.' : 'No proxy address configured.');
      }
      if (!online()) throw new Error(t('offline'));

      const messages = memory.history.slice(-12).concat([{ role: 'user', content: userText }]);

      const model = settings.ai.model || 'claude-opus-5';
      const body = {
        model,
        max_tokens: 1024,            // Antworten werden vorgelesen — bewusst kurz
        system: this.systemPrompt(),
        messages,
        stream: true,
        // Niedriger Aufwand hält die Antwortzeit kurz; ältere Modelle kennen
        // das Feld nicht, deshalb nur für die aktuellen setzen.
        ...(/^claude-(opus-5|sonnet-5|fable-5|opus-4-[678])/.test(model)
          ? { output_config: { effort: 'low' } }
          : {}),
      };

      const res = await fetch(this.endpoint(), {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        let detail = '';
        try { detail = (await res.text()).slice(0, 400); } catch { /* ignorieren */ }
        if (res.status === 401 || res.status === 403) {
          throw new Error(isDE()
            ? 'Der API-Schlüssel wurde abgelehnt (401/403).'
            : 'The API key was rejected (401/403).');
        }
        if (res.status === 429) {
          throw new Error(isDE() ? 'Zu viele Anfragen — kurz warten.' : 'Rate limited — please wait a moment.');
        }
        throw new Error(`HTTP ${res.status}${detail ? ` — ${detail}` : ''}`);
      }

      const type = res.headers.get('content-type') || '';

      // Einfache JSON-Antwort (z. B. ein Proxy ohne Streaming)
      if (!type.includes('text/event-stream')) {
        const data = await res.json();
        const text = Array.isArray(data?.content)
          ? data.content.filter((b) => b.type === 'text').map((b) => b.text).join('')
          : (data?.text ?? data?.completion ?? '');
        if (text && onDelta) onDelta(text, text);
        return String(text || '').trim();
      }

      // Server-Sent Events
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let full = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const chunks = buffer.split('\n\n');
        buffer = chunks.pop() || '';

        for (const chunk of chunks) {
          for (const line of chunk.split('\n')) {
            if (!line.startsWith('data:')) continue;
            const payload = line.slice(5).trim();
            if (!payload || payload === '[DONE]') continue;
            let evt;
            try { evt = JSON.parse(payload); } catch { continue; }

            if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta') {
              full += evt.delta.text;
              if (onDelta) onDelta(evt.delta.text, full);
            } else if (evt.type === 'error') {
              throw new Error(evt.error?.message || 'stream error');
            } else if (evt.type === 'text' && typeof evt.text === 'string') {
              // Kulanz für einfache eigene Proxys
              full += evt.text;
              if (onDelta) onDelta(evt.text, full);
            }
          }
        }
      }

      return full.trim();
    },

    remember(userText, reply) {
      memory.history.push({ role: 'user', content: userText });
      memory.history.push({ role: 'assistant', content: reply });
      memory.history = memory.history.slice(-24);
      saveMemory();
    },
  };

  /* =======================================================
     8b. Agent — Aufträge auf diesem Rechner
     ======================================================= */

  const Agent = {
    runId: null,
    sessionId: null,
    card: null,
    pending: [],          // offene Rückfragen, neueste zuletzt

    enabled() {
      // Ohne erreichbaren Dienst hilft die Einstellung nicht — dann lieber
      // ehrlich sagen, was geht, statt in einen Fehler zu laufen.
      return Boolean(LOCAL_OK && settings.agent.enabled && settings.agent.url);
    },

    base(suffix = '') {
      return settings.agent.url.replace(/\/+$/, '') + suffix;
    },

    busy() {
      return Boolean(this.runId);
    },

    /** Gibt es eine unbeantwortete Rückfrage? */
    hasPending() {
      return this.pending.length > 0;
    },

    /** Die neueste Rückfrage beantworten — auch per Sprache. */
    answerLatest(approved) {
      const entry = this.pending.pop();
      if (!entry) return false;
      entry.settle(approved);
      this.permit(entry.id, approved);
      return true;
    },

    async permit(id, approved) {
      try {
        await fetch(this.base('/permit'), {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ id, approved }),
        });
      } catch { /* Lauf womöglich schon beendet */ }
    },

    async stop() {
      if (!this.runId) return;
      try {
        await fetch(this.base('/stop'), {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ runId: this.runId }),
        });
      } catch { /* egal */ }
    },

    /** Auftrag senden und den Fortschritt live ins Protokoll schreiben. */
    async run(prompt) {
      if (this.busy()) {
        UI.reply(isDE() ? 'Ich arbeite noch an der letzten Aufgabe.' : 'I am still working on the last task.');
        return;
      }

      const card = UI.runCard();
      this.card = card;
      this.pending = [];
      state.thinking = true;
      UI.setState('thinking');

      let spoken = '';

      try {
        const res = await fetch(this.base(), {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ prompt, sessionId: this.sessionId || undefined }),
        });

        if (!res.ok) {
          let detail = '';
          try { detail = (await res.text()).slice(0, 200); } catch { /* egal */ }
          throw new Error(`HTTP ${res.status}${detail ? ` — ${detail}` : ''}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const chunks = buffer.split('\n\n');
          buffer = chunks.pop() || '';

          for (const chunk of chunks) {
            for (const line of chunk.split('\n')) {
              if (!line.startsWith('data:')) continue;
              const raw = line.slice(5).trim();
              if (!raw || raw === '[DONE]') continue;
              let evt;
              try { evt = JSON.parse(raw); } catch { continue; }
              spoken = this.handle(evt, card, spoken);
            }
          }
        }

        card.finish();
        const say = spoken.trim() || t('agentDone');
        state.lastReply = say;
        TTS.speak(say);
      } catch (err) {
        const offline = /failed to fetch|networkerror|load failed/i.test(err.message || '');
        const message = offline ? t('agentOffline') : `${t('netError')} — ${err.message}`;
        card.fail(message);
        TTS.speak(offline ? t('agentOffline') : t('netError'));
      } finally {
        this.runId = null;
        this.card = null;
        this.pending = [];
        state.thinking = false;
        UI.setState(state.listening ? 'listening' : 'idle');
        UI.updateSystemCard();
      }
    },

    /** Ein Ereignis des Agenten verarbeiten. */
    handle(evt, card, spoken) {
      switch (evt.type) {
        case 'start':
          this.runId = evt.runId;
          this.sessionId = evt.sessionId;
          card.setWorkspace(evt.workspace);
          UI.updateSystemCard();
          return spoken;

        case 'text':
          card.addText(evt.text);
          return spoken + evt.text;

        case 'tool':
          card.addStep(evt.name, evt.detail, evt.auto ? 'auto' : 'run');
          return spoken;

        case 'progress':
          card.addStep('', evt.detail, 'note');
          return spoken;

        case 'tool_error':
          card.addStep('', evt.detail, 'error');
          return spoken;

        case 'permission': {
          const entry = card.addPermission(evt.id, evt.tool, evt.detail, (approved) => {
            // Klick im Browser — aus der Warteliste nehmen und melden
            this.pending = this.pending.filter((x) => x.id !== evt.id);
            this.permit(evt.id, approved);
          });
          this.pending.push(entry);
          // Bei Sprachbedienung laut nachfragen, damit „ja" reicht.
          if (state.wantListen) {
            TTS.speak(`${t('agentSpoken')}${evt.tool}. ${t('agentAsk')}`);
          }
          return spoken;
        }

        case 'stopped':
          card.addStep('', t('agentStopped'), 'note');
          return spoken;

        case 'error':
          card.fail(evt.message);
          return spoken;

        case 'done':
          if (evt.sessionId) this.sessionId = evt.sessionId;
          if (evt.costUsd) card.setCost(evt.costUsd);
          return evt.text ? (spoken || evt.text) : spoken;

        default:
          return spoken;
      }
    },
  };

  /* =======================================================
     9. Verstand — Befehl zu Fähigkeit zuordnen
     ======================================================= */

  const Brain = {
    async handle(rawText, source = 'text') {
      const text = String(rawText || '').trim();
      if (!text) return;

      UI.setHint('');
      UI.userMsg(text);

      const n = norm(text);

      for (const skill of SKILLS) {
        if (!skill.re.test(n)) continue;

        let result;
        try {
          const m = text.match(skill.re) || n.match(skill.re);
          UI.setState('thinking');
          result = await skill.run(m, text);
        } catch (err) {
          UI.errorMsg(`${t('netError')} — ${err.message}`);
          UI.setState(state.listening ? 'listening' : 'idle');
          return;
        }

        if (result == null) continue;   // Fähigkeit passt doch nicht → weitersuchen

        const payload = typeof result === 'string' ? { text: result } : result;
        UI.reply(payload.text, { speak: payload.silent ? null : (payload.speak ?? payload.text) });
        return;
      }

      // Nichts gefunden → Agent, KI-Modus oder Hinweis
      const filler = this.isFiller(n);

      if (Agent.enabled() && !filler && (this.looksLikeTask(text) || !AI.enabled())) {
        await Agent.run(text);
        return;
      }

      if (AI.enabled()) {
        await this.askAI(text);
        return;
      }

      UI.reply(filler ? t('fillerHint') : t(LOCAL_OK ? 'unknownAI' : 'remoteUnknown'));
    },

    /**
     * Kurze Bestätigungen, Füllwörter und einzelne Wörter sind keine Aufträge.
     * Ohne diese Bremse würde ein verhörtes „ja" den Agenten loslaufen lassen.
     */
    isFiller(n) {
      if (/^(ja|nein|nee|ne|ok|okay|klar|hm+|äh+|ähm+|hallo|hi|danke|bitte|was|wie|hä|na|so|yes|no|yeah|yep|nope|uh+|um+|what|huh|please|thanks|hey)$/i.test(n)) return true;
      return n.split(/\s+/).filter(Boolean).length < 2;
    },

    /**
     * Auftrag oder Frage? Aufträge gehen an den Agenten, Fragen ans Gespräch —
     * das spart Zeit und Geld, wenn beides eingeschaltet ist.
     */
    looksLikeTask(text) {
      const de = /\b(bau|baue|bauen|erstell|erstelle|erstellen|schreib|schreibe|leg an|lege an|anlegen|mach mir|mache mir|installier|installiere|richte ein|einrichten|ändere|ändern|repariere|behebe|füge hinzu|starte|führ aus|führe aus|lösche datei|benenne um|verschiebe|kopiere datei|committe|deploye|projekt|ordner|datei|skript|website|app|programm)\b/i;
      const en = /\b(build|create|make me|write|set up|install|fix|change|add|run|delete file|rename|move|copy file|commit|deploy|refactor|project|folder|file|script|website|app|program)\b/i;
      const n = norm(text);
      return de.test(n) || en.test(n);
    },

    async askAI(text) {
      state.thinking = true;
      UI.setState('thinking');
      const bubble = UI.pendingBubble();

      try {
        const reply = await AI.ask(text, (_delta, full) => bubble.update(full));
        const finalText = reply || (isDE() ? 'Keine Antwort erhalten.' : 'No answer received.');
        bubble.finish(finalText);
        AI.remember(text, finalText);
        state.lastReply = finalText;
        TTS.speak(finalText);
      } catch (err) {
        const hint = /failed to fetch|networkerror|load failed/i.test(err.message)
          ? (isDE()
            ? ' Prüfe, ob der Proxy läuft oder ob eine CORS-Sperre greift.'
            : ' Check whether the proxy is running or a CORS rule is blocking it.')
          : '';
        bubble.fail(`${err.message}${hint}`);
      } finally {
        state.thinking = false;
        UI.setState(state.listening ? 'listening' : 'idle');
      }
    },
  };

  /* =======================================================
     10. Oberfläche
     ======================================================= */

  const el = {};

  const CHIPS = {
    de: ['Wie spät ist es?', 'Wie ist das Wetter?', 'Timer 5 Minuten', 'Füge Aufgabe Milch kaufen hinzu',
         'Was ist 17 mal 23?', '10 km in Meilen', 'Wer ist Ada Lovelace?', 'Erzähl mir einen Witz', 'Systemstatus'],
    en: ['What time is it?', 'What is the weather?', 'Set a timer for 5 minutes', 'Add task buy milk',
         'What is 17 times 23?', '10 km in miles', 'Who is Ada Lovelace?', 'Tell me a joke', 'Status report'],
  };

  const HELP = {
    de: [
      ['Grundlagen', [
        ['Hilfe', 'Diese Übersicht öffnen'],
        ['Wer bist du?', 'Kurze Vorstellung'],
        ['Systemstatus', 'Zeit, Netz, Akku, Mikrofon, offene Aufgaben'],
        ['Stopp', 'Sprachausgabe sofort beenden'],
        ['Protokoll leeren', 'Gesprächsverlauf löschen'],
      ]],
      ['Zeit & Termine', [
        ['Wie spät ist es?', 'Aktuelle Uhrzeit'],
        ['Welches Datum haben wir?', 'Heutiges Datum'],
        ['Timer 10 Minuten', 'Countdown mit Signalton'],
        ['Erinnere mich in 1 Stunde ans Lüften', 'Erinnerung mit Text'],
        ['Erinnere mich um 18:30 an den Anruf', 'Erinnerung zur Uhrzeit'],
        ['Zeig mir die Timer', 'Laufende Timer anzeigen'],
        ['Timer abbrechen', 'Alle Timer löschen'],
      ]],
      ['Listen', [
        ['Füge Aufgabe Milch kaufen hinzu', 'Aufgabe anlegen'],
        ['Zeig meine Aufgaben', 'Liste vorlesen'],
        ['Aufgabe 1 erledigt', 'Aufgabe abhaken'],
        ['Alle Aufgaben löschen', 'Liste leeren'],
        ['Notiere: Passwort liegt im Safe', 'Notiz speichern'],
        ['Zeig meine Notizen', 'Notizen vorlesen'],
      ]],
      ['Wissen & Rechnen', [
        ['Was ist 17 mal 23?', 'Rechnen (+ − × ÷ ^ %, Wurzel, Klammern)'],
        ['Berechne (12 + 8) / 4', 'Klammerausdrücke'],
        ['10 km in Meilen', 'Einheiten umrechnen'],
        ['20 Grad C in F', 'Temperaturen umrechnen'],
        ['Wer ist Ada Lovelace?', 'Wikipedia-Zusammenfassung'],
        ['Wie ist das Wetter in Berlin?', 'Wetter über Open-Meteo'],
      ]],
      ['Web & System', [
        ['Suche nach Rezepten', 'Google-Suche öffnen'],
        ['Öffne YouTube', 'Website öffnen'],
        ['Suche Katzen auf YouTube', 'Gezielte Suche'],
        ['Vollbild', 'Vollbild ein/aus'],
        ['Kopiere das', 'Letzte Antwort in die Zwischenablage'],
      ]],
      ['Sprache', [
        ['Sprich Englisch', 'Auf Englisch umschalten'],
        ['Sprich langsamer', 'Tempo der Stimme senken'],
        ['Sei still', 'Sprachausgabe abschalten'],
        ['Würfle', 'Zufallszahl, Münzwurf, Würfel'],
        ['Erzähl einen Witz', 'Kleiner Scherz'],
      ]],
    ],
    en: [
      ['Basics', [
        ['Help', 'Open this overview'],
        ['Who are you?', 'Short introduction'],
        ['Status report', 'Time, network, battery, microphone, open tasks'],
        ['Stop', 'Stop speaking immediately'],
        ['Clear the log', 'Wipe the transcript'],
      ]],
      ['Time & scheduling', [
        ['What time is it?', 'Current time'],
        ['What is the date?', 'Today’s date'],
        ['Set a timer for 10 minutes', 'Countdown with a chime'],
        ['Remind me in 1 hour to stretch', 'Reminder with a label'],
        ['Remind me at 6:30 pm to call back', 'Reminder at a set time'],
        ['Show my timers', 'List running timers'],
        ['Cancel timers', 'Clear all timers'],
      ]],
      ['Lists', [
        ['Add task buy milk', 'Create a task'],
        ['Show my tasks', 'Read the list'],
        ['Task 1 done', 'Check a task off'],
        ['Delete all tasks', 'Empty the list'],
        ['Note that the key is under the mat', 'Save a note'],
        ['Show my notes', 'Read the notes'],
      ]],
      ['Knowledge & maths', [
        ['What is 17 times 23?', 'Maths (+ − × ÷ ^ %, roots, brackets)'],
        ['Calculate (12 + 8) / 4', 'Bracketed expressions'],
        ['10 km in miles', 'Unit conversion'],
        ['20 C in F', 'Temperature conversion'],
        ['Who is Ada Lovelace?', 'Wikipedia summary'],
        ['What is the weather in Berlin?', 'Weather via Open-Meteo'],
      ]],
      ['Web & system', [
        ['Search for recipes', 'Open a Google search'],
        ['Open YouTube', 'Open a website'],
        ['Search cats on YouTube', 'Targeted search'],
        ['Fullscreen', 'Toggle fullscreen'],
        ['Copy that', 'Last answer to the clipboard'],
      ]],
      ['Voice', [
        ['Speak German', 'Switch to German'],
        ['Speak slower', 'Lower the speech rate'],
        ['Be quiet', 'Turn speech output off'],
        ['Roll a die', 'Random number, coin flip, dice'],
        ['Tell me a joke', 'A small joke'],
      ]],
    ],
  };

  const UI = {
    init() {
      const ids = ['boot', 'bootLog', 'bootBar', 'bootEnter', 'brandDot', 'statusText', 'statusLed',
        'clockNow', 'btnHelp', 'btnSettings', 'log', 'chips', 'btnExport', 'btnClearLog', 'core',
        'viz', 'btnMic', 'btnMic2', 'coreCaption', 'coreHint', 'wakeBadge', 'dashMeta', 'wTime',
        'wDate', 'wTemp', 'wWeather', 'wNet', 'wBat', 'wMic', 'wAI', 'taskList', 'taskEmpty',
        'taskCount', 'noteList', 'noteEmpty', 'noteCount', 'timerList', 'timerEmpty', 'timerCount',
        'input', 'btnSend', 'btnStop', 'modalSettings', 'modalHelp', 'helpBody', 'toast',
        'setLang', 'setVoice', 'setRate', 'setPitch', 'outRate', 'outPitch', 'setWake', 'setSpeak',
        'setSfx', 'setAiMode', 'setProxyUrl', 'setApiKey', 'setModel', 'setPersona', 'fieldProxy',
        'fieldKey', 'btnSaveSettings', 'btnReset', 'setVoiceEngine', 'setVoiceMode', 'setVoiceProxy',
        'setVoiceKey', 'setVoiceId', 'setVoiceModel', 'btnVoiceTest', 'voiceBlock', 'fieldVoiceProxy',
        'fieldVoiceKey', 'fieldBrowserVoice', 'wVoice', 'setAgent', 'setAgentUrl', 'fieldAgentUrl', 'wAgent'];
      for (const id of ids) el[id] = document.getElementById(id);
    },

    /* ---- Zustand ---- */
    setState(name) {
      el.core.dataset.state = name;
      const map = {
        idle: ['statusIdle', ''],
        listening: ['statusListen', 'listen'],
        thinking: ['statusThink', 'busy'],
        speaking: ['statusSpeak', 'busy'],
        error: ['statusError', 'error'],
      };
      const [key, dot] = map[name] || map.idle;
      el.statusText.textContent = t(key);
      el.brandDot.dataset.state = dot;
      el.statusLed.style.background = name === 'listening' ? 'var(--green)'
        : name === 'thinking' ? 'var(--amber)'
        : name === 'error' ? 'var(--red)' : 'var(--cyan)';
      el.coreCaption.textContent = name === 'listening' ? t('listening')
        : name === 'thinking' ? t('thinking')
        : t('tapToTalk');
    },

    setHint(text) { el.coreHint.textContent = text || ''; },

    setMicLive(live) {
      el.btnMic2.classList.toggle('is-live', Boolean(live));
      el.wakeBadge.hidden = !(live && settings.wake);
      this.updateSystemCard();
    },

    /* ---- Nachrichten ---- */
    bubble(who, cls, html) {
      const wrap = document.createElement('div');
      wrap.className = `msg msg--${cls}`;
      wrap.innerHTML = `<span class="msg__who">${esc(who)}</span><div class="msg__body">${html}</div>`;
      el.log.appendChild(wrap);
      el.log.scrollTop = el.log.scrollHeight;
      return wrap;
    },

    /** Text mit erlaubten Links, alles andere maskiert. */
    render(text) {
      const parts = String(text).split(/(<a [^>]*>.*?<\/a>)/g);
      return parts.map((p) => (/^<a /.test(p) ? p : esc(p))).join('');
    },

    userMsg(text) { this.bubble(t('you'), 'user', this.render(text)); },

    say(text) { this.bubble(t('me'), 'jarvis', this.render(text)); },

    reply(text, opts = {}) {
      this.say(text);
      state.lastReply = String(text).replace(/<[^>]+>/g, '');
      const speech = opts.speak === undefined ? text : opts.speak;
      if (speech) TTS.speak(String(speech).replace(/<[^>]+>/g, ' '));
      this.setState(state.listening ? 'listening' : 'idle');
    },

    systemMsg(text, kind = 'system') { this.bubble(t('sys'), kind === 'error' ? 'error' : 'system', this.render(text)); },

    errorMsg(text) { this.bubble(t('sys'), 'error', this.render(text)); },

    /** Platzhalter-Blase, die während des Streamens wächst. */
    pendingBubble() {
      const wrap = this.bubble(t('me'), 'jarvis', '<span class="typing"><i></i><i></i><i></i></span>');
      const body = wrap.querySelector('.msg__body');
      return {
        update: (full) => {
          body.textContent = full;
          el.log.scrollTop = el.log.scrollHeight;
        },
        finish: (full) => {
          body.innerHTML = UI.render(full);
          el.log.scrollTop = el.log.scrollHeight;
        },
        fail: (message) => {
          wrap.className = 'msg msg--error';
          body.textContent = `${t('netError')} — ${message}`;
        },
      };
    },

    /** Karte, die einen laufenden Auftrag mitschreibt. */
    runCard() {
      const wrap = document.createElement('div');
      wrap.className = 'msg msg--jarvis msg--run';
      wrap.innerHTML = `
        <span class="msg__who">${esc(t('me'))}</span>
        <div class="msg__body run">
          <div class="run__head">
            <span class="run__spin"></span>
            <span class="run__title">${esc(t('agentRunning'))}</span>
            <button class="run__stop" type="button">${esc(t('agentStop'))}</button>
          </div>
          <div class="run__where"></div>
          <ul class="run__steps"></ul>
          <div class="run__text"></div>
        </div>`;
      el.log.appendChild(wrap);

      const steps = wrap.querySelector('.run__steps');
      const textBox = wrap.querySelector('.run__text');
      const where = wrap.querySelector('.run__where');
      const head = wrap.querySelector('.run__head');
      wrap.querySelector('.run__stop').addEventListener('click', () => Agent.stop());

      const scroll = () => { el.log.scrollTop = el.log.scrollHeight; };

      return {
        setWorkspace(dir) {
          where.textContent = dir || '';
          scroll();
        },

        addStep(name, detail, kind = 'run') {
          const li = document.createElement('li');
          li.className = `step step--${kind}`;
          const label = name ? `<b>${esc(name)}</b>` : '';
          const body = detail ? `<code>${esc(detail)}</code>` : '';
          const mark = kind === 'auto' ? '·' : kind === 'error' ? '!' : kind === 'note' ? '–' : '▸';
          li.innerHTML = `<span class="step__mark">${mark}</span><span class="step__body">${label}${label && body ? ' ' : ''}${body}</span>`;
          steps.appendChild(li);
          scroll();
        },

        addText(chunk) {
          textBox.textContent += chunk;
          scroll();
        },

        /** Rückfrage mit zwei Knöpfen; liefert einen Griff für die Sprachantwort. */
        addPermission(id, tool, detail, onAnswer) {
          const li = document.createElement('li');
          li.className = 'step step--ask';
          li.innerHTML = `
            <span class="step__mark">?</span>
            <span class="step__body">
              <b>${esc(t('agentAsk'))}</b>
              <span class="ask__tool">${esc(tool)}</span>
              ${detail ? `<code>${esc(detail)}</code>` : ''}
              <span class="ask__buttons">
                <button class="ask__yes" type="button">${esc(t('agentAllow'))}</button>
                <button class="ask__no" type="button">${esc(t('agentDeny'))}</button>
              </span>
            </span>`;
          steps.appendChild(li);
          scroll();

          const buttons = li.querySelector('.ask__buttons');
          let settled = false;

          const settle = (approved) => {
            if (settled) return;
            settled = true;
            li.classList.add(approved ? 'is-allowed' : 'is-denied');
            buttons.innerHTML = `<span class="ask__verdict">${esc(approved ? t('agentAllowed') : t('agentDenied'))}</span>`;
          };

          li.querySelector('.ask__yes').addEventListener('click', () => { settle(true); onAnswer(true); });
          li.querySelector('.ask__no').addEventListener('click', () => { settle(false); onAnswer(false); });

          return { id, settle };
        },

        setCost(usd) {
          const tag = document.createElement('span');
          tag.className = 'run__cost';
          tag.textContent = `$${usd.toFixed(4)}`;
          head.appendChild(tag);
        },

        finish() {
          wrap.classList.add('is-done');
          head.querySelector('.run__title').textContent = t('agentDone');
          scroll();
        },

        fail(message) {
          wrap.classList.add('is-failed');
          wrap.classList.remove('msg--jarvis');
          wrap.classList.add('msg--error');
          head.querySelector('.run__title').textContent = t('statusError');
          const li = document.createElement('li');
          li.className = 'step step--error';
          li.innerHTML = `<span class="step__mark">!</span><span class="step__body">${esc(message)}</span>`;
          steps.appendChild(li);
          scroll();
        },
      };
    },

    clearLog() { el.log.innerHTML = ''; },

    toast(text) {
      el.toast.textContent = text;
      el.toast.hidden = false;
      clearTimeout(this._toastTimer);
      this._toastTimer = setTimeout(() => { el.toast.hidden = true; }, 2600);
    },

    /* ---- Karten ---- */
    renderTasks() {
      const list = memory.tasks;
      el.taskCount.textContent = String(list.filter((x) => !x.done).length);
      el.taskEmpty.hidden = list.length > 0;
      el.taskList.innerHTML = list.map((x, i) => `
        <li class="${x.done ? 'is-done' : ''}" data-id="${x.id}">
          <span class="idx">${i + 1}</span>
          <span class="txt" title="${esc(x.text)}">${esc(x.text)}</span>
          <button class="kill" data-kill-task="${x.id}" aria-label="löschen">✕</button>
        </li>`).join('');
    },

    renderNotes() {
      const list = memory.notes;
      el.noteCount.textContent = String(list.length);
      el.noteEmpty.hidden = list.length > 0;
      el.noteList.innerHTML = list.slice(0, 8).map((x, i) => `
        <li data-id="${x.id}">
          <span class="idx">${i + 1}</span>
          <span class="txt" title="${esc(x.text)}">${esc(x.text)}</span>
          <button class="kill" data-kill-note="${x.id}" aria-label="löschen">✕</button>
        </li>`).join('');
    },

    renderTimers() {
      const list = memory.timers;
      el.timerCount.textContent = String(list.length);
      el.timerEmpty.hidden = list.length > 0;
      el.timerList.innerHTML = list.map((x) => {
        const left = humanDuration(x.at - Date.now());
        const label = x.label || (x.kind === 'reminder' ? (isDE() ? 'Erinnerung' : 'Reminder') : 'Timer');
        return `<li data-id="${x.id}">
          <span class="idx">◷</span>
          <span class="txt" title="${esc(label)}">${esc(label)}</span>
          <span class="when">${esc(left)}</span>
          <button class="kill" data-kill-timer="${x.id}" aria-label="löschen">✕</button>
        </li>`;
      }).join('');
    },

    setWeatherCard(temp, note) {
      el.wTemp.textContent = temp;
      el.wWeather.textContent = note;
    },

    async updateSystemCard() {
      el.wNet.textContent = online() ? (isDE() ? 'verbunden' : 'connected') : 'offline';
      el.wMic.textContent = !STT.supported
        ? (isDE() ? 'n. verfügbar' : 'unavailable')
        : EMBEDDED ? (isDE() ? 'im Rahmen gesperrt' : 'blocked in frame')
        : state.micAllowed === false ? (isDE() ? 'gesperrt' : 'blocked')
        : state.wantListen ? (isDE() ? 'aktiv' : 'live')
        : (isDE() ? 'bereit' : 'ready');
      el.wAI.textContent = settings.ai.mode === 'off'
        ? (isDE() ? 'aus' : 'off')
        : settings.ai.mode === 'proxy' ? 'proxy' : 'direct';
      el.wAgent.textContent = !settings.agent.enabled
        ? (isDE() ? 'aus' : 'off')
        : Agent.busy() ? (isDE() ? 'arbeitet' : 'working') : (isDE() ? 'bereit' : 'ready');
      el.wVoice.textContent = !settings.speak
        ? (isDE() ? 'stumm' : 'muted')
        : settings.voice.engine === 'elevenlabs'
          ? (TTS.failures >= 2 ? (isDE() ? 'System (Rückfall)' : 'system (fallback)') : 'ElevenLabs')
          : (isDE() ? 'System' : 'system');

      if (navigator.getBattery) {
        try {
          const bat = await navigator.getBattery();
          el.wBat.textContent = `${Math.round(bat.level * 100)} %${bat.charging ? ' ⚡' : ''}`;
        } catch { el.wBat.textContent = '—'; }
      } else {
        el.wBat.textContent = '—';
      }
    },

    /* ---- Sprache ---- */
    applyLanguage() {
      document.documentElement.lang = isDE() ? 'de' : 'en';
      $$('[data-i18n]').forEach((node) => {
        const key = node.dataset.i18n;
        const value = I18N[isDE() ? 'de' : 'en'][key];
        if (value) node.textContent = value;
      });
      $$('[data-i18n-ph]').forEach((node) => {
        const value = I18N[isDE() ? 'de' : 'en'][node.dataset.i18nPh];
        if (value) node.placeholder = value;
      });
      $$('.seg__btn').forEach((b) => b.classList.toggle('is-active', b.dataset.lang === settings.lang));
      el.bootEnter.textContent = t('bootEnter');

      this.renderChips();
      this.renderHelp();
      this.renderTasks();
      this.renderNotes();
      this.renderTimers();
      this.updateSystemCard();
      this.setState(state.listening ? 'listening' : 'idle');
      this.fillVoices();
    },

    renderChips() {
      const list = CHIPS[isDE() ? 'de' : 'en'];
      el.chips.innerHTML = list.map((c) => `<button class="chip" type="button">${esc(c)}</button>`).join('');
    },

    renderHelp() {
      const groups = HELP[isDE() ? 'de' : 'en'];
      el.helpBody.innerHTML = groups.map(([title, rows]) => `
        <section class="help-group">
          <h4>${esc(title)}</h4>
          <ul class="help-list">
            ${rows.map(([cmd, desc]) => `<li><em>${esc(cmd)}</em><span>${esc(desc)}</span></li>`).join('')}
          </ul>
        </section>`).join('');
    },

    openHelp() { el.modalHelp.hidden = false; },

    /* ---- Einstellungen ---- */
    fillVoices() {
      const voices = TTS.loadVoices();
      const base = settings.lang.slice(0, 2);
      const preferred = voices.filter((v) => v.lang.toLowerCase().startsWith(base));
      const rest = voices.filter((v) => !v.lang.toLowerCase().startsWith(base));
      const options = [`<option value="">${isDE() ? 'Automatisch' : 'Automatic'}</option>`]
        .concat([...preferred, ...rest].map((v) =>
          `<option value="${esc(v.voiceURI)}"${v.voiceURI === settings.voiceURI ? ' selected' : ''}>${esc(v.name)} — ${esc(v.lang)}</option>`));
      el.setVoice.innerHTML = options.join('');
    },

    syncSettingsForm() {
      el.setLang.value = settings.lang;
      el.setRate.value = settings.rate;
      el.setPitch.value = settings.pitch;
      el.outRate.textContent = Number(settings.rate).toFixed(2);
      el.outPitch.textContent = Number(settings.pitch).toFixed(2);
      el.setWake.checked = settings.wake;
      el.setSpeak.checked = settings.speak;
      el.setSfx.checked = settings.sfx;
      el.setAiMode.value = settings.ai.mode;
      el.setProxyUrl.value = settings.ai.proxyUrl;
      el.setApiKey.value = settings.ai.apiKey;
      el.setModel.value = settings.ai.model;
      el.setPersona.value = settings.ai.persona;
      el.setPersona.placeholder = AI.defaultPersona();
      el.setVoiceEngine.value = settings.voice.engine;
      el.setVoiceMode.value = settings.voice.mode;
      el.setVoiceProxy.value = settings.voice.proxyUrl;
      el.setVoiceKey.value = settings.voice.apiKey;
      el.setVoiceId.value = settings.voice.voiceId;
      el.setVoiceModel.value = settings.voice.model;
      el.setAgent.checked = settings.agent.enabled;
      el.setAgentUrl.value = settings.agent.url;
      this.toggleAiFields();
      this.toggleVoiceFields();
      this.markUnavailable();
      this.fillVoices();
    },

    /** Schalter sperren, die von dieser Seite aus nichts bewirken können. */
    markUnavailable() {
      if (LOCAL_OK) return;

      el.setAgent.checked = false;
      el.setAgent.disabled = true;
      el.setAgentUrl.disabled = true;

      for (const [field, select] of [[el.fieldAgentUrl, null], [el.fieldProxy, el.setAiMode]]) {
        if (!field || field.querySelector('.remote-note')) continue;
        const note = document.createElement('p');
        note.className = 'warn remote-note';
        note.textContent = t('remoteSetting');
        field.appendChild(note);
        if (select) select.dataset.remote = '1';
      }

      // Proxy-Optionen deutlich machen, ohne sie zu verstecken.
      for (const option of [...el.setAiMode.options, ...el.setVoiceMode.options]) {
        if (option.value === 'proxy' && !option.dataset.marked) {
          option.dataset.marked = '1';
          option.textContent += ' — hier nicht möglich';
        }
      }
    },

    toggleVoiceFields() {
      const eleven = el.setVoiceEngine.value === 'elevenlabs';
      el.voiceBlock.hidden = !eleven;
      el.fieldBrowserVoice.hidden = eleven;
      const direct = el.setVoiceMode.value === 'direct';
      el.fieldVoiceProxy.hidden = direct;
      el.fieldVoiceKey.hidden = !direct;
    },

    /** Formularwerte übernehmen, ohne das Fenster zu schließen (für den Test). */
    readVoiceForm() {
      settings.voice.engine = el.setVoiceEngine.value;
      settings.voice.mode = el.setVoiceMode.value;
      settings.voice.proxyUrl = el.setVoiceProxy.value.trim();
      settings.voice.apiKey = el.setVoiceKey.value.trim();
      settings.voice.voiceId = el.setVoiceId.value.trim();
      settings.voice.model = el.setVoiceModel.value;
      TTS.failures = 0;
      TTS.warned = false;
    },

    readAgentForm() {
      settings.agent.enabled = el.setAgent.checked;
      settings.agent.url = el.setAgentUrl.value.trim();
    },

    toggleAiFields() {
      const mode = el.setAiMode.value;
      el.fieldProxy.hidden = mode !== 'proxy';
      el.fieldKey.hidden = mode !== 'direct';
    },

    /* ---- Uhr ---- */
    startClock() {
      const tick = () => {
        const now = new Date();
        el.clockNow.textContent = fmtTime(now);
        el.wTime.textContent = fmtTimeFull(now);
        el.wDate.textContent = fmtDate(now);
        el.dashMeta.textContent = now.toLocaleDateString(locale(), { day: '2-digit', month: '2-digit' });
        if (memory.timers.length) this.renderTimers();
      };
      tick();
      setInterval(tick, 1000);
    },
  };

  /* =======================================================
     11. Visualizer
     ======================================================= */

  function startVisualizer() {
    const canvas = el.viz;
    const ctx = canvas.getContext('2d');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const BARS = 64;
    let phase = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
    };
    resize();
    window.addEventListener('resize', resize);

    const COLORS = {
      idle: ['rgba(34,211,238,', 'rgba(99,102,241,'],
      listening: ['rgba(52,211,153,', 'rgba(34,211,238,'],
      thinking: ['rgba(251,191,36,', 'rgba(236,72,153,'],
      speaking: ['rgba(168,85,247,', 'rgba(99,102,241,'],
      error: ['rgba(248,113,113,', 'rgba(168,85,247,'],
    };

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const base = Math.min(w, h) * 0.29;

      ctx.clearRect(0, 0, w, h);

      const mode = el.core.dataset.state || 'idle';
      const [c1, c2] = COLORS[mode] || COLORS.idle;
      const live = mode === 'listening' && Audio_.analyser;
      const levels = Audio_.levels(BARS, phase);
      const boost = mode === 'thinking' ? 1.5 : mode === 'speaking' ? 1.25 : 1;

      for (let i = 0; i < BARS; i++) {
        const angle = (i / BARS) * Math.PI * 2 - Math.PI / 2;
        const level = clamp(levels[i] * (live ? 1.6 : 1) * boost, 0.02, 1);
        const len = base * (0.16 + level * 0.62);
        const x1 = cx + Math.cos(angle) * base;
        const y1 = cy + Math.sin(angle) * base;
        const x2 = cx + Math.cos(angle) * (base + len);
        const y2 = cy + Math.sin(angle) * (base + len);

        const grad = ctx.createLinearGradient(x1, y1, x2, y2);
        grad.addColorStop(0, `${c1}${0.85})`);
        grad.addColorStop(1, `${c2}0)`);

        ctx.strokeStyle = grad;
        ctx.lineWidth = Math.max(1.5, base * 0.022);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // ruhiger Innenkreis
      ctx.strokeStyle = `${c1}0.25)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, base * 0.92, 0, Math.PI * 2);
      ctx.stroke();

      phase += reduced ? 0 : 0.045;
      if (!reduced) requestAnimationFrame(draw);
    };

    draw();
    if (reduced) setInterval(draw, 1000);
  }

  /* =======================================================
     12. Start & Verdrahtung
     ======================================================= */

  function wire() {
    // Mikrofon
    el.btnMic.addEventListener('click', () => STT.toggle());
    el.btnMic2.addEventListener('click', () => STT.toggle());

    // Texteingabe
    const send = () => {
      const text = el.input.value.trim();
      if (!text) return;
      el.input.value = '';
      Brain.handle(text, 'text');
    };
    el.btnSend.addEventListener('click', send);
    el.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); send(); }
    });

    // Vorschläge
    el.chips.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      Brain.handle(chip.textContent, 'text');
    });

    el.btnStop.addEventListener('click', () => TTS.stop());
    el.btnClearLog.addEventListener('click', () => {
      UI.clearLog();
      memory.history = [];
      saveMemory();
      UI.toast(t('cleared'));
    });

    // Protokoll exportieren
    el.btnExport.addEventListener('click', () => {
      const lines = $$('.msg', el.log).map((m) => {
        const who = m.querySelector('.msg__who')?.textContent || '';
        const body = m.querySelector('.msg__body')?.textContent || '';
        return `${who}: ${body}`;
      });
      const head = `J.A.R.V.I.S. — ${fmtDate()} ${fmtTimeFull()}\n${'='.repeat(48)}\n\n`;
      const blob = new Blob([head + lines.join('\n\n')], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `jarvis-${new Date().toISOString().slice(0, 10)}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });

    // Sprachumschalter im Kopf
    $$('.seg__btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (settings.lang === btn.dataset.lang) return;
        settings.lang = btn.dataset.lang;
        saveSettings();
        UI.applyLanguage();
        UI.syncSettingsForm();
        STT.relang();
        UI.toast(t('langSet'));
      });
    });

    // Modale Fenster
    el.btnHelp.addEventListener('click', () => { el.modalHelp.hidden = false; });
    el.btnSettings.addEventListener('click', () => {
      UI.syncSettingsForm();
      el.modalSettings.hidden = false;
    });
    $$('[data-close]').forEach((node) => {
      node.addEventListener('click', () => {
        el.modalSettings.hidden = true;
        el.modalHelp.hidden = true;
      });
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        el.modalSettings.hidden = true;
        el.modalHelp.hidden = true;
        if (state.speaking) TTS.stop();
      }
      if (e.key === '/' && document.activeElement !== el.input) {
        e.preventDefault();
        el.input.focus();
      }
    });

    // Einstellungen
    el.setAiMode.addEventListener('change', () => UI.toggleAiFields());
    el.setVoiceEngine.addEventListener('change', () => UI.toggleVoiceFields());
    el.setVoiceMode.addEventListener('change', () => UI.toggleVoiceFields());
    el.btnVoiceTest.addEventListener('click', () => {
      UI.readVoiceForm();
      const before = settings.speak;
      settings.speak = true;
      TTS.speak(t('voiceSample'));
      settings.speak = before;
      UI.updateSystemCard();
    });
    el.setRate.addEventListener('input', () => { el.outRate.textContent = Number(el.setRate.value).toFixed(2); });
    el.setPitch.addEventListener('input', () => { el.outPitch.textContent = Number(el.setPitch.value).toFixed(2); });

    el.btnSaveSettings.addEventListener('click', () => {
      const langChanged = settings.lang !== el.setLang.value;
      settings.lang = el.setLang.value;
      settings.voiceURI = el.setVoice.value;
      settings.rate = parseFloat(el.setRate.value);
      settings.pitch = parseFloat(el.setPitch.value);
      settings.wake = el.setWake.checked;
      settings.speak = el.setSpeak.checked;
      settings.sfx = el.setSfx.checked;
      settings.ai.mode = el.setAiMode.value;
      settings.ai.proxyUrl = el.setProxyUrl.value.trim();
      settings.ai.apiKey = el.setApiKey.value.trim();
      settings.ai.model = el.setModel.value;
      settings.ai.persona = el.setPersona.value.trim();
      UI.readVoiceForm();
      UI.readAgentForm();
      saveSettings();

      UI.applyLanguage();
      UI.setMicLive(state.wantListen);
      el.modalSettings.hidden = true;
      UI.toast(t('saved'));
      if (langChanged) STT.relang();
    });

    el.btnReset.addEventListener('click', () => {
      const question = isDE()
        ? 'Wirklich alle Einstellungen, Aufgaben, Notizen und Timer löschen?'
        : 'Really delete all settings, tasks, notes and timers?';
      if (!window.confirm(question)) return;
      store.drop(KEY.settings);
      store.drop(KEY.memory);
      window.location.reload();
    });

    // Löschen in den Listen
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-kill-task], [data-kill-note], [data-kill-timer]');
      if (!btn) return;
      const { killTask, killNote, killTimer } = btn.dataset;
      if (killTask) {
        memory.tasks = memory.tasks.filter((x) => x.id !== killTask);
        saveMemory();
        UI.renderTasks();
      } else if (killNote) {
        memory.notes = memory.notes.filter((x) => x.id !== killNote);
        saveMemory();
        UI.renderNotes();
      } else if (killTimer) {
        Timers.cancel(killTimer);
      }
    });

    // Systemzustand
    window.addEventListener('online', () => UI.updateSystemCard());
    window.addEventListener('offline', () => UI.updateSystemCard());
    if (TTS.supported) {
      window.speechSynthesis.addEventListener?.('voiceschanged', () => UI.fillVoices());
      window.speechSynthesis.onvoiceschanged = () => UI.fillVoices();
    }
    window.addEventListener('beforeunload', () => {
      if (TTS.supported) window.speechSynthesis.cancel();
    });
  }

  /* ---- Startsequenz ---- */
  async function boot() {
    const lines = I18N[isDE() ? 'de' : 'en'].bootLines;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const step = reduced ? 60 : 380;

    for (let i = 0; i < lines.length; i++) {
      el.bootLog.textContent += `> ${lines[i]}\n`;
      el.bootBar.style.width = `${Math.round(((i + 1) / lines.length) * 100)}%`;
      await new Promise((r) => setTimeout(r, step));
    }

    el.bootEnter.hidden = false;
    el.bootEnter.focus();
  }

  function enterSystem() {
    el.boot.classList.add('is-done');
    state.booted = true;

    // Der Klick ist die Nutzergeste: ab hier dürfen Audio und Sprache laufen.
    Audio_.context();
    Audio_.chirpUp();

    setTimeout(() => {
      const greeting = t('greetBoot');
      UI.reply(greeting);
      if (!LOCAL_OK) UI.systemMsg(t('remoteNotice'));
      if (!STT.supported) UI.systemMsg(t('micMissing'));
      else if (!TTS.supported) UI.systemMsg(t('ttsMissing'));
    }, 320);
  }

  /* ---- Init ---- */
  function init() {
    UI.init();
    UI.applyLanguage();
    UI.syncSettingsForm();
    UI.renderTasks();
    UI.renderNotes();
    UI.renderTimers();
    UI.updateSystemCard();
    UI.startClock();
    UI.setState('idle');
    wire();
    startVisualizer();

    if (memory.timers.length) Timers.ensureTick();

    el.bootEnter.addEventListener('click', enterSystem);
    boot();

    // Stimmen kommen in Chrome verzögert.
    setTimeout(() => UI.fillVoices(), 600);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
