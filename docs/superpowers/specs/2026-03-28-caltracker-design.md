# CalTracker — Design Spec

AI-powered nutrition tracking app. Snap a photo, get instant nutrition estimates, track daily health progress through motivating visuals.

## 1. Stack & Architecture

**Approach:** Monorepo — Expo handles the app, Convex handles all backend concerns.

| Layer | Technology |
|-------|-----------|
| Mobile app | React Native + Expo (managed workflow) |
| Navigation | Expo Router |
| Backend | Convex (database, server functions, file storage, auth) |
| Auth | Clerk (via Convex integration) — email + Apple/Google SSO |
| AI Vision | Claude API (Sonnet for new scans, Haiku for saved/frequent meals) |
| Nutrition data | USDA FoodData Central (~5,000 curated common foods) + AI fallback |
| Animations | React Native Reanimated |
| Notifications | Expo Notifications (local push) |
| Charts | Victory Native (Trends tab) |
| Barcode data | Open Food Facts API |
| Payments | RevenueCat (wraps Apple/Google native subscriptions) |

**Project structure:**

```
caltracker/
  app/              ← Expo Router screens
  convex/           ← schema, functions, AI integration
  components/       ← shared UI components
  lib/              ← utilities, USDA lookup, types
  assets/           ← images, fonts, animations
```

**Key architectural decisions:**
- AI calls happen in Convex server actions so the API key never touches the client.
- USDA data is pre-imported into a Convex table (~5,000 common foods). AI handles everything not in the curated set.
- Convex reactive queries power the dashboard — it updates instantly when meals are logged, no manual refresh.
- Meal photos stored in Convex file storage.

## 2. Data Model

### users
- Basic info: age, weight, height, activity level, sex
- Goal type: general_health | fat_loss | muscle_gain | energy_balance
- Computed daily targets: calories, protein, carbs, fat, fiber, sodium, sugar, hydration (cups)
- User-overridden targets (nullable — if set, override computed values)
- Subscription status: trial | active | expired
- Trial start date
- Notification preferences (per-type toggles)
- Wake/sleep time (for adaptive reminders)

### meals
- User ID, timestamp
- Meal type: breakfast | lunch | dinner | snack
- Photo storage ID (Convex file storage)
- AI confidence level: high | medium | low
- Total calories, protein, carbs, fat, fiber, sodium, sugar
- Total micronutrients (aggregated from items)

### mealItems
- Meal ID reference
- Food name
- USDA food ID (if matched, nullable)
- Portion size + unit
- Prep method (grilled, fried, baked, steamed, raw, etc.)
- Calories, protein, carbs, fat, fiber, sodium, sugar
- Micronutrients: vitamin A, vitamin C, vitamin D, vitamin E, vitamin K, B6, B12, folate, thiamin, niacin, riboflavin, calcium, iron, potassium, magnesium, zinc, phosphorus
- Confidence level: high | medium | low
- Source: usda | ai_estimated

### hydrationLogs
- User ID, timestamp
- Amount in oz

### dailySummaries
- User ID, date
- Total calories, protein, carbs, fat, fiber, sodium, sugar
- Total micronutrients (all 17)
- Total hydration (oz)
- Supplement contributions (separate totals for food vs supplements)
- Goals met (boolean per goal)
- Day score (0-100)
- Meals logged count

### savedMeals
- User ID, name
- Meal items snapshot (embedded array of mealItem data)
- Last used timestamp

### supplements
- Curated database table (~200 common supplements)
- Name, brand (optional), category
- Nutrient profile per serving (which vitamins/minerals it contains and how much)

### userSupplements
- User ID, supplement ID reference
- Frequency: daily | as_needed
- Custom name (for user-created supplements)
- Custom nutrient profile (for user-created supplements)

### supplementLogs
- User ID, supplement ID reference, timestamp
- Confirms supplement was taken that day

### usdaFoods
- Curated table of ~5,000 common foods
- USDA FDC ID, food name, category
- Full nutrient profile per 100g (calories, macros, all micronutrients)

## 3. Authentication & Onboarding

**Auth:** Clerk integration with Convex. Email + Apple/Google SSO.

**Onboarding — 4 screens, linear flow:**

1. **Welcome** — value prop: "Track nutrition with just a photo." Single CTA: Get Started.
2. **Goal selection** — pick one: General Health / Fat Loss / Muscle Gain / Energy & Balance.
3. **Profile basics** — age, weight, height, activity level (sedentary/light/moderate/active), sex. Single form, all required.
4. **Review targets** — shows computed daily targets (calories, protein, carbs, fat, fiber, hydration). All editable. Message: "These are estimates — adjust to fit you." CTA: Start Tracking.

**Target computation:** Mifflin-St Jeor equation for TDEE, with goal-based modifiers:
- Fat loss: TDEE - 500 cal
- Muscle gain: TDEE + 300 cal
- General health / energy balance: TDEE as-is
- Macro ratios derived from goal (e.g., fat loss = higher protein ratio)

**No paywall during onboarding.** Trial starts silently on account creation. User experiences full app for 7 days before seeing any payment screen.

## 4. AI Meal Scanning Pipeline

### Flow

1. **Capture** — user takes photo or picks from gallery via Expo Image Picker. Image uploaded to Convex file storage.

2. **Analyze** — Convex action sends image to Claude Sonnet API with structured prompt requesting:
   - List of detected food items
   - Estimated portion size + unit per item
   - Preparation method per item
   - Confidence level per item (high/medium/low)
   - Overall meal confidence
   - Response as typed JSON

3. **USDA Lookup** — for each detected item, query the curated usdaFoods table. If match found, use USDA nutrition values scaled to AI's portion estimate. If no match, use AI's direct nutrition estimates and flag as "ai_estimated."

4. **Draft result** — return meal draft to client. Display as card-per-item editor.

5. **User confirms** — user adjusts as needed, taps "Log Meal." Convex mutation writes meal + mealItems, recomputes dailySummary. Dashboard updates reactively.

### Cost optimization
- Saved/frequent meals: skip Claude call, reuse stored mealItems.
- Simple single-item scans (banana, glass of water): use Claude Haiku instead of Sonnet.
- Estimated cost: ~$0.02/scan, ~$0.08/day per active user at 4 meals/day.

## 5. Correction Flow — Card Per Item

After AI returns results, each detected food displays as an expandable card:

**Collapsed state:** food name + emoji + portion + calories. Tap to expand.

**Expanded state:**
- Food name (editable)
- Portion slider (adjustable, with common unit options)
- Prep method chips (grilled, fried, baked, steamed, raw, etc.)
- Full macro breakdown (protein, carbs, fat)
- Confidence badge (high/medium/low)
- Source badge ("USDA verified" or "AI estimated")
- Remove button

**Additional actions:**
- "Add missing item" button at the bottom
- Total meal calories/macros at the top, updating live as items are adjusted
- "Log Meal" confirmation button

## 6. Daily Dashboard

### Layout (top to bottom)

**Above the fold:**

1. **Greeting + streak** — "Good afternoon, Tyler" + streak counter (subtle, links to Trends)

2. **Day Score triple ring** — concentric rings:
   - Outer: Calories (green)
   - Middle: Nutrients (purple)
   - Inner: Hydration (blue)
   - Center: score 0-100 + "Day Score" label
   - Legend below: colored dots with labels

3. **Calorie summary** — "1,420 / 2,100 cal" with percentage

4. **Macro arc gauges** — three half-circle gauges side by side:
   - Protein (purple), Carbs (amber), Fat (pink)
   - Each shows percentage in center, grams below
   - Gradient fill with glow effect

5. **Nutrient/hydration pills** — compact row: water (cups), fiber (g), sodium (mg), each with percentage

6. **Scan Meal CTA** — gradient button anchored at bottom of visible area

**Below the fold (scroll):**

7. **Micronutrient panel** — grouped status list (see Section 8)
8. **Supplement status** — daily supplements with "Taken" toggles
9. **Today's meals timeline** — meal thumbnails with calorie totals
10. **Add water quick button**

### Day Score Calculation

Weighted composite (0-100):
- Calories: 40% — proximity to target (penalizes over AND under)
- Macros: 30% — average of protein/carbs/fat proximity to targets
- Micronutrients: 20% — average of all tracked nutrient proximities to RDA
- Hydration: 10% — proximity to daily cup target

Each component scores 0-100. Overshooting calories or sodium reduces score. The composite rounds to a whole number.

### Reactivity

Dashboard reads from dailySummaries via Convex reactive query. When a meal is logged, a Convex mutation recomputes the summary. Dashboard animates the update in real-time.

## 7. Game-Inspired Visual Design

### Design philosophy
Borrow visual techniques from games (HUD elements, stat bars, completion rewards) while maintaining a clean wellness brand. No RPG terminology, fantasy art, or cartoonish aesthetics.

### Visual references
- Monument Valley — clean, geometric, satisfying
- Alto's Odyssey — minimal, atmospheric, wellness feel
- Apple Fitness rings — radial HUD concept
- Genshin Impact stat screens — clean stat layouts

### Macro arc gauges
Half-circle arc gauges for protein, carbs, fat. Gradient fill with glow effect (drop-shadow). Percentage displayed in center, gram count below. Each macro has a distinct color. When a macro goal is reached, arc transitions to green.

### Completion animations (React Native Reanimated)
**Particle burst:** When a goal is reached (macro, hydration, nutrient), the arc/indicator:
1. Fills to 100% with spring animation (slight overshoot and settle)
2. Color transitions from macro color to success green
3. Small particle lines burst outward from the gauge (6-8 particles, fade out over 500ms)
4. Checkmark badge fades in below: "Protein goal reached"

Triggered once per goal per day — not on every dashboard visit.

### Progress animations
- Day Score ring: smooth animated fill from old value to new on meal log (spring physics, ~800ms)
- Arc gauges: same spring fill animation
- Micronutrient bars: slide fill on update
- Card reveal: when AI scan results return, item cards slide in sequentially (staggered 100ms)

### Streak display
Subtle — small counter on Home greeting line. Detailed streak view lives in Trends tab only. Warm glow on the counter when active, neutral when broken. No punitive messaging.

## 8. Micronutrient Panel — Grouped Status List

Displays all 17 tracked micronutrients in a single-column list, grouped by status:

**Header:** "Vitamins & Minerals" + summary badges ("2 low", "3 mid", "5 good")

**Groups (in order):**
1. **Needs Attention** (red) — nutrients below 40% of RDA
2. **Getting There** (amber) — nutrients between 40-75% of RDA
3. **On Track** (green) — nutrients above 75% of RDA

Each row: status dot + nutrient name + mini progress bar + percentage.

Sorted within groups by percentage (lowest first in Needs Attention, highest first in On Track).

**Show top 6 by default**, expandable to show all 17 via "Show all nutrients" toggle.

**RDA personalization:** targets based on user's age and sex from profile, using standard RDA values.

**Split display:** each nutrient shows food contribution vs supplement contribution when user has supplements logged.

### Tracked micronutrients (17 total)
Vitamin A, Vitamin C, Vitamin D, Vitamin E, Vitamin K, B6, B12, Folate, Thiamin, Niacin, Riboflavin, Calcium, Iron, Potassium, Magnesium, Zinc, Phosphorus

## 9. Supplement Tracking

### Add Supplement flow
1. Tap "Add Supplement" in micronutrient panel or Log tab
2. Search curated database (~200 common supplements)
3. Select supplement — view its nutrient profile
4. Set frequency: daily or as-needed
5. Supplement added to user's daily list

### Daily supplement logging
- Daily supplements appear in a "Supplements" section on the dashboard
- Each shows a "Taken" toggle button
- Tapping "Taken" logs the supplement for today and adds its nutrients to dailySummary
- Nutrients contributed by supplements are tracked separately so the micronutrient panel can show "from food" vs "from supplements"

### Custom supplements
If not in the curated database, user can create a custom supplement:
- Enter name
- Enter nutrient values per serving (form with fields for each tracked nutrient)
- Saved to userSupplements for reuse

## 10. Navigation

**Four tabs:**

| Tab | Purpose |
|-----|---------|
| Home | Dashboard: Day Score, macros, nutrients, supplements, scan CTA |
| Log | Meal timeline, scan, add water, add supplement, manual entry, saved meals, barcode scan |
| Trends | Weekly/monthly charts, nutrient consistency, streaks, weekly summary |
| Profile | Goals, targets, personal info, dietary preferences, subscription, notification settings |

**Floating action button:** Scan Meal button appears on Home and Log tabs for quick access.

## 11. Hydration Tracking

**Manual logging:** "Add Water" button with preset amounts (8oz, 12oz, 16oz, custom). Tap counter — fast and simple.

**Adaptive reminders:**
- No fixed schedule
- App tracks pace: if user is falling behind their daily goal relative to time of day, send a gentle nudge
- If user is ahead of pace, skip reminders entirely
- Nudge tone: "You're at 3 of 8 cups — good time for a glass"
- Quick action on notification: "Log water" button adds a cup without opening the app

**Display:** water progress shown in dashboard nutrient pills and in the Day Score hydration ring.

## 12. Notifications & Reminders

**Types:**
- Hydration: adaptive nudges when falling behind pace (see Section 11)
- Meal logging: gentle prompts if lunch not logged by early afternoon, dinner not logged by evening. Off by default, opt-in.
- Goal completion: "Protein goal reached — nice work." Ties to particle burst animation on next app open.
- End of day summary: if all goals met, single celebratory notification.

**Constraints:**
- Max 3-4 notifications per day total
- No guilt messaging ("You missed logging yesterday" — never)
- Every notification type has an independent toggle in Profile > Notification Settings
- User can fully disable any category they find annoying

**Implementation:** Expo Notifications (local push). No server-side push for MVP.

## 13. Paywall & Subscription

### Pricing
- 7-day free trial (full access, starts on account creation)
- $6.99/month
- $44.99/year ($3.75/month — 46% savings)
- Pricing shown upfront and transparently

### Trial experience
- Days 1-4: no interruption, full access
- Day 5: subtle in-app banner: "2 days left — you've logged X meals and tracked Y nutrients"
- Day 7 expiry: paywall screen on next app open

### Paywall screen
- Shows what they'll lose: AI scanning, full nutrient insights, daily progress
- Both pricing tiers displayed clearly, annual highlighted as best value
- "Restore purchase" link
- Clearly visible close/dismiss button — no dark patterns

### Post-trial free tier
- View past data and trends (read-only)
- Manual food logging (search/barcode)
- AI photo scanning: locked
- Micronutrient panel: locked
- Supplements: locked
- Purpose: keep app installed, give reason to return and convert

### Implementation
RevenueCat wrapping Apple/Google native subscription systems. Deep link from Profile settings to manage subscription.

## 14. Trends Tab

### Weekly/monthly views
- Calorie average over time (line chart)
- Macro averages over time (stacked or individual lines)
- Nutrient consistency heatmap: which nutrients user is consistently low on across the week/month

### Streaks (live here, not on Home)
- Consecutive days logged
- Consecutive days meeting calorie target
- Consecutive days meeting protein target
- Consecutive days meeting hydration goal
- Weekly consistency score

### Weekly summary card
Plain-language summary: "This week you averaged 1,950 cal/day, consistently low on potassium and vitamin D. Protein was on track 5 of 7 days."

## 15. Manual & Backup Logging

AI photo scanning is the hero feature, but manual options are essential:

- **Search food database** — search the curated USDA table + AI-powered search for items not in the database
- **Barcode scan** — scan packaged food barcodes (Open Food Facts API for barcode lookup)
- **Recent foods** — quick re-log from recent mealItems
- **Saved meals** — user-created favorites for frequent meals
- **Manual entry** — type food name, portion, and let AI estimate nutrition, or enter values manually

## 16. Non-Goals for MVP

- Medical diagnostics or health advice
- Strict meal planning or recipe generation
- Supplement recommendations (user adds their own)
- Coaching chatbot
- Social features or sharing
- Wearable integration
- Voice logging
- Restaurant-specific meal estimation
- Multi-angle photo analysis
- Offline mode (requires API for AI scanning)
