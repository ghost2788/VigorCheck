import React from "react";
import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { ThemedText } from "../../components/ThemedText";
import { useTheme } from "../../lib/theme/ThemeProvider";

export default function ScanAnalyzingScreen() {
  const router = useRouter();
  const { theme } = useTheme();

  return (
    <View style={[styles.centered, { backgroundColor: theme.background }]}>
      <Card style={styles.card}>
        <ThemedText size="sm" style={styles.title}>
          Analysis now runs from Log
        </ThemedText>
        <ThemedText variant="secondary" style={styles.body}>
          Meal analysis is minimized back into the Log tab now. Open Log to watch progress, keep
          using the app, and tap any ready item when you want to review it.
        </ThemedText>
        <Button label="Back to Log" onPress={() => router.replace("/(tabs)/log")} />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    lineHeight: 22,
    marginBottom: 18,
  },
  card: {
    width: "100%",
  },
  centered: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  title: {
    marginBottom: 10,
  },
});
