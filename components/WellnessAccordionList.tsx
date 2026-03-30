import React, { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useTheme } from "../lib/theme/ThemeProvider";
import { ThemedText } from "./ThemedText";

export type WellnessAccordionItem = {
  accentColor: string;
  detail: React.ReactNode;
  headerActionLabel?: string;
  headerPercentLabel?: React.ReactNode;
  key: string;
  onHeaderActionPress?: () => void;
  summary: React.ReactNode;
  title: string;
};

type WellnessAccordionListProps = {
  items: WellnessAccordionItem[];
};

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function WellnessAccordionList({ items }: WellnessAccordionListProps) {
  const { theme } = useTheme();
  const [openKey, setOpenKey] = useState<string | null>(null);
  const toggleItem = (key: string) => {
    setOpenKey((current) => (current === key ? null : key));
  };

  return (
    <View style={styles.list}>
      {items.map((item) => {
        const isOpen = item.key === openKey;

        return (
          <View
            key={item.key}
            style={[
              styles.card,
              {
                backgroundColor: theme.card,
                borderColor: theme.cardBorder,
                shadowColor: theme.shadow,
              },
            ]}
          >
            <View style={styles.headerRow}>
              <Pressable
                accessibilityRole="button"
                onPress={() => toggleItem(item.key)}
                style={styles.trigger}
              >
                <View style={styles.copy}>
                  <View style={styles.titleRow}>
                    <ThemedText size="sm" style={[styles.title, { color: item.accentColor }]}>
                      {item.title}
                    </ThemedText>
                    {item.headerPercentLabel ? (
                      typeof item.headerPercentLabel === "string" ||
                      typeof item.headerPercentLabel === "number" ? (
                        <ThemedText size="sm" style={[styles.headerPercent, { color: item.accentColor }]}>
                          {item.headerPercentLabel}
                        </ThemedText>
                      ) : (
                        item.headerPercentLabel
                      )
                    ) : null}
                  </View>
                  {typeof item.summary === "string" || typeof item.summary === "number" ? (
                    <ThemedText variant="secondary" style={styles.summary}>
                      {item.summary}
                    </ThemedText>
                  ) : (
                    <View style={styles.summaryContainer}>{item.summary}</View>
                  )}
                </View>
              </Pressable>

              {item.headerActionLabel ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={(event) => {
                    event?.stopPropagation?.();
                    item.onHeaderActionPress?.();
                  }}
                  style={({ pressed }) => [
                    styles.actionPill,
                    item.headerActionLabel === "+" ? styles.compactActionPill : undefined,
                    {
                      backgroundColor: hexToRgba(item.accentColor, pressed ? 0.22 : 0.14),
                      borderColor: hexToRgba(item.accentColor, 0.28),
                    },
                  ]}
                >
                  <ThemedText size="sm" style={{ color: item.accentColor }}>
                    {item.headerActionLabel}
                  </ThemedText>
                </Pressable>
              ) : null}

              <Pressable
                accessibilityRole="button"
                onPress={() => toggleItem(item.key)}
                style={styles.chevronButton}
              >
                <View
                  style={[
                    styles.chevron,
                    {
                      borderColor: item.accentColor,
                      transform: [{ rotate: isOpen ? "-135deg" : "45deg" }],
                    },
                  ]}
                />
              </Pressable>
            </View>

            {isOpen ? <View style={styles.detail}>{item.detail}</View> : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  actionPill: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 36,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    shadowOffset: { height: 14, width: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 28,
  },
  chevron: {
    borderBottomWidth: 2,
    borderRightWidth: 2,
    height: 10,
    width: 10,
  },
  chevronButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    minWidth: 32,
  },
  copy: {
    flex: 1,
    paddingRight: 8,
  },
  compactActionPill: {
    minWidth: 36,
    paddingHorizontal: 0,
  },
  detail: {
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
  },
  list: {
    gap: 10,
  },
  summary: {
    lineHeight: 18,
  },
  summaryContainer: {
    minHeight: 18,
  },
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 6,
  },
  title: {
    letterSpacing: 1.8,
    textTransform: "uppercase",
  },
  headerPercent: {
    letterSpacing: 0,
    textTransform: "none",
  },
  trigger: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    minHeight: 70,
    paddingVertical: 10,
  },
});
