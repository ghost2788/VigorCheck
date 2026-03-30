import React, { useMemo } from "react";
import { Redirect } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { ProfileForm } from "../components/ProfileForm";
import { ThemedText } from "../components/ThemedText";
import { api } from "../convex/_generated/api";
import { getDeviceTimeZone } from "../lib/domain/dayWindow";
import { useTheme } from "../lib/theme/ThemeProvider";

export default function BootstrapScreen() {
  const { theme } = useTheme();
  const currentUser = useQuery(api.users.current);
  const upsertCurrentUser = useMutation(api.users.upsertCurrent);
  const timeZone = useMemo(() => getDeviceTimeZone(), []);

  if (currentUser === undefined) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.accent1} size="small" />
        <ThemedText variant="secondary" style={styles.loadingLabel}>
          Loading your profile...
        </ThemedText>
      </View>
    );
  }

  if (currentUser) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ProfileForm
        autoPopulateTargets
        onSubmit={async (values) => {
          await upsertCurrentUser({
            ...values,
            timeZone,
          });
        }}
        submitLabel="Start tracking"
        subtitle="Set a quick baseline so Home and Log can start using your real targets."
        title="Build your daily baseline"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  container: {
    flex: 1,
  },
  loadingLabel: {
    marginTop: 12,
  },
});
