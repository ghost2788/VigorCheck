import React from "react";
import { fireEvent, render } from "../../lib/test-utils";
import { HydrationQuickAddCard } from "../../components/HydrationQuickAddCard";

describe("HydrationQuickAddCard", () => {
  it("sends the configured ounce amounts when shortcuts are pressed", () => {
    const onQuickAdd = jest.fn();
    const { getByText } = render(<HydrationQuickAddCard onQuickAdd={onQuickAdd} />);

    fireEvent.press(getByText("+8 oz"));
    fireEvent.press(getByText("+16 oz"));
    fireEvent.press(getByText("+24 oz"));

    expect(onQuickAdd).toHaveBeenNthCalledWith(1, 8);
    expect(onQuickAdd).toHaveBeenNthCalledWith(2, 16);
    expect(onQuickAdd).toHaveBeenNthCalledWith(3, 24);
  });
});
