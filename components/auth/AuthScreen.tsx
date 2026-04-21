import React from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { LegalLinksRow } from "../LegalLinksRow";
import { useTheme } from "../../lib/theme/ThemeProvider";
import { Card } from "../Card";
import { ThemedText } from "../ThemedText";

export function AuthScreen({
  children,
  eyebrow,
  footerActionLabel,
  footerLabel,
  onFooterActionPress,
  subtitle,
  title,
}: {
  children: React.ReactNode;
  eyebrow?: string;
  footerActionLabel?: string;
  footerLabel?: string;
  onFooterActionPress?: () => void;
  subtitle: string;
  title: string;
}) {
  const { theme } = useTheme();

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { backgroundColor: theme.background }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        {eyebrow ? (
          <ThemedText size="xs" variant="accent2" style={styles.eyebrow}>
            {eyebrow}
          </ThemedText>
        ) : null}
        <ThemedText size="xl" style={styles.title}>
          {title}
        </ThemedText>
        <ThemedText variant="secondary" style={styles.subtitle}>
          {subtitle}
        </ThemedText>
      </View>

      <Card style={styles.card}>{children}</Card>

      {footerLabel && footerActionLabel && onFooterActionPress ? (
        <View style={styles.footer}>
          <ThemedText variant="secondary">{footerLabel}</ThemedText>
          <Pressable accessibilityRole="button" onPress={onFooterActionPress}>
            <ThemedText style={{ color: theme.accent1 }}>{footerActionLabel}</ThemedText>
          </Pressable>
        </View>
      ) : null}

      <LegalLinksRow style={styles.legalLinks} testID="auth-screen-legal-links" textVariant="tertiary" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 14,
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 28,
  },
  eyebrow: {
    marginBottom: 10,
  },
  footer: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginTop: 18,
  },
  legalLinks: {
    marginTop: 18,
  },
  header: {
    marginBottom: 18,
  },
  subtitle: {
    lineHeight: 22,
  },
  title: {
    marginBottom: 10,
  },
});
