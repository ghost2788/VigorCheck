import React from "react";
import { fireEvent, render } from "../../lib/test-utils";
import { AiTextMealCard } from "../../components/AiTextMealCard";

describe("AiTextMealCard", () => {
  it("renders the polished hierarchy and toggles the embedded quick add form", () => {
    const { getByTestId, getByText, queryByTestId, queryByText } = render(
      <AiTextMealCard
        jobs={[]}
        onDismissJob={jest.fn()}
        onOpenReview={jest.fn()}
        onQuickAddSubmit={jest.fn()}
        onRetryJob={jest.fn()}
        onSubmitDescription={jest.fn()}
      />
    );

    expect(getByText("Text + Exact Macros")).toBeTruthy();
    expect(getByText("Describe a meal")).toBeTruthy();
    expect(
      getByText("Type what you ate for an AI estimate, or switch to exact macros when you already know the numbers.")
    ).toBeTruthy();
    expect(getByText("Meal description")).toBeTruthy();
    expect(getByText("Include portions when you can")).toBeTruthy();
    expect(getByText("Mention sauces or extras")).toBeTruthy();
    expect(getByText("Open")).toBeTruthy();
    expect(queryByTestId("manual-meal-form-embedded")).toBeNull();
    expect(queryByText("Quick add")).toBeTruthy();

    fireEvent.press(getByText("Open"));

    expect(getByText("Hide")).toBeTruthy();
    expect(getByTestId("manual-meal-form-embedded")).toBeTruthy();
    expect(queryByText("Log meal")).toBeTruthy();
    expect(queryByText("Quick add")).toBeTruthy();
  });

  it("opens the embedded quick add form when the expansion signal changes", () => {
    const { getByText, getByTestId, rerender } = render(
      <AiTextMealCard
        jobs={[]}
        onDismissJob={jest.fn()}
        onOpenReview={jest.fn()}
        onQuickAddSubmit={jest.fn()}
        onRetryJob={jest.fn()}
        onSubmitDescription={jest.fn()}
        quickAddExpansionSignal={0}
      />
    );

    expect(getByText("Open")).toBeTruthy();

    rerender(
      <AiTextMealCard
        jobs={[]}
        onDismissJob={jest.fn()}
        onOpenReview={jest.fn()}
        onQuickAddSubmit={jest.fn()}
        onRetryJob={jest.fn()}
        onSubmitDescription={jest.fn()}
        quickAddExpansionSignal={1}
      />
    );

    expect(getByText("Hide")).toBeTruthy();
    expect(getByTestId("manual-meal-form-embedded")).toBeTruthy();
  });
});
