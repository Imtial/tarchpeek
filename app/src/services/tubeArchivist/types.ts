import type { SearchFulltextResult, SearchQueryType } from '../../api/search';

type VideoSource = {
  uri: number | string;
  headers?: Record<string, string>;
};

type VideoDetails = {
  videoId: string;
  resumePositionSeconds: number;
  title: string;
  duration?: number;
  streamWidth?: number;
  streamHeight?: number;
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

type ChannelVideosPage = {
  items: ContinueWatchingItem[];
  currentPage: number;
  hasNextPage: boolean;
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
  channelId: string;
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

type TubeArchivistClient = {
  validateConnection: () => Promise<void>;
  fetchVideoDetails: (videoId: string) => Promise<VideoDetails>;
  fetchContinueWatching: (page?: number) => Promise<ContinueWatchingPage>;
  fetchHomeFeed: (page?: number) => Promise<HomeFeedPage>;
  fetchChannels: (page?: number) => Promise<ChannelsPage>;
  fetchChannelDetail: (channelId: string) => Promise<ChannelDetail>;
  fetchChannelVideos: (channelId: string, page?: number) => Promise<ChannelVideosPage>;
  fetchPlaylists: (page?: number) => Promise<PlaylistsPage>;
  fetchPlaylistDetail: (playlistId: string) => Promise<PlaylistDetail>;
  searchArchive: (query: string) => Promise<SearchResultsPage>;
  postProgressCheckpoint: (videoId: string, position: number) => Promise<void>;
  setWatchedState: (videoId: string, isWatched: boolean) => Promise<void>;
};

export type {
  ChannelDetail,
  ChannelListItem,
  ChannelVideosPage,
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
  VideoSource,
};
