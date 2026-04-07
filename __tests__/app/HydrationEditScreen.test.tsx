import React from "react";
import { render } from "../../lib/test-utils";
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
});
