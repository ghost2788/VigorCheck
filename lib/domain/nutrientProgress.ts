import { NutrientDetailGroup } from "./nutrients";

export type NutrientProgressRow = {
  goalKind: "goal" | "maximum" | "soft_maximum";
  key: string;
  label: string;
  percent: number;
  progressRatio: number;
  rowKind: "macro" | "nutrient";
  target: number;
  unit: string;
  value: number;
};

const PRIMARY_NUTRIENT_ORDER = ["fiber", "potassium", "calcium", "iron", "vitaminD", "vitaminC"];

export function resolveProgressRatio(value: number, target: number | null | undefined) {
  if (typeof target !== "number" || !Number.isFinite(target) || target <= 0) {
    return 0;
  }

  return value / target;
}

export function formatNutrientProgressLabel(key: string) {
  if (key === "vitaminC") {
    return "Vitamin C";
  }

  if (key === "vitaminD") {
    return "Vitamin D";
  }

  if (key === "omega3") {
    return "Omega-3";
  }

  return key.charAt(0).toUpperCase() + key.slice(1);
}

export function buildExpandedNutrientProgressRows({
  detailGroups,
}: {
  detailGroups?: NutrientDetailGroup[];
}): NutrientProgressRow[] {
  return (detailGroups ?? [])
    .flatMap((group, groupIndex) =>
      group.nutrients.map((nutrient, nutrientIndex) => {
        const goalKind: NutrientProgressRow["goalKind"] =
          nutrient.targetKind === "maximum" ? "maximum" : "goal";

        return {
          groupIndex,
          goalKind,
          key: nutrient.key,
          label: nutrient.label,
          percent: nutrient.percent,
          progressRatio: resolveProgressRatio(nutrient.value, nutrient.target),
          rowKind: "nutrient" as const,
          sortIndex:
            PRIMARY_NUTRIENT_ORDER.indexOf(nutrient.key) >= 0
              ? PRIMARY_NUTRIENT_ORDER.indexOf(nutrient.key)
              : PRIMARY_NUTRIENT_ORDER.length + groupIndex * 100 + nutrientIndex,
          target: nutrient.target,
          unit: nutrient.unit,
          value: nutrient.value,
        };
      })
    )
    .sort((left, right) => left.sortIndex - right.sortIndex)
    .map(({ groupIndex: _groupIndex, sortIndex: _sortIndex, ...row }) => row);
}
