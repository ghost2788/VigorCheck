import { AI_PRICING_VERSION } from "../../lib/domain/aiCost";
import { buildAiObservabilityRecordArgs } from "../../convex/lib/aiObservability";

describe("aiObservability record builder", () => {
  it("preserves postprocess failure separately from missing usage", () => {
    expect(
      buildAiObservabilityRecordArgs({
        callKind: "text_entry",
        completedAt: 200,
        createdAt: 100,
        featureKind: "text_ai",
        model: "gpt-4.1-mini",
        resultStatus: "postprocess_error",
      })
    ).toMatchObject({
      callKind: "text_entry",
      completedAt: 200,
      createdAt: 100,
      featureKind: "text_ai",
      model: "gpt-4.1-mini",
      pricingVersion: AI_PRICING_VERSION,
      resultStatus: "postprocess_error",
      usageState: "missing",
    });
  });

  it("keeps blocked requests as not applicable for usage", () => {
    expect(
      buildAiObservabilityRecordArgs({
        blockedLimitKind: "daily_scan",
        callKind: "photo_scan",
        completedAt: 200,
        createdAt: 100,
        featureKind: "photo_scan",
        model: "gpt-4.1",
        resultStatus: "blocked_quota",
        usageState: "not_applicable",
      })
    ).toMatchObject({
      blockedLimitKind: "daily_scan",
      pricingVersion: AI_PRICING_VERSION,
      resultStatus: "blocked_quota",
      usageState: "not_applicable",
    });
  });

  it("supports supplement scans as a distinct observability call kind", () => {
    expect(
      buildAiObservabilityRecordArgs({
        callKind: "supplement_scan",
        completedAt: 200,
        createdAt: 100,
        featureKind: "photo_scan",
        model: "gpt-4.1",
        resultStatus: "completed",
        usageState: "missing",
      })
    ).toMatchObject({
      callKind: "supplement_scan",
      featureKind: "photo_scan",
      model: "gpt-4.1",
      pricingVersion: AI_PRICING_VERSION,
      resultStatus: "completed",
      usageState: "missing",
    });
  });
});
