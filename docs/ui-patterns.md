# UI Patterns Reference

Preferred UI elements and patterns established in the Profile tab and Plan Settings screen. Use this as a menu for surgical improvements to other screens — pick what fits, skip what doesn't.

---

## Navigation

### Light back button

Chevron + text link in accent color. No card background, no border, no pill shape.

```tsx
<Pressable hitSlop={8} onPress={onBackPress} style={styles.backButton}>
  <Ionicons color={theme.accent1} name="chevron-back" size={18} />
  <ThemedText size="sm" variant="accent1">Back</ThemedText>
</Pressable>
```

```tsx
backButton: {
  alignItems: "center",
  alignSelf: "flex-start",
  flexDirection: "row",
  gap: 2,
  marginBottom: 18,
  paddingVertical: 6,
},
```

**Where it lives:** `ProfileDetailScaffold.tsx`

---

## Cards & Layout

### Summary card with action link

Compact read-only card showing key-value pairs in a 2-column grid. Title on the left, "Edit >" action on the right. No subtitles.

```tsx
<ProfileSummaryCard
  actionLabel="Edit"
  items={[
    { label: "Goal", value: "Lose weight" },
    { label: "Pace", value: "Moderate" },
  ]}
  onPress={handlePress}
  title="Goals & Targets"
/>
```

- Title uses `size="lg"` (18px)
- Item labels: `size="xs"` (11px), variant `tertiary`, uppercase, letter-spacing 1
- Item values: `size="sm"` (12px)
- Action link: `size="sm"`, variant `accent1`, with `>` chevron

**Where it lives:** `ProfileSummaryCard.tsx`

### Section labels between cards

Uppercase eyebrow text separating card groups. Creates visual sections without heavy dividers.

```tsx
<ThemedText size="xs" style={styles.sectionLabel} variant="tertiary">
  Your plan
</ThemedText>
```

```tsx
sectionLabel: {
  letterSpacing: 1.2,
  marginBottom: 10,
  marginTop: 8,
  paddingLeft: 4,
  textTransform: "uppercase",
},
```

**Where it lives:** `profile.tsx` (profile tab)

### Split cards for related-but-distinct groups

Don't jam everything into one card. If two groups are related but conceptually separate, give each its own card. Example: Goal + Pace in one card, Primary Challenge in another.

**Where it lives:** `ProfileForm.tsx` (Goal card vs Challenge card)

---

## Form Elements

### Section title hierarchy

Inside form cards, section titles use `size="md"` (15px) — clearly larger than field labels at `size="xs"` (11px). This was bumped up from `size="sm"` (12px) which was too close to the field labels.

```tsx
<ThemedText size="md" style={styles.sectionTitle}>
  Body & preferences
</ThemedText>
```

### Labeled pill rows

Option pill groups get a label above them. Prevents ambiguity about what the pills control.

```tsx
<View style={styles.labeledOptionGroup}>
  <ThemedText size="xs" variant="tertiary">Units</ThemedText>
  <View style={styles.optionWrap}>
    {options.map((option) => (
      <OptionPill active={selected === option.value} ... />
    ))}
  </View>
</View>
```

```tsx
labeledOptionGroup: { gap: 8 },
```

### Compact option pills (instead of tall option cards)

When options are short labels (1-2 words), use compact pills instead of full-height cards with descriptions. Saves ~200px of vertical space for 4 options.

```tsx
optionPill: {
  borderRadius: 999,
  borderWidth: 1,
  paddingHorizontal: 14,
  paddingVertical: 10,
},
```

Active state: `backgroundColor: theme.surfaceStrong`, `borderColor: theme.accent1`, text variant `accent1`.
Inactive state: `backgroundColor: theme.surfaceSoft`, `borderColor: theme.cardBorder`, text variant `secondary`.

### Input fields with unit suffixes

Wrap TextInput in a row container and add a suffix label inside the border.

```tsx
<View style={[styles.inputRow, { backgroundColor: theme.surfaceSoft, borderColor: theme.cardBorder }]}>
  <TextInput style={[styles.input, { color: theme.text }]} ... />
  {suffix ? (
    <ThemedText size="sm" style={styles.inputSuffix} variant="tertiary">
      {suffix}
    </ThemedText>
  ) : null}
</View>
```

```tsx
input: { flex: 1, minHeight: 52, paddingHorizontal: 14 },
inputRow: { alignItems: "center", borderRadius: 16, borderWidth: 1, flexDirection: "row" },
inputSuffix: { paddingRight: 14 },
```

### Body metrics layout

Don't cram 3 numeric fields into one row. Use 2 rows: solo field on top, paired fields below.

```
Row 1: [ Age          ]
Row 2: [ Height ] [ Weight ]
```

---

## Actions & Buttons

### Inline reset action

A text link next to a section header for reverting to defaults. Only visible when there's something to reset.

```tsx
<View style={styles.headerRow}>
  <ThemedText size="md" style={{ flex: 1 }}>Daily targets</ThemedText>
  {hasEdits ? (
    <Pressable hitSlop={8} onPress={handleReset}>
      <ThemedText size="sm" variant="accent1">Reset to suggested</ThemedText>
    </Pressable>
  ) : null}
</View>
```

### Sticky bottom save bar

For long scrolling forms, pin the save button to the bottom of the screen instead of burying it below the scroll. Uses a `footer` slot on the scaffold.

```tsx
<ProfileDetailScaffold
  footer={<Button label="Save changes" onPress={save} />}
  ...
>
  {/* scrollable form content */}
</ProfileDetailScaffold>
```

The form exposes submit state via `onSubmitReady` callback. The scaffold renders the footer below the ScrollView with border-top and safe-area bottom padding.

**Where it lives:** `ProfileDetailScaffold.tsx` (footer slot), `ProfileForm.tsx` (onSubmitReady), `plan-settings.tsx` (wiring)

### Text-link restore purchases

Instead of a secondary button, use a plain text link for low-priority actions like "Restore purchases".

```tsx
<Pressable hitSlop={8} onPress={restorePurchases}>
  <ThemedText size="sm" variant="tertiary">Restore purchases</ThemedText>
</Pressable>
```

---

## Identity & Status

### Initials avatar

Circular badge with user's initials. No images, no icons.

```tsx
<View style={styles.avatar}>
  <ThemedText size="md" variant="secondary">{getInitials(name)}</ThemedText>
</View>
```

```tsx
avatar: {
  alignItems: "center",
  borderRadius: 999,
  borderWidth: 1,
  height: 44,
  justifyContent: "center",
  width: 44,
},
```

### Dot-indicator rows

For toggleable items (reminders, notifications), show a colored dot + label + status text. Green dot for on, muted dot for off.

```tsx
<View style={styles.reminderRow}>
  <View style={[styles.dot, { backgroundColor: enabled ? theme.accent1 : theme.textMuted }]} />
  <ThemedText size="sm" style={{ flex: 1 }} variant={enabled ? undefined : "tertiary"}>
    {label}
  </ThemedText>
  <ThemedText size="xs" variant="secondary">{enabled ? "On" : "Off"}</ThemedText>
</View>
```

**Where it lives:** `ProfileReminderSummary.tsx`

---

## Debug / Internal

### Dashed-border testing section

Internal testing controls get a dashed border and muted colors to clearly separate them from real UI.

```tsx
testingCard: {
  borderStyle: "dashed",
  borderWidth: 1,
  borderRadius: 16,
  padding: 14,
},
testingButton: {
  borderStyle: "dashed",
  borderWidth: 1,
  borderRadius: 12,
},
```

Text and borders use `textTertiary` / `cardBorder` — never accent colors.

---

## Timeline Cards

### Accordion timeline entry (A3 style)

Left accent bar + compact collapsed state + expandable detail with progress bars. Matches the home screen accordion interaction pattern.

**Collapsed state:** Title, calories/oz, chevron, meta row (entry method · time · macros).

**Expanded state (meals):** Insight line ("This meal covered X% of your daily calories…"), macro progress bars (Calories/Protein/Carbs/Fat), nutrient source tags, Edit meal / Delete text links.

**Expanded state (hydration):** Just Edit / Delete text links.

```tsx
<View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
  <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
  <View style={styles.contentWrap}>
    <Pressable onPress={onToggle} style={styles.collapsed}>
      {/* title + cal + chevron row */}
      {/* meta row: entry method · time · macros */}
    </Pressable>
    {isExpanded && (
      <View style={[styles.expanded, { borderTopColor: theme.cardBorder }]}>
        {/* insight line, progress bars, nutrient tags, action links */}
      </View>
    )}
  </View>
</View>
```

**Accent bar colors:**
- Hydration → `theme.accent3` (blue)
- Photo scan → `theme.accent2` (gold)
- AI text → `theme.accent1` (teal)
- Default → `theme.textTertiary`

**Progress bar pattern:**
```tsx
<View style={[styles.barTrack, { backgroundColor: hexToRgba(color, 0.12) }]}>
  <View style={[styles.barFill, { backgroundColor: color, width: `${percent}%` }]} />
</View>
```

Track height: 6px. Border radius: 999. Percent clamped to 0–100.

**Accordion state:** Parent manages `expandedEntryId` — only one card open at a time. Cards receive `isExpanded` and `onToggle` props.

**Action links:** Edit uses `theme.accent1`, Delete uses destructive color (`#A85B52` light / `#B86A62` dark). Font weight 600, letter-spacing 0.3. Separated by `justifyContent: "space-between"`.

**Where it lives:** `HistoryTimelineEntryCard.tsx`, `app/history/[dateKey].tsx`

---

## Cross-Screen UI Polish

### Macro format

Compact inline format: `{protein}p / {carbs}c / {fat}f` with variant `"muted"`. No gram units, no pipe separators.

### Entry title size

Timeline entry titles use `size="md"` (15px), not `size="lg"` (18px). Keeps cards compact.

### Eyebrow titles on highlight cards

Section titles inside highlight/insight cards use uppercase + letter-spacing eyebrow style:

```tsx
<ThemedText size="xs" variant="tertiary" style={styles.highlightTitle}>
  {title}
</ThemedText>

highlightTitle: {
  letterSpacing: 1,
  marginBottom: 2,
  textTransform: "uppercase",
},
```

### Remove redundant sublabels

Don't add sublabels that repeat information already obvious from context. Example: "Logged day" sublabel under a date in the history list adds nothing — the date alone is sufficient.

---

## UI Polish Analysis Process

How to approach surgical UI improvements across screens. This is the process used to produce the cross-screen polish changes above.

### Phase 1: Screen-by-screen audit

Read the source code for every target screen and cross-reference against:
- The **established UI patterns** in this document
- The **theme token system** (`colors.ts`) to spot hardcoded values vs theme tokens
- The **component hierarchy** — check that parent scaffolds and child components aren't duplicating responsibilities

### Phase 2: Pattern mismatch detection

For each screen, look for these anti-patterns:
1. **Text size mismatches** — title/label/body text not following the xs→sm→md→lg→xl scale
2. **Missing labels** — interactive elements (pill rows, inputs) without descriptive labels
3. **Redundant UI** — sublabels, headers, or badges that add no information
4. **Button weight imbalance** — destructive actions with equal or more prominence than primary actions
5. **Inconsistent formatting** — same data shown differently across screens (e.g., macros as `P 32g | C 48g` in one place, `32p / 48c / 12f` in another)
6. **Spacing/density issues** — elements cramped or with inconsistent gaps
7. **Eyebrow/kicker patterns** — section titles that should use uppercase + tracking + tertiary color but don't

### Phase 3: Prioritize findings

Rank each finding by:
- **Impact** — how often the user sees it, how much it improves scannability
- **Effort** — 1-line style change vs. component redesign
- **Risk** — pure styling vs. data model changes

Order: small text/spacing tweaks first, then medium-effort changes, then larger redesigns last.

### Phase 4: Mockup-first approval

For each change:
1. Create an **HTML mockup** showing before/after side-by-side using the app's actual design tokens (dark theme colors, fonts, radii)
2. Serve locally for review at phone width (390px `max-width`)
3. **Only implement after explicit approval** — small self-evident changes (spacing, font bumps) can skip mockups if the user says so

### Phase 5: Design exploration (for larger changes)

When a simple fix reveals a bigger opportunity:
1. Create **multiple alternative layouts** (3–5 options) exploring different information architectures
2. After the user picks a direction, create **2–3 iterations** within that direction
3. Reuse existing app patterns (accordion, progress bars, chip tags) rather than inventing new ones

### Phase 6: Implementation + review

For each approved change:
1. Dispatch an **implementer subagent** with complete specs
2. Run **spec compliance review** — catch missing requirements, over/under-building
3. Run **code quality review** — catch edge cases, duplicated utilities, missing tests
4. Fix issues, re-review, then commit

---

## Theme Reference

These are the CSS variable names used throughout. Both dark and light values are defined in `ThemeProvider.tsx`.

| Token | Dark | Light | Usage |
|-------|------|-------|-------|
| `background` | `#1a1814` | `#ece7df` | Page background |
| `text` | `#e8e0d4` | `#2a2520` | Primary text |
| `textSecondary` | `rgba(255,255,255,0.45)` | `rgba(42,37,32,0.56)` | Secondary text |
| `textTertiary` | `rgba(255,255,255,0.28)` | `rgba(42,37,32,0.38)` | Labels, hints |
| `textMuted` | `rgba(255,255,255,0.16)` | `rgba(42,37,32,0.22)` | Disabled states |
| `card` | `rgba(255,255,255,0.035)` | `rgba(255,255,255,0.8)` | Card background |
| `cardBorder` | `rgba(255,255,255,0.08)` | `rgba(68,55,37,0.12)` | Card/input borders |
| `accent1` | `#5ebaa9` | `#3a9e8a` | Primary accent (teal) |
| `accent2` | `#c4a46c` | `#b8965a` | Secondary accent (gold) |
| `surfaceStrong` | `rgba(255,255,255,0.05)` | `rgba(255,255,255,0.88)` | Active pill bg |
| `surfaceSoft` | `rgba(255,255,255,0.025)` | `rgba(255,255,255,0.82)` | Input/inactive bg |

## Text Size Scale

| Size | px | Usage |
|------|----|-------|
| `xs` | 11 | Labels, eyebrows, uppercase tags |
| `sm` | 12 | Body text, action links, status |
| `md` | 15 | Section titles, emphasis |
| `lg` | 18 | Card titles |
| `xl` | 28 | Page/screen titles |
| `hero` | 64 | Dashboard hero numbers |
