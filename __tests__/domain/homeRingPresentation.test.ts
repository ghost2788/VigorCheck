import { buildHomeRingPresentation } from "../../lib/domain/homeRingPresentation";

describe("buildHomeRingPresentation", () => {
  const baseDashboard = {
    cards: {
      carbs: {
        rawProgressPercent: 96,
      },
      calories: {
        rawProgressPercent: 97,
      },
      fat: {
        rawProgressPercent: 91,
      },
      protein: {
        rawProgressPercent: 95,
      },
    },
    wellness: {
      rings: {
        carbs: {
          rawProgressPercent: 96,
          score: 96,
        },
        calories: {
          rawProgressPercent: 97,
          score: 92,
        },
        fat: {
          rawProgressPercent: 91,
          score: 91,
        },
        protein: {
          rawProgressPercent: 95,
          score: 95,
        },
      },
    },
  };

  it("keeps render order stable while returning static ring state", () => {
    const presentation = buildHomeRingPresentation({
      carbsShellState: "warm_3",
      caloriesShellState: "warm_3",
      fatShellState: "warm_3",
      dashboard: baseDashboard,
    });

    expect(presentation.rings.map((ring) => ring.id)).toEqual([
      "calories",
      "protein",
      "carbs",
      "fat",
    ]);
    expect("motionEnabled" in presentation).toBe(false);
  });

  it("uses the Home card progress contracts for reward glow thresholds", () => {
    const presentation = buildHomeRingPresentation({
      carbsShellState: "warning",
      caloriesShellState: "warning",
      fatShellState: "warm_3",
      dashboard: baseDashboard,
    });

    expect(presentation.rings.find((ring) => ring.id === "calories")?.rewardGlow).toBe(false);
    expect(presentation.rings.find((ring) => ring.id === "protein")?.rewardGlow).toBe(true);
    expect(presentation.rings.find((ring) => ring.id === "carbs")?.rewardGlow).toBe(false);
    expect(presentation.rings.find((ring) => ring.id === "fat")?.rewardGlow).toBe(false);
  });

  it("does not expose any leftover motion flags", () => {
    const presentation = buildHomeRingPresentation({
      carbsShellState: "warm_3",
      caloriesShellState: "warm_3",
      fatShellState: "warm_3",
      dashboard: baseDashboard,
    });

    expect("motionEnabled" in presentation).toBe(false);
    expect("motionState" in presentation.rings[0]).toBe(false);
    expect(presentation.rings.find((ring) => ring.id === "protein")?.rewardGlow).toBe(true);
  });
});
