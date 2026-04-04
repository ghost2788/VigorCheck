import React from "react";
import { Alert, ActivityIndicator, StyleSheet, View } from "react-native";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { useNavigation, usePreventRemove } from "@react-navigation/native";
import { api } from "../../convex/_generated/api";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { ProfileDetailScaffold } from "../../components/ProfileDetailScaffold";
import { ProfileForm } from "../../components/ProfileForm";
import { ThemedText } from "../../components/ThemedText";
import { diffPlanSettings, toPlanSettings } from "../../lib/domain/profileSettings";
import { useTheme } from "../../lib/theme/ThemeProvider";

export default function ProfilePlanSettingsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const currentUser = useQuery(api.users.current);
  const updateCurrentPlanSettings = useMutation(api.users.updateCurrentPlanSettings);
  const [isDirty, setIsDirty] = React.useState(false);
  const [submitProps, setSubmitProps] = React.useState<{
    disabled: boolean;
    label: string;
    onPress: () => void;
  } | null>(null);

  usePreventRemove(isDirty, ({ data }) => {
    Alert.alert("Discard changes?", "Your unsaved plan edits will be lost.", [
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
          Loading your plan settings...
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
            Finish onboarding once and your plan settings will live here.
          </ThemedText>
        </Card>
      </View>
    );
  }

  const initialValues = toPlanSettings(currentUser);

  return (
    <ProfileDetailScaffold
      footer={
        submitProps ? (
          <Button
            disabled={submitProps.disabled}
            label={submitProps.label}
            onPress={submitProps.onPress}
          />
        ) : null
      }
      onBackPress={() => router.back()}
      subtitle="Update your goal, preferences, body metrics, and macro targets without leaving the app."
      title="Plan settings"
    >
      <ProfileForm
        initialValues={initialValues}
        onDirtyChange={setIsDirty}
        onSubmit={async (values) => {
          const patch = diffPlanSettings(initialValues, values);

          if (Object.keys(patch).length > 0) {
            await updateCurrentPlanSettings(patch);
          }

          setIsDirty(false);
          router.back();
        }}
        onSubmitReady={setSubmitProps}
        submitLabel="Save changes"
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
});
