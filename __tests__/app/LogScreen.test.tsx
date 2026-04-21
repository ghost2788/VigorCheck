import React from "react";
import { ScrollView, StyleSheet } from "react-native";
import { act, fireEvent, render } from "../../lib/test-utils";
import { colors } from "../../lib/theme/colors";
import LogScreen from "../../app/(tabs)/log";

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const mockPush = jest.fn();
const mockUseAction = jest.fn();
const mockUseMutation = jest.fn();
const mockUseQuery = jest.fn();
const mockUseScanFlow = jest.fn();
const mockUseScanLauncher = jest.fn();
const mockUseIsFocused = jest.fn();
const mockTriggerLightSuccessHaptic = jest.fn(async () => undefined);

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

jest.mock("../../lib/haptics", () => ({
  triggerLightSuccessHaptic: () => mockTriggerLightSuccessHaptic(),
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
    mockTriggerLightSuccessHaptic.mockReset();

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

  it("uses the stronger md title for the setup-required fallback card", () => {
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
        return null;
      }

      if (queryCall === 2) {
        return {
          asNeeded: [],
          daily: [],
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

    expect(StyleSheet.flatten(getByText("Finish setup first").props.style).fontSize).toBe(15);
  });

  it.each([
    ["dark", colors.dark, 0.72],
    ["light", colors.light, 0.28],
  ])("uses a theme-derived barcode fallback scrim in %s mode", (initialThemePreference, theme, alpha) => {
    mockUseScanFlow.mockReturnValue({
      barcodeFallback: {
        code: "123456789012",
        message: "Could not match barcode.",
      },
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
        favorites: [],
        favoritesHasMore: false,
        recent: [],
        recentHasMore: false,
      };
    });

    const { getByTestId } = render(<LogScreen />, {
      initialThemePreference: initialThemePreference as "dark" | "light",
    });

    expect(StyleSheet.flatten(getByTestId("barcode-fallback-scrim").props.style).backgroundColor).toBe(
      hexToRgba(theme.background, alpha)
    );
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
    expect(getByText("Manage")).toBeTruthy();
    expect(getByText("Favorites")).toBeTruthy();
  });

  it("uses the measured describe-a-meal anchor for barcode fallback quick add", () => {
    const scrollToSpy = jest.spyOn(ScrollView.prototype, "scrollTo");

    mockUseScanFlow.mockReturnValue({
      barcodeFallback: {
        code: "123456789012",
        message: "Could not match barcode.",
      },
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
        favorites: [],
        favoritesHasMore: false,
        recent: [],
        recentHasMore: false,
      };
    });

    const { getByTestId, getByText } = render(<LogScreen />);

    fireEvent(getByTestId("describe-meal-section"), "layout", {
      nativeEvent: {
        layout: {
          height: 280,
          width: 342,
          x: 0,
          y: 436,
        },
      },
    });

    fireEvent.press(getByText("Open quick add"));

    expect(scrollToSpy).toHaveBeenCalledWith({
      animated: true,
      y: 412,
    });

    scrollToSpy.mockRestore();
  });

  it("logs a favorite quick add without using the reviewed-save announcement banner", async () => {
    const ensureMigrated = jest.fn();
    const ensureSupplementsReady = jest.fn();
    const logRememberedEntry = jest.fn(async () => undefined);
    const toggleFavorite = jest.fn();
    const logSupplementToday = jest.fn();
    const unlogSupplementToday = jest.fn();
    const logManualMeal = jest.fn();
    let mutationCall = 0;

    mockUseMutation.mockImplementation(() => {
      mutationCall += 1;

      switch (mutationCall) {
        case 1:
          return ensureMigrated;
        case 2:
          return ensureSupplementsReady;
        case 3:
          return logRememberedEntry;
        case 4:
          return toggleFavorite;
        case 5:
          return logSupplementToday;
        case 6:
          return unlogSupplementToday;
        case 7:
          return logManualMeal;
        default:
          return jest.fn();
      }
    });

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
        recent: [],
        recentHasMore: false,
      };
    });

    const { getByLabelText, getByText, queryByText } = render(<LogScreen />);

    await act(async () => {
      fireEvent.press(getByLabelText("Quick add Turkey sandwich"));
    });

    expect(logRememberedEntry).toHaveBeenCalledWith({ rememberedEntryId: "favorite-1" });
    expect(getByText("Added to today")).toBeTruthy();
    expect(queryByText("Meal added")).toBeNull();
    expect(mockTriggerLightSuccessHaptic).toHaveBeenCalledTimes(1);
  });
});
