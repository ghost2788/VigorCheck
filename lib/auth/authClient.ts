import { convexClient } from "@convex-dev/better-auth/client/plugins";
import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";
import React from "react";
import * as Linking from "expo-linking";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";

WebBrowser.maybeCompleteAuthSession();

const authBaseUrl = process.env.EXPO_PUBLIC_CONVEX_SITE_URL ?? process.env.CONVEX_SITE_URL ?? null;
const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL ?? null;

const storage = {
  getItem: (key: string) => SecureStore.getItem(key),
  setItem: (key: string, value: string) => SecureStore.setItem(key, value),
};

export const authClient = createAuthClient({
  baseURL: authBaseUrl ?? "https://convex.invalid",
  plugins: [
    expoClient({
      scheme: "vigorcheck",
      storage,
      storagePrefix: "vigorcheck-auth",
    }),
    convexClient(),
  ],
});

export function getAuthBaseUrl() {
  return authBaseUrl;
}

export function getConvexUrl() {
  return convexUrl;
}

export function getAuthRedirectUrl(path = "/") {
  return Linking.createURL(path, { scheme: "vigorcheck" });
}

export function getPreferredDisplayName(input?: {
  firstName?: string | null;
  fullName?: string | null;
}) {
  const firstName = input?.firstName?.trim();

  if (firstName) {
    return firstName;
  }

  const fullName = input?.fullName?.trim();

  if (!fullName) {
    return null;
  }

  return fullName.split(/\s+/)[0] ?? null;
}

export async function startGoogleAuth(intent: "signIn" | "signUp") {
  const result = await authClient.signIn.social({
    callbackURL: getAuthRedirectUrl("/"),
    provider: "google",
    requestSignUp: intent === "signUp",
  });

  if (result.error) {
    throw result.error;
  }

  await authClient.getSession();
}

export function useWarmUpBrowser() {
  React.useEffect(() => {
    if (Platform.OS === "web") {
      return;
    }

    void WebBrowser.warmUpAsync();

    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
}
