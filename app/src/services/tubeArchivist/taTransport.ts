import {
  channelRetrieve,
  channelRetrieve2,
  pingRetrieve,
  playlistRetrieve,
  playlistRetrieve2,
  videoProgressCreate,
  videoRetrieve,
  videoRetrieve2,
  watchedCreate,
} from '../../api/generated/endpoints/tubearchivist';
import { searchRetrieve } from '../../api/search';
import { setApiBaseUrl } from '../../api/fetcher';
import type { VideoProgressUpdate, WatchedData } from '../../api/generated/models';
import type { TubeArchivistConnection } from './types';

function configureApiBaseUrl(serverUrl: string) {
  setApiBaseUrl(new URL(serverUrl));
}

function createAuthHeaders(apiToken: string) {
  return {
    Authorization: `Token ${apiToken}`,
  };
}

function createTubeArchivistTransport(connection: TubeArchivistConnection) {
  configureApiBaseUrl(connection.serverUrl);

  const authHeaders = createAuthHeaders(connection.apiToken);

  return {
    ping() {
      return pingRetrieve({ headers: authHeaders });
    },
    videoRetrieve(params: Parameters<typeof videoRetrieve>[0]) {
      return videoRetrieve(params, { headers: authHeaders });
    },
    videoRetrieveById(videoId: string) {
      return videoRetrieve2(videoId, { headers: authHeaders });
    },
    postProgress(videoId: string, position: number) {
      const body: VideoProgressUpdate = { position };
      return videoProgressCreate(videoId, body, { headers: authHeaders });
    },
    postWatched(videoId: string, isWatched: boolean) {
      const body: WatchedData = {
        id: videoId,
        is_watched: isWatched,
      };
      return watchedCreate(body, { headers: authHeaders });
    },
    channelRetrieve(params: Parameters<typeof channelRetrieve>[0]) {
      return channelRetrieve(params, { headers: authHeaders });
    },
    channelRetrieveById(channelId: string) {
      return channelRetrieve2(channelId, { headers: authHeaders });
    },
    playlistRetrieve(params: Parameters<typeof playlistRetrieve>[0]) {
      return playlistRetrieve(params, { headers: authHeaders });
    },
    playlistRetrieveById(playlistId: string) {
      return playlistRetrieve2(playlistId, { headers: authHeaders });
    },
    search(query: string) {
      return searchRetrieve(query, { headers: authHeaders });
    },
  };
}

export { configureApiBaseUrl, createAuthHeaders, createTubeArchivistTransport };
