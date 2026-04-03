import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useTheme } from "../../lib/theme/ThemeProvider";
import { ThemedText } from "../ThemedText";

export function OnboardingOptionStep<T extends string>({
  onSelect,
  options,
  selectedValue,
}: {
  onSelect: (value: T) => void;
  options: Array<{ description?: string; label: string; value: T }>;
  selectedValue?: T;
}) {
  const { theme } = useTheme();

  return (
    <View style={styles.stack}>
      {options.map((option) => {
        const active = option.value === selectedValue;

        return (
          <Pressable
            accessibilityRole="button"
            key={option.value}
            onPress={() => onSelect(option.value)}
            style={[
              styles.option,
              {
                backgroundColor: active ? theme.surfaceStrong : theme.surfaceSoft,
                borderColor: active ? theme.accent1 : theme.cardBorder,
              },
            ]}
            testID={`onboarding-option-${option.value}`}
            >
            <ThemedText size="md" variant={active ? "accent1" : "primary"}>
              {option.label}
            </ThemedText>
            {option.description ? (
              <ThemedText
                size="sm"
                style={styles.description}
                variant={active ? "secondary" : "tertiary"}
              >
                {option.description}
              </ThemedText>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  option: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 22,
  },
  description: {
    lineHeight: 18,
    marginTop: 6,
  },
  stack: {
    gap: 10,
  },
});
