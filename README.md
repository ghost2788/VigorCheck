# CalTracker

CalTracker is a planned AI-powered nutrition tracking app focused on low-friction meal logging, daily progress visibility, and broader nutrition awareness beyond calories alone.

The core idea is simple: take a photo of a meal, get a nutrition estimate, review the draft quickly, and watch your day update across calories, macros, hydration, and key micronutrients.

## Status

This repository is currently in the planning and design phase.

What exists today:
- a detailed product design spec
- a starter game design document / product outline
- repo guidance for Codex and Claude workflows

What is planned next:
- mobile app implementation
- backend schema and AI meal analysis pipeline
- onboarding, dashboard, logging flows, and trends views

## Planned Product

CalTracker is designed to feel:
- fast
- motivating
- visually rewarding
- trustworthy about AI uncertainty
- clean and wellness-focused, not clinical or gimmicky

Planned core features:
- AI photo meal logging
- quick correction flow for detected foods and portions
- calorie, macro, hydration, and micronutrient tracking
- daily score and progress visuals
- meal history and trends
- manual backup logging
- supplement tracking

## Planned Stack

The current design spec targets:
- React Native with Expo
- Expo Router
- Convex for backend, database, and file storage
- Clerk for authentication
- Claude API for meal image analysis
- RevenueCat for subscriptions

## Repository Contents

- [docs/superpowers/specs/2026-03-28-caltracker-design.md](/C:/caltracker/docs/superpowers/specs/2026-03-28-caltracker-design.md) - primary product and architecture spec
- [ai_nutrition_tracker_starter_gdd.md](/C:/caltracker/ai_nutrition_tracker_starter_gdd.md) - early product framing and MVP direction
- [AGENTS.md](/C:/caltracker/AGENTS.md) - Codex repo instructions
- [CLAUDE.md](/C:/caltracker/CLAUDE.md) - Claude Code repo instructions

## Product Direction

CalTracker aims to improve on common nutrition app pain points:
- food logging takes too long
- calorie counting is repetitive
- apps over-focus on calories and macros
- AI scanners feel overconfident
- dashboards stop being motivating after the novelty fades

The intended experience is:
1. Capture a meal with a photo.
2. Review and fix the AI draft if needed.
3. Log the meal.
4. See daily progress update immediately.
5. Build consistency through clear, satisfying feedback.

## Notes

- This repo does not yet contain the production app implementation.
- The current contents are the product and design foundation for building it.
