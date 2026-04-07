import {
  AI_PRICING_VERSION,
  estimateResponseUsageCostUsdMicros,
  getResponseUsageMetrics,
} from "../../lib/domain/aiCost";

describe("aiCost domain helpers", () => {
  it("extracts usage metrics from the OpenAI response usage shape", () => {
    expect(
      getResponseUsageMetrics({
        input_tokens: 1_000,
        input_tokens_details: {
          cached_tokens: 250,
        },
        output_tokens: 400,
        output_tokens_details: {
          reasoning_tokens: 120,
        },
        total_tokens: 1_400,
      })
    ).toEqual({
      cachedInputTokens: 250,
      inputTokens: 1_000,
      outputTokens: 400,
      reasoningTokens: 120,
      totalTokens: 1_400,
    });
  });

  it("returns null metrics when usage is missing", () => {
    expect(getResponseUsageMetrics(undefined)).toBeNull();
  });

  it("calculates gpt-4.1 cost using standard and cached input pricing", () => {
    expect(
      estimateResponseUsageCostUsdMicros({
        model: "gpt-4.1",
        usage: {
          input_tokens: 1_000,
          input_tokens_details: {
            cached_tokens: 200,
          },
          output_tokens: 500,
          output_tokens_details: {
            reasoning_tokens: 0,
          },
          total_tokens: 1_500,
        },
      })
    ).toEqual({
      estimatedCostUsdMicros: 5_700,
      metrics: {
        cachedInputTokens: 200,
        inputTokens: 1_000,
        outputTokens: 500,
        reasoningTokens: 0,
        totalTokens: 1_500,
      },
      pricingVersion: AI_PRICING_VERSION,
    });
  });

  it("calculates gpt-4.1-mini cost", () => {
    expect(
      estimateResponseUsageCostUsdMicros({
        model: "gpt-4.1-mini",
        usage: {
          input_tokens: 2_000,
          input_tokens_details: {
            cached_tokens: 500,
          },
          output_tokens: 750,
          output_tokens_details: {
            reasoning_tokens: 50,
          },
          total_tokens: 2_750,
        },
      })
    ).toEqual({
      estimatedCostUsdMicros: 1_850,
      metrics: {
        cachedInputTokens: 500,
        inputTokens: 2_000,
        outputTokens: 750,
        reasoningTokens: 50,
        totalTokens: 2_750,
      },
      pricingVersion: AI_PRICING_VERSION,
    });
  });

  it("returns null cost for unsupported models", () => {
    expect(
      estimateResponseUsageCostUsdMicros({
        model: "gpt-4o-mini",
        usage: {
          input_tokens: 200,
          input_tokens_details: {
            cached_tokens: 0,
          },
          output_tokens: 100,
          output_tokens_details: {
            reasoning_tokens: 0,
          },
          total_tokens: 300,
        },
      })
    ).toBeNull();
  });
});
