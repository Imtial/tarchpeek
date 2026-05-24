import { useState } from 'react';
import { FlashList } from '@shopify/flash-list';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { TARCHPEEK_CONSTANTS } from '../../constants/tarchpeekConstants';
import { useTheme } from '../../design/ThemeProvider';
import type { ContinueWatchingItem } from '../../services/tubeArchivist';
import { radii, spacing } from '../../design/tokens';

const LIST_DRAW_DISTANCE = TARCHPEEK_CONSTANTS.browsing.videoListDrawDistance;
const NEW_CHIP_WINDOW_HOURS = TARCHPEEK_CONSTANTS.browsing.newChipWindowHours;
const NEW_CHIP_WINDOW_SECONDS = NEW_CHIP_WINDOW_HOURS * TARCHPEEK_CONSTANTS.browsing.secondsPerHour;

type VideoResultsListProps = {
  items: ContinueWatchingItem[];
  isLoading: boolean;
  loadingCount: number;
  onOpenVideo: (videoId: string, queueContext?: { videoIds: string[]; currentIndex: number }) => Promise<void>;
  hasNextPage?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => Promise<void>;
};

function formatViewCount(viewCount: number) {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(Math.max(0, viewCount));
}

function isRecentlyAdded(dateDownloaded: number) {
  if (!dateDownloaded || dateDownloaded <= 0) {
    return false;
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  return nowSeconds - dateDownloaded <= NEW_CHIP_WINDOW_SECONDS;
}

function VideoResultsList({
  hasNextPage = false,
  isLoading,
  isLoadingMore = false,
  items,
  loadingCount,
  onLoadMore,
  onOpenVideo,
}: VideoResultsListProps) {
  const { theme } = useTheme();
  const { colors } = theme;
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [focusedElementId, setFocusedElementId] = useState<string | null>(null);

  async function handleOpenVideo(videoId: string) {
    setActiveVideoId(videoId);
    const currentIndex = items.findIndex(item => item.videoId === videoId);
    const queueContext =
      currentIndex >= 0
        ? {
            videoIds: items.map(item => item.videoId),
            currentIndex,
          }
        : undefined;
    try {
      await onOpenVideo(videoId, queueContext);
    } finally {
      setActiveVideoId(null);
    }
  }

  function renderProgress(item: ContinueWatchingItem) {
    const duration = Math.max(1, item.durationSeconds);
    const progressRatio = Math.max(0, Math.min(1, item.resumePositionSeconds / duration));
    const progressPercent = Math.round(progressRatio * 100);
    const isNew = isRecentlyAdded(item.dateDownloaded);
    const hasContinueProgress = item.resumePositionSeconds > 0;

    return (
      <View style={styles.thumbnailOverlay}>
        <View style={styles.chipRow}>
          {isNew ? (
            <View style={[styles.badgeChip, { backgroundColor: colors.accent }]}>
              <Text style={[styles.badgeLabel, { color: colors.buttonLabel }]}>New</Text>
            </View>
          ) : hasContinueProgress ? (
            <View style={[styles.badgeChip, { backgroundColor: colors.surfaceBackground }]}>
              <Text style={[styles.badgeLabel, { color: colors.textPrimary }]}>{`${progressPercent}%`}</Text>
            </View>
          ) : (
            <View style={styles.badgeChipPlaceholder} />
          )}
          <View style={styles.rightChips}>
            {item.watched ? (
              <View style={[styles.watchedChip, { backgroundColor: colors.accent }]}>
                <Text style={[styles.badgeLabel, { color: colors.buttonLabel }]}>Watched</Text>
              </View>
            ) : null}
            <View style={[styles.timeChip, { backgroundColor: colors.surfaceBackground }]}>
              <Text style={[styles.timeChipLabel, { color: colors.textPrimary }]}>{item.durationLabel}</Text>
            </View>
          </View>
        </View>
        {hasContinueProgress ? (
          <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
            <View style={[styles.progressFill, { backgroundColor: colors.accent, width: `${progressPercent}%` }]} />
          </View>
        ) : null}
      </View>
    );
  }

  function renderVideoCard(item: ContinueWatchingItem, index: number) {
    return (
      <Pressable
        accessibilityRole="button"
        disabled={activeVideoId === item.videoId}
        key={item.videoId}
        onBlur={() => {
          setFocusedElementId(current => (current === item.videoId ? null : current));
        }}
        onFocus={() => {
          setFocusedElementId(item.videoId);
        }}
        onPress={() => {
          handleOpenVideo(item.videoId).catch(() => {
            setActiveVideoId(null);
          });
        }}
        style={({ pressed }) => [
          styles.videoItem,
          { borderColor: focusedElementId === item.videoId ? colors.accent : colors.border },
          pressed ? styles.buttonPressed : null,
        ]}
        testID={index === 0 ? 'video-card-first' : `video-card-${item.videoId}`}>
        <View style={styles.thumbnailWrap}>
          <Image source={{ uri: item.thumbnailUrl }} style={styles.thumbnailImage} />
          {renderProgress(item)}
        </View>
        <Text numberOfLines={1} style={[styles.videoTitle, { color: colors.textPrimary }]}>
          {item.title}
        </Text>
        <View style={styles.videoMetaRow}>
          {item.channelLogoUrl ? <Image source={{ uri: item.channelLogoUrl }} style={styles.channelLogo} /> : null}
          <Text numberOfLines={1} style={[styles.videoMeta, { color: colors.textSecondary }]}>
            {item.channelName}
          </Text>
          <Text style={[styles.videoMetaCount, { color: colors.textSecondary }]}>{`${formatViewCount(item.viewCount)} views`}</Text>
        </View>
      </Pressable>
    );
  }

  function renderLoadMoreFooter() {
    if (!onLoadMore) {
      return null;
    }

    return (
      <Pressable
        accessibilityRole="button"
        disabled={!hasNextPage || isLoadingMore}
        onBlur={() => {
          setFocusedElementId(current => (current === 'video-load-more' ? null : current));
        }}
        onFocus={() => {
          setFocusedElementId('video-load-more');
        }}
        onPress={() => {
          onLoadMore().catch(() => undefined);
        }}
        style={({ pressed }) => [
          styles.loadMoreButton,
          {
            backgroundColor:
              hasNextPage && !isLoadingMore
                ? colors.buttonSecondaryBackground
                : colors.buttonDisabledBackground,
          },
          focusedElementId === 'video-load-more' ? styles.buttonFocused : null,
          pressed && hasNextPage && !isLoadingMore ? styles.buttonPressed : null,
        ]}>
        <Text style={[styles.loadMoreLabel, { color: colors.buttonLabel }]}>
          {isLoadingMore ? 'Loading...' : hasNextPage ? 'Load next page' : 'No more pages'}
        </Text>
      </Pressable>
    );
  }

  if (isLoading) {
    return (
      <>
        {Array.from({ length: loadingCount }).map((_, index) => (
          <View key={`video-skeleton-${index}`} style={[styles.videoItem, { borderColor: colors.border }]}>
            <View style={[styles.thumbnailImage, styles.skeletonBlock, { backgroundColor: colors.surfacePressed }]} />
            <View style={[styles.skeletonTitle, { backgroundColor: colors.surfacePressed }]} />
            <View style={[styles.skeletonMeta, { backgroundColor: colors.surfacePressed }]} />
          </View>
        ))}
      </>
    );
  }

  return (
    <View style={styles.listWrap}>
      <FlashList
        data={items}
        drawDistance={LIST_DRAW_DISTANCE}
        keyExtractor={item => item.videoId}
        ListFooterComponent={renderLoadMoreFooter}
        removeClippedSubviews
        renderItem={({ item, index }) => renderVideoCard(item, index)}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  buttonPressed: {
    opacity: 0.92,
  },
  buttonFocused: {
    transform: [{ scale: 1.02 }],
  },
  listWrap: {
    flex: 1,
  },
  loadMoreButton: {
    alignSelf: 'center',
    borderRadius: radii.md,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  loadMoreLabel: {
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
  rightChips: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  badgeChip: {
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badgeChipPlaceholder: {
    minHeight: 18,
    minWidth: 28,
  },
  watchedChip: {
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
  videoTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  videoMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  channelLogo: {
    borderRadius: 8,
    height: 16,
    marginTop: spacing.xs,
    width: 16,
  },
  videoMeta: {
    flex: 1,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  videoMetaCount: {
    fontSize: 12,
    marginTop: spacing.xs,
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

export { VideoResultsList };
