import React from "react";
import { fireEvent, render, waitFor } from "../../lib/test-utils";
import { RememberedHydrationShortcutsCard } from "../../components/RememberedHydrationShortcutsCard";
import { Id } from "../../convex/_generated/dataModel";

jest.mock("convex/react", () => ({
  useAction: () => jest.fn(),
}));

function createShortcut(overrides?: Partial<React.ComponentProps<typeof RememberedHydrationShortcutsCard>["shortcuts"][number]>) {
  return {
    calories: 0,
    carbs: 0,
    category: "water" as const,
    defaultAmountOz: 8,
    fat: 0,
    id: "shortcut-1" as Id<"hydrationShortcuts">,
    label: "Water",
    lastUsedAt: 10,
    logMode: "hydration_only" as const,
    pinned: true,
    protein: 0,
    ...overrides,
  };
}

describe("RememberedHydrationShortcutsCard", () => {
  it("uses compact shortcut rows with a plus action and success confirmation", async () => {
    const onCreateShortcut = jest.fn();
    const onLogShortcut = jest.fn().mockResolvedValue(undefined);
    const { getByText, queryByText, getAllByText } = render(
      <RememberedHydrationShortcutsCard
        onCreateShortcut={onCreateShortcut}
        onLogShortcut={onLogShortcut}
        shortcuts={[createShortcut()]}
      />
    );

    expect(queryByText("Remembered shortcuts stay pinned first, then recent.")).toBeNull();
    expect(queryByText("Pinned")).toBeNull();
    expect(queryByText("Hydration only")).toBeNull();

    fireEvent.press(getAllByText("+")[0]);

    await waitFor(() => expect(onLogShortcut).toHaveBeenCalledTimes(1));
    expect(getByText("Added Water")).toBeTruthy();
  });

  it("strips duplicate ounce text from water labels when the pill already shows it", () => {
    const { getByText, queryByText } = render(
      <RememberedHydrationShortcutsCard
        onCreateShortcut={jest.fn()}
        onLogShortcut={jest.fn()}
        shortcuts={[createShortcut({ defaultAmountOz: 8, label: "Water 8 oz" })]}
      />
    );

    expect(queryByText("Water 8 oz")).toBeNull();
    expect(getByText("Water")).toBeTruthy();
    expect(getByText("8 oz")).toBeTruthy();
  });
});
