import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { ExpandableDescription } from '../../components/ExpandableDescription';
import { useTheme } from '../../design/ThemeProvider';
import type { TubeArchivistClient } from '../../services/tubeArchivist';
import { radii, spacing } from '../../design/tokens';
import { BrowsingScreenShell } from './BrowsingScreenShell';
import { useChannelDetailResource } from './hooks/useChannelDetailResource';
import { VideoResultsList } from './VideoResultsList';

type ChannelDetailScreenProps = {
  channelId: string;
  client: TubeArchivistClient;
  onOpenVideo: (
    videoId: string,
    queueContext?: { videoIds: string[]; currentIndex: number },
  ) => Promise<void>;
};

function ChannelDetailScreen({ channelId, client, onOpenVideo }: ChannelDetailScreenProps) {
  const { theme } = useTheme();
  const { colors } = theme;
  const {
    detail,
    hasNextPage,
    isDetailError,
    isDetailLoading,
    isVideosError,
    isVideosLoading,
    isLoadingMore,
    videoItems,
    loadMore,
    reloadVideos,
  } = useChannelDetailResource({
    channelId,
    client,
  });
  const descriptionText = detail?.description ?? 'No description available.';

  return (
    <BrowsingScreenShell
      subtitle=""
      testID="channel-detail-screen"
      title={detail?.channelName ?? 'Channel'}
    >
      {detail?.thumbnailUrl ? (
        <Image source={{ uri: detail.thumbnailUrl }} style={styles.banner} />
      ) : (
        <View style={[styles.banner, { backgroundColor: colors.surfacePressed }]} />
      )}
      <View style={styles.metaWrap}>
        <Text style={[styles.meta, { color: colors.textSecondary }]}>
          {`${detail?.subscriberCount.toLocaleString() ?? 0} subscribers`}
        </Text>
        <Text style={[styles.metaStatus, { color: colors.textSecondary }]}>
          {detail?.subscribed ? 'Subscribed' : 'Not subscribed'}
        </Text>
      </View>
      <View style={[styles.descriptionCard, { borderColor: colors.border }]}>
        <ExpandableDescription
          collapsedLines={4}
          descriptionStyle={[styles.description, { color: colors.textPrimary }]}
          expandedScrollMaxHeight={180}
          text={descriptionText}
        />
      </View>
      {isDetailError ? (
        <Text style={[styles.stateText, { color: colors.textSecondary }]}>
          Failed to load channel details.
        </Text>
      ) : null}
      {isVideosError ? (
        <View style={styles.errorRow}>
          <Text style={[styles.stateText, { color: colors.textSecondary }]}>
            Failed to load channel videos.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              reloadVideos().catch(() => undefined);
            }}
            style={[styles.retryButton, { backgroundColor: colors.buttonSecondaryBackground }]}
          >
            <Text style={[styles.retryLabel, { color: colors.buttonLabel }]}>Retry</Text>
          </Pressable>
        </View>
      ) : null}
      {!isVideosLoading && !isVideosError && videoItems.length === 0 ? (
        <Text style={[styles.stateText, { color: colors.textSecondary }]}>
          No videos found for this channel.
        </Text>
      ) : null}
      <VideoResultsList
        hasNextPage={hasNextPage}
        isLoading={isDetailLoading || isVideosLoading}
        isLoadingMore={isLoadingMore}
        items={videoItems}
        loadingCount={4}
        onLoadMore={loadMore}
        onOpenVideo={onOpenVideo}
      />
    </BrowsingScreenShell>
  );
}

const styles = StyleSheet.create({
  banner: {
    aspectRatio: 16 / 5,
    borderRadius: 0,
    width: '100%',
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
  },
  descriptionCard: {
    borderRadius: radii.md,
    borderWidth: 1,
    marginTop: spacing.md,
    marginHorizontal: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  meta: {
    fontSize: 12,
  },
  metaWrap: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  metaStatus: {
    borderRadius: radii.md,
    fontSize: 12,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
  errorRow: {
    alignItems: 'flex-start',
    marginHorizontal: spacing.sm,
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
  stateText: {
    fontSize: 13,
    marginHorizontal: spacing.sm,
    marginTop: spacing.sm,
  },
});

export { ChannelDetailScreen };
