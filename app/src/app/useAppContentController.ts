import { useEffect, useState } from 'react';
import { useTubeArchivistClient, type VideoDetails } from '../services/tubeArchivist';
import { loadStoredConnection, saveStoredConnection } from '../storage/connectionStorage';

type FieldName = 'serverUrl' | 'apiToken' | null;

function useAppContentController() {
  const [serverUrl, setServerUrl] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [focusedField, setFocusedField] = useState<FieldName>(null);
  const [isHydrating, setIsHydrating] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Enter a TubeArchivist server and API token.');
  const [videoDetails, setVideoDetails] = useState<VideoDetails | null>(null);
  const [browseRefreshKey, setBrowseRefreshKey] = useState(0);

  const client = useTubeArchivistClient({
    serverUrl,
    apiToken,
  });
  const hasConnection = Boolean(serverUrl && apiToken);

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
      });

      const storedConnection = await loadStoredConnection();
      setServerUrl(storedConnection.serverUrl);
      setApiToken(storedConnection.apiToken);
      setStatusMessage('Saved locally.');
    } catch {
      setStatusMessage('Saving failed. Check local storage availability and try again.');
    } finally {
      setIsSaving(false);
    }
  }

  async function openVideoById(videoId: string) {
    const resolvedVideoDetails = await client.fetchVideoDetails(videoId);
    setVideoDetails(resolvedVideoDetails);
  }

  function closePlayer(result: { resultMessage?: string; shouldRefreshBrowse: boolean }) {
    setVideoDetails(null);
    if (result.shouldRefreshBrowse) {
      setBrowseRefreshKey(current => current + 1);
    }
  }

  return {
    apiToken,
    client,
    closePlayer,
    browseRefreshKey,
    focusedField,
    hasConnection,
    isHydrating,
    isSaving,
    openVideoById,
    serverUrl,
    setApiToken,
    setFocusedField,
    setServerUrl,
    statusMessage,
    saveConnection,
    videoDetails,
  };
}

export { useAppContentController };
