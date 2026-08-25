---
name: daily
description: The unattended morning run. Reads memory, scans every tracked competitor, drafts whatever the findings call for, queues every YELLOW action, and writes reports/daily-YYYY-MM-DD.md. Designed to run with nobody at the laptop.
disable-model-invocation: true
---

# /daily — the unattended run

**This skill is designed to run with nobody at the laptop.** Everything below follows from
that one fact:

- **Never call a tool that waits for a human.** No `AskUserQuestion`, no prompt, no "shall
  I continue?". There is nobody to answer and you would hang for six hours.
- **Never block.** If something needs Amjad, it goes in the queue and you move to the next
  item. A blocked action is one line in a report, not the end of the run.
- **End cleanly with a written report**, never with a question. If a question genuinely
  matters, it goes in the report under "Needs a decision" — as a question with your
  recommendation attached, so Amjad can answer it in one line.
- **Assume permission prompts will fail.** With nobody there, anything that reaches the
  permission layer is a dead end. Stay inside GREEN and let the gate queue the rest.

## Sequence

**1. Load context.** Read `memory/brand.md`, `memory/competitors.md`, `memory/stack.md`,
`memory/learned.md`, and `approvals/DECISIONS.md`. If a memory file is still unfilled, note
it once in the report and work from what you do have. **Do not invent business facts to fill
a gap** — a confidently wrong report is worse than a thin one.

**2. Clear the queue's backlog first.** Check `approvals/pending/`. If proposals from
earlier runs are still sitting there, do not re-propose the same things. Note the count in
the report and move on.

**3. Scan competitors.** Run `competitor-analyst` across the tracked list — GREEN
throughout, no approvals needed. Routine scans run on `sonnet`; once a week, or when the
deltas look like a pattern rather than a list, run the synthesis pass on `opus`.

If `memory/competitors.md` has no competitors configured, **say exactly that in the report
and continue** with the rest of the run. Do not stop, do not ask, do not invent a
competitor to have something to scan.

**4. Draft what the findings call for.** This is where the run earns its keep. Green work
is free, so be ambitious:

- A competitor changed their hero copy → draft three hero directions via `design-director`.
- A competitor shipped a scroll animation that works → build a better one via
  `web-animator` in `workspace/prototypes/`, and record what you measured.
- A competitor started running video → a full brief via `motion-producer`, with a credit
  estimate, ready for approval.
- Nothing changed anywhere → say so in one line, and spend the run on the highest-value
  item you can find in `memory/` instead. A quiet week is a chance to build something, not
  a reason to produce filler.

**5. Queue every YELLOW action** you hit along the way. Attempt the action so the gate
captures the exact call and stubs it, then complete the stub: Why now, Effect if approved,
Cost, Reversible, If you reject, and a real preview. A stub left with its placeholder text
in it is not a proposal.

**6. Write `reports/daily-YYYY-MM-DD.md`:**

```markdown
# Daily — 2026-08-25
**Ran:** 06:00–06:41 · **Competitors scanned:** 4 · **Proposals queued:** 3

## What changed
<Delta findings, highest impact first. Evidence link and date on every one.
 "Nothing changed across all four" is a complete and welcome answer.>

## What it means
<The pattern across the findings, if there is one. Skip this section if there isn't —
 do not manufacture a theme.>

## What I recommend
<Ranked. Each with the reason in one line.>

## What I built
<Links to drafts, prototypes and briefs in workspace/. Say what to look at first.>

## Waiting on you
<Every pending proposal: filename, one-line summary, cost, and what happens if you
 say no. Ordered by cost of delay, not by cost of the action.>

## Needs a decision
<Questions with your recommendation attached. Empty most days.>

## Nothing to report
<Delete this section unless it's the whole report.>
```

**7. Log the run.** Append the run's GREEN actions to `reports/activity-log.md`, one line
each with a timestamp. Amjad should be able to reconstruct the whole morning from that file.

## Running it on a schedule

`/daily` is invoked by hand or by a scheduler; it is not model-invocable, so it never fires
because a conversation drifted near the topic. To have it run every morning, point cron or
launchd at a headless Claude Code run in this folder. Because unattended permission prompts
resolve to a denial rather than a hang, the worst case for a misjudged action is a queued
proposal — which is exactly the design.
