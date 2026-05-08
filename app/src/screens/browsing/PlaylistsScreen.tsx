import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useTheme } from '../../design/ThemeProvider';
import type { PlaylistListItem, TubeArchivistClient } from '../../services/tubeArchivist';
import { radii, spacing } from '../../design/tokens';
import { BrowsingScreenShell } from './BrowsingScreenShell';

const PLAYLISTS_PAGE_WINDOW_SIZE = 3;
const PLAYLISTS_DRAW_DISTANCE = 300;

type PlaylistsScreenProps = {
  client: TubeArchivistClient;
  onOpenPlaylist: (playlistId: string) => void;
};

type PlaylistPageChunk = {
  page: number;
  items: PlaylistListItem[];
};

function PlaylistsScreen({ client, onOpenPlaylist }: PlaylistsScreenProps) {
  const { theme } = useTheme();
  const { colors } = theme;
  const [pageChunks, setPageChunks] = useState<PlaylistPageChunk[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [focusedElementId, setFocusedElementId] = useState<string | null>(null);

  const items = useMemo(() => {
    const seenIds = new Set<string>();
    const merged = pageChunks.flatMap(chunk => chunk.items);
    return merged.filter(item => {
      if (seenIds.has(item.playlistId)) {
        return false;
      }
      seenIds.add(item.playlistId);
      return true;
    });
  }, [pageChunks]);

  useEffect(() => {
    let isMounted = true;

    async function loadFirstPage() {
      setIsLoading(true);
      try {
        const firstPage = await client.fetchPlaylists(1);
        if (!isMounted) {
          return;
        }
        setPageChunks([{ page: firstPage.currentPage, items: firstPage.items }]);
        setPage(firstPage.currentPage);
        setHasNextPage(firstPage.hasNextPage);
      } catch {
        if (!isMounted) {
          return;
        }
        setPageChunks([]);
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
      const response = await client.fetchPlaylists(nextPage);
      setPageChunks(previousChunks => {
        const filtered = previousChunks.filter(chunk => chunk.page !== response.currentPage);
        const nextChunks = [...filtered, { page: response.currentPage, items: response.items }];
        while (nextChunks.length > PLAYLISTS_PAGE_WINDOW_SIZE) {
          nextChunks.shift();
        }
        return nextChunks;
      });
      setPage(response.currentPage);
      setHasNextPage(response.hasNextPage);
    } catch {
    } finally {
      setIsLoadingMore(false);
    }
  }

  function renderPlaylistCard(item: PlaylistListItem) {
    return (
      <Pressable
        accessibilityRole="button"
        key={item.playlistId}
        onBlur={() => {
          setFocusedElementId(current => (current === item.playlistId ? null : current));
        }}
        onFocus={() => {
          setFocusedElementId(item.playlistId);
        }}
        onPress={() => {
          onOpenPlaylist(item.playlistId);
        }}
        style={({ pressed }) => [
          styles.row,
          { borderColor: focusedElementId === item.playlistId ? colors.accent : colors.border },
          pressed ? styles.pressed : null,
        ]}>
        {item.thumbnailUrl ? (
          <Image source={{ uri: item.thumbnailUrl }} style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, { backgroundColor: colors.surfacePressed }]} />
        )}
        <View style={styles.textWrap}>
          <Text numberOfLines={1} style={[styles.title, { color: colors.textPrimary }]}>
            {item.playlistName}
          </Text>
          <Text numberOfLines={1} style={[styles.meta, { color: colors.textSecondary }]}>
            {item.channelName}
          </Text>
          <Text style={[styles.meta, { color: colors.textSecondary }]}>
            {`${item.videoCount.toLocaleString()} videos`}
          </Text>
          <Text style={[styles.meta, { color: colors.textSecondary }]}>
            {item.subscribed ? 'Subscribed' : 'Not subscribed'}
          </Text>
        </View>
      </Pressable>
    );
  }

  function renderLoadMoreFooter() {
    return (
      <Pressable
        accessibilityRole="button"
        disabled={!hasNextPage || isLoadingMore}
        onBlur={() => {
          setFocusedElementId(current => (current === 'playlists-load-more' ? null : current));
        }}
        onFocus={() => {
          setFocusedElementId('playlists-load-more');
        }}
        onPress={() => {
          loadMore().catch(() => undefined);
        }}
        style={({ pressed }) => [
          styles.loadMoreButton,
          {
            backgroundColor:
              hasNextPage && !isLoadingMore
                ? colors.buttonSecondaryBackground
                : colors.buttonDisabledBackground,
          },
          focusedElementId === 'playlists-load-more' ? styles.focused : null,
          pressed && hasNextPage && !isLoadingMore ? styles.pressed : null,
        ]}>
        <Text style={[styles.loadMoreLabel, { color: colors.buttonLabel }]}>
          {isLoadingMore ? 'Loading...' : hasNextPage ? 'Load next page' : 'No more pages'}
        </Text>
      </Pressable>
    );
  }

  return (
    <BrowsingScreenShell subtitle="Browse playlists with explicit entry into playlist details." title="Playlists">
      {isLoading
        ? Array.from({ length: 8 }).map((_, index) => (
            <View key={`playlist-skeleton-${index}`} style={[styles.row, { borderColor: colors.border }]}>
              <View style={[styles.thumb, { backgroundColor: colors.surfacePressed }]} />
              <View style={styles.textWrap}>
                <View style={[styles.skeletonTitle, { backgroundColor: colors.surfacePressed }]} />
                <View style={[styles.skeletonMeta, { backgroundColor: colors.surfacePressed }]} />
                <View style={[styles.skeletonMeta, { backgroundColor: colors.surfacePressed }]} />
              </View>
            </View>
          ))
        : (
          <View style={styles.listWrap}>
            <FlashList
              data={items}
              drawDistance={PLAYLISTS_DRAW_DISTANCE}
              keyExtractor={item => item.playlistId}
              ListFooterComponent={renderLoadMoreFooter}
              removeClippedSubviews
              renderItem={({ item }) => renderPlaylistCard(item)}
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}
    </BrowsingScreenShell>
  );
}

const styles = StyleSheet.create({
  listWrap: {
    flex: 1,
  },
  loadMoreButton: {
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
    marginHorizontal: spacing.sm,
    marginTop: spacing.sm,
    padding: spacing.sm,
  },
  skeletonMeta: {
    borderRadius: 999,
    height: 10,
    marginTop: spacing.xs,
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

export { PlaylistsScreen };
