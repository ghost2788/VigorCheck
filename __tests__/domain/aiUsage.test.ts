import {
  AI_USAGE_LIMITS,
  buildAiUsageBucket,
  buildAiUsageBlockedMessage,
  buildTrialLifetimeWindowKey,
  pickPrimaryPhotoBucket,
} from "../../lib/domain/aiUsage";

describe("aiUsage domain helpers", () => {
  it("marks buckets as warning at the 80% soft cap", () => {
    expect(buildAiUsageBucket({ limit: 100, used: 79 }).isWarning).toBe(false);
    expect(buildAiUsageBucket({ limit: 100, used: 80 }).isWarning).toBe(true);
  });

  it("marks buckets as blocked at the hard cap", () => {
    const bucket = buildAiUsageBucket({ limit: 12, used: 12 });

    expect(bucket.isBlocked).toBe(true);
    expect(bucket.remaining).toBe(0);
  });

  it("derives the trial lifetime window key from trialStartDate", () => {
    expect(buildTrialLifetimeWindowKey(1_712_300_000_000)).toBe("trial-1712300000000");
  });

  it("picks the photo bucket with the smaller remaining count as primary", () => {
    const primary = buildAiUsageBucket({ label: "This month", limit: 100, used: 65 });
    const daily = buildAiUsageBucket({ label: "Today", limit: 12, used: 11 });

    expect(pickPrimaryPhotoBucket({ daily, primary }).label).toBe("Today");
  });

  it("keeps the period bucket primary when remaining counts tie", () => {
    const primary = buildAiUsageBucket({ label: "Trial total", limit: 12, used: 3 });
    const daily = buildAiUsageBucket({ label: "Today", limit: 12, used: 3 });

    expect(pickPrimaryPhotoBucket({ daily, primary }).label).toBe("Trial total");
  });

  it("builds a daily photo block message", () => {
    expect(
      buildAiUsageBlockedMessage({
        accessStatus: "active",
        featureKind: "photo_scan",
        limitKind: "daily_scan",
      })
    ).toBe("You've reached today's AI photo scan limit. Try again tomorrow.");
  });

  it("builds a trial text block message", () => {
    expect(
      buildAiUsageBlockedMessage({
        accessStatus: "trial",
        featureKind: "text_ai",
        limitKind: "trial_lifetime",
      })
    ).toBe(
      `You've used all ${AI_USAGE_LIMITS.trial.textEntries} AI text entries in your free trial. Start the monthly plan to continue.`
    );
  });
});
