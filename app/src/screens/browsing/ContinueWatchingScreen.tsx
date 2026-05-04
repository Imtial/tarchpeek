import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../design/ThemeProvider';
import type { ContinueWatchingItem, TubeArchivistClient } from '../../services/tubeArchivist';
import { radii, spacing } from '../../design/tokens';
import { BrowsingScreenShell } from './BrowsingScreenShell';

type ContinueWatchingScreenProps = {
  client: TubeArchivistClient;
  onOpenVideo: (videoId: string) => Promise<void>;
};

function ContinueWatchingScreen({ client, onOpenVideo }: ContinueWatchingScreenProps) {
  const { theme } = useTheme();
  const { colors } = theme;
  const [items, setItems] = useState<ContinueWatchingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadFirstPage() {
      setIsLoading(true);
      try {
        const firstPage = await client.fetchContinueWatching(1);
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
      const response = await client.fetchContinueWatching(nextPage);
      setItems(currentItems => [...currentItems, ...response.items]);
      setPage(response.currentPage);
      setHasNextPage(response.hasNextPage);
    } catch {
    } finally {
      setIsLoadingMore(false);
    }
  }

  async function handleOpenVideo(videoId: string) {
    setActiveVideoId(videoId);
    try {
      await onOpenVideo(videoId);
    } finally {
      setActiveVideoId(null);
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

  return (
    <BrowsingScreenShell
      subtitle=""
      title="Continue Watching">
      {isLoading
        ? Array.from({ length: 5 }).map((_, index) => (
            <View key={`continue-skeleton-${index}`} style={[styles.videoItem, { borderColor: colors.border }]}>
              <View style={[styles.thumbnailImage, styles.skeletonBlock, { backgroundColor: colors.surfacePressed }]} />
              <View style={[styles.skeletonTitle, { backgroundColor: colors.surfacePressed }]} />
              <View style={[styles.skeletonMeta, { backgroundColor: colors.surfacePressed }]} />
            </View>
          ))
        : null}
      {!isLoading
        ? items.map(item => (
            <Pressable
              key={item.videoId}
              accessibilityRole="button"
              disabled={activeVideoId === item.videoId}
              onPress={() => {
                handleOpenVideo(item.videoId).catch(() => {
                  setActiveVideoId(null);
                });
              }}
              style={({ pressed }) => [
                styles.videoItem,
                { borderColor: colors.border },
                pressed ? styles.buttonPressed : null,
            ]}>
              <View style={styles.thumbnailWrap}>
                <Image
                  source={{ uri: item.thumbnailUrl }}
                  style={styles.thumbnailImage}
                />
                {renderProgress(item)}
              </View>
              <Text numberOfLines={1} style={[styles.videoTitle, { color: colors.textPrimary }]}>
                {item.title}
              </Text>
              <Text style={[styles.videoMeta, { color: colors.textSecondary }]}>
                {item.channelName}
              </Text>
            </Pressable>
          ))
        : null}
      {!isLoading ? (
        <View style={styles.moreActions}>
          <Pressable
            accessibilityRole="button"
            disabled={!hasNextPage || isLoadingMore}
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
              pressed && hasNextPage && !isLoadingMore ? styles.buttonPressed : null,
            ]}>
            <Text style={[styles.loadMoreLabel, { color: colors.buttonLabel }]}>
              {isLoadingMore ? 'Loading...' : hasNextPage ? 'Load next page' : 'No more pages'}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </BrowsingScreenShell>
  );
}

const styles = StyleSheet.create({
  buttonPressed: {
    opacity: 0.92,
  },
  loadMoreButton: {
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  loadMoreLabel: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  loadingSpinner: {
    marginTop: spacing.md,
  },
  moreActions: {
    marginTop: spacing.md,
  },
  videoItem: {
    borderRadius: radii.md,
    borderWidth: 1,
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

export { ContinueWatchingScreen };
