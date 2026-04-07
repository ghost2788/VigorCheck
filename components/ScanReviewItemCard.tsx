import React from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { MealType, MEAL_TYPE_OPTIONS } from "../lib/domain/meals";
import { NutrientProgressRow } from "../lib/domain/nutrientProgress";
import { ScanDraftItem, scaleDraftItem } from "../lib/domain/scan";
import { useTheme } from "../lib/theme/ThemeProvider";
import { Card } from "./Card";
import { NutrientProgressRows } from "./NutrientProgressRows";
import { ThemedText } from "./ThemedText";

const PREP_METHOD_OPTIONS = ["grilled", "baked", "fried", "steamed", "raw", "mixed"] as const;

type ScanReviewItemCardProps = {
  expanded?: boolean;
  item: ScanDraftItem;
  mealType?: MealType;
  nutritionRows?: NutrientProgressRow[];
  onChange: (item: ScanDraftItem) => void;
  onMealTypeChange?: (mealType: MealType) => void;
  onRemove: () => void;
  onToggleExpand?: () => void;
};

function formatCompactValue(value: number) {
  return Number.isInteger(value) ? value.toString() : value.toFixed(1);
}

function formatCollapsedMacroSummary(item: ScanDraftItem) {
  const parts = [
    item.nutrition.protein > 0 ? `${item.nutrition.protein}p` : null,
    item.nutrition.carbs > 0 ? `${item.nutrition.carbs}c` : null,
    item.nutrition.fat > 0 ? `${item.nutrition.fat}f` : null,
  ].filter((part): part is string => part !== null);

  return parts.length ? parts.join(" / ") : null;
}

function getSourceLabel(source: ScanDraftItem["source"]) {
  if (source === "usda") {
    return "USDA";
  }

  if (source === "manual") {
    return "Manual";
  }

  if (source === "barcode_catalog") {
    return "Barcode";
  }

  return "AI estimate";
}

function formatPrepMethodLabel(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function truncateOneDecimal(value: number) {
  return Math.floor(value * 10) / 10;
}

function formatFluidOunces(ml: number) {
  return formatCompactValue(truncateOneDecimal(ml / 29.5735));
}

function simplifyServingLabel(item: ScanDraftItem) {
  const trimmed = item.portionLabel.trim();

  if (!trimmed) {
    return "Serving";
  }

  if (trimmed === "Manual estimate") {
    return "Manual estimate";
  }

  if (/estimated/i.test(trimmed)) {
    return "Estimated portion";
  }

  const withoutPrefix = trimmed.replace(/^1 serving from label\s*/i, "").trim();
  const source = withoutPrefix || trimmed;
  const withoutOuterParens = source.replace(/^\(/, "").replace(/\)$/, "").trim();
  const withoutAmount = withoutOuterParens
    .replace(/\b\d+(?:\.\d+)?\s*(ml|g)\b/gi, "")
    .replace(/[(),]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (withoutAmount) {
    return withoutAmount;
  }

  if (/serving from label/i.test(trimmed)) {
    return "From label";
  }

  return trimmed;
}

function formatServingAmount(item: ScanDraftItem) {
  const amountLabel = `${formatCompactValue(item.estimatedGrams)} ${item.portionUnit}`;

  if (item.portionUnit === "ml") {
    return `${amountLabel} (${formatFluidOunces(item.estimatedGrams)} fl oz)`;
  }

  return amountLabel;
}

function formatServingMultiplier(multiplier: number) {
  return Number.isInteger(multiplier) ? `${multiplier}x` : `${multiplier.toFixed(2)}x`;
}

function OptionPill({
  active,
  label,
  onPress,
  testID,
}: {
  active: boolean;
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
        styles.optionPill,
        {
          backgroundColor: active ? theme.surfaceStrong : theme.surfaceSoft,
          borderColor: active ? theme.accent1 : theme.cardBorder,
        },
      ]}
      testID={testID}
    >
      <ThemedText size="sm" variant={active ? "accent1" : "secondary"}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

export function ScanReviewItemCard({
  expanded = true,
  item,
  mealType,
  nutritionRows = [],
  onChange,
  onMealTypeChange,
  onRemove,
  onToggleExpand,
}: ScanReviewItemCardProps) {
  const { theme } = useTheme();
  const sourceLabel = getSourceLabel(item.source);
  const accentColor =
    item.source === "usda"
      ? theme.accent1
      : item.source === "barcode_catalog"
        ? theme.accent2
        : item.source === "manual"
          ? theme.textTertiary
          : theme.metricNutrition;
  const calorieLabel = `${item.nutrition.calories} cal`;
  const collapsedMacroSummary = formatCollapsedMacroSummary(item);

  return (
    <Card style={styles.card} testID={`scan-review-item-${item.id}`}>
      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

      <View style={styles.contentWrap}>
        <Pressable
          accessibilityRole="button"
          onPress={onToggleExpand}
          style={styles.headerToggle}
          testID={`scan-review-header-toggle-${item.id}`}
        >
          <View style={styles.topRow}>
            <ThemedText numberOfLines={2} size="md" style={styles.itemName}>
              {item.name}
            </ThemedText>
            <View
              style={[
                styles.caloriePill,
                {
                  backgroundColor: theme.surfaceSoft,
                  borderColor: theme.cardBorder,
                },
              ]}
            >
              <ThemedText size="sm">{calorieLabel}</ThemedText>
            </View>
            <View
              style={[
                styles.chevron,
                {
                  borderColor: theme.textTertiary,
                  transform: [{ rotate: expanded ? "-135deg" : "45deg" }],
                },
              ]}
            />
          </View>

          <View
            style={styles.metaRow}
            testID={!expanded ? `scan-review-item-${item.id}-collapsed-content` : undefined}
          >
            <ThemedText size="xs" variant="tertiary">
              {sourceLabel}
            </ThemedText>
            <ThemedText size="xs" variant="muted">
              ·
            </ThemedText>
            <ThemedText size="xs" style={styles.metaWrap} variant="tertiary">
              {item.portionLabel}
            </ThemedText>
            {collapsedMacroSummary ? (
              <>
                <ThemedText size="xs" variant="muted">
                  ·
                </ThemedText>
                <ThemedText size="xs" variant="muted">
                  {collapsedMacroSummary}
                </ThemedText>
              </>
            ) : null}
          </View>
        </Pressable>

        {expanded ? (
          <View
            style={[
              styles.expanded,
              {
                borderTopColor: theme.cardBorder,
              },
            ]}
            testID={`scan-review-item-${item.id}-expanded-content`}
          >
            <View style={styles.renameSection}>
              <ThemedText size="xs" style={styles.sectionLabel} variant="tertiary">
                Rename
              </ThemedText>
              <TextInput
                multiline
                onChangeText={(value) => onChange({ ...item, name: value })}
                placeholderTextColor={theme.textMuted}
                scrollEnabled={false}
                selectTextOnFocus={false}
                style={[
                  styles.nameInput,
                  {
                    backgroundColor: theme.surfaceSoft,
                    borderColor: theme.cardBorder,
                    color: theme.text,
                  },
                ]}
                testID={`scan-review-name-input-${item.id}`}
                value={item.name}
              />
            </View>

            <View
              style={[
                styles.servingRow,
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
                  {simplifyServingLabel(item)}
                </ThemedText>
                <ThemedText size="sm" variant="secondary">
                  {formatServingAmount(item)}
                </ThemedText>
              </View>
              <View
                style={[
                  styles.stepper,
                  {
                    backgroundColor: theme.surfaceStrong,
                    borderColor: theme.cardBorder,
                  },
                ]}
              >
                <Pressable
                  accessibilityRole="button"
                  onPress={() => onChange(scaleDraftItem(item, Math.max(1, item.multiplier - 1)))}
                  style={styles.stepperButton}
                  testID={`scan-review-stepper-decrement-${item.id}`}
                >
                  <ThemedText size="md">-</ThemedText>
                </Pressable>
                <ThemedText size="sm">{formatServingMultiplier(item.multiplier)}</ThemedText>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => onChange(scaleDraftItem(item, item.multiplier + 1))}
                  style={styles.stepperButton}
                  testID={`scan-review-stepper-increment-${item.id}`}
                >
                  <ThemedText size="md">+</ThemedText>
                </Pressable>
              </View>
            </View>

            {nutritionRows.length ? (
              <View style={styles.nutritionSection} testID={`scan-review-nutrition-rows-${item.id}`}>
                <NutrientProgressRows
                  getAccentColor={(row) => {
                    if (row.key === "calories") {
                      return theme.metricCalories;
                    }

                    if (row.key === "protein") {
                      return theme.metricProtein;
                    }

                    if (row.key === "carbs") {
                      return theme.accent1;
                    }

                    if (row.key === "fat") {
                      return theme.accent2;
                    }

                    return theme.metricNutrition;
                  }}
                  presentationMode="plain"
                  rows={nutritionRows}
                  showDividers={false}
                />
              </View>
            ) : null}

            {mealType && onMealTypeChange ? (
              <View
                style={[
                  styles.inlineOptionGroup,
                  {
                    backgroundColor: theme.surfaceSoft,
                    borderColor: theme.cardBorder,
                  },
                ]}
                testID={`scan-review-meal-type-pills-${item.id}`}
              >
                <ThemedText size="xs" style={styles.sectionLabel} variant="tertiary">
                  Meal type
                </ThemedText>
                <View style={styles.optionWrap}>
                  {MEAL_TYPE_OPTIONS.map((option) => (
                    <OptionPill
                      active={mealType === option.value}
                      key={option.value}
                      label={option.label}
                      onPress={() => onMealTypeChange(option.value)}
                      testID={`scan-review-meal-type-pill-${item.id}-${option.value}`}
                    />
                  ))}
                </View>
              </View>
            ) : null}

            <View
              style={[
                styles.inlineOptionGroup,
                {
                  backgroundColor: theme.surfaceSoft,
                  borderColor: theme.cardBorder,
                },
              ]}
              testID={`scan-review-prep-options-${item.id}`}
            >
              <ThemedText size="xs" style={styles.sectionLabel} variant="tertiary">
                Prep method
              </ThemedText>
              <View style={styles.optionWrap}>
                {PREP_METHOD_OPTIONS.map((option) => (
                  <OptionPill
                    active={item.prepMethod === option}
                    key={option}
                    label={formatPrepMethodLabel(option)}
                    onPress={() =>
                      onChange({ ...item, prepMethod: item.prepMethod === option ? undefined : option })
                    }
                  />
                ))}
              </View>
            </View>

            <View
              style={[
                styles.actionRow,
                {
                  borderTopColor: theme.cardBorder,
                },
              ]}
              testID={`scan-review-actions-${item.id}`}
            >
              <Pressable onPress={onToggleExpand}>
                <ThemedText size="xs" style={[styles.actionText, { color: theme.accent1 }]}>
                  Hide details
                </ThemedText>
              </Pressable>
              <Pressable onPress={onRemove} testID={`scan-review-remove-${item.id}`}>
                <ThemedText size="xs" style={[styles.actionText, { color: theme.accent2 }]}>
                  Remove
                </ThemedText>
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  accentBar: {
    width: 4,
  },
  actionRow: {
    alignItems: "center",
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
    paddingTop: 12,
  },
  actionText: {
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  caloriePill: {
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  card: {
    flexDirection: "row",
    marginBottom: 14,
    overflow: "hidden",
    padding: 0,
  },
  chevron: {
    borderBottomWidth: 2,
    borderRightWidth: 2,
    height: 10,
    width: 10,
  },
  contentWrap: {
    flex: 1,
    minWidth: 0,
  },
  expanded: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerToggle: {
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inlineOptionGroup: {
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  itemName: {
    flex: 1,
    fontWeight: "500",
    marginRight: 10,
  },
  metaRow: {
    alignItems: "center",
    columnGap: 6,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  metaWrap: {
    flexShrink: 1,
  },
  nameInput: {
    borderRadius: 14,
    borderWidth: 1,
    fontSize: 16,
    fontWeight: "400",
    lineHeight: 22,
    minHeight: 60,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  nutritionSection: {
    marginBottom: 2,
    marginTop: 14,
  },
  optionPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  optionWrap: {
    columnGap: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 8,
  },
  renameSection: {
    marginBottom: 2,
  },
  sectionLabel: {
    marginBottom: 8,
  },
  servingCopy: {
    flex: 1,
    marginRight: 12,
  },
  servingLabel: {
    marginBottom: 2,
    marginTop: 2,
  },
  servingRow: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  stepper: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    columnGap: 10,
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  stepperButton: {
    minWidth: 28,
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  topRow: {
    alignItems: "center",
    flexDirection: "row",
  },
});
