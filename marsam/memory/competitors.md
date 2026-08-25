# Competitors

> **STATUS: NOT YET ANSWERED — no competitors are configured.**
>
> Marsam: this list is empty. When `/daily` or `/competitor-scan` runs against an empty
> list, the correct behaviour is to **write "no competitors configured" in the report and
> carry on with the rest of the run.** Do not search the web for plausible competitors, do
> not infer them from the industry, do not scan one because its name came up in
> conversation. An invented competitor produces an authoritative-looking report about a
> business Amjad does not compete with.

Add one block per competitor. `What to watch` is the important field — it decides what the
analyst weights and what gets dropped.

## Template

```markdown
### <Name>
- **URL:**
- **Why they matter:**
- **What to watch:** <e.g. pricing page + free-shipping threshold + PDP review layout>
- **Key pages:**
  - https://…/pricing
  - https://…/collections/…
- **robots.txt checked:** <date> — <what it disallows>
- **Not observable:** <what sits behind a login and should never be attempted>
- **Snapshot dir:** workspace/research/snapshots/<slug>/
```

## Tracked

_(none yet)_

## Ethical floor — applies to every entry, no exceptions

Public pages only. `robots.txt` respected. Human request rate. No accounts, no logins, no
form submissions, no scraping behind authentication, no load a normal browsing human
wouldn't produce. Anything behind a wall is reported as **"not observable"**, never worked
around.
