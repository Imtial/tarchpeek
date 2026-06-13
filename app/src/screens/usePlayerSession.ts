import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler } from 'react-native';
import { useEvent, useVideoPlayer } from 'react-native-video';
import { TARCHPEEK_CONSTANTS } from '../constants/tarchpeekConstants';
import type { TubeArchivistClient, VideoDetails } from '../services/tubeArchivist';
import { syncPlaybackProgressCheckpoint } from './playbackProgress';
import {
  getWatchedSessionSeconds,
  startWatchSession,
  stopWatchSession,
} from './player/sessionPolicies';

type SessionPhase = 'active' | 'advancing' | 'closing';
type FullscreenOrientationLock = 'portrait' | 'landscape';

type UsePlayerSessionParams = {
  client: TubeArchivistClient;
  onBack: (result: { resultMessage?: string; shouldRefreshBrowse: boolean }) => void;
  onPlayNextInQueue: () => Promise<boolean>;
  videoDetails: VideoDetails;
};

function usePlayerSession({
  client,
  onBack,
  onPlayNextInQueue,
  videoDetails,
}: UsePlayerSessionParams) {
  const initialResumeSeconds = Math.max(0, Math.floor(videoDetails.resumePositionSeconds));
  const durationSeconds = Math.max(0, Math.floor(videoDetails.duration ?? 0));
  const canApplyResumePosition =
    initialResumeSeconds > TARCHPEEK_CONSTANTS.player.resumeMinSeconds &&
    (durationSeconds <= 0 ||
      initialResumeSeconds <
        Math.max(
          TARCHPEEK_CONSTANTS.player.resumeMinSeconds + 1,
          durationSeconds - TARCHPEEK_CONSTANTS.player.resumeEndBufferSeconds,
        ));

  const [isWatched, setIsWatched] = useState(videoDetails.watched);
  const [isUpdatingWatchedState, setIsUpdatingWatchedState] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const latestPlaybackTimeRef = useRef(0);
  const lastSyncedProgressRef = useRef(0);
  const isProgressSyncInFlightRef = useRef(false);
  const sessionPhaseRef = useRef<SessionPhase>('active');
  const watchSessionRef = useRef({
    isPlaying: false,
    startedAtMs: null as number | null,
    watchedMs: 0,
  });
  const fullscreenOrientationLock: FullscreenOrientationLock | null =
    !videoDetails.streamWidth || !videoDetails.streamHeight
      ? null
      : videoDetails.streamWidth > videoDetails.streamHeight
        ? 'landscape'
        : videoDetails.streamHeight > videoDetails.streamWidth
          ? 'portrait'
          : null;

  const syncProgress = useCallback(
    async (force: boolean) => {
      await syncPlaybackProgressCheckpoint({
        client,
        force,
        isProgressSyncInFlightRef,
        lastSyncedProgressRef,
        latestPlaybackTimeRef,
        videoId: videoDetails.videoId,
      });
    },
    [client, videoDetails.videoId],
  );

  const syncProgressFireAndForget = useCallback(
    (force: boolean) => {
      syncProgress(force).catch(_error => {
        // TODO: do something with the error.
      });
    },
    [syncProgress],
  );

  const player = useVideoPlayer(videoDetails.source, currentPlayer => {
    currentPlayer.muted = false;
    currentPlayer.volume = 1;
    currentPlayer.loop = false;

    if (canApplyResumePosition) {
      currentPlayer.currentTime = initialResumeSeconds;
      latestPlaybackTimeRef.current = initialResumeSeconds;
      lastSyncedProgressRef.current = initialResumeSeconds;
    }

    currentPlayer.play();
  });

  const handleWillEnterFullscreen = useCallback(() => {
    setIsFullscreen(true);
  }, []);

  const handleWillExitFullscreen = useCallback(() => {
    setIsFullscreen(false);
  }, []);

  const handleFullscreenChange = useCallback((nextIsFullscreen: boolean) => {
    setIsFullscreen(nextIsFullscreen);
  }, []);

  useEvent(player, 'onProgress', data => {
    latestPlaybackTimeRef.current = data.currentTime;

    const playbackSeconds = Math.max(0, Math.floor(data.currentTime));
    const hasReachedIntervalThreshold =
      playbackSeconds >=
      lastSyncedProgressRef.current + TARCHPEEK_CONSTANTS.playbackProgress.syncIntervalSeconds;

    if (hasReachedIntervalThreshold) {
      syncProgressFireAndForget(false);
    }
  });

  useEvent(player, 'onPlaybackStateChange', data => {
    if (data.isPlaying) {
      startWatchSession(watchSessionRef);
    }

    if (!data.isPlaying || data.isBuffering) {
      stopWatchSession(watchSessionRef);
    }

    if (!data.isPlaying && !data.isBuffering) {
      syncProgressFireAndForget(true);
    }
  });

  useEvent(player, 'onEnd', () => {
    if (sessionPhaseRef.current !== 'active') {
      return;
    }

    sessionPhaseRef.current = 'advancing';
    syncProgress(true)
      .then(async () => {
        await onPlayNextInQueue();
      })
      .catch(_error => {
        // TODO: do something with the error.
      })
      .finally(() => {
        if (sessionPhaseRef.current === 'advancing') {
          sessionPhaseRef.current = 'active';
        }
      });
  });

  useEvent(player, 'onError', _error => {
    // TODO: do something with the error.
  });

  const handleBackPress = useCallback(async () => {
    if (sessionPhaseRef.current === 'closing') {
      return;
    }

    sessionPhaseRef.current = 'closing';
    stopWatchSession(watchSessionRef);
    const watchedSessionSeconds = getWatchedSessionSeconds(watchSessionRef);
    const shouldRefreshBrowse =
      watchedSessionSeconds >= TARCHPEEK_CONSTANTS.player.browseRefreshWatchThresholdSeconds ||
      isWatched !== videoDetails.watched;
    onBack({ resultMessage: 'Playback closed.', shouldRefreshBrowse });

    syncProgress(true).catch(() => undefined);
  }, [isWatched, onBack, syncProgress, videoDetails.watched]);

  useEffect(() => {
    // Needed to map Android hardware back/gesture to player exit + final progress sync.
    const backSubscription = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBackPress().catch(() => undefined);
      return true;
    });

    return () => {
      backSubscription.remove();
    };
  }, [handleBackPress]);

  async function handleToggleWatched() {
    if (isUpdatingWatchedState) {
      return;
    }

    const nextWatched = !isWatched;
    setIsUpdatingWatchedState(true);
    setIsWatched(nextWatched);

    try {
      await client.setWatchedState(videoDetails.videoId, nextWatched);
    } catch {
      setIsWatched(!nextWatched);
      // TODO: do something with the error.
    } finally {
      setIsUpdatingWatchedState(false);
    }
  }

  return {
    fullscreenOrientationLock,
    isWatched,
    isFullscreen,
    player,
    handleFullscreenChange,
    handleWillEnterFullscreen,
    handleWillExitFullscreen,
    handleToggleWatched,
  };
}

export { usePlayerSession };
