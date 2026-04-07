# Plan Settings Screen UI Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Polish the plan settings screen from a long form dump into a tighter, better-organized editor with clear visual hierarchy, sticky save, and smarter use of vertical space.

**Architecture:** All changes are UI-only inside `ProfileForm.tsx` and `ProfileDetailScaffold.tsx`. No backend changes. The form's internal header is removed (scaffold provides it), challenge options shrink to pills, section titles get bumped, fields get unit suffixes, and the save button moves to a sticky bottom bar. Tests are updated to match new structure.

**Tech Stack:** React Native, TypeScript, Expo Router

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `components/ProfileForm.tsx` | **Modify** | Remove internal header, split cards, convert ChallengeOption to pills, add labels/suffixes, add reset action, section title bump |
| `components/ProfileDetailScaffold.tsx` | **Modify** | Lighten back button, add sticky bottom bar slot |
| `app/profile/plan-settings.tsx` | **Modify** | Remove duplicate title/subtitle props from ProfileForm, pass save button into sticky slot |
| `__tests__/components/ProfileForm.test.tsx` | **Modify** | Update for removed header, structural changes |
| `__tests__/app/ProfilePlanSettingsScreen.test.tsx` | **Modify** | Update for structural changes if needed |

---

### Task 1: Remove ProfileForm internal header

The scaffold already provides "Plan settings" title + subtitle. The form's own kicker/title/subtitle is redundant — 5 lines of preamble before the first interactive element.

**Files:**
- Modify: `components/ProfileForm.tsx:36-45,464-476,683-756`
- Modify: `__tests__/components/ProfileForm.test.tsx`

- [ ] **Step 1: Remove header props and rendering from ProfileForm**

In `components/ProfileForm.tsx`, remove the `subtitle` and `title` props from the type and destructuring, and remove the header View from the JSX.

Remove from `ProfileFormProps` type (lines 36-45):
```typescript
// REMOVE these two props:
//   subtitle: string;
//   title: string;
```

New type:
```typescript
type ProfileFormProps = {
  initialValues?: Partial<PlanSettings>;
  isSubmitting?: boolean;
  onDirtyChange?: (dirty: boolean) => void;
  onSubmit: (values: PlanSettings) => Promise<void> | void;
  style?: StyleProp<ViewStyle>;
  submitLabel: string;
};
```

Remove from destructuring (lines 225-234):
```typescript
export function ProfileForm({
  initialValues,
  isSubmitting = false,
  onDirtyChange,
  onSubmit,
  style,
  submitLabel,
}: ProfileFormProps) {
```

Remove the entire header View from JSX (lines 466-476):
```typescript
// DELETE this block:
//   <View style={styles.header}>
//     <ThemedText size="xs" style={styles.kicker} variant="tertiary">
//       Plan settings
//     </ThemedText>
//     <ThemedText size="xl" style={styles.title}>
//       {title}
//     </ThemedText>
//     <ThemedText style={styles.subtitle} variant="secondary">
//       {subtitle}
//     </ThemedText>
//   </View>
```

Remove unused styles: `header`, `kicker`, `title`, `subtitle` from the StyleSheet.

- [ ] **Step 2: Update ProfileForm test**

In `__tests__/components/ProfileForm.test.tsx`, remove the `subtitle` and `title` props from both render calls:

```typescript
// Test 1:
const { getByText } = render(
  <ProfileForm
    onSubmit={onSubmit}
    submitLabel="Save profile"
  />
);

// Test 2:
const { getByTestId, getByText } = render(
  <ProfileForm
    onSubmit={onSubmit}
    submitLabel="Save profile"
  />
);
```

- [ ] **Step 3: Update plan-settings.tsx**

In `app/profile/plan-settings.tsx`, remove the `subtitle` and `title` props from the `<ProfileForm>` call (lines 84-85):

```typescript
<ProfileForm
  initialValues={initialValues}
  onDirtyChange={setIsDirty}
  onSubmit={async (values) => {
    const patch = diffPlanSettings(initialValues, values);

    if (Object.keys(patch).length > 0) {
      await updateCurrentPlanSettings(patch);
    }

    setIsDirty(false);
    router.back();
  }}
  submitLabel="Save changes"
/>
```

- [ ] **Step 4: Run type check and tests**

Run: `npx tsc --noEmit && npm test`
Expected: PASS — zero type errors, all tests pass

- [ ] **Step 5: Commit**

```bash
git add components/ProfileForm.tsx app/profile/plan-settings.tsx __tests__/components/ProfileForm.test.tsx
git commit -m "refactor(plan-settings): remove redundant internal header from ProfileForm"
```

---

### Task 2: Lighten the back button in ProfileDetailScaffold

Replace the heavy pill-shaped back button (card background + border + padding) with a lighter chevron + text link style.

**Files:**
- Modify: `components/ProfileDetailScaffold.tsx`

- [ ] **Step 1: Replace the back button rendering and styles**

In `components/ProfileDetailScaffold.tsx`, replace the back button Pressable and its styles:

Current back button (lines 29-42):
```typescript
<Pressable
  accessibilityRole="button"
  onPress={onBackPress}
  style={[
    styles.backButton,
    {
      backgroundColor: theme.card,
      borderColor: theme.cardBorder,
    },
  ]}
>
  <Ionicons color={theme.text} name="chevron-back" size={18} />
  <ThemedText size="sm">Back</ThemedText>
</Pressable>
```

New back button:
```typescript
<Pressable
  accessibilityRole="button"
  hitSlop={8}
  onPress={onBackPress}
  style={styles.backButton}
>
  <Ionicons color={theme.accent1} name="chevron-back" size={18} />
  <ThemedText size="sm" variant="accent1">Back</ThemedText>
</Pressable>
```

Update the `backButton` style:
```typescript
backButton: {
  alignItems: "center",
  alignSelf: "flex-start",
  flexDirection: "row",
  gap: 2,
  marginBottom: 18,
  paddingVertical: 6,
},
```

Changes: removed card background/border/borderRadius/borderWidth/paddingHorizontal, tightened gap from 4→2, added hitSlop for tap target, colored chevron and text with accent1.

- [ ] **Step 2: Run type check and tests**

Run: `npx tsc --noEmit && npm test`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add components/ProfileDetailScaffold.tsx
git commit -m "refactor(scaffold): lighten back button to text link style"
```

---

### Task 3: Convert ChallengeOption to pills and split Goal card

The 4 tall ChallengeOption cards with descriptions take ~300px of vertical space. Convert them to compact OptionPill pills (same as Goal). Split the first Card into two: a "Goal" card and a separate "Challenge" card.

**Files:**
- Modify: `components/ProfileForm.tsx`

- [ ] **Step 1: Remove ChallengeOption component and split the first Card**

In `components/ProfileForm.tsx`:

**Delete the entire `ChallengeOption` component** (lines 151-184).

**Delete the `challengeDescription`, `challengeList`, and `challengeOption` styles** from the StyleSheet.

**Replace the first Card section** (currently lines 478-525 in the JSX). The current single Card contains Goal + Goal pace + Primary challenge. Split into two Cards:

```typescript
<Card style={styles.section}>
  <ThemedText size="md" style={styles.sectionTitle}>
    Goal
  </ThemedText>
  <View style={styles.optionWrap}>
    {GOAL_OPTIONS.map((option) => (
      <OptionPill
        active={goalType === option.value}
        key={option.value}
        label={option.label}
        onPress={() => setGoalType(option.value)}
      />
    ))}
  </View>

  {requiresGoalPace(goalType) ? (
    <>
      <ThemedText size="md" style={styles.sectionTitle}>
        Goal pace
      </ThemedText>
      <View style={styles.optionWrap}>
        {GOAL_PACE_OPTIONS.map((option) => (
          <OptionPill
            active={goalPace === option.value}
            key={option.value}
            label={option.label}
            onPress={() => setGoalPace(option.value)}
          />
        ))}
      </View>
    </>
  ) : null}
</Card>

<Card style={styles.section}>
  <ThemedText size="md" style={styles.sectionTitle}>
    Primary challenge
  </ThemedText>
  <View style={styles.optionWrap}>
    {PRIMARY_TRACKING_CHALLENGE_OPTIONS.map((option) => (
      <OptionPill
        active={primaryTrackingChallenge === option.value}
        key={option.value}
        label={option.label}
        onPress={() => setPrimaryTrackingChallenge(option.value)}
      />
    ))}
  </View>
</Card>
```

Note: section titles are now `size="md"` — this is part of the hierarchy bump (Task 4 will catch the remaining ones, but do them all here since we're already touching every section title).

- [ ] **Step 2: Bump ALL remaining section titles to `size="md"`**

While the file is open, change every `size="sm"` on section titles to `size="md"`:

- "Body & preferences" title → `size="md"`
- "Activity" title → `size="md"`
- "Daily targets" title in the targetsHeader → `size="md"`

There are 3 remaining `<ThemedText size="sm" style={styles.sectionTitle}>` instances in the Body card and targets card. Change all to `size="md"`.

Also change the "Daily targets" text inside `targetsHeader` from `size="sm"` to `size="md"`.

- [ ] **Step 3: Run type check and tests**

Run: `npx tsc --noEmit && npm test`
Expected: PASS — tests find buttons by label text ("Consistency", "Motivation") which are unchanged. The ChallengeOption descriptions are gone but tests never referenced them.

- [ ] **Step 4: Commit**

```bash
git add components/ProfileForm.tsx
git commit -m "refactor(plan-settings): convert challenge to pills, split goal card, bump section titles to md"
```

---

### Task 4: Add labels to Unit System and Sex pill rows

Currently the Unit System and Sex pill rows sit next to each other with no labels. Add "Units" and "Sex" labels.

**Files:**
- Modify: `components/ProfileForm.tsx`

- [ ] **Step 1: Add labels above the Unit System and Sex option rows**

In `components/ProfileForm.tsx`, find the Body & Preferences card section. Currently it has:

```typescript
<Card style={styles.section}>
  <ThemedText size="md" style={styles.sectionTitle}>
    Body & preferences
  </ThemedText>

  <View style={styles.optionWrap}>
    {UNIT_SYSTEM_OPTIONS.map(...)}
  </View>

  <View style={styles.optionWrap}>
    {SEX_OPTIONS.map(...)}
  </View>
  ...
```

Add labels before each pill row:

```typescript
<Card style={styles.section}>
  <ThemedText size="md" style={styles.sectionTitle}>
    Body & preferences
  </ThemedText>

  <View style={styles.labeledOptionGroup}>
    <ThemedText size="xs" variant="tertiary">Units</ThemedText>
    <View style={styles.optionWrap}>
      {UNIT_SYSTEM_OPTIONS.map((option) => (
        <OptionPill
          active={preferredUnitSystem === option.value}
          key={option.value}
          label={option.label}
          onPress={() => switchUnits(option.value)}
        />
      ))}
    </View>
  </View>

  <View style={styles.labeledOptionGroup}>
    <ThemedText size="xs" variant="tertiary">Sex</ThemedText>
    <View style={styles.optionWrap}>
      {SEX_OPTIONS.map((option) => (
        <OptionPill
          active={sex === option.value}
          key={option.value}
          label={option.label}
          onPress={() => setSex(option.value)}
        />
      ))}
    </View>
  </View>
  ...
```

Add the new style:

```typescript
labeledOptionGroup: {
  gap: 8,
},
```

- [ ] **Step 2: Run type check and tests**

Run: `npx tsc --noEmit && npm test`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add components/ProfileForm.tsx
git commit -m "feat(plan-settings): add Units and Sex labels above pill rows"
```

---

### Task 5: Improve body metrics layout — 2-row instead of 3-in-1

Three numeric fields (Age, Height, Weight) in one row is cramped on small phones. Split into two rows: Age alone, then Height + Weight together.

**Files:**
- Modify: `components/ProfileForm.tsx`

- [ ] **Step 1: Split the body metrics row**

Find the current single row (the `<View style={styles.row}>` containing Age, Height, Weight fields). Replace it with two rows:

```typescript
<View style={styles.row}>
  <Field keyboardType="numeric" label="Age" onChangeText={setAge} testID="ageInput" value={age} />
</View>
<View style={styles.row}>
  <Field
    keyboardType="numeric"
    label={preferredUnitSystem === "metric" ? "Height (cm)" : "Height (in)"}
    onChangeText={setHeight}
    testID="heightInput"
    value={height}
  />
  <Field
    keyboardType="numeric"
    label={preferredUnitSystem === "metric" ? "Weight (kg)" : "Weight (lb)"}
    onChangeText={setWeight}
    testID="weightInput"
    value={weight}
  />
</View>
```

Age gets a full-width row. Height and Weight share the second row (each gets ~50% width via `flex: 1` on the Field style).

- [ ] **Step 2: Run type check and tests**

Run: `npx tsc --noEmit && npm test`
Expected: PASS — tests reference fields by testID, not by layout position

- [ ] **Step 3: Commit**

```bash
git add components/ProfileForm.tsx
git commit -m "feat(plan-settings): split body metrics into two rows for better readability"
```

---

### Task 6: Add unit suffixes to target fields

The Calories, Protein, Carbs, Fat fields show bare numbers. Add "kcal" suffix to Calories and "g" suffix to the others.

**Files:**
- Modify: `components/ProfileForm.tsx`

- [ ] **Step 1: Add a suffix prop to the Field component**

Update the `Field` component to accept an optional `suffix` prop and render it inline with the input:

```typescript
function Field({
  keyboardType = "default",
  label,
  onChangeText,
  suffix,
  testID,
  value,
}: {
  keyboardType?: "default" | "numeric";
  label: string;
  onChangeText: (value: string) => void;
  suffix?: string;
  testID: string;
  value: string;
}) {
  const { theme } = useTheme();

  return (
    <View style={styles.field}>
      <ThemedText size="xs" style={styles.fieldLabel} variant="tertiary">
        {label}
      </ThemedText>
      <View style={[styles.inputRow, { backgroundColor: theme.surfaceSoft, borderColor: theme.cardBorder }]}>
        <TextInput
          keyboardType={keyboardType}
          onChangeText={onChangeText}
          placeholderTextColor={theme.textMuted}
          style={[styles.input, { color: theme.text }]}
          testID={testID}
          value={value}
        />
        {suffix ? (
          <ThemedText size="sm" style={styles.inputSuffix} variant="tertiary">
            {suffix}
          </ThemedText>
        ) : null}
      </View>
    </View>
  );
}
```

Update the styles — the border/background moves from `input` to the new `inputRow` wrapper, and `input` becomes a flex child:

```typescript
input: {
  flex: 1,
  minHeight: 52,
  paddingHorizontal: 14,
},
inputRow: {
  alignItems: "center",
  borderRadius: 16,
  borderWidth: 1,
  flexDirection: "row",
},
inputSuffix: {
  paddingRight: 14,
},
```

- [ ] **Step 2: Add suffix props to target Field calls**

In the Daily targets section, add suffixes to each target field:

```typescript
<View style={styles.row}>
  <Field
    keyboardType="numeric"
    label="Calories"
    onChangeText={(value) =>
      updateManualTargets({
        calories: Number(value || 0),
        carbs: Number(targetCarbs || 0),
        fat: Number(targetFat || 0),
        protein: Number(targetProtein || 0),
      })
    }
    suffix="kcal"
    testID="targetCaloriesInput"
    value={targetCalories}
  />
  <Field
    keyboardType="numeric"
    label="Protein"
    onChangeText={(value) =>
      updateManualTargets({
        calories: Number(targetCalories || 0),
        carbs: Number(targetCarbs || 0),
        fat: Number(targetFat || 0),
        protein: Number(value || 0),
      })
    }
    suffix="g"
    testID="targetProteinInput"
    value={targetProtein}
  />
</View>
<View style={styles.row}>
  <Field
    keyboardType="numeric"
    label="Carbs"
    onChangeText={(value) =>
      updateManualTargets({
        calories: Number(targetCalories || 0),
        carbs: Number(value || 0),
        fat: Number(targetFat || 0),
        protein: Number(targetProtein || 0),
      })
    }
    suffix="g"
    testID="targetCarbsInput"
    value={targetCarbs}
  />
  <Field
    keyboardType="numeric"
    label="Fat"
    onChangeText={(value) =>
      updateManualTargets({
        calories: Number(targetCalories || 0),
        carbs: Number(targetCarbs || 0),
        fat: Number(value || 0),
        protein: Number(targetProtein || 0),
      })
    }
    suffix="g"
    testID="targetFatInput"
    value={targetFat}
  />
</View>
```

- [ ] **Step 3: Run type check and tests**

Run: `npx tsc --noEmit && npm test`
Expected: PASS — tests reference inputs by testID and check `.props.value`, not surrounding structure

- [ ] **Step 4: Commit**

```bash
git add components/ProfileForm.tsx
git commit -m "feat(plan-settings): add kcal/g unit suffixes to target input fields"
```

---

### Task 7: Add "Reset to suggested" action for target overrides

When users have manually edited targets, there's no way to revert to computed values. Add a "Reset to suggested" pressable link next to the "Daily targets" header.

**Files:**
- Modify: `components/ProfileForm.tsx`

- [ ] **Step 1: Add the reset action to the targets header**

Find the `targetsHeader` View in the Daily targets Card. Replace it:

Current:
```typescript
<View style={styles.targetsHeader}>
  <ThemedText size="md">Daily targets</ThemedText>
  <ThemedText size="xs" variant="tertiary">
    {hasManualTargetEdits
      ? "Manual edits stay until they match the suggestion again"
      : "Targets follow your plan until you edit them"}
  </ThemedText>
</View>
```

New:
```typescript
<View style={styles.targetsHeader}>
  <View style={styles.targetsHeaderRow}>
    <ThemedText size="md" style={styles.targetsHeaderTitle}>Daily targets</ThemedText>
    {hasManualTargetEdits && computedTargets ? (
      <Pressable
        hitSlop={8}
        onPress={() => {
          setTargetCalories(computedTargets.calories.toString());
          setTargetProtein(computedTargets.protein.toString());
          setTargetCarbs(computedTargets.carbs.toString());
          setTargetFat(computedTargets.fat.toString());
          setHasManualTargetEdits(false);
        }}
      >
        <ThemedText size="sm" variant="accent1">Reset to suggested</ThemedText>
      </Pressable>
    ) : null}
  </View>
  <ThemedText size="xs" variant="tertiary">
    {hasManualTargetEdits
      ? "Manual edits stay until they match the suggestion again"
      : "Targets follow your plan until you edit them"}
  </ThemedText>
</View>
```

Add new styles:
```typescript
targetsHeaderRow: {
  alignItems: "center",
  flexDirection: "row",
},
targetsHeaderTitle: {
  flex: 1,
},
```

- [ ] **Step 2: Run type check and tests**

Run: `npx tsc --noEmit && npm test`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add components/ProfileForm.tsx
git commit -m "feat(plan-settings): add Reset to suggested action for manual target overrides"
```

---

### Task 8: Move submit button to sticky bottom bar

The save button is at the very bottom of a 1200+ pixel scroll. Move it to a sticky bottom bar so it's always reachable.

**Files:**
- Modify: `components/ProfileDetailScaffold.tsx`
- Modify: `components/ProfileForm.tsx`
- Modify: `app/profile/plan-settings.tsx`

- [ ] **Step 1: Add a `footer` slot to ProfileDetailScaffold**

Update `ProfileDetailScaffold` to accept an optional `footer` prop rendered as a sticky bottom bar outside the ScrollView:

```typescript
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ProfileDetailScaffoldProps = {
  children: React.ReactNode;
  footer?: React.ReactNode;
  onBackPress: () => void;
  subtitle: string;
  title: string;
};

export function ProfileDetailScaffold({
  children,
  footer,
  onBackPress,
  subtitle,
  title,
}: ProfileDetailScaffoldProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        style={styles.container}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            hitSlop={8}
            onPress={onBackPress}
            style={styles.backButton}
          >
            <Ionicons color={theme.accent1} name="chevron-back" size={18} />
            <ThemedText size="sm" variant="accent1">Back</ThemedText>
          </Pressable>

          <View style={styles.copy}>
            <ThemedText size="xl">{title}</ThemedText>
            <ThemedText variant="secondary" style={styles.subtitle}>
              {subtitle}
            </ThemedText>
          </View>
        </View>

        {children}
      </ScrollView>

      {footer ? (
        <View
          style={[
            styles.footer,
            {
              backgroundColor: theme.background,
              borderTopColor: theme.cardBorder,
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          {footer}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 2,
    marginBottom: 18,
    paddingVertical: 6,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 36,
    paddingHorizontal: 20,
    paddingTop: 28,
  },
  copy: {
    marginBottom: 20,
  },
  footer: {
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  header: {
    marginBottom: 6,
  },
  root: {
    flex: 1,
  },
  subtitle: {
    lineHeight: 22,
    marginTop: 8,
  },
});
```

Key changes:
- Outer `View` with `flex: 1` wraps ScrollView + footer
- `backgroundColor` moves from ScrollView `style` to the outer `root` View
- Footer sits below ScrollView with border-top, uses `useSafeAreaInsets` for bottom padding
- Back button already lightened (from Task 2)

Note: The imports need to be updated — add `View` to the react-native import and `useSafeAreaInsets` from `react-native-safe-area-context`.

- [ ] **Step 2: Extract the submit button from ProfileForm**

In `components/ProfileForm.tsx`, remove the `<Button>` from the bottom of the form's JSX (lines 674-678). Also remove `submitLabel` and `isSubmitting` from the props since the parent will now render the save button.

Instead, expose the form's save/submit state via a new `onSaveRef` callback pattern. But this would be complex. A simpler approach: keep the submit button inside ProfileForm but add a `stickySubmit` boolean prop that, when true, renders the button as the last element in a way the parent can detect.

Actually, the simplest approach: **move the submit button to the plan-settings screen** and pass it as the `footer` prop to the scaffold. The form needs to expose a submit trigger.

The cleanest approach for minimal changes: **Add a `renderSubmit` render prop** to ProfileForm that receives the button props, so the parent can place it anywhere:

Update ProfileForm props:
```typescript
type ProfileFormProps = {
  initialValues?: Partial<PlanSettings>;
  isSubmitting?: boolean;
  onDirtyChange?: (dirty: boolean) => void;
  onSubmit: (values: PlanSettings) => Promise<void> | void;
  renderSubmit?: (props: { disabled: boolean; label: string; onPress: () => void }) => React.ReactNode;
  style?: StyleProp<ViewStyle>;
  submitLabel: string;
};
```

At the bottom of the form, change the button rendering:

```typescript
{error ? (
  <ThemedText size="sm" style={styles.error} variant="accent2">
    {error}
  </ThemedText>
) : null}

{renderSubmit ? null : (
  <Button
    disabled={saving || isSubmitting}
    label={saving || isSubmitting ? "Saving..." : submitLabel}
    onPress={() => void submit()}
  />
)}
```

And expose the submit props for the parent to use:

Actually, this is getting complex. Let's keep it simple — just use a React ref to expose a `submit` function:

**Simplest approach: use `React.useImperativeHandle` + `forwardRef`:**

This is the cleanest path. But forwardRef adds complexity to the component and tests.

**Even simpler: keep the button in ProfileForm, but when `stickySubmit` is true, don't render it inline — let the parent read a submit callback.**

Let me take the **actually simplest** approach: keep the submit `<Button>` at the bottom of the form as a fallback, but add an `onSubmitReady` callback prop that passes the submit function and disabled/label state to the parent. The parent can then render its own button in the footer.

Update ProfileForm:

```typescript
type ProfileFormProps = {
  initialValues?: Partial<PlanSettings>;
  isSubmitting?: boolean;
  onDirtyChange?: (dirty: boolean) => void;
  onSubmit: (values: PlanSettings) => Promise<void> | void;
  onSubmitReady?: (submitProps: { disabled: boolean; label: string; onPress: () => void }) => void;
  style?: StyleProp<ViewStyle>;
  submitLabel: string;
};
```

Add a useEffect that calls `onSubmitReady` whenever the save state changes:

```typescript
const submitProps = useMemo(
  () => ({
    disabled: saving || isSubmitting,
    label: saving || isSubmitting ? "Saving..." : submitLabel,
    onPress: () => void submit(),
  }),
  [saving, isSubmitting, submitLabel]
);

useEffect(() => {
  onSubmitReady?.(submitProps);
}, [onSubmitReady, submitProps]);
```

And conditionally hide the inline button:

```typescript
{onSubmitReady ? null : (
  <Button
    disabled={submitProps.disabled}
    label={submitProps.label}
    onPress={submitProps.onPress}
  />
)}
```

In `app/profile/plan-settings.tsx`, use the callback to render the button in the scaffold footer:

```typescript
const [submitProps, setSubmitProps] = React.useState<{
  disabled: boolean;
  label: string;
  onPress: () => void;
} | null>(null);

// ...

return (
  <ProfileDetailScaffold
    footer={
      submitProps ? (
        <Button
          disabled={submitProps.disabled}
          label={submitProps.label}
          onPress={submitProps.onPress}
        />
      ) : null
    }
    onBackPress={() => router.back()}
    subtitle="Update your goal, preferences, body metrics, and macro targets without leaving the app."
    title="Plan settings"
  >
    <ProfileForm
      initialValues={initialValues}
      onDirtyChange={setIsDirty}
      onSubmit={async (values) => {
        const patch = diffPlanSettings(initialValues, values);

        if (Object.keys(patch).length > 0) {
          await updateCurrentPlanSettings(patch);
        }

        setIsDirty(false);
        router.back();
      }}
      onSubmitReady={setSubmitProps}
      submitLabel="Save changes"
    />
  </ProfileDetailScaffold>
);
```

Add `Button` to the imports in `plan-settings.tsx`:
```typescript
import { Button } from "../../components/Button";
```

- [ ] **Step 3: Run type check and tests**

Run: `npx tsc --noEmit && npm test`
Expected: PASS — the ProfileForm test renders without `onSubmitReady`, so the inline button still renders as fallback. The plan settings screen test finds the "Save changes" button which is now in the footer.

- [ ] **Step 4: Commit**

```bash
git add components/ProfileDetailScaffold.tsx components/ProfileForm.tsx app/profile/plan-settings.tsx
git commit -m "feat(plan-settings): add sticky bottom save bar via scaffold footer slot"
```

---

### Task 9: Final verification

**Files:** None (verification only)

- [ ] **Step 1: Run full type check**

Run: `npx tsc --noEmit`
Expected: PASS with zero errors

- [ ] **Step 2: Run full test suite**

Run: `npm test`
Expected: PASS with zero failures

- [ ] **Step 3: Visual spot check**

Launch the app and navigate to Profile → Edit (Goals & Targets). Verify:
1. No redundant header — scaffold title is the only heading
2. Back button is a light text link, not a pill
3. Goal and Goal pace are in their own card
4. Primary challenge is in a separate card with pill-style options (no descriptions)
5. Section titles are visibly larger than field labels
6. Units and Sex pill rows have labels above them
7. Age is on its own row; Height and Weight share a row
8. Target fields show "kcal" and "g" suffixes
9. "Reset to suggested" appears when targets have been manually edited
10. Save button is sticky at the bottom of the screen
11. Scrolling content does not overlap the save bar
12. Save button works and navigates back
13. Discard changes alert still fires on back with unsaved changes

Also verify Profile → Edit (Reminders) still works — the scaffold change should be backward compatible since `footer` is optional.

- [ ] **Step 4: Commit any fixes from visual check**

```bash
git add -A
git commit -m "fix(plan-settings): visual polish from plan settings spot check"
```
