import React from "react";
import { act, render } from "../../lib/test-utils";
import LogScreen from "../../app/(tabs)/log";

const mockPush = jest.fn();
const mockUseAction = jest.fn();
const mockUseMutation = jest.fn();
const mockUseQuery = jest.fn();
const mockUseScanFlow = jest.fn();
const mockUseScanLauncher = jest.fn();
const mockUseIsFocused = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useIsFocused: () => mockUseIsFocused(),
}));

jest.mock("convex/react", () => ({
  useAction: (...args: unknown[]) => mockUseAction(...args),
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

jest.mock("../../lib/scan/ScanFlowProvider", () => ({
  useScanFlow: () => mockUseScanFlow(),
}));

jest.mock("../../lib/scan/useScanLauncher", () => ({
  useScanLauncher: () => mockUseScanLauncher(),
}));

describe("LogScreen", () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockUseAction.mockReset();
    mockUseMutation.mockReset();
    mockUseQuery.mockReset();
    mockUseScanFlow.mockReset();
    mockUseScanLauncher.mockReset();
    mockUseIsFocused.mockReset();

    mockUseMutation.mockReturnValue(jest.fn());
    mockUseAction.mockReturnValue(jest.fn());
    mockUseIsFocused.mockReturnValue(true);
    let queryCall = 0;
    mockUseQuery.mockImplementation(() => {
      queryCall += 1;
      return queryCall % 2 === 1
        ? { displayName: "Taylor" }
        : {
            favorites: [],
            favoritesHasMore: false,
            recent: [],
            recentHasMore: false,
          };
    });
    mockUseScanLauncher.mockReturnValue({
      isPreparing: false,
      scanLauncherError: null,
      startScan: jest.fn(),
    });
  });

  it("renders the provider-backed reviewed-save announcement near the top of log", () => {
    mockUseScanFlow.mockReturnValue({
      barcodeFallback: null,
      clearBarcodeFallback: jest.fn(),
      clearReviewedSaveAnnouncement: jest.fn(),
      dismissJob: jest.fn(),
      enqueueTextJob: jest.fn(),
      getJobsForOrigin: jest.fn().mockReturnValue([]),
      jobs: [],
      openReviewJob: jest.fn(),
      retryJob: jest.fn(),
      reviewedSaveAnnouncement: {
        id: "reviewed-save-1",
        message: "Meal added",
      },
    });

    const { getByText } = render(<LogScreen />);

    expect(getByText("Log")).toBeTruthy();
    expect(getByText("Meal added")).toBeTruthy();
    expect(getByText("Favorites")).toBeTruthy();
    expect(getByText("Recently added")).toBeTruthy();
  });

  it("still renders the reviewed-save announcement while log data is loading", () => {
    mockUseQuery.mockReturnValue(undefined);
    mockUseScanFlow.mockReturnValue({
      barcodeFallback: null,
      clearBarcodeFallback: jest.fn(),
      clearReviewedSaveAnnouncement: jest.fn(),
      dismissJob: jest.fn(),
      enqueueTextJob: jest.fn(),
      getJobsForOrigin: jest.fn().mockReturnValue([]),
      jobs: [],
      openReviewJob: jest.fn(),
      retryJob: jest.fn(),
      reviewedSaveAnnouncement: {
        id: "reviewed-save-1",
        message: "Drink added",
      },
    });

    const { getByText } = render(<LogScreen />);

    expect(getByText("Log")).toBeTruthy();
    expect(getByText("Drink added")).toBeTruthy();
    expect(getByText("Loading your log...")).toBeTruthy();
  });

  it("clears the reviewed-save announcement after the log-screen timeout", () => {
    jest.useFakeTimers();
    const clearReviewedSaveAnnouncement = jest.fn();

    mockUseScanFlow.mockReturnValue({
      barcodeFallback: null,
      clearBarcodeFallback: jest.fn(),
      clearReviewedSaveAnnouncement,
      dismissJob: jest.fn(),
      enqueueTextJob: jest.fn(),
      getJobsForOrigin: jest.fn().mockReturnValue([]),
      jobs: [],
      openReviewJob: jest.fn(),
      retryJob: jest.fn(),
      reviewedSaveAnnouncement: {
        id: "reviewed-save-1",
        message: "Meal added",
      },
    });

    render(<LogScreen />);

    act(() => {
      jest.advanceTimersByTime(1600);
    });

    expect(clearReviewedSaveAnnouncement).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });

  it("does not clear the reviewed-save announcement while the log screen is unfocused", () => {
    jest.useFakeTimers();
    const clearReviewedSaveAnnouncement = jest.fn();
    mockUseIsFocused.mockReturnValue(false);

    mockUseScanFlow.mockReturnValue({
      barcodeFallback: null,
      clearBarcodeFallback: jest.fn(),
      clearReviewedSaveAnnouncement,
      dismissJob: jest.fn(),
      enqueueTextJob: jest.fn(),
      getJobsForOrigin: jest.fn().mockReturnValue([]),
      jobs: [],
      openReviewJob: jest.fn(),
      retryJob: jest.fn(),
      reviewedSaveAnnouncement: {
        id: "reviewed-save-1",
        message: "Meal added",
      },
    });

    render(<LogScreen />);

    act(() => {
      jest.advanceTimersByTime(1600);
    });

    expect(clearReviewedSaveAnnouncement).not.toHaveBeenCalled();
    jest.useRealTimers();
  });

  it("replaces the old add-drink shortcut UI with the remembered entries card", () => {
    mockUseScanFlow.mockReturnValue({
      barcodeFallback: null,
      clearBarcodeFallback: jest.fn(),
      clearReviewedSaveAnnouncement: jest.fn(),
      dismissJob: jest.fn(),
      enqueueTextJob: jest.fn(),
      getJobsForOrigin: jest.fn().mockReturnValue([]),
      jobs: [],
      openReviewJob: jest.fn(),
      retryJob: jest.fn(),
      reviewedSaveAnnouncement: null,
    });

    let queryCall = 0;
    mockUseQuery.mockImplementation(() => {
      queryCall += 1;

      if (queryCall === 1) {
        return { displayName: "Taylor" };
      }

      if (queryCall === 2) {
        return {
          asNeeded: [],
          daily: [],
        };
      }

      return {
        favorites: [
          {
            id: "favorite-1",
            label: "Turkey sandwich",
            replayKind: "meal_only",
            summary: "Lunch",
          },
        ],
        favoritesHasMore: false,
        recent: [
          {
            id: "recent-1",
            label: "Water 12 oz",
            replayKind: "hydration_only",
            summary: "Hydration • 12 oz",
          },
        ],
        recentHasMore: false,
      };
    });

    const { getByText, queryByText } = render(<LogScreen />);

    expect(getByText("Favorites")).toBeTruthy();
    expect(getByText("Recently added")).toBeTruthy();
    expect(getByText("Turkey sandwich")).toBeTruthy();
    expect(getByText("Water 12 oz")).toBeTruthy();
    expect(queryByText("+ Add drink")).toBeNull();
    expect(queryByText("Hydration shortcuts")).toBeNull();
  });

  it("shows a dedicated My Supplements card above remembered entries", () => {
    mockUseScanFlow.mockReturnValue({
      barcodeFallback: null,
      clearBarcodeFallback: jest.fn(),
      clearReviewedSaveAnnouncement: jest.fn(),
      dismissJob: jest.fn(),
      enqueueTextJob: jest.fn(),
      getJobsForOrigin: jest.fn().mockReturnValue([]),
      jobs: [],
      openReviewJob: jest.fn(),
      retryJob: jest.fn(),
      reviewedSaveAnnouncement: null,
    });

    let queryCall = 0;
    mockUseQuery.mockImplementation(() => {
      queryCall += 1;

      if (queryCall === 1) {
        return { displayName: "Taylor" };
      }

      if (queryCall === 2) {
        return {
          asNeeded: [
            {
              id: "supplement-2",
              isLoggedToday: false,
              label: "Protein powder",
              servingLabel: "1 scoop",
            },
          ],
          daily: [
            {
              id: "supplement-1",
              isLoggedToday: true,
              label: "Vitamin D3",
              servingLabel: "1 softgel",
            },
          ],
        };
      }

      return {
        favorites: [],
        favoritesHasMore: false,
        recent: [],
        recentHasMore: false,
      };
    });

    const { getByText } = render(<LogScreen />);

    expect(getByText("My Supplements")).toBeTruthy();
    expect(getByText("Daily stack")).toBeTruthy();
    expect(getByText("As needed")).toBeTruthy();
    expect(getByText("Vitamin D3")).toBeTruthy();
    expect(getByText("Protein powder")).toBeTruthy();
    expect(getByText("Manage supplements")).toBeTruthy();
    expect(getByText("Favorites")).toBeTruthy();
  });
});
