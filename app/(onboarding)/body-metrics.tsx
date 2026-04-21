import React from "react";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { OnboardingNumberStep } from "../../components/onboarding/OnboardingNumberStep";
import { OnboardingScreen } from "../../components/onboarding/OnboardingScreen";
import { ThemedText } from "../../components/ThemedText";
import {
  centimetersToInches,
  inchesToCentimeters,
  kilogramsToPounds,
  poundsToKilograms,
  UNIT_SYSTEM_OPTIONS,
} from "../../lib/domain/targets";
import { useOnboardingFlow } from "../../lib/onboarding/OnboardingFlowProvider";
import {
  getNextOnboardingPath,
  getPreviousOnboardingPath,
  getSetupProgress,
  parsePositiveDraftNumber,
} from "../../lib/onboarding/flow";
import { useTheme } from "../../lib/theme/ThemeProvider";

function formatMetricHeight(value?: number) {
  if (!value) {
    return "";
  }

  return String(Math.round(inchesToCentimeters(value)));
}

function formatMetricWeight(value?: number) {
  if (!value) {
    return "";
  }

  return String(Math.round(poundsToKilograms(value)));
}

function formatImperialWeight(value?: number) {
  if (!value) {
    return "";
  }

  return String(Math.round(value));
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

export default function BodyMetricsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { draft, setDraftValue } = useOnboardingFlow();
  const initialImperialHeight = React.useMemo(() => splitHeightInches(draft.height), [draft.height]);
  const canonicalHeightInches = React.useRef<number | null>(draft.height ?? null);
  const canonicalWeightPounds = React.useRef<number | null>(draft.weight ?? null);
  const [unitSystem, setUnitSystem] = React.useState<"imperial" | "metric">(
    draft.preferredUnitSystem ?? "imperial"
  );
  const [heightFeet, setHeightFeet] = React.useState(initialImperialHeight.feet);
  const [heightInches, setHeightInches] = React.useState(initialImperialHeight.inches);
  const [heightMetric, setHeightMetric] = React.useState(formatMetricHeight(draft.height));
  const [weight, setWeight] = React.useState(
    draft.preferredUnitSystem === "metric"
      ? formatMetricWeight(draft.weight)
      : formatImperialWeight(draft.weight)
  );

  const parsedMetricHeight = parsePositiveDraftNumber(heightMetric);
  const parsedWeight = parsePositiveDraftNumber(weight);
  const parsedHeightFeet = parseWholeNumberInRange({ min: 1, value: heightFeet });
  const parsedHeightInches = parseWholeNumberInRange({ max: 11, min: 0, value: heightInches });
  const parsedImperialHeight =
    parsedHeightFeet !== null && parsedHeightInches !== null
      ? parsedHeightFeet * 12 + parsedHeightInches
      : null;
  const parsedHeight = unitSystem === "metric" ? parsedMetricHeight : parsedImperialHeight;

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

    const parsed = parsePositiveDraftNumber(nextValue);
    if (parsed) {
      canonicalHeightInches.current = centimetersToInches(parsed);
    }
  }

  function handleWeightChange(nextValue: string) {
    setWeight(nextValue);

    const parsed = parsePositiveDraftNumber(nextValue);
    if (!parsed) {
      return;
    }

    canonicalWeightPounds.current =
      unitSystem === "metric" ? kilogramsToPounds(parsed) : parsed;
  }

  function applyHeightFromInches(totalInches: number, nextUnit: "imperial" | "metric") {
    const roundedInches = Math.round(totalInches);

    if (nextUnit === "metric") {
      setHeightMetric(String(Math.round(inchesToCentimeters(roundedInches))));
      return;
    }

    const split = splitHeightInches(roundedInches);
    setHeightFeet(split.feet);
    setHeightInches(split.inches);
  }

  function switchUnits(nextUnit: "imperial" | "metric") {
    if (nextUnit === unitSystem) {
      return;
    }

    const numericHeight = canonicalHeightInches.current;
    const numericWeight = canonicalWeightPounds.current;

    if (numericHeight) {
      applyHeightFromInches(numericHeight, nextUnit);
    }

    if (numericWeight) {
      setWeight(
        String(
          Math.round(nextUnit === "metric" ? poundsToKilograms(numericWeight) : numericWeight)
        )
      );
    }

    setUnitSystem(nextUnit);
  }

  return (
    <OnboardingScreen
      actionDisabled={!parsedHeight || !parsedWeight}
      actionLabel="Continue"
      onActionPress={() => {
        if (!parsedHeight || !parsedWeight) {
          return;
        }

        const heightInches = unitSystem === "metric" ? centimetersToInches(parsedHeight) : parsedHeight;
        const weightPounds = unitSystem === "metric" ? kilogramsToPounds(parsedWeight) : parsedWeight;

        setDraftValue("preferredUnitSystem", unitSystem);
        setDraftValue("height", Math.round(heightInches));
        setDraftValue("weight", Math.round(weightPounds));
        router.push(
          getNextOnboardingPath("bodyMetrics", {
            ...draft,
            height: Math.round(heightInches),
            preferredUnitSystem: unitSystem,
            weight: Math.round(weightPounds),
          })
        );
      }}
      onBackPress={() => {
        const previous = getPreviousOnboardingPath("bodyMetrics", draft);
        if (previous) {
          router.push(previous);
        }
      }}
      progress={getSetupProgress("bodyMetrics", draft)}
      subtitle="Use your current height and weight. You can switch units without losing progress."
      title="Let’s set your body metrics"
    >
      <View style={styles.stack}>
        <View style={styles.toggleRow}>
          {UNIT_SYSTEM_OPTIONS.map((option) => {
            const active = option.value === unitSystem;

            return (
              <Pressable
                accessibilityRole="button"
                key={option.value}
                onPress={() => switchUnits(option.value)}
                style={[
                  styles.toggle,
                  {
                    backgroundColor: active ? theme.surfaceStrong : theme.surfaceSoft,
                    borderColor: active ? theme.accent1 : theme.cardBorder,
                  },
                ]}
              >
                <ThemedText variant={active ? "accent1" : "secondary"}>{option.label}</ThemedText>
              </Pressable>
            );
          })}
        </View>

        {unitSystem === "imperial" ? (
          <View style={styles.inputGroup}>
            <ThemedText variant="secondary" size="sm">
              Height
            </ThemedText>
            <View style={styles.heightRow}>
              <View style={[styles.inputGroup, styles.heightField]}>
                <ThemedText variant="secondary" size="sm">
                  Feet
                </ThemedText>
                <OnboardingNumberStep
                  onChangeText={handleHeightFeetChange}
                  placeholder="Feet"
                  testID="heightFeetInput"
                  value={heightFeet}
                />
              </View>

              <View style={[styles.inputGroup, styles.heightField]}>
                <ThemedText variant="secondary" size="sm">
                  Inches
                </ThemedText>
                <OnboardingNumberStep
                  onChangeText={handleHeightInchesChange}
                  placeholder="Inches"
                  testID="heightInchesInput"
                  value={heightInches}
                />
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.inputGroup}>
            <ThemedText variant="secondary" size="sm">
              Height (cm)
            </ThemedText>
            <OnboardingNumberStep
              onChangeText={handleMetricHeightChange}
              placeholder="Height in centimeters"
              testID="heightMetricInput"
              value={heightMetric}
            />
          </View>
        )}

        <View style={styles.inputGroup}>
          <ThemedText variant="secondary" size="sm">
            Weight {unitSystem === "imperial" ? "(lb)" : "(kg)"}
          </ThemedText>
          <OnboardingNumberStep
            onChangeText={handleWeightChange}
            placeholder={unitSystem === "imperial" ? "Weight in pounds" : "Weight in kilograms"}
            testID="weightStepInput"
            value={weight}
          />
        </View>
      </View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  heightField: {
    flex: 1,
  },
  heightRow: {
    flexDirection: "row",
    gap: 12,
  },
  inputGroup: {
    gap: 8,
  },
  stack: {
    gap: 18,
  },
  toggle: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  toggleRow: {
    flexDirection: "row",
    gap: 10,
  },
});
