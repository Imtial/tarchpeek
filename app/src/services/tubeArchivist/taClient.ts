import { useMemo } from 'react';
import type { SearchResultsPage, TubeArchivistClient, TubeArchivistConnection } from './types';
import { createTubeArchivistTransport } from './taTransport';
import {
  mapChannelDetail,
  mapChannelListItem,
  mapPlaylistDetail,
  mapPlaylistEntry,
  mapPlaylistListItem,
  mapSearchChannelResult,
  mapSearchPlaylistResult,
  mapVideoDetails,
  mapVideoToContinueWatchingItem,
} from './taMappers';

function createTubeArchivistClient(connection: TubeArchivistConnection): TubeArchivistClient {
  const transport = createTubeArchivistTransport(connection);

  async function fetchVideoDetails(videoId: string) {
    const response = await transport.videoRetrieveById(videoId);
    return mapVideoDetails(videoId, response.data, connection.serverUrl, connection.apiToken);
  }

  async function fetchContinueWatching(page = 1) {
    const response = await transport.videoRetrieve({ page, watch: 'continue' });
    return {
      items: response.data.data.map(video =>
        mapVideoToContinueWatchingItem(video, connection.serverUrl),
      ),
      currentPage: response.data.paginate.current_page,
      hasNextPage: Boolean(response.data.paginate.next_pages?.length),
    };
  }

  async function fetchHomeFeed(page = 1) {
    const [continueResponse, recentResponse, unwatchedResponse] = await Promise.all([
      transport.videoRetrieve({ page, type: 'videos', watch: 'continue' }),
      transport.videoRetrieve({ page, type: 'videos', sort: 'downloaded', order: 'desc' }),
      transport.videoRetrieve({
        page,
        type: 'videos',
        watch: 'unwatched',
        sort: 'published',
        order: 'desc',
      }),
    ]);

    const merged = [
      ...continueResponse.data.data,
      ...recentResponse.data.data,
      ...unwatchedResponse.data.data,
    ];
    const seenVideoIds = new Set<string>();
    const uniqueItems = merged.filter(video => {
      if (seenVideoIds.has(video.youtube_id)) {
        return false;
      }
      seenVideoIds.add(video.youtube_id);
      return true;
    });

    return {
      items: uniqueItems
        .slice(0, 20)
        .map(video => mapVideoToContinueWatchingItem(video, connection.serverUrl)),
      currentPage: page,
      hasNextPage:
        Boolean(continueResponse.data.paginate.next_pages?.length) ||
        Boolean(recentResponse.data.paginate.next_pages?.length) ||
        Boolean(unwatchedResponse.data.paginate.next_pages?.length) ||
        uniqueItems.length > 20,
    };
  }

  async function fetchChannels(page = 1) {
    const response = await transport.channelRetrieve({ page });
    return {
      items: response.data.data.map(channel => mapChannelListItem(channel, connection.serverUrl)),
      currentPage: response.data.paginate.current_page,
      hasNextPage: Boolean(response.data.paginate.next_pages?.length),
    };
  }

  async function fetchChannelDetail(channelId: string) {
    const response = await transport.channelRetrieveById(channelId);
    return mapChannelDetail(response.data, connection.serverUrl);
  }

  async function fetchChannelVideos(channelId: string, page = 1) {
    const response = await transport.videoRetrieve({
      page,
      channel: channelId,
      type: 'videos',
      sort: 'published',
      order: 'desc',
    });
    return {
      items: response.data.data.map(video =>
        mapVideoToContinueWatchingItem(video, connection.serverUrl),
      ),
      currentPage: response.data.paginate.current_page,
      hasNextPage: Boolean(response.data.paginate.next_pages?.length),
    };
  }

  async function fetchPlaylists(page = 1) {
    const response = await transport.playlistRetrieve({ page });
    return {
      items: response.data.data.map(playlist =>
        mapPlaylistListItem(playlist, connection.serverUrl),
      ),
      currentPage: response.data.paginate.current_page,
      hasNextPage: Boolean(response.data.paginate.next_pages?.length),
    };
  }

  async function fetchPlaylistDetail(playlistId: string) {
    const response = await transport.playlistRetrieveById(playlistId);
    const channelResponse = await transport.channelRetrieveById(response.data.playlist_channel_id);
    const entries = await Promise.all(
      response.data.playlist_entries.map(async entry => {
        const entryVideo = await transport.videoRetrieveById(entry.youtube_id);
        return mapPlaylistEntry({
          entry,
          video: entryVideo.data,
          fallbackChannelName: response.data.playlist_channel,
          serverUrl: connection.serverUrl,
        });
      }),
    );

    return mapPlaylistDetail({
      playlist: response.data,
      channelThumbUrl: channelResponse.data.channel_thumb_url ?? null,
      entries,
      serverUrl: connection.serverUrl,
    });
  }

  async function searchArchive(query: string): Promise<SearchResultsPage> {
    const response = await transport.search(query);
    const hydratedSearchVideos = await Promise.all(
      response.data.results.video_results.map(async video => {
        try {
          const detailResponse = await transport.videoRetrieveById(video.youtube_id);
          return mapVideoToContinueWatchingItem(detailResponse.data, connection.serverUrl);
        } catch {
          return mapVideoToContinueWatchingItem(video, connection.serverUrl);
        }
      }),
    );

    return {
      queryType: response.data.queryType,
      videoResults: hydratedSearchVideos,
      channelResults: response.data.results.channel_results.map(channel =>
        mapSearchChannelResult(channel, connection.serverUrl),
      ),
      playlistResults: response.data.results.playlist_results.map(playlist =>
        mapSearchPlaylistResult(playlist, connection.serverUrl),
      ),
      fulltextResults: response.data.results.fulltext_results,
    };
  }

  return {
    async validateConnection() {
      const response = await transport.ping();
      if (response.status >= 200 && response.status < 300) {
        return;
      }
      if (response.status === 401 || response.status === 403) {
        throw new Error('TubeArchivist rejected the API token.');
      }
      throw new Error(`TubeArchivist connection check failed with HTTP ${response.status}.`);
    },
    fetchVideoDetails,
    fetchContinueWatching,
    fetchHomeFeed,
    fetchChannels,
    fetchChannelDetail,
    fetchChannelVideos,
    fetchPlaylists,
    fetchPlaylistDetail,
    searchArchive,
    async postProgressCheckpoint(videoId: string, position: number) {
      await transport.postProgress(videoId, position);
    },
    async setWatchedState(videoId: string, isWatched: boolean) {
      await transport.postWatched(videoId, isWatched);
    },
  };
}

function useTubeArchivistClient(connection: TubeArchivistConnection): TubeArchivistClient {
  return useMemo(() => createTubeArchivistClient(connection), [connection]);
}

export { createTubeArchivistClient, useTubeArchivistClient };
