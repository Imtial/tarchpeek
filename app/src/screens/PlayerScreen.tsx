import { useEffect, useRef, useState } from 'react';
import { BackHandler, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEvent, useVideoPlayer, VideoView } from 'react-native-video';
import { useTheme } from '../design/ThemeProvider';
import type { TubeArchivistClient, VideoDetails } from '../services/tubeArchivist';
import {
  PROGRESS_SYNC_INTERVAL_SECONDS,
  syncPlaybackProgressCheckpoint,
} from './playbackProgress';

type PlayerScreenProps = {
  client: TubeArchivistClient;
  onBack: (resultMessage?: string) => void;
  videoDetails: VideoDetails;
};

const COLLAPSED_DESCRIPTION_LINES = 4;

function formatViewCount(viewCount: number) {
  return `${new Intl.NumberFormat('en-US').format(viewCount)} views`;
}

function formatPublishedDate(published: string) {
  const publishedDate = new Date(published);
  if (Number.isNaN(publishedDate.getTime())) {
    return published;
  }

  const now = Date.now();
  const diffMs = now - publishedDate.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const absoluteLabel = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(publishedDate);

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

function PlayerScreen({ client, onBack, videoDetails }: PlayerScreenProps) {
  const { theme } = useTheme();
  const initialResumeSeconds = Math.max(0, Math.floor(videoDetails.resumePositionSeconds));
  const [playbackStatus, setPlaybackStatus] = useState('Preparing player...');
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [focusedActionId, setFocusedActionId] = useState<string | null>(null);
  const latestPlaybackTimeRef = useRef(0);
  const lastSyncedProgressRef = useRef(0);
  const isProgressSyncInFlightRef = useRef(false);
  const isClosingRef = useRef(false);

  const player = useVideoPlayer(videoDetails.source, currentPlayer => {
    currentPlayer.muted = false;
    currentPlayer.volume = 1;
    currentPlayer.loop = false;

    if (initialResumeSeconds > 3) {
      currentPlayer.currentTime = initialResumeSeconds;
      latestPlaybackTimeRef.current = initialResumeSeconds;
      lastSyncedProgressRef.current = initialResumeSeconds;
    }

    currentPlayer.play();
  });

  useEvent(player, 'onLoadStart', () => {
    setPlaybackStatus('Loading video source...');
  });

  useEvent(player, 'onLoad', data => {
    const canResume =
      initialResumeSeconds > 3 &&
      initialResumeSeconds < Math.max(4, Math.floor(data.duration) - 3);

    setPlaybackStatus(
      canResume
        ? `Playback started. Resumed at ${initialResumeSeconds}s.`
        : `Playback started. Duration ${Math.round(data.duration)}s.`,
    );
  });

  useEvent(player, 'onProgress', data => {
    latestPlaybackTimeRef.current = data.currentTime;

    const playbackSeconds = Math.max(0, Math.floor(data.currentTime));
    const hasReachedIntervalThreshold =
      playbackSeconds >= lastSyncedProgressRef.current + PROGRESS_SYNC_INTERVAL_SECONDS;

    if (hasReachedIntervalThreshold) {
      syncPlaybackProgressCheckpoint({
        client,
        force: false,
        isProgressSyncInFlightRef,
        lastSyncedProgressRef,
        latestPlaybackTimeRef,
        reasonLabel: 'interval',
        setPlaybackStatus,
        shouldUpdateStatus: false,
        videoId: videoDetails.videoId,
      }).catch(error => {
        const errorMessage = error instanceof Error ? error.message : 'Unknown progress sync error';
        setPlaybackStatus(`Background progress sync failed: ${errorMessage}`);
      });
    }
  });

  useEvent(player, 'onBuffer', buffering => {
    if (buffering) {
      setPlaybackStatus('Buffering video...');
    }
  });

  useEvent(player, 'onPlaybackStateChange', data => {
    const nextStateLabel = data.isBuffering ? 'buffering' : data.isPlaying ? 'playing' : 'paused';
    setPlaybackStatus(`Playback state: ${nextStateLabel}`);

    if (!data.isPlaying && !data.isBuffering) {
      syncPlaybackProgressCheckpoint({
        client,
        force: true,
        isProgressSyncInFlightRef,
        lastSyncedProgressRef,
        latestPlaybackTimeRef,
        reasonLabel: nextStateLabel,
        setPlaybackStatus,
        shouldUpdateStatus: false,
        videoId: videoDetails.videoId,
      }).catch(error => {
        const errorMessage = error instanceof Error ? error.message : 'Unknown progress sync error';
        setPlaybackStatus(`Background progress sync failed: ${errorMessage}`);
      });
    }
  });

  useEvent(player, 'onEnd', () => {
    syncPlaybackProgressCheckpoint({
      client,
      force: true,
      isProgressSyncInFlightRef,
      lastSyncedProgressRef,
      latestPlaybackTimeRef,
      reasonLabel: 'ended',
      setPlaybackStatus,
      shouldUpdateStatus: false,
      videoId: videoDetails.videoId,
    }).catch(error => {
      const errorMessage = error instanceof Error ? error.message : 'Unknown progress sync error';
      setPlaybackStatus(`Background progress sync failed: ${errorMessage}`);
    });
  });

  useEvent(player, 'onError', error => {
    setPlaybackStatus(`Playback failed: ${error.message}`);
  });

  async function handleBackPress() {
    if (isClosingRef.current) {
      return;
    }

    isClosingRef.current = true;

    let resultMessage = 'Playback closed.';

    try {
      resultMessage = await syncPlaybackProgressCheckpoint({
        client,
        force: true,
        isProgressSyncInFlightRef,
        lastSyncedProgressRef,
        latestPlaybackTimeRef,
        reasonLabel: 'exit',
        setPlaybackStatus,
        shouldUpdateStatus: true,
        videoId: videoDetails.videoId,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown progress sync error';
      resultMessage = `Progress sync failed: ${errorMessage}`;
      setPlaybackStatus(resultMessage);
    } finally {
      onBack(resultMessage);
    }
  }

  useEffect(() => {
    // Needed to map Android hardware back/gesture to player exit + final progress sync.
    const backSubscription = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBackPress().catch(() => undefined);
      return true;
    });

    return () => {
      backSubscription.remove();
    };
  }, [client, onBack, videoDetails.videoId]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.pageBackground }]}>
      <View style={[styles.playerScreenFrame, { backgroundColor: theme.colors.videoFrameBackground }]}>
        <VideoView
          controls
          player={player}
          resizeMode="contain"
          style={styles.playerScreenVideo}
          surfaceType="surface"
        />
      </View>
      <View style={styles.playerMetadataSection}>
        <View style={styles.playerScreenHeader}>
          <Text style={[styles.videoTitle, { color: theme.colors.textPrimary }]}>{videoDetails.title}</Text>
          <Text style={[styles.videoMeta, { color: theme.colors.textSecondary }]}>
            {`${formatViewCount(videoDetails.viewCount)} • ${formatPublishedDate(videoDetails.published)}`}
          </Text>
          <View style={styles.channelRow}>
            {videoDetails.channelLogoUrl ? (
              <Image source={{ uri: videoDetails.channelLogoUrl }} style={styles.channelLogo} />
            ) : (
              <View
                style={[
                  styles.channelLogoFallback,
                  { backgroundColor: theme.colors.surfaceBackground, borderColor: theme.colors.border },
                ]}
              />
            )}
            <Text numberOfLines={1} style={[styles.channelName, { color: theme.colors.textPrimary }]}>
              {videoDetails.channelName}
            </Text>
          </View>
        </View>

        <View style={[styles.metadataCard, { borderColor: theme.colors.border }]}>
          {isDescriptionExpanded ? (
            <ScrollView
              nestedScrollEnabled
              persistentScrollbar
              showsVerticalScrollIndicator
              style={styles.expandedDescriptionScroll}>
              <Text style={[styles.videoMeta, { color: theme.colors.textPrimary }]}>
                {videoDetails.description}
              </Text>
            </ScrollView>
          ) : (
            <Text numberOfLines={COLLAPSED_DESCRIPTION_LINES} style={[styles.videoMeta, { color: theme.colors.textPrimary }]}>
              {videoDetails.description}
            </Text>
          )}
          {isDescriptionExpanded ? (
            <Pressable
              accessibilityRole="button"
              focusable
              onBlur={() => {
                setFocusedActionId(current => (current === 'description-collapse' ? null : current));
              }}
              onFocus={() => {
                setFocusedActionId('description-collapse');
              }}
              onPress={() => {
                setIsDescriptionExpanded(false);
              }}
              style={({ pressed }) => [
                styles.descriptionToggleButton,
                {
                  borderColor:
                    focusedActionId === 'description-collapse' ? theme.colors.accent : 'transparent',
                },
                pressed ? styles.buttonPressed : null,
              ]}>
              <Text style={[styles.seeMoreLabel, { color: theme.colors.textSecondary }]}>See less...</Text>
            </Pressable>
          ) : null}
          {!isDescriptionExpanded ? (
            <Pressable
              accessibilityRole="button"
              focusable
              onBlur={() => {
                setFocusedActionId(current => (current === 'description-toggle' ? null : current));
              }}
              onFocus={() => {
                setFocusedActionId('description-toggle');
              }}
              onPress={() => {
                setIsDescriptionExpanded(true);
              }}
              style={({ pressed }) => [
                styles.descriptionToggleButton,
                {
                  borderColor: focusedActionId === 'description-toggle' ? theme.colors.accent : 'transparent',
                },
                pressed ? styles.buttonPressed : null,
              ]}>
              <Text style={[styles.seeMoreLabel, { color: theme.colors.textSecondary }]}>See more ...</Text>
            </Pressable>
          ) : null}
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
  descriptionToggleButton: {
    alignSelf: 'flex-start',
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
  expandedDescriptionScroll: {
    flexGrow: 0,
    flexShrink: 1,
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
});

export { PlayerScreen };
