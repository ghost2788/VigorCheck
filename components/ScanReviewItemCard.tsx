import React, { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { ScanDraftItem, scaleDraftItem } from "../lib/domain/scan";
import { useTheme } from "../lib/theme/ThemeProvider";
import { Card } from "./Card";
import { ThemedText } from "./ThemedText";

const PREP_METHOD_OPTIONS = ["grilled", "baked", "fried", "steamed", "raw", "mixed"] as const;

type ScanReviewItemCardProps = {
  expanded?: boolean;
  item: ScanDraftItem;
  onChange: (item: ScanDraftItem) => void;
  onRemove: () => void;
  onToggleExpand?: () => void;
};

function PrepPill({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  const { theme } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.prepPill,
        {
          backgroundColor: active ? theme.surfaceStrong : theme.surfaceSoft,
          borderColor: active ? theme.accent1 : theme.cardBorder,
        },
      ]}
    >
      <ThemedText size="sm" variant={active ? "accent1" : "secondary"}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

function ActionPill({
  destructive = false,
  label,
  onPress,
  testID,
}: {
  destructive?: boolean;
  label: string;
  onPress: () => void;
  testID?: string;
}) {
  const { theme } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.actionPill,
        {
          backgroundColor: theme.surfaceSoft,
          borderColor: destructive ? theme.accent2 : theme.cardBorder,
        },
      ]}
      testID={testID}
    >
      <ThemedText size="xs" variant={destructive ? "accent2" : "secondary"}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

function formatMacroSummary(item: ScanDraftItem) {
  return `${item.nutrition.calories} cal | Protein ${item.nutrition.protein}g | Carbs ${item.nutrition.carbs}g | Fiber ${item.nutrition.fiber}g`;
}

function formatServingSummary(item: ScanDraftItem) {
  return `${item.portionLabel} | ${item.estimatedGrams}g | ${item.multiplier.toFixed(2)}x`;
}

function NutritionStat({
  accentColor,
  label,
  value,
}: {
  accentColor: string;
  label: string;
  value: string;
}) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.nutritionStat,
        {
          backgroundColor: theme.surfaceSoft,
          borderColor: theme.cardBorder,
        },
      ]}
    >
      <ThemedText size="xs" style={{ color: accentColor }}>
        {label}
      </ThemedText>
      <ThemedText size="lg" style={styles.nutritionValue}>
        {value}
      </ThemedText>
    </View>
  );
}

export function ScanReviewItemCard({
  expanded = true,
  item,
  onChange,
  onRemove,
  onToggleExpand,
}: ScanReviewItemCardProps) {
  const { theme } = useTheme();
  const [showPrepMethods, setShowPrepMethods] = useState(false);
  const sourceLabel =
    item.source === "usda"
      ? "USDA"
      : item.source === "manual"
        ? "Manual"
        : item.source === "barcode_catalog"
          ? "Barcode"
          : "AI estimate";

  return (
    <Card style={styles.card} testID={`scan-review-item-${item.id}`}>
      <View style={styles.header}>
        <ThemedText size="xs" variant="tertiary" style={styles.sourceLabel}>
          {sourceLabel}
        </ThemedText>
      </View>
      <View style={styles.headerActions} testID={`scan-review-actions-${item.id}`}>
        {onToggleExpand ? (
          <ActionPill
            label={expanded ? "Hide details" : "Edit details"}
            onPress={onToggleExpand}
            testID={`scan-review-toggle-${item.id}`}
          />
        ) : null}
        <ActionPill destructive label="Remove" onPress={onRemove} />
      </View>

      {expanded ? (
        <View testID={`scan-review-item-${item.id}-expanded-content`}>
          <TextInput
            multiline
            onChangeText={(value) => onChange({ ...item, name: value })}
            placeholderTextColor={theme.textMuted}
            scrollEnabled={false}
            selectTextOnFocus={false}
            style={[
              styles.nameInput,
              {
                borderBottomColor: theme.cardBorder,
                color: theme.text,
              },
            ]}
            testID={`scan-review-name-input-${item.id}`}
            value={item.name}
          />

          <View
            style={[
              styles.servingCard,
              {
                backgroundColor: theme.surfaceSoft,
                borderColor: theme.cardBorder,
              },
            ]}
          >
            <View style={styles.servingCopy}>
              <ThemedText size="xs" variant="tertiary">
                Serving
              </ThemedText>
              <ThemedText size="sm" style={styles.servingLabel}>
                {item.portionLabel} | {item.estimatedGrams}g
              </ThemedText>
            </View>
            <View
              style={[
                styles.stepper,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.cardBorder,
                },
              ]}
            >
              <Pressable
                accessibilityRole="button"
                onPress={() => onChange(scaleDraftItem(item, item.multiplier - 0.25))}
                style={styles.stepperButton}
              >
                <ThemedText size="md">-</ThemedText>
              </Pressable>
              <ThemedText size="sm">{item.multiplier.toFixed(2)}x</ThemedText>
              <Pressable
                accessibilityRole="button"
                onPress={() => onChange(scaleDraftItem(item, item.multiplier + 0.25))}
                style={styles.stepperButton}
              >
                <ThemedText size="md">+</ThemedText>
              </Pressable>
            </View>
          </View>

          <View style={styles.nutritionGrid} testID={`scan-review-nutrition-grid-${item.id}`}>
            <NutritionStat
              accentColor={theme.metricCalories}
              label="Calories"
              value={`${item.nutrition.calories}`}
            />
            <NutritionStat
              accentColor={theme.metricProtein}
              label="Protein"
              value={`${item.nutrition.protein}g`}
            />
            <NutritionStat accentColor={theme.accent2} label="Carbs" value={`${item.nutrition.carbs}g`} />
            <NutritionStat
              accentColor={theme.metricNutrition}
              label="Fiber"
              value={`${item.nutrition.fiber}g`}
            />
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => setShowPrepMethods((value) => !value)}
            style={[
              styles.prepToggle,
              {
                backgroundColor: theme.surfaceSoft,
                borderColor: theme.cardBorder,
              },
            ]}
            testID={`scan-review-prep-toggle-${item.id}`}
          >
            <View>
              <ThemedText size="xs" variant="tertiary">
                Prep method
              </ThemedText>
              <ThemedText size="sm" variant="secondary">
                {item.prepMethod ? item.prepMethod : "Not set"}
              </ThemedText>
            </View>
            <ThemedText size="sm" variant="secondary">
              {showPrepMethods ? "Hide" : "Choose"}
            </ThemedText>
          </Pressable>

          {showPrepMethods ? (
            <View style={styles.prepRow} testID={`scan-review-prep-options-${item.id}`}>
              {PREP_METHOD_OPTIONS.map((option) => (
                <PrepPill
                  active={item.prepMethod === option}
                  key={option}
                  label={option}
                  onPress={() =>
                    onChange({ ...item, prepMethod: item.prepMethod === option ? undefined : option })
                  }
                />
              ))}
            </View>
          ) : null}
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          onPress={onToggleExpand}
          style={styles.collapsedBody}
          testID={`scan-review-item-${item.id}-collapsed-content`}
        >
          <ThemedText size="lg" numberOfLines={2} style={styles.collapsedName}>
            {item.name}
          </ThemedText>
          <ThemedText size="sm" variant="secondary" style={styles.collapsedMeta}>
            {formatServingSummary(item)}
          </ThemedText>
          <ThemedText size="sm" variant="secondary">
            {formatMacroSummary(item)}
          </ThemedText>
        </Pressable>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  actionPill: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 34,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  card: {
    marginBottom: 14,
  },
  collapsedBody: {
    paddingTop: 4,
  },
  collapsedMeta: {
    marginBottom: 8,
  },
  collapsedName: {
    marginBottom: 10,
  },
  header: {
    marginBottom: 8,
  },
  headerActions: {
    columnGap: 8,
    flexDirection: "row",
    justifyContent: "flex-start",
    marginBottom: 12,
  },
  nutritionGrid: {
    columnGap: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
    rowGap: 10,
  },
  nutritionStat: {
    borderRadius: 16,
    borderWidth: 1,
    flexGrow: 1,
    minWidth: "47%",
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  nutritionValue: {
    marginTop: 6,
  },
  nameInput: {
    borderBottomWidth: 1,
    fontSize: 24,
    fontWeight: "400",
    lineHeight: 28,
    marginBottom: 14,
    minHeight: 56,
    paddingBottom: 10,
    paddingTop: 0,
  },
  prepPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  prepRow: {
    columnGap: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 8,
  },
  prepToggle: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  servingCard: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  servingCopy: {
    flex: 1,
    marginRight: 12,
  },
  servingLabel: {
    marginTop: 3,
  },
  sourceLabel: {
    paddingTop: 8,
  },
  stepper: {
    alignItems: "center",
    columnGap: 10,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  stepperButton: {
    minWidth: 28,
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
});
