import type { RefObject } from 'react';
import type { TubeArchivistClient } from '../services/tubeArchivist';

const PROGRESS_SYNC_INTERVAL_SECONDS = 5;
const PROGRESS_SYNC_MIN_DELTA_SECONDS = 5;

type SyncPlaybackProgressParams = {
  client: TubeArchivistClient;
  isProgressSyncInFlightRef: RefObject<boolean>;
  lastSyncedProgressRef: RefObject<number>;
  latestPlaybackTimeRef: RefObject<number>;
  reasonLabel: string;
  shouldUpdateStatus: boolean;
  setPlaybackStatus: (value: string) => void;
  force: boolean;
  videoId: string;
};

async function syncPlaybackProgressCheckpoint({
  client,
  force,
  isProgressSyncInFlightRef,
  lastSyncedProgressRef,
  latestPlaybackTimeRef,
  reasonLabel,
  setPlaybackStatus,
  shouldUpdateStatus,
  videoId,
}: SyncPlaybackProgressParams) {
  const playbackSeconds = Math.max(0, Math.floor(latestPlaybackTimeRef.current));

  if (playbackSeconds <= 0) {
    return 'Skipped progress sync because no watch time was recorded.';
  }

  const isNewEnoughCheckpoint =
    playbackSeconds >= lastSyncedProgressRef.current + PROGRESS_SYNC_MIN_DELTA_SECONDS;
  if (!force && !isNewEnoughCheckpoint) {
    return `Skipped ${reasonLabel} sync because progress only moved ${Math.max(0, playbackSeconds - lastSyncedProgressRef.current)}s.`;
  }

  if (isProgressSyncInFlightRef.current) {
    return `Skipped ${reasonLabel} sync because another request is in flight.`;
  }

  isProgressSyncInFlightRef.current = true;

  if (shouldUpdateStatus) {
    setPlaybackStatus(`Syncing progress checkpoint at ${playbackSeconds}s (${reasonLabel})...`);
  }

  try {
    await client.postProgressCheckpoint(videoId, playbackSeconds);
    lastSyncedProgressRef.current = playbackSeconds;

    if (shouldUpdateStatus) {
      setPlaybackStatus(`Progress checkpoint synced at ${playbackSeconds}s.`);
    }

    return `Progress checkpoint synced at ${playbackSeconds}s.`;
  } finally {
    isProgressSyncInFlightRef.current = false;
  }
}

export {
  PROGRESS_SYNC_INTERVAL_SECONDS,
  syncPlaybackProgressCheckpoint,
};
