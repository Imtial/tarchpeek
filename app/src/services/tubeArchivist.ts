import { useMemo } from 'react';
import {
  channelRetrieve,
  channelRetrieve2,
  playlistRetrieve,
  playlistRetrieve2,
  videoRetrieve,
  videoProgressCreate,
  videoRetrieve2,
  watchedCreate,
} from '../api/generated/endpoints/tubearchivist';
import { searchRetrieve } from '../api/search';
import { setApiBaseUrl } from '../api/fetcher';
import type { Video, VideoProgressUpdate, WatchedData } from '../api/generated/models';
import type { SearchFulltextResult, SearchQueryType } from '../api/search';

type VideoSource = {
  uri: number | string;
  headers?: Record<string, string>;
};

type VideoDetails = {
  videoId: string;
  resumePositionSeconds: number;
  title: string;
  duration?: number;
  durationLabel: string;
  viewCount: number;
  channelName: string;
  channelLogoUrl: string | null;
  watched: boolean;
  published: string;
  dateDownloaded: number;
  description: string;
  source: VideoSource;
};

type TubeArchivistConnection = {
  serverUrl: string;
  apiToken: string;
};

type TubeArchivistClient = {
  fetchVideoDetails: (videoId: string) => Promise<VideoDetails>;
  fetchContinueWatching: (page?: number) => Promise<ContinueWatchingPage>;
  fetchHomeFeed: (page?: number) => Promise<HomeFeedPage>;
  fetchChannels: (page?: number) => Promise<ChannelsPage>;
  fetchChannelDetail: (channelId: string) => Promise<ChannelDetail>;
  fetchPlaylists: (page?: number) => Promise<PlaylistsPage>;
  fetchPlaylistDetail: (playlistId: string) => Promise<PlaylistDetail>;
  searchArchive: (query: string) => Promise<SearchResultsPage>;
  postProgressCheckpoint: (videoId: string, position: number) => Promise<void>;
  setWatchedState: (videoId: string, isWatched: boolean) => Promise<void>;
};

type ContinueWatchingItem = {
  videoId: string;
  title: string;
  published: string;
  dateDownloaded: number;
  channelName: string;
  channelLogoUrl: string | null;
  viewCount: number;
  watched: boolean;
  thumbnailUrl: string;
  resumePositionSeconds: number;
  durationSeconds: number;
  durationLabel: string;
};

type ContinueWatchingPage = {
  items: ContinueWatchingItem[];
  currentPage: number;
  hasNextPage: boolean;
};

type HomeFeedPage = {
  items: ContinueWatchingItem[];
  currentPage: number;
  hasNextPage: boolean;
};

type ChannelListItem = {
  channelId: string;
  channelName: string;
  thumbnailUrl: string | null;
  subscribed: boolean;
  subscriberCount: number;
};

type ChannelsPage = {
  items: ChannelListItem[];
  currentPage: number;
  hasNextPage: boolean;
};

type ChannelDetail = {
  channelId: string;
  channelName: string;
  description: string;
  thumbnailUrl: string | null;
  subscriberCount: number;
  subscribed: boolean;
};

type PlaylistListItem = {
  playlistId: string;
  playlistName: string;
  channelId: string;
  channelName: string;
  channelLogoUrl: string | null;
  thumbnailUrl: string | null;
  videoCount: number;
  subscribed: boolean;
};

type PlaylistsPage = {
  items: PlaylistListItem[];
  currentPage: number;
  hasNextPage: boolean;
};

type PlaylistVideoEntry = {
  videoId: string;
  title: string;
  uploader: string | null;
  index: number;
  downloaded: boolean;
  thumbnailUrl: string;
  channelName: string;
  channelLogoUrl: string | null;
  viewCount: number;
  watched: boolean;
  dateDownloaded: number;
  resumePositionSeconds: number;
  durationSeconds: number;
  durationLabel: string;
};

type PlaylistDetail = {
  playlistId: string;
  playlistName: string;
  channelId: string;
  channelName: string;
  channelLogoUrl: string | null;
  description: string;
  thumbnailUrl: string | null;
  videoCount: number;
  subscribed: boolean;
  entries: PlaylistVideoEntry[];
};

type SearchVideoResult = ContinueWatchingItem;

type SearchChannelResult = {
  channelId: string;
  channelName: string;
  thumbnailUrl: string | null;
  subscribed: boolean;
  subscriberCount: number;
};

type SearchPlaylistResult = {
  playlistId: string;
  playlistName: string;
  channelName: string;
  thumbnailUrl: string | null;
  videoCount: number;
  subscribed: boolean;
};

type SearchResultsPage = {
  queryType: SearchQueryType;
  videoResults: SearchVideoResult[];
  channelResults: SearchChannelResult[];
  playlistResults: SearchPlaylistResult[];
  fulltextResults: SearchFulltextResult[];
};

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

function useTubeArchivistClient(connection: TubeArchivistConnection): TubeArchivistClient {
  return useMemo(() => {
    setApiBaseUrl(new URL(connection.serverUrl));
    function authHeaders() {
      return {
        Authorization: `Token ${connection.apiToken}`,
      };
    }

    async function fetchVideoDetails(videoId: string): Promise<VideoDetails> {
      const response = await videoRetrieve2(videoId, {
        headers: authHeaders(),
      });
      const video = response.data;
      const resolvedMediaUrl = new URL(video.media_url, connection.serverUrl).toString();
      const resumePositionSeconds = video.player.position ?? 0;

      return {
        videoId,
        resumePositionSeconds,
        title: video.title,
        duration: video.player.duration,
        durationLabel: video.player.duration_str,
        viewCount: video.stats.view_count ?? 0,
        channelName: video.channel?.channel_name ?? 'Unknown channel',
        channelLogoUrl: video.channel?.channel_thumb_url
          ? new URL(video.channel.channel_thumb_url, connection.serverUrl).toString()
          : null,
        watched: video.player.watched ?? false,
        published: video.published,
        dateDownloaded: video.date_downloaded ?? 0,
        description: video.description ?? 'No description available.',
        source: {
          uri: resolvedMediaUrl,
          headers: authHeaders(),
        },
      };
    }

    async function postProgressCheckpoint(videoId: string, position: number) {
      const body: VideoProgressUpdate = {
        position,
      };

      await videoProgressCreate(videoId, body, {
        headers: authHeaders(),
      });
    }

    async function setWatchedState(videoId: string, isWatched: boolean) {
      const body: WatchedData = {
        id: videoId,
        is_watched: isWatched,
      };

      await watchedCreate(body, {
        headers: authHeaders(),
      });
    }

    function mapVideoToContinueWatchingItem(video: Video): ContinueWatchingItem {
      const resolvedThumbnailUrl = new URL(video.vid_thumb_url, connection.serverUrl).toString();
      return {
        videoId: video.youtube_id,
        title: video.title,
        published: video.published,
        dateDownloaded: video.date_downloaded ?? 0,
        channelName: video.channel?.channel_name ?? 'Unknown channel',
        channelLogoUrl: resolveUrl(video.channel?.channel_thumb_url ?? null),
        viewCount: video.stats.view_count ?? 0,
        watched: video.player.watched ?? false,
        thumbnailUrl: resolvedThumbnailUrl,
        resumePositionSeconds: video.player.position ?? 0,
        durationSeconds: video.player.duration ?? 0,
        durationLabel: video.player.duration_str,
      };
    }

    async function fetchContinueWatching(page = 1): Promise<ContinueWatchingPage> {
      const response = await videoRetrieve(
        {
          page,
          watch: 'continue',
        },
        {
          headers: authHeaders(),
        },
      );

      return {
        items: response.data.data.map(mapVideoToContinueWatchingItem),
        currentPage: response.data.paginate.current_page,
        hasNextPage: Boolean(response.data.paginate.next_pages?.length),
      };
    }

    async function fetchHomeFeed(page = 1): Promise<HomeFeedPage> {
      const [continueResponse, recentResponse, unwatchedResponse] = await Promise.all([
        videoRetrieve({ page, type: 'videos', watch: 'continue' }, { headers: authHeaders() }),
        videoRetrieve(
          { page, type: 'videos', sort: 'downloaded', order: 'desc' },
          { headers: authHeaders() },
        ),
        videoRetrieve(
          { page, type: 'videos', watch: 'unwatched', sort: 'published', order: 'desc' },
          { headers: authHeaders() },
        ),
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
        items: uniqueItems.slice(0, 20).map(mapVideoToContinueWatchingItem),
        currentPage: page,
        hasNextPage:
          Boolean(continueResponse.data.paginate.next_pages?.length) ||
          Boolean(recentResponse.data.paginate.next_pages?.length) ||
          Boolean(unwatchedResponse.data.paginate.next_pages?.length) ||
          uniqueItems.length > 20,
      };
    }

    function resolveUrl(pathOrUrl: string | null | undefined): string | null {
      if (!pathOrUrl) {
        return null;
      }
      return new URL(pathOrUrl, connection.serverUrl).toString();
    }

    async function fetchChannels(page = 1): Promise<ChannelsPage> {
      const response = await channelRetrieve({ page }, { headers: authHeaders() });
      return {
        items: response.data.data.map(channel => ({
          channelId: channel.channel_id,
          channelName: channel.channel_name,
          thumbnailUrl: resolveUrl(channel.channel_thumb_url ?? null),
          subscribed: channel.channel_subscribed,
          subscriberCount: channel.channel_subs,
        })),
        currentPage: response.data.paginate.current_page,
        hasNextPage: Boolean(response.data.paginate.next_pages?.length),
      };
    }

    async function fetchChannelDetail(channelId: string): Promise<ChannelDetail> {
      const response = await channelRetrieve2(channelId, { headers: authHeaders() });
      return {
        channelId: response.data.channel_id,
        channelName: response.data.channel_name,
        description: response.data.channel_description ?? 'No description available.',
        thumbnailUrl: resolveUrl(response.data.channel_thumb_url ?? null),
        subscriberCount: response.data.channel_subs,
        subscribed: response.data.channel_subscribed,
      };
    }

    async function fetchPlaylists(page = 1): Promise<PlaylistsPage> {
      const response = await playlistRetrieve({ page }, { headers: authHeaders() });
      return {
        items: response.data.data.map(playlist => ({
          playlistId: playlist.playlist_id,
          playlistName: playlist.playlist_name,
          channelId: playlist.playlist_channel_id,
          channelName: playlist.playlist_channel,
          channelLogoUrl: null,
          thumbnailUrl: resolveUrl(playlist.playlist_thumbnail),
          videoCount: playlist.playlist_entries.length,
          subscribed: playlist.playlist_subscribed,
        })),
        currentPage: response.data.paginate.current_page,
        hasNextPage: Boolean(response.data.paginate.next_pages?.length),
      };
    }

    async function fetchPlaylistDetail(playlistId: string): Promise<PlaylistDetail> {
      const response = await playlistRetrieve2(playlistId, { headers: authHeaders() });
      const channelResponse = await channelRetrieve2(response.data.playlist_channel_id, {
        headers: authHeaders(),
      });
      const enrichedEntries = await Promise.all(
        response.data.playlist_entries.map(async entry => {
          const entryVideo = await videoRetrieve2(entry.youtube_id, { headers: authHeaders() });
          const video = entryVideo.data;
          return {
            videoId: entry.youtube_id,
            title: entry.title,
            uploader: entry.uploader,
            index: entry.idx,
            downloaded: entry.downloaded,
            thumbnailUrl: new URL(video.vid_thumb_url, connection.serverUrl).toString(),
            channelName: video.channel?.channel_name ?? response.data.playlist_channel,
            channelLogoUrl: resolveUrl(video.channel?.channel_thumb_url ?? null),
            viewCount: video.stats.view_count ?? 0,
            watched: video.player.watched ?? false,
            dateDownloaded: video.date_downloaded ?? 0,
            resumePositionSeconds: video.player.position ?? 0,
            durationSeconds: video.player.duration ?? 0,
            durationLabel: video.player.duration_str,
          };
        }),
      );
      return {
        playlistId: response.data.playlist_id,
        playlistName: response.data.playlist_name,
        channelId: response.data.playlist_channel_id,
        channelName: response.data.playlist_channel,
        channelLogoUrl: resolveUrl(channelResponse.data.channel_thumb_url ?? null),
        description: response.data.playlist_description ?? 'No description available.',
        thumbnailUrl: resolveUrl(response.data.playlist_thumbnail),
        videoCount: response.data.playlist_entries.length,
        subscribed: response.data.playlist_subscribed,
        entries: enrichedEntries,
      };
    }

    async function searchArchive(query: string): Promise<SearchResultsPage> {
      const response = await searchRetrieve(query, { headers: authHeaders() });
      const hydratedSearchVideos = await Promise.all(
        response.data.results.video_results.map(async video => {
          try {
            const detailResponse = await videoRetrieve2(video.youtube_id, { headers: authHeaders() });
            return mapVideoToContinueWatchingItem(detailResponse.data);
          } catch {
            return mapVideoToContinueWatchingItem(video);
          }
        }),
      );
      return {
        queryType: response.data.queryType,
        videoResults: hydratedSearchVideos,
        channelResults: response.data.results.channel_results.map(channel => ({
          channelId: channel.channel_id,
          channelName: channel.channel_name,
          thumbnailUrl: resolveUrl(channel.channel_thumb_url ?? null),
          subscribed: channel.channel_subscribed,
          subscriberCount: channel.channel_subs,
        })),
        playlistResults: response.data.results.playlist_results.map(playlist => ({
          playlistId: playlist.playlist_id,
          playlistName: playlist.playlist_name,
          channelName: playlist.playlist_channel,
          thumbnailUrl: resolveUrl(playlist.playlist_thumbnail),
          videoCount: playlist.playlist_entries.length,
          subscribed: playlist.playlist_subscribed,
        })),
        fulltextResults: response.data.results.fulltext_results,
      };
    }

    return {
      fetchVideoDetails,
      fetchContinueWatching,
      fetchHomeFeed,
      fetchChannels,
      fetchChannelDetail,
      fetchPlaylists,
      fetchPlaylistDetail,
      searchArchive,
      postProgressCheckpoint,
      setWatchedState,
    };
  }, [connection]);
}

export { getVideoId, useTubeArchivistClient };
export type {
  ContinueWatchingItem,
  ContinueWatchingPage,
  ChannelDetail,
  ChannelListItem,
  ChannelsPage,
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
};
