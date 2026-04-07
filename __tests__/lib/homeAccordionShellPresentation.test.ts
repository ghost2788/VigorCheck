import {
  resolveHomeAccordionWarmShellState,
  resolveHomeCaloriesShellState,
} from "../../lib/ui/homeAccordionShellPresentation";

describe("resolveHomeAccordionWarmShellState", () => {
  it.each([
    ["default below first warm threshold", 0.29, "default"],
    ["warm_1 at lower bound", 0.3, "warm_1"],
    ["warm_1 through mid band", 0.51, "warm_1"],
    ["warm_2 at lower bound", 0.6, "warm_2"],
    ["warm_2 through mid band", 0.75, "warm_2"],
    ["warm_3 at lower bound", 0.9, "warm_3"],
    ["warm_3 beyond target stays warm_3", 1.2, "warm_3"],
    ["non-finite values stay default", Number.NaN, "default"],
    ["zero stays default", 0, "default"],
  ] as const)("%s", (_label, progressRatio, expected) => {
    expect(resolveHomeAccordionWarmShellState(progressRatio)).toBe(expected);
  });
});

describe("resolveHomeCaloriesShellState", () => {
  it.each([
    ["default below first warm threshold", 0.29, "default"],
    ["warm_1 at lower bound", 0.3, "warm_1"],
    ["warm_1 through mid band", 0.51, "warm_1"],
    ["warm_2 at lower bound", 0.6, "warm_2"],
    ["warm_2 through mid band", 0.75, "warm_2"],
    ["warm_3 at lower bound", 0.9, "warm_3"],
    ["warm_3 through target and leeway", 1.05, "warm_3"],
    ["warning above upper bound", 1.051, "warning"],
    ["non-finite values stay default", Number.NaN, "default"],
    ["zero stays default", 0, "default"],
  ] as const)("%s", (_label, progressRatio, expected) => {
    expect(resolveHomeCaloriesShellState(progressRatio)).toBe(expected);
  });
});
