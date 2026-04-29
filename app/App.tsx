import { createAsyncStorage } from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useEvent, useVideoPlayer, VideoView } from 'react-native-video';

const SERVER_URL_KEY = 'serverUrl';
const API_TOKEN_KEY = 'apiToken';
const VIDEO_INPUT_KEY = 'testVideoInput';

const storage = createAsyncStorage('tarchpeek');
const PROGRESS_SYNC_INTERVAL_SECONDS = 5;
const PROGRESS_SYNC_MIN_DELTA_SECONDS = 5;

type FieldName = 'serverUrl' | 'apiToken' | 'testVideo' | null;

type VideoDetails = {
  videoId: string;
  serverUrl: string;
  apiToken: string;
  resumePositionSeconds: number;
  title: string;
  duration?: number;
  source: {
    uri: number | string;
    headers?: Record<string, string>;
  };
};

function buildUrl(baseUrl: string, path: string) {
  return new URL(path, baseUrl).toString();
}

function getNumericValueOrNull(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value.trim());
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function convertProgressToSeconds(value: number, durationSeconds: number) {
  if (value <= 0) {
    return 0;
  }

  if (durationSeconds <= 0) {
    return value;
  }

  if (value <= 1) {
    return value * durationSeconds;
  }

  if (value <= 100) {
    return (value / 100) * durationSeconds;
  }

  return value;
}

function getProgressSecondsFromObject(payload: unknown, durationSeconds: number): number | null {
  if (Array.isArray(payload)) {
    for (const entry of payload) {
      const resolved = getProgressSecondsFromObject(entry, durationSeconds);
      if (resolved != null) {
        return resolved;
      }
    }

    return null;
  }

  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const candidate = payload as Record<string, unknown>;
  const directSeconds =
    getNumericValueOrNull(candidate.position) ??
    getNumericValueOrNull(candidate.current_time) ??
    getNumericValueOrNull(candidate.currentTime) ??
    getNumericValueOrNull(candidate.watched);

  if (directSeconds != null) {
    return directSeconds;
  }

  const progressValue = getNumericValueOrNull(candidate.progress);
  if (progressValue != null) {
    return convertProgressToSeconds(progressValue, durationSeconds);
  }

  const nestedPlayerValue = getProgressSecondsFromObject(candidate.player, durationSeconds);
  if (nestedPlayerValue != null) {
    return nestedPlayerValue;
  }

  return null;
}

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const isDarkMode = useColorScheme() === 'dark';
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

  useEffect(() => {
    let isMounted = true;

    async function hydrateConnection() {
      try {
        const [storedServerUrl, storedApiToken, storedVideoInput] = await Promise.all([
          storage.getItem(SERVER_URL_KEY),
          storage.getItem(API_TOKEN_KEY),
          storage.getItem(VIDEO_INPUT_KEY),
        ]);

        if (!isMounted) {
          return;
        }

        if (storedServerUrl) {
          setServerUrl(storedServerUrl);
        }

        if (storedApiToken) {
          setApiToken(storedApiToken);
        }

        if (storedVideoInput) {
          setTestVideoInput(storedVideoInput);
        }

        if (storedServerUrl || storedApiToken) {
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
    const trimmedServerUrl = serverUrl.trim();
    const normalizedApiToken = apiToken.trim();
    const normalizedVideoInput = testVideoInput.trim();

    if (!trimmedServerUrl || !normalizedApiToken) {
      setStatusMessage('Server URL and API token are both required.');
      return;
    }

    setIsSaving(true);
    setStatusMessage('Saving connection...');

    try {
      const normalizedServerUrl = new URL(trimmedServerUrl).toString();

      await Promise.all([
        storage.setItem(SERVER_URL_KEY, normalizedServerUrl),
        storage.setItem(API_TOKEN_KEY, normalizedApiToken),
        storage.setItem(VIDEO_INPUT_KEY, normalizedVideoInput),
      ]);
      setServerUrl(normalizedServerUrl);
      setApiToken(normalizedApiToken);
      setTestVideoInput(normalizedVideoInput);
      setStatusMessage('Saved locally. Playback validation can use this connection next.');
    } catch {
      setStatusMessage('Saving failed. Check local storage availability and try again.');
    } finally {
      setIsSaving(false);
    }
  }

  function getVideoId(input: string) {
    const normalizedInput = input.trim();

    if (!normalizedInput) {
      return null;
    }

    const videoMatch = normalizedInput.match(/\/video\/([A-Za-z0-9_-]+)/);
    if (videoMatch?.[1]) {
      return videoMatch[1];
    }

    const bareIdMatch = normalizedInput.match(/^[A-Za-z0-9_-]{8,}$/);
    return bareIdMatch ? normalizedInput : null;
  }

  async function loadTestVideo() {
    const trimmedServerUrl = serverUrl.trim();
    const normalizedApiToken = apiToken.trim();
    const videoId = getVideoId(testVideoInput);

    if (!trimmedServerUrl || !normalizedApiToken) {
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
      const normalizedServerUrl = new URL(trimmedServerUrl).toString();
      const response = await fetch(buildUrl(normalizedServerUrl, `/api/video/${videoId}/`), {
        headers: {
          Authorization: `Token ${normalizedApiToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Video API returned ${response.status}`);
      }

      const payload = (await response.json()) as {
        media_url?: string;
        player?: {
          duration?: number;
          position?: number;
          current_time?: number;
          currentTime?: number;
          progress?: number;
          watched?: number;
        };
        title?: string;
      };

      if (!payload.media_url) {
        throw new Error('Video payload did not include media_url');
      }

      const resolvedMediaUrl = new URL(payload.media_url, normalizedServerUrl).toString();
      const durationSeconds = Math.max(0, Math.floor(payload.player?.duration ?? 0));

      const resumePositionSeconds = Math.max(
        0,
        Math.floor(
          getProgressSecondsFromObject(payload.player, durationSeconds) ?? 0,
        ),
      );

      setVideoDetails({
        videoId,
        serverUrl: normalizedServerUrl,
        apiToken: normalizedApiToken,
        resumePositionSeconds,
        title: payload.title ?? videoId,
        duration: payload.player?.duration,
        source: {
          uri: resolvedMediaUrl,
          headers: {
            Authorization: `Token ${normalizedApiToken}`,
          },
        },
      });
      setPlaybackStatus(
        resumePositionSeconds > 0
          ? `Metadata loaded. Resume point found at ${resumePositionSeconds}s. Opening player...`
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
        key={videoDetails.videoId}
        isDarkMode={isDarkMode}
        onBack={closePlayer}
        videoDetails={videoDetails}
      />
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.container,
        isDarkMode ? styles.containerDark : styles.containerLight,
      ]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text
          style={[
            styles.eyebrow,
            isDarkMode ? styles.textMutedDark : styles.textMutedLight,
          ]}>
          Phase 01 - Feasibility Spike
        </Text>
        <Text style={[styles.title, isDarkMode ? styles.textDark : styles.textLight]}>
          TarchPeek
        </Text>
        <Text
          style={[
            styles.body,
            styles.bodySpacing,
            isDarkMode ? styles.textMutedDark : styles.textMutedLight,
          ]}>
          Minimal Android and Android TV shell ready for TubeArchivist connection and playback experiments.
        </Text>
        <View style={[styles.card, isDarkMode ? styles.cardDark : styles.cardLight]}>
          <Text style={[styles.label, isDarkMode ? styles.textDark : styles.textLight]}>
            Server URL
          </Text>
          <TextInput
            autoCapitalize="none"
            autoFocus
            autoCorrect={false}
            editable={!isSaving}
            focusable
            hasTVPreferredFocus={isHydrating}
            keyboardType="url"
            onBlur={() => {
              setFocusedField(currentField =>
                currentField === 'serverUrl' ? null : currentField,
              );
            }}
            onChangeText={setServerUrl}
            onFocus={() => {
              setFocusedField('serverUrl');
            }}
            placeholder="https://archive.local"
            placeholderTextColor={isDarkMode ? '#64748b' : '#94a3b8'}
            returnKeyType="next"
            selectTextOnFocus
            style={[
              styles.input,
              focusedField === 'serverUrl' ? styles.inputFocused : null,
              isDarkMode ? styles.inputDark : styles.inputLight,
              isDarkMode ? styles.textDark : styles.textLight,
            ]}
            value={serverUrl}
          />
          <Text style={[styles.label, isDarkMode ? styles.textDark : styles.textLight]}>
            API token
          </Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isSaving}
            focusable
            onBlur={() => {
              setFocusedField(currentField =>
                currentField === 'apiToken' ? null : currentField,
              );
            }}
            onChangeText={setApiToken}
            onFocus={() => {
              setFocusedField('apiToken');
            }}
            placeholder="Paste API token"
            placeholderTextColor={isDarkMode ? '#64748b' : '#94a3b8'}
            returnKeyType="done"
            secureTextEntry
            selectTextOnFocus
            style={[
              styles.input,
              focusedField === 'apiToken' ? styles.inputFocused : null,
              isDarkMode ? styles.inputDark : styles.inputLight,
              isDarkMode ? styles.textDark : styles.textLight,
            ]}
            value={apiToken}
          />
          <Text style={[styles.label, isDarkMode ? styles.textDark : styles.textLight]}>
            Test video URL or id
          </Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoadingVideo && !isSaving}
            focusable
            onBlur={() => {
              setFocusedField(currentField =>
                currentField === 'testVideo' ? null : currentField,
              );
            }}
            onChangeText={setTestVideoInput}
            onFocus={() => {
              setFocusedField('testVideo');
            }}
            placeholder="https://tube.example.com/video/abc123"
            placeholderTextColor={isDarkMode ? '#64748b' : '#94a3b8'}
            returnKeyType="done"
            selectTextOnFocus
            style={[
              styles.input,
              focusedField === 'testVideo' ? styles.inputFocused : null,
              isDarkMode ? styles.inputDark : styles.inputLight,
              isDarkMode ? styles.textDark : styles.textLight,
            ]}
            value={testVideoInput}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ busy: isSaving, disabled: isSaving }}
            disabled={isSaving}
            focusable
            onPress={saveConnection}
            style={({ pressed }) => [
              styles.button,
              isSaving ? styles.buttonDisabled : styles.buttonEnabled,
              pressed && !isSaving ? styles.buttonPressed : null,
            ]}>
            {isSaving ? (
              <ActivityIndicator color="#e2e8f0" />
            ) : (
              <Text style={styles.buttonText}>Save connection</Text>
            )}
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ busy: isLoadingVideo, disabled: isLoadingVideo || isSaving }}
            disabled={isLoadingVideo || isSaving}
            focusable
            onPress={loadTestVideo}
            style={({ pressed }) => [
              styles.button,
              isLoadingVideo || isSaving ? styles.buttonDisabled : styles.buttonSecondary,
              pressed && !isLoadingVideo && !isSaving ? styles.buttonPressed : null,
            ]}>
            {isLoadingVideo ? (
              <ActivityIndicator color="#e2e8f0" />
            ) : (
              <Text style={styles.buttonText}>Load test video</Text>
            )}
          </Pressable>
          <Text
            style={[
              styles.status,
              isDarkMode ? styles.textMutedDark : styles.textMutedLight,
            ]}>
            {statusMessage}
          </Text>
          <Text
            style={[
              styles.status,
              isDarkMode ? styles.textMutedDark : styles.textMutedLight,
            ]}>
            {playbackStatus}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function PlayerScreen({
  isDarkMode,
  onBack,
  videoDetails,
}: {
  isDarkMode: boolean;
  onBack: (resultMessage?: string) => void;
  videoDetails: VideoDetails;
}) {
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
      const response = await fetch(
        buildUrl(videoDetails.serverUrl, `/api/video/${videoDetails.videoId}/progress/`),
        {
          method: 'POST',
          headers: {
            Authorization: `Token ${videoDetails.apiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            position: playbackSeconds,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`Progress endpoint returned ${response.status}`);
      }

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
    <SafeAreaView
      style={[
        styles.container,
        isDarkMode ? styles.containerDark : styles.containerLight,
      ]}>
      <View style={styles.playerScreen}>
        <View style={styles.playerScreenHeader}>
          <Text style={[styles.videoTitle, isDarkMode ? styles.textDark : styles.textLight]}>
            {videoDetails.title}
          </Text>
          <Text style={[styles.videoMeta, isDarkMode ? styles.textMutedDark : styles.textMutedLight]}>
            {`Progress: ${Math.round(playbackTime)}s${duration ? ` / ${Math.round(duration)}s` : ''}`}
          </Text>
          <Text style={[styles.videoMeta, isDarkMode ? styles.textMutedDark : styles.textMutedLight]}>
            {playbackStatus}
          </Text>
        </View>
        <View style={styles.playerScreenFrame}>
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
              isSyncingProgress ? styles.buttonDisabled : styles.buttonEnabled,
              pressed && !isSyncingProgress ? styles.buttonPressed : null,
            ]}>
            <Text style={styles.buttonText}>
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
  containerLight: {
    backgroundColor: '#f5f7fb',
  },
  containerDark: {
    backgroundColor: '#0f172a',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  eyebrow: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 40,
    fontWeight: '700',
    marginBottom: 16,
  },
  body: {
    fontSize: 18,
    lineHeight: 28,
    maxWidth: 480,
  },
  bodySpacing: {
    marginBottom: 24,
  },
  card: {
    borderRadius: 20,
    gap: 10,
    maxWidth: 520,
    padding: 20,
  },
  cardLight: {
    backgroundColor: '#ffffff',
  },
  cardDark: {
    backgroundColor: '#111827',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputLight: {
    backgroundColor: '#f8fafc',
    borderColor: '#cbd5e1',
  },
  inputDark: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  inputFocused: {
    borderColor: '#2563eb',
    borderWidth: 2,
  },
  button: {
    alignItems: 'center',
    borderRadius: 12,
    marginTop: 8,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  buttonEnabled: {
    backgroundColor: '#2563eb',
  },
  buttonDisabled: {
    backgroundColor: '#64748b',
  },
  buttonSecondary: {
    backgroundColor: '#0f766e',
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonText: {
    color: '#e2e8f0',
    fontSize: 16,
    fontWeight: '700',
  },
  status: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
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
    backgroundColor: '#020617',
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
  textLight: {
    color: '#0f172a',
  },
  textDark: {
    color: '#e2e8f0',
  },
  textMutedLight: {
    color: '#475569',
  },
  textMutedDark: {
    color: '#94a3b8',
  },
});

export default App;
