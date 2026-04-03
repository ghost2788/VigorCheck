import React from "react";
import { StyleSheet } from "react-native";
import { render } from "../../lib/test-utils";
import GoalPaceScreen from "../../app/(onboarding)/goal-pace";
import { OnboardingFlowProvider } from "../../lib/onboarding/OnboardingFlowProvider";

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock("@expo/vector-icons", () => ({
  MaterialCommunityIcons: ({ name }: { name: string }) => {
    const { Text } = require("react-native");
    return <Text>{name}</Text>;
  },
}));

describe("GoalPaceScreen", () => {
  beforeEach(() => {
    mockPush.mockReset();
  });

  it("removes the page subtitle and uses a stacked mobile card layout", () => {
    const { getByTestId, queryByText } = render(
      <OnboardingFlowProvider initialDraft={{ goalType: "fat_loss" }}>
        <GoalPaceScreen />
      </OnboardingFlowProvider>
    );

    expect(queryByText("Choose the pace that feels realistic for your life right now.")).toBeNull();
    expect(StyleSheet.flatten(getByTestId("goal-pace-stack").props.style).flexDirection).toBe("column");
  });
});
