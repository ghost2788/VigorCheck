import { internal } from "../_generated/api";
import type { ActionCtx } from "../_generated/server";
import type { ResponseUsage } from "openai/resources/responses/responses";
import {
  AI_PRICING_VERSION,
  estimateResponseUsageCostUsdMicros,
  getResponseUsageMetrics,
} from "../../lib/domain/aiCost";

export type AiObservabilityCallKind =
  | "photo_scan"
  | "supplement_scan"
  | "text_entry"
  | "drink_estimate";
export type AiObservabilityFeatureKind = "photo_scan" | "text_ai";
export type AiObservabilityResultStatus =
  | "completed"
  | "blocked_quota"
  | "provider_error"
  | "postprocess_error";
export type AiObservabilityUsageState = "present" | "missing" | "not_applicable";
export type AiObservabilityLimitKind = "trial_lifetime" | "calendar_month" | "daily_scan";

export function buildAiObservabilityRecordArgs(args: {
  blockedLimitKind?: AiObservabilityLimitKind | null;
  callKind: AiObservabilityCallKind;
  completedAt: number;
  createdAt: number;
  featureKind: AiObservabilityFeatureKind;
  model: string;
  resultStatus: AiObservabilityResultStatus;
  usage?: ResponseUsage | null;
  usageState?: AiObservabilityUsageState;
}) {
  const metrics = getResponseUsageMetrics(args.usage);
  const estimate = estimateResponseUsageCostUsdMicros({
    model: args.model,
    usage: args.usage,
  });

  return {
    blockedLimitKind: args.blockedLimitKind ?? undefined,
    cachedInputTokens: metrics?.cachedInputTokens,
    callKind: args.callKind,
    completedAt: args.completedAt,
    createdAt: args.createdAt,
    estimatedCostUsdMicros: estimate?.estimatedCostUsdMicros,
    featureKind: args.featureKind,
    inputTokens: metrics?.inputTokens,
    model: args.model,
    outputTokens: metrics?.outputTokens,
    pricingVersion: AI_PRICING_VERSION,
    reasoningTokens: metrics?.reasoningTokens,
    resultStatus: args.resultStatus,
    totalTokens: metrics?.totalTokens,
    usageState: args.usageState ?? (metrics ? "present" : "missing"),
  };
}

export async function recordAiRequestSafely(
  ctx: Pick<ActionCtx, "runMutation">,
  args: ReturnType<typeof buildAiObservabilityRecordArgs>
) {
  try {
    await ctx.runMutation(internal.aiObservability.recordRequest, args);
  } catch (error) {
    console.error("Failed to record AI observability event.", error);
  }
}
