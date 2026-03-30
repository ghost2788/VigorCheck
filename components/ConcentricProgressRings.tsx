import React from "react";
import { StyleSheet, View } from "react-native";
import { getActiveRingSegments } from "../lib/domain/progress";
import { useTheme } from "../lib/theme/ThemeProvider";

type RingDefinition = {
  color: string;
  diameter: number;
  progress: number;
  strokeWidth: number;
};

type ConcentricProgressRingsProps = {
  children: React.ReactNode;
  rings: RingDefinition[];
  size: number;
};

const SEGMENT_COUNT = 48;

export function ConcentricProgressRings({
  children,
  rings,
  size,
}: ConcentricProgressRingsProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { height: size, width: size }]}>
      {rings.map((ring) => {
        const segmentSize = Math.max(4, ring.strokeWidth - 2);
        const center = ring.diameter / 2;
        const radius = center - segmentSize / 2;
        const activeSegments = getActiveRingSegments(ring.progress, SEGMENT_COUNT);

        return (
          <View
            key={`${ring.color}-${ring.diameter}`}
            pointerEvents="none"
            style={[styles.ringLayer, { height: ring.diameter, width: ring.diameter }]}
          >
            {Array.from({ length: SEGMENT_COUNT }, (_, index) => {
              const angle = ((index / SEGMENT_COUNT) * 360 - 90) * (Math.PI / 180);
              const left = center + Math.cos(angle) * radius - segmentSize / 2;
              const top = center + Math.sin(angle) * radius - segmentSize / 2;

              return (
                <View
                  key={index}
                  style={[
                    styles.segment,
                    {
                      backgroundColor: index < activeSegments ? ring.color : theme.ringTrack,
                      borderRadius: segmentSize / 2,
                      height: segmentSize,
                      left,
                      top,
                      width: segmentSize,
                    },
                  ]}
                />
              );
            })}
          </View>
        );
      })}

      <View style={styles.centerContent}>{children}</View>
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
    position: "absolute",
  },
  segment: {
    position: "absolute",
  },
});
