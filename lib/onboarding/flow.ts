import {
  ActivityLevel,
  GoalPace,
  GoalType,
  PreferredUnitSystem,
  PrimaryTrackingChallenge,
  Sex,
  requiresGoalPace,
} from "../domain/targets";

export type OnboardingDraft = {
  activityLevel?: ActivityLevel;
  age?: number;
  displayName?: string;
  goalPace?: GoalPace;
  goalType?: GoalType;
  height?: number;
  preferredUnitSystem?: PreferredUnitSystem;
  primaryTrackingChallenge?: PrimaryTrackingChallenge;
  sex?: Sex;
  weight?: number;
};

export type OnboardingAnswerRoute =
  | "goal"
  | "goalPace"
  | "challenge"
  | "sex"
  | "age"
  | "bodyMetrics"
  | "activity";

export type OnboardingRoute = OnboardingAnswerRoute | "buildPlan" | "summary";

export const ONBOARDING_PATHS: Record<OnboardingRoute, string> = {
  activity: "/(onboarding)/activity",
  age: "/(onboarding)/age",
  bodyMetrics: "/(onboarding)/body-metrics",
  buildPlan: "/(onboarding)/build-plan",
  challenge: "/(onboarding)/challenge",
  goal: "/(onboarding)/goal",
  goalPace: "/(onboarding)/goal-pace",
  sex: "/(onboarding)/sex",
  summary: "/(onboarding)/summary",
};

const BASE_ANSWER_ROUTE_ORDER: OnboardingAnswerRoute[] = [
  "goal",
  "goalPace",
  "challenge",
  "sex",
  "age",
  "bodyMetrics",
  "activity",
];

export function getRequiredOnboardingAnswerRoutes(draft: OnboardingDraft): OnboardingAnswerRoute[] {
  return BASE_ANSWER_ROUTE_ORDER.filter((route) => {
    if (route === "goalPace") {
      return draft.goalType ? requiresGoalPace(draft.goalType) : true;
    }

    return true;
  });
}

export function getOnboardingRouteFromPathname(pathname: string): OnboardingRoute | null {
  const matched = (Object.entries(ONBOARDING_PATHS) as Array<[OnboardingRoute, string]>).find(
    ([, path]) => pathname === path
  );

  return matched?.[0] ?? null;
}

export function getFirstIncompleteOnboardingPath(draft: OnboardingDraft) {
  if (!draft.goalType) {
    return ONBOARDING_PATHS.goal;
  }

  if (requiresGoalPace(draft.goalType) && !draft.goalPace) {
    return ONBOARDING_PATHS.goalPace;
  }

  if (!draft.primaryTrackingChallenge) {
    return ONBOARDING_PATHS.challenge;
  }

  if (!draft.sex) {
    return ONBOARDING_PATHS.sex;
  }

  if (!draft.age) {
    return ONBOARDING_PATHS.age;
  }

  if (!draft.preferredUnitSystem || !draft.height || !draft.weight) {
    return ONBOARDING_PATHS.bodyMetrics;
  }

  if (!draft.activityLevel) {
    return ONBOARDING_PATHS.activity;
  }

  return null;
}

export function getOnboardingRedirectForPath({
  draft,
  pathname,
}: {
  draft: OnboardingDraft;
  pathname: string;
}) {
  const route = getOnboardingRouteFromPathname(pathname);

  if (!route) {
    return null;
  }

  const firstIncompletePath = getFirstIncompleteOnboardingPath(draft);

  if (route === "summary" || route === "buildPlan") {
    return firstIncompletePath;
  }

  const requiredRoutes = getRequiredOnboardingAnswerRoutes(draft);
  const currentIndex = requiredRoutes.findIndex((value) => value === route);

  if (currentIndex <= 0) {
    return null;
  }

  const earliestIncompleteIndex = requiredRoutes.findIndex(
    (candidatePath) => ONBOARDING_PATHS[candidatePath] === firstIncompletePath
  );

  if (earliestIncompleteIndex !== -1 && earliestIncompleteIndex < currentIndex) {
    return firstIncompletePath;
  }

  return null;
}

export function getSetupProgress(route: OnboardingAnswerRoute, draft?: OnboardingDraft) {
  const requiredRoutes = getRequiredOnboardingAnswerRoutes(draft ?? {});
  const current = requiredRoutes.findIndex((value) => value === route);

  if (current === -1) {
    return null;
  }

  return {
    current: current + 1,
    total: requiredRoutes.length,
  };
}

export function getNextOnboardingPath(route: OnboardingAnswerRoute, draft: OnboardingDraft) {
  const requiredRoutes = getRequiredOnboardingAnswerRoutes(draft);
  const currentIndex = requiredRoutes.findIndex((value) => value === route);

  if (currentIndex === -1 || currentIndex === requiredRoutes.length - 1) {
    return ONBOARDING_PATHS.buildPlan;
  }

  return ONBOARDING_PATHS[requiredRoutes[currentIndex + 1]];
}

export function getPreviousOnboardingPath(route: OnboardingAnswerRoute, draft: OnboardingDraft) {
  const requiredRoutes = getRequiredOnboardingAnswerRoutes(draft);
  const currentIndex = requiredRoutes.findIndex((value) => value === route);

  if (currentIndex <= 0) {
    return null;
  }

  return ONBOARDING_PATHS[requiredRoutes[currentIndex - 1]];
}

export function isOnboardingDraftComplete(
  draft: OnboardingDraft
): draft is Required<
  Pick<
    OnboardingDraft,
    | "activityLevel"
    | "age"
    | "goalType"
    | "height"
    | "preferredUnitSystem"
    | "primaryTrackingChallenge"
    | "sex"
    | "weight"
  > &
    Partial<Pick<OnboardingDraft, "goalPace" | "displayName">>
> {
  return getFirstIncompleteOnboardingPath(draft) === null;
}

export function parsePositiveDraftNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}
