import { useCallback, useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { TARCHPEEK_CONSTANTS } from '../../constants/tarchpeekConstants';
import { useTheme } from '../../design/ThemeProvider';
import type { PlaylistListItem, TubeArchivistClient } from '../../services/tubeArchivist';
import { radii, spacing } from '../../design/tokens';
import { BrowsingScreenShell } from './BrowsingScreenShell';
import { PagedFlashList } from './PagedFlashList';
import { usePagedResource, type PagedResponse } from './hooks/usePagedResource';

const PLAYLISTS_PAGE_WINDOW_SIZE = TARCHPEEK_CONSTANTS.browsing.playlistsPageWindowSize;
const PLAYLISTS_DRAW_DISTANCE = TARCHPEEK_CONSTANTS.browsing.playlistsDrawDistance;

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
  const [focusedElementId, setFocusedElementId] = useState<string | null>(null);
  const fetchPage = useCallback(
    async (page: number): Promise<PagedResponse<PlaylistPageChunk>> => {
      const response = await client.fetchPlaylists(page);
      return {
        items: [{ page: response.currentPage, items: response.items }],
        currentPage: response.currentPage,
        hasNextPage: response.hasNextPage,
      };
    },
    [client],
  );
  const mergeItems = useCallback(
    (currentItems: PlaylistPageChunk[], nextPageItems: PlaylistPageChunk[]) => {
      const nextPageChunk = nextPageItems[0];
      if (!nextPageChunk) {
        return currentItems;
      }
      const filtered = currentItems.filter(chunk => chunk.page !== nextPageChunk.page);
      const nextChunks = [...filtered, nextPageChunk];
      while (nextChunks.length > PLAYLISTS_PAGE_WINDOW_SIZE) {
        nextChunks.shift();
      }
      return nextChunks;
    },
    [],
  );
  const {
    hasNextPage,
    isLoading,
    isLoadingMore,
    items: pageChunks,
    loadMore,
  } = usePagedResource<PlaylistPageChunk>({
    fetchPage,
    mergeItems,
    reloadKey: client,
  });
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
        ]}
      >
        {item.thumbnailUrl ? (
          <Image source={{ uri: item.thumbnailUrl }} style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, { backgroundColor: colors.surfacePressed }]} />
        )}
        <View style={styles.textWrap}>
          <Text
            numberOfLines={3}
            style={[styles.title, styles.titleText, { color: colors.textPrimary }]}
          >
            {item.playlistName}
          </Text>
          <Text
            numberOfLines={2}
            style={[styles.meta, styles.channelMeta, { color: colors.textSecondary }]}
          >
            {item.channelName}
          </Text>
          <Text style={[styles.meta, { color: colors.textSecondary }]}>
            {`${item.videoCount.toLocaleString()} videos`}
          </Text>
        </View>
      </Pressable>
    );
  }

  return (
    <BrowsingScreenShell
      subtitle="Browse playlists with explicit entry into playlist details."
      testID="playlists-screen"
      title="Playlists"
    >
      {isLoading ? (
        Array.from({ length: 8 }).map((_, index) => (
          <View
            key={`playlist-skeleton-${index}`}
            style={[styles.row, { borderColor: colors.border }]}
          >
            <View style={[styles.thumb, { backgroundColor: colors.surfacePressed }]} />
            <View style={styles.textWrap}>
              <View style={[styles.skeletonTitle, { backgroundColor: colors.surfacePressed }]} />
              <View style={[styles.skeletonMeta, { backgroundColor: colors.surfacePressed }]} />
              <View style={[styles.skeletonMeta, { backgroundColor: colors.surfacePressed }]} />
            </View>
          </View>
        ))
      ) : (
        <View style={styles.listWrap}>
          <PagedFlashList
            data={items}
            drawDistance={PLAYLISTS_DRAW_DISTANCE}
            hasNextPage={hasNextPage}
            isLoadingMore={isLoadingMore}
            keyExtractor={item => item.playlistId}
            onLoadMore={loadMore}
            renderItem={({ item }) => renderPlaylistCard(item)}
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
  meta: {
    fontSize: 12,
    marginTop: spacing.xs,
  },
  channelMeta: {
    flexShrink: 1,
  },
  pressed: {
    opacity: 0.92,
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
  titleText: {
    flexShrink: 1,
  },
});

export { PlaylistsScreen };
