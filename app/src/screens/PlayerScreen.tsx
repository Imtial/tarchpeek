import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons/static';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VideoView } from 'react-native-video';
import { AndroidOrientationOverride } from '../app/AndroidOrientationPolicyProvider';
import { ExpandableDescription } from '../components/ExpandableDescription';
import { TARCHPEEK_CONSTANTS } from '../constants/tarchpeekConstants';
import { useTheme } from '../design/ThemeProvider';
import type { TubeArchivistClient, VideoDetails } from '../services/tubeArchivist';
import { usePlayerSession } from './usePlayerSession';

type PlayerScreenProps = {
  client: TubeArchivistClient;
  onBack: (result: { resultMessage?: string; shouldRefreshBrowse: boolean }) => void;
  onPlayNextInQueue: () => Promise<boolean>;
  videoDetails: VideoDetails;
};

const COLLAPSED_DESCRIPTION_LINES = TARCHPEEK_CONSTANTS.player.collapsedDescriptionLines;
const VIEW_COUNT_FORMATTER = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
});
const PUBLISHED_DATE_FORMATTER = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' });

function formatViewCount(viewCount: number) {
  const compactLabel = VIEW_COUNT_FORMATTER.format(Math.max(0, viewCount));
  return `${compactLabel} views`;
}

function formatPublishedDate(published: string) {
  const publishedDate = new Date(published);
  if (Number.isNaN(publishedDate.getTime())) {
    return published;
  }

  const now = Date.now();
  const diffMs = now - publishedDate.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const absoluteLabel = PUBLISHED_DATE_FORMATTER.format(publishedDate);

  if (days < 1) {
    return `Today • ${absoluteLabel}`;
  }
  if (days === 1) {
    return `1 day ago • ${absoluteLabel}`;
  }
  if (days < 30) {
    return `${days} days ago • ${absoluteLabel}`;
  }

  const months = Math.floor(days / 30);
  if (months < 12) {
    return `${months} month${months === 1 ? '' : 's'} ago • ${absoluteLabel}`;
  }

  const years = Math.floor(months / 12);
  return `${years} year${years === 1 ? '' : 's'} ago • ${absoluteLabel}`;
}

function PlayerScreen({ client, onBack, onPlayNextInQueue, videoDetails }: PlayerScreenProps) {
  const { theme } = useTheme();
  const {
    handleFullscreenChange,
    handleToggleWatched,
    handleWillEnterFullscreen,
    handleWillExitFullscreen,
    isFullscreen,
    fullscreenOrientationLock,
    isWatched,
    player,
  } = usePlayerSession({
    client,
    onBack,
    onPlayNextInQueue,
    videoDetails,
  });
  const descriptionText = videoDetails.description || 'No description available.';

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.pageBackground }]}
      testID="player-screen"
    >
      <AndroidOrientationOverride enabled={isFullscreen} orientation={fullscreenOrientationLock} />
      <View
        style={[styles.playerScreenFrame, { backgroundColor: theme.colors.videoFrameBackground }]}
      >
        <VideoView
          controls
          onFullscreenChange={handleFullscreenChange}
          willEnterFullscreen={handleWillEnterFullscreen}
          willExitFullscreen={handleWillExitFullscreen}
          player={player}
          resizeMode="contain"
          style={styles.playerScreenVideo}
          surfaceType="surface"
          testID="player-video-view"
        />
      </View>
      <View style={styles.playerMetadataSection}>
        <View style={styles.playerScreenHeader}>
          <Text style={[styles.videoTitle, { color: theme.colors.textPrimary }]}>
            {videoDetails.title}
          </Text>
          <View style={styles.videoMetaRow}>
            <Text
              numberOfLines={1}
              style={[styles.videoMetaLine, { color: theme.colors.textSecondary }]}
            >
              {`${formatViewCount(videoDetails.viewCount)} • ${formatPublishedDate(videoDetails.published)}`}
            </Text>
            <Pressable
              accessibilityLabel={isWatched ? 'Watched' : 'Mark watched'}
              accessibilityRole="button"
              focusable
              onPress={() => {
                handleToggleWatched().catch(() => undefined);
              }}
              style={({ pressed }) => [
                styles.watchedToggleButton,
                pressed ? styles.buttonPressed : null,
              ]}
            >
              <MaterialCommunityIcons
                color={isWatched ? theme.colors.accent : theme.colors.textSecondary}
                name={isWatched ? 'check-circle' : 'check-circle-outline'}
                size={20}
              />
            </Pressable>
          </View>
          <View style={styles.channelRow}>
            {videoDetails.channelLogoUrl ? (
              <Image source={{ uri: videoDetails.channelLogoUrl }} style={styles.channelLogo} />
            ) : (
              <View
                style={[
                  styles.channelLogoFallback,
                  {
                    backgroundColor: theme.colors.surfaceBackground,
                    borderColor: theme.colors.border,
                  },
                ]}
              />
            )}
            <Text
              numberOfLines={1}
              style={[styles.channelName, { color: theme.colors.textPrimary }]}
            >
              {videoDetails.channelName}
            </Text>
          </View>
        </View>

        <View style={[styles.metadataCard, { borderColor: theme.colors.border }]}>
          <ExpandableDescription
            collapsedLines={COLLAPSED_DESCRIPTION_LINES}
            descriptionStyle={[styles.videoMeta, { color: theme.colors.textPrimary }]}
            text={descriptionText}
            toggleButtonStyle={styles.descriptionToggleButton}
            toggleLabelStyle={styles.seeMoreLabel}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  buttonPressed: {
    opacity: 0.9,
  },
  channelLogo: {
    borderRadius: 20,
    height: 40,
    width: 40,
  },
  channelLogoFallback: {
    borderRadius: 20,
    borderWidth: 1,
    height: 40,
    width: 40,
  },
  channelName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  channelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  videoMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  videoMetaLine: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  descriptionToggleButton: {
    borderWidth: 0,
    marginTop: 8,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  playerMetadataSection: {
    flex: 1,
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  playerScreenHeader: {
    gap: 10,
  },
  playerScreenFrame: {
    aspectRatio: 16 / 9,
  },
  playerScreenVideo: {
    flex: 1,
  },
  metadataCard: {
    borderRadius: 12,
    borderWidth: 1,
    flexShrink: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  videoTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  videoMeta: {
    fontSize: 13,
    lineHeight: 18,
  },
  seeMoreLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  watchedToggleButton: {
    borderRadius: 999,
    borderWidth: 1,
    height: 30,
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export { PlayerScreen };
