# CLAUDE.md

## gstack

Use the `/browse` skill from gstack for all web browsing. Never use `mcp__claude-in-chrome__*` tools.

### Available gstack skills

- `/office-hours`
- `/plan-ceo-review`
- `/plan-eng-review`
- `/plan-design-review`
- `/design-consultation`
- `/design-shotgun`
- `/review`
- `/ship`
- `/land-and-deploy`
- `/canary`
- `/benchmark`
- `/browse`
- `/connect-chrome`
- `/qa`
- `/qa-only`
- `/design-review`
- `/setup-browser-cookies`
- `/setup-deploy`
- `/retro`
- `/investigate`
- `/document-release`
- `/codex`
- `/cso`
- `/autoplan`
- `/careful`
- `/freeze`
- `/guard`
- `/unfreeze`
- `/gstack-upgrade`

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
