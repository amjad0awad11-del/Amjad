#!/usr/bin/env bash
# =============================================================================
#  Marsam — boundary-gate.sh
#  PreToolUse hook. Enforces the three tiers: GREEN / YELLOW / RED.
#
#    GREEN   -> exit 0 with no decision; normal permission flow continues.
#    YELLOW  -> deny + write a proposal stub into approvals/pending/.
#    RED     -> deny, naming the rule. No proposal is written; RED is a refusal.
#
#  FAILS CLOSED. Any error, unparseable input, missing dependency or unexpected
#  state exits 2, which Claude Code treats as a blocking error. A gate that
#  opens when it breaks is not a gate.
#
#  Every invocation appends one line to reports/hook-log.jsonl.
#
#  This file is RED to Marsam itself: it may propose changes here, never apply
#  them.
# =============================================================================

set -uo pipefail
IFS=$' \t\n'

# ---------------------------------------------------------------------------
# 0. Fail-closed scaffolding
# ---------------------------------------------------------------------------
_gate_done=0
_gate_exit() {
  local rc=$?
  if [[ "$_gate_done" -ne 1 ]]; then
    printf 'boundary-gate: FAILING CLOSED (unexpected exit rc=%s). Tool blocked.\n' "$rc" >&2
    exit 2
  fi
}
trap _gate_exit EXIT

hard_fail() {
  printf 'boundary-gate: FAILING CLOSED — %s. Tool blocked.\n' "$1" >&2
  _gate_done=1
  exit 2
}

# ---------------------------------------------------------------------------
# 1. Locate Marsam root
# ---------------------------------------------------------------------------
# The script's own location is the reliable anchor: this file always lives at
# <marsam>/.claude/hooks/boundary-gate.sh. CLAUDE_PROJECT_DIR is only a fallback —
# Claude Code resolves it to the enclosing git repository, which is not necessarily
# the Marsam folder.
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." 2>/dev/null && pwd -P)" || ROOT=""
if [[ -z "$ROOT" || ! -f "$ROOT/CLAUDE.md" ]]; then
  ROOT="${CLAUDE_PROJECT_DIR:-}"
fi
[[ -n "$ROOT" && -d "$ROOT" ]] || hard_fail "cannot resolve Marsam root"
ROOT="$(cd "$ROOT" 2>/dev/null && pwd -P)" || hard_fail "cannot canonicalise Marsam root"
[[ -f "$ROOT/CLAUDE.md" ]] || hard_fail "root $ROOT does not look like a Marsam install"

SANDBOX_DIRS=("$ROOT/workspace" "$ROOT/reports" "$ROOT/approvals" "$ROOT/memory")

# Amjad's decision record. Marsam may READ these and may write proposals into
# approvals/pending/, but it may never write here — otherwise it could forge its
# own approval and the whole authority model collapses. The only sanctioned way
# in is .claude/bin/marsam-approve / marsam-reject, which the gate deliberately
# lets through to the permission layer so a human has to accept the prompt.
PROTECTED_PATHS=("$ROOT/approvals/approved" "$ROOT/approvals/rejected" "$ROOT/approvals/DECISIONS.md")
SANCTIONED_SCRIPTS=("$ROOT/.claude/bin/marsam-approve" "$ROOT/.claude/bin/marsam-reject")

# ---------------------------------------------------------------------------
# 2. Dependencies
# ---------------------------------------------------------------------------
JQ=""; PY=""
command -v jq      >/dev/null 2>&1 && JQ="$(command -v jq)"
command -v python3 >/dev/null 2>&1 && PY="$(command -v python3)"
[[ -n "$JQ" || -n "$PY" ]] || hard_fail "neither jq nor python3 available; cannot parse tool input"

# ---------------------------------------------------------------------------
# 3. Read and parse stdin
# ---------------------------------------------------------------------------
INPUT="$(cat 2>/dev/null || true)"
[[ -n "$INPUT" ]] || hard_fail "empty tool input"

jqr() { # jqr <filter>  -> raw output, empty on failure
  if [[ -n "$JQ" ]]; then
    printf '%s' "$INPUT" | "$JQ" -r "$1" 2>/dev/null || printf ''
  else
    printf '%s' "$INPUT" | "$PY" -c '
import json,sys
try: d=json.load(sys.stdin)
except Exception: sys.exit(0)
f=sys.argv[1]
ti=d.get("tool_input") or {}
if f=="tool_name": print(d.get("tool_name") or "")
elif f=="cwd": print(d.get("cwd") or "")
elif f=="session_id": print(d.get("session_id") or "")
elif f=="command": print(ti.get("command") or "")
elif f=="paths":
    out=[]
    for k in ("file_path","notebook_path","path","glob","destination_path"):
        v=ti.get(k)
        if isinstance(v,str) and v: out.append(v)
    for e in (ti.get("edits") or []):
        if isinstance(e,dict) and isinstance(e.get("file_path"),str): out.append(e["file_path"])
    seen=set()
    for p in out:
        if p not in seen: seen.add(p); print(p)
elif f=="tool_input": print(json.dumps(ti,indent=2,ensure_ascii=False)[:4000])
' "$2" 2>/dev/null || printf ''
  fi
}

if [[ -n "$JQ" ]]; then
  TOOL="$(jqr '.tool_name // ""')"
  CWD_IN="$(jqr '.cwd // ""')"
  SESSION_ID="$(jqr '.session_id // ""')"
  CMD="$(jqr '.tool_input.command // ""')"
  PATHS="$(jqr '[.tool_input.file_path?, .tool_input.notebook_path?, .tool_input.path?, .tool_input.glob?, .tool_input.destination_path?, (.tool_input.edits[]?.file_path?)] | map(select(type=="string" and . != "")) | unique | .[]')"
  TOOL_INPUT_PRETTY="$(printf '%s' "$INPUT" | "$JQ" -r '.tool_input // {} | tojson' 2>/dev/null | cut -c1-4000 || printf '{}')"
else
  TOOL="$(jqr x tool_name)"
  CWD_IN="$(jqr x cwd)"
  SESSION_ID="$(jqr x session_id)"
  CMD="$(jqr x command)"
  PATHS="$(jqr x paths)"
  TOOL_INPUT_PRETTY="$(jqr x tool_input)"
fi

[[ -n "$TOOL" ]] || hard_fail "tool_name missing from input"

CWD="$CWD_IN"
[[ -n "$CWD" && -d "$CWD" ]] || CWD="$ROOT"
CWD="$(cd "$CWD" 2>/dev/null && pwd -P)" || CWD="$ROOT"

# ---------------------------------------------------------------------------
# 4. Patterns
# ---------------------------------------------------------------------------
# HARD credential patterns: RED everywhere, including inside workspace/.
RE_CRED_HARD='(^|/)\.env($|\.)|(^|/)id_(rsa|dsa|ecdsa|ed25519)|(^|/)\.ssh(/|$)|\.pem$|(^|/)\.netrc$|(^|/)\.npmrc$|(^|/)\.git-credentials$|(^|/)credentials\.json$|(^|/)\.aws(/|$)|(^|/)\.gnupg(/|$)|(^|/)\.pgpass$|(^|/)\.htpasswd$|(^|/)cookies\.sqlite$|(^|/)Cookies(-journal)?$|(^|/)Login Data$|/Library/Keychains(/|$)|/Library/Safari(/|$)|/Library/Application Support/(Google/Chrome|Chromium|Firefox|BraveSoftware|Microsoft Edge)(/|$)|/\.config/(google-chrome|chromium|BraveSoftware|microsoft-edge|gh)(/|$)|/\.mozilla(/|$)'

# SOFT credential patterns: RED only outside the sandbox (avoids false hits on
# e.g. workspace/research/secret-sauce.md).
RE_CRED_SOFT='credential|secret|passwd|password|\.key$|token'

# Marsam's own authority configuration.
RE_SELFCONF='(^|/)\.claude(/|$)|(^|/)CLAUDE\.md$'

# Credential-ish strings appearing anywhere in a shell command.
RE_CMD_CRED='(^|[[:space:]=/])\.env([[:space:]]|$|\.)|id_rsa|id_dsa|id_ecdsa|id_ed25519|\.ssh/|\.aws/|\.gnupg|\.netrc|\.git-credentials|Keychains|cookies\.sqlite|Login Data|\.pem([[:space:]]|$)'

# Shell command heads that are RED outright.
RE_HEAD_RED='^(rm|rmdir|shred|srm|unlink|dd|mkfs|diskutil|sudo|doas|su|chown|chgrp|passwd|mail|mailx|sendmail|mutt|msmtp|swaks|scp|sftp|ssh|rsync|vercel|netlify|surge|wrangler|firebase|heroku|flyctl|now|curl|wget|nc|ncat|telnet|security|keychain|launchctl|osascript)$'

# Shell command heads that are read-only.
RE_HEAD_RO='^(ls|cat|bat|head|tail|wc|grep|egrep|fgrep|rg|ag|fd|file|stat|du|df|echo|printf|pwd|whoami|uname|hostname|which|type|sort|uniq|cut|tr|column|jq|yq|tree|diff|comm|basename|dirname|realpath|readlink|date|sleep|true|false|test|seq|nl|od|strings|cksum|md5sum|shasum|sha256sum|less|more|export|set|unset|history|clear|cd|pushd|popd|ps|top|ss|netstat|lsof|uptime|id|groups|jobs|disown|wait|tput|locale|source_none)$'

# Competitor-hostile signals. Anchored on flag boundaries so that ordinary
# filenames ("login-page-analysis.md") and ordinary flags ("--author") do not
# trip it. Note every grep below passes `--` before the pattern: a pattern that
# begins with a dash is otherwise read as an option and the check silently
# errors out, which would fail OPEN.
RE_HOSTILE='(^|[[:space:]])--?(ignore-robots|no-robots|robots|login|signin|sign-in|password|passwd|cookie|cookies|auth|proxy)([[:space:]=]|$)|robots=off|Authorization:[[:space:]]*(Bearer|Basic)|(^|[[:space:]])-u[[:space:]]+[^[:space:]]+:[^[:space:]]+'

# ---------------------------------------------------------------------------
# 5. Path resolution (symlinks and ../ resolved; non-existent tails allowed)
# ---------------------------------------------------------------------------
fallback_resolve() {
  local p="$1" acc="" c hops t
  local oldifs="$IFS"; local IFS='/'
  # shellcheck disable=SC2206
  local parts=($p)
  IFS="$oldifs"
  for c in "${parts[@]}"; do
    case "$c" in
      ""|".") continue ;;
      "..") acc="${acc%/*}" ;;
      *)   acc="$acc/$c" ;;
    esac
    hops=0
    while [[ -L "$acc" && $hops -lt 16 ]]; do
      t="$(readlink "$acc" 2>/dev/null)" || break
      if [[ "$t" == /* ]]; then acc="$t"; else acc="${acc%/*}/$t"; fi
      hops=$((hops + 1))
    done
  done
  [[ -z "$acc" ]] && acc="/"
  printf '%s' "$acc"
}

resolve_path() { # resolve_path <path> [base]
  local p="${1:-}" base="${2:-$CWD}" out=""
  [[ -n "$p" ]] || { printf ''; return 0; }
  case "$p" in
    "~")   p="$HOME" ;;
    "~/"*) p="$HOME/${p#\~/}" ;;
  esac
  [[ "$p" == /* ]] || p="$base/$p"
  if [[ -n "$PY" ]]; then
    out="$("$PY" -c 'import os,sys; print(os.path.realpath(sys.argv[1]))' "$p" 2>/dev/null)" || out=""
  fi
  if [[ -z "$out" ]] && command -v realpath >/dev/null 2>&1; then
    out="$(realpath -m -- "$p" 2>/dev/null)" || out=""
  fi
  [[ -z "$out" ]] && out="$(fallback_resolve "$p")"
  [[ -n "$out" ]] || hard_fail "could not resolve path: $p"
  printf '%s' "$out"
}

in_protected() { # in_protected <resolved-path>
  local rp="${1:-}" d
  [[ -n "$rp" ]] || return 1
  for d in "${PROTECTED_PATHS[@]}"; do
    [[ "$rp" == "$d" || "$rp" == "$d"/* ]] && return 0
  done
  return 1
}

in_sandbox() { # in_sandbox <resolved-path>
  local rp="${1:-}" d
  [[ -n "$rp" ]] || return 1
  for d in "${SANDBOX_DIRS[@]}"; do
    [[ "$rp" == "$d" || "$rp" == "$d"/* ]] && return 0
  done
  return 1
}

# ---------------------------------------------------------------------------
# 6. Output, logging, proposal writing
# ---------------------------------------------------------------------------
TIER=""; DECISION=""; REASON=""; TARGET=""; PROPOSAL_FILE=""; NOSTUB=0

json_escape() {
  local s="${1:-}"
  s="${s//\\/\\\\}"; s="${s//\"/\\\"}"
  s="${s//$'\n'/\\n}"; s="${s//$'\t'/\\t}"; s="${s//$'\r'/\\r}"
  printf '%s' "$s"
}

log_line() {
  local f="$ROOT/reports/hook-log.jsonl" ts
  mkdir -p "$ROOT/reports" 2>/dev/null || true
  ts="$(date -u +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || printf 'unknown')"
  {
    printf '{"ts":"%s","tool":"%s","tier":"%s","decision":"%s","target":"%s","command":"%s","reason":"%s","proposal":"%s","session":"%s"}\n' \
      "$(json_escape "$ts")" "$(json_escape "$TOOL")" "$(json_escape "$TIER")" \
      "$(json_escape "$DECISION")" "$(json_escape "$TARGET")" \
      "$(json_escape "${CMD:0:400}")" "$(json_escape "$REASON")" \
      "$(json_escape "$PROPOSAL_FILE")" "$(json_escape "$SESSION_ID")"
  } >> "$f" 2>/dev/null || true
}

emit_deny() { # emit_deny <TIER> <reason>
  TIER="$1"; DECISION="deny"; REASON="$2"

  # A YELLOW action Amjad has already approved executes once, and only once.
  # RED never reaches this branch: RED is a refusal, not something queueable.
  if [[ "$TIER" == "YELLOW" ]] && check_approval "$(fingerprint)"; then
    DECISION="pass-approved"; REASON="Approved by Amjad in $APPROVAL_FILE (single use, now consumed)"
    log_line
    if [[ -n "$JQ" ]]; then
      "$JQ" -nc --arg r "$REASON" \
        '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"allow",permissionDecisionReason:$r}}' 2>/dev/null
    else
      printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"allow","permissionDecisionReason":"%s"}}\n' "$(json_escape "$REASON")"
    fi
    _gate_done=1
    exit 0
  fi

  [[ "$TIER" == "YELLOW" && "$NOSTUB" -eq 0 ]] && write_proposal
  [[ -n "$PROPOSAL_FILE" ]] && REASON="$REASON

A proposal stub is waiting at: $PROPOSAL_FILE
Open it, fill in Why now / Effect if approved / Cost / Reversible / If you reject,
and put the real preview (actual diff, actual copy, actual command) in the Preview
section. Then carry on with the next piece of work — do not retry this call."
  log_line
  if [[ -n "$JQ" ]]; then
    "$JQ" -nc --arg r "$REASON" \
      '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",permissionDecisionReason:$r}}' \
      2>/dev/null || printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"%s"}}\n' "$(json_escape "$REASON")"
  else
    printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"%s"}}\n' "$(json_escape "$REASON")"
  fi
  _gate_done=1
  exit 0
}

pass_through() { # pass_through <note>
  # GREEN work is allowed outright rather than handed on to the settings layer.
  #
  # Why: the settings file rules are matched against the path as written, and the
  # model routinely writes absolute paths, so cwd-relative allow entries miss and
  # ordinary sandbox work stalls at a permission prompt. A prompt during an
  # unattended run is a dead end, which would break the one property this design
  # exists for — working while Amjad is away.
  #
  # This is safe because the gate is the stricter of the two layers and has
  # already run every check by the time it reaches here: credential paths, the
  # self-configuration zone, the decision zone, path traversal and symlink
  # escapes, RED command heads, redirect targets, script contents, hostile flags.
  # It only reaches GREEN when all of them pass.
  #
  # And it degrades safely: if this hook is ever removed or fails, nothing emits
  # "allow", and every call falls back to the deny/ask/allow rules in
  # settings.json. The two layers are belt and braces, not one wearing the other.
  TIER="GREEN"; DECISION="pass"; REASON="${1:-}"
  log_line
  if [[ -n "$JQ" ]]; then
    "$JQ" -nc --arg r "GREEN: ${REASON:-inside the sandbox}" \
      '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"allow",permissionDecisionReason:$r}}' 2>/dev/null
  else
    printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"allow","permissionDecisionReason":"GREEN: %s"}}\n' "$(json_escape "${REASON:-inside the sandbox}")"
  fi
  _gate_done=1
  exit 0
}

fingerprint() {
  local fp
  fp="$(printf '%s|%s|%s' "$TOOL" "$TARGET" "$CMD" | cksum 2>/dev/null | tr -d ' \n' | cut -c1-14)"
  [[ -n "$fp" ]] || fp="nofp"
  printf '%s' "$fp"
}

APPROVAL_FILE=""
check_approval() { # check_approval <fingerprint>
  local fp="$1" dir="$ROOT/approvals/approved" f hits
  [[ -d "$dir" ]] || return 1
  hits="$(grep -rlsF "gate-fingerprint: $fp" "$dir" 2>/dev/null || true)"
  [[ -n "$hits" ]] || return 1
  while IFS= read -r f; do
    [[ -n "$f" && -f "$f" ]] || continue
    grep -qsiE '^- \[[xX]\] approve' "$f" || continue     # box must be ticked
    grep -qsF 'gate-consumed:' "$f" && continue            # single use only
    printf '<!-- gate-consumed: %s -->\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ 2>/dev/null)" >> "$f" 2>/dev/null || return 1
    APPROVAL_FILE="${f#"$ROOT"/}"
    return 0
  done <<< "$hits"
  return 1
}

write_proposal() {
  local dir="$ROOT/approvals/pending" day fp existing slug f n=1 title
  mkdir -p "$dir" 2>/dev/null || return 0
  day="$(date +%Y-%m-%d 2>/dev/null || printf '0000-00-00')"

  fp="$(fingerprint)"
  existing="$(grep -rlsF "gate-fingerprint: $fp" "$dir" 2>/dev/null | head -1 || true)"
  if [[ -n "$existing" ]]; then
    PROPOSAL_FILE="${existing#"$ROOT"/}"
    return 0
  fi

  # Title: something Amjad can recognise in a directory listing.
  case "$TOOL" in
    Bash)  title="$(printf '%s' "$CMD" | tr '\n' ' ' | cut -c1-60)" ;;
    mcp__*) title="${TOOL#mcp__}" ;;
    *)     title="$TOOL ${TARGET##*/}" ;;
  esac
  slug="$(printf '%s' "$title" | tr '[:upper:]' '[:lower:]' | tr -cs 'a-z0-9' '-' | sed 's/^-*//; s/-*$//' | cut -c1-40 | sed 's/-*$//')"
  [[ -n "$slug" ]] || slug="action"

  # NN is a per-day counter across the whole queue, not per-slug.
  n=$(( $(ls "$ROOT"/approvals/pending "$ROOT"/approvals/approved "$ROOT"/approvals/rejected 2>/dev/null \
          | grep -c "^$day-[0-9][0-9]-" || true) + 1 ))
  [[ "$n" -ge 1 ]] || n=1
  while :; do
    f="$dir/$day-$(printf '%02d' "$n")-$slug.md"
    [[ -e "$f" ]] || break
    n=$((n + 1))
    [[ $n -gt 99 ]] && return 0
  done

  {
    printf '# %s\n' "AUTO-STUB — Marsam must complete this line: what it wants to do"
    printf -- '- **Tier:** YELLOW\n'
    printf -- '- **Requested:** %s\n' "$(date '+%Y-%m-%d %H:%M' 2>/dev/null || printf 'unknown')"
    printf -- '- **Why now:** _(Marsam: the trigger — what you found, what task this serves)_\n'
    printf -- '- **Effect if approved:** %s\n' "$REASON_SHORT"
    printf -- '- **Cost:** _(Marsam: credits / money / API calls, or "none")_\n'
    printf -- '- **Reversible:** _(Marsam: yes, how — or no, why not)_\n'
    printf -- '- **If you reject:** _(Marsam: what you will do instead, or what stays undone)_\n'
    printf '\n## Preview\n'
    printf 'The gate captured the exact call that was blocked:\n\n'
    printf '```json\n{\n  "tool": "%s",\n  "cwd": "%s",\n  "tool_input": %s\n}\n```\n\n' \
      "$TOOL" "$CWD" "$TOOL_INPUT_PRETTY"
    printf '> **Marsam:** replace or extend this with the real preview — the actual unified\n'
    printf '> diff, the actual copy, the actual image prompt, the actual credit estimate.\n'
    printf '> Amjad must be able to judge this without asking a follow-up question.\n'
    printf '\n## Decision\n'
    printf -- '- [ ] approve\n'
    printf -- '- [ ] reject — \n'
    printf '\n<!-- gate-fingerprint: %s -->\n' "$fp"
    printf '<!-- written by boundary-gate.sh; do not edit the fingerprint -->\n'
  } > "$f" 2>/dev/null || return 0

  PROPOSAL_FILE="${f#"$ROOT"/}"
}

REASON_SHORT=""

# ---------------------------------------------------------------------------
# 7. Shared path classifier
# ---------------------------------------------------------------------------
# Sets CP_TIER and CP_REASON. It must NOT be called via $(...): it also sets the
# globals TARGET and REASON_SHORT, and a command substitution runs in a subshell,
# so those assignments would be discarded. TARGET feeds the approval fingerprint —
# losing it made every Write share one fingerprint, which collapsed distinct
# proposals together and would have let one approval authorise a different write.
CP_TIER=""; CP_REASON=""
classify_path() { # classify_path <raw> <verb: read|edit|overwrite>
  CP_TIER=""; CP_REASON=""
  #   read      -> Read/Grep/Glob: only credential patterns are RED.
  #   edit      -> Edit/MultiEdit/NotebookEdit: a targeted modification. Outside
  #                the sandbox this is YELLOW (proposable) per the brief's
  #                "any write, edit, rename or move ... including my project repos".
  #   overwrite -> Write: replaces the whole file. Onto an existing file outside
  #                the sandbox that is RED per "overwriting anything of mine".
  local raw="$1" verb="$2" rp
  rp="$(resolve_path "$raw")"
  TARGET="$rp"

  if printf '%s' "$rp" | grep -qE -- "$RE_CRED_HARD"; then
    CP_TIER='RED'; CP_REASON="$(printf 'Credentials. `%s` is a credential, key, cookie or browser-profile path. Reading, writing, echoing or transmitting these is RED — refused outright, not queued.' "$raw")"; return 0
  fi
  if printf '%s' "$rp" | grep -qE -- "$RE_SELFCONF"; then
    if [[ "$verb" != "read" ]]; then
      CP_TIER='RED'; CP_REASON="$(printf 'Self-expansion. `%s` is Marsam'"'"'s own authority configuration. You may never apply a change to it. Hand-write a proposal in approvals/pending/ instead — RED actions are not auto-stubbed, so this one is yours to write: the exact line you would change, what it would let you do that you cannot do now, and what it would let a confused or injected version of you do. Amjad applies it himself, or he does not.' "$raw")"; return 0
    fi
    CP_TIER='GREEN'; CP_REASON="$(printf '')"; return 0
  fi

  if [[ "$verb" != "read" ]] && in_protected "$rp"; then
    CP_TIER='RED'; CP_REASON="$(printf 'Forging an approval. `%s` is Amjad'"'"'s decision record. Proposals go in approvals/pending/ and nowhere else; only Amjad moves one into approved/ or rejected/. You may read these files — you may not write them.' "$rp")"; return 0
  fi

  if in_sandbox "$rp"; then
    CP_TIER='GREEN'; CP_REASON="$(printf '')"; return 0
  fi

  # Outside the sandbox from here on.
  if printf '%s' "$rp" | grep -qiE -- "$RE_CRED_SOFT"; then
    CP_TIER='RED'; CP_REASON="$(printf 'Credentials. `%s` resolves outside the sandbox and matches a credential/secret/token pattern.' "$raw")"; return 0
  fi
  if [[ "$verb" == "read" ]]; then
    CP_TIER='GREEN'; CP_REASON="$(printf '')"; return 0
  fi
  if [[ "$verb" == "overwrite" && -f "$rp" ]]; then
    REASON_SHORT="Overwrite the existing file $rp"
    CP_TIER='RED'; CP_REASON="$(printf 'Overwriting Amjad'"'"'s file outside workspace/. `%s` already exists and Write replaces it whole. Nothing outside workspace/ gets overwritten or deleted — write your version into workspace/ and propose the change as a diff, or move the original to workspace/_trash/ if Amjad has asked for that deliberately and specifically.' "$rp")"; return 0
  fi
  if [[ -f "$rp" ]]; then
    REASON_SHORT="Modify the existing file $rp (outside workspace/)"
    CP_TIER='YELLOW'; CP_REASON="$(printf 'Edit outside workspace/. `%s` is one of Amjad'"'"'s files, not yours. Not executed — propose it as a diff.' "$rp")"; return 0
  fi
  REASON_SHORT="Create $rp (outside workspace/)"
  CP_TIER='YELLOW'; CP_REASON="$(printf 'Write outside workspace/. `%s` is not in workspace/, reports/, approvals/ or memory/. Not executed.' "$rp")"; return 0
}

# ---------------------------------------------------------------------------
# 8. Bash classifier
# ---------------------------------------------------------------------------
BTIER=""; BREASON=""

seg_head() { # seg_head <segment> -> command head, lowercased basename
  local seg="$1" tok
  seg="${seg#"${seg%%[![:space:]]*}"}"
  while [[ -n "$seg" ]]; do
    case "$seg" in
      '('*|'{'*|'}'*|'!'*|'&'*|')'*)
        seg="${seg:1}"; seg="${seg#"${seg%%[![:space:]]*}"}" ;;
      'time '*|'nohup '*|'command '*|'builtin '*|'exec '*|'then '*|'do '*|'else '*|'elif '*)
        seg="${seg#* }"; seg="${seg#"${seg%%[![:space:]]*}"}" ;;
      *)
        tok="${seg%%[[:space:]]*}"
        if [[ "$tok" == [A-Za-z_]*=* && "$tok" != */* ]]; then
          seg="${seg#*[[:space:]]}"; seg="${seg#"${seg%%[![:space:]]*}"}"
        else
          break
        fi ;;
    esac
  done
  tok="${seg%%[[:space:]]*}"
  tok="${tok##*/}"
  printf '%s' "$tok"
}

seg_args() { # seg_args <segment> -> everything after the head
  local seg="$1"
  seg="${seg#"${seg%%[![:space:]]*}"}"
  if [[ "$seg" == *[[:space:]]* ]]; then printf '%s' "${seg#*[[:space:]]}"; else printf ''; fi
}

first_nonflag() { # first_nonflag <args>
  local a
  for a in $1; do
    [[ "$a" == -* ]] && continue
    printf '%s' "$a"; return 0
  done
  printf ''
}

bred()    { BTIER="RED";    BREASON="$1"; return 0; }
byellow() { BTIER="YELLOW"; BREASON="$1"; return 0; }

# A YELLOW that reaches outside the sandbox is a decision for Amjad, so it gets a
# proposal. A YELLOW that exists only because the gate cannot see inside the call
# — inline interpreter code, a wrapper, an unrecognised binary — is friction, not
# a decision: deny it with guidance, but do not put it in the queue. The queue is
# for things Amjad has to rule on; hook-log.jsonl already records everything else.
byellow_nostub() { BTIER="YELLOW"; BREASON="$1"; NOSTUB=1; return 0; }

# Neutralise shell-significant characters that appear INSIDE quoted strings, so
# that prose in a printf/echo argument is not parsed as shell syntax. Without this,
# `printf 'wrote Bash(*) edit note' >> reports/log.md` splits on the ")" and the
# word after it is read as a command head. Word characters and path separators are
# preserved so that argument extraction still works.
struct_form() {
  printf '%s' "$1" | awk -v APOS="'" '{
    out=""; q="";
    for (i = 1; i <= length($0); i++) {
      c = substr($0, i, 1)
      if (q == "") {
        if (c == "\"" || c == APOS) { q = c; out = out " " }
        else out = out c
      } else {
        if (c == q) { q = ""; out = out " " }
        else if (index("();|&<>$`", c) > 0) out = out "_"
        else out = out c
      }
    }
    print out
  }' 2>/dev/null || printf '%s' "$1"
}

classify_bash() {
  local cmd="$1" scan struct segs seg head args target rp t
  BTIER="GREEN"; BREASON=""

  # scan  = quotes removed, content intact -> used for credential/hostile matching,
  #         because those patterns must be caught even inside a quoted string.
  # struct = quoted spans neutralised -> used for everything structural: segmenting,
  #         command heads, redirect targets, cd tracking, argument targets.
  scan="$(printf '%s' "$cmd" | tr -d '\042\047')"
  struct="$(struct_form "$cmd")"
  # an unquoted <...> (an HTML tag in an argument) is not a redirect either
  struct="$(printf '%s' "$struct" | sed -E 's/<[A-Za-z!\/][^<>]*>/ /g' 2>/dev/null || printf '%s' "$struct")"

  # --- whole-command RED signals -------------------------------------------
  if printf '%s' "$scan" | grep -qE -- "$RE_CMD_CRED"; then
    bred "Credentials. This command references a credential, key, cookie or browser-profile path. RED — refused, not queued."; return 0
  fi
  if printf '%s' "$scan" | grep -qiE -- "$RE_HOSTILE"; then
    bred "Competitor / auth boundary. This command carries an authentication, cookie, proxy or robots-bypass flag. Public pages only, at human rate. If the data is behind a wall the answer is \"not observable\", never a workaround."; return 0
  fi
  if printf '%s' "$scan" | grep -qE '(^|[[:space:]])(npm|pnpm|yarn)[[:space:]]+publish([[:space:]]|$)'; then
    bred "Publishing. Package publication is RED."; return 0
  fi
  if printf '%s' "$scan" | grep -qE '(^|[[:space:]])docker[[:space:]]+push([[:space:]]|$)'; then
    bred "Publishing. \`docker push\` is RED."; return 0
  fi
  if printf '%s' "$scan" | grep -qE '(^|[[:space:]])gh[[:space:]]+(pr|issue)[[:space:]]+(comment|review)([[:space:]]|$)|(^|[[:space:]])gh[[:space:]]+release([[:space:]]|$)'; then
    bred "Sending. Posting a comment, review or release is RED."; return 0
  fi

  # --- effective cwd after any cd ------------------------------------------
  local eff_cwd="$CWD"
  segs="$(printf '%s' "$struct" | awk '{ gsub(/\$\(|\)|`|\|\||&&|;|\|/, "\n"); print }' 2>/dev/null || printf '%s' "$struct")"

  while IFS= read -r seg; do
    head="$(seg_head "$seg")"
    [[ "$head" == "cd" || "$head" == "pushd" ]] || continue
    args="$(seg_args "$seg")"
    target="$(first_nonflag "$args")"
    [[ -z "$target" ]] && target="$HOME"
    eff_cwd="$(resolve_path "$target" "$eff_cwd")"
  done <<< "$segs"

  # --- redirect targets -----------------------------------------------------
  local redirs
  redirs="$(printf '%s' "$struct" | grep -oE '(^|[^0-9<>])>>?[[:space:]]*[^[:space:]<>|&;()]+' 2>/dev/null || true)"
  if [[ -n "$redirs" ]]; then
    while IFS= read -r t; do
      [[ -n "$t" ]] || continue
      t="${t#"${t%%[>]*}"}"      # drop everything before the first >
      t="${t#>}"; t="${t#>}"
      t="${t#"${t%%[![:space:]]*}"}"
      [[ -z "$t" || "$t" == \&* || "$t" == /dev/* ]] && continue
      rp="$(resolve_path "$t" "$eff_cwd")"
      if in_protected "$rp"; then
        TARGET="$rp"
        bred "Forging an approval. This command redirects output into Amjad's decision record (\`$rp\`). Only Amjad writes there."; return 0
      fi
      if ! in_sandbox "$rp"; then
        TARGET="$rp"
        if [[ -f "$rp" ]]; then
          bred "Overwriting Amjad's file outside workspace/. This command redirects output onto \`$rp\`, which already exists."; return 0
        fi
        REASON_SHORT="Write $rp via shell redirect"
        byellow "Shell redirect writes to \`$rp\`, outside workspace/."; return 0
      fi
    done <<< "$redirs"
  fi

  # --- per-segment head analysis -------------------------------------------
  local saw_command=0
  while IFS= read -r seg; do
    head="$(seg_head "$seg")"
    [[ -n "$head" ]] || continue
    case "$head" in [!A-Za-z0-9_.-]*) continue ;; esac
    [[ "$head" =~ ^[0-9]+$ ]] && continue
    args="$(seg_args "$seg")"
    saw_command=1

    if [[ "$head" =~ $RE_HEAD_RED ]]; then
      case "$head" in
        rm|rmdir|shred|srm|unlink)
          bred "Deletion. \`$head\` is RED. Nothing gets deleted outside workspace/ — move it to workspace/_trash/ instead, and only when Amjad has asked deliberately and specifically. Inside workspace/, delete with the Write/Edit tools." ;;
        curl|wget|nc|ncat|telnet)
          bred "\`$head\` is RED — it can POST, authenticate and exfiltrate, and prefix rules cannot see inside it. Use the WebFetch tool for public reads; the permission rules can actually see that one." ;;
        mail|mailx|sendmail|mutt|msmtp|swaks)
          bred "Sending. Email is RED — no email, DM, post, form submission, comment or review, ever." ;;
        scp|sftp|ssh|rsync)
          bred "Remote transfer. \`$head\` reaches another machine. RED." ;;
        vercel|netlify|surge|wrangler|firebase|heroku|flyctl|now)
          bred "Deployment. \`$head\` touches a live site. Deploying or publishing anything, Amjad's or a client's, is RED." ;;
        sudo|doas|su|chown|chgrp|passwd|launchctl|security|keychain|osascript|diskutil|mkfs|dd)
          bred "Privilege / system change. \`$head\` is RED." ;;
        *) bred "\`$head\` is on the RED command list." ;;
      esac
      return 0
    fi

    case "$head" in
      sed)
        if printf '%s' "$args" | grep -qE '(^|[[:space:]])-[a-zA-Z]*i'; then
          REASON_SHORT="In-place edit via sed"
          byellow_nostub "\`sed -i\` edits files in place, and the gate cannot tell which. Use the Edit tool inside workspace/. Not executed."; return 0
        fi ;;
      find)
        if printf '%s' "$args" | grep -qE '(^|[[:space:]])-(delete|exec|execdir|ok|okdir|fprint|fls)([[:space:]]|$)'; then
          REASON_SHORT="find with an action flag"
          byellow_nostub "\`find\` with -delete/-exec runs or removes things the gate cannot see. Not executed."; return 0
        fi ;;
      awk|gawk|mawk)
        if printf '%s' "$args" | grep -qE '>|system\(|print[[:space:]]*>' ; then
          REASON_SHORT="awk program that writes or shells out"
          byellow_nostub "This \`awk\` program writes to a file or shells out. Not executed."; return 0
        fi ;;
      tee)
        target="$(first_nonflag "$args")"
        rp="$(resolve_path "$target" "$eff_cwd")"
        if ! in_sandbox "$rp"; then
          TARGET="$rp"; REASON_SHORT="Write $rp via tee"
          byellow "\`tee\` writes to \`$rp\`, outside workspace/."; return 0
        fi ;;
      mkdir|touch|cp|mv|ln|truncate)
        for t in $args; do
          [[ "$t" == -* ]] && continue
          rp="$(resolve_path "$t" "$eff_cwd")"
          if printf '%s' "$rp" | grep -qE -- "$RE_CRED_HARD"; then
            TARGET="$rp"; bred "Credentials. \`$head\` targets \`$rp\`."; return 0
          fi
          if in_protected "$rp"; then
            TARGET="$rp"; bred "Forging an approval. \`$head\` targets Amjad's decision record (\`$rp\`). Proposals go in approvals/pending/; only Amjad moves one to approved/ or rejected/."; return 0
          fi
          if ! in_sandbox "$rp"; then
            TARGET="$rp"
            if [[ "$head" == mv || "$head" == cp || "$head" == ln || "$head" == truncate ]] && [[ -f "$rp" ]]; then
              bred "Overwriting Amjad's file outside workspace/. \`$head\` targets \`$rp\`, which already exists."; return 0
            fi
            REASON_SHORT="\`$head\` on $rp (outside workspace/)"
            byellow "\`$head\` targets \`$rp\`, outside workspace/."; return 0
          fi
        done ;;
      git)
        local sub; sub="$(first_nonflag "$args")"
        case "$sub" in
          status|log|diff|show|remote|rev-parse|ls-files|ls-tree|blame|describe|shortlog|cat-file|for-each-ref|grep|whatchanged) ;;
          branch)
            if printf '%s' "$args" | grep -qE 'branch[[:space:]]+[^-]'; then
              REASON_SHORT="git branch create/delete"
              byellow "Branch creation or deletion changes repository state."; return 0
            fi ;;
          config)
            if ! printf '%s' "$args" | grep -qE '(--get|--list|-l)([[:space:]]|$)'; then
              REASON_SHORT="git config write"
              byellow "\`git config\` without --get/--list writes configuration."; return 0
            fi ;;
          "")
            ;;
          *)
            REASON_SHORT="git $sub"
            byellow "\`git $sub\` changes repository state. commit, push, merge, rebase, branch and tag operations are all YELLOW — they get proposed, not run."; return 0 ;;
        esac ;;
      marsam-approve|marsam-reject)
        # Deliberate exception: these are the approval gesture itself. The gate
        # stands aside so the settings layer asks, and a human has to accept.
        continue ;;
      python3|python|node|deno|bun|ruby|perl|php|bash|sh|zsh|ksh)
        if printf '%s' "$args" | grep -qE '(^|[[:space:]])-(c|e)([[:space:]]|$)'; then
          REASON_SHORT="inline script via $head -c"
          byellow_nostub "Inline code passed to \`$head -c\` cannot be audited. Write the script into workspace/ and run it from there — that is GREEN and needs no approval. Not queued: this is the gate not being able to see inside the call, not a decision for Amjad."; return 0
        fi
        if [[ "$head" == python3 || "$head" == python ]] && printf '%s' "$args" | grep -qE '(^|[[:space:]])-m[[:space:]]+http\.server'; then
          local dirarg
          dirarg="$(printf '%s' "$args" | grep -oE '\-\-directory[[:space:]]+[^[:space:]]+' | head -1 | awk '{print $2}' || true)"
          if [[ -z "$dirarg" ]]; then
            REASON_SHORT="http.server with no --directory"
            byellow_nostub "\`python3 -m http.server\` with no --directory would serve \`$eff_cwd\`. Pass --directory pointing inside workspace/."; return 0
          fi
          rp="$(resolve_path "$dirarg" "$eff_cwd")"
          if ! in_sandbox "$rp"; then
            TARGET="$rp"; REASON_SHORT="http.server serving $rp"
            byellow "Preview server would serve \`$rp\`, outside workspace/."; return 0
          fi
          continue
        fi
        if printf '%s' "$args" | grep -qE -- '(^|[[:space:]])(--version|-V|--help|-h)([[:space:]]|$)'; then
          continue
        fi
        target="$(first_nonflag "$args")"
        if [[ -z "$target" ]]; then
          REASON_SHORT="interactive interpreter"
          byellow_nostub "\`$head\` with no script would open an interactive interpreter."; return 0
        fi
        rp="$(resolve_path "$target" "$eff_cwd")"
        TARGET="$rp"
        for t in "${SANCTIONED_SCRIPTS[@]}"; do
          [[ "$rp" == "$t" ]] && continue 2
        done
        if ! in_sandbox "$rp"; then
          REASON_SHORT="run script $rp from outside workspace/"
          byellow_nostub "\`$head $target\` runs a script outside workspace/, whose contents the gate cannot vouch for. Copy it into workspace/ and run it there."; return 0
        fi
        if [[ -f "$rp" ]]; then
          if grep -qsE 'approvals/(approved|rejected)|DECISIONS\.md' "$rp"; then
            TARGET="$rp"
            bred "Forging an approval. \`$rp\` writes into Amjad's decision record. A script in workspace/ is not a way around the gate."; return 0
          fi
          if grep -qE -- "$RE_HEAD_RED" "$rp" 2>/dev/null || grep -qiE 'rm[[:space:]]+-[rf]|curl |wget |sudo |ssh ' "$rp" 2>/dev/null; then
            REASON_SHORT="run workspace script containing RED commands"
            byellow_nostub "\`$rp\` is inside workspace/ but its contents include commands on the RED list. The gate cannot see what a script does once it runs, so this one is not run unsupervised."; return 0
          fi
        fi ;;
      npm|pnpm|yarn|npx|pip|pip3|brew|apt|apt-get|yum|dnf|pacman|gem|cargo|go|composer|docker|gh|make|terraform|ansible|kubectl|helm)
        REASON_SHORT="\`$head $(first_nonflag "$args")\`"
        byellow "\`$head\` installs, builds, deploys or reaches an external service. Not executed."; return 0 ;;
      eval|source|.|env|xargs|alias|function|watch|screen|tmux|at|crontab)
        REASON_SHORT="\`$head\` wrapper"
        byellow_nostub "\`$head\` wraps or defers another command, so the gate cannot see what actually runs."; return 0 ;;
      *)
        if [[ ! "$head" =~ $RE_HEAD_RO ]]; then
          REASON_SHORT="unrecognised command \`$head\`"
          byellow_nostub "\`$head\` is not on the read-only list. Uncertainty resolves to YELLOW, always. If this is a read-only command you need often, propose adding it to the allow list."; return 0
        fi ;;
    esac
  done <<< "$segs"

  if [[ "$saw_command" -eq 0 ]]; then
    byellow_nostub "The gate could not identify any command in this input. Uncertainty resolves to YELLOW."; return 0
  fi

  # cd out of the sandbox with only read-only commands is fine, but note it.
  BTIER="GREEN"; BREASON=""
  return 0
}

# ---------------------------------------------------------------------------
# 9. Dispatch
# ---------------------------------------------------------------------------
case "$TOOL" in

  Read|Grep|Glob)
    if [[ -n "$PATHS" ]]; then
      while IFS= read -r p; do
        [[ -n "$p" ]] || continue
        classify_path "$p" "read"
        [[ "$CP_TIER" == "RED" ]] && emit_deny "RED" "$CP_REASON"
      done <<< "$PATHS"
    fi
    pass_through "read"
    ;;

  Edit|Write|MultiEdit|NotebookEdit)
    if [[ "$TOOL" == "Write" ]]; then verb="overwrite"; else verb="edit"; fi
    if [[ -z "$PATHS" ]]; then
      REASON_SHORT="$TOOL with no resolvable path"
      emit_deny "YELLOW" "$TOOL carried no path the gate could resolve. Uncertainty resolves to YELLOW."
    fi
    while IFS= read -r p; do
      [[ -n "$p" ]] || continue
      classify_path "$p" "$verb"
      case "$CP_TIER" in
        RED)    emit_deny "RED"    "$CP_REASON" ;;
        YELLOW) emit_deny "YELLOW" "$CP_REASON" ;;
        GREEN)  ;;
        *)      NOSTUB=1; emit_deny "YELLOW" "The gate could not classify \`$p\`. Uncertainty resolves to YELLOW." ;;
      esac
    done <<< "$PATHS"
    pass_through "write inside sandbox"
    ;;

  Bash|BashOutput|KillShell)
    if [[ "$TOOL" != "Bash" ]]; then pass_through "shell management"; fi
    [[ -n "$CMD" ]] || { NOSTUB=1; emit_deny "YELLOW" "Bash call carried no command string the gate could read. Uncertainty resolves to YELLOW."; }
    TARGET=""
    classify_bash "$CMD"
    case "$BTIER" in
      RED)    emit_deny "RED"    "$BREASON" ;;
      YELLOW) emit_deny "YELLOW" "$BREASON" ;;
      GREEN)  pass_through "read-only / sandbox shell" ;;
      *)      emit_deny "YELLOW" "Bash classifier returned no tier. Failing to YELLOW." ;;
    esac
    ;;

  mcp__*)
    action="${TOOL##*__}"
    server="${TOOL#mcp__}"; server="${server%__"$action"}"
    TARGET="$TOOL"

    case "$server" in
      Gmail|gmail|Hostinger_Mail|hostinger*|*mail*|*Mail*)
        emit_deny "RED" "Sending. \`$TOOL\` belongs to a mail server. No email, DM, post, form submission, comment or review, ever — that is RED and it is not queueable." ;;
    esac

    if printf '%s' "$action" | grep -qiE '(purchase|payment|billing|subscribe|checkout|top_?up|invoice|auto_?topup)'; then
      emit_deny "RED" "Payment. \`$TOOL\` spends money or changes a plan. RED — no payment, subscription, purchase, plan change or top-up."
    fi
    if printf '%s' "$action" | grep -qiE '(api_?key|credential|secret|register_service_account|password)'; then
      emit_deny "RED" "Credentials. \`$TOOL\` reads, creates or revokes credentials. RED."
    fi
    if printf '%s' "$action" | grep -qiE '(^|_|-)(send|reply|forward|comment|review|publish|deploy)([_-]|$)'; then
      emit_deny "RED" "Sending / publishing. \`$TOOL\` posts a comment, review, message or publication. RED."
    fi
    if printf '%s' "$action" | grep -qiE '(^|_|-)(delete|remove|destroy|trash|withdraw|revoke)([_-]|$)'; then
      emit_deny "RED" "Deletion. \`$TOOL\` deletes something in an external account. RED — nothing of Amjad's gets deleted."
    fi
    if printf '%s' "$action" | grep -qiE '^(get|list|read|search|show|describe|help|whoami|resolve|find)([_-]|$)'; then
      pass_through "read-only MCP"
    fi
    REASON_SHORT="Run \`$TOOL\`"
    emit_deny "YELLOW" "External account / paid action. \`$TOOL\` creates something in an external account or spends credits. Not executed."
    ;;

  *)
    pass_through "unmatched tool"
    ;;
esac

emit_deny "YELLOW" "Fell through the classifier without a decision. Failing to YELLOW."
