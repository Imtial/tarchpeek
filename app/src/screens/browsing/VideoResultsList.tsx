import { useCallback, useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { TARCHPEEK_CONSTANTS } from '../../constants/tarchpeekConstants';
import { useTheme } from '../../design/ThemeProvider';
import type { ContinueWatchingItem } from '../../services/tubeArchivist';
import type { AppTheme } from '../../design/themes';
import { radii, spacing } from '../../design/tokens';
import { PagedFlashList } from './PagedFlashList';

const LIST_DRAW_DISTANCE = TARCHPEEK_CONSTANTS.browsing.videoListDrawDistance;
const NEW_CHIP_WINDOW_HOURS = TARCHPEEK_CONSTANTS.browsing.newChipWindowHours;
const NEW_CHIP_WINDOW_SECONDS = NEW_CHIP_WINDOW_HOURS * TARCHPEEK_CONSTANTS.browsing.secondsPerHour;

type VideoResultsListProps = {
  items: ContinueWatchingItem[];
  isLoading: boolean;
  loadingCount: number;
  onOpenVideo: (
    videoId: string,
    queueContext?: { videoIds: string[]; currentIndex: number },
  ) => Promise<void>;
  hasNextPage?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => Promise<void>;
};

type VideoCardProgressProps = {
  colors: AppTheme['colors'];
  item: ContinueWatchingItem;
};

function formatViewCount(viewCount: number) {
  return VIEW_COUNT_FORMATTER.format(Math.max(0, viewCount));
}

const VIEW_COUNT_FORMATTER = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

function isRecentlyAdded(dateDownloaded: number) {
  if (!dateDownloaded || dateDownloaded <= 0) {
    return false;
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  return nowSeconds - dateDownloaded <= NEW_CHIP_WINDOW_SECONDS;
}

function VideoCardProgress({ colors, item }: VideoCardProgressProps) {
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
            <Text
              style={[styles.badgeLabel, { color: colors.textPrimary }]}
            >{`${progressPercent}%`}</Text>
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
            <Text style={[styles.timeChipLabel, { color: colors.textPrimary }]}>
              {item.durationLabel}
            </Text>
          </View>
        </View>
      </View>
      {hasContinueProgress ? (
        <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressFill,
              { backgroundColor: colors.accent, width: `${progressPercent}%` },
            ]}
          />
        </View>
      ) : null}
    </View>
  );
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
  const queueVideoIds = useMemo(() => items.map(video => video.videoId), [items]);
  const queueIndexByVideoId = useMemo(
    () => new Map(queueVideoIds.map((videoId, index) => [videoId, index])),
    [queueVideoIds],
  );

  const handleOpenVideo = useCallback(
    async (item: ContinueWatchingItem) => {
      setActiveVideoId(item.videoId);
      const currentIndex = queueIndexByVideoId.get(item.videoId) ?? -1;
      const queueContext =
        currentIndex >= 0
          ? {
              videoIds: queueVideoIds,
              currentIndex,
            }
          : undefined;
      try {
        await onOpenVideo(item.videoId, queueContext);
      } finally {
        setActiveVideoId(null);
      }
    },
    [onOpenVideo, queueIndexByVideoId, queueVideoIds],
  );

  function renderVideoCard(item: ContinueWatchingItem, index: number) {
    return (
      <Pressable
        accessibilityRole="button"
        disabled={activeVideoId === item.videoId}
        onBlur={() => {
          setFocusedElementId(current => (current === item.videoId ? null : current));
        }}
        onFocus={() => {
          setFocusedElementId(item.videoId);
        }}
        onPress={() => {
          handleOpenVideo(item).catch(() => {
            setActiveVideoId(null);
          });
        }}
        style={({ pressed }) => [
          styles.videoItem,
          { borderColor: focusedElementId === item.videoId ? colors.accent : colors.border },
          pressed ? styles.buttonPressed : null,
        ]}
        testID={index === 0 ? 'video-card-first' : `video-card-${item.videoId}`}
      >
        <View style={styles.thumbnailWrap}>
          <Image source={{ uri: item.thumbnailUrl }} style={styles.thumbnailImage} />
          <VideoCardProgress colors={colors} item={item} />
        </View>
        <Text numberOfLines={2} style={[styles.videoTitle, { color: colors.textPrimary }]}>
          {item.title}
        </Text>
        <View style={styles.videoMetaRow}>
          {item.channelLogoUrl ? (
            <Image source={{ uri: item.channelLogoUrl }} style={styles.channelLogo} />
          ) : null}
          <Text numberOfLines={1} style={[styles.videoMeta, { color: colors.textSecondary }]}>
            {item.channelName}
          </Text>
          <Text
            style={[styles.videoMetaCount, { color: colors.textSecondary }]}
          >{`${formatViewCount(item.viewCount)} views`}</Text>
        </View>
      </Pressable>
    );
  }

  if (isLoading) {
    return (
      <>
        {Array.from({ length: loadingCount }).map((_, index) => (
          <View
            key={`video-skeleton-${index}`}
            style={[styles.videoItem, { borderColor: colors.border }]}
          >
            <View
              style={[
                styles.thumbnailImage,
                styles.skeletonBlock,
                { backgroundColor: colors.surfacePressed },
              ]}
            />
            <View style={[styles.skeletonTitle, { backgroundColor: colors.surfacePressed }]} />
            <View style={[styles.skeletonMeta, { backgroundColor: colors.surfacePressed }]} />
          </View>
        ))}
      </>
    );
  }

  return (
    <View style={styles.listWrap}>
      <PagedFlashList
        data={items}
        drawDistance={LIST_DRAW_DISTANCE}
        hasNextPage={hasNextPage}
        isLoadingMore={isLoadingMore}
        keyExtractor={item => item.videoId}
        onLoadMore={onLoadMore}
        renderItem={({ item, index }) => renderVideoCard(item, index)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  buttonPressed: {
    opacity: 0.92,
  },
  listWrap: {
    flex: 1,
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
    marginBottom: spacing.xs,
    overflow: 'hidden',
    width: '100%',
  },
  progressFill: {
    height: '100%',
  },
  videoTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  videoMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  channelLogo: {
    borderRadius: 999,
    height: 18,
    width: 18,
  },
  videoMeta: {
    flexShrink: 1,
    fontSize: 12,
  },
  videoMetaCount: {
    fontSize: 12,
    marginLeft: 'auto',
  },
  skeletonBlock: {
    borderRadius: radii.md,
  },
  skeletonMeta: {
    borderRadius: 999,
    height: 10,
    width: '45%',
  },
  skeletonTitle: {
    borderRadius: 999,
    height: 14,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
    width: '85%',
  },
});

export { VideoResultsList };
