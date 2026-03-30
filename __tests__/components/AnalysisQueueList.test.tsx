import React from "react";
import { render } from "../../lib/test-utils";
import { AnalysisQueueList } from "../../components/AnalysisQueueList";

describe("AnalysisQueueList", () => {
  it("lets long job labels wrap instead of forcing one-line truncation", () => {
    const longLabel =
      "2 eggs, sourdough toast, avocado, greek yogurt, blueberries, coffee, and a protein shake";
    const { getByText } = render(
      <AnalysisQueueList
        jobs={[
          {
            createdAt: 1,
            id: "job-1",
            input: {
              description: longLabel,
              mealType: "breakfast",
              type: "text",
            },
            labelPreview: longLabel,
            originCard: "text",
            source: "text",
            status: "analyzing",
          },
        ]}
        onDismiss={jest.fn()}
        onOpenReview={jest.fn()}
        onRetry={jest.fn()}
      />
    );

    expect(getByText(longLabel).props.numberOfLines).toBeUndefined();
  });
});
