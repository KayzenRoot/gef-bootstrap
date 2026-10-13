# Optional agent skills — GitHub Issue tracker

Status: **ADVISORY / NON-AUTHORITATIVE**. This guide is not an admitted Work Order, effective ADR, implementation permission or approval to modify a provider. The real authority is `AGENTS.md`, `.engineering/SOURCE-HIERARCHY.md`, current canonical CHECKPOINT pair, Security, ADR-0008 and the applicable admitted Work Order + Context Lock.

## Before ANY GitHub write

1. In a local checkout, run `gh auth status --hostname github.com`. Confirm the **active** GitHub identity is `KayzenRoot`. A successful authentication with another identity is a **stop**, not authorization to switch accounts or proceed.
2. Confirm target repository exactly `KayzenRoot/gef-bootstrap` with `gh repo view KayzenRoot/gef-bootstrap --json nameWithOwner`; include `--repo KayzenRoot/gef-bootstrap` for `gh issue` and `gh pr` commands where supported. For `gh api`, use full explicit `repos/KayzenRoot/gef-bootstrap/...` path rather than relying on checkout inference.
3. Read current checkout SHA, relevant Source Pack and issue/Work Order/lock gates. `gh` permission **does not** authorize the operation. Verify risk, exact target, state and required specific Owner approval. No issue closure, sub-issue insertion, label, comment, PR edit or `gh api --method POST/PATCH/PUT/DELETE` is exempt from this preflight.
4. On missing identity, inconsistent repo, stale Context Lock or unresolved source authority, **STOP**; do not create/edit/close issues to hide the uncertainty. S4 requires separate action- and target-specific Owner authorization under Security SEC-02.

For connector-based operations in ChatGPT, authenticate via the connected `KayzenRoot` account, verify the repository identity and perform the same authorization/source checks; a local `gh` command is not necessary or a substitute for the connector's verified account.

## Read-only inventory first

- Read ticket: `gh issue view <number> --repo KayzenRoot/gef-bootstrap --json number,title,body,labels,assignees,state`.
- List: `gh issue list --repo KayzenRoot/gef-bootstrap --state open --limit 100 --json number,title,labels,assignees`. The `--limit` is a *page/output cap*, **not evidence of exhaustive discovery**. Paginate or query every known child explicitly before claiming completeness.
- For all issues via API when truly needed: `gh api --paginate 'repos/KayzenRoot/gef-bootstrap/issues?state=open&per_page=100' --jq '.[] | select(.pull_request == null) | .number'`. REST issues list also includes pull requests, so filter `pull_request`. Confirm completeness against expected count and avoid falsely claiming zero pending tickets.
- Read PR: `gh pr view <number> --repo KayzenRoot/gef-bootstrap --json number,title,headRefOid,baseRefOid,isDraft,mergeStateStatus`; read `gh pr diff <number> --repo KayzenRoot/gef-bootstrap` for scoped review. A merged PR is not proof of canonical promotion.

## Mutations (ONLY within already approved policy and after above preflight)

Examples of syntax, not standing authorization: `gh issue create --repo KayzenRoot/gef-bootstrap --title '...' --body-file <file>`, `gh issue comment <number> --repo KayzenRoot/gef-bootstrap --body '...'`, `gh issue edit <number> --repo KayzenRoot/gef-bootstrap --add-label '...'`, `gh issue close <number> --repo KayzenRoot/gef-bootstrap --comment '...'`. For REST writes, confirm the exact database IDs and named endpoints first. Never assign/close an active Work Order solely because a PR merged.

## Wayfinding: complete, dependency-aware frontier

The optional `wayfinder:map` concept uses one *map issue* with child issues (GitHub sub-issues or a documented fallback task list). It is an organizational convention, not a new canonical progression state.

1. Obtain map #number and read the **complete child identity set** from its actual sub-issue links. Where native sub-issues are in use, enumerate using an authenticated **paginated** read: `gh api --paginate 'repos/KayzenRoot/gef-bootstrap/issues/<map-number>/sub_issues?per_page=100'`. When no native sub-issue feature exists, parse the explicitly maintained map task-list; do not guess a mapping from recent issues.
2. Compare child count against the map's recorded count when available. Query **each child by ID** (e.g. `gh issue view <child-number> --repo KayzenRoot/gef-bootstrap --json number,state,assignees,title`). This avoids silently dropping a relevant child outside the `gh issue list` default 30 most recent open tickets.
3. For each child, **actually query native blockers** using a read-only API: `gh api --paginate 'repos/KayzenRoot/gef-bootstrap/issues/<child-number>/dependencies/blocked_by?per_page=100'` where supported. Evaluate each blocker issue's open/closed state (or the exact supported native blocked-by summary); do not assume `issue_dependencies_summary` is a supported `gh issue list --json` field. If native dependencies are unavailable, inspect every `Blocked by: #...` fallback and query those referenced tickets. If blocker status cannot be proven, mark **UNKNOWN/BLOCKED**, not `ready-for-agent`.
4. Enumerate eligible, open, unassigned, **unblocked** child IDs in **map order**, not in API recency order; claim none if set is empty or source proof is incomplete.
5. Claiming is a GitHub write. Repeat Owner/account/Work Order/lock authorization checks and only then `gh issue edit <child-number> --repo KayzenRoot/gef-bootstrap --add-assignee '@me'` **if authorized**. This does not admit implementation, override the active Work Order or permit uncontrolled multiple agents.
6. Completion requires the actual DoD + evidence/promotion. A comment+closed issue alone does not grant module DONE. Preserve remaining unresolved sibling children.

## Optional skill conventions and limits

When an installed `mattpocock-skills` capability matches a task, its guidance is **advisory** and must not overwrite canonical Source Pack, tool safety, identity checks or stop conditions. No plugin installation, paid use, implicit `/ask-matt` requirement or skill invocation may be claimed without actually available tooling. Deterministic Git/source inspection and local/hosted checks take priority over model advice.

**STOP:** `AGENT_SKILLS_ISSUE_TRACKER_ADVISORY_ONLY`.
