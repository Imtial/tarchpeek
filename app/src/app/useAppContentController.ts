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
type ConnectionFieldErrors = {
  serverUrl: string | null;
  apiToken: string | null;
};

function useAppContentController() {
  const [serverUrl, setServerUrl] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [activeConnection, setActiveConnection] = useState<TubeArchivistConnection | null>(null);
  const [focusedField, setFocusedField] = useState<FieldName>(null);
  const [isHydrating, setIsHydrating] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [connectionFieldErrors, setConnectionFieldErrors] = useState<ConnectionFieldErrors>({
    serverUrl: null,
    apiToken: null,
  });
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

        try {
          await activateConnection(storedConnection);
          if (isMounted) {
            setConnectionError(null);
            setConnectionFieldErrors({
              serverUrl: null,
              apiToken: null,
            });
          }
        } catch (error) {
          if (isMounted) {
            const message = error instanceof Error ? error.message : 'Saved server settings could not connect.';
            setConnectionError(message);
          }
        }
      } catch {
        return;
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
    const trimmedApiToken = apiToken.trim();
    const nextFieldErrors: ConnectionFieldErrors = {
      serverUrl: trimmedServerUrl ? null : 'Server URL is required.',
      apiToken: trimmedApiToken ? null : 'API token is required.',
    };

    if (nextFieldErrors.serverUrl || nextFieldErrors.apiToken) {
      setConnectionFieldErrors(nextFieldErrors);
      setConnectionError(null);
      return;
    }

    setIsSaving(true);
    setConnectionError(null);
    setConnectionFieldErrors({
      serverUrl: null,
      apiToken: null,
    });

    try {
      const nextConnection = {
        serverUrl: trimmedServerUrl,
        apiToken: trimmedApiToken,
      };
      await validateTubeArchivistConnection(nextConnection);
      await saveStoredConnection(nextConnection);

      const storedConnection = await loadStoredConnection();
      setServerUrl(storedConnection.serverUrl);
      setApiToken(storedConnection.apiToken);
      setActiveConnection(storedConnection);
      setConnectionError(null);
    } catch (error) {
      setActiveConnection(null);
      const message = error instanceof Error ? error.message : 'Connection check failed.';
      setConnectionError(message);
    } finally {
      setIsSaving(false);
    }
  }

  function updateServerUrl(value: string) {
    setConnectionError(null);
    setConnectionFieldErrors(currentErrors => ({
      ...currentErrors,
      serverUrl: value.trim() ? null : currentErrors.serverUrl,
    }));
    setServerUrl(value);
  }

  function updateApiToken(value: string) {
    setConnectionError(null);
    setConnectionFieldErrors(currentErrors => ({
      ...currentErrors,
      apiToken: value.trim() ? null : currentErrors.apiToken,
    }));
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
    saveConnection,
    connectionFieldErrors,
    videoDetails,
  };
}

export { useAppContentController };
