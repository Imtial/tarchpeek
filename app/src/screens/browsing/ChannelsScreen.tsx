import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../design/ThemeProvider';
import type { ChannelListItem, TubeArchivistClient } from '../../services/tubeArchivist';
import { radii, spacing } from '../../design/tokens';
import { BrowsingScreenShell } from './BrowsingScreenShell';

type ChannelsScreenProps = {
  client: TubeArchivistClient;
  onOpenChannel: (channelId: string) => void;
};

function ChannelsScreen({ client, onOpenChannel }: ChannelsScreenProps) {
  const { theme } = useTheme();
  const { colors } = theme;
  const [items, setItems] = useState<ChannelListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [focusedElementId, setFocusedElementId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadFirstPage() {
      setIsLoading(true);
      try {
        const firstPage = await client.fetchChannels(1);
        if (!isMounted) {
          return;
        }
        setItems(firstPage.items);
        setPage(firstPage.currentPage);
        setHasNextPage(firstPage.hasNextPage);
      } catch {
        if (!isMounted) {
          return;
        }
        setItems([]);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadFirstPage();

    return () => {
      isMounted = false;
    };
  }, [client]);

  async function loadMore() {
    if (isLoadingMore || !hasNextPage) {
      return;
    }
    const nextPage = page + 1;
    setIsLoadingMore(true);
    try {
      const response = await client.fetchChannels(nextPage);
      setItems(currentItems => [...currentItems, ...response.items]);
      setPage(response.currentPage);
      setHasNextPage(response.hasNextPage);
    } catch {
    } finally {
      setIsLoadingMore(false);
    }
  }

  return (
    <BrowsingScreenShell subtitle="" testID="channels-screen" title="Channels">
      {isLoading
        ? Array.from({ length: 8 }).map((_, index) => (
            <View key={`channel-skeleton-${index}`} style={[styles.row, { borderColor: colors.border }]}>
              <View style={[styles.thumb, { backgroundColor: colors.surfacePressed }]} />
              <View style={styles.textWrap}>
                <View style={[styles.skeletonTitle, { backgroundColor: colors.surfacePressed }]} />
                <View style={[styles.skeletonMeta, { backgroundColor: colors.surfacePressed }]} />
              </View>
            </View>
          ))
        : items.map(item => (
            <Pressable
              key={item.channelId}
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
                { borderColor: focusedElementId === item.channelId ? colors.accent : colors.border },
                pressed ? styles.pressed : null,
              ]}>
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
          ))}
      <Pressable
        accessibilityRole="button"
        disabled={!hasNextPage || isLoadingMore}
        onBlur={() => {
          setFocusedElementId(current => (current === 'channels-load-more' ? null : current));
        }}
        onFocus={() => {
          setFocusedElementId('channels-load-more');
        }}
        onPress={() => {
          loadMore().catch(() => undefined);
        }}
        style={({ pressed }) => [
          styles.loadMore,
          {
            backgroundColor:
              hasNextPage && !isLoadingMore
                ? colors.buttonSecondaryBackground
                : colors.buttonDisabledBackground,
          },
          focusedElementId === 'channels-load-more' ? styles.focused : null,
          pressed && hasNextPage && !isLoadingMore ? styles.pressed : null,
        ]}>
        <Text style={[styles.loadMoreLabel, { color: colors.buttonLabel }]}>
          {isLoadingMore ? 'Loading...' : hasNextPage ? 'Load next page' : 'No more pages'}
        </Text>
      </Pressable>
    </BrowsingScreenShell>
  );
}

const styles = StyleSheet.create({
  loadMore: {
    alignSelf: 'flex-start',
    borderRadius: radii.md,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  loadMoreLabel: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
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
  title: {
    fontSize: 14,
    fontWeight: '700',
  },
});

export { ChannelsScreen };
