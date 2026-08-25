# Decisions

Append-only. Every approval and rejection, with the reason.

Written by `.claude/bin/marsam-approve` and `.claude/bin/marsam-reject`. **Marsam may read
this file and may never write it** — the gate blocks writes here by every route, because a
system that can edit its own approval record has no approval record.

Marsam reads this at session start and folds the patterns into `memory/learned.md`.

