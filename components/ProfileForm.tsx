import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Pressable,
  StyleProp,
  StyleSheet,
  TextInput,
  View,
  ViewStyle,
} from "react-native";
import { Card } from "./Card";
import { Button } from "./Button";
import { ThemedText } from "./ThemedText";
import {
  ACTIVITY_OPTIONS,
  ActivityLevel,
  centimetersToInches,
  computeBaseTargets,
  EditableMacroTargets,
  GOAL_OPTIONS,
  GOAL_PACE_OPTIONS,
  GoalPace,
  GoalType,
  inchesToCentimeters,
  kilogramsToPounds,
  poundsToKilograms,
  PRIMARY_TRACKING_CHALLENGE_OPTIONS,
  PreferredUnitSystem,
  PrimaryTrackingChallenge,
  requiresGoalPace,
  SEX_OPTIONS,
  Sex,
  UNIT_SYSTEM_OPTIONS,
} from "../lib/domain/targets";
import { PlanSettings } from "../lib/domain/profileSettings";
import { useTheme } from "../lib/theme/ThemeProvider";

type ProfileFormProps = {
  initialValues?: Partial<PlanSettings>;
  isSubmitting?: boolean;
  onDirtyChange?: (dirty: boolean) => void;
  onSubmit: (values: PlanSettings) => Promise<void> | void;
  onSubmitReady?: (submitProps: { disabled: boolean; label: string; onPress: () => void }) => void;
  style?: StyleProp<ViewStyle>;
  submitLabel: string;
};

function formatMetricHeight(heightInches?: number) {
  if (!heightInches) {
    return "";
  }

  return String(Math.round(inchesToCentimeters(heightInches)));
}

function formatWeightForUnit(weightPounds?: number, unitSystem?: PreferredUnitSystem) {
  if (!weightPounds) {
    return "";
  }

  if (unitSystem === "metric") {
    return String(Math.round(poundsToKilograms(weightPounds)));
  }

  return String(Math.round(weightPounds));
}

function parsePositiveNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function parseTargetNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function splitHeightInches(totalInches?: number) {
  if (!totalInches) {
    return { feet: "", inches: "" };
  }

  const rounded = Math.round(totalInches);

  return {
    feet: String(Math.floor(rounded / 12)),
    inches: String(rounded % 12),
  };
}

function parseWholeNumberInRange({
  max,
  min,
  value,
}: {
  max?: number;
  min: number;
  value: string;
}) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < min) {
    return null;
  }

  if (typeof max === "number" && parsed > max) {
    return null;
  }

  return parsed;
}

function getHeightComparableValue({
  heightFeet,
  heightInches,
  heightMetric,
  unitSystem,
}: {
  heightFeet: string;
  heightInches: string;
  heightMetric: string;
  unitSystem: PreferredUnitSystem;
}) {
  return unitSystem === "metric" ? heightMetric : `${heightFeet}:${heightInches}`;
}

function parseHeightToInches({
  heightFeet,
  heightInches,
  heightMetric,
  unitSystem,
}: {
  heightFeet: string;
  heightInches: string;
  heightMetric: string;
  unitSystem: PreferredUnitSystem;
}) {
  if (unitSystem === "metric") {
    const parsed = parsePositiveNumber(heightMetric);

    if (!parsed) {
      return null;
    }

    return centimetersToInches(parsed);
  }

  const parsedFeet = parseWholeNumberInRange({ min: 1, value: heightFeet });
  const parsedInches = parseWholeNumberInRange({ max: 11, min: 0, value: heightInches });

  if (parsedFeet === null || parsedInches === null) {
    return null;
  }

  return parsedFeet * 12 + parsedInches;
}

function parseWeightToPounds(value: string, unitSystem: PreferredUnitSystem) {
  const parsed = parsePositiveNumber(value);

  if (!parsed) {
    return null;
  }

  return unitSystem === "metric" ? kilogramsToPounds(parsed) : parsed;
}

function normalizeGoalPace(goalType: GoalType, goalPace?: GoalPace) {
  return requiresGoalPace(goalType) ? goalPace ?? "moderate" : undefined;
}

function targetsMatchComputed(
  targets: EditableMacroTargets,
  computedTargets: EditableMacroTargets | null
) {
  if (!computedTargets) {
    return false;
  }

  return (
    targets.calories === computedTargets.calories &&
    targets.carbs === computedTargets.carbs &&
    targets.fat === computedTargets.fat &&
    targets.protein === computedTargets.protein
  );
}

function OptionPill({
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
      <ThemedText size="sm" variant={active ? "accent1" : "secondary"}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

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

export function ProfileForm({
  initialValues,
  isSubmitting = false,
  onDirtyChange,
  onSubmit,
  onSubmitReady,
  style,
  submitLabel,
}: ProfileFormProps) {
  const initialGoalType = initialValues?.goalType ?? "general_health";
  const initialUnitSystem = initialValues?.preferredUnitSystem ?? "imperial";
  const initialGoalPace = normalizeGoalPace(initialGoalType, initialValues?.goalPace);
  const initialImperialHeight = splitHeightInches(initialValues?.height);
  const initialComputedTargets =
    initialValues?.age &&
    initialValues?.height &&
    initialValues?.weight &&
    initialValues?.activityLevel &&
    initialValues?.goalType &&
    initialValues?.sex
      ? computeBaseTargets({
          activityLevel: initialValues.activityLevel,
          age: initialValues.age,
          goalPace: initialGoalPace,
          goalType: initialGoalType,
          height: initialValues.height,
          sex: initialValues.sex,
          weight: initialValues.weight,
        })
      : null;
  const initialTargetValues = initialValues?.targets ?? {
    calories: initialComputedTargets?.calories ?? 0,
    carbs: initialComputedTargets?.carbs ?? 0,
    fat: initialComputedTargets?.fat ?? 0,
    protein: initialComputedTargets?.protein ?? 0,
  };
  const [goalType, setGoalType] = useState<GoalType>(initialGoalType);
  const [goalPace, setGoalPace] = useState<GoalPace | undefined>(initialGoalPace);
  const [preferredUnitSystem, setPreferredUnitSystem] =
    useState<PreferredUnitSystem>(initialUnitSystem);
  const [primaryTrackingChallenge, setPrimaryTrackingChallenge] = useState<PrimaryTrackingChallenge>(
    initialValues?.primaryTrackingChallenge ?? "consistency"
  );
  const [sex, setSex] = useState<Sex>(initialValues?.sex ?? "male");
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(
    initialValues?.activityLevel ?? "moderate"
  );
  const [age, setAge] = useState(initialValues?.age?.toString() ?? "");
  const canonicalHeightInches = useRef<number | null>(initialValues?.height ?? null);
  const canonicalWeightPounds = useRef<number | null>(initialValues?.weight ?? null);
  const [heightFeet, setHeightFeet] = useState(initialImperialHeight.feet);
  const [heightInches, setHeightInches] = useState(initialImperialHeight.inches);
  const [heightMetric, setHeightMetric] = useState(formatMetricHeight(initialValues?.height));
  const [weight, setWeight] = useState(
    formatWeightForUnit(initialValues?.weight, initialUnitSystem)
  );
  const [targetCalories, setTargetCalories] = useState(initialTargetValues.calories.toString());
  const [targetProtein, setTargetProtein] = useState(initialTargetValues.protein.toString());
  const [targetCarbs, setTargetCarbs] = useState(initialTargetValues.carbs.toString());
  const [targetFat, setTargetFat] = useState(initialTargetValues.fat.toString());
  const [hasManualTargetEdits, setHasManualTargetEdits] = useState(
    Boolean(initialValues?.targets) && !targetsMatchComputed(initialTargetValues, initialComputedTargets)
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const parsedHeightInches = parseHeightToInches({
    heightFeet,
    heightInches,
    heightMetric,
    unitSystem: preferredUnitSystem,
  });
  const weightPounds = parseWeightToPounds(weight, preferredUnitSystem);
  const parsedAge = parsePositiveNumber(age);

  const initialComparableState = useRef(
    JSON.stringify({
      activityLevel: initialValues?.activityLevel ?? "moderate",
      age: initialValues?.age?.toString() ?? "",
      goalPace: initialGoalPace,
      goalType: initialGoalType,
      height: getHeightComparableValue({
        heightFeet: initialImperialHeight.feet,
        heightInches: initialImperialHeight.inches,
        heightMetric: formatMetricHeight(initialValues?.height),
        unitSystem: initialUnitSystem,
      }),
      preferredUnitSystem: initialUnitSystem,
      primaryTrackingChallenge: initialValues?.primaryTrackingChallenge ?? "consistency",
      sex: initialValues?.sex ?? "male",
      targetCalories: initialTargetValues.calories.toString(),
      targetCarbs: initialTargetValues.carbs.toString(),
      targetFat: initialTargetValues.fat.toString(),
      targetProtein: initialTargetValues.protein.toString(),
      weight: formatWeightForUnit(initialValues?.weight, initialUnitSystem),
    })
  );

  const computedTargets = useMemo(() => {
    if (!parsedAge || !parsedHeightInches || !weightPounds) {
      return null;
    }

    return computeBaseTargets({
      activityLevel,
      age: parsedAge,
      goalPace: normalizeGoalPace(goalType, goalPace),
      goalType,
      height: parsedHeightInches,
      sex,
      weight: weightPounds,
    });
  }, [activityLevel, goalPace, goalType, parsedAge, parsedHeightInches, sex, weightPounds]);

  useEffect(() => {
    const normalizedGoalPace = normalizeGoalPace(goalType, goalPace);

    if (normalizedGoalPace !== goalPace) {
      setGoalPace(normalizedGoalPace);
    }
  }, [goalPace, goalType]);

  useEffect(() => {
    if (!computedTargets || hasManualTargetEdits) {
      return;
    }

    setTargetCalories(computedTargets.calories.toString());
    setTargetProtein(computedTargets.protein.toString());
    setTargetCarbs(computedTargets.carbs.toString());
    setTargetFat(computedTargets.fat.toString());
  }, [computedTargets, hasManualTargetEdits]);

  useEffect(() => {
    if (!onDirtyChange) {
      return;
    }

    const currentComparableState = JSON.stringify({
      activityLevel,
      age,
      goalPace: normalizeGoalPace(goalType, goalPace),
      goalType,
      height: getHeightComparableValue({
        heightFeet,
        heightInches,
        heightMetric,
        unitSystem: preferredUnitSystem,
      }),
      preferredUnitSystem,
      primaryTrackingChallenge,
      sex,
      targetCalories,
      targetCarbs,
      targetFat,
      targetProtein,
      weight,
    });

    onDirtyChange(currentComparableState !== initialComparableState.current);
  }, [
    activityLevel,
    age,
    goalPace,
    goalType,
    heightFeet,
    heightInches,
    heightMetric,
    onDirtyChange,
    preferredUnitSystem,
    primaryTrackingChallenge,
    sex,
    targetCalories,
    targetCarbs,
    targetFat,
    targetProtein,
    weight,
  ]);

  function switchUnits(nextUnit: PreferredUnitSystem) {
    if (nextUnit === preferredUnitSystem) {
      return;
    }

    if (canonicalHeightInches.current) {
      if (nextUnit === "metric") {
        setHeightMetric(formatMetricHeight(canonicalHeightInches.current));
      } else {
        const split = splitHeightInches(canonicalHeightInches.current);
        setHeightFeet(split.feet);
        setHeightInches(split.inches);
      }
    }

    if (canonicalWeightPounds.current) {
      setWeight(formatWeightForUnit(canonicalWeightPounds.current, nextUnit));
    }

    setPreferredUnitSystem(nextUnit);
  }

  function handleHeightFeetChange(nextValue: string) {
    setHeightFeet(nextValue);

    const nextFeet = parseWholeNumberInRange({ min: 1, value: nextValue });
    const nextInches = parseWholeNumberInRange({ max: 11, min: 0, value: heightInches });

    if (nextFeet !== null && nextInches !== null) {
      canonicalHeightInches.current = nextFeet * 12 + nextInches;
    }
  }

  function handleHeightInchesChange(nextValue: string) {
    setHeightInches(nextValue);

    const nextFeet = parseWholeNumberInRange({ min: 1, value: heightFeet });
    const nextInches = parseWholeNumberInRange({ max: 11, min: 0, value: nextValue });

    if (nextFeet !== null && nextInches !== null) {
      canonicalHeightInches.current = nextFeet * 12 + nextInches;
    }
  }

  function handleMetricHeightChange(nextValue: string) {
    setHeightMetric(nextValue);

    const parsed = parsePositiveNumber(nextValue);
    if (parsed) {
      canonicalHeightInches.current = centimetersToInches(parsed);
    }
  }

  function handleWeightChange(nextValue: string) {
    setWeight(nextValue);

    const parsed = parsePositiveNumber(nextValue);
    if (!parsed) {
      return;
    }

    canonicalWeightPounds.current =
      preferredUnitSystem === "metric" ? kilogramsToPounds(parsed) : parsed;
  }

  function updateManualTargets(nextTargets: EditableMacroTargets) {
    setTargetCalories(nextTargets.calories.toString());
    setTargetProtein(nextTargets.protein.toString());
    setTargetCarbs(nextTargets.carbs.toString());
    setTargetFat(nextTargets.fat.toString());
    setHasManualTargetEdits(!targetsMatchComputed(nextTargets, computedTargets));
  }

  async function submit() {
    const parsedTargetCalories = parseTargetNumber(targetCalories);
    const parsedTargetProtein = parseTargetNumber(targetProtein);
    const parsedTargetCarbs = parseTargetNumber(targetCarbs);
    const parsedTargetFat = parseTargetNumber(targetFat);

    if (
      !parsedAge ||
      !parsedHeightInches ||
      !weightPounds ||
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
        goalPace: normalizeGoalPace(goalType, goalPace),
        goalType,
        height: Math.round(parsedHeightInches),
        preferredUnitSystem,
        primaryTrackingChallenge,
        sex,
        targets: {
          calories: parsedTargetCalories,
          carbs: parsedTargetCarbs,
          fat: parsedTargetFat,
          protein: parsedTargetProtein,
        },
        timeZone: initialValues?.timeZone ?? "UTC",
        weight: Math.round(weightPounds),
      });
    } finally {
      setSaving(false);
    }
  }

  const submitRef = useRef(submit);
  submitRef.current = submit;

  const computedTargetSnapshot =
    computedTargets === null
      ? null
      : {
          calories: computedTargets.calories,
          carbs: computedTargets.carbs,
          fat: computedTargets.fat,
          protein: computedTargets.protein,
        };

  const submitProps = useMemo(
    () => ({
      disabled: saving || isSubmitting,
      label: saving || isSubmitting ? "Saving..." : submitLabel,
      onPress: () => void submitRef.current(),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [saving, isSubmitting, submitLabel]
  );

  useEffect(() => {
    onSubmitReady?.(submitProps);
  }, [onSubmitReady, submitProps]);

  return (
    <View style={[styles.content, style]}>
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

        <View style={styles.row}>
          <Field keyboardType="numeric" label="Age" onChangeText={setAge} testID="ageInput" value={age} />
        </View>
        {preferredUnitSystem === "metric" ? (
          <View style={styles.row}>
            <Field
              keyboardType="numeric"
              label="Height (cm)"
              onChangeText={handleMetricHeightChange}
              testID="heightInput"
              value={heightMetric}
            />
            <Field
              keyboardType="numeric"
              label="Weight (kg)"
              onChangeText={handleWeightChange}
              testID="weightInput"
              value={weight}
            />
          </View>
        ) : (
          <>
            <View style={styles.labeledOptionGroup}>
              <ThemedText size="xs" variant="tertiary">Height</ThemedText>
              <View style={styles.row}>
                <Field
                  keyboardType="numeric"
                  label="Feet"
                  onChangeText={handleHeightFeetChange}
                  testID="heightFeetInput"
                  value={heightFeet}
                />
                <Field
                  keyboardType="numeric"
                  label="Inches"
                  onChangeText={handleHeightInchesChange}
                  testID="heightInchesInput"
                  value={heightInches}
                />
              </View>
            </View>
            <View style={styles.row}>
              <Field
                keyboardType="numeric"
                label="Weight (lb)"
                onChangeText={handleWeightChange}
                testID="weightInput"
                value={weight}
              />
            </View>
          </>
        )}

        <ThemedText size="md" style={styles.sectionTitle}>
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
        {computedTargetSnapshot ? (
          <ThemedText style={styles.targetHint} variant="secondary">
            Suggested now: {computedTargetSnapshot.calories} kcal, {computedTargetSnapshot.protein}g protein,{" "}
            {computedTargetSnapshot.carbs}g carbs, {computedTargetSnapshot.fat}g fat.
          </ThemedText>
        ) : (
          <ThemedText style={styles.targetHint} variant="secondary">
            Fill the basics above to generate suggested targets.
          </ThemedText>
        )}
      </Card>

      {error ? (
        <ThemedText size="sm" style={styles.error} variant="accent2">
          {error}
        </ThemedText>
      ) : null}

      {onSubmitReady ? null : (
        <Button
          disabled={submitProps.disabled}
          label={submitProps.label}
          onPress={submitProps.onPress}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 16,
    paddingBottom: 12,
  },
  error: {
    marginBottom: -4,
    textTransform: "none",
  },
  field: {
    flex: 1,
  },
  fieldLabel: {
    marginBottom: 8,
  },
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
  labeledOptionGroup: {
    gap: 8,
  },
  optionPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  optionWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  section: {
    gap: 14,
  },
  sectionTitle: {
    marginBottom: 2,
  },
  targetHint: {
    lineHeight: 20,
  },
  targetsHeader: {
    gap: 6,
  },
  targetsHeaderRow: {
    alignItems: "center",
    flexDirection: "row",
  },
  targetsHeaderTitle: {
    flex: 1,
  },
});
