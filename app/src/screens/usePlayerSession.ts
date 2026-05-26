import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler } from 'react-native';
import { useEvent, useVideoPlayer } from 'react-native-video';
import { TARCHPEEK_CONSTANTS } from '../constants/tarchpeekConstants';
import type { TubeArchivistClient, VideoDetails } from '../services/tubeArchivist';
import { PROGRESS_SYNC_INTERVAL_SECONDS, syncPlaybackProgressCheckpoint } from './playbackProgress';
import {
  captureRotationModeContext,
  getFullscreenOrientationLock,
  lockFullscreenOrientation,
  restoreOrientationAfterFullscreen,
  unlockFullscreenOrientation,
} from './player/fullscreenOrientation';
import { getWatchedSessionSeconds, startWatchSession, stopWatchSession } from './player/sessionPolicies';

type UsePlayerSessionParams = {
  client: TubeArchivistClient;
  onBack: (result: { resultMessage?: string; shouldRefreshBrowse: boolean }) => void;
  onPlayNextInQueue: () => Promise<boolean>;
  videoDetails: VideoDetails;
};

const RESUME_MIN_SECONDS = TARCHPEEK_CONSTANTS.player.resumeMinSeconds;
const RESUME_END_BUFFER_SECONDS = TARCHPEEK_CONSTANTS.player.resumeEndBufferSeconds;

function usePlayerSession({ client, onBack, onPlayNextInQueue, videoDetails }: UsePlayerSessionParams) {
  const initialResumeSeconds = Math.max(0, Math.floor(videoDetails.resumePositionSeconds));
  const durationSeconds = Math.max(0, Math.floor(videoDetails.duration ?? 0));
  const canApplyResumePosition =
    initialResumeSeconds > RESUME_MIN_SECONDS &&
    (durationSeconds <= 0 ||
      initialResumeSeconds < Math.max(RESUME_MIN_SECONDS + 1, durationSeconds - RESUME_END_BUFFER_SECONDS));

  const setPlaybackStatus = useCallback((_value: string) => {}, []);
  const [isWatched, setIsWatched] = useState(videoDetails.watched);
  const [isUpdatingWatchedState, setIsUpdatingWatchedState] = useState(false);
  const latestPlaybackTimeRef = useRef(0);
  const lastSyncedProgressRef = useRef(0);
  const isProgressSyncInFlightRef = useRef(false);
  const isClosingRef = useRef(false);
  const didWatchedStateChangeRef = useRef(false);
  const isPlayingRef = useRef(false);
  const playSessionStartedAtMsRef = useRef<number | null>(null);
  const watchedSessionMsRef = useRef(0);
  const isAdvancingAfterEndRef = useRef(false);
  const fullscreenLockRef = useRef<ReturnType<typeof getFullscreenOrientationLock>>(null);
  const fullscreenRotationContextRef = useRef<Awaited<ReturnType<typeof captureRotationModeContext>> | null>(null);
  const hasHandledFullscreenExitRef = useRef(true);

  const syncProgress = useCallback(
    async (reasonLabel: string, force: boolean) => {
      await syncPlaybackProgressCheckpoint({
        client,
        force,
        isProgressSyncInFlightRef,
        lastSyncedProgressRef,
        latestPlaybackTimeRef,
        reasonLabel,
        setPlaybackStatus,
        shouldUpdateStatus: false,
        videoId: videoDetails.videoId,
      });
    },
    [client, setPlaybackStatus, videoDetails.videoId],
  );

  const syncProgressWithErrorStatus = useCallback(
    (reasonLabel: string, force: boolean) => {
      syncProgress(reasonLabel, force).catch(error => {
        const errorMessage = error instanceof Error ? error.message : 'Unknown progress sync error';
        setPlaybackStatus(`Background progress sync failed: ${errorMessage}`);
      });
    },
    [setPlaybackStatus, syncProgress],
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
    hasHandledFullscreenExitRef.current = false;
    captureRotationModeContext()
      .then(context => {
        fullscreenRotationContextRef.current = context;
      })
      .catch(() => {
        fullscreenRotationContextRef.current = null;
      });
    if (fullscreenLockRef.current === null) {
      fullscreenLockRef.current = getFullscreenOrientationLock(videoDetails.streamWidth, videoDetails.streamHeight);
    }
    lockFullscreenOrientation(fullscreenLockRef.current);
  }, [videoDetails.streamHeight, videoDetails.streamWidth]);

  const handleWillExitFullscreen = useCallback(() => {
    if (hasHandledFullscreenExitRef.current) {
      return;
    }
    hasHandledFullscreenExitRef.current = true;
    fullscreenLockRef.current = null;
    restoreOrientationAfterFullscreen(fullscreenRotationContextRef.current);
    fullscreenRotationContextRef.current = null;
  }, []);

  const handleFullscreenChange = useCallback((isFullscreen: boolean) => {
    if (!isFullscreen) {
      if (hasHandledFullscreenExitRef.current) {
        return;
      }
      hasHandledFullscreenExitRef.current = true;
      fullscreenLockRef.current = null;
      restoreOrientationAfterFullscreen(fullscreenRotationContextRef.current);
      fullscreenRotationContextRef.current = null;
    }
  }, []);

  useEvent(player, 'onLoadStart', () => {
    setPlaybackStatus('Loading video source...');
  });

  useEvent(player, 'onLoad', data => {
    setPlaybackStatus(
      canApplyResumePosition
        ? `Playback started. Resumed at ${initialResumeSeconds}s.`
        : `Playback started. Duration ${Math.round(data.duration)}s.`,
    );
  });

  useEvent(player, 'onProgress', data => {
    latestPlaybackTimeRef.current = data.currentTime;

    const playbackSeconds = Math.max(0, Math.floor(data.currentTime));
    const hasReachedIntervalThreshold =
      playbackSeconds >= lastSyncedProgressRef.current + PROGRESS_SYNC_INTERVAL_SECONDS;

    if (hasReachedIntervalThreshold) {
      syncProgressWithErrorStatus('interval', false);
    }
  });

  useEvent(player, 'onBuffer', buffering => {
    if (buffering) {
      setPlaybackStatus('Buffering video...');
    }
  });

  useEvent(player, 'onPlaybackStateChange', data => {
    const nextStateLabel = data.isBuffering ? 'buffering' : data.isPlaying ? 'playing' : 'paused';
    setPlaybackStatus(`Playback state: ${nextStateLabel}`);

    if (data.isPlaying) {
      startWatchSession({
        isPlayingRef,
        playSessionStartedAtMsRef,
        watchedSessionMsRef,
      });
    }

    if (!data.isPlaying || data.isBuffering) {
      stopWatchSession({
        isPlayingRef,
        playSessionStartedAtMsRef,
        watchedSessionMsRef,
      });
    }

    if (!data.isPlaying && !data.isBuffering) {
      syncProgressWithErrorStatus(nextStateLabel, true);
    }
  });

  useEvent(player, 'onEnd', () => {
    if (isClosingRef.current || isAdvancingAfterEndRef.current) {
      return;
    }

    isAdvancingAfterEndRef.current = true;
    syncProgress('ended', true)
      .then(async () => {
        await onPlayNextInQueue();
      })
      .catch(error => {
        const errorMessage = error instanceof Error ? error.message : 'Unknown progress sync error';
        setPlaybackStatus(`Background progress sync failed: ${errorMessage}`);
      })
      .finally(() => {
        isAdvancingAfterEndRef.current = false;
      });
  });

  useEvent(player, 'onError', error => {
    setPlaybackStatus(`Playback failed: ${error.message}`);
  });

  const handleBackPress = useCallback(async () => {
    if (isClosingRef.current) {
      return;
    }

    isClosingRef.current = true;
    stopWatchSession({
      isPlayingRef,
      playSessionStartedAtMsRef,
      watchedSessionMsRef,
    });
    unlockFullscreenOrientation();
    const watchedSessionSeconds = getWatchedSessionSeconds(watchedSessionMsRef);
    const shouldRefreshBrowse =
      watchedSessionSeconds >= TARCHPEEK_CONSTANTS.player.browseRefreshWatchThresholdSeconds ||
      didWatchedStateChangeRef.current;
    onBack({ resultMessage: 'Playback closed.', shouldRefreshBrowse });

    syncProgress('exit', true).catch(() => undefined);
  }, [onBack, syncProgress]);

  useEffect(() => {
    // Needed to map Android hardware back/gesture to player exit + final progress sync.
    const backSubscription = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBackPress().catch(() => undefined);
      return true;
    });

    return () => {
      unlockFullscreenOrientation();
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
      didWatchedStateChangeRef.current = true;
    } catch (error) {
      setIsWatched(!nextWatched);
      const errorMessage = error instanceof Error ? error.message : 'Unknown watched state update error';
      setPlaybackStatus(`Watched state update failed: ${errorMessage}`);
    } finally {
      setIsUpdatingWatchedState(false);
    }
  }

  return {
    isWatched,
    player,
    handleFullscreenChange,
    handleWillEnterFullscreen,
    handleWillExitFullscreen,
    handleToggleWatched,
  };
}

export { usePlayerSession };
