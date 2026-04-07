export type HomeAccordionWarmShellState =
  | "default"
  | "warm_1"
  | "warm_2"
  | "warm_3";

export type HomeCaloriesShellState =
  | HomeAccordionWarmShellState
  | "warning";

const CALORIES_WARNING_THRESHOLD = 1.05;
const CALORIES_WARM_3_THRESHOLD = 0.9;
const CALORIES_WARM_2_THRESHOLD = 0.6;
const CALORIES_WARM_1_THRESHOLD = 0.3;

export function resolveHomeAccordionWarmShellState(
  progressRatio: number
): HomeAccordionWarmShellState {
  if (!Number.isFinite(progressRatio) || progressRatio <= 0) {
    return "default";
  }

  if (progressRatio >= CALORIES_WARM_3_THRESHOLD) {
    return "warm_3";
  }

  if (progressRatio >= CALORIES_WARM_2_THRESHOLD) {
    return "warm_2";
  }

  if (progressRatio >= CALORIES_WARM_1_THRESHOLD) {
    return "warm_1";
  }

  return "default";
}

export function resolveHomeCaloriesShellState(
  progressRatio: number
): HomeCaloriesShellState {
  if (!Number.isFinite(progressRatio) || progressRatio <= 0) {
    return "default";
  }

  if (progressRatio > CALORIES_WARNING_THRESHOLD) {
    return "warning";
  }

  return resolveHomeAccordionWarmShellState(progressRatio);
}

export function getHomeCaloriesShellWarningAccent(mode: "dark" | "light") {
  return mode === "light" ? "#94443A" : "#D17A6E";
}
