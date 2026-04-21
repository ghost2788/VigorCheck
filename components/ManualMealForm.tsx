import React, { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { MEAL_TYPE_OPTIONS, MealType } from "../lib/domain/meals";
import { useTheme } from "../lib/theme/ThemeProvider";
import { Button } from "./Button";
import { Card } from "./Card";
import { ThemedText } from "./ThemedText";

export type ManualMealFormSubmission = {
  calories: number;
  carbs: number;
  fat: number;
  mealType: MealType;
  name?: string;
  protein: number;
};

type ManualMealFormProps = {
  fixedMealType?: MealType;
  initialValues?: Partial<ManualMealFormSubmission>;
  isSubmitting?: boolean;
  mealTypeMode?: "fixed" | "select";
  onSubmit: (values: ManualMealFormSubmission) => Promise<void> | void;
  resetOnSubmit?: boolean;
  sectionTitle?: string | null;
  surface?: "card" | "embedded";
  submitButtonTestId?: string;
  submitLabel?: string;
};

function parseMacroValue(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function MealTypePill({
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
        styles.typePill,
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
  label,
  onChangeText,
  testID,
  value,
}: {
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
        keyboardType="numeric"
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

export function ManualMealForm({
  fixedMealType = "breakfast",
  initialValues,
  isSubmitting = false,
  mealTypeMode = "select",
  onSubmit,
  resetOnSubmit = true,
  sectionTitle = "Quick add",
  surface = "card",
  submitButtonTestId,
  submitLabel = "Log meal",
}: ManualMealFormProps) {
  const { theme } = useTheme();
  const [mealType, setMealType] = useState<ManualMealFormSubmission["mealType"]>(
    initialValues?.mealType ?? fixedMealType
  );
  const [name, setName] = useState(initialValues?.name ?? "");
  const [calories, setCalories] = useState(
    initialValues?.calories !== undefined ? String(initialValues.calories) : ""
  );
  const [protein, setProtein] = useState(
    initialValues?.protein !== undefined ? String(initialValues.protein) : ""
  );
  const [carbs, setCarbs] = useState(
    initialValues?.carbs !== undefined ? String(initialValues.carbs) : ""
  );
  const [fat, setFat] = useState(initialValues?.fat !== undefined ? String(initialValues.fat) : "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const parsedCalories = parseMacroValue(calories);
    const parsedProtein = parseMacroValue(protein);
    const parsedCarbs = parseMacroValue(carbs);
    const parsedFat = parseMacroValue(fat);

    if (
      parsedCalories === null ||
      parsedCalories <= 0 ||
      parsedProtein === null ||
      parsedCarbs === null ||
      parsedFat === null
    ) {
      setError("Calories, protein, carbs, and fat all need valid numbers.");
      return;
    }

    setError(null);
    setSaving(true);

    try {
      await onSubmit({
        calories: parsedCalories,
        carbs: parsedCarbs,
        fat: parsedFat,
        mealType: mealTypeMode === "fixed" ? fixedMealType : mealType,
        name: name.trim() || undefined,
        protein: parsedProtein,
      });
      if (resetOnSubmit) {
        setName("");
        setCalories("");
        setProtein("");
        setCarbs("");
        setFat("");
        setMealType(fixedMealType);
      }
    } finally {
      setSaving(false);
    }
  };

  const content = (
    <View testID={surface === "embedded" ? "manual-meal-form-embedded" : undefined}>
      {sectionTitle ? (
        <ThemedText size="md" style={styles.sectionTitle}>
          {sectionTitle}
        </ThemedText>
      ) : null}
      {mealTypeMode === "select" ? (
        <View style={styles.typeRow}>
          {MEAL_TYPE_OPTIONS.map((option) => (
            <MealTypePill
              active={mealType === option.value}
              key={option.value}
              label={option.label}
              onPress={() => setMealType(option.value)}
            />
          ))}
        </View>
      ) : null}

      <View style={styles.nameField}>
        <ThemedText variant="tertiary" size="xs" style={styles.fieldLabel}>
          Meal label (optional)
        </ThemedText>
        <TextInput
          onChangeText={setName}
          placeholder="Chicken bowl"
          placeholderTextColor={theme.textMuted}
          style={[
            styles.input,
            {
              backgroundColor: theme.surfaceSoft,
              borderColor: theme.cardBorder,
              color: theme.text,
            },
          ]}
          testID="mealNameInput"
          value={name}
        />
      </View>

      <View style={styles.row}>
        <Field label="Calories" onChangeText={setCalories} testID="mealCaloriesInput" value={calories} />
        <Field label="Protein (g)" onChangeText={setProtein} testID="mealProteinInput" value={protein} />
      </View>
      <View style={styles.row}>
        <Field label="Carbs (g)" onChangeText={setCarbs} testID="mealCarbsInput" value={carbs} />
        <Field label="Fat (g)" onChangeText={setFat} testID="mealFatInput" value={fat} />
      </View>

      {error ? (
        <ThemedText variant="accent2" size="sm" style={styles.error}>
          {error}
        </ThemedText>
      ) : null}

      <Button
        label={saving || isSubmitting ? "Saving..." : submitLabel}
        onPress={submit}
        testID={submitButtonTestId}
      />
    </View>
  );

  if (surface === "embedded") {
    return content;
  }

  return <Card testID="manual-meal-form-card">{content}</Card>;
}

const styles = StyleSheet.create({
  error: {
    marginBottom: 14,
    textTransform: "none",
  },
  field: {
    flex: 1,
  },
  fieldLabel: {
    marginBottom: 8,
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
  nameField: {
    marginBottom: 14,
  },
  row: {
    columnGap: 12,
    flexDirection: "row",
    marginBottom: 14,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  typePill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  typeRow: {
    columnGap: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
    rowGap: 8,
  },
});
