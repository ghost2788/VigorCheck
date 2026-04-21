import React from "react";
import { fireEvent, render, waitFor } from "../../lib/test-utils";
import { ProfileForm } from "../../components/ProfileForm";

describe("ProfileForm", () => {
  it("splits an imperial height into feet and inches", () => {
    const { getByTestId } = render(
      <ProfileForm
        initialValues={{
          activityLevel: "moderate",
          age: 34,
          goalPace: "moderate",
          goalType: "fat_loss",
          height: 70,
          preferredUnitSystem: "imperial",
          primaryTrackingChallenge: "consistency",
          sex: "male",
          targets: {
            calories: 2232,
            carbs: 257,
            fat: 62,
            protein: 162,
          },
          timeZone: "UTC",
          weight: 180,
        }}
        onSubmit={jest.fn()}
        submitLabel="Save profile"
      />
    );

    expect(getByTestId("heightFeetInput").props.value).toBe("5");
    expect(getByTestId("heightInchesInput").props.value).toBe("10");
  });

  it("blocks submission when required numeric fields are empty", async () => {
    const onSubmit = jest.fn();
    const { getByText } = render(
      <ProfileForm
        onSubmit={onSubmit}
        submitLabel="Save profile"
      />
    );

    fireEvent.press(getByText("Save profile"));

    await waitFor(() => {
      expect(onSubmit).not.toHaveBeenCalled();
      expect(getByText("Enter valid age, height, and weight values to continue.")).toBeTruthy();
    });
  });

  it("derives default targets and submits parsed numeric values", async () => {
    const onSubmit = jest.fn();
    const { getByTestId, getByText } = render(
      <ProfileForm
        onSubmit={onSubmit}
        submitLabel="Save profile"
      />
    );

    fireEvent.press(getByText("Fat Loss"));
    fireEvent.changeText(getByTestId("ageInput"), "34");
    fireEvent.changeText(getByTestId("heightFeetInput"), "5");
    fireEvent.changeText(getByTestId("heightInchesInput"), "10");
    fireEvent.changeText(getByTestId("weightInput"), "180");

    await waitFor(() => {
      expect(getByTestId("targetCaloriesInput").props.value).toBe("2232");
      expect(getByTestId("targetProteinInput").props.value).toBe("162");
      expect(getByTestId("targetCarbsInput").props.value).toBe("257");
      expect(getByTestId("targetFatInput").props.value).toBe("62");
    });

    fireEvent.press(getByText("Save profile"));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        activityLevel: "moderate",
        age: 34,
        goalPace: "moderate",
        goalType: "fat_loss",
        height: 70,
        preferredUnitSystem: "imperial",
        primaryTrackingChallenge: "consistency",
        sex: "male",
        targets: {
          calories: 2232,
          carbs: 257,
          fat: 62,
          protein: 162,
        },
        timeZone: "UTC",
        weight: 180,
      });
    });
  });

  it("preserves the canonical height when switching between imperial and metric units", async () => {
    const onSubmit = jest.fn();
    const { getByTestId, getByText } = render(
      <ProfileForm
        initialValues={{
          activityLevel: "moderate",
          age: 34,
          goalPace: "moderate",
          goalType: "fat_loss",
          height: 70,
          preferredUnitSystem: "imperial",
          primaryTrackingChallenge: "consistency",
          sex: "male",
          targets: {
            calories: 2232,
            carbs: 257,
            fat: 62,
            protein: 162,
          },
          timeZone: "UTC",
          weight: 180,
        }}
        onSubmit={onSubmit}
        submitLabel="Save profile"
      />
    );

    fireEvent.press(getByText("Metric"));

    await waitFor(() => {
      expect(getByTestId("heightInput").props.value).toBe("178");
    });

    fireEvent.press(getByText("Imperial"));

    await waitFor(() => {
      expect(getByTestId("heightFeetInput").props.value).toBe("5");
      expect(getByTestId("heightInchesInput").props.value).toBe("10");
    });

    fireEvent.press(getByText("Save profile"));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          height: 70,
        })
      );
    });
  });
});
