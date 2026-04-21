import type { ThemeMode } from "../theme/colors";

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function getWeeklyWellnessBandColor({
  mode,
  score,
}: {
  mode: ThemeMode;
  score: number;
}) {
  const normalizedScore = clampScore(score);

  if (normalizedScore <= 25) {
    return mode === "dark" ? "#B86A62" : "#A85B52";
  }

  if (normalizedScore <= 50) {
    return mode === "dark" ? "#C98A4A" : "#B87534";
  }

  if (normalizedScore <= 75) {
    return mode === "dark" ? "#D2B46A" : "#A98A42";
  }

  return mode === "dark" ? "#63AF88" : "#468766";
}
