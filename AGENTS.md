# AGENTS.md

## gstack

Codex uses the global gstack install at `C:/Users/tgira/.codex/skills/gstack`.
That runtime is sourced from the shared checkout at `C:/Users/tgira/.claude/skills/gstack` so Claude Code and Codex stay on the same gstack version.

For browser work in this repo, prefer the gstack browser and QA skills over ad hoc browsing:
- `gstack-browse`
- `gstack-qa`
- `gstack-qa-only`
- `gstack-setup-browser-cookies`
- `gstack-connect-chrome`

Available Codex gstack skills in this environment:
- `gstack`
- `gstack-autoplan`
- `gstack-benchmark`
- `gstack-browse`
- `gstack-canary`
- `gstack-careful`
- `gstack-connect-chrome`
- `gstack-cso`
- `gstack-design-consultation`
- `gstack-design-review`
- `gstack-design-shotgun`
- `gstack-document-release`
- `gstack-freeze`
- `gstack-guard`
- `gstack-investigate`
- `gstack-land-and-deploy`
- `gstack-office-hours`
- `gstack-plan-ceo-review`
- `gstack-plan-design-review`
- `gstack-plan-eng-review`
- `gstack-qa`
- `gstack-qa-only`
- `gstack-retro`
- `gstack-review`
- `gstack-setup-browser-cookies`
- `gstack-setup-deploy`
- `gstack-ship`
- `gstack-unfreeze`
- `gstack-upgrade`

## UI polish workflow

For UI polish, visual cleanup, redesign, consistency passes, or requests to see changes in the browser before coding:
- Treat the work as mockup-first, not code-first.
- Audit the target screens against `docs/ui-patterns.md`, the theme token system, and existing component patterns before proposing changes.
- Create a browser-visible preview before editing app code. New approval artifacts go in `C:/caltracker/mockups/` by default and should be shown with the repo's browser workflow.
- Use `C:/caltracker/previews/` only when extending an existing preview app rooted there.
- Wait for explicit approval before implementation.
- After approval, implement the approved change, run review, and verify tests before claiming completion.

Repo-local skill source of truth lives under `.agents/skills/<skill>/`. Do not edit `.claude/skills/` or `.windsurf/skills/` directly; those trees are junction mirrors for discovery.

<!-- convex-ai-start -->
This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running `npx convex ai-files install`.
<!-- convex-ai-end -->
