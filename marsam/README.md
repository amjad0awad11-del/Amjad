# Marsam (مِرسم)

A permission-gated studio assistant for e-commerce and web-development work: image design,
video production, competitor intelligence, and website animation.

The design property everything else serves: **Marsam never causes an effect outside its own
sandbox without Amjad's explicit approval.** Not once, not "just this small thing", not
because it seemed obviously fine. That is enforced by configuration and by a hook, not by
Marsam's judgment in the moment — so it holds even when Marsam is confused, even when
someone else is typing, even when the instruction sounds urgent.

The second property is what makes the first one liveable: **Marsam runs unattended.** An
assistant that has to stop and ask can't work while you're away. So approval is
asynchronous — Marsam works freely inside `workspace/`, and every action that would reach
outside is written to `approvals/pending/` as a concrete, reviewable proposal. Nothing in
that queue executes until you say so.

---

## First run

```bash
cd ~/marsam          # or wherever this folder lives
claude
```

**Run it interactively once and accept the trust dialog.** Until you do, Claude Code
ignores every entry in `permissions.allow` and Marsam will be prompted for ordinary sandbox
work. You only have to do this once per machine.

Then check `/status` shows the settings loaded, and `/mcp` to see which servers you actually
have connected — see *Still waiting on you* below.

## Daily use

| Command | What it does |
|---|---|
| `/daily` | The unattended run. Scans competitors, drafts what the findings call for, queues every YELLOW action, writes `reports/daily-YYYY-MM-DD.md`. Never blocks, never asks. |
| `/review` | The return-from-away pass. Walks `approvals/pending/` one at a time with the preview inline; you approve, reject with a reason, or edit-then-approve. |
| `/competitor-scan [name]` | Scan one competitor now. |
| `/design-brief [what]` | Brief + three directions with real prompts and specs. |
| `/video-brief [what]` | Full brief with a credit estimate → queue. Never renders. |
| `/animate [what]` | Builds a running prototype in `workspace/prototypes/` and shows it. |

To run `/daily` every morning, point cron or launchd at a headless run:

```bash
cd ~/marsam && claude -p "/daily" >> reports/cron.log 2>&1
```

Unattended permission prompts resolve to a denial rather than a hang, so the worst case for
a misjudged action is a queued proposal.

## The three tiers

**GREEN — done immediately, logged.** Reading anything in your designated folders. Public
web research. Anything at all inside `workspace/`. Read-only shell. Local preview servers.
Writing to `reports/`, `approvals/pending/`, `memory/`. This is where Marsam should spend
95% of its time, and it should be ambitious here — none of it costs you anything.

**YELLOW — never executed, written to the queue.** Any write outside `workspace/`. Anything
that spends money or credits. Anything that creates something in an external account.
Installing packages. Any `git` operation that changes state. **And anything Marsam is
unsure about** — uncertainty resolves to YELLOW, always.

**RED — refused, with the reason.** Deleting or overwriting anything of yours outside
`workspace/`. Sending anything to anyone. Any payment. Credentials of any kind. Anything
against a competitor beyond reading their public pages. Deploying or publishing to a live
site. Modifying Marsam's own permission configuration.

## How approval actually works

1. Marsam attempts an action. The gate blocks it and writes a stub into
   `approvals/pending/` carrying the exact tool call and a `gate-fingerprint`.
2. Marsam completes the stub — why, effect, cost, reversibility, and a **real** preview:
   the actual diff, the actual copy, the actual prompt.
3. You approve:

   ```bash
   bash .claude/bin/marsam-approve <proposal> [reason]
   bash .claude/bin/marsam-reject  <proposal> <reason>     # reason required
   ```

   Or entirely by hand: tick `- [x] approve` in the file and `mv` it into
   `approvals/approved/`.
4. The gate matches the fingerprint and lets that exact call through **once**. One approval
   is never a blank cheque; a second identical call is blocked again.

> ### The one thing that would break this
>
> When Marsam runs the approve command during `/review`, Claude Code shows you a permission
> prompt. **That prompt is the authorisation. Never choose "don't ask again" on it.** Doing
> so hands Marsam the ability to approve its own proposals, which is the single thing this
> whole design exists to prevent. It is the only user action that can defeat the gate.

`approvals/approved/`, `approvals/rejected/` and `approvals/DECISIONS.md` are RED to Marsam
— it can read them and can never write them, by any route: not with Edit, not with `mv`,
not with a redirect, not with a script in `workspace/`. All four are covered by tests.

## Changing the rules

Three files, in increasing order of consequence:

- **`memory/`** — business facts. Edit freely; Marsam re-reads every session.
- **`.claude/settings.json`** — the permission rules. Read the whole file before changing
  it; the ordering is deny > ask > allow, and `ask` beats `allow` regardless of how specific
  the allow is.
- **`.claude/hooks/boundary-gate.sh`** — the real enforcement. **Run the test suite after
  any change:**

  ```bash
  bash .claude/hooks/gate-tests.sh      # 107 cases, exits non-zero on any failure
  ```

Marsam may propose changes to all three. It may never apply changes to the last two.

### Syntax notes that cost real debugging time

- **File rules are matched against the path as written, and the model routinely writes
  absolute paths.** A cwd-relative `Edit(workspace/**)` therefore misses a lot. That is why
  the gate itself is authoritative for GREEN: it emits an explicit `allow` once every check
  has passed, rather than handing the call on to the settings layer. If the gate is ever
  removed, nothing emits `allow` and the settings rules govern again — the two layers are
  belt and braces, not one wearing the other.
- **`additionalDirectories` entries must be absolute** (or `~`-anchored). A relative entry
  like `".."` silently breaks the whole workspace scope, and every write — sandbox included
  — starts getting denied.
- **Never put a broad pattern in `ask`.** `Edit(//**)` and `Edit(~/**)` match every absolute
  and home-relative path, including the sandbox, and `ask` outranks a hook `allow`. Both
  were removed for exactly that reason.
- **Bash deny rules are prefix patterns**, so a compound command, an alias or a wrapper
  script can slip past them. Treat them as cheap defence in depth; the gate parses the whole
  command itself.
- **MCP deny appears to work at server granularity**, so per-tool deny entries are
  best-effort documentation. The per-tool RED enforcement is in the gate.

## Still waiting on you

The build is complete and tested. Three things are deliberately blank rather than guessed,
because a `memory/` folder full of plausible placeholders is worse than an empty one:

1. **`memory/brand.md`** — what you sell, who buys it, the offer, voice, colours, fonts,
   what to never do visually.
2. **`memory/competitors.md`** — 3–8 competitors and what specifically matters about each.
   Until this has entries, `/daily` correctly reports "no competitors configured" rather
   than inventing any.
3. **`memory/stack.md`** — framework, hosting, CMS, conventions, which folders Marsam may
   read, and how you want to be told a run finished.

Each file states its own gaps and tells Marsam to ask rather than assume.

**One provisional setting:** `additionalDirectories` is set to `/home/user/Amjad` so Marsam
can read the AMW site and produce real diffs in proposals. Replace it with your actual
working folders — absolute paths only.

**MCP servers** are wired against what was connected when this was built: Canva
(design-director), Motion (motion-producer), 21st.dev (web-animator), plus GitHub and
Lovable. Gmail and Hostinger Mail are denied outright at both layers. **No image-generation
server is connected**, so `design-director` degrades to briefs, directions and complete
prompts — real, directly-executable output, just not generated pixels. Check `/mcp` on your
machine and note that the rules key off the exact server name: a server registered locally
as `canva` will not match rules written for `Canva`.

## Known limits

Stated plainly, because a security boundary you misunderstand is worse than one you don't
have:

- **The gate sees a tool call, not what a program does once it starts.** A script inside
  `workspace/` is scanned for RED commands and for writes into the decision zone before it
  runs, but a sufficiently indirect script could still do something the scan misses. This is
  why interpreters with inline `-c` code are refused outright.
- **`robots.txt` and human-rate limits are enforced in the agent prompts, not by the gate.**
  The gate blocks the obvious signals — auth flags, cookie flags, robots-bypass flags,
  `curl`/`wget` entirely — but "did it fetch politely" is a behavioural rule.
- **The gate depends on `jq` or `python3`.** With neither present it denies everything, by
  design: a gate that opens when it breaks is not a gate.
- **Approval is scoped to (tool, resolved target, command) and is single use.** Approving an
  edit to a file approves the next edit to that same file, once. It does not approve edits
  to anything else — that isolation is covered by tests.

## Layout

```
marsam/
├── CLAUDE.md                    # the constitution, loaded every session
├── .claude/
│   ├── settings.json            # permission rules + hook registration
│   ├── hooks/
│   │   ├── boundary-gate.sh     # PreToolUse enforcement of the three tiers
│   │   └── gate-tests.sh        # 107 hostile cases; run after any change
│   ├── bin/
│   │   ├── marsam-approve       # the approval gesture (needs a human to accept)
│   │   └── marsam-reject        # rejection, reason required
│   ├── agents/                  # competitor-analyst, design-director,
│   │                            # motion-producer, web-animator
│   └── skills/                  # daily, review, competitor-scan,
│                                # design-brief, video-brief, animate
├── approvals/
│   ├── pending/                 # Marsam writes here
│   ├── approved/  rejected/     # only Amjad writes here — RED to Marsam
│   └── DECISIONS.md             # append-only; the training signal
├── memory/                      # brand, competitors, stack, learned
├── workspace/                   # the sandbox: free rein
│   ├── drafts/ research/ prototypes/ _trash/
└── reports/
    ├── activity-log.md          # one line per GREEN action, written by Marsam
    ├── hook-log.jsonl           # every gate decision, written by the gate
    └── daily-YYYY-MM-DD.md
```
