import React from "react";
import { fireEvent, render, within } from "../../lib/test-utils";
import { StyleSheet, View } from "react-native";
import HydrationEditScreen from "../../app/history/hydration/[logId]";

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

describe("HydrationEditScreen", () => {
  beforeEach(() => {
    mockBack.mockReset();
    mockUseLocalSearchParams.mockReset();
    mockUseMutation.mockReset();
    mockUseQuery.mockReset();

    mockUseLocalSearchParams.mockReturnValue({ logId: "hydration-1" });
    mockUseMutation.mockReturnValue(jest.fn());
  });

  it("shows the stable display label even when shortcutLabel is missing", () => {
    mockUseQuery.mockReturnValue({
      amountOz: 12,
      displayLabel: "Cold brew",
      id: "hydration-1",
      shortcutLabel: undefined,
      timeZone: "Pacific/Honolulu",
      timestamp: new Date("2026-04-06T19:15:00.000Z").getTime(),
    });

    const { getByText } = render(<HydrationEditScreen />);

    expect(getByText("Cold brew entry, measured in ounces.")).toBeTruthy();
  });

  it("uses the detail-style header and stronger section heading hierarchy", () => {
    mockUseQuery.mockReturnValue({
      amountOz: 12,
      displayLabel: "Cold brew",
      id: "hydration-1",
      shortcutLabel: undefined,
      timeZone: "Pacific/Honolulu",
      timestamp: new Date("2026-04-06T19:15:00.000Z").getTime(),
    });

    const { UNSAFE_getAllByType, getByTestId, getByText } = render(<HydrationEditScreen />);
    const backButton = getByTestId("hydration-edit-back-button");
    const headerRow = UNSAFE_getAllByType(View).find((node) => {
      const style = StyleSheet.flatten(node.props.style);
      return style?.justifyContent === "space-between" && style?.marginBottom === 18;
    });

    expect(getByText("Hydration log")).toBeTruthy();
    expect(getByText("Edit hydration")).toBeTruthy();
    expect(within(backButton).getByText("chevron-back")).toBeTruthy();
    expect(StyleSheet.flatten(headerRow?.props.style).alignItems).toBe("center");
    expect(StyleSheet.flatten(getByTestId("hydration-edit-amount-title").props.style).fontSize).toBe(15);

    fireEvent.press(backButton);

    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
