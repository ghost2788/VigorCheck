import { getDisplayedRingProgress } from "./homeInsight";
import type { HomeCaloriesShellState } from "../ui/homeAccordionShellPresentation";

export type HomeRingId = "calories" | "protein" | "carbs" | "fat";

export type HomeRingPresentation = {
  id: HomeRingId;
  progress: number;
  rewardGlow: boolean;
};

export type HomeRingWidgetPresentation = {
  rings: HomeRingPresentation[];
};

const RING_RENDER_ORDER: HomeRingId[] = ["calories", "protein", "carbs", "fat"];

type HomeRingDashboardFragment = {
  cards: {
    carbs: {
      rawProgressPercent: number;
    };
    calories: {
      rawProgressPercent: number;
    };
    fat: {
      rawProgressPercent: number;
    };
    protein: {
      rawProgressPercent: number;
    };
  };
  wellness: {
    rings: Record<
      HomeRingId,
      {
        rawProgressPercent: number;
        score: number;
      }
    >;
  };
};

function shouldShowRewardGlow({
  carbsShellState,
  caloriesShellState,
  dashboard,
  fatShellState,
  ringId,
}: {
  carbsShellState: HomeCaloriesShellState;
  caloriesShellState: HomeCaloriesShellState;
  dashboard: HomeRingDashboardFragment;
  fatShellState: HomeCaloriesShellState;
  ringId: HomeRingId;
}) {
  switch (ringId) {
    case "calories":
      return (
        dashboard.cards.calories.rawProgressPercent >= 95 && caloriesShellState !== "warning"
      );
    case "protein":
      return dashboard.cards.protein.rawProgressPercent >= 95;
    case "carbs":
      return dashboard.cards.carbs.rawProgressPercent >= 95 && carbsShellState !== "warning";
    case "fat":
      return dashboard.cards.fat.rawProgressPercent >= 95 && fatShellState !== "warning";
  }
}

export function buildHomeRingPresentation({
  carbsShellState,
  caloriesShellState,
  dashboard,
  fatShellState,
}: {
  carbsShellState: HomeCaloriesShellState;
  caloriesShellState: HomeCaloriesShellState;
  dashboard: HomeRingDashboardFragment;
  fatShellState: HomeCaloriesShellState;
}): HomeRingWidgetPresentation {
  return {
    rings: RING_RENDER_ORDER.map((id) => ({
      id,
      progress: getDisplayedRingProgress(dashboard.wellness.rings[id]),
      rewardGlow: shouldShowRewardGlow({
        carbsShellState,
        caloriesShellState,
        dashboard,
        fatShellState,
        ringId: id,
      }),
    })),
  };
}
