import {
  getFirstIncompleteOnboardingPath,
  getOnboardingRedirectForPath,
  getSetupProgress,
  isOnboardingDraftComplete,
  ONBOARDING_PATHS,
} from "../../lib/onboarding/flow";

describe("onboarding flow", () => {
  const completeDraft = {
    activityLevel: "moderate" as const,
    age: 34,
    goalPace: "moderate" as const,
    goalType: "fat_loss" as const,
    height: 70,
    preferredUnitSystem: "imperial" as const,
    primaryTrackingChallenge: "portion_sizes" as const,
    sex: "male" as const,
    weight: 180,
  };

  it("requires goal pace only for fat loss and muscle gain", () => {
    expect(
      getFirstIncompleteOnboardingPath({
        ...completeDraft,
        goalPace: undefined,
      })
    ).toBe(ONBOARDING_PATHS.goalPace);

    expect(
      getFirstIncompleteOnboardingPath({
        ...completeDraft,
        goalPace: undefined,
        goalType: "general_health",
      })
    ).toBeNull();
  });

  it("requires the qualitative challenge and body metrics before summary", () => {
    expect(
      getOnboardingRedirectForPath({
        draft: {
          ...completeDraft,
          preferredUnitSystem: undefined,
          primaryTrackingChallenge: undefined,
        },
        pathname: ONBOARDING_PATHS.summary,
      })
    ).toBe(ONBOARDING_PATHS.challenge);
  });

  it("treats the activity screen as the last input step before plan generation", () => {
    expect(getSetupProgress("goal")).toEqual({ current: 1, total: 7 });
    expect(getSetupProgress("activity")).toEqual({ current: 7, total: 7 });
  });

  it("only marks the draft complete after all required premium-onboarding fields are present", () => {
    expect(isOnboardingDraftComplete(completeDraft)).toBe(true);
    expect(
      isOnboardingDraftComplete({
        ...completeDraft,
        primaryTrackingChallenge: undefined,
      })
    ).toBe(false);
  });
});
