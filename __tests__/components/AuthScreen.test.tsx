import React from "react";
import { StyleSheet } from "react-native";
import { fireEvent, render } from "../../lib/test-utils";
import { AuthScreen } from "../../components/auth/AuthScreen";
import * as legalLinks from "../../lib/config/legalLinks";

describe("AuthScreen", () => {
  let openLegalLinkSpy: jest.SpyInstance;

  beforeEach(() => {
    openLegalLinkSpy = jest.spyOn(legalLinks, "openLegalLink").mockResolvedValue(undefined);
  });

  afterEach(() => {
    openLegalLinkSpy.mockRestore();
  });

  it("renders and opens privacy, terms, and support links for shared auth flows", () => {
    const { getByText } = render(
      <AuthScreen subtitle="Use Google to continue." title="Welcome back">
        <></>
      </AuthScreen>
    );

    fireEvent.press(getByText("Privacy"));
    fireEvent.press(getByText("Terms"));
    fireEvent.press(getByText("Support"));

    expect(openLegalLinkSpy).toHaveBeenNthCalledWith(1, "privacy");
    expect(openLegalLinkSpy).toHaveBeenNthCalledWith(2, "terms");
    expect(openLegalLinkSpy).toHaveBeenNthCalledWith(3, "support");
  });

  it("renders the shared brand header only when requested", () => {
    const plain = render(
      <AuthScreen subtitle="Use Google to continue." title="Welcome back">
        <></>
      </AuthScreen>
    );
    const branded = render(
      <AuthScreen showBrandHeader subtitle="Use Google to continue." title="Welcome back">
        <></>
      </AuthScreen>
    );

    expect(plain.queryByTestId("auth-screen-brand-header")).toBeNull();
    expect(branded.getByTestId("auth-screen-brand-header")).toBeTruthy();
    expect(branded.getByTestId("auth-screen-brand-text")).toBeTruthy();
    expect(branded.getByTestId("auth-screen-brand-mark")).toBeTruthy();

    const brandTextStyle = StyleSheet.flatten(branded.getByTestId("auth-screen-brand-text").props.style);
    const stageStyle = StyleSheet.flatten(branded.getByTestId("welcome-ring-stage").props.style);

    expect(brandTextStyle.fontSize).toBe(24);
    expect(stageStyle.height).toBe(272);
    expect(stageStyle.width).toBe(272);
  });

  it("keeps auth legal links above Android navigation controls", () => {
    const { getByTestId } = render(
      <AuthScreen subtitle="Use Google to continue." title="Welcome back">
        <></>
      </AuthScreen>
    );

    const screenStyle = StyleSheet.flatten(getByTestId("auth-screen").props.contentContainerStyle);
    const legalStyle = StyleSheet.flatten(getByTestId("auth-screen-legal-links").props.style);

    expect(screenStyle.paddingBottom).toBe(48);
    expect(legalStyle.marginBottom).toBe(86);
  });
});
