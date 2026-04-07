# Backlog

## Recently shipped

- `Macro progress reward glow`
  Shipped as the staged Home wellness shell treatment (`warm_1`, `warm_2`, `warm_3`) across the Calories, Protein, Hydration, and Nutrition cards, with the stronger finish-line effect biased toward higher completion.

- `Remembered meal and drink shortcuts`
  Shipped as the unified Log-screen `Favorites` + `Recently added` remembered entries card, including favorite toggles and one-tap replay.

## Barcode nutrition fallback

- Add a `Scan label for missing vitamins` fallback from barcode review when the barcode catalog lacks numeric micronutrient values for nutrients that are visibly claimed on the package, especially energy drinks with B-vitamin callouts.

## Supplements tracking implementation

- Complete and ship supplements tracking as a first-class feature instead of leaving the existing backend schema support unused.
- Let users add supplements from a catalog or create a custom supplement, save them to their personal stack, and log them for the day.
- Decide whether supplements should appear as their own log type in history and daily summaries, rather than being hidden behind meal/drink flows.
- Decide how supplement nutrients affect totals and progress bars, especially for vitamins and minerals, and whether calorie-bearing supplements should also affect macro totals.
- Decide the default supplement workflow: daily stack with one-tap logging, `as needed` logging, or both.
- Decide whether the MVP needs reminders, streaks, and missed-dose UX, or whether it should focus only on add/save/log/history first.
- Decide whether supplements should have their own review/save confirmation, favorites/recents behavior, and app-wide count labels.

## Expand over-limit warning states beyond calories

- The softer calories over-target warning treatment is already shipped on the Home wellness card.
- Decide whether to extend warning/danger states to nutrients with more meaningful upper bounds, such as sodium, and where those warnings should appear.
- Keep any broader warning-state system visually distinct from the warm reward-shell treatment so overages do not read as a reward.

## Differentiate meals vs drinks in entry counts

- Fix entry-count labels so meals and drinks are distinguished instead of being lumped together under `meals`.
- Start with the history day cards, where labels like `5 meals` currently include drinks, but treat this as an app-wide terminology and counting pass.
- Decide on a consistent display format across the app, for example separate counts (`3 meals, 2 drinks`) or a neutral aggregate label (`5 entries`), and apply it everywhere the app summarizes logged intake.

## Save confirmation after reviewed meal or drink

- Show a small success pop-up or toast after the user reviews and saves a meal or drink so it is obvious the entry was added successfully.
- Apply this across all reviewed intake flows: barcode review, photo review, and describe-a-meal / AI review.
- Make the message reflect what was saved, for example `Meal added` or `Drink added`.
- Trigger the notification only after the save actually succeeds, not on tap, so the feedback stays trustworthy.

## Combined photo + description meal analysis

- Combine `Scan a meal` and `Describe a meal` into a richer AI intake flow where the user can attach a photo and optionally add a short description before analysis.
- Send the photo and the typed description to the AI together so the model has more context and can produce a better estimate than photo-only or text-only input.
- Use this combined flow for camera capture and photo-library import, not just live camera scans.
- Decide whether description should be optional with a prompt like `Add details the photo might miss`, or required before analysis.
- Keep the review screen after analysis so users can still correct meal type, portions, and individual items before saving.
