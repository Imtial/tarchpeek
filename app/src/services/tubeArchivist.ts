import { useMemo } from 'react';
import {
  videoProgressCreate,
  videoRetrieve2,
  type videoProgressCreateResponse,
  type videoRetrieve2Response,
} from '../api/generated/endpoints/tubearchivist';
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
    function authHeaders() {
      return {
        Authorization: `Token ${connection.apiToken}`,
      };
    }

    async function fetchVideoDetails(videoId: string): Promise<VideoDetails> {
      const response: videoRetrieve2Response = await videoRetrieve2(videoId, {
        headers: authHeaders(),
      });

      if (response.status !== 200) {
        throw new Error(`Video API returned ${response.status}`);
      }

      const video = response.data;
      const resolvedMediaUrl = new URL(video.media_url, connection.serverUrl).toString();
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

      const response: videoProgressCreateResponse = await videoProgressCreate(videoId, body, {
        headers: authHeaders(),
      });

      if (response.status !== 200) {
        throw new Error(`Progress endpoint returned ${response.status}`);
      }
    }

    return {
      fetchVideoDetails,
      postProgressCheckpoint,
    };
  }, [connection]);
}

export { getVideoId, useTubeArchivistClient };
export type { TubeArchivistClient, TubeArchivistConnection, VideoDetails };
