import { useCallback, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../design/ThemeProvider';
import type { ChannelListItem, TubeArchivistClient } from '../../services/tubeArchivist';
import { radii, spacing } from '../../design/tokens';
import { BrowsingScreenShell } from './BrowsingScreenShell';
import { PagedFlashList } from './PagedFlashList';
import { usePagedResource } from './hooks/usePagedResource';

type ChannelsScreenProps = {
  client: TubeArchivistClient;
  onOpenChannel: (channelId: string) => void;
};

function ChannelsScreen({ client, onOpenChannel }: ChannelsScreenProps) {
  const { theme } = useTheme();
  const { colors } = theme;
  const [focusedElementId, setFocusedElementId] = useState<string | null>(null);
  const fetchPage = useCallback((page: number) => client.fetchChannels(page), [client]);
  const mergeItems = useCallback(
    (currentItems: ChannelListItem[], nextPageItems: ChannelListItem[]) => [
      ...currentItems,
      ...nextPageItems,
    ],
    [],
  );
  const { hasNextPage, isError, isLoading, isLoadingMore, items, loadMore, reload } =
    usePagedResource<ChannelListItem>({
      fetchPage,
      mergeItems,
      reloadKey: client,
    });

  return (
    <BrowsingScreenShell subtitle="" testID="channels-screen" title="Channels">
      {isLoading ? (
        Array.from({ length: 8 }).map((_, index) => (
          <View
            key={`channel-skeleton-${index}`}
            style={[styles.row, { borderColor: colors.border }]}
          >
            <View style={[styles.thumb, { backgroundColor: colors.surfacePressed }]} />
            <View style={styles.textWrap}>
              <View style={[styles.skeletonTitle, { backgroundColor: colors.surfacePressed }]} />
              <View style={[styles.skeletonMeta, { backgroundColor: colors.surfacePressed }]} />
            </View>
          </View>
        ))
      ) : (
        <View style={styles.listWrap}>
          <PagedFlashList
            data={items}
            footerAlign="start"
            hasNextPage={hasNextPage}
            isLoadingMore={isLoadingMore}
            keyExtractor={item => item.channelId}
            onLoadMore={loadMore}
            renderItem={({ item, index }) => (
              <Pressable
                accessibilityRole="button"
                onBlur={() => {
                  setFocusedElementId(current => (current === item.channelId ? null : current));
                }}
                onFocus={() => {
                  setFocusedElementId(item.channelId);
                }}
                onPress={() => {
                  onOpenChannel(item.channelId);
                }}
                style={({ pressed }) => [
                  styles.row,
                  {
                    borderColor:
                      focusedElementId === item.channelId ? colors.accent : colors.border,
                  },
                  pressed ? styles.pressed : null,
                ]}
                testID={index === 0 ? 'channel-card-first' : `channel-card-${item.channelId}`}
              >
                {item.thumbnailUrl ? (
                  <Image source={{ uri: item.thumbnailUrl }} style={styles.thumb} />
                ) : (
                  <View style={[styles.thumb, { backgroundColor: colors.surfacePressed }]} />
                )}
                <View style={styles.textWrap}>
                  <Text numberOfLines={1} style={[styles.title, { color: colors.textPrimary }]}>
                    {item.channelName}
                  </Text>
                  <Text style={[styles.meta, { color: colors.textSecondary }]}>
                    {`${item.subscriberCount.toLocaleString()} subs`}
                  </Text>
                </View>
              </Pressable>
            )}
          />
        </View>
      )}
      {!isLoading && items.length === 0 && !isError ? (
        <Text style={[styles.stateText, { color: colors.textSecondary }]}>No channels found.</Text>
      ) : null}
      {isError ? (
        <View style={styles.errorRow}>
          <Text style={[styles.stateText, { color: colors.textSecondary }]}>
            Failed to load channels.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              reload().catch(() => undefined);
            }}
            style={[styles.retryButton, { backgroundColor: colors.buttonSecondaryBackground }]}
          >
            <Text style={[styles.retryLabel, { color: colors.buttonLabel }]}>Retry</Text>
          </Pressable>
        </View>
      ) : null}
    </BrowsingScreenShell>
  );
}

const styles = StyleSheet.create({
  listWrap: {
    flex: 1,
  },
  meta: {
    fontSize: 12,
    marginTop: spacing.xs,
  },
  pressed: {
    opacity: 0.92,
  },
  focused: {
    transform: [{ scale: 1.02 }],
  },
  row: {
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
    padding: spacing.sm,
  },
  skeletonMeta: {
    borderRadius: 999,
    height: 10,
    width: '45%',
  },
  skeletonTitle: {
    borderRadius: 999,
    height: 12,
    marginBottom: spacing.xs,
    width: '80%',
  },
  textWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  thumb: {
    borderRadius: radii.md,
    height: 56,
    width: 56,
  },
  stateText: {
    fontSize: 13,
    marginTop: spacing.sm,
  },
  errorRow: {
    alignItems: 'flex-start',
    marginTop: spacing.sm,
  },
  retryButton: {
    borderRadius: radii.md,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  retryLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
  },
});

export { ChannelsScreen };
