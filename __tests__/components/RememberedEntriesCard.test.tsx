import React from "react";
import { fireEvent, render } from "../../lib/test-utils";
import { RememberedEntriesCard } from "../../components/RememberedEntriesCard";

describe("RememberedEntriesCard", () => {
  it("renders favorites and recents with replay and favorite actions", () => {
    const onReplay = jest.fn();
    const onToggleFavorite = jest.fn();
    const { getByLabelText, getByText, queryByText } = render(
      <RememberedEntriesCard
        favorites={[
          {
            id: "favorite-1",
            label: "Turkey sandwich",
            replayKind: "meal_only",
            summary: "Lunch",
          },
        ]}
        onReplay={onReplay}
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
    expect(onReplay).toHaveBeenCalledWith("favorite-1");

    fireEvent.press(getByLabelText("Quick add Turkey sandwich"));
    expect(onReplay).toHaveBeenLastCalledWith("favorite-1");

    fireEvent.press(getByLabelText("Toggle favorite for Water 12 oz"));
    expect(onToggleFavorite).toHaveBeenCalledWith("recent-1");
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
        onReplay={jest.fn()}
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

  it("shows a compact empty state when there are no remembered entries", () => {
    const { getByText, queryByText } = render(
      <RememberedEntriesCard
        favorites={[]}
        onReplay={jest.fn()}
        onToggleFavorite={jest.fn()}
        recent={[]}
      />
    );

    expect(getByText("Favorites")).toBeTruthy();
    expect(getByText("Recently added")).toBeTruthy();
    expect(getByText("Items you log often will show up here.")).toBeTruthy();
    expect(queryByText("+ Add drink")).toBeNull();
  });
});
