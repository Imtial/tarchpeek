import { memo, useCallback, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../design/ThemeProvider';
import type { AppTheme } from '../../design/themes';
import type { ChannelListItem, TubeArchivistClient } from '../../services/tubeArchivist';
import { radii, spacing } from '../../design/tokens';
import { BrowsingScreenShell } from './BrowsingScreenShell';
import { PagedFlashList } from './PagedFlashList';
import { usePagedResource } from './hooks/usePagedResource';

type ChannelsScreenProps = {
  client: TubeArchivistClient;
  onOpenChannel: (channelId: string) => void;
};

type ChannelRowProps = {
  channelId: string;
  channelName: string;
  colors: AppTheme['colors'];
  index: number;
  isFocused: boolean;
  onBlurChannel: (channelId: string) => void;
  onFocusChannel: (channelId: string) => void;
  onOpenChannel: (channelId: string) => void;
  subscriberCount: number;
  thumbnailUrl: string | null;
};

const ChannelRow = memo(function ChannelRow({
  channelId,
  channelName,
  colors,
  index,
  isFocused,
  onBlurChannel,
  onFocusChannel,
  onOpenChannel,
  subscriberCount,
  thumbnailUrl,
}: ChannelRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onBlur={() => {
        onBlurChannel(channelId);
      }}
      onFocus={() => {
        onFocusChannel(channelId);
      }}
      onPress={() => {
        onOpenChannel(channelId);
      }}
      style={({ pressed }) => [
        styles.row,
        { borderColor: isFocused ? colors.accent : colors.border },
        pressed ? styles.pressed : null,
      ]}
      testID={index === 0 ? 'channel-card-first' : `channel-card-${channelId}`}
    >
      {thumbnailUrl ? (
        <Image source={{ uri: thumbnailUrl }} style={styles.thumb} />
      ) : (
        <View style={[styles.thumb, { backgroundColor: colors.surfacePressed }]} />
      )}
      <View style={styles.textWrap}>
        <Text numberOfLines={1} style={[styles.title, { color: colors.textPrimary }]}>
          {channelName}
        </Text>
        <Text style={[styles.meta, { color: colors.textSecondary }]}>
          {`${subscriberCount.toLocaleString()} subs`}
        </Text>
      </View>
    </Pressable>
  );
});

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
  const handleBlurChannel = useCallback((channelId: string) => {
    setFocusedElementId(current => (current === channelId ? null : current));
  }, []);
  const handleFocusChannel = useCallback((channelId: string) => {
    setFocusedElementId(channelId);
  }, []);
  const renderChannelItem = useCallback(
    ({ item, index }: { item: ChannelListItem; index: number }) => (
      <ChannelRow
        channelId={item.channelId}
        channelName={item.channelName}
        colors={colors}
        index={index}
        isFocused={focusedElementId === item.channelId}
        onBlurChannel={handleBlurChannel}
        onFocusChannel={handleFocusChannel}
        onOpenChannel={onOpenChannel}
        subscriberCount={item.subscriberCount}
        thumbnailUrl={item.thumbnailUrl}
      />
    ),
    [colors, focusedElementId, handleBlurChannel, handleFocusChannel, onOpenChannel],
  );

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
            renderItem={renderChannelItem}
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
