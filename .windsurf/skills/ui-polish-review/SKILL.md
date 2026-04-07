---
name: ui-polish-review
description: Audit and refine UI polish in caltracker with a preview-before-code workflow. Use when the user asks for UI polish, visual cleanup, redesign, consistency passes, or wants to see browser previews before implementation.
---

# UI Polish Review

Handle UI polish in this repo with browser previews before implementation.

## Repo rules

- Treat UI polish as mockup-first, not code-first.
- Audit the target screens against `docs/ui-patterns.md`, the theme token system, and existing component patterns before proposing changes.
- Create new approval artifacts in `C:/caltracker/mockups/` by default.
- Use `C:/caltracker/previews/` only when extending an existing preview app rooted there.
- Show the preview in the browser before editing app code.
- Wait for explicit approval before implementation.
- After approval, implement only the approved change, then run review and verification.
- Repo-local skill source of truth lives under `.agents/skills/<skill>/`. Do not edit `.claude/skills/` or `.windsurf/skills/` directly.

## Workflow

1. Read the relevant screen code and compare it against `docs/ui-patterns.md`, theme tokens, and nearby component patterns.
2. Write down the mismatches you find. Focus on text scale, labels, redundant UI, action weight, formatting consistency, spacing, and eyebrow patterns.
3. Prioritize the changes by impact, effort, and risk.
4. Build a browser-visible preview before code changes:
   - Default artifact: standalone HTML mockup in `C:/caltracker/mockups/`
   - Default presentation: phone width (`390px max-width`)
   - Use the repo browser workflow and mockup launcher so the user can review it in-browser
5. Wait for explicit approval.
6. Implement the approved change without expanding scope.
7. Run a review pass:
   - Spec compliance review
   - Code quality review
   - Test coverage check for the touched behavior
8. Run the relevant verification before claiming completion.

## Notes

- Reuse existing app patterns before inventing new UI.
- Keep previews aligned with the repo's actual design tokens, spacing, and radii.
- If a small tweak still changes visible UI, it still requires a preview first in this repo.
