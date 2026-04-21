import React from "react";
import { fireEvent, render } from "../../lib/test-utils";
import { LegalLinksRow } from "../../components/LegalLinksRow";
import * as legalLinks from "../../lib/config/legalLinks";

describe("LegalLinksRow", () => {
  let openLegalLinkSpy: jest.SpyInstance;

  beforeEach(() => {
    openLegalLinkSpy = jest.spyOn(legalLinks, "openLegalLink").mockResolvedValue(undefined);
  });

  afterEach(() => {
    openLegalLinkSpy.mockRestore();
  });

  it("opens the public privacy, terms, and support links", () => {
    const { getByText } = render(<LegalLinksRow />);

    fireEvent.press(getByText("Privacy"));
    fireEvent.press(getByText("Terms"));
    fireEvent.press(getByText("Support"));

    expect(openLegalLinkSpy).toHaveBeenNthCalledWith(1, "privacy");
    expect(openLegalLinkSpy).toHaveBeenNthCalledWith(2, "terms");
    expect(openLegalLinkSpy).toHaveBeenNthCalledWith(3, "support");
  });
});
