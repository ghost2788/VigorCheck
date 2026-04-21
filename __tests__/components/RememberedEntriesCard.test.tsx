import React from "react";
import { act, fireEvent, render, waitFor } from "../../lib/test-utils";
import { RememberedEntriesCard } from "../../components/RememberedEntriesCard";

const mockTriggerLightSuccessHaptic = jest.fn(async () => undefined);

jest.mock("../../lib/haptics", () => ({
  triggerLightSuccessHaptic: () => mockTriggerLightSuccessHaptic(),
}));

describe("RememberedEntriesCard", () => {
  beforeEach(() => {
    mockTriggerLightSuccessHaptic.mockClear();
  });

  it("renders favorites and recents with replay and favorite actions", () => {
    const onReplayRow = jest.fn();
    const onQuickAddFavorite = jest.fn(() => new Promise<void>(() => undefined));
    const onToggleFavorite = jest.fn();
    const { getByLabelText, getByTestId, getByText, queryByText } = render(
      <RememberedEntriesCard
        favorites={[
          {
            id: "favorite-1",
            label: "Turkey sandwich",
            replayKind: "meal_only",
            summary: "Lunch",
          },
        ]}
        onQuickAddFavorite={onQuickAddFavorite}
        onReplayRow={onReplayRow}
        onToggleFavorite={onToggleFavorite}
        recent={[
          {
            id: "recent-1",
            label: "Water 12 oz",
            replayKind: "hydration_only",
            summary: "Hydration",
          },
        ]}
      />
    );

    expect(getByText("Favorites")).toBeTruthy();
    expect(getByText("Recently added")).toBeTruthy();
    expect(queryByText("Favorites & recently added")).toBeNull();

    fireEvent.press(getByText("Turkey sandwich"));
    expect(onReplayRow).toHaveBeenCalledWith("favorite-1");

    fireEvent.press(getByLabelText("Quick add Turkey sandwich"));
    expect(onQuickAddFavorite).toHaveBeenLastCalledWith("favorite-1");

    fireEvent.press(getByLabelText("Toggle favorite for Water 12 oz"));
    expect(onToggleFavorite).toHaveBeenCalledWith("recent-1");
  });

  it("uses a split-row layout with a reserved action rail for recently added", () => {
    const { getByTestId } = render(
      <RememberedEntriesCard
        favorites={[
          {
            id: "favorite-1",
            label: "Chipotle chicken burrito bowl",
            replayKind: "meal_only",
            summary: "Lunch • 640 cal • 48g protein",
          },
        ]}
        onQuickAddFavorite={jest.fn(async () => undefined)}
        onReplayRow={jest.fn()}
        onToggleFavorite={jest.fn()}
        recent={[
          {
            id: "recent-1",
            label: "Cold brew protein shake",
            replayKind: "meal_only",
            summary: "Snack • 220 cal • 30g protein",
          },
        ]}
      />
    );

    expect(getByTestId("remembered-entries-title-favorite-1").props.numberOfLines).toBe(2);
    expect(getByTestId("remembered-entries-title-favorite-1")).toBeTruthy();
    expect(getByTestId("remembered-entries-summary-favorite-1")).toBeTruthy();
    expect(getByTestId("remembered-entries-row-meta-favorite-1")).toBeTruthy();
    expect(getByTestId("remembered-entries-action-rail-favorite-1")).toBeTruthy();
    expect(getByTestId("remembered-entries-title-recent-1").props.numberOfLines).toBe(2);
    expect(getByTestId("remembered-entries-title-recent-1")).toBeTruthy();
    expect(getByTestId("remembered-entries-summary-recent-1")).toBeTruthy();
    expect(getByTestId("remembered-entries-row-meta-recent-1")).toBeTruthy();
    expect(getByTestId("remembered-entries-action-rail-recent-1")).toBeTruthy();
    expect(getByTestId("remembered-entries-action-rail-spacer-recent-1")).toBeTruthy();
  });

  it("keeps row replay scoped away from the action rail", () => {
    const onReplayRow = jest.fn();
    const onToggleFavorite = jest.fn();
    const { getByLabelText, getByTestId } = render(
      <RememberedEntriesCard
        favorites={[
          {
            id: "favorite-1",
            label: "Chipotle chicken burrito bowl",
            replayKind: "meal_only",
            summary: "Lunch • 640 cal • 48g protein",
          },
        ]}
        onQuickAddFavorite={jest.fn(async () => undefined)}
        onReplayRow={onReplayRow}
        onToggleFavorite={onToggleFavorite}
        recent={[]}
      />
    );

    fireEvent.press(getByTestId("remembered-entries-replay-favorite-1"));
    expect(onReplayRow).toHaveBeenCalledWith("favorite-1");

    fireEvent.press(getByLabelText("Toggle favorite for Chipotle chicken burrito bowl"));
    expect(onToggleFavorite).toHaveBeenCalledWith("favorite-1");
    expect(onReplayRow).toHaveBeenCalledTimes(1);
  });

  it("shows the quick add button only on favorites", () => {
    const { getByLabelText, queryByLabelText } = render(
      <RememberedEntriesCard
        favorites={[
          {
            id: "favorite-1",
            label: "Coffee",
            replayKind: "hydration_only",
            summary: "Drink",
          },
        ]}
        onQuickAddFavorite={jest.fn(async () => undefined)}
        onReplayRow={jest.fn()}
        onToggleFavorite={jest.fn()}
        recent={[
          {
            id: "recent-1",
            label: "Water 12 oz",
            replayKind: "hydration_only",
            summary: "Hydration",
          },
        ]}
      />
    );

    expect(getByLabelText("Quick add Coffee")).toBeTruthy();
    expect(queryByLabelText("Quick add Water 12 oz")).toBeNull();
  });

  it("uses the gold accent for favorite stars while keeping the summary text intact", () => {
    const { getByText } = render(
      <RememberedEntriesCard
        favorites={[
          {
            id: "favorite-1",
            label: "Ham and pepper jack sandwich",
            replayKind: "meal_only",
            summary: "Lunch • 610 cal • 37g protein",
          },
        ]}
        onQuickAddFavorite={jest.fn(async () => undefined)}
        onReplayRow={jest.fn()}
        onToggleFavorite={jest.fn()}
        recent={[
          {
            id: "recent-1",
            label: "Water 16 oz",
            replayKind: "hydration_only",
            summary: "Hydration",
          },
        ]}
      />
    );

    const favoriteStar = getByText("★");
    const recentStar = getByText("☆");

    expect(getByText("Lunch • 610 cal • 37g protein")).toBeTruthy();
    expect(getByText("Hydration")).toBeTruthy();
    expect(favoriteStar.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ color: "#c4a46c" })])
    );
    expect(recentStar.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ color: "#c4a46c" })])
    );
  });

  it("shows a compact empty state when there are no remembered entries", () => {
    const { getByText, queryByText } = render(
      <RememberedEntriesCard
        favorites={[]}
        onQuickAddFavorite={jest.fn(async () => undefined)}
        onReplayRow={jest.fn()}
        onToggleFavorite={jest.fn()}
        recent={[]}
      />
    );

    expect(getByText("Favorites")).toBeTruthy();
    expect(getByText("Recently added")).toBeTruthy();
    expect(getByText("Items you log often will show up here.")).toBeTruthy();
    expect(queryByText("+ Add drink")).toBeNull();
  });

  it("shows the quick-add success pill and success button state only for favorites quick add", async () => {
    jest.useFakeTimers();
    let resolveQuickAdd: (() => void) | undefined;
    const onQuickAddFavorite = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveQuickAdd = resolve;
        })
    );
    const { getByLabelText, getByText, queryByText } = render(
      <RememberedEntriesCard
        favorites={[
          {
            id: "favorite-1",
            label: "Protein shake",
            replayKind: "hydration_only",
            summary: "Drink",
          },
        ]}
        onQuickAddFavorite={onQuickAddFavorite}
        onReplayRow={jest.fn()}
        onToggleFavorite={jest.fn()}
        recent={[]}
      />
    );

    fireEvent.press(getByLabelText("Quick add Protein shake"));

    await act(async () => {
      resolveQuickAdd?.();
      await Promise.resolve();
    });

    expect(onQuickAddFavorite).toHaveBeenCalledWith("favorite-1");
    expect(getByText("Added to today")).toBeTruthy();
    expect(getByLabelText("Added Protein shake")).toBeTruthy();
    expect(mockTriggerLightSuccessHaptic).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(queryByText("Added to today")).toBeNull();
    });
    jest.useRealTimers();
  });

  it("does not show quick-add success treatment or haptics when quick add fails", async () => {
    let rejectQuickAdd: ((error: Error) => void) | undefined;
    const onQuickAddFavorite = jest.fn(
      () =>
        new Promise<void>((_resolve, reject) => {
          rejectQuickAdd = reject;
        })
    );
    const { getByLabelText, queryByText, queryByLabelText } = render(
      <RememberedEntriesCard
        favorites={[
          {
            id: "favorite-1",
            label: "Protein shake",
            replayKind: "hydration_only",
            summary: "Drink",
          },
        ]}
        onQuickAddFavorite={onQuickAddFavorite}
        onReplayRow={jest.fn()}
        onToggleFavorite={jest.fn()}
        recent={[]}
      />
    );

    fireEvent.press(getByLabelText("Quick add Protein shake"));

    await act(async () => {
      rejectQuickAdd?.(new Error("Network failed"));
      await Promise.resolve();
    });

    expect(queryByText("Added to today")).toBeNull();
    expect(queryByLabelText("Added Protein shake")).toBeNull();
    expect(mockTriggerLightSuccessHaptic).not.toHaveBeenCalled();
  });
});
