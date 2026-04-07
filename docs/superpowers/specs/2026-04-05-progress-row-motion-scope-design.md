# Progress Row Motion Scope Refinement

## Summary

Refine the shared progress-row motion rollout so it only appears on the highest-signal summary surfaces.

This narrows the earlier shared-row rollout:
- keep `Finisher Suite` reward treatment on the four main Home accordions
- keep `Advisory Rail` warning treatment on `Calories` only
- remove the new reward/advisory treatment from meal timeline accordion rows on Home and History
- keep Trends nutrition rows reward-only, but static

The goal is to preserve polish without making meal cards or nutrient-heavy screens feel noisy.

## Product Decisions

### Home main accordions
- `Calories`: reward styling plus calorie-only advisory rail
- `Protein`: reward styling only
- `Hydration`: reward styling only
- `Nutrition`: reward styling only

### Meal timeline cards
- Home `Today's meals` timeline: no new reward/advisory treatment
- History day-detail meal cards: no new reward/advisory treatment
- Keep the existing thin progress rows there, but without the new motion/status styling

### Trends nutrition card
- Allow completed nutrient rows to use the finished visual treatment
- Do not use moving sheen on Trends
- Do not add advisory rail to Trends in this pass

## Rationale

### Why Home accordions get the full treatment
These are summary surfaces. They are where the app answers "how am I doing today?" A little motion and finish styling helps the status read faster and feels intentional.

### Why meal timeline cards lose the effect
Those cards are already dense:
- label
- source/time metadata
- insight copy
- edit/delete actions
- row stack

Adding reward or warning motion there makes the screen feel busy fast, especially when multiple meals are expanded.

### Why Trends stays static
The Trends nutrition card can show many rows at once. If every completed nutrient row has moving sheen, the whole screen starts shimmering. Static finish styling keeps the sense of accomplishment without turning the card into a live surface.

## Surface Rules

### Reward treatment
- Full animated reward treatment:
  - Home `Calories`
  - Home `Protein`
  - Home `Hydration`
  - Home `Nutrition`
- Static reward treatment only:
  - Trends nutrition rows
- No reward treatment:
  - Home meal timeline rows
  - History meal timeline rows

### Advisory treatment
- Advisory rail applies only to `Calories`
- No advisory rail for:
  - `Protein`
  - `Hydration`
  - `Nutrition`
  - Trends nutrient rows
  - Home/History meal timeline rows

## Motion Policy

### Home accordions
- reward rows use the slow horizontal sheen
- calorie advisory uses the soft breathing caution field
- continue to respect the existing reduced-motion preference

### Trends
- no looping motion
- finished rows keep the static `Finisher Suite` styling only

### Timeline cards
- no looping motion
- no reward pill / sheen
- no advisory rail / pulse

## Implementation Notes

This likely means the shared row renderer still owns the visual system, but the caller must be able to opt a surface into one of three scopes:
- `full_motion`
- `static_reward_only`
- `plain`

Recommended mapping:
- Home accordions:
  - `Calories` -> `full_motion` with advisory enabled
  - `Protein` / `Hydration` / `Nutrition` -> `full_motion` without advisory
- Trends nutrition card:
  - `static_reward_only`
- Home and History timeline cards:
  - `plain`

The point is to keep one renderer and one state system, but let each surface choose how much of it to reveal.

## Out of Scope

- expanding advisory behavior beyond calories
- adding warning rails to Trends
- adding the reward sheen back into meal cards
- redesigning the base row layout
- changing ring animations or other chart motion

## Success Criteria

- Home main accordions feel more premium and readable
- Calories alone can communicate over-target caution
- Meal timeline cards stay calm and legible
- Trends nutrition card gets a tasteful finished-state upgrade without motion clutter
