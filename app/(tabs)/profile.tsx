import React from "react";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { api } from "../../convex/_generated/api";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { ProfileForm } from "../../components/ProfileForm";
import { ThemedText } from "../../components/ThemedText";
import { getDeviceTimeZone } from "../../lib/domain/dayWindow";
import { useTheme } from "../../lib/theme/ThemeProvider";

export default function ProfileScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const currentUser = useQuery(api.users.current);
  const upsertCurrentUser = useMutation(api.users.upsertCurrent);

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

  if (!currentUser) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <Card style={styles.card}>
          <ThemedText size="sm" style={styles.cardTitle}>
            No profile yet
          </ThemedText>
          <ThemedText variant="secondary" style={styles.cardBody}>
            Set your baseline once and Profile will become the place to tune targets later.
          </ThemedText>
          <Button label="Open setup" onPress={() => router.replace("/")} />
        </Card>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ProfileForm
        autoPopulateTargets={false}
        initialValues={{
          activityLevel: currentUser.activityLevel,
          age: currentUser.age,
          goalType: currentUser.goalType,
          height: currentUser.height,
          sex: currentUser.sex,
          targets: currentUser.targets,
          weight: currentUser.weight,
        }}
        onSubmit={async (values) => {
          await upsertCurrentUser({
            ...values,
            timeZone: getDeviceTimeZone(),
          });
        }}
        submitLabel="Save changes"
        subtitle="Update your baseline and target macros. Home will react to these changes immediately."
        title="Profile"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
  },
  cardBody: {
    marginBottom: 18,
  },
  cardTitle: {
    marginBottom: 8,
  },
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
