# 2026-04-06 Full App UI Audit

## Status

- Route inventory is complete for every user-facing route under `app/`.
- This pass is source-first and preview-first: every route was audited against `docs/ui-patterns.md`, `lib/theme/colors.ts`, and the already-polished Profile, Plan Settings, and History-detail surfaces.
- Runtime-only verification is still needed for camera, subscription-expiry, and live supplement scan states. Expo web did not produce a usable local runtime in this session and the local gstack browse binary is not present, so the manifest below labels those states explicitly instead of pretending they were browser-captured.

## Coverage

- Discovered routes: 34
- Route/state manifest: `docs/superpowers/audits/2026-04-06-full-app-ui-route-manifest.csv`
- Explicitly tracked `session-bound transient` states:
  - Log scan queue states
  - Log text queue states
  - `/scan/review` active draft review
- Explicitly tracked `synthetic-only` states:
  - `_layout` missing-auth-config
  - Home `Finish setup` fallback
  - Deprecated redirect wrappers under onboarding
  - Query `undefined` loading branches and redirect-only wrappers where they are the only renderable surface

## Findings

### F-01 [P1] Barcode overlay is not theme-safe

- Evidence: `app/scan/barcode.tsx:75` and `app/scan/barcode.tsx:123`
- Problem: the scan frame border and footer overlay card use hard-coded white and dark RGBA values instead of token-derived surfaces. The screen is tuned only for dark camera presentation and will drift if the palette changes or if light mode is reviewed seriously.
- Why it violates the repo pattern: `lib/theme/colors.ts` defines all surface and accent treatment centrally. The current barcode screen bypasses that system while the rest of the app uses tokenized cards and text.
- Recommendation: derive the frame veil and footer card from theme tokens, keep the active corners on `accent2`, and preserve contrast without baking in raw black.
- Approval mockup: `mockups/barcode-overlay-theme-safe.html`

### F-02 [P1] Paywall footer collapses too many actions into one weight class

- Evidence: `app/paywall.tsx:125-166`
- Problem: `Restore purchases`, `Manage subscription`, and `Sign out` all sit in the same inline row directly above the primary CTA. The screen also lacks a clear light-weight escape control in the header.
- Why it violates the repo pattern: `docs/ui-patterns.md` calls for text-link secondary actions and clear action hierarchy. The current footer makes low-priority account actions compete with the purchase CTA.
- Recommendation: add a light back control, keep the monthly CTA dominant, demote restore and manage into tertiary text links, and separate `Sign out` from billing actions.
- Approval mockup: `mockups/paywall-footer-actions.html`

### F-03 [P2] Onboarding back navigation is weaker than the established light back button

- Evidence: `components/onboarding/OnboardingScreen.tsx:112-119` and `components/onboarding/OnboardingScreen.tsx:205-209`
- Problem: onboarding steps render a plain secondary `Back` text control with no chevron and no `hitSlop`.
- Why it violates the repo pattern: `docs/ui-patterns.md` defines the shared light back button as chevron plus accent text with a slightly larger hit target. Profile-detail and plan-settings already use that system.
- Recommendation: swap onboarding to the shared light back pattern so the route family feels like part of the same product instead of its own mini-design system.
- Approval mockup: `mockups/onboarding-back-button.html`

### F-04 [P2] History edit screens still use pre-scaffold header and section hierarchy

- Evidence:
  - `app/history/hydration/[logId].tsx:127-141`
  - `app/history/meals/[mealId].tsx:229-239`
  - `components/DateTimeFieldsCard.tsx:25-28`
- Problem: both edit routes use plain text `Back`, loose page titles, and `size="sm"` card headings that sit too close to their field-label scale.
- Why it violates the repo pattern: the repo now prefers the light back link, eyebrow sectioning, and `size="md"` form-card headings so forms read as deliberate detail scaffolds instead of stacked cards.
- Recommendation: move these routes onto the same header language as `ProfileDetailScaffold`, add an eyebrow, and promote card section titles from `sm` to `md`.
- Approval mockup: `mockups/history-edit-scaffold.html`

### F-05 [P2] Welcome HUD hero is visually locked to a fixed gold instead of the active palette

- Evidence:
  - `components/auth/WelcomeHudHero.tsx:223-239`
  - `components/auth/WelcomeHudHero.tsx:258-299`
  - `components/auth/WelcomeHudHero.tsx:311-313`
- Problem: the rails, glow, and brackets are hard-coded to `#F0A14D` and matching gold RGBA values.
- Why it violates the repo pattern: the theme already exposes `accent2` and related surfaces, but the flagship auth/paywall hero ignores them. Any palette tuning now requires manual edits inside the component.
- Recommendation: derive the hero frame and glow from `accent2` plus token-derived alpha layers so the opener and paywall stay aligned with the theme system.
- Approval mockup: `mockups/welcome-hero-token-lock.html`

### F-06 [P3] Supplements still reads like an older utility screen

- Evidence:
  - `app/supplements.tsx:680-688`
  - `app/supplements.tsx:706-729`
  - `app/supplements.tsx:771-778`
- Problem: the top header uses a plain right-aligned `Back` text link and the manage, capture, and editor card titles are still `size="sm"`, which flattens the screen hierarchy.
- Why it violates the repo pattern: the route does a lot of work and needs the same scaffold clarity already used on Profile-detail and History-detail flows.
- Recommendation: move supplements to the shared light back control and stronger section hierarchy after the higher-value paywall and history edits are approved.
- Approval mockup: report only in this pass

## Cross-App Patterns To Batch

- Plain text `Back` links remain on multiple older routes and should be normalized to the light back button pattern.
- `size="sm"` form-card titles are still used on several edit-oriented surfaces where `size="md"` is now the preferred hierarchy.
- Hard-coded color values still leak into auth and scan-adjacent surfaces instead of flowing through the token system.

## Approval Mockups

- `mockups/barcode-overlay-theme-safe.html`
- `mockups/paywall-footer-actions.html`
- `mockups/onboarding-back-button.html`
- `mockups/history-edit-scaffold.html`
- `mockups/welcome-hero-token-lock.html`

## Suggested Implementation Batches After Approval

1. Navigation and scaffold consistency
   - F-03 onboarding back control
   - F-04 history edit scaffold
   - F-06 supplements header cleanup
2. Token hygiene
   - F-01 barcode overlay
   - F-05 welcome HUD hero
3. Purchase flow hierarchy
   - F-02 paywall footer and header action cleanup

## Verification Used In This Pass

- Route and component source review across `app/`, `components/`, and `lib/theme/`
- Existing Jest coverage run:

```bash
npx jest __tests__/app __tests__/onboarding __tests__/components/AnalysisQueueList.test.tsx __tests__/components/AiTextMealCard.test.tsx --runInBand
```

- Mockups served locally through the existing `mockups/` preview server on port `3999`
