import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEvent, useVideoPlayer, VideoView } from 'react-native-video';
import { TARCHPEEK_CONSTANTS } from '../constants/tarchpeekConstants';
import { useTheme } from '../design/ThemeProvider';
import type { TubeArchivistClient, VideoDetails } from '../services/tubeArchivist';
import {
  PROGRESS_SYNC_INTERVAL_SECONDS,
  syncPlaybackProgressCheckpoint,
} from './playbackProgress';

type PlayerScreenProps = {
  client: TubeArchivistClient;
  onBack: (result: { resultMessage?: string; shouldRefreshBrowse: boolean }) => void;
  onPlayNextInQueue: () => Promise<boolean>;
  videoDetails: VideoDetails;
};

const COLLAPSED_DESCRIPTION_LINES = TARCHPEEK_CONSTANTS.player.collapsedDescriptionLines;
const RESUME_MIN_SECONDS = TARCHPEEK_CONSTANTS.player.resumeMinSeconds;
const RESUME_END_BUFFER_SECONDS = TARCHPEEK_CONSTANTS.player.resumeEndBufferSeconds;

function formatViewCount(viewCount: number) {
  const compactLabel = new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(Math.max(0, viewCount));
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

function PlayerScreen({ client, onBack, onPlayNextInQueue, videoDetails }: PlayerScreenProps) {
  const { theme } = useTheme();
  const initialResumeSeconds = Math.max(0, Math.floor(videoDetails.resumePositionSeconds));
  const durationSeconds = Math.max(0, Math.floor(videoDetails.duration ?? 0));
  const canApplyResumePosition =
    initialResumeSeconds > RESUME_MIN_SECONDS &&
    (durationSeconds <= 0 || initialResumeSeconds < Math.max(RESUME_MIN_SECONDS + 1, durationSeconds - RESUME_END_BUFFER_SECONDS));
  const [, setPlaybackStatus] = useState('Preparing player...');
  const [isWatched, setIsWatched] = useState(videoDetails.watched);
  const [isUpdatingWatchedState, setIsUpdatingWatchedState] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [hasExpandableDescription, setHasExpandableDescription] = useState(false);
  const [focusedActionId, setFocusedActionId] = useState<string | null>(null);
  const latestPlaybackTimeRef = useRef(0);
  const lastSyncedProgressRef = useRef(0);
  const isProgressSyncInFlightRef = useRef(false);
  const isClosingRef = useRef(false);
  const didWatchedStateChangeRef = useRef(false);
  const isPlayingRef = useRef(false);
  const playSessionStartedAtMsRef = useRef<number | null>(null);
  const watchedSessionMsRef = useRef(0);
  const isAdvancingAfterEndRef = useRef(false);

  const player = useVideoPlayer(videoDetails.source, currentPlayer => {
    currentPlayer.muted = false;
    currentPlayer.volume = 1;
    currentPlayer.loop = false;

    if (canApplyResumePosition) {
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
    setPlaybackStatus(
      canApplyResumePosition
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

    if (data.isPlaying && !isPlayingRef.current) {
      isPlayingRef.current = true;
      playSessionStartedAtMsRef.current = Date.now();
    }

    if ((!data.isPlaying || data.isBuffering) && isPlayingRef.current) {
      const startedAt = playSessionStartedAtMsRef.current;
      if (startedAt) {
        watchedSessionMsRef.current += Math.max(0, Date.now() - startedAt);
      }
      playSessionStartedAtMsRef.current = null;
      isPlayingRef.current = false;
    }

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
    if (isClosingRef.current || isAdvancingAfterEndRef.current) {
      return;
    }

    isAdvancingAfterEndRef.current = true;
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
    })
      .then(async () => {
        await onPlayNextInQueue();
      })
      .catch(error => {
        const errorMessage = error instanceof Error ? error.message : 'Unknown progress sync error';
        setPlaybackStatus(`Background progress sync failed: ${errorMessage}`);
      })
      .finally(() => {
        isAdvancingAfterEndRef.current = false;
      });
  });

  useEvent(player, 'onError', error => {
    setPlaybackStatus(`Playback failed: ${error.message}`);
  });

  const handleBackPress = useCallback(async () => {
    if (isClosingRef.current) {
      return;
    }

    isClosingRef.current = true;
    if (isPlayingRef.current) {
      const startedAt = playSessionStartedAtMsRef.current;
      if (startedAt) {
        watchedSessionMsRef.current += Math.max(0, Date.now() - startedAt);
      }
      playSessionStartedAtMsRef.current = null;
      isPlayingRef.current = false;
    }
    const watchedSessionSeconds = Math.floor(watchedSessionMsRef.current / 1000);
    const shouldRefreshBrowse =
      watchedSessionSeconds >= TARCHPEEK_CONSTANTS.player.browseRefreshWatchThresholdSeconds ||
      didWatchedStateChangeRef.current;
    onBack({ resultMessage: 'Playback closed.', shouldRefreshBrowse });

    syncPlaybackProgressCheckpoint({
      client,
      force: true,
      isProgressSyncInFlightRef,
      lastSyncedProgressRef,
      latestPlaybackTimeRef,
      reasonLabel: 'exit',
      setPlaybackStatus,
      shouldUpdateStatus: false,
      videoId: videoDetails.videoId,
    }).catch(() => undefined);
  }, [client, onBack, videoDetails.videoId]);

  useEffect(() => {
    // Needed to map Android hardware back/gesture to player exit + final progress sync.
    const backSubscription = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBackPress().catch(() => undefined);
      return true;
    });

    return () => {
      backSubscription.remove();
    };
  }, [handleBackPress]);

  async function handleToggleWatched() {
    if (isUpdatingWatchedState) {
      return;
    }

    const nextWatched = !isWatched;
    setIsUpdatingWatchedState(true);
    setIsWatched(nextWatched);

    try {
      await client.setWatchedState(videoDetails.videoId, nextWatched);
      didWatchedStateChangeRef.current = true;
    } catch (error) {
      setIsWatched(!nextWatched);
      const errorMessage = error instanceof Error ? error.message : 'Unknown watched state update error';
      setPlaybackStatus(`Watched state update failed: ${errorMessage}`);
    } finally {
      setIsUpdatingWatchedState(false);
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.pageBackground }]} testID="player-screen">
      <View style={[styles.playerScreenFrame, { backgroundColor: theme.colors.videoFrameBackground }]}>
        <VideoView
          controls
          player={player}
          resizeMode="contain"
          style={styles.playerScreenVideo}
          surfaceType="surface"
          testID="player-video-view"
        />
      </View>
      <View style={styles.playerMetadataSection}>
        <View style={styles.playerScreenHeader}>
          <Text style={[styles.videoTitle, { color: theme.colors.textPrimary }]}>{videoDetails.title}</Text>
          <View style={styles.videoMetaRow}>
            <Text numberOfLines={1} style={[styles.videoMetaLine, { color: theme.colors.textSecondary }]}>
              {`${formatViewCount(videoDetails.viewCount)} • ${formatPublishedDate(videoDetails.published)}`}
            </Text>
            <Pressable
              accessibilityLabel={isWatched ? 'Watched' : 'Mark watched'}
              accessibilityRole="button"
              focusable
              onBlur={() => {
                setFocusedActionId(current => (current === 'watched-toggle' ? null : current));
              }}
              onFocus={() => {
                setFocusedActionId('watched-toggle');
              }}
              onPress={() => {
                handleToggleWatched().catch(() => undefined);
              }}
              style={({ pressed }) => [
                styles.watchedToggleButton,
                {
                  borderColor: focusedActionId === 'watched-toggle' ? theme.colors.accent : 'transparent',
                },
                pressed ? styles.buttonPressed : null,
              ]}>
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
            <Text
              numberOfLines={COLLAPSED_DESCRIPTION_LINES}
              onTextLayout={event => {
                setHasExpandableDescription(
                  event.nativeEvent.lines.length > COLLAPSED_DESCRIPTION_LINES,
                );
              }}
              style={[styles.videoMeta, { color: theme.colors.textPrimary }]}>
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
          {!isDescriptionExpanded && hasExpandableDescription ? (
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
