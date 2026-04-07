import type { ResponseUsage } from "openai/resources/responses/responses";

export const AI_PRICING_VERSION = "openai-2026-04-06";

const USD_MICROS_PER_USD = 1_000_000;
const TOKENS_PER_MILLION = 1_000_000;

const MODEL_PRICING_USD_PER_MILLION = {
  "gpt-4.1": {
    cachedInput: 0.5,
    input: 2,
    output: 8,
  },
  "gpt-4.1-mini": {
    cachedInput: 0.1,
    input: 0.4,
    output: 1.6,
  },
} as const;

export type SupportedAiPricingModel = keyof typeof MODEL_PRICING_USD_PER_MILLION;

export type ResponseUsageMetrics = {
  cachedInputTokens: number;
  inputTokens: number;
  outputTokens: number;
  reasoningTokens: number;
  totalTokens: number;
};

type EstimateResponseUsageCostArgs = {
  model: string;
  usage?: ResponseUsage | null;
};

function roundUsdPerMillionToUsdMicrosPerMillion(value: number) {
  return Math.round(value * USD_MICROS_PER_USD);
}

function getModelPricing(model: string) {
  return MODEL_PRICING_USD_PER_MILLION[model as SupportedAiPricingModel] ?? null;
}

function calculateTokenCostUsdMicros({
  billableInputTokens,
  cachedInputTokens,
  outputTokens,
  pricing,
}: {
  billableInputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  pricing: (typeof MODEL_PRICING_USD_PER_MILLION)[SupportedAiPricingModel];
}) {
  const inputUsdMicrosPerMillion = roundUsdPerMillionToUsdMicrosPerMillion(pricing.input);
  const cachedInputUsdMicrosPerMillion = roundUsdPerMillionToUsdMicrosPerMillion(
    pricing.cachedInput
  );
  const outputUsdMicrosPerMillion = roundUsdPerMillionToUsdMicrosPerMillion(pricing.output);

  return Math.round(
    (billableInputTokens * inputUsdMicrosPerMillion +
      cachedInputTokens * cachedInputUsdMicrosPerMillion +
      outputTokens * outputUsdMicrosPerMillion) /
      TOKENS_PER_MILLION
  );
}

export function getResponseUsageMetrics(usage?: ResponseUsage | null): ResponseUsageMetrics | null {
  if (!usage) {
    return null;
  }

  return {
    cachedInputTokens: usage.input_tokens_details.cached_tokens,
    inputTokens: usage.input_tokens,
    outputTokens: usage.output_tokens,
    reasoningTokens: usage.output_tokens_details.reasoning_tokens,
    totalTokens: usage.total_tokens,
  };
}

export function estimateResponseUsageCostUsdMicros(args: EstimateResponseUsageCostArgs): {
  estimatedCostUsdMicros: number;
  metrics: ResponseUsageMetrics;
  pricingVersion: typeof AI_PRICING_VERSION;
} | null {
  const pricing = getModelPricing(args.model);
  const metrics = getResponseUsageMetrics(args.usage);

  if (!pricing || !metrics) {
    return null;
  }

  const cachedInputTokens = Math.min(metrics.cachedInputTokens, metrics.inputTokens);
  const billableInputTokens = Math.max(0, metrics.inputTokens - cachedInputTokens);

  return {
    estimatedCostUsdMicros: calculateTokenCostUsdMicros({
      billableInputTokens,
      cachedInputTokens,
      outputTokens: metrics.outputTokens,
      pricing,
    }),
    metrics,
    pricingVersion: AI_PRICING_VERSION,
  };
}
