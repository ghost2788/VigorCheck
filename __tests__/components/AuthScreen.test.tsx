import React from "react";
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
  });
});
