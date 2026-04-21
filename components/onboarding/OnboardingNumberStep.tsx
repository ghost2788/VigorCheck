import React from "react";
import { StyleSheet, TextInput } from "react-native";
import { useTheme } from "../../lib/theme/ThemeProvider";

export function OnboardingNumberStep({
  placeholder,
  testID,
  value,
  onChangeText,
}: {
  placeholder: string;
  testID: string;
  value: string;
  onChangeText: (value: string) => void;
}) {
  const { theme } = useTheme();

  return (
    <TextInput
      keyboardType="numeric"
      onChangeText={onChangeText}
      placeholder={placeholder}
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
  );
}

const styles = StyleSheet.create({
  input: {
    borderRadius: 18,
    borderWidth: 1,
    fontSize: 18,
    fontWeight: "500",
    minHeight: 58,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
});
