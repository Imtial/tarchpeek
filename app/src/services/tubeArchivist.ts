import { configureApiBaseUrl } from './tubeArchivist/taTransport';
import { createTubeArchivistClient, useTubeArchivistClient } from './tubeArchivist/taClient';
import type { TubeArchivistConnection } from './tubeArchivist/types';

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

function normalizeConnection(connection: TubeArchivistConnection): TubeArchivistConnection {
  return {
    serverUrl: new URL(connection.serverUrl.trim()).toString(),
    apiToken: connection.apiToken.trim(),
  };
}

async function validateTubeArchivistConnection(connection: TubeArchivistConnection): Promise<void> {
  const normalizedConnection = normalizeConnection(connection);
  const client = createTubeArchivistClient(normalizedConnection);
  configureApiBaseUrl(normalizedConnection.serverUrl);
  await client.validateConnection();
}

export { getVideoId, useTubeArchivistClient, validateTubeArchivistConnection };
export type {
  ChannelDetail,
  ChannelListItem,
  ChannelsPage,
  ContinueWatchingItem,
  ContinueWatchingPage,
  HomeFeedPage,
  PlaylistDetail,
  PlaylistListItem,
  PlaylistsPage,
  PlaylistVideoEntry,
  SearchChannelResult,
  SearchPlaylistResult,
  SearchResultsPage,
  SearchVideoResult,
  TubeArchivistClient,
  TubeArchivistConnection,
  VideoDetails,
} from './tubeArchivist/types';
