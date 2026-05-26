import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler } from 'react-native';
import { useEvent, useVideoPlayer } from 'react-native-video';
import { TARCHPEEK_CONSTANTS } from '../constants/tarchpeekConstants';
import type { TubeArchivistClient, VideoDetails } from '../services/tubeArchivist';
import { PROGRESS_SYNC_INTERVAL_SECONDS, syncPlaybackProgressCheckpoint } from './playbackProgress';

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

  const [, setPlaybackStatus] = useState('Preparing player...');
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
      syncPlaybackProgressCheckpoint({
        client,
        force: false,
        isProgressSyncInFlightRef,
        lastSyncedProgressRef,
        latestPlaybackTimeRef,
        reasonLabel: 'interval',
        setPlaybackStatus,
        shouldUpdateStatus: false,
        videoId: videoDetails.videoId,
      }).catch(error => {
        const errorMessage = error instanceof Error ? error.message : 'Unknown progress sync error';
        setPlaybackStatus(`Background progress sync failed: ${errorMessage}`);
      });
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

    if (data.isPlaying && !isPlayingRef.current) {
      isPlayingRef.current = true;
      playSessionStartedAtMsRef.current = Date.now();
    }

    if ((!data.isPlaying || data.isBuffering) && isPlayingRef.current) {
      const startedAt = playSessionStartedAtMsRef.current;
      if (startedAt) {
        watchedSessionMsRef.current += Math.max(0, Date.now() - startedAt);
      }
      playSessionStartedAtMsRef.current = null;
      isPlayingRef.current = false;
    }

    if (!data.isPlaying && !data.isBuffering) {
      syncPlaybackProgressCheckpoint({
        client,
        force: true,
        isProgressSyncInFlightRef,
        lastSyncedProgressRef,
        latestPlaybackTimeRef,
        reasonLabel: nextStateLabel,
        setPlaybackStatus,
        shouldUpdateStatus: false,
        videoId: videoDetails.videoId,
      }).catch(error => {
        const errorMessage = error instanceof Error ? error.message : 'Unknown progress sync error';
        setPlaybackStatus(`Background progress sync failed: ${errorMessage}`);
      });
    }
  });

  useEvent(player, 'onEnd', () => {
    if (isClosingRef.current || isAdvancingAfterEndRef.current) {
      return;
    }

    isAdvancingAfterEndRef.current = true;
    syncPlaybackProgressCheckpoint({
      client,
      force: true,
      isProgressSyncInFlightRef,
      lastSyncedProgressRef,
      latestPlaybackTimeRef,
      reasonLabel: 'ended',
      setPlaybackStatus,
      shouldUpdateStatus: false,
      videoId: videoDetails.videoId,
    })
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
    if (isPlayingRef.current) {
      const startedAt = playSessionStartedAtMsRef.current;
      if (startedAt) {
        watchedSessionMsRef.current += Math.max(0, Date.now() - startedAt);
      }
      playSessionStartedAtMsRef.current = null;
      isPlayingRef.current = false;
    }
    const watchedSessionSeconds = Math.floor(watchedSessionMsRef.current / 1000);
    const shouldRefreshBrowse =
      watchedSessionSeconds >= TARCHPEEK_CONSTANTS.player.browseRefreshWatchThresholdSeconds ||
      didWatchedStateChangeRef.current;
    onBack({ resultMessage: 'Playback closed.', shouldRefreshBrowse });

    syncPlaybackProgressCheckpoint({
      client,
      force: true,
      isProgressSyncInFlightRef,
      lastSyncedProgressRef,
      latestPlaybackTimeRef,
      reasonLabel: 'exit',
      setPlaybackStatus,
      shouldUpdateStatus: false,
      videoId: videoDetails.videoId,
    }).catch(() => undefined);
  }, [client, onBack, videoDetails.videoId]);

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
    handleToggleWatched,
  };
}

export { usePlayerSession };
