import "expo-dev-client";
import "react-native-gesture-handler";

import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ConvexClientProvider } from "../lib/ConvexClientProvider";
import { ScanFlowProvider } from "../lib/scan/ScanFlowProvider";
import { ThemeProvider, useTheme } from "../lib/theme/ThemeProvider";

function RootNavigator() {
  const { mode } = useTheme();

  return (
    <>
      <StatusBar style={mode === "dark" ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ConvexClientProvider>
          <ThemeProvider>
            <ScanFlowProvider>
              <RootNavigator />
            </ScanFlowProvider>
          </ThemeProvider>
        </ConvexClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
