import React from "react";
import { StyleSheet, TextInput, TextInputProps } from "react-native";
import { useTheme } from "../../lib/theme/ThemeProvider";

export function AuthField(props: TextInputProps) {
  const { theme } = useTheme();

  return (
    <TextInput
      placeholderTextColor={theme.textMuted}
      style={[
        styles.input,
        {
          backgroundColor: theme.surfaceSoft,
          borderColor: theme.cardBorder,
          color: theme.text,
        },
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderRadius: 16,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
});
