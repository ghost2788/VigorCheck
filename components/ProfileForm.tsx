import React, { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  TextInput,
  View,
  ViewStyle,
} from "react-native";
import {
  ACTIVITY_OPTIONS,
  ActivityLevel,
  computeBaseTargets,
  GOAL_OPTIONS,
  GoalType,
  ProfileFormSubmission,
  SEX_OPTIONS,
  Sex,
} from "../lib/domain/targets";
import { useTheme } from "../lib/theme/ThemeProvider";
import { Button } from "./Button";
import { Card } from "./Card";
import { ThemedText } from "./ThemedText";

type ProfileFormProps = {
  autoPopulateTargets?: boolean;
  initialValues?: Partial<ProfileFormSubmission>;
  isSubmitting?: boolean;
  onSubmit: (values: ProfileFormSubmission) => Promise<void> | void;
  style?: StyleProp<ViewStyle>;
  submitLabel: string;
  subtitle: string;
  title: string;
};

function OptionPill<T extends string>({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  const { theme } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.optionPill,
        {
          backgroundColor: active ? theme.surfaceStrong : theme.surfaceSoft,
          borderColor: active ? theme.accent1 : theme.cardBorder,
        },
      ]}
    >
      <ThemedText variant={active ? "accent1" : "secondary"} size="sm">
        {label}
      </ThemedText>
    </Pressable>
  );
}

function Field({
  keyboardType = "default",
  label,
  onChangeText,
  testID,
  value,
}: {
  keyboardType?: "default" | "numeric";
  label: string;
  onChangeText: (value: string) => void;
  testID: string;
  value: string;
}) {
  const { theme } = useTheme();

  return (
    <View style={styles.field}>
      <ThemedText variant="tertiary" size="xs" style={styles.fieldLabel}>
        {label}
      </ThemedText>
      <TextInput
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholderTextColor={theme.textMuted}
        style={[
          styles.input,
          {
            backgroundColor: theme.surfaceSoft,
            borderColor: theme.cardBorder,
            color: theme.text,
          },
        ]}
        testID={testID}
        value={value}
      />
    </View>
  );
}

function parsePositiveNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function parseTargetNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export function ProfileForm({
  autoPopulateTargets,
  initialValues,
  isSubmitting = false,
  onSubmit,
  style,
  submitLabel,
  subtitle,
  title,
}: ProfileFormProps) {
  const shouldAutoPopulateTargets = autoPopulateTargets ?? !initialValues;
  const [goalType, setGoalType] = useState<GoalType>(initialValues?.goalType ?? "general_health");
  const [sex, setSex] = useState<Sex>(initialValues?.sex ?? "male");
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(
    initialValues?.activityLevel ?? "moderate"
  );
  const [age, setAge] = useState(initialValues?.age?.toString() ?? "");
  const [height, setHeight] = useState(initialValues?.height?.toString() ?? "");
  const [weight, setWeight] = useState(initialValues?.weight?.toString() ?? "");
  const [targetCalories, setTargetCalories] = useState(
    initialValues?.targets?.calories?.toString() ?? ""
  );
  const [targetProtein, setTargetProtein] = useState(
    initialValues?.targets?.protein?.toString() ?? ""
  );
  const [targetCarbs, setTargetCarbs] = useState(initialValues?.targets?.carbs?.toString() ?? "");
  const [targetFat, setTargetFat] = useState(initialValues?.targets?.fat?.toString() ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const computedTargets = useMemo(() => {
    const parsedAge = parsePositiveNumber(age);
    const parsedHeight = parsePositiveNumber(height);
    const parsedWeight = parsePositiveNumber(weight);

    if (!parsedAge || !parsedHeight || !parsedWeight) {
      return null;
    }

    return computeBaseTargets({
      activityLevel,
      age: parsedAge,
      goalType,
      height: parsedHeight,
      sex,
      weight: parsedWeight,
    });
  }, [activityLevel, age, goalType, height, sex, weight]);

  useEffect(() => {
    if (!shouldAutoPopulateTargets || !computedTargets) {
      return;
    }

    setTargetCalories(computedTargets.calories.toString());
    setTargetProtein(computedTargets.protein.toString());
    setTargetCarbs(computedTargets.carbs.toString());
    setTargetFat(computedTargets.fat.toString());
  }, [computedTargets, shouldAutoPopulateTargets]);

  const submit = async () => {
    const parsedAge = parsePositiveNumber(age);
    const parsedHeight = parsePositiveNumber(height);
    const parsedWeight = parsePositiveNumber(weight);
    const parsedTargetCalories = parseTargetNumber(targetCalories);
    const parsedTargetProtein = parseTargetNumber(targetProtein);
    const parsedTargetCarbs = parseTargetNumber(targetCarbs);
    const parsedTargetFat = parseTargetNumber(targetFat);

    if (
      !parsedAge ||
      !parsedHeight ||
      !parsedWeight ||
      parsedTargetCalories === null ||
      parsedTargetProtein === null ||
      parsedTargetCarbs === null ||
      parsedTargetFat === null
    ) {
      setError("Enter valid age, height, and weight values to continue.");
      return;
    }

    setError(null);
    setSaving(true);

    try {
      await onSubmit({
        activityLevel,
        age: parsedAge,
        goalType,
        height: parsedHeight,
        sex,
        targets: {
          calories: parsedTargetCalories,
          carbs: parsedTargetCarbs,
          fat: parsedTargetFat,
          protein: parsedTargetProtein,
        },
        weight: parsedWeight,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.content, style]} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <ThemedText variant="tertiary" size="xs" style={styles.kicker}>
          Profile setup
        </ThemedText>
        <ThemedText size="xl" style={styles.title}>
          {title}
        </ThemedText>
        <ThemedText variant="secondary" style={styles.subtitle}>
          {subtitle}
        </ThemedText>
      </View>

      <Card style={styles.section}>
        <ThemedText size="sm" style={styles.sectionTitle}>
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

        <ThemedText size="sm" style={styles.sectionTitle}>
          Basics
        </ThemedText>
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
        <View style={styles.row}>
          <Field keyboardType="numeric" label="Age" onChangeText={setAge} testID="ageInput" value={age} />
          <Field
            keyboardType="numeric"
            label="Height (in)"
            onChangeText={setHeight}
            testID="heightInput"
            value={height}
          />
          <Field
            keyboardType="numeric"
            label="Weight (lb)"
            onChangeText={setWeight}
            testID="weightInput"
            value={weight}
          />
        </View>

        <ThemedText size="sm" style={styles.sectionTitle}>
          Activity
        </ThemedText>
        <View style={styles.optionWrap}>
          {ACTIVITY_OPTIONS.map((option) => (
            <OptionPill
              active={activityLevel === option.value}
              key={option.value}
              label={option.label}
              onPress={() => setActivityLevel(option.value)}
            />
          ))}
        </View>
      </Card>

      <Card style={styles.section}>
        <View style={styles.targetsHeader}>
          <ThemedText size="sm">Daily targets</ThemedText>
          {computedTargets ? (
            <ThemedText variant="tertiary" size="xs">
              Auto-filled from your basics
            </ThemedText>
          ) : (
            <ThemedText variant="tertiary" size="xs">
              Fill the basics above to generate defaults
            </ThemedText>
          )}
        </View>
        <View style={styles.row}>
          <Field
            keyboardType="numeric"
            label="Calories"
            onChangeText={setTargetCalories}
            testID="targetCaloriesInput"
            value={targetCalories}
          />
          <Field
            keyboardType="numeric"
            label="Protein (g)"
            onChangeText={setTargetProtein}
            testID="targetProteinInput"
            value={targetProtein}
          />
        </View>
        <View style={styles.row}>
          <Field
            keyboardType="numeric"
            label="Carbs (g)"
            onChangeText={setTargetCarbs}
            testID="targetCarbsInput"
            value={targetCarbs}
          />
          <Field
            keyboardType="numeric"
            label="Fat (g)"
            onChangeText={setTargetFat}
            testID="targetFatInput"
            value={targetFat}
          />
        </View>
      </Card>

      {error ? (
        <ThemedText variant="accent2" size="sm" style={styles.error}>
          {error}
        </ThemedText>
      ) : null}

      <Button label={saving || isSubmitting ? "Saving..." : submitLabel} onPress={submit} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 36,
    paddingHorizontal: 20,
    paddingTop: 28,
  },
  error: {
    marginBottom: 16,
    textAlign: "center",
    textTransform: "none",
  },
  field: {
    flex: 1,
    minWidth: 0,
  },
  fieldLabel: {
    marginBottom: 8,
  },
  header: {
    alignItems: "center",
    marginBottom: 22,
  },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    fontSize: 15,
    fontWeight: "500",
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  kicker: {
    marginBottom: 10,
  },
  optionPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  optionWrap: {
    columnGap: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 8,
  },
  row: {
    columnGap: 12,
    flexDirection: "row",
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 12,
    marginTop: 4,
  },
  subtitle: {
    lineHeight: 22,
    textAlign: "center",
  },
  targetsHeader: {
    marginBottom: 14,
  },
  title: {
    marginBottom: 10,
    textAlign: "center",
  },
});
