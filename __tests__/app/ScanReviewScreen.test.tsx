import React from "react";
import { StyleSheet } from "react-native";
import { fireEvent, render } from "../../lib/test-utils";
import { createEmptyNutrition } from "../../lib/domain/scan";
import ScanReviewScreen from "../../app/scan/review";

const mockReplace = jest.fn();
const mockUseMutation = jest.fn();
const mockUseScanFlow = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

jest.mock("convex/react", () => ({
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({
    bottom: 20,
    left: 0,
    right: 0,
    top: 18,
  }),
}));

jest.mock("../../lib/scan/ScanFlowProvider", () => ({
  useScanFlow: () => mockUseScanFlow(),
}));

function buildItem(id: string, name: string, calories: number) {
  return {
    baseEstimatedGrams: 40,
    baseNutrition: {
      ...createEmptyNutrition(),
      calories,
      carbs: 6,
      fat: 5,
      protein: 4,
    },
    confidence: "high" as const,
    estimatedGrams: 40,
    id,
    multiplier: 1,
    name,
    normalizedName: name.toLowerCase(),
    nutrition: {
      ...createEmptyNutrition(),
      calories,
      carbs: 6,
      fat: 5,
      protein: 4,
    },
    portionLabel: "1 serving from label",
    source: "barcode_catalog" as const,
  };
}

function createDraft(items = [buildItem("item-1", "Peanut Butter Dark Chocolate", 190)]) {
  return {
    entryMethod: "barcode" as const,
    items,
    mealType: "snack" as const,
    overallConfidence: "high" as const,
  };
}

describe("ScanReviewScreen", () => {
  beforeEach(() => {
    mockReplace.mockReset();
    mockUseMutation.mockReset();
    mockUseScanFlow.mockReset();
    mockUseMutation.mockReturnValue(jest.fn());
  });

  it("renders the new review header, top strip, expanded first item, and sticky footer", () => {
    const draftSeed = createDraft([
      buildItem("item-1", "Peanut Butter Dark Chocolate", 190),
      buildItem("item-2", "Greek Yogurt", 120),
    ]);

    mockUseScanFlow.mockImplementation(() => {
      const ReactModule = require("react");
      const [draft, setDraft] = ReactModule.useState(draftSeed);

      return {
        activeReviewJob: { draft, id: "job-1" },
        clearActiveReview: jest.fn(),
        completeReviewJob: jest.fn(),
        updateActiveDraft: (updater: (draft: typeof draftSeed) => typeof draftSeed) =>
          setDraft((current: typeof draftSeed) => updater(current)),
      };
    });

    const { getByTestId, getByText, queryByTestId, queryByText } = render(<ScanReviewScreen />);

    expect(queryByText("AI review")).toBeNull();
    expect(getByText("Review meal")).toBeTruthy();
    expect(getByTestId("scan-review-summary-strip")).toBeTruthy();
    expect(getByText("High confidence")).toBeTruthy();
    expect(queryByTestId("scan-review-summary-line")).toBeNull();
    expect(getByTestId("scan-review-item-item-1-expanded-content")).toBeTruthy();
    expect(getByTestId("scan-review-item-item-2-collapsed-content")).toBeTruthy();
    expect(queryByTestId("scan-review-item-item-2-expanded-content")).toBeNull();

    fireEvent.press(getByTestId("scan-review-toggle-item-2"));

    expect(getByTestId("scan-review-item-item-2-expanded-content")).toBeTruthy();
    const footerStyle = StyleSheet.flatten(getByTestId("scan-review-footer").props.style);
    expect(footerStyle.paddingBottom).toBe(20);
    expect(footerStyle.position).toBe("absolute");
  });

  it("does not render the inline manual add section anymore", () => {
    const draftSeed = createDraft();

    mockUseScanFlow.mockImplementation(() => ({
      activeReviewJob: { draft: draftSeed, id: "job-1" },
      clearActiveReview: jest.fn(),
      completeReviewJob: jest.fn(),
      updateActiveDraft: jest.fn(),
    }));

    const { queryByText, queryByTestId } = render(<ScanReviewScreen />);

    expect(queryByText("Missing something?")).toBeNull();
    expect(queryByText("Add item")).toBeNull();
    expect(queryByTestId("scan-review-manual-submit")).toBeNull();
  });
});
