import { useEffect, useState } from 'react';
import {
  StatusBar,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/design/ThemeProvider';
import { ConnectScreen } from './src/screens/ConnectScreen';
import { PlayerScreen } from './src/screens/PlayerScreen';
import {
  getVideoId,
  useTubeArchivistClient,
  type VideoDetails,
} from './src/services/tubeArchivist';
import { loadStoredConnection, saveStoredConnection } from './src/storage/connectionStorage';

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

export default App;
