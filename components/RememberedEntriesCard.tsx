import React, { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Card } from "./Card";
import { ThemedText } from "./ThemedText";
import { useTheme } from "../lib/theme/ThemeProvider";
import { RememberedEntryReplayKind } from "../lib/domain/rememberedEntries";
import { triggerLightSuccessHaptic } from "../lib/haptics";

const FAVORITE_QUICK_ADD_SUCCESS_MS = 1000;

export type RememberedEntriesCardItem = {
  id: string;
  label: string;
  replayKind: RememberedEntryReplayKind;
  summary: string;
};

type RememberedEntriesCardProps = {
  favoriteHasMore?: boolean;
  favorites: RememberedEntriesCardItem[];
  onQuickAddFavorite: (id: string) => Promise<void>;
  onReplayRow: (id: string) => void | Promise<void>;
  onShowMoreFavorites?: () => void;
  onShowMoreRecent?: () => void;
  onToggleFavorite: (id: string) => void;
  recent: RememberedEntriesCardItem[];
  recentHasMore?: boolean;
};

function Section({
  hasMore,
  items,
  onQuickAddFavorite,
  onReplayRow,
  onShowMore,
  onToggleFavorite,
  title,
}: {
  hasMore?: boolean;
  items: RememberedEntriesCardItem[];
  onQuickAddFavorite: (id: string) => Promise<void>;
  onReplayRow: (id: string) => void | Promise<void>;
  onShowMore?: () => void;
  onToggleFavorite: (id: string) => void;
  title: string;
}) {
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [activeSuccessFavoriteId, setActiveSuccessFavoriteId] = useState<string | null>(null);
  const safeItems = items ?? [];
  const isFavorites = title === "Favorites";
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const visibleItems = useMemo(
    () => (expanded ? safeItems : safeItems.slice(0, 4)),
    [expanded, safeItems]
  );

  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  const startSuccessTimer = (id: string) => {
    setActiveSuccessFavoriteId(id);

    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
    }

    successTimeoutRef.current = setTimeout(() => {
      setActiveSuccessFavoriteId((current) => (current === id ? null : current));
      successTimeoutRef.current = null;
    }, FAVORITE_QUICK_ADD_SUCCESS_MS);
  };

  return (
    <View style={styles.section}>
      <ThemedText size="sm" style={styles.sectionTitle}>
        {title}
      </ThemedText>

      {isFavorites && activeSuccessFavoriteId ? (
        <View
          style={[
            styles.successPill,
            {
              backgroundColor: theme.surfaceSoft,
              borderColor: theme.cardBorder,
            },
          ]}
          testID="remembered-entries-favorite-success-pill"
        >
          <View
            style={[
              styles.successPillIcon,
              {
                backgroundColor: theme.surfaceStrong,
                borderColor: theme.cardBorder,
              },
            ]}
          >
            <ThemedText size="sm" style={{ color: theme.accent1 }}>
              {"\u2713"}
            </ThemedText>
          </View>
          <ThemedText size="sm" variant="accent1">
            Added to today
          </ThemedText>
        </View>
      ) : null}

      {visibleItems.length === 0 ? (
        <ThemedText size="sm" variant="secondary">
          {title === "Favorites"
            ? "Favorite items will stay pinned here."
            : "Items you log often will show up here."}
        </ThemedText>
      ) : (
        visibleItems.map((item, index) => {
          const isQuickAddSuccess = isFavorites && activeSuccessFavoriteId === item.id;

          return (
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
              <View style={styles.rowContent}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => onReplayRow(item.id)}
                  style={styles.rowTitlePressable}
                  testID={`remembered-entries-replay-${item.id}`}
                >
                  <ThemedText
                    numberOfLines={2}
                    size="sm"
                    style={styles.rowLabel}
                    testID={`remembered-entries-title-${item.id}`}
                  >
                    {item.label}
                  </ThemedText>
                </Pressable>

                <View
                  style={styles.rowMetaLine}
                  testID={`remembered-entries-row-meta-${item.id}`}
                >
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => onReplayRow(item.id)}
                    style={styles.rowSummaryPressable}
                  >
                    <ThemedText
                      numberOfLines={1}
                      size="sm"
                      style={styles.rowSummary}
                      testID={`remembered-entries-summary-${item.id}`}
                      variant="secondary"
                    >
                      {item.summary}
                    </ThemedText>
                  </Pressable>

                  <View
                    style={styles.rowActions}
                    testID={`remembered-entries-action-rail-${item.id}`}
                  >
                    {isFavorites ? (
                      <Pressable
                        accessibilityLabel={
                          isQuickAddSuccess ? `Added ${item.label}` : `Quick add ${item.label}`
                        }
                        accessibilityRole="button"
                        onPress={async () => {
                          try {
                            await onQuickAddFavorite(item.id);
                            startSuccessTimer(item.id);
                            await triggerLightSuccessHaptic();
                          } catch {
                            // Leave the button and section state unchanged on quick-add failure.
                          }
                        }}
                        style={[
                          styles.actionButton,
                          styles.actionButtonGap,
                          {
                            backgroundColor: theme.surfaceStrong,
                            borderColor: theme.cardBorder,
                          },
                          isQuickAddSuccess
                            ? {
                                backgroundColor: theme.surfaceSoft,
                                borderColor: theme.accent1,
                              }
                            : undefined,
                        ]}
                        testID={`remembered-entries-quick-add-${item.id}`}
                      >
                        <ThemedText size="sm" style={{ color: theme.accent1 }}>
                          {isQuickAddSuccess ? "\u2713" : "+"}
                        </ThemedText>
                      </Pressable>
                    ) : (
                      <View
                        pointerEvents="none"
                        style={[
                          styles.actionButton,
                          styles.actionButtonGap,
                          styles.actionRailSpacer,
                        ]}
                        testID={`remembered-entries-action-rail-spacer-${item.id}`}
                      />
                    )}

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
                      <ThemedText size="sm" style={{ color: theme.accent2 }}>
                        {isFavorites ? "\u2605" : "\u2606"}
                      </ThemedText>
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>
          );
        })
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
        onQuickAddFavorite={props.onQuickAddFavorite}
        onReplayRow={props.onReplayRow}
        onShowMore={props.onShowMoreFavorites}
        onToggleFavorite={props.onToggleFavorite}
        title="Favorites"
      />
      <Section
        hasMore={props.recentHasMore}
        items={props.recent}
        onQuickAddFavorite={props.onQuickAddFavorite}
        onReplayRow={props.onReplayRow}
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
  actionButtonGap: {
    marginRight: 8,
  },
  actionRailSpacer: {
    borderColor: "transparent",
    opacity: 0,
  },
  row: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  rowActions: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 0,
    marginLeft: 12,
    width: 80,
  },
  rowContent: {
    minWidth: 0,
  },
  rowGap: {
    marginBottom: 10,
  },
  rowLabel: {
    lineHeight: 20,
  },
  rowMetaLine: {
    alignItems: "center",
    flexDirection: "row",
    minWidth: 0,
  },
  rowSummary: {
    minWidth: 0,
  },
  rowSummaryPressable: {
    flex: 1,
    minWidth: 0,
  },
  rowTitlePressable: {
    minWidth: 0,
    paddingBottom: 10,
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
  successPill: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  successPillIcon: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    height: 18,
    justifyContent: "center",
    width: 18,
  },
});
