import React from "react";
import { Redirect, Tabs } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSubscription } from "../../lib/billing/SubscriptionProvider";
import { useTheme } from "../../lib/theme/ThemeProvider";

type TabName = "index" | "log" | "history" | "trends" | "profile";

function getTabIconName(name: TabName, focused: boolean): React.ComponentProps<typeof Ionicons>["name"] {
  if (name === "index") {
    return focused ? "home" : "home-outline";
  }

  if (name === "log") {
    return focused ? "add-circle" : "add-circle-outline";
  }

  if (name === "history") {
    return focused ? "time" : "time-outline";
  }

  if (name === "trends") {
    return focused ? "stats-chart" : "stats-chart-outline";
  }

  return focused ? "person-circle" : "person-circle-outline";
}

export default function TabLayout() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { accessState } = useSubscription();

  if (accessState?.shouldShowPaywall) {
    return <Redirect href="/paywall" />;
  }

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        sceneStyle: {
          backgroundColor: theme.background,
        },
        tabBarHideOnKeyboard: true,
        tabBarIcon: ({ color, focused, size }) => (
          <Ionicons
            color={color}
            name={getTabIconName(route.name as TabName, focused)}
            size={size}
          />
        ),
        tabBarStyle: {
          backgroundColor: theme.tabBarBg,
          borderTopColor: theme.cardBorder,
          borderTopWidth: 1,
          height: 58 + Math.max(insets.bottom, 12),
          paddingBottom: Math.max(insets.bottom, 12),
          paddingTop: 8,
        },
        tabBarActiveTintColor: theme.accent1,
        tabBarInactiveTintColor: theme.textTertiary,
        tabBarItemStyle: {
          paddingVertical: 2,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          letterSpacing: 0.6,
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="log" options={{ title: "Log" }} />
      <Tabs.Screen name="history" options={{ title: "History" }} />
      <Tabs.Screen name="trends" options={{ title: "Trends" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
