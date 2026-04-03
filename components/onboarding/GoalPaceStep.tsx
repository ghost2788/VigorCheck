import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";
import { GOAL_PACE_OPTIONS, GoalPace } from "../../lib/domain/targets";
import { useTheme } from "../../lib/theme/ThemeProvider";
import { useReducedMotionPreference } from "../../lib/ui/useReducedMotionPreference";
import { ThemedText } from "../ThemedText";

export function GoalPaceStep({
  onSelect,
  selectedValue,
}: {
  onSelect: (value: GoalPace) => void;
  selectedValue: GoalPace;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.stack} testID="goal-pace-stack">
        {GOAL_PACE_OPTIONS.map((option) => {
          return (
            <GoalPaceOptionCard
              active={option.value === selectedValue}
              key={option.value}
              onPress={() => onSelect(option.value)}
              option={option}
            />
          );
        })}
      </View>
    </View>
  );
}

function GoalPaceOptionCard({
  active,
  onPress,
  option,
}: {
  active: boolean;
  onPress: () => void;
  option: (typeof GOAL_PACE_OPTIONS)[number];
}) {
  const { theme } = useTheme();
  const reduceMotion = useReducedMotionPreference();
  const scale = React.useRef(new Animated.Value(active ? 1.01 : 1)).current;
  const translateY = React.useRef(new Animated.Value(active ? -4 : 0)).current;

  React.useEffect(() => {
    if (reduceMotion) {
      scale.setValue(active ? 1.01 : 1);
      translateY.setValue(active ? -4 : 0);
      return;
    }

    const animation = Animated.parallel([
      Animated.spring(scale, {
        damping: 16,
        mass: 0.9,
        stiffness: 180,
        toValue: active ? 1.01 : 1,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        damping: 16,
        mass: 0.9,
        stiffness: 180,
        toValue: active ? -4 : 0,
        useNativeDriver: true,
      }),
    ]);

    animation.start();

    return () => {
      animation.stop();
    };
  }, [active, reduceMotion, scale, translateY]);

  return (
    <Animated.View
      style={[
        styles.anchor,
        {
          transform: [{ scale }, { translateY }],
        },
      ]}
    >
      <Pressable
        accessibilityLabel={`${option.label} pace`}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        onPress={onPress}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: active ? theme.surfaceStrong : theme.surfaceSoft,
            borderColor: active ? theme.accent1 : theme.cardBorder,
            opacity: pressed ? 0.94 : 1,
          },
        ]}
        testID={`goal-pace-card-${option.value}`}
      >
        <View style={styles.cardHeader}>
          <View style={styles.headerLeading}>
            <View
              style={[
                styles.iconWrap,
                {
                  backgroundColor: active ? theme.card : theme.surfaceStrong,
                  borderColor: active ? theme.accent1 : theme.cardBorder,
                },
              ]}
            >
              <MaterialCommunityIcons
                color={active ? theme.accent1 : theme.textSecondary}
                name={option.icon}
                size={22}
              />
            </View>

            <View style={styles.cardCopy}>
              <ThemedText size="lg" style={styles.anchorLabel}>
                {option.label}
              </ThemedText>
              {option.value === "moderate" ? null : (
                <ThemedText
                  size="sm"
                  style={styles.anchorCaption}
                  variant={active ? "accent1" : "secondary"}
                >
                  {option.caption}
                </ThemedText>
              )}
            </View>
          </View>

          {option.value === "moderate" ? (
            <View
              style={[
                styles.recommendedChip,
                {
                  backgroundColor: active ? theme.accent1 : theme.card,
                  borderColor: active ? theme.accent1 : theme.cardBorder,
                },
              ]}
            >
              <ThemedText size="xs" variant={active ? "primary" : "accent2"}>
                Recommended
              </ThemedText>
            </View>
          ) : null}
        </View>

        <View
          style={[
            styles.cardFooter,
            {
              backgroundColor: active ? theme.accent1 : theme.ringTrack,
            },
          ]}
        />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  anchor: {
    width: "100%",
  },
  anchorCaption: {
    lineHeight: 18,
  },
  anchorLabel: {
    textAlign: "left",
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    gap: 16,
    minHeight: 112,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  cardCopy: {
    flex: 1,
    gap: 4,
  },
  cardFooter: {
    borderRadius: 999,
    height: 5,
    marginTop: "auto",
    width: "100%",
  },
  cardHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  headerLeading: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 14,
  },
  iconWrap: {
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1,
    height: 52,
    justifyContent: "center",
    width: 52,
  },
  recommendedChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  stack: {
    flexDirection: "column",
    gap: 12,
  },
  wrap: {
    position: "relative",
  },
});
