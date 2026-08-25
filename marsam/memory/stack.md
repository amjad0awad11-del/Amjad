# Stack, projects, and folders

> **STATUS: PARTIALLY ANSWERED.** The MCP section below is real — it was read from a live
> session. Everything else is waiting on Amjad. Marsam: do not guess a framework, a host,
> or a folder path. Getting a path wrong means proposing an edit to a file that isn't there.

## Tech stack
- **Framework(s):**
- **Styling:**
- **CMS / commerce platform:**
- **Hosting:**
- **Domains / DNS:**
- **Analytics:**
- **Repo layout and conventions:**
- **Node / package manager:**
- **Deploy process (Marsam never runs it — RED):**

## Folders on the laptop

> These populate `additionalDirectories` in `.claude/settings.json`. That setting grants
> Marsam *access*; it does not grant write access. Writes outside `workspace/` stay YELLOW
> and go through the queue regardless of what is listed here.

**Marsam may READ:**
- _(not yet specified)_

**Marsam must NEVER touch, read or list:**
- _(not yet specified — but `.env` files, `~/.ssh`, keychains, browser profiles and
  anything matching credential/secret/token patterns are already RED at both the settings
  and hook layer, everywhere on disk, regardless of this list.)_

## MCP servers

Read from a live session on 2026-08-25. **Verify against your laptop with `/mcp`** — this
container's server list is not necessarily the same as yours, and the server *names* matter:
the permission rules key off the exact prefix (`mcp__Canva__…`), so a server registered
locally as `canva` rather than `Canva` will not match the rules as written.

| Server | Used by | Tier notes |
|---|---|---|
| **Canva** | design-director | search/read/list = GREEN. create, edit, export, resize, copy, upload, publish = YELLOW. comment / reply / request-review = **RED** (sending). |
| **Motion** | motion-producer | balance, plans, settings, status = GREEN. `create_video`, `create_followup`, `upload_asset` = YELLOW. `purchase_credits`, `setup_payment_method`, `subscribe_to_plan`, `set_auto_topup`, `create_api_key`, `revoke_api_key` = **RED** (payment / credentials). |
| **21st.dev** | web-animator, design-director | search, get_component, inspiration, themes = GREEN. generate, submit, edit = YELLOW. delete = **RED**. |
| **Lovable** | — | project creation = YELLOW. |
| **GitHub** | — | reads = GREEN. push, PR/issue creation, file writes = YELLOW. comments, reviews, merge, delete_file = **RED**. |
| **Gmail** | — | **entire server RED.** Denied at the settings layer and again at the hook. |
| **Hostinger Mail** | — | **entire server RED.** Same. |

**No image-generation MCP is connected.** `design-director` therefore degrades to briefs,
directions and complete, directly-executable prompts. If Amjad wants generated images
inside Marsam, that is a proposal naming the tool, the cost and the access it gets.

## Approved tools

> §10 of the build brief: **proposing is GREEN, adopting is YELLOW.** Marsam may research
> any tool freely and build a throwaway proof of concept in `workspace/` with anything it
> can already run there. Installing, connecting an account, adding an MCP server, or
> spending money is a proposal in the queue.
>
> **Check this table before asking.** Approved tools accumulate here so "can I use X"
> becomes a lookup instead of a repeated question. When Amjad approves one, append a row
> with the date and the scope of the approval.

| Tool | Approved | Scope | Cost | Notes |
|---|---|---|---|---|
| `python3 -m http.server` | built in | previewing prototypes from `workspace/` | none | no install; stays in the sandbox |
| GSAP / ScrollTrigger / Lenis (CDN, in prototypes) | built in | `workspace/prototypes/` only | none | adding them to one of Amjad's real projects is YELLOW |

## Notifications
- **How Amjad wants to be told a run finished:** _(not yet specified — until he says
  otherwise, the report file plus `reports/activity-log.md` is the whole notification.)_
