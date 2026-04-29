import { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useEvent, useVideoPlayer, VideoView } from 'react-native-video';
import { ThemeProvider, useTheme } from './src/design/ThemeProvider';
import { ConnectScreen } from './src/screens/ConnectScreen';
import {
  getVideoId,
  useTubeArchivistClient,
  type TubeArchivistClient,
  type VideoDetails,
} from './src/services/tubeArchivist';
import { loadStoredConnection, saveStoredConnection } from './src/storage/connectionStorage';

const PROGRESS_SYNC_INTERVAL_SECONDS = 5;
const PROGRESS_SYNC_MIN_DELTA_SECONDS = 5;

type FieldName = 'serverUrl' | 'apiToken' | 'testVideo' | null;


function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ThemedApp />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function ThemedApp() {
  const { theme } = useTheme();

  return (
    <>
      <StatusBar barStyle={theme.statusBarStyle} />
      <AppContent />
    </>
  );
}

function AppContent() {
  const [serverUrl, setServerUrl] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [testVideoInput, setTestVideoInput] = useState('');
  const [focusedField, setFocusedField] = useState<FieldName>(null);
  const [isHydrating, setIsHydrating] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Enter a TubeArchivist server and API token.');
  const [playbackStatus, setPlaybackStatus] = useState('No playback attempted yet.');
  const [videoDetails, setVideoDetails] = useState<VideoDetails | null>(null);
  const client = useTubeArchivistClient({
    serverUrl,
    apiToken,
  });

  useEffect(() => {
    let isMounted = true;

    async function hydrateConnection() {
      try {
        const storedConnection = await loadStoredConnection();

        if (!isMounted) {
          return;
        }

        if (storedConnection.serverUrl) {
          setServerUrl(storedConnection.serverUrl);
        }

        if (storedConnection.apiToken) {
          setApiToken(storedConnection.apiToken);
        }

        if (storedConnection.testVideoInput) {
          setTestVideoInput(storedConnection.testVideoInput);
        }

        if (storedConnection.serverUrl || storedConnection.apiToken) {
          setStatusMessage('Loaded saved server settings for this device.');
        }
      } catch {
        if (isMounted) {
          setStatusMessage('Could not load saved settings on this device.');
        }
      } finally {
        if (isMounted) {
          setIsHydrating(false);
        }
      }
    }

    hydrateConnection();

    return () => {
      isMounted = false;
    };
  }, []);

  async function saveConnection() {
    if (!serverUrl || !apiToken) {
      setStatusMessage('Server URL and API token are both required.');
      return;
    }

    setIsSaving(true);
    setStatusMessage('Saving connection...');

    try {
      await saveStoredConnection({
        serverUrl,
        apiToken,
        testVideoInput,
      });

      const storedConnection = await loadStoredConnection();
      setServerUrl(storedConnection.serverUrl);
      setApiToken(storedConnection.apiToken);
      setTestVideoInput(storedConnection.testVideoInput);
      setStatusMessage('Saved locally. Playback validation can use this connection next.');
    } catch {
      setStatusMessage('Saving failed. Check local storage availability and try again.');
    } finally {
      setIsSaving(false);
    }
  }

  async function loadTestVideo() {
    const videoId = getVideoId(testVideoInput);

    if (!serverUrl || !apiToken) {
      setStatusMessage('Save a server URL and API token before loading a test video.');
      return;
    }

    if (!videoId) {
      setPlaybackStatus('Enter a TubeArchivist video URL or a bare video id.');
      return;
    }

    setIsLoadingVideo(true);
    setPlaybackStatus('Fetching video metadata...');

    try {
      const resolvedVideoDetails = await client.fetchVideoDetails(videoId);

      setVideoDetails(resolvedVideoDetails);
      setPlaybackStatus(
        resolvedVideoDetails.resumePositionSeconds > 0
          ? `Metadata loaded. Resume point found at ${resolvedVideoDetails.resumePositionSeconds}s. Opening player...`
          : 'Metadata loaded. No resume point found. Opening player...',
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown video load error';
      setVideoDetails(null);
      setPlaybackStatus(`Video load failed: ${errorMessage}`);
    } finally {
      setIsLoadingVideo(false);
    }
  }

  function closePlayer(resultMessage?: string) {
    setVideoDetails(null);
    setPlaybackStatus(resultMessage ?? 'No playback attempted yet.');
  }

  if (videoDetails) {
    return (
      <PlayerScreen
        client={client}
        key={videoDetails.videoId}
        onBack={closePlayer}
        videoDetails={videoDetails}
      />
    );
  }

  return (
    <ConnectScreen
      apiToken={apiToken}
      focusedField={focusedField}
      isHydrating={isHydrating}
      isLoadingVideo={isLoadingVideo}
      isSaving={isSaving}
      onApiTokenChange={setApiToken}
      onBlurField={field => {
        setFocusedField(currentField => (currentField === field ? null : currentField));
      }}
      onFocusField={setFocusedField}
      onLoadTestVideo={loadTestVideo}
      onSaveConnection={saveConnection}
      onServerUrlChange={setServerUrl}
      onTestVideoInputChange={setTestVideoInput}
      playbackStatus={playbackStatus}
      serverUrl={serverUrl}
      statusMessage={statusMessage}
      testVideoInput={testVideoInput}
    />
  );
}

function PlayerScreen({
  client,
  onBack,
  videoDetails,
}: {
  client: TubeArchivistClient;
  onBack: (resultMessage?: string) => void;
  videoDetails: VideoDetails;
}) {
  const { theme } = useTheme();
  const initialResumeSeconds = Math.max(0, Math.floor(videoDetails.resumePositionSeconds));
  const [playbackTime, setPlaybackTime] = useState(initialResumeSeconds);
  const [duration, setDuration] = useState(videoDetails.duration ?? 0);
  const [playbackStatus, setPlaybackStatus] = useState('Preparing player...');
  const [isSyncingProgress, setIsSyncingProgress] = useState(false);
  const latestPlaybackTimeRef = useRef(0);
  const lastSyncedProgressRef = useRef(0);
  const isProgressSyncInFlightRef = useRef(false);

  const player = useVideoPlayer(
    videoDetails.source,
    currentPlayer => {
      currentPlayer.muted = false;
      currentPlayer.volume = 1;
      currentPlayer.loop = false;

      if (initialResumeSeconds > 3) {
        currentPlayer.currentTime = initialResumeSeconds;
        latestPlaybackTimeRef.current = initialResumeSeconds;
        lastSyncedProgressRef.current = initialResumeSeconds;
      }

      currentPlayer.play();
    },
  );

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
    const nextStateLabel = data.isBuffering
      ? 'buffering'
      : data.isPlaying
        ? 'playing'
        : 'paused';
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
          <Text style={[styles.videoTitle, { color: theme.colors.textPrimary }]}>
            {videoDetails.title}
          </Text>
          <Text style={[styles.videoMeta, { color: theme.colors.textSecondary }]}>
            {`Progress: ${Math.round(playbackTime)}s${duration ? ` / ${Math.round(duration)}s` : ''}`}
          </Text>
          <Text style={[styles.videoMeta, { color: theme.colors.textSecondary }]}>
            {playbackStatus}
          </Text>
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

export default App;
