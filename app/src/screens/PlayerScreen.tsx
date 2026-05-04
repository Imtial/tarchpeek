import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEvent, useVideoPlayer, VideoView } from 'react-native-video';
import { useTheme } from '../design/ThemeProvider';
import type { TubeArchivistClient, VideoDetails } from '../services/tubeArchivist';

const PROGRESS_SYNC_INTERVAL_SECONDS = 5;
const PROGRESS_SYNC_MIN_DELTA_SECONDS = 5;

type PlayerScreenProps = {
  client: TubeArchivistClient;
  onBack: (resultMessage?: string) => void;
  videoDetails: VideoDetails;
};

function PlayerScreen({ client, onBack, videoDetails }: PlayerScreenProps) {
  const { theme } = useTheme();
  const initialResumeSeconds = Math.max(0, Math.floor(videoDetails.resumePositionSeconds));
  const [playbackTime, setPlaybackTime] = useState(initialResumeSeconds);
  const [duration, setDuration] = useState(videoDetails.duration ?? 0);
  const [playbackStatus, setPlaybackStatus] = useState('Preparing player...');
  const [isSyncingProgress, setIsSyncingProgress] = useState(false);
  const latestPlaybackTimeRef = useRef(0);
  const lastSyncedProgressRef = useRef(0);
  const isProgressSyncInFlightRef = useRef(false);

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
    setDuration(data.duration);

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
    setPlaybackTime(data.currentTime);

    const playbackSeconds = Math.max(0, Math.floor(data.currentTime));
    const hasReachedIntervalThreshold =
      playbackSeconds >= lastSyncedProgressRef.current + PROGRESS_SYNC_INTERVAL_SECONDS;

    if (hasReachedIntervalThreshold) {
      syncPlaybackProgressCheckpoint({
        force: false,
        reasonLabel: 'interval',
        shouldUpdateStatus: false,
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
        force: true,
        reasonLabel: nextStateLabel,
        shouldUpdateStatus: false,
      }).catch(error => {
        const errorMessage = error instanceof Error ? error.message : 'Unknown progress sync error';
        setPlaybackStatus(`Background progress sync failed: ${errorMessage}`);
      });
    }
  });

  useEvent(player, 'onEnd', () => {
    syncPlaybackProgressCheckpoint({
      force: true,
      reasonLabel: 'ended',
      shouldUpdateStatus: false,
    }).catch(error => {
      const errorMessage = error instanceof Error ? error.message : 'Unknown progress sync error';
      setPlaybackStatus(`Background progress sync failed: ${errorMessage}`);
    });
  });

  useEvent(player, 'onError', error => {
    setPlaybackStatus(`Playback failed: ${error.message}`);
  });

  async function syncPlaybackProgressCheckpoint({
    force,
    reasonLabel,
    shouldUpdateStatus,
  }: {
    force: boolean;
    reasonLabel: string;
    shouldUpdateStatus: boolean;
  }) {
    const playbackSeconds = Math.max(0, Math.floor(latestPlaybackTimeRef.current));

    if (playbackSeconds <= 0) {
      return 'Skipped progress sync because no watch time was recorded.';
    }

    const isNewEnoughCheckpoint =
      playbackSeconds >= lastSyncedProgressRef.current + PROGRESS_SYNC_MIN_DELTA_SECONDS;
    if (!force && !isNewEnoughCheckpoint) {
      return `Skipped ${reasonLabel} sync because progress only moved ${Math.max(0, playbackSeconds - lastSyncedProgressRef.current)}s.`;
    }

    if (isProgressSyncInFlightRef.current) {
      return `Skipped ${reasonLabel} sync because another request is in flight.`;
    }

    isProgressSyncInFlightRef.current = true;

    if (shouldUpdateStatus) {
      setPlaybackStatus(`Syncing progress checkpoint at ${playbackSeconds}s (${reasonLabel})...`);
    }

    try {
      await client.postProgressCheckpoint(videoDetails.videoId, playbackSeconds);

      lastSyncedProgressRef.current = playbackSeconds;

      if (shouldUpdateStatus) {
        setPlaybackStatus(`Progress checkpoint synced at ${playbackSeconds}s.`);
      }

      return `Progress checkpoint synced at ${playbackSeconds}s.`;
    } finally {
      isProgressSyncInFlightRef.current = false;
    }
  }

  async function handleBackPress() {
    if (isSyncingProgress) {
      return;
    }

    setIsSyncingProgress(true);

    let resultMessage = 'Playback closed.';

    try {
      resultMessage = await syncPlaybackProgressCheckpoint({
        force: true,
        reasonLabel: 'exit',
        shouldUpdateStatus: true,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown progress sync error';
      resultMessage = `Progress sync failed: ${errorMessage}`;
      setPlaybackStatus(resultMessage);
    } finally {
      setIsSyncingProgress(false);
      onBack(resultMessage);
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.pageBackground }]}>
      <View style={styles.playerScreen}>
        <View style={styles.playerScreenHeader}>
          <Text style={[styles.videoTitle, { color: theme.colors.textPrimary }]}>{videoDetails.title}</Text>
          <Text style={[styles.videoMeta, { color: theme.colors.textSecondary }]}>
            {`Progress: ${Math.round(playbackTime)}s${duration ? ` / ${Math.round(duration)}s` : ''}`}
          </Text>
          <Text style={[styles.videoMeta, { color: theme.colors.textSecondary }]}>{playbackStatus}</Text>
        </View>
        <View style={[styles.playerScreenFrame, { backgroundColor: theme.colors.videoFrameBackground }]}>
          <VideoView
            controls
            player={player}
            resizeMode="contain"
            style={styles.playerScreenVideo}
            surfaceType="surface"
          />
        </View>
        <View style={styles.playerScreenActions}>
          <Pressable
            accessibilityRole="button"
            focusable
            onPress={handleBackPress}
            style={({ pressed }) => [
              styles.button,
              {
                backgroundColor: isSyncingProgress
                  ? theme.colors.buttonDisabledBackground
                  : theme.colors.buttonPrimaryBackground,
              },
              pressed && !isSyncingProgress ? styles.buttonPressed : null,
            ]}>
            <Text style={[styles.buttonText, { color: theme.colors.buttonLabel }]}>
              {isSyncingProgress ? 'Syncing progress...' : 'Back to form'}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  button: {
    alignItems: 'center',
    borderRadius: 12,
    marginTop: 8,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  playerScreen: {
    flex: 1,
    gap: 16,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  playerScreenHeader: {
    gap: 8,
  },
  playerScreenFrame: {
    flex: 1,
    minHeight: 260,
  },
  playerScreenVideo: {
    flex: 1,
  },
  playerScreenActions: {
    paddingBottom: 8,
  },
  videoTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  videoMeta: {
    fontSize: 13,
    lineHeight: 18,
  },
});

export { PlayerScreen };
