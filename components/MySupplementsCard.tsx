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
  primaryLabel,
  secondaryLabel,
  title,
}: {
  emptyLabel: string;
  items: MySupplementCardItem[];
  onPrimaryAction: (id: string) => void;
  onSecondaryAction?: (id: string) => void;
  primaryLabel: (item: MySupplementCardItem) => string;
  secondaryLabel?: (item: MySupplementCardItem) => string | null;
  title: string;
}) {
  const { theme } = useTheme();

  return (
    <View style={styles.section}>
      <ThemedText size="sm" style={styles.sectionTitle}>
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
              <ThemedText numberOfLines={1} size="sm">
                {item.label}
              </ThemedText>
              <ThemedText numberOfLines={1} size="sm" variant="secondary">
                {item.servingLabel}
              </ThemedText>
            </View>

            <View style={styles.rowActions}>
              {secondaryLabel && onSecondaryAction && secondaryLabel(item) ? (
                <Pressable
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
                accessibilityRole="button"
                onPress={() => onPrimaryAction(item.id)}
                style={[
                  styles.actionButton,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.cardBorder,
                  },
                ]}
              >
                <ThemedText size="sm" style={{ color: theme.accent1 }}>
                  {primaryLabel(item)}
                </ThemedText>
              </Pressable>
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
        <ThemedText size="sm" style={styles.title}>
          My Supplements
        </ThemedText>
        <Pressable accessibilityRole="button" onPress={onManage}>
          <ThemedText size="sm" variant="accent1">
            Manage supplements
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
        primaryLabel={(item) => (item.isLoggedToday ? "Taken" : "Log")}
        title="Daily stack"
      />

      <SupplementSection
        emptyLabel="As-needed supplements will show up here."
        items={asNeeded}
        onPrimaryAction={(id) => onLogAsNeeded(id)}
        onSecondaryAction={(id) => onUndoAsNeeded(id)}
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
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  row: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  rowActions: {
    flexDirection: "row",
  },
  rowCopy: {
    flex: 1,
    minWidth: 0,
    paddingRight: 12,
  },
  rowGap: {
    marginBottom: 10,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  title: {
    marginBottom: 0,
  },
});
