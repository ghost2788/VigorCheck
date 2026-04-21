import React from "react";
import { StyleSheet } from "react-native";
import { Alert } from "react-native";
import { fireEvent, render, waitFor } from "../../lib/test-utils";
import ProfilePlanSettingsScreen from "../../app/profile/plan-settings";

const mockBack = jest.fn();
const mockUseMutation = jest.fn();
const mockUseQuery = jest.fn();
const mockUsePreventRemove = jest.fn();
const mockDispatch = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    back: mockBack,
  }),
}));

jest.mock("convex/react", () => ({
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({
    dispatch: mockDispatch,
  }),
  usePreventRemove: (...args: unknown[]) => mockUsePreventRemove(...args),
}));

describe("ProfilePlanSettingsScreen", () => {
  beforeEach(() => {
    mockBack.mockReset();
    mockDispatch.mockReset();
    mockUseMutation.mockReset();
    mockUsePreventRemove.mockReset();
    jest.spyOn(Alert, "alert").mockImplementation(jest.fn());
    mockUseQuery.mockReturnValue({
      _id: "user-1",
      activityLevel: "moderate",
      age: 34,
      displayName: "Tester",
      goalPace: "moderate",
      goalType: "fat_loss",
      height: 70,
      preferredUnitSystem: "imperial",
      primaryTrackingChallenge: "consistency",
      reminders: {
        notifyEndOfDay: false,
        notifyGoalCompletion: false,
        notifyHydration: false,
        notifyMealLogging: false,
        sleepTime: "22:00",
        wakeTime: "07:00",
      },
      sex: "male",
      targets: {
        calories: 2500,
        carbs: 250,
        fat: 80,
        protein: 180,
      },
      timeZone: "Pacific/Honolulu",
      weight: 180,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("saves plan changes through the patch-style mutation", async () => {
    const updatePlanSettings = jest.fn().mockResolvedValue(undefined);
    mockUseMutation.mockReturnValue(updatePlanSettings);

    const { getByTestId, getByText } = render(<ProfilePlanSettingsScreen />);

    fireEvent.press(getByText("Muscle Gain"));
    fireEvent.press(getByText("Aggressive"));
    fireEvent.press(getByText("Motivation"));
    fireEvent.changeText(getByTestId("heightFeetInput"), "6");
    fireEvent.changeText(getByTestId("heightInchesInput"), "2");
    fireEvent.press(getByText("Save changes"));

    await waitFor(() => {
      expect(updatePlanSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          goalPace: "aggressive",
          goalType: "muscle_gain",
          height: 74,
          primaryTrackingChallenge: "motivation",
        })
      );
      expect(mockBack).toHaveBeenCalledTimes(1);
    });
  });

  it("prompts before discarding dirty changes", () => {
    const updatePlanSettings = jest.fn().mockResolvedValue(undefined);
    mockUseMutation.mockReturnValue(updatePlanSettings);

    const { getByTestId } = render(<ProfilePlanSettingsScreen />);

    fireEvent.changeText(getByTestId("ageInput"), "35");

    const preventRemoveCallback = mockUsePreventRemove.mock.calls.at(-1)?.[1];
    preventRemoveCallback?.({
      data: {
        action: { type: "GO_BACK" },
      },
    });

    expect(Alert.alert).toHaveBeenCalled();
  });

  it("uses the stronger md title for the no-profile fallback card", () => {
    mockUseMutation.mockReturnValue(jest.fn().mockResolvedValue(undefined));
    mockUseQuery.mockReturnValue(null);

    const { getByText } = render(<ProfilePlanSettingsScreen />);

    expect(StyleSheet.flatten(getByText("No profile yet").props.style).fontSize).toBe(15);
  });
});
