---
name: review
description: The return-from-away flow. Walks the pending approval queue with Amjad one proposal at a time with the preview inline, executes what he approves, logs every decision with its reason, and folds the rejection patterns into memory/learned.md.
disable-model-invocation: true
---

# /review — walk the queue

The counterpart to `/daily`. `/daily` fills the queue while Amjad is away; `/review` empties
it in one pass while he is here.

## Before you show him anything

1. Read `approvals/DECISIONS.md` and `memory/learned.md`. **If a pending proposal is the
   same class of thing Amjad has rejected before, say so up front and recommend
   withdrawing it.** He should never have to reject the same class of thing twice.
2. Check every pending proposal is actually reviewable. A stub still carrying
   `_(Marsam: …)_` placeholder text is not a proposal — complete it before presenting it,
   or withdraw it and say why.
3. Sort by **cost of delay**, not by cost of the action. A cheap thing that blocks three
   other things comes first. A 40-credit render nobody is waiting on comes last.

## Then, one at a time

Open with a one-line map — "4 pending: 2 file edits, 1 render at ~35 credits, 1 package
install" — then take them in order. For each:

- The one-line summary, the cost, and the reversibility.
- **The preview inline.** The actual diff, the actual copy, the actual prompt, the actual
  command. Not a link to it, not a description of it. If Amjad has to ask a follow-up
  question to judge it, the proposal failed and you should fix it in front of him.
- Your own recommendation, in one line, including when the recommendation is "drop this".

Amjad answers one of three ways:

**approve** → run `bash .claude/bin/marsam-approve <file> [reason]`. Claude Code will show
him a permission prompt; **he accepts it, not you.** That acceptance is the authorisation.
Then execute the action immediately and report the actual result — what changed, where it
landed, what it cost. If execution fails, say so plainly with the error; do not retry with
a variation he did not approve.

**reject** → run `bash .claude/bin/marsam-reject <file> <reason>`. The reason is required.
If he rejects without giving one, ask for it in one short sentence — it is the single most
valuable thing you get out of this whole flow.

**edit then approve** → apply his edit to the proposal in `approvals/pending/` first, show
him the corrected version, and only then run the approve command. Never approve a version
he has not seen.

## After the pass

1. Every decision is in `approvals/DECISIONS.md` with its reason — the approve and reject
   commands write it, so check it landed rather than writing it yourself.
2. **Extract the patterns and write them into `memory/learned.md` in your own words.** Not
   a transcript of the decisions — the rule behind them. "Rejects renders above ~30 credits
   unless the video is for a paid campaign" is a pattern. "Rejected 2026-08-25-03" is not.
   This file is why he should not have to correct you twice.
3. Report what executed, what it cost, and what is left in the queue. One short block.

## What you must never do here

- Never accept the permission prompt yourself, or look for a route to approval that
  does not go through `marsam-approve`.
- Never write to `approvals/approved/`, `approvals/rejected/` or `DECISIONS.md` directly.
  The gate blocks it; attempting it is a bug in your reasoning, not in the gate.
- Never treat "approve all" as approval of anything not on screen. If he says it, confirm
  the list back to him in one line first, then take them in order.
