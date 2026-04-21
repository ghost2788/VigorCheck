import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Card } from "./Card";
import { ThemedText } from "./ThemedText";
import { useTheme } from "../lib/theme/ThemeProvider";

export type MySupplementCardItem = {
  id: string;
  isLoggedToday: boolean;
  label: string;
  servingLabel: string;
};

type MySupplementsCardProps = {
  asNeeded: MySupplementCardItem[];
  daily: MySupplementCardItem[];
  onLogAsNeeded: (id: string) => void;
  onManage: () => void;
  onToggleDaily: (id: string, nextTaken: boolean) => void;
  onUndoAsNeeded: (id: string) => void;
};

function SupplementSection({
  emptyLabel,
  items,
  onPrimaryAction,
  onSecondaryAction,
  primaryAccessibilityLabel,
  primaryLabel,
  secondaryLabel,
  title,
}: {
  emptyLabel: string;
  items: MySupplementCardItem[];
  onPrimaryAction: (id: string) => void;
  onSecondaryAction?: (id: string) => void;
  primaryAccessibilityLabel: (item: MySupplementCardItem) => string;
  primaryLabel: (item: MySupplementCardItem) => string;
  secondaryLabel?: (item: MySupplementCardItem) => string | null;
  title: string;
}) {
  const { theme } = useTheme();

  return (
    <View style={styles.section}>
      <ThemedText size="xs" style={styles.sectionTitle} variant="tertiary">
        {title}
      </ThemedText>

      {items.length === 0 ? (
        <ThemedText size="sm" variant="secondary">
          {emptyLabel}
        </ThemedText>
      ) : (
        items.map((item, index) => (
          <View
            key={item.id}
            style={[
              styles.row,
              {
                backgroundColor: theme.surfaceSoft,
                borderColor: theme.cardBorder,
              },
              index < items.length - 1 ? styles.rowGap : undefined,
            ]}
          >
            <View style={styles.rowCopy}>
              <ThemedText numberOfLines={2} size="sm" style={styles.rowTitle}>
                {item.label}
              </ThemedText>
              <View style={styles.rowMetaLine}>
                <ThemedText numberOfLines={1} size="sm" style={styles.rowServing} variant="secondary">
                  {item.servingLabel}
                </ThemedText>

                <View style={styles.rowActions}>
                  {secondaryLabel && onSecondaryAction && secondaryLabel(item) ? (
                    <Pressable
                      accessibilityLabel={`Undo as needed supplement ${item.label}`}
                      accessibilityRole="button"
                      onPress={() => onSecondaryAction(item.id)}
                      style={[
                        styles.actionButton,
                        styles.actionGap,
                        {
                          backgroundColor: theme.card,
                          borderColor: theme.cardBorder,
                        },
                      ]}
                    >
                      <ThemedText size="sm" variant="secondary">
                        {secondaryLabel(item)}
                      </ThemedText>
                    </Pressable>
                  ) : null}

                  <Pressable
                    accessibilityLabel={primaryAccessibilityLabel(item)}
                    accessibilityRole="button"
                    onPress={() => onPrimaryAction(item.id)}
                    style={[
                      styles.actionButton,
                      item.isLoggedToday
                        ? {
                            backgroundColor: theme.surfaceSoft,
                            borderColor: theme.accent1,
                          }
                        : {
                            backgroundColor: theme.card,
                            borderColor: theme.cardBorder,
                          },
                    ]}
                  >
                    <ThemedText
                      size="sm"
                      style={{ color: item.isLoggedToday ? theme.accent1 : theme.accent1 }}
                    >
                      {primaryLabel(item)}
                    </ThemedText>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        ))
      )}
    </View>
  );
}

export function MySupplementsCard({
  asNeeded,
  daily,
  onLogAsNeeded,
  onManage,
  onToggleDaily,
  onUndoAsNeeded,
}: MySupplementsCardProps) {
  return (
    <Card>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <ThemedText size="xs" style={styles.eyebrow} variant="accent2">
            Daily + As Needed
          </ThemedText>
          <ThemedText size="md" style={styles.title}>
            My Supplements
          </ThemedText>
        </View>
        <Pressable accessibilityRole="button" onPress={onManage}>
          <ThemedText size="sm" variant="accent1">
            Manage
          </ThemedText>
        </Pressable>
      </View>

      <SupplementSection
        emptyLabel="Your daily stack will show up here."
        items={daily}
        onPrimaryAction={(id) => {
          const item = daily.find((entry) => entry.id === id);

          if (!item) {
            return;
          }

          onToggleDaily(id, !item.isLoggedToday);
        }}
        primaryAccessibilityLabel={(item) => `Toggle daily supplement ${item.label}`}
        primaryLabel={(item) => (item.isLoggedToday ? "Taken" : "Log")}
        title="Daily stack"
      />

      <SupplementSection
        emptyLabel="As-needed supplements will show up here."
        items={asNeeded}
        onPrimaryAction={(id) => onLogAsNeeded(id)}
        onSecondaryAction={(id) => onUndoAsNeeded(id)}
        primaryAccessibilityLabel={(item) => `Log as needed supplement ${item.label}`}
        primaryLabel={(item) => (item.isLoggedToday ? "Taken" : "Log")}
        secondaryLabel={(item) => (item.isLoggedToday ? "Undo" : null)}
        title="As needed"
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 36,
    minWidth: 56,
    paddingHorizontal: 12,
  },
  actionGap: {
    marginRight: 8,
  },
  eyebrow: {
    letterSpacing: 1.1,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    paddingRight: 12,
  },
  row: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  rowActions: {
    flexDirection: "row",
    flexShrink: 0,
    marginLeft: 12,
  },
  rowCopy: {
    flex: 1,
    minWidth: 0,
  },
  rowMetaLine: {
    alignItems: "center",
    flexDirection: "row",
    minWidth: 0,
  },
  rowGap: {
    marginBottom: 10,
  },
  rowServing: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    lineHeight: 20,
    marginBottom: 10,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    marginBottom: 12,
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  title: {
    marginBottom: 0,
  },
});
