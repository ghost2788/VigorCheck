import React from "react";
import { StyleSheet, View } from "react-native";
import { getActiveRingSegments } from "../lib/domain/progress";
import { useTheme } from "../lib/theme/ThemeProvider";

export type RingDefinition = {
  color: string;
  diameter: number;
  id: string;
  progress: number;
  rewardGlow?: boolean;
  strokeWidth: number;
};

type ConcentricProgressRingsProps = {
  children: React.ReactNode;
  rings: RingDefinition[];
  size: number;
};

const SEGMENT_COUNT = 48;

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getSegmentPosition({
  center,
  index,
  radius,
  segmentSize,
}: {
  center: number;
  index: number;
  radius: number;
  segmentSize: number;
}) {
  const angle = ((index / SEGMENT_COUNT) * 360 - 90) * (Math.PI / 180);

  return {
    left: center + Math.cos(angle) * radius - segmentSize / 2,
    top: center + Math.sin(angle) * radius - segmentSize / 2,
  };
}

function RingTrackLayer({
  center,
  radius,
  ring,
  segmentSize,
}: {
  center: number;
  radius: number;
  ring: RingDefinition;
  segmentSize: number;
}) {
  const { theme } = useTheme();

  return (
    <View
      pointerEvents="none"
      style={[styles.segmentLayer, { height: ring.diameter, width: ring.diameter }]}
      testID={`concentric-ring-track-layer-${ring.id}`}
    >
      {Array.from({ length: SEGMENT_COUNT }, (_, index) => {
        const { left, top } = getSegmentPosition({
          center,
          index,
          radius,
          segmentSize,
        });

        return (
          <View
            key={`track-${index}`}
            style={[
              styles.trackSegment,
              {
                backgroundColor: theme.ringTrack,
                borderRadius: segmentSize / 2,
                height: segmentSize,
                left,
                top,
                width: segmentSize,
              },
            ]}
            testID={`concentric-ring-track-segment-${ring.id}-${index}`}
          />
        );
      })}
    </View>
  );
}

function RingActiveLayer({
  activeSegments,
  center,
  radius,
  ring,
  segmentSize,
}: {
  activeSegments: number;
  center: number;
  radius: number;
  ring: RingDefinition;
  segmentSize: number;
}) {
  return (
    <View
      pointerEvents="none"
      style={[styles.segmentLayer, { height: ring.diameter, width: ring.diameter }]}
      testID={`concentric-ring-active-layer-${ring.id}`}
    >
      {Array.from({ length: activeSegments }, (_, index) => {
        const { left, top } = getSegmentPosition({
          center,
          index,
          radius,
          segmentSize,
        });

        return (
          <View
            key={`active-${index}`}
            style={[
              styles.activeSegment,
              {
                backgroundColor: ring.color,
                borderRadius: segmentSize / 2,
                height: segmentSize,
                left,
                top,
                width: segmentSize,
              },
            ]}
            testID={`concentric-ring-active-segment-${ring.id}-${index}`}
          />
        );
      })}
    </View>
  );
}

function RingRewardGlowLayer({
  activeSegments,
  center,
  radius,
  ring,
  segmentSize,
}: {
  activeSegments: number;
  center: number;
  radius: number;
  ring: RingDefinition;
  segmentSize: number;
}) {
  const glowSegmentSize = segmentSize + 4;

  return (
    <View
      pointerEvents="none"
      style={[styles.segmentLayer, { height: ring.diameter, width: ring.diameter }]}
      testID={`concentric-ring-reward-glow-${ring.id}`}
    >
      {Array.from({ length: activeSegments }, (_, index) => {
        const { left, top } = getSegmentPosition({
          center,
          index,
          radius,
          segmentSize: glowSegmentSize,
        });

        return (
          <View
            key={`reward-glow-${index}`}
            style={[
              styles.rewardGlowSegment,
              {
                backgroundColor: hexToRgba(ring.color, 0.24),
                borderRadius: glowSegmentSize / 2,
                height: glowSegmentSize,
                left,
                top,
                width: glowSegmentSize,
              },
            ]}
            testID={`concentric-ring-reward-glow-segment-${ring.id}-${index}`}
          />
        );
      })}
    </View>
  );
}

export function ConcentricProgressRings({
  children,
  rings,
  size,
}: ConcentricProgressRingsProps) {
  return (
    <View style={[styles.container, { height: size, width: size }]}>
      {rings.map((ring) => {
        const segmentSize = Math.max(4, ring.strokeWidth - 2);
        const center = ring.diameter / 2;
        const radius = center - segmentSize / 2;
        const activeSegments = getActiveRingSegments(ring.progress, SEGMENT_COUNT);

        return (
          <View
            key={ring.id}
            pointerEvents="none"
            style={[styles.ringLayer, { height: ring.diameter, width: ring.diameter }]}
            testID={`concentric-ring-layer-${ring.id}`}
          >
            {ring.rewardGlow ? (
              <RingRewardGlowLayer
                activeSegments={activeSegments}
                center={center}
                radius={radius}
                ring={ring}
                segmentSize={segmentSize}
              />
            ) : null}
            <RingTrackLayer
              center={center}
              radius={radius}
              ring={ring}
              segmentSize={segmentSize}
            />
            <RingActiveLayer
              activeSegments={activeSegments}
              center={center}
              radius={radius}
              ring={ring}
              segmentSize={segmentSize}
            />
          </View>
        );
      })}

      <View style={styles.centerContent} testID="concentric-ring-center-content">
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centerContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  ringLayer: {
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
  },
  rewardGlowSegment: {
    position: "absolute",
  },
  segmentLayer: {
    position: "absolute",
  },
  trackSegment: {
    position: "absolute",
  },
  activeSegment: {
    position: "absolute",
  },
});
