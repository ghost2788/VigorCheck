import React from "react";
import { fireEvent, render, waitFor } from "../../lib/test-utils";
import { ManualMealForm } from "../../components/ManualMealForm";

describe("ManualMealForm", () => {
  it("blocks submission when required numeric fields are invalid", async () => {
    const onSubmit = jest.fn();
    const { getByText } = render(<ManualMealForm onSubmit={onSubmit} />);

    fireEvent.press(getByText("Log meal"));

    await waitFor(() => {
      expect(onSubmit).not.toHaveBeenCalled();
      expect(getByText("Calories, protein, carbs, and fat all need valid numbers.")).toBeTruthy();
    });
  });

  it("submits a parsed manual meal payload", async () => {
    const onSubmit = jest.fn();
    const { getByTestId, getByText } = render(<ManualMealForm onSubmit={onSubmit} />);

    fireEvent.press(getByText("Dinner"));
    fireEvent.changeText(getByTestId("mealNameInput"), "Chicken bowl");
    fireEvent.changeText(getByTestId("mealCaloriesInput"), "700");
    fireEvent.changeText(getByTestId("mealProteinInput"), "55");
    fireEvent.changeText(getByTestId("mealCarbsInput"), "80");
    fireEvent.changeText(getByTestId("mealFatInput"), "25");

    fireEvent.press(getByText("Log meal"));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        calories: 700,
        carbs: 80,
        fat: 25,
        mealType: "dinner",
        name: "Chicken bowl",
        protein: 55,
      });
    });
  });

  it("can reuse the form with a fixed meal type and custom submit label", async () => {
    const onSubmit = jest.fn();
    const { getByTestId, getByText, queryByText } = render(
      <ManualMealForm fixedMealType="dinner" mealTypeMode="fixed" onSubmit={onSubmit} submitLabel="Add item" />
    );

    expect(queryByText("Breakfast")).toBeNull();
    fireEvent.changeText(getByTestId("mealNameInput"), "Avocado");
    fireEvent.changeText(getByTestId("mealCaloriesInput"), "140");
    fireEvent.changeText(getByTestId("mealProteinInput"), "2");
    fireEvent.changeText(getByTestId("mealCarbsInput"), "8");
    fireEvent.changeText(getByTestId("mealFatInput"), "13");

    fireEvent.press(getByText("Add item"));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        calories: 140,
        carbs: 8,
        fat: 13,
        mealType: "dinner",
        name: "Avocado",
        protein: 2,
      });
    });
  });

  it("can render with initial values for editing", () => {
    const { getByDisplayValue } = render(
      <ManualMealForm
        initialValues={{
          calories: 320,
          carbs: 34,
          fat: 9,
          mealType: "breakfast",
          name: "Breakfast scan",
          protein: 23,
        }}
        onSubmit={() => {}}
        submitLabel="Save changes"
      />
    );

    expect(getByDisplayValue("Breakfast scan")).toBeTruthy();
    expect(getByDisplayValue("320")).toBeTruthy();
    expect(getByDisplayValue("23")).toBeTruthy();
    expect(getByDisplayValue("34")).toBeTruthy();
    expect(getByDisplayValue("9")).toBeTruthy();
  });
});
