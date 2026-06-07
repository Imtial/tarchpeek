import { useEffect, useState } from 'react';
import {
  useTubeArchivistClient,
  validateTubeArchivistConnection,
  type TubeArchivistConnection,
  type VideoDetails,
} from '../services/tubeArchivist';
import {
  loadStoredConnection,
  saveStoredConnection,
  type StoredConnection,
} from '../storage/connectionStorage';

type FieldName = 'serverUrl' | 'apiToken' | null;
type PlaybackQueueContext = {
  videoIds: string[];
  currentIndex: number;
};
type ConnectionFieldErrors = {
  serverUrl: string | null;
  apiToken: string | null;
};
type DraftConnection = StoredConnection;
type ConnectionState =
  | { status: 'bootstrapping' }
  | { status: 'disconnected'; error: string | null }
  | { status: 'connecting' }
  | { status: 'connected'; connection: TubeArchivistConnection };

function useAppContentController() {
  const [draftConnection, setDraftConnection] = useState<DraftConnection>({
    serverUrl: '',
    apiToken: '',
  });
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: 'bootstrapping',
  });
  const [focusedField, setFocusedField] = useState<FieldName>(null);
  const [connectionFieldErrors, setConnectionFieldErrors] = useState<ConnectionFieldErrors>({
    serverUrl: null,
    apiToken: null,
  });
  const [videoDetails, setVideoDetails] = useState<VideoDetails | null>(null);
  const [playbackQueueContext, setPlaybackQueueContext] = useState<PlaybackQueueContext | null>(
    null,
  );
  const [browseRefreshKey, setBrowseRefreshKey] = useState(0);
  const activeConnection =
    connectionState.status === 'connected' ? connectionState.connection : null;
  const connectionError = connectionState.status === 'disconnected' ? connectionState.error : null;
  const isHydrating = connectionState.status === 'bootstrapping';
  const isSaving = connectionState.status === 'connecting';

  const client = useTubeArchivistClient({
    serverUrl: activeConnection?.serverUrl ?? 'http://localhost',
    apiToken: activeConnection?.apiToken ?? '',
  });
  const hasConnection = connectionState.status === 'connected';

  useEffect(() => {
    let isMounted = true;

    async function hydrateConnection() {
      try {
        const storedConnection = await loadStoredConnection();

        if (!isMounted) {
          return;
        }

        setDraftConnection(storedConnection);

        if (!storedConnection.serverUrl || !storedConnection.apiToken) {
          setConnectionState({ status: 'disconnected', error: null });
          return;
        }

        try {
          await validateTubeArchivistConnection(storedConnection);
          if (isMounted) {
            setConnectionState({
              status: 'connected',
              connection: storedConnection,
            });
            setConnectionFieldErrors({
              serverUrl: null,
              apiToken: null,
            });
          }
        } catch (error) {
          if (isMounted) {
            const message =
              error instanceof Error ? error.message : 'Saved server settings could not connect.';
            setConnectionState({ status: 'disconnected', error: message });
          }
        }
      } catch {
        if (isMounted) {
          setConnectionState({
            status: 'disconnected',
            error: 'Saved server settings could not be loaded.',
          });
        }
      }
    }

    void hydrateConnection();

    return () => {
      isMounted = false;
    };
  }, []);

  async function saveConnection() {
    const trimmedServerUrl = draftConnection.serverUrl.trim();
    const trimmedApiToken = draftConnection.apiToken.trim();
    const nextFieldErrors: ConnectionFieldErrors = {
      serverUrl: trimmedServerUrl ? null : 'Server URL is required.',
      apiToken: trimmedApiToken ? null : 'API token is required.',
    };

    if (nextFieldErrors.serverUrl || nextFieldErrors.apiToken) {
      setConnectionFieldErrors(nextFieldErrors);
      setConnectionState({ status: 'disconnected', error: null });
      return;
    }

    setConnectionState({ status: 'connecting' });
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
      setDraftConnection(nextConnection);
      setConnectionState({
        status: 'connected',
        connection: nextConnection,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Connection check failed.';
      setConnectionState({ status: 'disconnected', error: message });
    }
  }

  function updateServerUrl(value: string) {
    if (connectionState.status === 'disconnected' && connectionState.error) {
      setConnectionState({ status: 'disconnected', error: null });
    }
    setConnectionFieldErrors(currentErrors => ({
      ...currentErrors,
      serverUrl: value.trim() ? null : currentErrors.serverUrl,
    }));
    setDraftConnection(currentConnection => ({
      ...currentConnection,
      serverUrl: value,
    }));
  }

  function updateApiToken(value: string) {
    if (connectionState.status === 'disconnected' && connectionState.error) {
      setConnectionState({ status: 'disconnected', error: null });
    }
    setConnectionFieldErrors(currentErrors => ({
      ...currentErrors,
      apiToken: value.trim() ? null : currentErrors.apiToken,
    }));
    setDraftConnection(currentConnection => ({
      ...currentConnection,
      apiToken: value,
    }));
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
    apiToken: draftConnection.apiToken,
    client,
    closePlayer,
    browseRefreshKey,
    connectionError,
    connectionStatus: connectionState.status,
    focusedField,
    hasConnection,
    isHydrating,
    isSaving,
    openVideoById,
    playNextInQueue,
    serverUrl: draftConnection.serverUrl,
    setApiToken: updateApiToken,
    setFocusedField,
    setServerUrl: updateServerUrl,
    saveConnection,
    connectionFieldErrors,
    videoDetails,
  };
}

export { useAppContentController };
