# RevenueCat and Google Play Setup

This project is already wired for Android subscriptions in code. Use these exact values when you
configure Google Play and RevenueCat.

## Current app identifiers

- App name: `VigorCheck`
- Android package: `com.vigorcheck.app`
- Dev RevenueCat webhook URL:
  `https://resilient-sparrow-160.convex.site/webhooks/revenuecat`

## Google Play Console

Create one auto-renewing monthly subscription:

- Product ID: `vigorcheck_monthly`
- Display name: `VigorCheck Monthly`
- Billing period: monthly

Recommended first rollout:

1. Create the subscription in `Monetize > Products > Subscriptions`.
2. Add one base plan and activate it.
3. Test through an internal or closed testing track before any wider rollout.

## RevenueCat

Create one Android app and one simple offering model:

- Package name: `com.vigorcheck.app`
- Entitlement ID: `pro`
- Offering ID: `default`
- Package: monthly package mapped to `vigorcheck_monthly`

Recommended order:

1. Create the RevenueCat project.
2. Add the Android app with package `com.vigorcheck.app`.
3. Connect Google Play in RevenueCat.
4. Create entitlement `pro`.
5. Create offering `default`.
6. Add the monthly package and map it to Play product `vigorcheck_monthly`.
7. Mark `default` as the current offering.

## App environment variables

Public app env:

- `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY`

Backend env:

- `REVENUECAT_WEBHOOK_AUTH_TOKEN`

The app reads the public Android SDK key from `lib/billing/revenueCat.ts`.
The Convex webhook authorization check lives in `convex/http.ts`.

## RevenueCat webhook

Point RevenueCat's webhook to:

- Dev:
  `https://resilient-sparrow-160.convex.site/webhooks/revenuecat`

Use the same secret value in RevenueCat's authorization header and the Convex env var:

- `REVENUECAT_WEBHOOK_AUTH_TOKEN`

Enable sandbox events for testing.

## Legal and store links

GitHub Pages should publish the `docs/` folder. Use the published URLs for:

- Privacy Policy
- Terms of Service
- Support

The legal content is maintained under:

- `docs/index.html`
- `docs/privacy/index.html`
- `docs/terms/index.html`
- `docs/support/index.html`

## GitHub Pages publishing

Publish these pages from the repository itself:

1. Open the GitHub repository settings.
2. Open `Pages`.
3. Set `Build and deployment` to `Deploy from a branch`.
4. Choose your main branch and the `/docs` folder.
5. Save and wait for the Pages deployment to finish.

If this repository stays at `ghost2788/Caltracker`, the Pages site will typically publish at:

- `https://ghost2788.github.io/Caltracker/`

That gives you these public links:

- Privacy: `https://ghost2788.github.io/Caltracker/privacy/`
- Terms: `https://ghost2788.github.io/Caltracker/terms/`
- Support: `https://ghost2788.github.io/Caltracker/support/`

## Play Console data safety reminder

Before submission, complete the Play Console data safety form to cover at least:

- Google sign-in account data
- nutrition and meal history data
- meal photos and scan inputs
- subscription and purchase state
- app diagnostics, if you add or disclose them
