import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useTheme } from "../lib/theme/ThemeProvider";
import { ThemedText } from "./ThemedText";

type ProfileDetailScaffoldProps = {
  children: React.ReactNode;
  onBackPress: () => void;
  subtitle: string;
  title: string;
};

export function ProfileDetailScaffold({
  children,
  onBackPress,
  subtitle,
  title,
}: ProfileDetailScaffoldProps) {
  const { theme } = useTheme();

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      style={[styles.container, { backgroundColor: theme.background }]}
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
  header: {
    marginBottom: 6,
  },
  subtitle: {
    lineHeight: 22,
    marginTop: 8,
  },
});
