import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useTheme } from "../lib/theme/ThemeProvider";
import { ThemedText } from "./ThemedText";

type WeekNavigatorProps = {
  canGoNewer: boolean;
  canGoOlder: boolean;
  isCurrentWeek: boolean;
  label: string;
  onPressNewer: () => void;
  onPressOlder: () => void;
};

export function WeekNavigator({
  canGoNewer,
  canGoOlder,
  isCurrentWeek,
  label,
  onPressNewer,
  onPressOlder,
}: WeekNavigatorProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        disabled={!canGoOlder}
        onPress={onPressOlder}
        style={({ pressed }) => [
          styles.arrowButton,
          {
            backgroundColor: theme.card,
            borderColor: theme.cardBorder,
            opacity: !canGoOlder ? 0.35 : pressed ? 0.75 : 1,
          },
        ]}
      >
        <Ionicons color={theme.text} name="chevron-back" size={18} />
      </Pressable>

      <View style={styles.copy}>
        <ThemedText size="xs" variant="tertiary" style={styles.eyebrow}>
          {isCurrentWeek ? "This week so far" : "Week view"}
        </ThemedText>
        <ThemedText size="sm" style={styles.label}>
          {label}
        </ThemedText>
      </View>

      <Pressable
        accessibilityRole="button"
        disabled={!canGoNewer}
        onPress={onPressNewer}
        style={({ pressed }) => [
          styles.arrowButton,
          {
            backgroundColor: theme.card,
            borderColor: theme.cardBorder,
            opacity: !canGoNewer ? 0.35 : pressed ? 0.75 : 1,
          },
        ]}
      >
        <Ionicons color={theme.text} name="chevron-forward" size={18} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  arrowButton: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  copy: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  eyebrow: {
    marginBottom: 4,
  },
  label: {
    textAlign: "center",
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    marginBottom: 20,
  },
});
