import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Card } from "./Card";
import { ThemedText } from "./ThemedText";
import { useTheme } from "../lib/theme/ThemeProvider";
import { RememberedEntryReplayKind } from "../lib/domain/rememberedEntries";

export type RememberedEntriesCardItem = {
  id: string;
  label: string;
  replayKind: RememberedEntryReplayKind;
  summary: string;
};

type RememberedEntriesCardProps = {
  favoriteHasMore?: boolean;
  favorites: RememberedEntriesCardItem[];
  onReplay: (id: string) => void;
  onShowMoreFavorites?: () => void;
  onShowMoreRecent?: () => void;
  onToggleFavorite: (id: string) => void;
  recent: RememberedEntriesCardItem[];
  recentHasMore?: boolean;
};

function Section({
  hasMore,
  items,
  onReplay,
  onShowMore,
  onToggleFavorite,
  title,
}: {
  hasMore?: boolean;
  items: RememberedEntriesCardItem[];
  onReplay: (id: string) => void;
  onShowMore?: () => void;
  onToggleFavorite: (id: string) => void;
  title: string;
}) {
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const safeItems = items ?? [];
  const isFavorites = title === "Favorites";
  const visibleItems = useMemo(
    () => (expanded ? safeItems : safeItems.slice(0, 4)),
    [expanded, safeItems]
  );

  return (
    <View style={styles.section}>
      <ThemedText size="sm" style={styles.sectionTitle}>
        {title}
      </ThemedText>

      {visibleItems.length === 0 ? (
        <ThemedText size="sm" variant="secondary">
          {title === "Favorites"
            ? "Favorite items will stay pinned here."
            : "Items you log often will show up here."}
        </ThemedText>
      ) : (
        visibleItems.map((item, index) => (
          <View
            key={item.id}
            style={[
              styles.row,
              {
                backgroundColor: theme.surfaceSoft,
                borderColor: theme.cardBorder,
              },
              index < visibleItems.length - 1 ? styles.rowGap : undefined,
            ]}
          >
            <Pressable
              accessibilityRole="button"
              onPress={() => onReplay(item.id)}
              style={styles.rowContent}
            >
              <ThemedText numberOfLines={1} size="sm" style={styles.rowLabel}>
                {item.label}
              </ThemedText>
              <ThemedText numberOfLines={1} size="sm" variant="secondary">
                {item.summary}
              </ThemedText>
            </Pressable>

            <View style={styles.rowActions}>
              {isFavorites ? (
                <Pressable
                  accessibilityLabel={`Quick add ${item.label}`}
                  accessibilityRole="button"
                  onPress={() => onReplay(item.id)}
                  style={[
                    styles.actionButton,
                    styles.actionButtonGap,
                    {
                      backgroundColor: theme.surfaceStrong,
                      borderColor: theme.cardBorder,
                    },
                  ]}
                >
                  <ThemedText size="sm" style={{ color: theme.accent1 }}>
                    +
                  </ThemedText>
                </Pressable>
              ) : null}

              <Pressable
                accessibilityLabel={`Toggle favorite for ${item.label}`}
                accessibilityRole="button"
                onPress={() => onToggleFavorite(item.id)}
                style={[
                  styles.actionButton,
                  {
                    backgroundColor: theme.surfaceStrong,
                    borderColor: theme.cardBorder,
                  },
                ]}
              >
                <ThemedText size="sm" style={{ color: theme.accent1 }}>
                  {isFavorites ? "★" : "☆"}
                </ThemedText>
              </Pressable>
            </View>
          </View>
        ))
      )}

      {(safeItems.length > 4 || hasMore) && !expanded ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setExpanded(true);
            onShowMore?.();
          }}
          style={styles.showMore}
        >
          <ThemedText size="sm" variant="accent1">
            Show more
          </ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}

export function RememberedEntriesCard(props: RememberedEntriesCardProps) {
  return (
    <Card>
      <Section
        hasMore={props.favoriteHasMore}
        items={props.favorites}
        onReplay={props.onReplay}
        onShowMore={props.onShowMoreFavorites}
        onToggleFavorite={props.onToggleFavorite}
        title="Favorites"
      />
      <Section
        hasMore={props.recentHasMore}
        items={props.recent}
        onReplay={props.onReplay}
        onShowMore={props.onShowMoreRecent}
        onToggleFavorite={props.onToggleFavorite}
        title="Recently added"
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 36,
    minWidth: 36,
  },
  row: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  rowContent: {
    flex: 1,
    minWidth: 0,
    paddingRight: 12,
  },
  rowActions: {
    flexDirection: "row",
  },
  actionButtonGap: {
    marginRight: 8,
  },
  rowGap: {
    marginBottom: 10,
  },
  rowLabel: {
    marginBottom: 2,
  },
  section: {
    marginTop: 8,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  showMore: {
    alignSelf: "flex-start",
    marginTop: 10,
  },
});
