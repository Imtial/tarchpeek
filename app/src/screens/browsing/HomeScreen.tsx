import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useTheme } from '../../design/ThemeProvider';
import type { ContinueWatchingItem, TubeArchivistClient } from '../../services/tubeArchivist';
import { radii, spacing } from '../../design/tokens';
import { BrowsingScreenShell } from './BrowsingScreenShell';

const HOME_PAGE_WINDOW_SIZE = 3;
const HOME_LIST_DRAW_DISTANCE = 300;

type HomeScreenProps = {
  client: TubeArchivistClient;
  onOpenVideo: (videoId: string) => Promise<void>;
};

type HomePageChunk = {
  page: number;
  items: ContinueWatchingItem[];
};

function sortWatchedLast(items: ContinueWatchingItem[]) {
  const unwatched = items.filter(item => !item.watched);
  const watched = items.filter(item => item.watched);
  return [...unwatched, ...watched];
}

function HomeScreen({ client, onOpenVideo }: HomeScreenProps) {
  const { theme } = useTheme();
  const { colors } = theme;
  const [pageChunks, setPageChunks] = useState<HomePageChunk[]>([]);
  const [isLoadingContinueWatching, setIsLoadingContinueWatching] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [focusedElementId, setFocusedElementId] = useState<string | null>(null);
  const homeItems = useMemo(() => {
    const seenIds = new Set<string>();
    const merged = pageChunks.flatMap(chunk => chunk.items);
    const uniqueItems = merged.filter(item => {
      if (seenIds.has(item.videoId)) {
        return false;
      }
      seenIds.add(item.videoId);
      return true;
    });
    return sortWatchedLast(uniqueItems);
  }, [pageChunks]);

  useEffect(() => {
    let isMounted = true;

    async function loadContinueWatching() {
      setIsLoadingContinueWatching(true);
      try {
        const homePage = await client.fetchHomeFeed(1);
        if (!isMounted) {
          return;
        }
        setPageChunks([{ page: homePage.currentPage, items: homePage.items }]);
        setPage(homePage.currentPage);
        setHasNextPage(homePage.hasNextPage);
      } catch {
        if (!isMounted) {
          return;
        }
        setPageChunks([]);
      } finally {
        if (isMounted) {
          setIsLoadingContinueWatching(false);
        }
      }
    }

    loadContinueWatching();

    return () => {
      isMounted = false;
    };
  }, [client]);

  async function handleOpenVideo(videoId: string) {
    setActiveVideoId(videoId);
    try {
      await onOpenVideo(videoId);
    } finally {
      setActiveVideoId(null);
    }
  }

  async function loadMore() {
    if (isLoadingMore || !hasNextPage) {
      return;
    }

    const nextPage = page + 1;
    setIsLoadingMore(true);
    try {
      const homePage = await client.fetchHomeFeed(nextPage);
      setPageChunks(previousChunks => {
        const filtered = previousChunks.filter(chunk => chunk.page !== homePage.currentPage);
        const nextChunks = [...filtered, { page: homePage.currentPage, items: homePage.items }];
        while (nextChunks.length > HOME_PAGE_WINDOW_SIZE) {
          nextChunks.shift();
        }
        return nextChunks;
      });
      setPage(homePage.currentPage);
      setHasNextPage(homePage.hasNextPage);
    } catch {
    } finally {
      setIsLoadingMore(false);
    }
  }

  function renderProgress(item: ContinueWatchingItem) {
    const duration = Math.max(1, item.durationSeconds);
    const progressRatio = Math.max(0, Math.min(1, item.resumePositionSeconds / duration));
    const progressPercent = Math.round(progressRatio * 100);
    const isNew = item.resumePositionSeconds <= 0;

    return (
      <View style={styles.thumbnailOverlay}>
        <View style={styles.chipRow}>
          {isNew ? (
            <View style={[styles.badgeChip, { backgroundColor: colors.accent }]}>
              <Text style={[styles.badgeLabel, { color: colors.buttonLabel }]}>New</Text>
            </View>
          ) : (
            <View style={[styles.badgeChip, { backgroundColor: colors.surfaceBackground }]}>
              <Text style={[styles.badgeLabel, { color: colors.textPrimary }]}>{`${progressPercent}%`}</Text>
            </View>
          )}
          <View style={[styles.timeChip, { backgroundColor: colors.surfaceBackground }]}>
            <Text style={[styles.timeChipLabel, { color: colors.textPrimary }]}>{item.durationLabel}</Text>
          </View>
        </View>
        <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
          <View style={[styles.progressFill, { backgroundColor: colors.accent, width: `${progressPercent}%` }]} />
        </View>
      </View>
    );
  }

  function renderVideoCard(item: ContinueWatchingItem) {
    return (
      <Pressable
        key={item.videoId}
        accessibilityRole="button"
        disabled={activeVideoId === item.videoId}
        onPress={() => {
          handleOpenVideo(item.videoId).catch(() => {
            setActiveVideoId(null);
          });
        }}
        onBlur={() => {
          setFocusedElementId(current => (current === item.videoId ? null : current));
        }}
        onFocus={() => {
          setFocusedElementId(item.videoId);
        }}
        style={({ pressed }) => [
          styles.videoItem,
          { borderColor: focusedElementId === item.videoId ? colors.accent : colors.border },
          pressed ? styles.buttonPressed : null,
        ]}>
        <View style={styles.thumbnailWrap}>
          <Image source={{ uri: item.thumbnailUrl }} style={styles.thumbnailImage} />
          {renderProgress(item)}
        </View>
        <Text style={[styles.videoTitle, { color: colors.textPrimary }]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={[styles.videoMeta, { color: colors.textSecondary }]}>{item.channelName}</Text>
      </Pressable>
    );
  }

  function renderLoadMoreFooter() {
    return (
      <Pressable
        accessibilityRole="button"
        disabled={!hasNextPage || isLoadingMore}
        onPress={() => {
          loadMore().catch(() => undefined);
        }}
        onBlur={() => {
          setFocusedElementId(current => (current === 'home-load-more' ? null : current));
        }}
        onFocus={() => {
          setFocusedElementId('home-load-more');
        }}
        style={({ pressed }) => [
          styles.seeMoreButton,
          {
            backgroundColor:
              hasNextPage && !isLoadingMore
                ? colors.buttonSecondaryBackground
                : colors.buttonDisabledBackground,
          },
          focusedElementId === 'home-load-more' ? styles.buttonFocused : null,
          pressed && hasNextPage && !isLoadingMore ? styles.buttonPressed : null,
        ]}>
        <Text style={[styles.seeMoreLabel, { color: colors.buttonLabel }]}>
          {isLoadingMore ? 'Loading...' : hasNextPage ? 'Load next page' : 'No more pages'}
        </Text>
      </Pressable>
    );
  }

  return (
    <BrowsingScreenShell
      subtitle="Intentional retrieval with glanceable progress and newness cues."
      title="Home">
      {isLoadingContinueWatching ? (
        Array.from({ length: 3 }).map((_, index) => (
          <View key={`home-skeleton-${index}`} style={[styles.videoItem, { borderColor: colors.border }]}>
            <View style={[styles.thumbnailImage, styles.skeletonBlock, { backgroundColor: colors.surfacePressed }]} />
            <View style={[styles.skeletonTitle, { backgroundColor: colors.surfacePressed }]} />
            <View style={[styles.skeletonMeta, { backgroundColor: colors.surfacePressed }]} />
          </View>
        ))
      ) : (
        <View style={styles.listWrap}>
          <FlashList
            data={homeItems}
            drawDistance={HOME_LIST_DRAW_DISTANCE}
            keyExtractor={item => item.videoId}
            ListFooterComponent={renderLoadMoreFooter}
            removeClippedSubviews
            renderItem={({ item }) => renderVideoCard(item)}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}
    </BrowsingScreenShell>
  );
}

const styles = StyleSheet.create({
  buttonPressed: {
    opacity: 0.92,
  },
  buttonFocused: {
    transform: [{ scale: 1.02 }],
  },
  seeMoreButton: {
    alignSelf: 'center',
    borderRadius: radii.md,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  seeMoreLabel: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  videoItem: {
    borderRadius: radii.md,
    borderWidth: 1,
    marginHorizontal: spacing.sm,
    marginTop: spacing.sm,
    padding: spacing.sm,
  },
  thumbnailWrap: {
    borderRadius: radii.md,
    marginBottom: spacing.sm,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbnailImage: {
    aspectRatio: 16 / 9,
    width: '100%',
  },
  thumbnailOverlay: {
    bottom: 0,
    left: 0,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: 0,
    position: 'absolute',
    right: 0,
  },
  chipRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  badgeChip: {
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badgeLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  timeChip: {
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  timeChipLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  progressTrack: {
    borderRadius: 999,
    height: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
  },
  videoMeta: {
    fontSize: 12,
    marginTop: spacing.xs,
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  listWrap: {
    flex: 1,
  },
  skeletonBlock: {
    borderRadius: radii.md,
  },
  skeletonTitle: {
    borderRadius: 999,
    height: 12,
    marginBottom: spacing.xs,
    width: '80%',
  },
  skeletonMeta: {
    borderRadius: 999,
    height: 10,
    width: '45%',
  },
});

export { HomeScreen };
