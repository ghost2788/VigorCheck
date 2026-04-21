import { Linking } from "react-native";

const PUBLIC_SITE_BASE_URL = "https://ghost2788.github.io/Caltracker";

export const legalLinks = {
  accountDeletion: {
    label: "Account deletion",
    url: `${PUBLIC_SITE_BASE_URL}/account-deletion/`,
  },
  privacy: {
    label: "Privacy",
    url: `${PUBLIC_SITE_BASE_URL}/privacy/`,
  },
  support: {
    label: "Support",
    url: `${PUBLIC_SITE_BASE_URL}/support/`,
  },
  terms: {
    label: "Terms",
    url: `${PUBLIC_SITE_BASE_URL}/terms/`,
  },
} as const;

export type LegalLinkKey = keyof typeof legalLinks;

export const legalLinkOrder: LegalLinkKey[] = ["privacy", "terms", "support"];

export function openLegalLink(key: LegalLinkKey) {
  return Linking.openURL(legalLinks[key].url);
}
