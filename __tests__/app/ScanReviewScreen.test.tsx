import React from "react";
import { StyleSheet } from "react-native";
import { fireEvent, render, waitFor } from "../../lib/test-utils";
import { createEmptyNutrition, ScanDraftItem } from "../../lib/domain/scan";
import ScanReviewScreen from "../../app/scan/review";

const mockReplace = jest.fn();
const mockUseMutation = jest.fn();
const mockUseQuery = jest.fn();
const mockUseScanFlow = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

jest.mock("convex/react", () => ({
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
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

function buildItem(id: string, name: string, calories: number): ScanDraftItem {
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
    portionUnit: "g" as const,
    portionLabel: "1 serving from label",
    source: "barcode_catalog" as const,
  };
}

function createDraft(items: ScanDraftItem[] = [buildItem("item-1", "Peanut Butter Dark Chocolate", 190)]) {
  return {
    entryMethod: "barcode" as const,
    items,
    mealType: "snack" as const,
    overallConfidence: "high" as const,
  };
}

function buildScanFlowState(overrides: Record<string, unknown> = {}) {
  return {
    activeReviewJob: null,
    announceReviewedSave: jest.fn(),
    clearActiveReview: jest.fn(),
    clearReviewedSaveAnnouncement: jest.fn(),
    completeReviewJob: jest.fn(),
    reviewedSaveAnnouncement: null,
    updateActiveDraft: jest.fn(),
    ...overrides,
  };
}

describe("ScanReviewScreen", () => {
  beforeEach(() => {
    mockReplace.mockReset();
    mockUseMutation.mockReset();
    mockUseQuery.mockReset();
    mockUseScanFlow.mockReset();
    mockUseMutation.mockReturnValue(jest.fn());
    mockUseQuery.mockReturnValue({
      macroTargets: {
        calories: 2000,
        carbs: 250,
        fat: 67,
        protein: 150,
      },
      detailedNutritionTargets: {
        b12: 2.4,
        b6: 1.3,
        calcium: 1000,
        choline: 550,
        copper: 0.9,
        fiber: 30,
        folate: 400,
        iron: 8,
        magnesium: 420,
        manganese: 2.3,
        niacin: 16,
        omega3: 1.6,
        phosphorus: 700,
        potassium: 3400,
        riboflavin: 1.3,
        selenium: 55,
        sodium: 2300,
        sugar: 36,
        thiamin: 1.2,
        vitaminA: 900,
        vitaminC: 90,
        vitaminD: 15,
        vitaminE: 15,
        vitaminK: 120,
        zinc: 11,
      },
    });
  });

  it("renders the new review header, no top meal-type strip, accordion default state, and sticky footer", () => {
    const draftSeed = createDraft([
      buildItem("item-1", "Peanut Butter Dark Chocolate", 190),
      buildItem("item-2", "Greek Yogurt", 120),
    ]);

    mockUseScanFlow.mockImplementation(() => {
      const ReactModule = require("react");
      const [draft, setDraft] = ReactModule.useState(draftSeed);

      return {
        ...buildScanFlowState(),
        activeReviewJob: { draft, id: "job-1" },
        updateActiveDraft: (updater: (draft: typeof draftSeed) => typeof draftSeed) =>
          setDraft((current: typeof draftSeed) => updater(current)),
      };
    });

    const { getByTestId, getByText, queryByTestId, queryByText } = render(<ScanReviewScreen />);

    expect(queryByText("AI review")).toBeNull();
    expect(getByText("Review meal")).toBeTruthy();
    expect(getByText("High confidence")).toBeTruthy();
    expect(queryByTestId("scan-review-summary-strip")).toBeNull();
    expect(getByTestId("scan-review-meal-type-pills-item-1")).toBeTruthy();
    expect(getByTestId("scan-review-item-item-1-expanded-content")).toBeTruthy();
    expect(getByTestId("scan-review-item-item-2-collapsed-content")).toBeTruthy();
    expect(queryByTestId("scan-review-item-item-2-expanded-content")).toBeNull();

    fireEvent.press(getByTestId("scan-review-header-toggle-item-2"));

    expect(getByTestId("scan-review-item-item-2-expanded-content")).toBeTruthy();
    expect(queryByTestId("scan-review-item-item-1-expanded-content")).toBeNull();

    fireEvent.press(getByTestId("scan-review-header-toggle-item-2"));

    expect(queryByTestId("scan-review-item-item-1-expanded-content")).toBeNull();
    expect(queryByTestId("scan-review-item-item-2-expanded-content")).toBeNull();
    const footerStyle = StyleSheet.flatten(getByTestId("scan-review-footer").props.style);
    expect(footerStyle.paddingBottom).toBe(20);
    expect(footerStyle.position).toBe("absolute");
  });

  it("does not render the inline manual add section anymore", () => {
    const draftSeed = createDraft();

    mockUseScanFlow.mockImplementation(() =>
      buildScanFlowState({
        activeReviewJob: { draft: draftSeed, id: "job-1" },
      })
    );

    const { queryByText, queryByTestId } = render(<ScanReviewScreen />);

    expect(queryByText("Missing something?")).toBeNull();
    expect(queryByText("Add item")).toBeNull();
    expect(queryByTestId("scan-review-manual-submit")).toBeNull();
  });

  it("submits unit-aware barcode review items so ml servings survive save", async () => {
    const saveMutation = jest.fn().mockResolvedValue({ mealId: "meal-1" });
    const announceReviewedSave = jest.fn();
    const clearActiveReview = jest.fn();
    const completeReviewJob = jest.fn();

    mockUseMutation.mockReturnValue(saveMutation);
    mockUseScanFlow.mockImplementation(() => ({
      ...buildScanFlowState(),
      activeReviewJob: {
        draft: createDraft([
          {
            ...buildItem("item-1", "Red Bull Energy Drink", 113),
            estimatedGrams: 250,
            nutrition: {
              ...createEmptyNutrition(),
              b12: 2,
              b6: 2,
              calories: 113,
              carbs: 28,
              niacin: 8,
              sodium: 100,
              sugar: 28,
            },
            portionLabel: "1 serving from label (1 can (250 ml))",
            portionUnit: "ml" as const,
          },
        ]),
        id: "job-1",
      },
      announceReviewedSave,
      clearActiveReview,
      completeReviewJob,
      updateActiveDraft: jest.fn(),
    }));

    const { getByText } = render(<ScanReviewScreen />);

    fireEvent.press(getByText("Save meal"));

    await waitFor(() =>
      expect(saveMutation).toHaveBeenCalledWith(
        expect.objectContaining({
          items: [
            expect.objectContaining({
              portionAmount: 250,
              portionUnit: "ml",
            }),
          ],
        })
      )
    );
    expect(clearActiveReview).not.toHaveBeenCalled();
    expect(completeReviewJob).toHaveBeenCalledWith("job-1");
    expect(announceReviewedSave).toHaveBeenCalledWith("Meal added");
  });

  it("announces a drink save after the review mutation resolves", async () => {
    const saveMutation = jest.fn().mockResolvedValue({ mealId: "meal-1" });
    const announceReviewedSave = jest.fn();

    mockUseMutation.mockReturnValue(saveMutation);
    mockUseScanFlow.mockImplementation(() =>
      buildScanFlowState({
        activeReviewJob: {
          draft: {
            ...createDraft(),
            mealType: "drink" as const,
          },
          id: "job-1",
        },
        announceReviewedSave,
      })
    );

    const { getByText } = render(<ScanReviewScreen />);

    fireEvent.press(getByText("Save meal"));

    await waitFor(() => expect(saveMutation).toHaveBeenCalledTimes(1));
    expect(announceReviewedSave).toHaveBeenCalledWith("Drink added");
  });

  it("does not announce success when saving fails", async () => {
    const saveMutation = jest.fn().mockRejectedValue(new Error("save failed"));
    const announceReviewedSave = jest.fn();

    mockUseMutation.mockReturnValue(saveMutation);
    mockUseScanFlow.mockImplementation(() =>
      buildScanFlowState({
        activeReviewJob: { draft: createDraft(), id: "job-1" },
        announceReviewedSave,
      })
    );

    const { getByText } = render(<ScanReviewScreen />);

    fireEvent.press(getByText("Save meal"));

    await waitFor(() => expect(saveMutation).toHaveBeenCalledTimes(1));
    expect(announceReviewedSave).not.toHaveBeenCalled();
  });

  it("updates the shared meal type from the expanded card pill row", () => {
    const draftSeed = createDraft();

    mockUseScanFlow.mockImplementation(() => {
      const ReactModule = require("react");
      const [draft, setDraft] = ReactModule.useState(draftSeed);

      return {
        ...buildScanFlowState(),
        activeReviewJob: { draft, id: "job-1" },
        updateActiveDraft: (updater: (draft: typeof draftSeed) => typeof draftSeed) =>
          setDraft((current: typeof draftSeed) => updater(current)),
      };
    });

    const { getByTestId, getByText } = render(<ScanReviewScreen />);

    fireEvent.press(getByTestId("scan-review-meal-type-pill-item-1-drink"));

    expect(getByText("Drink")).toBeTruthy();
  });

  it("expands the next remaining item when the open item is removed", () => {
    const draftSeed = createDraft([
      buildItem("item-1", "Peanut Butter Dark Chocolate", 190),
      buildItem("item-2", "Greek Yogurt", 120),
      buildItem("item-3", "Apple Slices", 80),
    ]);

    mockUseScanFlow.mockImplementation(() => {
      const ReactModule = require("react");
      const [draft, setDraft] = ReactModule.useState(draftSeed);

      return {
        ...buildScanFlowState(),
        activeReviewJob: { draft, id: "job-1" },
        updateActiveDraft: (updater: (draft: typeof draftSeed) => typeof draftSeed) =>
          setDraft((current: typeof draftSeed) => updater(current)),
      };
    });

    const { getByTestId, getByText, queryByTestId } = render(<ScanReviewScreen />);

    expect(getByTestId("scan-review-item-item-1-expanded-content")).toBeTruthy();
    fireEvent.press(getByText("Remove"));

    expect(queryByTestId("scan-review-item-item-1-expanded-content")).toBeNull();
    expect(getByTestId("scan-review-item-item-2-expanded-content")).toBeTruthy();
    expect(getByTestId("scan-review-item-item-3-collapsed-content")).toBeTruthy();
  });
});
