import React from "react";
import { fireEvent, render } from "../../lib/test-utils";
import { act } from "react-test-renderer";
import BodyMetricsScreen from "../../app/(onboarding)/body-metrics";
import { OnboardingFlowProvider } from "../../lib/onboarding/OnboardingFlowProvider";

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe("BodyMetricsScreen", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockPush.mockReset();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it("renders feet and inches inputs for imperial height instead of a single inches field", () => {
    const { getByTestId, queryByTestId } = render(
      <OnboardingFlowProvider
        initialDraft={{
          age: 34,
          goalType: "fat_loss",
          height: 70,
          preferredUnitSystem: "imperial",
          sex: "male",
          weight: 180,
        }}
      >
        <BodyMetricsScreen />
      </OnboardingFlowProvider>
    );

    act(() => {
      jest.runOnlyPendingTimers();
    });

    expect(getByTestId("heightFeetInput").props.value).toBe("5");
    expect(getByTestId("heightInchesInput").props.value).toBe("10");
    expect(queryByTestId("heightStepInput")).toBeNull();
  });

  it("preserves height and weight values when switching between imperial and metric", () => {
    const { getByTestId, getByText } = render(
      <OnboardingFlowProvider
        initialDraft={{
          age: 34,
          goalType: "fat_loss",
          height: 70,
          preferredUnitSystem: "imperial",
          sex: "male",
          weight: 180,
        }}
      >
        <BodyMetricsScreen />
      </OnboardingFlowProvider>
    );

    act(() => {
      jest.runOnlyPendingTimers();
    });

    fireEvent.press(getByText("Metric"));

    expect(getByTestId("heightMetricInput").props.value).toBe("178");
    expect(getByTestId("weightStepInput").props.value).toBe("82");

    fireEvent.press(getByText("Imperial"));

    expect(getByTestId("heightFeetInput").props.value).toBe("5");
    expect(getByTestId("heightInchesInput").props.value).toBe("10");
    expect(getByTestId("weightStepInput").props.value).toBe("180");
  });
});
