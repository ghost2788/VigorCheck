import React from "react";
import { StyleSheet, View } from "react-native";
import { fireEvent, render, waitFor, within } from "../../lib/test-utils";
import MealEditScreen from "../../app/history/meals/[mealId]";

const mockBack = jest.fn();
const mockUseLocalSearchParams = jest.fn();
const mockUseMutation = jest.fn();
const mockUseQuery = jest.fn();

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => mockUseLocalSearchParams(),
  useRouter: () => ({
    back: mockBack,
  }),
}));

jest.mock("convex/react", () => ({
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

jest.mock("../../lib/domain/dayWindow", () => ({
  getLocalDateInputValue: () => "2026-04-06",
  getLocalTimeInputValue: () => "09:15",
  parseTimestampFromLocalDateTime: () => new Date("2026-04-06T19:15:00.000Z").getTime(),
}));

describe("MealEditScreen", () => {
  beforeEach(() => {
    mockBack.mockReset();
    mockUseLocalSearchParams.mockReset();
    mockUseMutation.mockReset();
    mockUseQuery.mockReset();

    mockUseLocalSearchParams.mockReturnValue({ mealId: "meal-1" });
  });

  it("preserves oz units when editing saved meals through the structured path", async () => {
    const updateManual = jest.fn();
    const updateAiEntry = jest.fn().mockResolvedValue(undefined);
    const deleteMeal = jest.fn();

    let mutationCall = 0;
    mockUseMutation.mockImplementation(() => {
      mutationCall += 1;
      const cycleIndex = (mutationCall - 1) % 3;
      return cycleIndex === 0 ? updateManual : cycleIndex === 1 ? updateAiEntry : deleteMeal;
    });

    const mealData = {
      items: [
        {
          barcodeValue: undefined,
          confidence: "medium",
          estimatedGrams: 12,
          foodName: "Protein shake",
          id: "item-1",
          nutrition: {
            b12: 0,
            b6: 0,
            calcium: 0,
            calories: 160,
            carbs: 8,
            choline: 0,
            copper: 0,
            fat: 3,
            fiber: 0,
            folate: 0,
            iron: 0,
            magnesium: 0,
            manganese: 0,
            niacin: 0,
            omega3: 0,
            phosphorus: 0,
            potassium: 0,
            protein: 30,
            riboflavin: 0,
            selenium: 0,
            sodium: 120,
            sugar: 4,
            thiamin: 0,
            vitaminA: 0,
            vitaminC: 0,
            vitaminD: 0,
            vitaminE: 0,
            vitaminK: 0,
            zinc: 0,
          },
          portionLabel: "12 oz",
          portionUnit: "oz",
          prepMethod: undefined,
          source: "manual",
          usdaFoodId: undefined,
        },
      ],
      meal: {
        aiConfidence: "medium",
        entryMethod: "saved_meal",
        id: "meal-1",
        label: "Protein shake",
        mealType: "drink",
        photoStorageId: undefined,
        timestamp: new Date("2026-04-06T12:15:00.000Z").getTime(),
      },
      timeZone: "Pacific/Honolulu",
    };
    mockUseQuery.mockImplementation((_query: unknown, args: unknown) => {
      if (args && typeof args === "object" && "mealId" in (args as Record<string, unknown>)) {
        return mealData;
      }
      return {
        detailedNutritionTargets: null,
        macroTargets: null,
      };
    });

    const { getByPlaceholderText, getByTestId, queryAllByDisplayValue } = render(<MealEditScreen />);

    await waitFor(() => expect(queryAllByDisplayValue("Protein shake").length).toBeGreaterThan(0));
    fireEvent.changeText(getByPlaceholderText("2026-03-31"), "2026-04-06");
    fireEvent.changeText(getByPlaceholderText("17:12"), "09:15");

    fireEvent.press(getByTestId("meal-edit-save-button"));

    await waitFor(() =>
      expect(updateAiEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          items: [
            expect.objectContaining({
              portionLabel: "12 oz",
              portionUnit: "oz",
            }),
          ],
        })
      )
    );
    expect(mockBack).toHaveBeenCalled();
  });

  it("uses edit-specific header copy for manual meals instead of the shared quick-add title", () => {
    const updateManual = jest.fn();
    const updateAiEntry = jest.fn().mockResolvedValue(undefined);
    const deleteMeal = jest.fn();

    let mutationCall = 0;
    mockUseMutation.mockImplementation(() => {
      mutationCall += 1;
      const cycleIndex = (mutationCall - 1) % 3;
      return cycleIndex === 0 ? updateManual : cycleIndex === 1 ? updateAiEntry : deleteMeal;
    });

    mockUseQuery.mockImplementation((_query: unknown, args: unknown) => {
      if (args && typeof args === "object" && "mealId" in (args as Record<string, unknown>)) {
        return {
          items: [
            {
              barcodeValue: undefined,
              confidence: "medium",
              estimatedGrams: 100,
              foodName: "Turkey bowl",
              id: "item-1",
              nutrition: {
                b12: 0,
                b6: 0,
                calcium: 0,
                calories: 540,
                carbs: 48,
                choline: 0,
                copper: 0,
                fat: 18,
                fiber: 0,
                folate: 0,
                iron: 0,
                magnesium: 0,
                manganese: 0,
                niacin: 0,
                omega3: 0,
                phosphorus: 0,
                potassium: 0,
                protein: 42,
                riboflavin: 0,
                selenium: 0,
                sodium: 420,
                sugar: 4,
                thiamin: 0,
                vitaminA: 0,
                vitaminC: 0,
                vitaminD: 0,
                vitaminE: 0,
                vitaminK: 0,
                zinc: 0,
              },
              portionLabel: "Manual estimate",
              portionUnit: "g",
              prepMethod: undefined,
              source: "manual",
              usdaFoodId: undefined,
            },
          ],
          meal: {
            aiConfidence: "medium",
            entryMethod: "manual",
            id: "meal-1",
            label: "Turkey bowl",
            mealType: "lunch",
            photoStorageId: undefined,
            timestamp: new Date("2026-04-06T12:15:00.000Z").getTime(),
          },
          timeZone: "Pacific/Honolulu",
        };
      }

      return {
        detailedNutritionTargets: null,
        macroTargets: null,
      };
    });

    const { UNSAFE_getAllByType, getByTestId, getByText, queryByText } = render(<MealEditScreen />);
    const backButton = getByTestId("meal-edit-back-button");
    const headerRow = UNSAFE_getAllByType(View).find((node) => {
      const style = StyleSheet.flatten(node.props.style);
      return style?.justifyContent === "space-between" && style?.marginBottom === 18;
    });

    expect(getByText("Meal log")).toBeTruthy();
    expect(getByText("Edit meal")).toBeTruthy();
    expect(within(backButton).getByText("chevron-back")).toBeTruthy();
    expect(StyleSheet.flatten(headerRow?.props.style).alignItems).toBe("center");
    expect(getByText("Meal summary")).toBeTruthy();
    expect(queryByText("Quick add")).toBeNull();

    fireEvent.press(backButton);

    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
