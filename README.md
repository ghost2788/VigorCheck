# VigorCheck

VigorCheck is an Expo + Convex nutrition app focused on fast daily logging, clear progress, and richer nutrition tracking than calories alone.

The app currently supports:
- AI meal photo analysis with a review flow
- AI text meal entry
- barcode lookup and manual meal editing
- hydration logging and remembered drink entries
- supplement tracking with label photo scan + review
- Home progress across calories, protein, hydration, and micronutrients
- History day timelines and Trends

## Stack

- React Native with Expo and Expo Router
- Convex for backend, database, file storage, and actions
- Better Auth for authentication
- OpenAI for meal and supplement analysis
- RevenueCat for subscription plumbing

## Local development

1. Install dependencies:

```bash
npm install
```

2. Start Convex in one terminal:

```bash
npx convex dev
```

3. Start the Expo app in another terminal:

```bash
npm run start:dev
```

`start:dev` installs `expo-dev-client` into local `node_modules` without saving it to
`package.json` or `package-lock.json`, then starts Expo in dev-client mode through an
Expo tunnel on port `8081`. Use the tunnel QR/direct link for Android development builds.
Do not use LAN QR as the default workflow, because Windows firewall, VPN adapters, and
router isolation can make the phone unable to reach Metro even when Metro is running.
Store-bound builds intentionally use the committed dependency set, which excludes
dev-client native modules.

If Expo prompts to install its tunnel helper, accept the prompt once. If port `8081` is
already in use, close the old Metro terminal and rerun `npm run start:dev`.

Useful commands:

```bash
npm test
npx tsc --noEmit
npx convex dev --once
npm run release:android-native-audit
```

## Project highlights

- [app](./app) contains the Expo Router screens
- [components](./components) contains shared UI pieces
- [convex](./convex) contains backend queries, mutations, actions, and schema
- [lib/domain](./lib/domain) contains shared presentation and aggregation logic
- [__tests__](./__tests__) contains app, domain, and component coverage

## Notes

- Internal diagnostics on Profile are dev-only.
- Supplement setup is scan-first: front label required, supplement facts optional, review before save.
- The Home lower feed now shows `Today’s entries`, which includes meals, drinks, and supplements, while hydration stays in its own card.
