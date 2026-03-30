export function normalizeProgress(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, value));
}

export function getRingCircumference(radius: number) {
  return 2 * Math.PI * radius;
}

export function getRingStrokeDashoffset(progress: number, radius: number) {
  const normalized = normalizeProgress(progress);
  const circumference = getRingCircumference(radius);

  return circumference * (1 - normalized / 100);
}

export function getActiveRingSegments(progress: number, segmentCount: number) {
  return Math.round((normalizeProgress(progress) / 100) * segmentCount);
}
