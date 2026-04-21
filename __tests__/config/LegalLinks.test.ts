import { legalLinks, PUBLIC_SITE_BASE_URL } from "../../lib/config/legalLinks";

describe("legal link configuration", () => {
  it("uses the VigorCheck GitHub Pages path", () => {
    expect(PUBLIC_SITE_BASE_URL).toBe("https://ghost2788.github.io/VigorCheck");
    expect(PUBLIC_SITE_BASE_URL).not.toContain("Caltracker");
  });

  it("points every public legal route at the VigorCheck docs site", () => {
    expect(legalLinks.privacy.url).toBe("https://ghost2788.github.io/VigorCheck/privacy/");
    expect(legalLinks.terms.url).toBe("https://ghost2788.github.io/VigorCheck/terms/");
    expect(legalLinks.support.url).toBe("https://ghost2788.github.io/VigorCheck/support/");
    expect(legalLinks.accountDeletion.url).toBe(
      "https://ghost2788.github.io/VigorCheck/account-deletion/"
    );
  });
});
