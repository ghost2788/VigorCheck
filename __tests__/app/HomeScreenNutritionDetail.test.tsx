import React from "react";
import { StyleSheet } from "react-native";
import { fireEvent, render } from "../../lib/test-utils";
import HomeScreen from "../../app/(tabs)/index";
import { buildTodayDashboard } from "../../lib/domain/dashboard";
import { getDetailedNutrientTargets } from "../../lib/domain/nutrients";

const mockUseQuery = jest.fn();
const mockUseMutation = jest.fn();
const mockPush = jest.fn();
const mockUseSubscription = jest.fn();

jest.mock("convex/react", () => ({
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockPush,
  }),
}));

jest.mock("../../lib/billing/SubscriptionProvider", () => ({
  useSubscription: () => mockUseSubscription(),
}));

jest.mock("../../lib/onboarding/OnboardingFlowProvider", () => ({
  useOnboardingFlow: () => ({
    consumePostOnboardingHomeCTA: jest.fn(),
    showPostOnboardingHomeCTA: false,
  }),
}));

describe("HomeScreen nutrition detail", () => {
  beforeEach(() => {
    mockUseQuery.mockReset();
    mockUseMutation.mockReset();
    mockPush.mockReset();
    mockUseSubscription.mockReset();
    mockUseMutation.mockReturnValue(jest.fn());
    mockUseSubscription.mockReturnValue({
      accessState: null,
    });
  });

  it("shows the expanded nutrient progress rows in the nutrition accordion", () => {
    mockUseQuery.mockReturnValue({
      dateKey: "2026-04-04",
      displayName: "Ari",
      targets: {
        calories: 3052,
        carbs: 320,
        fat: 92,
        hydration: 11,
        protein: 141,
      },
      timeZone: "Pacific/Honolulu",
      ...buildTodayDashboard({
        hydrationLogs: [],
        mealItems: [
          { foodName: "Salmon", mealId: "meal-1" },
          { foodName: "Rice", mealId: "meal-1" },
        ],
        meals: [
          {
            entryMethod: "barcode",
            id: "meal-1",
            label: "Salmon rice plate",
            mealType: "dinner",
            nutrients: {
              b12: 4.9,
              b6: 1.4,
              calcium: 80,
              choline: 190,
              copper: 0.4,
              fiber: 7,
              folate: 120,
              iron: 4.8,
              magnesium: 94,
              manganese: 0.9,
              niacin: 12,
              omega3: 1.2,
              phosphorus: 452,
              potassium: 1410,
              riboflavin: 0.3,
              selenium: 54,
              sodium: 460,
              sugar: 6,
              thiamin: 0.3,
              vitaminA: 260,
              vitaminC: 84,
              vitaminD: 13,
              vitaminE: 2,
              vitaminK: 120,
              zinc: 1.2,
            },
            timestamp: Date.parse("2026-04-04T18:00:00.000Z"),
            totals: {
              calories: 890,
              carbs: 84,
              fat: 30,
              protein: 53,
            },
          },
        ],
        targets: {
          calories: 3052,
          carbs: 320,
          detailedNutrition: getDetailedNutrientTargets({
            age: 30,
            sex: "male",
            targetFiber: 30,
          }),
          fat: 92,
          hydration: 11,
          nutrition: {
            calcium: 1000,
            fiber: 30,
            iron: 8,
            potassium: 3400,
            vitaminC: 90,
            vitaminD: 15,
          },
          protein: 141,
        },
      }),
    });

    const { getAllByText, getByText, queryByTestId, queryByText } = render(<HomeScreen />);

    fireEvent.press(getAllByText("Nutrition")[1]);

    expect(getByText("Vitamin A")).toBeTruthy();
    expect(getByText("Omega-3")).toBeTruthy();
    expect(getByText("Selenium")).toBeTruthy();
    expect(getByText("260 / 900 mcg")).toBeTruthy();
    expect(getByText("1.2 / 1.6 g")).toBeTruthy();
    expect(queryByText("Vitamins")).toBeNull();
    expect(queryByText("Minerals")).toBeNull();
    expect(queryByText("Other nutrients")).toBeNull();
    expect(queryByText("Top wins")).toBeNull();
    expect(queryByText("Biggest gaps")).toBeNull();
    expect(queryByTestId("home-accordion-summary-row-nutrition")).toBeNull();
  });

  it("shows a red over-target calories shell badge while keeping contributor rows below", () => {
    mockUseQuery.mockReturnValue({
      dateKey: "2026-04-04",
      displayName: "Ari",
      targets: {
        calories: 2000,
        carbs: 320,
        fat: 92,
        hydration: 11,
        protein: 141,
      },
      timeZone: "Pacific/Honolulu",
      ...buildTodayDashboard({
        hydrationLogs: [],
        mealItems: [{ foodName: "Lunch bowl", mealId: "meal-1" }],
        meals: [
          {
            entryMethod: "barcode",
            id: "meal-1",
            label: "Lunch bowl",
            mealType: "lunch",
            nutrients: {
              b12: 0,
              b6: 0,
              calcium: 40,
              choline: 0,
              copper: 0,
              fiber: 6,
              folate: 0,
              iron: 0,
              magnesium: 0,
              manganese: 0,
              niacin: 0,
              omega3: 0,
              phosphorus: 0,
              potassium: 0,
              riboflavin: 0,
              selenium: 0,
              sodium: 400,
              sugar: 0,
              thiamin: 0,
              vitaminA: 0,
              vitaminC: 0,
              vitaminD: 0,
              vitaminE: 0,
              vitaminK: 0,
              zinc: 0,
            },
            timestamp: Date.parse("2026-04-04T12:00:00.000Z"),
            totals: {
              calories: 2101,
              carbs: 90,
              fat: 50,
              protein: 55,
            },
          },
        ],
        targets: {
          calories: 2000,
          carbs: 320,
          detailedNutrition: getDetailedNutrientTargets({
            age: 30,
            sex: "male",
            targetFiber: 30,
          }),
          fat: 92,
          hydration: 11,
          nutrition: {
            calcium: 1000,
            fiber: 30,
            iron: 8,
            potassium: 3400,
            vitaminC: 90,
            vitaminD: 15,
          },
          protein: 141,
        },
      }),
    });

    const { getAllByText, getByTestId, getByText, queryByTestId } = render(<HomeScreen />);

    expect(getByTestId("home-calories-header-percent")).toBeTruthy();
    expect(getByText("(105%)")).toBeTruthy();
    expect(getByTestId("home-calories-header-badge")).toBeTruthy();
    expect(getByTestId("wellness-accordion-shell-layer-calories")).toBeTruthy();
    expect(getByTestId("wellness-accordion-shell-heat-band-calories")).toBeTruthy();
    expect(getByTestId("wellness-accordion-shell-ember-calories")).toBeTruthy();
    expect(getByTestId("wellness-accordion-shell-warning-field-calories")).toBeTruthy();

    fireEvent.press(getAllByText("Calories")[1]);

    expect(getByText("Over target")).toBeTruthy();
    expect(queryByTestId("home-accordion-summary-row-calories")).toBeNull();
    expect(getAllByText("Lunch bowl").length).toBeGreaterThan(0);
  });

  it("shows the first warm calories shell tier around 51 percent with chamber geometry through the middle of the card and no warning UI", () => {
    mockUseQuery.mockReturnValue({
      dateKey: "2026-04-04",
      displayName: "Ari",
      targets: {
        calories: 2723,
        carbs: 320,
        fat: 92,
        hydration: 11,
        protein: 200,
      },
      timeZone: "Pacific/Honolulu",
      ...buildTodayDashboard({
        hydrationLogs: [],
        mealItems: [{ foodName: "Breakfast text", mealId: "meal-1" }],
        meals: [
          {
            entryMethod: "manual",
            id: "meal-1",
            label: "Breakfast text",
            mealType: "breakfast",
            nutrients: {
              b12: 0,
              b6: 0,
              calcium: 40,
              choline: 0,
              copper: 0,
              fiber: 6,
              folate: 0,
              iron: 0,
              magnesium: 0,
              manganese: 0,
              niacin: 0,
              omega3: 0,
              phosphorus: 0,
              potassium: 0,
              riboflavin: 0,
              selenium: 0,
              sodium: 400,
              sugar: 0,
              thiamin: 0,
              vitaminA: 0,
              vitaminC: 0,
              vitaminD: 0,
              vitaminE: 0,
              vitaminK: 0,
              zinc: 0,
            },
            timestamp: Date.parse("2026-04-04T12:00:00.000Z"),
            totals: {
              calories: 1400,
              carbs: 90,
              fat: 50,
              protein: 55,
            },
          },
        ],
        targets: {
          calories: 2723,
          carbs: 320,
          detailedNutrition: getDetailedNutrientTargets({
            age: 30,
            sex: "male",
            targetFiber: 30,
          }),
          fat: 92,
          hydration: 11,
          nutrition: {
            calcium: 1000,
            fiber: 30,
            iron: 8,
            potassium: 3400,
            vitaminC: 90,
            vitaminD: 15,
          },
          protein: 200,
        },
      }),
    });

    const { getByTestId, queryByTestId, queryByText } = render(<HomeScreen />);

    expect(getByTestId("wellness-accordion-shell-layer-calories")).toBeTruthy();
    expect(getByTestId("wellness-accordion-shell-chamber-core-calories")).toBeTruthy();
    expect(getByTestId("wellness-accordion-shell-heat-band-calories")).toBeTruthy();
    expect(queryByTestId("wellness-accordion-shell-heat-sweep-calories")).toBeNull();
    expect(queryByTestId("wellness-accordion-shell-ember-calories")).toBeNull();
    expect(queryByTestId("home-calories-header-badge")).toBeNull();
    expect(queryByText("Over target")).toBeNull();
  });

  it("applies staged shell effects to protein, hydration, and nutrition using their own metric colors", () => {
    mockUseQuery.mockReturnValue({
      dateKey: "2026-04-04",
      displayName: "Ari",
      targets: {
        calories: 2723,
        carbs: 320,
        fat: 92,
        hydration: 11,
        protein: 200,
      },
      timeZone: "Pacific/Honolulu",
      ...buildTodayDashboard({
        hydrationLogs: [
          {
            amountOz: 56,
            id: "hydration-1",
            timestamp: Date.parse("2026-04-04T10:00:00.000Z"),
          },
        ],
        mealItems: [
          { foodName: "Breakfast text", mealId: "meal-1" },
          { foodName: "Lunch bowl", mealId: "meal-2" },
        ],
        meals: [
          {
            entryMethod: "manual",
            id: "meal-1",
            label: "Breakfast text",
            mealType: "breakfast",
            nutrients: {
              b12: 0.9,
              b6: 0.4,
              calcium: 280,
              choline: 0,
              copper: 0,
              fiber: 12,
              folate: 0,
              iron: 4.2,
              magnesium: 0,
              manganese: 0,
              niacin: 0,
              omega3: 0.8,
              phosphorus: 0,
              potassium: 1800,
              riboflavin: 0,
              selenium: 0,
              sodium: 400,
              sugar: 0,
              thiamin: 0,
              vitaminA: 0,
              vitaminC: 95,
              vitaminD: 16,
              vitaminE: 0,
              vitaminK: 0,
              zinc: 0,
            },
            timestamp: Date.parse("2026-04-04T12:00:00.000Z"),
            totals: {
              calories: 1400,
              carbs: 90,
              fat: 50,
              protein: 55,
            },
          },
          {
            entryMethod: "manual",
            id: "meal-2",
            label: "Lunch bowl",
            mealType: "lunch",
            nutrients: {
              b12: 1.2,
              b6: 0.6,
              calcium: 320,
              choline: 0,
              copper: 0,
              fiber: 14,
              folate: 0,
              iron: 3.8,
              magnesium: 0,
              manganese: 0,
              niacin: 0,
              omega3: 0.9,
              phosphorus: 0,
              potassium: 1700,
              riboflavin: 0,
              selenium: 0,
              sodium: 420,
              sugar: 0,
              thiamin: 0,
              vitaminA: 0,
              vitaminC: 110,
              vitaminD: 18,
              vitaminE: 0,
              vitaminK: 0,
              zinc: 0,
            },
            timestamp: Date.parse("2026-04-04T18:00:00.000Z"),
            totals: {
              calories: 200,
              carbs: 12,
              fat: 6,
              protein: 35,
            },
          },
        ],
        targets: {
          calories: 2723,
          carbs: 320,
          detailedNutrition: getDetailedNutrientTargets({
            age: 30,
            sex: "male",
            targetFiber: 30,
          }),
          fat: 92,
          hydration: 11,
          nutrition: {
            calcium: 1000,
            fiber: 30,
            iron: 8,
            potassium: 3400,
            vitaminC: 90,
            vitaminD: 15,
          },
          protein: 200,
        },
      }),
    });

    const { getByTestId, queryByTestId, queryByText } = render(<HomeScreen />);

    const proteinCardStyle = StyleSheet.flatten(
      getByTestId("wellness-accordion-card-protein").props.style
    );
    const hydrationCardStyle = StyleSheet.flatten(
      getByTestId("wellness-accordion-card-hydration").props.style
    );
    const nutritionCardStyle = StyleSheet.flatten(
      getByTestId("wellness-accordion-card-nutrition").props.style
    );

    expect(getByTestId("wellness-accordion-shell-layer-protein")).toBeTruthy();
    expect(getByTestId("wellness-accordion-shell-chamber-core-protein")).toBeTruthy();
    expect(getByTestId("wellness-accordion-shell-heat-band-protein")).toBeTruthy();
    expect(queryByTestId("wellness-accordion-shell-heat-sweep-protein")).toBeNull();
    expect(queryByTestId("wellness-accordion-shell-ember-protein")).toBeNull();
    expect(proteinCardStyle.backgroundColor).toBe("rgba(94, 186, 169, 0.03)");
    expect(proteinCardStyle.borderColor).toBe("rgba(94, 186, 169, 0.12)");

    expect(getByTestId("wellness-accordion-shell-layer-hydration")).toBeTruthy();
    expect(getByTestId("wellness-accordion-shell-chamber-core-hydration")).toBeTruthy();
    expect(getByTestId("wellness-accordion-shell-heat-band-hydration")).toBeTruthy();
    expect(getByTestId("wellness-accordion-shell-ember-hydration")).toBeTruthy();
    expect(queryByTestId("wellness-accordion-shell-heat-sweep-hydration")).toBeNull();
    expect(hydrationCardStyle.backgroundColor).toBe("rgba(120, 160, 200, 0.045)");
    expect(hydrationCardStyle.borderColor).toBe("rgba(120, 160, 200, 0.16)");

    expect(getByTestId("wellness-accordion-shell-layer-nutrition")).toBeTruthy();
    expect(getByTestId("wellness-accordion-shell-chamber-core-nutrition")).toBeTruthy();
    expect(getByTestId("wellness-accordion-shell-heat-band-nutrition")).toBeTruthy();
    expect(getByTestId("wellness-accordion-shell-ember-nutrition")).toBeTruthy();
    expect(getByTestId("wellness-accordion-shell-heat-sweep-nutrition")).toBeTruthy();
    expect(nutritionCardStyle.backgroundColor).toBe("rgba(211, 138, 58, 0.06)");
    expect(nutritionCardStyle.borderColor).toBe("rgba(211, 138, 58, 0.22)");

    expect(queryByTestId("home-calories-header-badge")).toBeNull();
    expect(queryByText("Over target")).toBeNull();
  });

  it("removes the inserted summary progress row from all four Home accordions", () => {
    mockUseQuery.mockReturnValue({
      dateKey: "2026-04-04",
      displayName: "Ari",
      targets: {
        calories: 2000,
        carbs: 320,
        fat: 92,
        hydration: 11,
        protein: 141,
      },
      timeZone: "Pacific/Honolulu",
      ...buildTodayDashboard({
        hydrationLogs: [
          {
            amountOz: 8,
            id: "hydration-1",
            timestamp: Date.parse("2026-04-04T10:00:00.000Z"),
          },
        ],
        mealItems: [{ foodName: "Lunch bowl", mealId: "meal-1" }],
        meals: [
          {
            entryMethod: "barcode",
            id: "meal-1",
            label: "Lunch bowl",
            mealType: "lunch",
            nutrients: {
              b12: 0,
              b6: 0,
              calcium: 40,
              choline: 0,
              copper: 0,
              fiber: 6,
              folate: 0,
              iron: 0,
              magnesium: 0,
              manganese: 0,
              niacin: 0,
              omega3: 0,
              phosphorus: 0,
              potassium: 0,
              riboflavin: 0,
              selenium: 0,
              sodium: 400,
              sugar: 0,
              thiamin: 0,
              vitaminA: 0,
              vitaminC: 0,
              vitaminD: 0,
              vitaminE: 0,
              vitaminK: 0,
              zinc: 0,
            },
            timestamp: Date.parse("2026-04-04T12:00:00.000Z"),
            totals: {
              calories: 2101,
              carbs: 90,
              fat: 50,
              protein: 55,
            },
          },
        ],
        targets: {
          calories: 2000,
          carbs: 320,
          detailedNutrition: getDetailedNutrientTargets({
            age: 30,
            sex: "male",
            targetFiber: 30,
          }),
          fat: 92,
          hydration: 11,
          nutrition: {
            calcium: 1000,
            fiber: 30,
            iron: 8,
            potassium: 3400,
            vitaminC: 90,
            vitaminD: 15,
          },
          protein: 141,
        },
      }),
    });

    const { getAllByText, queryByTestId } = render(<HomeScreen />);

    fireEvent.press(getAllByText("Calories")[1]);
    expect(queryByTestId("home-accordion-summary-row-calories")).toBeNull();

    fireEvent.press(getAllByText("Protein")[1]);
    expect(queryByTestId("home-accordion-summary-row-protein")).toBeNull();

    fireEvent.press(getAllByText("Hydration")[1]);
    expect(queryByTestId("home-accordion-summary-row-hydration")).toBeNull();

    fireEvent.press(getAllByText("Nutrition")[1]);
    expect(queryByTestId("home-accordion-summary-row-nutrition")).toBeNull();
  });

  it("reuses the history timeline cards for today's entries and routes View day with dashboard.dateKey", () => {
    mockUseQuery.mockReturnValue({
      dateKey: "2026-04-04",
      displayName: "Ari",
      targets: {
        calories: 3052,
        carbs: 320,
        fat: 92,
        hydration: 11,
        protein: 141,
      },
      timeZone: "Pacific/Honolulu",
      ...buildTodayDashboard({
        hydrationLogs: [
          {
            amountOz: 8,
            id: "hydration-1",
            timestamp: Date.parse("2026-04-04T10:00:00.000Z"),
          },
        ],
        mealItems: [
          { foodName: "Salmon", mealId: "meal-1" },
          { foodName: "Rice", mealId: "meal-1" },
          { foodName: "Eggs", mealId: "meal-2" },
        ],
        meals: [
          {
            entryMethod: "barcode",
            id: "meal-1",
            label: "Salmon rice plate",
            mealType: "dinner",
            nutrients: {
              b12: 4.9,
              b6: 1.4,
              calcium: 80,
              choline: 190,
              copper: 0.4,
              fiber: 7,
              folate: 120,
              iron: 4.8,
              magnesium: 94,
              manganese: 0.9,
              niacin: 12,
              omega3: 1.2,
              phosphorus: 452,
              potassium: 1410,
              riboflavin: 0.3,
              selenium: 54,
              sodium: 460,
              sugar: 6,
              thiamin: 0.3,
              vitaminA: 260,
              vitaminC: 84,
              vitaminD: 13,
              vitaminE: 2,
              vitaminK: 120,
              zinc: 1.2,
            },
            timestamp: Date.parse("2026-04-04T18:00:00.000Z"),
            totals: {
              calories: 890,
              carbs: 84,
              fat: 30,
              protein: 53,
            },
          },
          {
            entryMethod: "manual",
            id: "meal-2",
            label: "Egg scramble",
            mealType: "breakfast",
            nutrients: {
              b12: 0,
              b6: 0,
              calcium: 0,
              choline: 0,
              copper: 0,
              fiber: 0,
              folate: 0,
              iron: 0,
              magnesium: 0,
              manganese: 0,
              niacin: 0,
              omega3: 0,
              phosphorus: 0,
              potassium: 0,
              riboflavin: 0,
              selenium: 0,
              sodium: 120,
              sugar: 0,
              thiamin: 0,
              vitaminA: 0,
              vitaminC: 0,
              vitaminD: 0,
              vitaminE: 0,
              vitaminK: 0,
              zinc: 0,
            },
            timestamp: Date.parse("2026-04-04T08:00:00.000Z"),
            totals: {
              calories: 210,
              carbs: 3,
              fat: 16,
              protein: 13,
            },
          },
        ],
        targets: {
          calories: 3052,
          carbs: 320,
          detailedNutrition: getDetailedNutrientTargets({
            age: 30,
            sex: "male",
            targetFiber: 30,
          }),
          fat: 92,
          hydration: 11,
          nutrition: {
            calcium: 1000,
            fiber: 30,
            iron: 8,
            potassium: 3400,
            vitaminC: 90,
            vitaminD: 15,
          },
          protein: 141,
        },
      }),
    });

    const { getAllByTestId, getByText, queryByText } = render(<HomeScreen />);

    expect(getByText("Today's entries")).toBeTruthy();
    expect(getByText("2 entries")).toBeTruthy();

    fireEvent.press(getByText("View day"));
    expect(mockPush).toHaveBeenCalledWith("/history/2026-04-04");

    fireEvent.press(getAllByTestId("history-timeline-entry-toggle")[0]);

    expect(getByText("Omega-3")).toBeTruthy();
    expect(getByText("1.2 / 1.6 g")).toBeTruthy();
    expect(getByText("Edit meal")).toBeTruthy();
    expect(queryByText("Vitamin B12 4.9mcg")).toBeNull();

    fireEvent.press(getByText("Edit meal"));
    expect(mockPush).toHaveBeenCalledWith("/history/meals/meal-1");
  });

  it("hides View day on a truly empty day while keeping the scoped empty entries copy", () => {
    mockUseQuery.mockReturnValue({
      dateKey: "2026-04-04",
      displayName: "Ari",
      targets: {
        calories: 3052,
        carbs: 320,
        fat: 92,
        hydration: 11,
        protein: 141,
      },
      timeZone: "Pacific/Honolulu",
      ...buildTodayDashboard({
        hydrationLogs: [],
        mealItems: [],
        meals: [],
        targets: {
          calories: 3052,
          carbs: 320,
          detailedNutrition: getDetailedNutrientTargets({
            age: 30,
            sex: "male",
            targetFiber: 30,
          }),
          fat: 92,
          hydration: 11,
          nutrition: {
            calcium: 1000,
            fiber: 30,
            iron: 8,
            potassium: 3400,
            vitaminC: 90,
            vitaminD: 15,
          },
          protein: 141,
        },
      }),
    });

    const { getByText, queryByText } = render(<HomeScreen />);

    expect(queryByText("View day")).toBeNull();
    expect(
      getByText("No meals, drinks, or supplements logged yet today. Use Log to start your first entry.")
    ).toBeTruthy();
  });

  it("shows supplement rows in today's entries while leaving Home supplement actions read-only", () => {
    mockUseQuery.mockReturnValue({
      dateKey: "2026-04-04",
      displayName: "Ari",
      targets: {
        calories: 3052,
        carbs: 320,
        fat: 92,
        hydration: 11,
        protein: 141,
      },
      timeZone: "Pacific/Honolulu",
      ...buildTodayDashboard({
        hydrationLogs: [],
        mealItems: [],
        meals: [],
        supplementLogs: [
          {
            id: "supplement-log-1",
            label: "Protein powder",
            nutrients: {
              b12: 0,
              b6: 0,
              calcium: 90,
              choline: 0,
              copper: 0,
              fiber: 0,
              folate: 0,
              iron: 0,
              magnesium: 0,
              manganese: 0,
              niacin: 0,
              omega3: 0,
              phosphorus: 0,
              potassium: 120,
              riboflavin: 0,
              selenium: 0,
              sodium: 95,
              sugar: 2,
              thiamin: 0,
              vitaminA: 0,
              vitaminC: 0,
              vitaminD: 4,
              vitaminE: 0,
              vitaminK: 0,
              zinc: 0,
            },
            servingLabel: "1 scoop",
            timestamp: Date.parse("2026-04-04T08:00:00.000Z"),
            totals: {
              calories: 130,
              carbs: 4,
              fat: 2,
              protein: 25,
            },
          },
        ],
        targets: {
          calories: 3052,
          carbs: 320,
          detailedNutrition: getDetailedNutrientTargets({
            age: 30,
            sex: "male",
            targetFiber: 30,
          }),
          fat: 92,
          hydration: 11,
          nutrition: {
            calcium: 1000,
            fiber: 30,
            iron: 8,
            potassium: 3400,
            vitaminC: 90,
            vitaminD: 15,
          },
          protein: 141,
        },
      }),
    });

    const { getAllByTestId, getByText, queryByText, queryByTestId } = render(<HomeScreen />);

    expect(getByText("Today's entries")).toBeTruthy();
    expect(getByText("1 entry")).toBeTruthy();
    expect(getByText("View day")).toBeTruthy();
    expect(getByText("Protein powder")).toBeTruthy();

    fireEvent.press(getAllByTestId("history-timeline-entry-toggle")[0]);

    expect(getByText("1 scoop")).toBeTruthy();
    expect(queryByText("Edit meal")).toBeNull();
    expect(queryByText("Delete")).toBeNull();
    expect(queryByTestId("history-timeline-edit-button")).toBeNull();
    expect(queryByTestId("history-timeline-delete-button")).toBeNull();
  });

  it("renders drink entries inside today's entries", () => {
    mockUseQuery.mockReturnValue({
      dateKey: "2026-04-04",
      displayName: "Ari",
      targets: {
        calories: 3052,
        carbs: 320,
        fat: 92,
        hydration: 11,
        protein: 141,
      },
      timeZone: "Pacific/Honolulu",
      ...buildTodayDashboard({
        hydrationLogs: [],
        mealItems: [{ foodName: "Protein latte", mealId: "meal-1" }],
        meals: [
          {
            entryMethod: "manual",
            id: "meal-1",
            label: "Protein latte",
            mealType: "drink",
            nutrients: {
              calcium: 120,
              fiber: 0,
              iron: 0,
              potassium: 240,
              vitaminC: 0,
              vitaminD: 0,
            },
            timestamp: Date.parse("2026-04-04T08:30:00.000Z"),
            totals: {
              calories: 190,
              carbs: 14,
              fat: 4,
              protein: 24,
            },
          },
        ],
        targets: {
          calories: 3052,
          carbs: 320,
          detailedNutrition: getDetailedNutrientTargets({
            age: 30,
            sex: "male",
            targetFiber: 30,
          }),
          fat: 92,
          hydration: 11,
          nutrition: {
            calcium: 1000,
            fiber: 30,
            iron: 8,
            potassium: 3400,
            vitaminC: 90,
            vitaminD: 15,
          },
          protein: 141,
        },
      }),
    });

    const { getByText } = render(<HomeScreen />);

    expect(getByText("Today's entries")).toBeTruthy();
    expect(getByText("Protein latte")).toBeTruthy();
    expect(getByText("1 entry")).toBeTruthy();
  });

  it("uses contributor-neutral copy and shows supplement contributors in the accordions", () => {
    mockUseQuery.mockReturnValue({
      dateKey: "2026-04-04",
      displayName: "Ari",
      targets: {
        calories: 2000,
        carbs: 320,
        fat: 92,
        hydration: 11,
        protein: 141,
      },
      timeZone: "Pacific/Honolulu",
      ...buildTodayDashboard({
        hydrationLogs: [],
        mealItems: [{ foodName: "Egg scramble", mealId: "meal-1" }],
        meals: [
          {
            entryMethod: "manual",
            id: "meal-1",
            label: "Egg scramble",
            mealType: "breakfast",
            nutrients: {
              b12: 0,
              b6: 0,
              calcium: 40,
              choline: 0,
              copper: 0,
              fiber: 0,
              folate: 0,
              iron: 0,
              magnesium: 0,
              manganese: 0,
              niacin: 0,
              omega3: 0,
              phosphorus: 0,
              potassium: 0,
              riboflavin: 0,
              selenium: 0,
              sodium: 120,
              sugar: 0,
              thiamin: 0,
              vitaminA: 0,
              vitaminC: 0,
              vitaminD: 0,
              vitaminE: 0,
              vitaminK: 0,
              zinc: 0,
            },
            timestamp: Date.parse("2026-04-04T08:00:00.000Z"),
            totals: {
              calories: 210,
              carbs: 3,
              fat: 16,
              protein: 13,
            },
          },
        ],
        supplementLogs: [
          {
            id: "supplement-log-1",
            label: "Protein powder",
            nutrients: {
              b12: 0,
              b6: 0,
              calcium: 90,
              choline: 0,
              copper: 0,
              fiber: 0,
              folate: 0,
              iron: 0,
              magnesium: 0,
              manganese: 0,
              niacin: 0,
              omega3: 0,
              phosphorus: 0,
              potassium: 120,
              riboflavin: 0,
              selenium: 0,
              sodium: 95,
              sugar: 2,
              thiamin: 0,
              vitaminA: 0,
              vitaminC: 0,
              vitaminD: 4,
              vitaminE: 0,
              vitaminK: 0,
              zinc: 0,
            },
            servingLabel: "1 scoop",
            timestamp: Date.parse("2026-04-04T09:00:00.000Z"),
            totals: {
              calories: 130,
              carbs: 4,
              fat: 2,
              protein: 25,
            },
          },
        ],
        targets: {
          calories: 2000,
          carbs: 320,
          detailedNutrition: getDetailedNutrientTargets({
            age: 30,
            sex: "male",
            targetFiber: 30,
          }),
          fat: 92,
          hydration: 11,
          nutrition: {
            calcium: 1000,
            fiber: 30,
            iron: 8,
            potassium: 3400,
            vitaminC: 90,
            vitaminD: 15,
          },
          protein: 141,
        },
      }),
    });

    const { getAllByText, getByText } = render(<HomeScreen />);

    fireEvent.press(getAllByText("Protein")[1]);

    expect(getByText("Top contributors today.")).toBeTruthy();
    expect(getAllByText("Protein powder").length).toBeGreaterThan(0);
    expect(getAllByText("1 scoop").length).toBeGreaterThan(0);
  });
});
