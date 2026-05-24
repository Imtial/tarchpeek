import { useEffect, useState } from 'react';
import {
  useTubeArchivistClient,
  validateTubeArchivistConnection,
  type TubeArchivistConnection,
  type VideoDetails,
} from '../services/tubeArchivist';
import { loadStoredConnection, saveStoredConnection, type StoredConnection } from '../storage/connectionStorage';

type FieldName = 'serverUrl' | 'apiToken' | null;
type PlaybackQueueContext = {
  videoIds: string[];
  currentIndex: number;
};

function useAppContentController() {
  const [serverUrl, setServerUrl] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [activeConnection, setActiveConnection] = useState<TubeArchivistConnection | null>(null);
  const [focusedField, setFocusedField] = useState<FieldName>(null);
  const [isHydrating, setIsHydrating] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Enter a TubeArchivist server and API token.');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [videoDetails, setVideoDetails] = useState<VideoDetails | null>(null);
  const [playbackQueueContext, setPlaybackQueueContext] = useState<PlaybackQueueContext | null>(null);
  const [browseRefreshKey, setBrowseRefreshKey] = useState(0);

  const client = useTubeArchivistClient({
    serverUrl: activeConnection?.serverUrl ?? 'http://localhost',
    apiToken: activeConnection?.apiToken ?? '',
  });
  const hasConnection = Boolean(activeConnection);

  async function activateConnection(connection: StoredConnection) {
    await validateTubeArchivistConnection(connection);
    setActiveConnection(connection);
  }

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

        if (!storedConnection.serverUrl || !storedConnection.apiToken) {
          return;
        }

        setStatusMessage('Checking saved server settings...');

        try {
          await activateConnection(storedConnection);
          if (isMounted) {
            setConnectionError(null);
            setStatusMessage('Connected using saved server settings.');
          }
        } catch (error) {
          if (isMounted) {
            const message = error instanceof Error ? error.message : 'Saved server settings could not connect.';
            setConnectionError(message);
            setStatusMessage(message);
          }
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
      setConnectionError(null);
      setStatusMessage('Server URL and API token are both required.');
      return;
    }

    setIsSaving(true);
    setConnectionError(null);
    setStatusMessage('Checking TubeArchivist connection...');

    try {
      const nextConnection = {
        serverUrl,
        apiToken,
      };
      await validateTubeArchivistConnection(nextConnection);
      await saveStoredConnection(nextConnection);

      const storedConnection = await loadStoredConnection();
      setServerUrl(storedConnection.serverUrl);
      setApiToken(storedConnection.apiToken);
      setActiveConnection(storedConnection);
      setConnectionError(null);
      setStatusMessage('Connection verified and saved locally.');
    } catch (error) {
      setActiveConnection(null);
      const message = error instanceof Error ? error.message : 'Connection check failed.';
      setConnectionError(message);
      setStatusMessage(message);
    } finally {
      setIsSaving(false);
    }
  }

  function updateServerUrl(value: string) {
    setConnectionError(null);
    setServerUrl(value);
  }

  function updateApiToken(value: string) {
    setConnectionError(null);
    setApiToken(value);
  }

  async function openVideoById(videoId: string, queueContext?: PlaybackQueueContext) {
    const resolvedVideoDetails = await client.fetchVideoDetails(videoId);
    setVideoDetails(resolvedVideoDetails);
    if (
      queueContext &&
      queueContext.currentIndex >= 0 &&
      queueContext.currentIndex < queueContext.videoIds.length
    ) {
      setPlaybackQueueContext(queueContext);
      return;
    }
    setPlaybackQueueContext(null);
  }

  async function playNextInQueue() {
    if (!playbackQueueContext) {
      return false;
    }

    const nextIndex = playbackQueueContext.currentIndex + 1;
    if (nextIndex >= playbackQueueContext.videoIds.length) {
      return false;
    }

    const nextVideoId = playbackQueueContext.videoIds[nextIndex];
    const resolvedVideoDetails = await client.fetchVideoDetails(nextVideoId);
    setVideoDetails(resolvedVideoDetails);
    setPlaybackQueueContext({
      ...playbackQueueContext,
      currentIndex: nextIndex,
    });
    return true;
  }

  function closePlayer(result: { resultMessage?: string; shouldRefreshBrowse: boolean }) {
    setVideoDetails(null);
    setPlaybackQueueContext(null);
    if (result.shouldRefreshBrowse) {
      setBrowseRefreshKey(current => current + 1);
    }
  }

  return {
    apiToken,
    client,
    closePlayer,
    browseRefreshKey,
    connectionError,
    focusedField,
    hasConnection,
    isHydrating,
    isSaving,
    openVideoById,
    playNextInQueue,
    serverUrl,
    setApiToken: updateApiToken,
    setFocusedField,
    setServerUrl: updateServerUrl,
    statusMessage,
    saveConnection,
    videoDetails,
  };
}

export { useAppContentController };
