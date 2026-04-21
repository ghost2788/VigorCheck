import React from "react";
import { StyleSheet } from "react-native";
import { fireEvent, render } from "../../lib/test-utils";
import { MySupplementsCard } from "../../components/MySupplementsCard";

describe("MySupplementsCard", () => {
  it("uses the polished hierarchy while keeping supplement actions live", () => {
    const onManage = jest.fn();
    const onToggleDaily = jest.fn();
    const onLogAsNeeded = jest.fn();
    const onUndoAsNeeded = jest.fn();
    const { getByLabelText, getByText } = render(
      <MySupplementsCard
        asNeeded={[
          {
            id: "supp-2",
            isLoggedToday: true,
            label: "Protein powder",
            servingLabel: "1 scoop",
          },
        ]}
        daily={[
          {
            id: "supp-1",
            isLoggedToday: true,
            label: "Vitamin D3",
            servingLabel: "1 softgel",
          },
        ]}
        onLogAsNeeded={onLogAsNeeded}
        onManage={onManage}
        onToggleDaily={onToggleDaily}
        onUndoAsNeeded={onUndoAsNeeded}
      />
    );

    expect(getByText("Daily + As Needed")).toBeTruthy();
    expect(StyleSheet.flatten(getByText("My Supplements").props.style).fontSize).toBe(15);
    expect(getByText("Daily stack")).toBeTruthy();
    expect(getByText("As needed")).toBeTruthy();
    expect(getByText("Manage")).toBeTruthy();

    fireEvent.press(getByText("Manage"));

    expect(onManage).toHaveBeenCalledTimes(1);

    fireEvent.press(getByLabelText("Toggle daily supplement Vitamin D3"));
    expect(onToggleDaily).toHaveBeenCalledWith("supp-1", false);

    fireEvent.press(getByLabelText("Log as needed supplement Protein powder"));
    expect(onLogAsNeeded).toHaveBeenCalledWith("supp-2");

    fireEvent.press(getByLabelText("Undo as needed supplement Protein powder"));
    expect(onUndoAsNeeded).toHaveBeenCalledWith("supp-2");
  });
});
