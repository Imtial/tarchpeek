import type { Channel, Playlist, PlaylistEntry, Video } from '../../api/generated/models';
import type {
  ChannelDetail,
  ChannelListItem,
  ContinueWatchingItem,
  PlaylistDetail,
  PlaylistListItem,
  PlaylistVideoEntry,
  SearchChannelResult,
  SearchPlaylistResult,
  VideoDetails,
} from './types';

function resolveUrl(pathOrUrl: string | null | undefined, serverUrl: string): string | null {
  if (!pathOrUrl) {
    return null;
  }
  return new URL(pathOrUrl, serverUrl).toString();
}

function mapVideoToContinueWatchingItem(video: Video, serverUrl: string): ContinueWatchingItem {
  const resolvedThumbnailUrl = new URL(video.vid_thumb_url, serverUrl).toString();
  return {
    videoId: video.youtube_id,
    title: video.title,
    published: video.published,
    dateDownloaded: video.date_downloaded ?? 0,
    channelName: video.channel?.channel_name ?? 'Unknown channel',
    channelLogoUrl: resolveUrl(video.channel?.channel_thumb_url ?? null, serverUrl),
    viewCount: video.stats.view_count ?? 0,
    watched: video.player.watched ?? false,
    thumbnailUrl: resolvedThumbnailUrl,
    resumePositionSeconds: video.player.position ?? 0,
    durationSeconds: video.player.duration ?? 0,
    durationLabel: video.player.duration_str,
  };
}

function mapVideoDetails(videoId: string, video: Video, serverUrl: string, apiToken: string): VideoDetails {
  return {
    videoId,
    resumePositionSeconds: video.player.position ?? 0,
    title: video.title,
    duration: video.player.duration,
    durationLabel: video.player.duration_str,
    viewCount: video.stats.view_count ?? 0,
    channelName: video.channel?.channel_name ?? 'Unknown channel',
    channelLogoUrl: resolveUrl(video.channel?.channel_thumb_url ?? null, serverUrl),
    watched: video.player.watched ?? false,
    published: video.published,
    dateDownloaded: video.date_downloaded ?? 0,
    description: video.description ?? 'No description available.',
    source: {
      uri: new URL(video.media_url, serverUrl).toString(),
      headers: {
        Authorization: `Token ${apiToken}`,
      },
    },
  };
}

function mapChannelListItem(channel: Channel, serverUrl: string): ChannelListItem {
  return {
    channelId: channel.channel_id,
    channelName: channel.channel_name,
    thumbnailUrl: resolveUrl(channel.channel_thumb_url ?? null, serverUrl),
    subscribed: channel.channel_subscribed,
    subscriberCount: channel.channel_subs,
  };
}

function mapChannelDetail(detail: Channel, serverUrl: string): ChannelDetail {
  return {
    channelId: detail.channel_id,
    channelName: detail.channel_name,
    description: detail.channel_description ?? 'No description available.',
    thumbnailUrl: resolveUrl(detail.channel_thumb_url ?? null, serverUrl),
    subscriberCount: detail.channel_subs,
    subscribed: detail.channel_subscribed,
  };
}

function mapPlaylistListItem(playlist: Playlist, serverUrl: string): PlaylistListItem {
  return {
    playlistId: playlist.playlist_id,
    playlistName: playlist.playlist_name,
    channelId: playlist.playlist_channel_id,
    channelName: playlist.playlist_channel,
    channelLogoUrl: null,
    thumbnailUrl: resolveUrl(playlist.playlist_thumbnail ?? null, serverUrl),
    videoCount: playlist.playlist_entries.length,
    subscribed: playlist.playlist_subscribed,
  };
}

function mapPlaylistEntry(args: {
  entry: PlaylistEntry;
  video: Video;
  fallbackChannelName: string;
  serverUrl: string;
}): PlaylistVideoEntry {
  const { entry, fallbackChannelName, serverUrl, video } = args;
  return {
    videoId: entry.youtube_id,
    title: entry.title,
    uploader: entry.uploader,
    index: entry.idx,
    downloaded: entry.downloaded,
    thumbnailUrl: new URL(video.vid_thumb_url, serverUrl).toString(),
    channelName: video.channel?.channel_name ?? fallbackChannelName,
    channelLogoUrl: resolveUrl(video.channel?.channel_thumb_url ?? null, serverUrl),
    viewCount: video.stats.view_count ?? 0,
    watched: video.player.watched ?? false,
    dateDownloaded: video.date_downloaded ?? 0,
    resumePositionSeconds: video.player.position ?? 0,
    durationSeconds: video.player.duration ?? 0,
    durationLabel: video.player.duration_str,
  };
}

function mapPlaylistDetail(args: {
  playlist: Playlist;
  channelThumbUrl: string | null | undefined;
  entries: PlaylistVideoEntry[];
  serverUrl: string;
}): PlaylistDetail {
  const { channelThumbUrl, entries, playlist, serverUrl } = args;
  return {
    playlistId: playlist.playlist_id,
    playlistName: playlist.playlist_name,
    channelId: playlist.playlist_channel_id,
    channelName: playlist.playlist_channel,
    channelLogoUrl: resolveUrl(channelThumbUrl ?? null, serverUrl),
    description: playlist.playlist_description ?? 'No description available.',
    thumbnailUrl: resolveUrl(playlist.playlist_thumbnail ?? null, serverUrl),
    videoCount: playlist.playlist_entries.length,
    subscribed: playlist.playlist_subscribed,
    entries,
  };
}

function mapSearchChannelResult(channel: Channel, serverUrl: string): SearchChannelResult {
  return {
    channelId: channel.channel_id,
    channelName: channel.channel_name,
    thumbnailUrl: resolveUrl(channel.channel_thumb_url ?? null, serverUrl),
    subscribed: channel.channel_subscribed,
    subscriberCount: channel.channel_subs,
  };
}

function mapSearchPlaylistResult(playlist: Playlist, serverUrl: string): SearchPlaylistResult {
  return {
    playlistId: playlist.playlist_id,
    playlistName: playlist.playlist_name,
    channelId: playlist.playlist_channel_id,
    channelName: playlist.playlist_channel,
    thumbnailUrl: resolveUrl(playlist.playlist_thumbnail ?? null, serverUrl),
    videoCount: playlist.playlist_entries.length,
    subscribed: playlist.playlist_subscribed,
  };
}

export {
  mapChannelDetail,
  mapChannelListItem,
  mapPlaylistDetail,
  mapPlaylistEntry,
  mapPlaylistListItem,
  mapSearchChannelResult,
  mapSearchPlaylistResult,
  mapVideoDetails,
  mapVideoToContinueWatchingItem,
  resolveUrl,
};
