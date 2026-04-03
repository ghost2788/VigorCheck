import React from "react";
import { usePaginatedQuery } from "convex/react";
import { useRouter } from "expo-router";
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";
import { Card } from "../../components/Card";
import { HistoryDayCard } from "../../components/HistoryDayCard";
import { ThemedText } from "../../components/ThemedText";
import { api } from "../../convex/_generated/api";
import { useTheme } from "../../lib/theme/ThemeProvider";

export default function HistoryScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { loadMore, results, status } = usePaginatedQuery(api.history.listDays, {}, { initialNumItems: 10 });

  if (status === "LoadingFirstPage" && results.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.accent1} size="small" />
        <ThemedText variant="secondary" style={styles.loadingLabel}>
          Loading history...
        </ThemedText>
      </View>
    );
  }

  return (
    <FlatList
      contentContainerStyle={styles.content}
      data={results}
      keyExtractor={(item) => item.dateKey}
      ListEmptyComponent={
        <Card>
          <ThemedText size="sm" style={styles.emptyTitle}>
            No history yet
          </ThemedText>
          <ThemedText variant="secondary">
            Logged days will appear here once meals or hydration entries are saved.
          </ThemedText>
        </Card>
      }
      ListFooterComponent={
        status === "LoadingMore" ? (
          <View style={styles.footerLoading}>
            <ActivityIndicator color={theme.accent1} size="small" />
          </View>
        ) : null
      }
      ListHeaderComponent={
        <View style={styles.header}>
          <ThemedText size="xl" style={styles.title}>
            History
          </ThemedText>
        </View>
      }
      onEndReached={() => {
        if (status === "CanLoadMore") {
          loadMore(10);
        }
      }}
      onEndReachedThreshold={0.4}
      renderItem={({ item }) => (
        <HistoryDayCard
          onPress={() => router.push(`/history/${item.dateKey}`)}
          summary={item}
        />
      )}
      showsVerticalScrollIndicator={false}
      style={{ backgroundColor: theme.background, flex: 1 }}
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  content: {
    paddingBottom: 32,
    paddingHorizontal: 24,
    paddingTop: 26,
  },
  emptyTitle: {
    marginBottom: 8,
  },
  footerLoading: {
    paddingBottom: 8,
    paddingTop: 8,
  },
  header: {
    marginBottom: 20,
  },
  loadingLabel: {
    marginTop: 12,
  },
  title: {
    marginBottom: 4,
  },
});
