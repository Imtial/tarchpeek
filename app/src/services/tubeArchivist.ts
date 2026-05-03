import { useMemo } from 'react';
import {
  videoProgressCreate,
  videoRetrieve2,
} from '../api/generated/endpoints/tubearchivist';
import { setApiBaseUrl } from '../api/fetcher';
import type { VideoProgressUpdate } from '../api/generated/models';

type VideoSource = {
  uri: number | string;
  headers?: Record<string, string>;
};

type VideoDetails = {
  videoId: string;
  resumePositionSeconds: number;
  title: string;
  duration?: number;
  source: VideoSource;
};

type TubeArchivistConnection = {
  serverUrl: string;
  apiToken: string;
};

type TubeArchivistClient = {
  fetchVideoDetails: (videoId: string) => Promise<VideoDetails>;
  postProgressCheckpoint: (videoId: string, position: number) => Promise<void>;
};

function resolvePlaybackUrl(mediaUrl: string, serverUrl: string) {
  const server = new URL(serverUrl);
  const media = new URL(mediaUrl, server);

  // Always use the configured server origin so emulator/TV can reach the stream host.
  return new URL(`${media.pathname}${media.search}${media.hash}`, server).toString();
}

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
      const resolvedMediaUrl = resolvePlaybackUrl(video.media_url, connection.serverUrl);
      const resumePositionSeconds = video.player.position ?? 0;

      return {
        videoId,
        resumePositionSeconds,
        title: video.title,
        duration: video.player.duration,
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

    return {
      fetchVideoDetails,
      postProgressCheckpoint,
    };
  }, [connection]);
}

export { getVideoId, useTubeArchivistClient };
export type { TubeArchivistClient, TubeArchivistConnection, VideoDetails };
