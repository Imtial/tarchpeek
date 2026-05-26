type RefCell<T> = {
  current: T;
};

type PlayerSessionRefs = {
  isPlayingRef: RefCell<boolean>;
  playSessionStartedAtMsRef: RefCell<number | null>;
  watchedSessionMsRef: RefCell<number>;
};

function startWatchSession(refs: PlayerSessionRefs) {
  if (refs.isPlayingRef.current) {
    return;
  }

  refs.isPlayingRef.current = true;
  refs.playSessionStartedAtMsRef.current = Date.now();
}

function stopWatchSession(refs: PlayerSessionRefs) {
  if (!refs.isPlayingRef.current) {
    return;
  }

  const startedAt = refs.playSessionStartedAtMsRef.current;
  if (startedAt) {
    refs.watchedSessionMsRef.current += Math.max(0, Date.now() - startedAt);
  }

  refs.playSessionStartedAtMsRef.current = null;
  refs.isPlayingRef.current = false;
}

function getWatchedSessionSeconds(watchedSessionMsRef: RefCell<number>) {
  return Math.floor(watchedSessionMsRef.current / 1000);
}

export { getWatchedSessionSeconds, startWatchSession, stopWatchSession };
export type { PlayerSessionRefs };
