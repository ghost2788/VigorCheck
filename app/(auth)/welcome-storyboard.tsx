import React from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  WelcomeHudFrameVariant,
  WelcomeHudHeartVariant,
  WelcomeHudHero,
} from "../../components/auth/WelcomeHudHero";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { ThemedText } from "../../components/ThemedText";
import { useTheme } from "../../lib/theme/ThemeProvider";

type HeroBoardItem = {
  frameVariant: WelcomeHudFrameVariant;
  heartVariant: WelcomeHudHeartVariant;
  id: string;
  label: string;
};

const HERO_OPTIONS: HeroBoardItem[] = [
  {
    frameVariant: "brackets",
    heartVariant: "soft",
    id: "soft-brackets",
    label: "Soft + brackets",
  },
  {
    frameVariant: "split",
    heartVariant: "soft",
    id: "soft-split",
    label: "Soft + split frame",
  },
  {
    frameVariant: "target",
    heartVariant: "soft",
    id: "soft-target",
    label: "Soft + target ring",
  },
  {
    frameVariant: "brackets",
    heartVariant: "crest",
    id: "crest-brackets",
    label: "Crest + brackets",
  },
  {
    frameVariant: "split",
    heartVariant: "crystal",
    id: "crystal-split",
    label: "Crystal + split frame",
  },
  {
    frameVariant: "target",
    heartVariant: "crest",
    id: "crest-target",
    label: "Crest + target ring",
  },
];

function WelcomePreviewCard({
  frameVariant,
  heartVariant,
  id,
  label,
}: HeroBoardItem) {
  const { theme } = useTheme();

  return (
    <View style={styles.previewColumn} testID={`storyboard-card-${id}`}>
      <ThemedText size="sm" style={styles.optionLabel}>
        {label}
      </ThemedText>
      <Card style={[styles.phoneShell, { backgroundColor: theme.background, borderColor: theme.cardBorder }]}>
        <View style={styles.phoneHero}>
          <WelcomeHudHero
            frameVariant={frameVariant}
            heartVariant={heartVariant}
            showAccentDots={false}
            testID={`storyboard-hero-${id}`}
            tone="vigorRed"
          />
        </View>

        <View style={styles.copyWrap}>
          <ThemedText size="xs" style={styles.eyebrow} variant="accent2">
            VigorCheck
          </ThemedText>
          <ThemedText size="xl" style={styles.title}>
            A calmer way to track nutrition
          </ThemedText>
          <ThemedText style={styles.subtitle} variant="secondary">
            Build your plan in minutes, then keep it easy.
          </ThemedText>
        </View>

        <View style={styles.actions}>
          <Button disabled label="Get started" onPress={() => {}} style={styles.button} />
          <View style={styles.footer}>
            <ThemedText variant="secondary">Already have an account?</ThemedText>
            <Pressable accessibilityRole="button">
              <ThemedText style={{ color: theme.accent1 }}>Sign in</ThemedText>
            </Pressable>
          </View>
        </View>
      </Card>
    </View>
  );
}

export default function WelcomeStoryboardScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        {
          paddingBottom: Math.max(insets.bottom, 20) + 28,
          paddingTop: Math.max(insets.top, 18) + 12,
        },
      ]}
      style={[styles.screen, { backgroundColor: theme.background }]}
    >
      <View style={styles.header}>
        <ThemedText size="xs" variant="accent2">
          Welcome Storyboard
        </ThemedText>
        <ThemedText size="xl" style={styles.headerTitle}>
          Pick the VigorCheck heart direction
        </ThemedText>
        <ThemedText style={styles.headerBody} variant="secondary">
          Same welcome layout, different heart and HUD combinations.
        </ThemedText>
      </View>

      <View style={styles.previewGrid}>
        {HERO_OPTIONS.map((option) => (
          <WelcomePreviewCard key={option.id} {...option} />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: 16,
  },
  button: {
    borderRadius: 18,
    paddingVertical: 16,
  },
  content: {
    gap: 24,
    paddingHorizontal: 20,
  },
  copyWrap: {
    gap: 10,
  },
  eyebrow: {
    marginBottom: 2,
  },
  footer: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
  },
  header: {
    gap: 8,
    marginBottom: 6,
    maxWidth: 720,
  },
  headerBody: {
    fontSize: 16,
    lineHeight: 22,
  },
  headerTitle: {
    fontSize: 36,
    letterSpacing: -1.1,
    lineHeight: 38,
  },
  optionLabel: {
    letterSpacing: 0.6,
  },
  phoneHero: {
    justifyContent: "center",
    minHeight: "42%",
  },
  phoneShell: {
    borderRadius: 32,
    minHeight: 680,
    paddingHorizontal: 22,
    paddingVertical: 24,
    width: 340,
  },
  previewColumn: {
    gap: 12,
  },
  previewGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 24,
  },
  screen: {
    flex: 1,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 300,
  },
  title: {
    fontSize: 44,
    letterSpacing: -1.4,
    lineHeight: 46,
    maxWidth: 260,
  },
});
