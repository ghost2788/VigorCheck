import React from "react";
import { Alert, ActivityIndicator, StyleSheet, View } from "react-native";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { useNavigation, usePreventRemove } from "@react-navigation/native";
import { api } from "../../convex/_generated/api";
import { Card } from "../../components/Card";
import { ProfileDetailScaffold } from "../../components/ProfileDetailScaffold";
import { ReminderSettingsCard } from "../../components/ReminderSettingsCard";
import { ThemedText } from "../../components/ThemedText";
import { useReminderSync } from "../../lib/reminders/ReminderSyncProvider";
import { useTheme } from "../../lib/theme/ThemeProvider";

export default function ProfileReminderSettingsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const currentUser = useQuery(api.users.current);
  const updateReminderSettings = useMutation(api.users.updateReminderSettings);
  const { refreshReminders } = useReminderSync();
  const [isDirty, setIsDirty] = React.useState(false);

  usePreventRemove(isDirty, ({ data }) => {
    Alert.alert("Discard changes?", "Your unsaved reminder edits will be lost.", [
      {
        style: "cancel",
        text: "Keep editing",
      },
      {
        onPress: () => navigation.dispatch(data.action),
        style: "destructive",
        text: "Discard",
      },
    ]);
  });

  if (currentUser === undefined) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.accent1} size="small" />
        <ThemedText style={styles.loadingLabel} variant="secondary">
          Loading your reminders...
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
          <ThemedText style={styles.cardBody} variant="secondary">
            Finish onboarding once and your reminder settings will live here.
          </ThemedText>
        </Card>
      </View>
    );
  }

  return (
    <ProfileDetailScaffold
      onBackPress={() => router.back()}
      subtitle="Choose which nudges stay active and the wake and sleep window they should respect."
      title="Reminder settings"
    >
      <ReminderSettingsCard
        initialSettings={currentUser.reminders}
        onDirtyChange={setIsDirty}
        onSave={async (settings) => {
          await updateReminderSettings(settings);
          refreshReminders();
          setIsDirty(false);
          router.back();
        }}
        style={styles.reminderCard}
      />
    </ProfileDetailScaffold>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
  },
  cardBody: {
    lineHeight: 22,
    marginTop: 8,
  },
  cardTitle: {
    marginBottom: 4,
  },
  centered: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  loadingLabel: {
    marginTop: 12,
  },
  reminderCard: {
    marginTop: 0,
  },
});
