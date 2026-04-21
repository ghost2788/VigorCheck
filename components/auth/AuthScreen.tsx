import React from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LegalLinksRow } from "../LegalLinksRow";
import { useTheme } from "../../lib/theme/ThemeProvider";
import { Card } from "../Card";
import { ThemedText } from "../ThemedText";
import { WelcomeHudHero } from "./WelcomeHudHero";

export function AuthScreen({
  children,
  eyebrow,
  footerActionLabel,
  footerLabel,
  onFooterActionPress,
  showBrandHeader = false,
  subtitle,
  title,
}: {
  children: React.ReactNode;
  eyebrow?: string;
  footerActionLabel?: string;
  footerLabel?: string;
  onFooterActionPress?: () => void;
  showBrandHeader?: boolean;
  subtitle: string;
  title: string;
}) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        showBrandHeader ? styles.brandedContent : null,
        {
          paddingBottom: Math.max(insets.bottom + 24, 48),
          paddingTop: showBrandHeader
            ? Math.max(insets.top, 18) + 18
            : Math.max(insets.top + 34, 58),
        },
      ]}
      showsVerticalScrollIndicator={false}
      style={[styles.scroll, { backgroundColor: theme.background }]}
      testID="auth-screen"
    >
      {showBrandHeader ? (
        <View style={styles.brandHeader} testID="auth-screen-brand-header">
          <View style={styles.brandWrap}>
            <ThemedText style={styles.brandText} testID="auth-screen-brand-text" variant="accent2">
              VigorCheck
            </ThemedText>
          </View>
          <View style={styles.heroWrap}>
            <WelcomeHudHero style={styles.brandMark} testID="auth-screen-brand-mark" />
          </View>
        </View>
      ) : null}

      <View style={showBrandHeader ? styles.brandedAuthStack : styles.authStack}>
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
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  authStack: {
    width: "100%",
  },
  brandHeader: {
    gap: 18,
  },
  brandMark: {
    alignSelf: "center",
  },
  brandText: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: 1.8,
    textTransform: "uppercase",
  },
  brandWrap: {
    paddingTop: 18,
  },
  brandedAuthStack: {
    width: "100%",
  },
  brandedContent: {
    justifyContent: "space-between",
    paddingHorizontal: 22,
  },
  card: {
    gap: 14,
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
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
    marginBottom: 86,
    marginTop: 18,
  },
  scroll: {
    flex: 1,
  },
  header: {
    marginBottom: 18,
  },
  heroWrap: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 250,
  },
  subtitle: {
    lineHeight: 22,
  },
  title: {
    marginBottom: 10,
  },
});
