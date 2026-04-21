export const APP_ICON_BACKGROUND = {
  end: "#15131a",
  start: "#1a1814",
} as const;

export const APP_ICON_DOT_COUNT = 48;
export const APP_ICON_GLOW_OPACITY = 0.15;
export const APP_ICON_GLOW_SCALE = 1.85;

export const APP_ICON_RINGS = [
  { color: "#d8c49a", dotSizeRatio: 0.02, id: "calories", radiusRatio: 0.4 },
  { color: "#5ebaa9", dotSizeRatio: 0.018, id: "protein", radiusRatio: 0.31 },
  { color: "#78a0c8", dotSizeRatio: 0.015, id: "carbs", radiusRatio: 0.22 },
  { color: "#d38a3a", dotSizeRatio: 0.013, id: "fat", radiusRatio: 0.13 },
] as const;

export type AppIconRingId = (typeof APP_ICON_RINGS)[number]["id"];

export type AppIconDotLayout = {
  angleDegrees: number;
  centerX: number;
  centerY: number;
  color: string;
  glowSize: number;
  index: number;
  size: number;
};

export type AppIconRingLayout = {
  color: string;
  dots: AppIconDotLayout[];
  id: AppIconRingId;
};

export function getAppIconDotAngle(index: number) {
  return (index / APP_ICON_DOT_COUNT) * 360 - 90;
}

export function buildAppIconRingLayouts(
  canvasSize: number,
  glowScale = APP_ICON_GLOW_SCALE
): AppIconRingLayout[] {
  const center = canvasSize / 2;

  return APP_ICON_RINGS.map((ring) => {
    const radius = canvasSize * ring.radiusRatio;
    const size = canvasSize * ring.dotSizeRatio;

    return {
      color: ring.color,
      dots: Array.from({ length: APP_ICON_DOT_COUNT }, (_, index) => {
        const angleDegrees = getAppIconDotAngle(index);
        const angleRadians = (angleDegrees * Math.PI) / 180;

        return {
          angleDegrees,
          centerX: Number((center + Math.cos(angleRadians) * radius).toFixed(4)),
          centerY: Number((center + Math.sin(angleRadians) * radius).toFixed(4)),
          color: ring.color,
          glowSize: Number((size * glowScale).toFixed(4)),
          index,
          size: Number(size.toFixed(4)),
        };
      }),
      id: ring.id,
    };
  });
}
