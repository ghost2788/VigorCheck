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
});
