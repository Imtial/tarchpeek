import type { RefObject } from 'react';
import { TARCHPEEK_CONSTANTS } from '../constants/tarchpeekConstants';
import type { TubeArchivistClient } from '../services/tubeArchivist';

function wait(ms: number) {
  return new Promise<void>(resolve => {
    setTimeout(resolve, ms);
  });
}

type SyncPlaybackProgressParams = {
  client: TubeArchivistClient;
  isProgressSyncInFlightRef: RefObject<boolean>;
  lastSyncedProgressRef: RefObject<number>;
  latestPlaybackTimeRef: RefObject<number>;
  force: boolean;
  videoId: string;
};

async function syncPlaybackProgressCheckpoint({
  client,
  force,
  isProgressSyncInFlightRef,
  lastSyncedProgressRef,
  latestPlaybackTimeRef,
  videoId,
}: SyncPlaybackProgressParams) {
  const playbackSeconds = Math.max(0, Math.floor(latestPlaybackTimeRef.current));

  if (playbackSeconds <= 0) {
    return;
  }

  const isNewEnoughCheckpoint =
    playbackSeconds >=
    lastSyncedProgressRef.current + TARCHPEEK_CONSTANTS.playbackProgress.minDeltaSeconds;
  if (!force && !isNewEnoughCheckpoint) {
    return;
  }

  if (isProgressSyncInFlightRef.current) {
    if (force) {
      let elapsedMs = 0;
      while (
        isProgressSyncInFlightRef.current &&
        elapsedMs < TARCHPEEK_CONSTANTS.playbackProgress.forceWaitMaxMs
      ) {
        await wait(TARCHPEEK_CONSTANTS.playbackProgress.forceWaitStepMs);
        elapsedMs += TARCHPEEK_CONSTANTS.playbackProgress.forceWaitStepMs;
      }
    }
  }

  if (isProgressSyncInFlightRef.current) {
    return;
  }

  isProgressSyncInFlightRef.current = true;

  try {
    await client.postProgressCheckpoint(videoId, playbackSeconds);
    lastSyncedProgressRef.current = playbackSeconds;

    return;
  } finally {
    isProgressSyncInFlightRef.current = false;
  }
}

export { syncPlaybackProgressCheckpoint };
