# J.A.R.V.I.S. — a voice assistant in your browser

A complete voice assistant as a static page: `jarvis.html`, `jarvis.css`,
`jarvis.js`. No build step, no dependencies, no account needed. Most commands run
entirely on your device; only weather, Wikipedia and the optional AI mode need
the internet.

---

## Starting it

One command. Nothing to download, nothing to find, nothing to unzip.

**Windows** — press the Windows key, type `powershell`, press Enter. Then paste:

```powershell
irm https://raw.githubusercontent.com/amjad0awad11-del/Amjad/refs/heads/claude/jarvis-assistant-2428an/install.ps1 | iex
```

**macOS / Linux** — open Terminal and paste:

```bash
curl -fsSL https://raw.githubusercontent.com/amjad0awad11-del/Amjad/refs/heads/claude/jarvis-assistant-2428an/install.sh | bash
```

The command fetches the project into `~/jarvis` (Windows: `%USERPROFILE%\jarvis`),
installs what it needs, starts the service and opens your browser at
**http://localhost:8787/**. The first time takes about a minute.

If Node.js is missing, the Windows command tries to install it; if that fails it
tells you what to do.

### Starting it again later

The `jarvis` folder stays where it is. To start it again:

| | |
|---|---|
| **Windows** | double-click `START-WINDOWS.bat` in the `jarvis` folder |
| **macOS / Linux** | `cd ~/jarvis && ./start.sh` |

The window that opens **must stay open** — it is the service itself. Close it and
the browser says "connection refused".

### Installing again

Paste the same command again. Any keys already in `server/.env` are carried over,
not overwritten.

On the first start there is a short boot sequence. Clicking **Start system** is
the gesture that unlocks audio and speech — without it no website is allowed to
play sound.

### Without any keys

Time, date, timers, reminders, tasks, notes, arithmetic, conversions, dice and
jokes work immediately. Weather and Wikipedia need only an internet connection.
Only AI mode, the agent and the custom voice need keys (see below).

---

## When something does not work

**"This site can't be reached" at http://localhost:8787/**
That address is not a server on the internet, it is your own machine. It only
answers while the service is running. The terminal must say "J.A.R.V.I.S. is
running". If it says nothing any more, the service was stopped — start it again.

**I cannot find `START-WINDOWS.bat`**
Windows hides file extensions, so the file appears as just **START-WINDOWS**. It
sits in the `jarvis` folder next to `jarvis.html`. The install command above is
easier: it looks for nothing, it just starts.

**The window closes again immediately (Windows)**
Then it is showing an error too quickly to read. Open PowerShell and drag
`START-WINDOWS.bat` into the window, then press Enter — the message stays on
screen.

**`command not found: node`**
Node.js is missing. Install it from [nodejs.org](https://nodejs.org), version 20
or newer, then start again.

**`permission denied`**
Use `bash start.sh` instead of `./start.sh`.

**`EADDRINUSE` / "address already in use"**
The port is taken. Run `PORT=9000 bash start.sh`, then open
`http://localhost:9000/`.

**The page loads but the agent says it is unreachable**
The address in the settings has to match the port the service is running on. If
you changed the port, change it there too.

**The agent answers but does nothing**
Then it has no access. The service says so at startup ("ANTHROPIC_API_KEY
missing") and the agent says so in the transcript. Put the key in `server/.env`
and restart the service — the file is only read at startup.

**To see what the service actually has**

```bash
curl http://localhost:8787/health
```

It answers with `claudeKey`, `elevenKey` and the working folder, so it is clear
which key arrived and which did not.

## Getting the keys

The built-in commands need no key. Only three things cost anything: AI mode, the
agent, and the custom voice.

### Anthropic (AI mode and the agent)

1. Open [console.anthropic.com](https://console.anthropic.com) and sign in.
2. Under **Billing**, add credit — without credit the API does not answer.
3. Under **API keys**, create a key (`sk-ant-…`) and copy it right away; it is
   shown only once.

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
```

**Important:** a Claude subscription (Pro or Max) covers claude.ai and Claude
Code, **not** the API. API usage is billed separately against the credit in the
console. The agent shows what each task cost, and stops by itself at two US
dollars per task.

### ElevenLabs (the custom voice)

1. Open [elevenlabs.io](https://elevenlabs.io) and sign in.
2. Top right, click your profile picture → **API Keys** → create a key (`sk_…`).

```bash
export ELEVENLABS_API_KEY="sk_..."
```

The free tier includes a monthly character allowance, which is enough to try it
out. Once it is used up J.A.R.V.I.S. falls back to the system voice and says once
why.

### Where the keys go

In `server/.env`, nowhere else:

```bash
cp server/.env.example server/.env
# open the file and put both keys in
node server/jarvis-proxy.mjs
```

The service reads the file at startup ("Keys loaded from …"). It is listed in
`.gitignore` and cannot be uploaded by accident. If you prefer
`export ANTHROPIC_API_KEY=…`, that still works — environment variables that are
already set take precedence over the file.

The interface does have fields for the keys, but those store them in browser
storage. That is meant for your own device only; the local service is the better
place either way.

### If a key ever becomes visible

Pasted into a chat, caught in a screenshot, committed by accident — then it
counts as public, even if the message is deleted. A key cannot be taken back,
only replaced:

1. [console.anthropic.com](https://console.anthropic.com) → **API keys** →
   **delete** the affected key. From that moment it is worthless.
2. Create a new key and put it in `server/.env`.
3. Check **Usage** to see whether anything was spent in the meantime.

ElevenLabs works the same way: profile → **API Keys** → revoke, create a new one.
Nobody — no service, no assistant, no support desk — needs your key in the clear.

## What it can do

Every command works in English and German. The examples are English; the German
equivalents are in the in-app help.

### Time and appointments
| Command | Result |
|---|---|
| "What time is it?" | The current time |
| "What is the date?" | Today's date |
| "Set a timer for 10 minutes" | Countdown with a chime and a system notification |
| "Remind me in 1 hour to air the room" | A reminder with text |
| "Remind me at 6:30 pm about the call" | A reminder at a time (tomorrow if already past) |
| "Show my timers" / "Cancel the timer" | Show or clear running timers |

### Lists
| Command | Result |
|---|---|
| "Add task buy milk" | Create a task |
| "Show my tasks" | Read the list out |
| "Task 1 done" | Tick it off (by number or by keyword) |
| "Delete all tasks" | Empty the list |
| "Note: the key is under the mat" | Save a note |
| "Show my notes" | Read the notes out |

Tasks, notes and timers appear live in the right-hand panel and survive a browser
restart.

### Arithmetic and conversion
| Command | Result |
|---|---|
| "What is 17 times 23?" | `391` |
| "Calculate (12 + 8) / 4" | `5` |
| "Square root of 144" | `12` |
| "10 km in miles" | `6.214 mi` |
| "20 celsius in fahrenheit" | `68 °F` |
| "How many pounds is 5 kg?" | `11.023 pounds` |

The calculator is its own parser (tokenizer plus shunting-yard) — **no `eval()`**.
It knows `+ − × ÷ ^ %`, brackets, `sqrt`, `abs`, `round`, `floor`, `ceil`, `sin`,
`cos`, `tan`, `log`, `ln`, `exp`, `pi` and `e`, and it understands spoken forms
like "times", "divided by", "to the power of", "percent of".

### Knowledge and surroundings
| Command | Result |
|---|---|
| "What is the weather in Berlin?" | Weather via [Open-Meteo](https://open-meteo.com) — no key needed |
| "What is the weather?" | Uses your location, otherwise the last place you asked about |
| "Who is Ada Lovelace?" | A summary from Wikipedia (first three sentences plus a link) |

### Web and system
| Command | Result |
|---|---|
| "Search for recipes" | A Google search in a new tab |
| "Search cats on YouTube" | A targeted search (Google, YouTube, Wikipedia, Maps, GitHub) |
| "Open YouTube" / "Take me to Shopify" / "Launch Gmail" | Open a site |
| "Status report" | Time, network, battery, microphone, AI mode, open tasks |
| "Fullscreen" / "Copy that" | Toggle fullscreen, last answer to the clipboard |

If the popup blocker stops the new window, J.A.R.V.I.S. hands you the link to
click instead — the command is not lost.

### Odds and ends
"Roll a die", "Flip a coin", "Random number between 1 and 10", "Tell me a joke",
"Speak slower", "Be quiet", "Speak German", "Clear the transcript".

---

## Files — photos, videos and documents

Anything can go along with what you say. Three ways to attach:

- the **paperclip** in the input bar
- **drag** a file onto the window
- **paste** from the clipboard (a screenshot, for instance)

What is attached appears above the input as a row of chips, with a thumbnail for
photos, and each can be taken off again before you send.

Where a file goes depends on what it is and what is switched on:

| | |
|---|---|
| **Photos, with AI mode on** | Go straight to Claude as an image. "What is in this picture?" works. JPG, PNG, GIF and WebP up to 5 MB. |
| **Any file, with the agent on** | Written into the agent's working folder under `uploads/`, so the agent can open it, change it or build on it. |
| **Neither switched on** | It says so, rather than accepting a file nothing can be done with. |

Up to eight files at a time, and up to 200 MB each
(`JARVIS_MAX_UPLOAD_BYTES`). The name comes from the browser, so it is treated
that way: only the last part of the path survives, only harmless characters, and
the result is checked again against the working folder. An existing file is never
overwritten — a second `photo.png` becomes `photo-1.png`.

---

## Connectors — what else the agent can reach

Out of the box the agent works inside its own folder and nowhere else. A
connector gives it a bit more. Each one is an MCP server: a small program that
hands the agent extra tools.

Settings → **Connectors**. Four come with it:

| Connector | What it adds |
|---|---|
| **Your files** | Read and write in one folder you choose — your Documents or Desktop. You name the folder; nothing outside it is reachable. |
| **A real browser** | Open pages, click, fill in forms, take screenshots. This is what lets it work inside a site like Shopify or Canva. |
| **Long memory** | Remembers people, projects and decisions between sessions instead of starting fresh each time. |
| **Step-by-step thinking** | Works a long job through in order rather than answering off the top of its head. |

Switching one on is not the same as giving it a free hand: **every tool from a
connector still asks before it is used**, exactly like writing a file or running
a command. The question in the transcript names the connector it came from.

A connector that needs a detail — "Your files" needs a folder — stays off until
you fill it in, and says so instead of silently doing nothing.

What is switched on lives in `server/connectors.json`. The browser writes that
file for you; it is in `.gitignore`, so it never leaves the machine. To add any
other MCP server, edit the `custom` list by hand — either a program to run or an
address to call. `server/connectors.example.json` shows both shapes.

The first time a connector starts, `npx` downloads it, which takes a moment. If
one cannot be loaded the task still runs — just without those extra tools, and
the transcript says so.

---

## The agent — actually carrying tasks out

Without the agent, J.A.R.V.I.S. is a website: it can talk, calculate and look
things up, but it cannot touch your machine. With the agent it can — create
files, build projects, run commands. Underneath is the Claude Agent SDK, the same
machinery as Claude Code.

### Switching it on

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
npm install --prefix server
node server/jarvis-proxy.mjs
```

Then Settings → **Enable agent**, address `http://localhost:8787/api/agent`.
After that, "Build me a landing page with React" is enough.

### What keeps it in check

An assistant with access to a console is only as good as its limits. Four apply
here, and none of them can be loosened from the browser:

| Limit | Effect |
|---|---|
| **Working folder** | The agent works in `~/jarvis-workspace`, not the whole file system. Changeable via `JARVIS_WORKSPACE`. |
| **Asking first** | Anything that changes something — writing, running, installing, and every connector tool — appears as a question in the transcript and happens only after a yes. Only reading (`Read`, `Glob`, `Grep`) runs without asking. |
| **Ceilings** | At most 40 steps and 2 US dollars per task (`JARVIS_AGENT_MAX_TURNS`, `JARVIS_AGENT_BUDGET_USD`). |
| **Blocked commands** | `sudo`, `shutdown`, `reboot`, `mkfs`, `dd` and recursive deletion from the root are not allowed at all. |

A question left unanswered for two minutes counts as denied
(`JARVIS_PERMISSION_TIMEOUT_MS`). A running task can be stopped at any time with
**Stop**.

### Hands free

With the microphone on, J.A.R.V.I.S. reads the question out loud. A spoken "yes"
approves, "no" denies — the whole loop works without a keyboard.

So that a misheard "yes" cannot start a task by accident, single words and filler
never reach the agent. They only answer an open question — or get queried back.

### Agent or conversation?

With both the agent and AI mode on, the wording decides: tasks ("build",
"create", "install", "write", "fix" …) go to the agent, everything else to the
conversation. That saves time and money. With only the agent on, it gets
everything.

### Keeping an eye on cost

Every finished task shows what it cost in the header of its card.

## Voice

The default is the ElevenLabs voice **`L1aJrPa7pLJEyYlh3Ilq`**. That needs an
ElevenLabs key — without one J.A.R.V.I.S. carries on with the browser's system
voice and says once in the transcript why.

### Through the proxy (recommended)

The key stays on your machine:

```bash
export ELEVENLABS_API_KEY="sk_..."
node server/jarvis-proxy.mjs
```

In the settings choose **Speech output via: ElevenLabs**, connection **Local
proxy**, address `http://localhost:8787/api/speak`. **Test voice** plays the
result straight away.

### Direct from the browser

Set the connection to **Direct** and enter the key. It then lives in this
device's `localStorage` and goes straight to `api.elevenlabs.io`. For private use
on your own machine only.

### Models

| Model | For what |
|---|---|
| `eleven_multilingual_v2` | Default — balanced, English and German |
| `eleven_flash_v2_5` | Lowest latency, good for quick back and forth |
| `eleven_turbo_v2_5` | Fast at good quality |
| `eleven_v3` | The most expressive delivery |

### Falling back

If the voice fails twice — wrong key, proxy off, no credit — J.A.R.V.I.S.
switches to the system voice for that session, says why once in the transcript,
and shows the fallback in the system overview. Saving the settings resets the
counter. The rate slider affects the ElevenLabs output too.

To work with no outside service at all, set **Speech output via** to **Browser
system voice** — then everything stays on the device.

## AI mode (optional)

Without AI mode, J.A.R.V.I.S. answers everything listed above and says honestly
that it has no command for anything else. With AI mode, open questions go to the
**Claude Messages API**. There are two ways.

### 1. Local proxy (recommended)

The API key stays on your machine and never appears in the browser.

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
export ELEVENLABS_API_KEY="sk_..."        # optional, for the custom voice
npm install --prefix server
node server/jarvis-proxy.mjs
#   AI     -> http://localhost:8787/api/chat
#   Voice  -> http://localhost:8787/api/speak
```

Then choose **AI mode → Local proxy** in the settings and enter the address. The
proxy

- accepts requests only from `localhost` (widen with `JARVIS_ALLOWED_ORIGINS`),
  so no arbitrary website can spend the key's credit,
- limits the number of messages, their length, `max_tokens` and the request size,
- accepts images as well as text, and drops any block shape it does not know,
- streams the answer back as server-sent events,
- runs with `output_config.effort: "low"`, because the answers are short and read
  aloud.

`ANTHROPIC_API_KEY` is not strictly required: without the variable the SDK uses
an existing `ant auth login` profile.

### 2. Direct from the browser

For private use on your own device only. The key then lives in `localStorage` and
goes straight to `api.anthropic.com` (with the
`anthropic-dangerous-direct-browser-access` header). If you share the page with
anyone or host it publicly, do not choose this route.

### Model and character

The default is **Claude Opus 5** (`claude-opus-5`); Sonnet 5 and Haiku 4.5 are
also available. The **Character** field overrides the system prompt — the default
asks for at most three sentences without markdown, because the answer is read
aloud. The last twelve turns go along as context, plus the date, the time and
your open tasks.

Neither the conversation nor the agent is told which language to answer in. Both
are asked to answer in the language of your message, and never to mix two
languages in one answer.

---

## Privacy

| What | Where it goes |
|---|---|
| Tasks, notes, timers, settings, history | Only this browser's `localStorage` |
| Speech recognition | Chrome/Edge send the audio to the browser's own recognition service |
| Weather | Coordinates or place name to `open-meteo.com` |
| Knowledge questions | The search term to `wikipedia.org` |
| AI mode | The question plus history to your own proxy or `api.anthropic.com` |
| Custom voice | The answer text to your own proxy or `api.elevenlabs.io` |
| Attached files | To your own machine's working folder; photos also to `api.anthropic.com` when AI mode is on |
| Connectors | Only what the agent asks a connector to do, and only after you approve it |
| Agent | The task, file contents and command output to `api.anthropic.com` — the agent reads what it needs to work |

"Reset everything" in the settings deletes all stored data.

---

## Browsers

| Feature | Chrome / Edge | Safari | Firefox |
|---|---|---|---|
| Interface, typing, calculator, lists, timers | ✅ | ✅ | ✅ |
| Speech output | ✅ | ✅ | ✅ |
| Speech recognition | ✅ | partly | ❌ |

Without speech recognition J.A.R.V.I.S. says so at startup and stays fully usable
by typing. Every animation respects `prefers-reduced-motion`.

---

## Adding a skill

Skills live in `jarvis.js` in the `SKILLS` array and are checked in order. The
first whose `re` matches **and** whose `run` does not return `null` wins; `null`
means "not this one after all, keep looking".

```js
{
  id: 'coffee',
  re: /(kaffee|coffee)/i,
  run(match, text) {
    return isDE() ? 'Die Maschine läuft.' : 'The machine is running.';
  },
}
```

`run` may return a string, a `Promise`, or an object:

- `{ text }` — show it and read it out
- `{ text, speak }` — read out something different from what is shown (without a
  link, for instance)
- `{ text, silent: true }` — show it only, do not read it out

New entries belong before the general `knowledge` skill, otherwise that one
catches the question first.
