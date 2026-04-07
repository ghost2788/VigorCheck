import React from "react";
import { LayoutChangeEvent, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";
import { useTheme } from "../lib/theme/ThemeProvider";
import { useReducedMotionPreference } from "../lib/ui/useReducedMotionPreference";

export type WellnessAccordionShellEffectState =
  | "default"
  | "warm_1"
  | "warm_2"
  | "warm_3"
  | "warning";

export type WellnessAccordionShellEffectConfig = {
  accentColor: string;
  state: WellnessAccordionShellEffectState;
  warningColor?: string;
};

export type WellnessAccordionShellContainerColors = {
  backgroundColor: string;
  borderColor: string;
  shadowColor: string;
};

type SvgStopSpec = {
  color: string;
  opacity: number;
};

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function blendHexColors(hex: string, mixHex: string, ratio: number) {
  const clampRatio = Math.max(0, Math.min(1, ratio));
  const base = hex.replace("#", "");
  const mix = mixHex.replace("#", "");
  const r = Math.round(
    parseInt(base.slice(0, 2), 16) * (1 - clampRatio) +
      parseInt(mix.slice(0, 2), 16) * clampRatio
  );
  const g = Math.round(
    parseInt(base.slice(2, 4), 16) * (1 - clampRatio) +
      parseInt(mix.slice(2, 4), 16) * clampRatio
  );
  const b = Math.round(
    parseInt(base.slice(4, 6), 16) * (1 - clampRatio) +
      parseInt(mix.slice(4, 6), 16) * clampRatio
  );

  return `#${[r, g, b]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("")}`;
}

function svgStop(color: string, opacity: number): SvgStopSpec {
  return { color, opacity };
}

export function getWellnessAccordionShellContainerColors(
  effect: WellnessAccordionShellEffectConfig,
  mode: "dark" | "light"
): WellnessAccordionShellContainerColors | null {
  const resolvedAccentColor =
    effect.state === "warning" ? effect.warningColor ?? effect.accentColor : effect.accentColor;

  if (effect.state === "warning") {
    return {
      backgroundColor: hexToRgba(resolvedAccentColor, mode === "light" ? 0.06 : 0.08),
      borderColor: hexToRgba(resolvedAccentColor, mode === "light" ? 0.2 : 0.24),
      shadowColor: resolvedAccentColor,
    };
  }

  if (effect.state === "warm_3") {
    return {
      backgroundColor: hexToRgba(effect.accentColor, mode === "light" ? 0.05 : 0.06),
      borderColor: hexToRgba(effect.accentColor, mode === "light" ? 0.18 : 0.22),
      shadowColor: effect.accentColor,
    };
  }

  if (effect.state === "warm_2") {
    return {
      backgroundColor: hexToRgba(effect.accentColor, mode === "light" ? 0.04 : 0.045),
      borderColor: hexToRgba(effect.accentColor, mode === "light" ? 0.14 : 0.16),
      shadowColor: effect.accentColor,
    };
  }

  if (effect.state === "warm_1") {
    return {
      backgroundColor: hexToRgba(effect.accentColor, mode === "light" ? 0.025 : 0.03),
      borderColor: hexToRgba(effect.accentColor, mode === "light" ? 0.1 : 0.12),
      shadowColor: effect.accentColor,
    };
  }

  return null;
}

export function WellnessAccordionShellEffect({
  effect,
  itemKey,
}: {
  effect: WellnessAccordionShellEffectConfig;
  itemKey: string;
}) {
  const { mode } = useTheme();
  const reduceMotion = useReducedMotionPreference();
  const [shellWidth, setShellWidth] = React.useState(280);
  const sweepAnimation = useSharedValue(0);
  const pulseAnimation = useSharedValue(0);
  const emberAnimation = useSharedValue(0);
  const gradientIds = React.useMemo(
    () => ({
      activeBase: `shell-active-base-${itemKey}`,
      activeTopVeil: `shell-active-top-veil-${itemKey}`,
      activeChamberGlow: `shell-active-chamber-glow-${itemKey}`,
      chamberCore: `shell-chamber-core-${itemKey}`,
      defaultLowerGlow: `shell-default-lower-glow-${itemKey}`,
      defaultTopVeil: `shell-default-top-veil-${itemKey}`,
      band: `shell-band-${itemKey}`,
      sweep: `shell-sweep-${itemKey}`,
      ember: `shell-ember-${itemKey}`,
      warningField: `shell-warning-field-${itemKey}`,
    }),
    [itemKey]
  );

  const resolvedAccentColor =
    effect.state === "warning" ? effect.warningColor ?? effect.accentColor : effect.accentColor;
  const isWarm1 = effect.state === "warm_1";
  const isWarm2 = effect.state === "warm_2";
  const isWarm3 = effect.state === "warm_3";
  const isWarning = effect.state === "warning";
  const warmLevel = isWarm3 ? 3 : isWarm2 ? 2 : isWarm1 ? 1 : 0;
  const isWarmState = warmLevel > 0;
  const sweepWidth = Math.max(132, shellWidth * 0.4);
  const warmAccent = effect.accentColor;
  const emberAccent = blendHexColors(
    effect.accentColor,
    mode === "light" ? "#FFFFFF" : "#FFD39D",
    mode === "light" ? 0.24 : 0.32
  );
  const warningHotAccent = mode === "light" ? "#D95149" : "#FF5349";

  const activeBaseHue = isWarning ? resolvedAccentColor : warmAccent;
  const activeBaseStart = svgStop(
    activeBaseHue,
    isWarning
      ? mode === "light"
        ? 0.03
        : 0.02
      : warmLevel === 3
        ? mode === "light"
          ? 0.025
          : 0.018
        : warmLevel === 2
          ? mode === "light"
            ? 0.02
            : 0.014
          : mode === "light"
            ? 0.014
            : 0.01
  );
  const activeBaseMid = svgStop(
    activeBaseHue,
    isWarning
      ? mode === "light"
        ? 0.008
        : 0.006
      : warmLevel === 3
        ? mode === "light"
          ? 0.006
          : 0.005
        : warmLevel === 2
          ? mode === "light"
            ? 0.005
            : 0.004
          : mode === "light"
            ? 0.004
            : 0.003
  );
  const activeTopVeilStart = svgStop("#FFFFFF", mode === "light" ? 0.03 : 0.012);
  const activeTopVeilEnd = svgStop("#FFFFFF", 0);
  const activeCoreMid = svgStop(
    activeBaseHue,
    isWarning
      ? mode === "light"
        ? 0.012
        : 0.01
      : warmLevel === 3
        ? mode === "light"
          ? 0.01
          : 0.008
        : warmLevel === 2
          ? mode === "light"
            ? 0.008
            : 0.006
          : mode === "light"
            ? 0.007
            : 0.005
  );
  const activeCoreEnd = svgStop(
    isWarning ? warningHotAccent : warmAccent,
    isWarning
      ? mode === "light"
        ? 0.06
        : 0.05
      : warmLevel === 3
        ? mode === "light"
          ? 0.06
          : 0.05
        : warmLevel === 2
          ? mode === "light"
            ? 0.045
            : 0.038
          : mode === "light"
            ? 0.038
            : 0.032
  );
  const activeCoreTransparent = svgStop(activeBaseHue, 0);
  const activeChamberGlow = svgStop(
    isWarning ? warningHotAccent : warmAccent,
    isWarning
      ? mode === "light"
        ? 0.06
        : 0.06
      : warmLevel === 3
        ? mode === "light"
          ? 0.06
          : 0.06
        : warmLevel === 2
          ? mode === "light"
            ? 0.045
            : 0.05
          : mode === "light"
            ? 0.036
            : 0.042
  );
  const activeChamberGlowTransparent = svgStop(
    isWarning ? warningHotAccent : warmAccent,
    0
  );
  const defaultTopVeilStart = svgStop("#FFFFFF", mode === "light" ? 0.045 : 0.018);
  const defaultTopVeilEnd = svgStop("#FFFFFF", 0);
  const defaultLowerGlowCore = svgStop(
    effect.accentColor,
    mode === "light" ? 0.06 : 0.08
  );
  const defaultLowerGlowEdge = svgStop(
    effect.accentColor,
    mode === "light" ? 0.02 : 0.03
  );
  const defaultLowerGlowTransparent = svgStop(effect.accentColor, 0);

  React.useEffect(() => {
    if (isWarm3 && !reduceMotion) {
      sweepAnimation.value = 0;
      sweepAnimation.value = withRepeat(
        withTiming(1, {
          duration: 5300,
          easing: Easing.linear,
        }),
        -1,
        false
      );
      return;
    }

    sweepAnimation.value = 0;
  }, [isWarm3, reduceMotion, sweepAnimation]);

  React.useEffect(() => {
    if (isWarning && !reduceMotion) {
      pulseAnimation.value = 0;
      pulseAnimation.value = withRepeat(
        withTiming(1, {
          duration: 2800,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      );
      return;
    }

    pulseAnimation.value = 0;
  }, [isWarning, pulseAnimation, reduceMotion]);

  React.useEffect(() => {
    if ((warmLevel >= 2 || isWarning) && !reduceMotion) {
      emberAnimation.value = 0;
      emberAnimation.value = withRepeat(
        withTiming(1, {
          duration: isWarning ? 2400 : 2800,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      );
      return;
    }

    emberAnimation.value = 0;
  }, [emberAnimation, isWarning, reduceMotion, warmLevel]);

  const sweepStyle = useAnimatedStyle(() => ({
    opacity: 0.12 + sweepAnimation.value * 0.2,
    transform: [
      {
        translateX:
          -sweepWidth + sweepAnimation.value * (shellWidth + sweepWidth * 1.7),
      },
      { rotate: "-14deg" },
    ],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: 0.24 + pulseAnimation.value * 0.18,
    transform: [{ scale: 0.985 + pulseAnimation.value * 0.035 }],
  }));

  const emberStyle = useAnimatedStyle(() => ({
    opacity: reduceMotion
      ? isWarning
        ? 0.46
        : warmLevel === 2
          ? 0.26
          : 0.34
      : (isWarning ? 0.3 : warmLevel === 2 ? 0.16 : 0.24) +
        emberAnimation.value * (isWarning ? 0.22 : warmLevel === 2 ? 0.12 : 0.18),
  }));

  const handleLayout = React.useCallback((event: LayoutChangeEvent) => {
    setShellWidth(event.nativeEvent.layout.width || 280);
  }, []);

  const heatBandHue = isWarning ? warningHotAccent : warmAccent;
  const heatBandColor = svgStop(
    heatBandHue,
    isWarning
      ? mode === "light"
        ? 0.84
        : 0.92
      : warmLevel === 3
        ? mode === "light"
          ? 0.76
          : 0.88
        : warmLevel === 2
          ? mode === "light"
            ? 0.54
            : 0.64
          : mode === "light"
            ? 0.34
            : 0.42
  );
  const heatBandSoft = svgStop(
    isWarning ? resolvedAccentColor : warmAccent,
    warmLevel === 3 ? 0.36 : warmLevel === 2 ? 0.24 : 0.14
  );
  const heatBandTransparent = svgStop(
    isWarning ? resolvedAccentColor : warmAccent,
    0
  );
  const heatBandGlow = isWarning
    ? hexToRgba(resolvedAccentColor, mode === "light" ? 0.16 : 0.26)
    : hexToRgba(
        warmAccent,
        warmLevel === 3
          ? mode === "light"
            ? 0.12
            : 0.22
          : warmLevel === 2
          ? mode === "light"
            ? 0.08
            : 0.14
          : mode === "light"
            ? 0.04
            : 0.08
      );
  const sweepSoft = svgStop("#FFF4DA", 0.04);
  const sweepPeak = svgStop("#FFC474", mode === "light" ? 0.2 : 0.3);
  const sweepTransparent = svgStop("#FFF4DA", 0);
  const emberCore = svgStop(
    isWarning ? warningHotAccent : emberAccent,
    isWarning ? (mode === "light" ? 0.7 : 0.82) : mode === "light" ? 0.58 : 0.8
  );
  const emberEdge = svgStop(
    isWarning ? warningHotAccent : emberAccent,
    isWarning ? (mode === "light" ? 0.18 : 0.28) : mode === "light" ? 0.12 : 0.2
  );
  const emberTransparent = svgStop(isWarning ? warningHotAccent : emberAccent, 0);
  const warningFieldStart = svgStop(
    resolvedAccentColor,
    mode === "light" ? 0.08 : 0.12
  );
  const warningFieldEnd = svgStop(resolvedAccentColor, 0);
  const warningPulseStart = svgStop(
    warningHotAccent,
    mode === "light" ? 0.12 : 0.16
  );
  const warningPulseEnd = svgStop(warningHotAccent, 0);

  return (
    <View
      onLayout={handleLayout}
      pointerEvents="none"
      style={styles.layer}
      testID={`wellness-accordion-shell-layer-${itemKey}`}
    >
      {isWarmState || isWarning ? (
        <Svg height="100%" preserveAspectRatio="none" style={styles.svgLayer} width="100%">
          <Defs>
            <SvgLinearGradient id={gradientIds.activeBase} x1="0%" x2="0%" y1="0%" y2="100%">
              <Stop offset="0%" stopColor={activeBaseStart.color} stopOpacity={activeBaseStart.opacity} />
              <Stop offset="40%" stopColor={activeBaseMid.color} stopOpacity={activeBaseMid.opacity} />
              <Stop offset="75%" stopColor={activeBaseMid.color} stopOpacity={activeBaseMid.opacity} />
              <Stop offset="100%" stopColor={activeBaseHue} stopOpacity={0} />
            </SvgLinearGradient>
            <SvgLinearGradient id={gradientIds.activeTopVeil} x1="0%" x2="0%" y1="0%" y2="100%">
              <Stop offset="0%" stopColor={activeTopVeilStart.color} stopOpacity={activeTopVeilStart.opacity} />
              <Stop offset="100%" stopColor={activeTopVeilEnd.color} stopOpacity={activeTopVeilEnd.opacity} />
            </SvgLinearGradient>
            <RadialGradient id={gradientIds.activeChamberGlow} cx="50%" cy="112%" r="56%">
              <Stop offset="0%" stopColor={activeChamberGlow.color} stopOpacity={activeChamberGlow.opacity} />
              <Stop offset="44%" stopColor={activeChamberGlow.color} stopOpacity={activeChamberGlow.opacity} />
              <Stop offset="100%" stopColor={activeChamberGlowTransparent.color} stopOpacity={activeChamberGlowTransparent.opacity} />
            </RadialGradient>
          </Defs>
          <Rect fill={`url(#${gradientIds.activeBase})`} height="100%" width="100%" x="0" y="0" />
          <Rect fill={`url(#${gradientIds.activeTopVeil})`} height="36%" width="100%" x="0" y="0" />
          <Rect
            fill={`url(#${gradientIds.activeChamberGlow})`}
            height="100%"
            width="100%"
            x="0"
            y="0"
          />
        </Svg>
      ) : (
        <>
          <View
            style={styles.defaultTopVeil}
            testID={`wellness-accordion-shell-default-top-veil-${itemKey}`}
          >
            <Svg height="100%" preserveAspectRatio="none" style={styles.svgLayer} width="100%">
              <Defs>
                <SvgLinearGradient id={gradientIds.defaultTopVeil} x1="0%" x2="0%" y1="0%" y2="100%">
                  <Stop offset="0%" stopColor={defaultTopVeilStart.color} stopOpacity={defaultTopVeilStart.opacity} />
                  <Stop offset="100%" stopColor={defaultTopVeilEnd.color} stopOpacity={defaultTopVeilEnd.opacity} />
                </SvgLinearGradient>
              </Defs>
              <Rect fill={`url(#${gradientIds.defaultTopVeil})`} height="100%" width="100%" x="0" y="0" />
            </Svg>
          </View>

          <View
            style={styles.defaultLowerGlow}
            testID={`wellness-accordion-shell-default-lower-glow-${itemKey}`}
          >
            <Svg height="100%" preserveAspectRatio="none" style={styles.svgLayer} width="100%">
              <Defs>
                <RadialGradient id={gradientIds.defaultLowerGlow} cx="50%" cy="115%" r="56%">
                  <Stop offset="0%" stopColor={defaultLowerGlowCore.color} stopOpacity={defaultLowerGlowCore.opacity} />
                  <Stop offset="44%" stopColor={defaultLowerGlowEdge.color} stopOpacity={defaultLowerGlowEdge.opacity} />
                  <Stop offset="100%" stopColor={defaultLowerGlowTransparent.color} stopOpacity={defaultLowerGlowTransparent.opacity} />
                </RadialGradient>
              </Defs>
              <Rect fill={`url(#${gradientIds.defaultLowerGlow})`} height="100%" width="100%" x="0" y="0" />
            </Svg>
          </View>
        </>
      )}

      {isWarmState || isWarning ? (
        <View
          style={styles.chamberCore}
          testID={`wellness-accordion-shell-chamber-core-${itemKey}`}
        >
          <Svg height="100%" preserveAspectRatio="none" style={styles.svgLayer} width="100%">
            <Defs>
              <SvgLinearGradient id={gradientIds.chamberCore} x1="0%" x2="0%" y1="0%" y2="100%">
                <Stop
                  offset="0%"
                  stopColor={activeCoreTransparent.color}
                  stopOpacity={activeCoreTransparent.opacity}
                />
                <Stop offset="18%" stopColor={activeCoreMid.color} stopOpacity={activeCoreMid.opacity} />
                <Stop offset="62%" stopColor={activeCoreEnd.color} stopOpacity={activeCoreEnd.opacity} />
                <Stop offset="100%" stopColor={activeCoreEnd.color} stopOpacity={activeCoreEnd.opacity} />
              </SvgLinearGradient>
            </Defs>
            <Rect fill={`url(#${gradientIds.chamberCore})`} height="100%" width="100%" x="0" y="0" />
          </Svg>
        </View>
      ) : null}

      {isWarmState || isWarning ? (
        <View
          style={[
            styles.heatBand,
            {
              shadowColor: heatBandGlow,
            },
          ]}
          testID={`wellness-accordion-shell-heat-band-${itemKey}`}
        >
          <Svg height="100%" preserveAspectRatio="none" style={styles.svgLayer} width="100%">
            <Defs>
              <SvgLinearGradient id={gradientIds.band} x1="0%" x2="100%" y1="0%" y2="0%">
                <Stop offset="0%" stopColor={heatBandTransparent.color} stopOpacity={heatBandTransparent.opacity} />
                <Stop offset="22%" stopColor={heatBandSoft.color} stopOpacity={heatBandSoft.opacity} />
                <Stop offset="50%" stopColor={heatBandColor.color} stopOpacity={heatBandColor.opacity} />
                <Stop offset="78%" stopColor={heatBandSoft.color} stopOpacity={heatBandSoft.opacity} />
                <Stop offset="100%" stopColor={heatBandTransparent.color} stopOpacity={heatBandTransparent.opacity} />
              </SvgLinearGradient>
            </Defs>
            <Rect fill={`url(#${gradientIds.band})`} height="100%" rx="6" width="100%" x="0" y="0" />
          </Svg>
        </View>
      ) : null}

      {isWarm3 && !reduceMotion ? (
        <Animated.View
          style={[
            styles.heatSweep,
            sweepStyle,
            { width: sweepWidth },
          ]}
          testID={`wellness-accordion-shell-heat-sweep-${itemKey}`}
        >
          <Svg height="100%" preserveAspectRatio="none" style={styles.svgLayer} width="100%">
            <Defs>
              <SvgLinearGradient id={gradientIds.sweep} x1="0%" x2="100%" y1="0%" y2="0%">
                <Stop offset="0%" stopColor={sweepTransparent.color} stopOpacity={sweepTransparent.opacity} />
                <Stop offset="18%" stopColor={sweepSoft.color} stopOpacity={sweepSoft.opacity} />
                <Stop offset="50%" stopColor={sweepPeak.color} stopOpacity={sweepPeak.opacity} />
                <Stop offset="82%" stopColor={sweepSoft.color} stopOpacity={sweepSoft.opacity} />
                <Stop offset="100%" stopColor={sweepTransparent.color} stopOpacity={sweepTransparent.opacity} />
              </SvgLinearGradient>
            </Defs>
            <Rect fill={`url(#${gradientIds.sweep})`} height="100%" width="100%" x="0" y="0" />
          </Svg>
        </Animated.View>
      ) : null}

      {warmLevel >= 2 || isWarning ? (
        <Animated.View
          style={[styles.ember, emberStyle]}
          testID={`wellness-accordion-shell-ember-${itemKey}`}
        >
          <Svg height="100%" preserveAspectRatio="none" style={styles.svgLayer} width="100%">
            <Defs>
              <RadialGradient id={gradientIds.ember} cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor={emberCore.color} stopOpacity={emberCore.opacity} />
                <Stop offset="70%" stopColor={emberEdge.color} stopOpacity={emberEdge.opacity} />
                <Stop offset="100%" stopColor={emberTransparent.color} stopOpacity={emberTransparent.opacity} />
              </RadialGradient>
            </Defs>
            <Rect fill={`url(#${gradientIds.ember})`} height="100%" rx="41" width="100%" x="0" y="0" />
          </Svg>
        </Animated.View>
      ) : null}

      {isWarning ? (
        <View
          style={styles.warningField}
          testID={`wellness-accordion-shell-warning-field-${itemKey}`}
        >
          <Svg height="100%" preserveAspectRatio="none" style={styles.svgLayer} width="100%">
            <Defs>
              <SvgLinearGradient id={gradientIds.warningField} x1="0%" x2="0%" y1="0%" y2="100%">
                <Stop offset="0%" stopColor={warningFieldStart.color} stopOpacity={warningFieldStart.opacity} />
                <Stop offset="100%" stopColor={warningFieldEnd.color} stopOpacity={warningFieldEnd.opacity} />
              </SvgLinearGradient>
            </Defs>
            <Rect fill={`url(#${gradientIds.warningField})`} height="100%" rx="24" width="100%" x="0" y="0" />
          </Svg>
        </View>
      ) : null}

      {isWarning && !reduceMotion ? (
        <Animated.View
          style={[styles.warningPulse, pulseStyle]}
          testID={`wellness-accordion-shell-warning-pulse-${itemKey}`}
        >
          <Svg height="100%" preserveAspectRatio="none" style={styles.svgLayer} width="100%">
            <Defs>
              <SvgLinearGradient
                id={`${gradientIds.warningField}-pulse`}
                x1="0%"
                x2="0%"
                y1="0%"
                y2="100%"
              >
                <Stop offset="0%" stopColor={warningPulseStart.color} stopOpacity={warningPulseStart.opacity} />
                <Stop offset="100%" stopColor={warningPulseEnd.color} stopOpacity={warningPulseEnd.opacity} />
              </SvgLinearGradient>
            </Defs>
            <Rect
              fill={`url(#${gradientIds.warningField}-pulse)`}
              height="100%"
              rx="24"
              width="100%"
              x="0"
              y="0"
            />
          </Svg>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  chamberCore: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: "18%",
  },
  defaultLowerGlow: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: "42%",
  },
  defaultTopVeil: {
    height: "34%",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  ember: {
    borderRadius: 999,
    height: 82,
    position: "absolute",
    right: 16,
    top: 28,
    width: 82,
  },
  heatBand: {
    bottom: 10,
    height: 12,
    left: 18,
    overflow: "hidden",
    position: "absolute",
    right: 18,
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 20,
  },
  heatSweep: {
    bottom: -26,
    overflow: "hidden",
    position: "absolute",
    top: -12,
  },
  layer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    overflow: "hidden",
  },
  svgLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  warningField: {
    bottom: -6,
    left: -6,
    overflow: "hidden",
    position: "absolute",
    right: -6,
    top: -6,
  },
  warningPulse: {
    bottom: -6,
    left: -6,
    overflow: "hidden",
    position: "absolute",
    right: -6,
    top: -6,
  },
});
