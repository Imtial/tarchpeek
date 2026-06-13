type RefCell<T> = {
  current: T;
};

type WatchSessionState = {
  isPlaying: boolean;
  startedAtMs: number | null;
  watchedMs: number;
};

function startWatchSession(watchSessionRef: RefCell<WatchSessionState>) {
  if (watchSessionRef.current.isPlaying) {
    return;
  }

  watchSessionRef.current.isPlaying = true;
  watchSessionRef.current.startedAtMs = Date.now();
}

function stopWatchSession(watchSessionRef: RefCell<WatchSessionState>) {
  if (!watchSessionRef.current.isPlaying) {
    return;
  }

  const startedAt = watchSessionRef.current.startedAtMs;
  if (startedAt) {
    watchSessionRef.current.watchedMs += Math.max(0, Date.now() - startedAt);
  }

  watchSessionRef.current.startedAtMs = null;
  watchSessionRef.current.isPlaying = false;
}

function getWatchedSessionSeconds(watchSessionRef: RefCell<WatchSessionState>) {
  return Math.floor(watchSessionRef.current.watchedMs / 1000);
}

export { getWatchedSessionSeconds, startWatchSession, stopWatchSession };
export type { WatchSessionState };
