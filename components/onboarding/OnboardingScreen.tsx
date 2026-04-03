import React from "react";
import { Animated, Easing, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../lib/theme/ThemeProvider";
import { Button } from "../Button";
import { ThemedText } from "../ThemedText";

type OnboardingScreenProps = {
  actionDisabled?: boolean;
  actionLabel: string;
  children: React.ReactNode;
  error?: string | null;
  footerContent?: React.ReactNode;
  footerMode?: "inline" | "sticky" | "none";
  footerTestID?: string;
  onActionPress: () => void;
  onBackPress?: () => void;
  progress?: {
    current: number;
    total: number;
  } | null;
  progressLabel?: string;
  subtitle?: string;
  title: string;
  actionTestID?: string;
};

export function OnboardingScreen({
  actionDisabled = false,
  actionLabel,
  actionTestID,
  children,
  error,
  footerContent,
  footerMode = "inline",
  footerTestID,
  onActionPress,
  onBackPress,
  progress,
  progressLabel,
  subtitle,
  title,
}: OnboardingScreenProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const entranceOpacity = React.useRef(new Animated.Value(0)).current;
  const entranceTranslateY = React.useRef(new Animated.Value(14)).current;
  const progressValue = React.useRef(new Animated.Value(0)).current;
  const progressPercent = progress && progress.total > 0 ? progress.current / progress.total : 1;
  const hasStickyFooter = footerMode === "sticky";
  const stickyFooterPadding = Math.max(insets.bottom, 18) + 110;

  React.useEffect(() => {
    const entranceAnimation = Animated.parallel([
      Animated.timing(entranceOpacity, {
        duration: 260,
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(entranceTranslateY, {
        duration: 260,
        toValue: 0,
        useNativeDriver: true,
      }),
    ]);

    entranceAnimation.start();

    return () => {
      entranceAnimation.stop();
    };
  }, [entranceOpacity, entranceTranslateY]);

  React.useEffect(() => {
    const progressAnimation = Animated.timing(progressValue, {
      duration: 280,
      easing: Easing.out(Easing.cubic),
      toValue: progressPercent,
      useNativeDriver: false,
    });

    progressAnimation.start();

    return () => {
      progressAnimation.stop();
    };
  }, [progressPercent, progressValue]);

  const progressFillWidth = progressValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            backgroundColor: theme.background,
            paddingBottom: hasStickyFooter ? stickyFooterPadding : 36,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{
            opacity: entranceOpacity,
            transform: [{ translateY: entranceTranslateY }],
          }}
        >
          <View style={styles.header}>
            {onBackPress ? (
              <Pressable accessibilityRole="button" onPress={onBackPress} style={styles.backButton}>
                <ThemedText variant="secondary" size="sm">
                  Back
                </ThemedText>
              </Pressable>
            ) : null}

            {progress ? (
              <View style={styles.progressWrap}>
                <ThemedText variant="tertiary" size="xs" style={styles.progressLabel}>
                  {progressLabel ?? `Question ${progress.current} of ${progress.total}`}
                </ThemedText>
                <View style={[styles.progressTrack, { backgroundColor: theme.ringTrack }]}>
                  <Animated.View
                    style={[
                      styles.progressFill,
                      {
                        backgroundColor: theme.accent1,
                        width: progressFillWidth,
                      },
                    ]}
                  />
                </View>
              </View>
            ) : progressLabel ? (
              <ThemedText variant="tertiary" size="xs" style={styles.progressLabel}>
                {progressLabel}
              </ThemedText>
            ) : null}

            <ThemedText size="xl" style={styles.title}>
              {title}
            </ThemedText>
            {subtitle ? (
              <ThemedText variant="secondary" style={styles.subtitle}>
                {subtitle}
              </ThemedText>
            ) : null}
          </View>

          <View style={styles.body}>{children}</View>

          {footerMode === "inline" ? (
            <>
              {footerContent ? <View style={styles.inlineFooterContent}>{footerContent}</View> : null}
              {error ? (
                <ThemedText size="sm" variant="accent2" style={styles.error}>
                  {error}
                </ThemedText>
              ) : null}
              <Button
                disabled={actionDisabled}
                label={actionLabel}
                onPress={onActionPress}
                testID={actionTestID}
              />
            </>
          ) : null}
        </Animated.View>
      </ScrollView>

      {footerMode === "sticky" ? (
        <View
          style={[
            styles.stickyFooter,
            {
              backgroundColor: theme.background,
              borderTopColor: theme.outline,
              paddingBottom: Math.max(insets.bottom, 18),
            },
          ]}
          testID={footerTestID}
        >
          {footerContent ? <View style={styles.stickyFooterContent}>{footerContent}</View> : null}
          {error ? (
            <ThemedText size="sm" variant="accent2" style={styles.error}>
              {error}
            </ThemedText>
          ) : null}
          <Button
            disabled={actionDisabled}
            label={actionLabel}
            onPress={onActionPress}
            testID={actionTestID}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    marginBottom: 12,
    paddingVertical: 4,
  },
  body: {
    marginBottom: 20,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 28,
  },
  error: {
    marginBottom: 16,
    textTransform: "none",
  },
  header: {
    marginBottom: 24,
  },
  progressFill: {
    borderRadius: 999,
    height: "100%",
  },
  progressLabel: {
    marginBottom: 10,
  },
  progressTrack: {
    borderRadius: 999,
    height: 6,
    overflow: "hidden",
    width: "100%",
  },
  progressWrap: {
    marginBottom: 18,
  },
  inlineFooterContent: {
    marginBottom: 16,
  },
  screen: {
    flex: 1,
  },
  stickyFooter: {
    borderTopWidth: 1,
    bottom: 0,
    left: 0,
    paddingHorizontal: 20,
    paddingTop: 14,
    position: "absolute",
    right: 0,
  },
  stickyFooterContent: {
    marginBottom: 14,
  },
  subtitle: {
    lineHeight: 22,
  },
  title: {
    marginBottom: 10,
  },
});
