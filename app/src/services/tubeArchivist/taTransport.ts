import { searchRetrieve } from '../../api/search';
import { customAxios, setApiBaseUrl } from '../../api/fetcher';
import type {
  ChannelRetrieve2Response,
  ChannelRetrieveData,
  ChannelRetrieveResponse,
  PingRetrieveResponse,
  PlaylistRetrieve2Response,
  PlaylistRetrieveData,
  PlaylistRetrieveResponse,
  VideoProgressCreateResponse,
  VideoProgressUpdate,
  VideoRetrieve2Response,
  VideoRetrieveData,
  VideoRetrieveResponse,
  WatchedCreateResponse,
  WatchedData,
} from '../../api/generated/types.gen';
import type { TubeArchivistConnection } from './types';

type RequestOptions<TData> = Parameters<typeof customAxios<TData>>[1];

function pingRetrieve(options?: RequestOptions<PingRetrieveResponse>) {
  return customAxios<PingRetrieveResponse>({ method: 'GET', url: '/api/ping/' }, options);
}

function videoRetrieve(
  params?: VideoRetrieveData['query'],
  options?: RequestOptions<VideoRetrieveResponse>,
) {
  return customAxios<VideoRetrieveResponse>({ method: 'GET', params, url: '/api/video/' }, options);
}

function videoRetrieve2(videoId: string, options?: RequestOptions<VideoRetrieve2Response>) {
  return customAxios<VideoRetrieve2Response>(
    { method: 'GET', url: `/api/video/${videoId}/` },
    options,
  );
}

function videoProgressCreate(
  videoId: string,
  videoProgressUpdate?: VideoProgressUpdate,
  options?: RequestOptions<VideoProgressCreateResponse>,
) {
  return customAxios<VideoProgressCreateResponse>(
    {
      data: videoProgressUpdate,
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
      url: `/api/video/${videoId}/progress/`,
    },
    options,
  );
}

function watchedCreate(watchedData: WatchedData, options?: RequestOptions<WatchedCreateResponse>) {
  return customAxios<WatchedCreateResponse>(
    {
      data: watchedData,
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
      url: '/api/watched/',
    },
    options,
  );
}

function channelRetrieve(
  params?: ChannelRetrieveData['query'],
  options?: RequestOptions<ChannelRetrieveResponse>,
) {
  return customAxios<ChannelRetrieveResponse>(
    { method: 'GET', params, url: '/api/channel/' },
    options,
  );
}

function channelRetrieve2(channelId: string, options?: RequestOptions<ChannelRetrieve2Response>) {
  return customAxios<ChannelRetrieve2Response>(
    { method: 'GET', url: `/api/channel/${channelId}/` },
    options,
  );
}

function playlistRetrieve(
  params?: PlaylistRetrieveData['query'],
  options?: RequestOptions<PlaylistRetrieveResponse>,
) {
  return customAxios<PlaylistRetrieveResponse>(
    { method: 'GET', params, url: '/api/playlist/' },
    options,
  );
}

function playlistRetrieve2(
  playlistId: string,
  options?: RequestOptions<PlaylistRetrieve2Response>,
) {
  return customAxios<PlaylistRetrieve2Response>(
    { method: 'GET', url: `/api/playlist/${playlistId}/` },
    options,
  );
}

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
