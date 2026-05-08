const TARCHPEEK_CONSTANTS = {
  playbackProgress: {
    syncIntervalSeconds: 5,
    minDeltaSeconds: 5,
    forceWaitStepMs: 100,
    forceWaitMaxMs: 1500,
  },
  player: {
    collapsedDescriptionLines: 4,
    resumeMinSeconds: 3,
    resumeEndBufferSeconds: 3,
    browseRefreshWatchThresholdSeconds: 180,
  },
  browsing: {
    homePageWindowSize: 3,
    playlistsPageWindowSize: 3,
    playlistsDrawDistance: 300,
    videoListDrawDistance: 300,
    newChipWindowHours: 60,
    secondsPerHour: 60 * 60,
  },
  storageKeys: {
    serverUrl: 'serverUrl',
    apiToken: 'apiToken',
    testVideoInput: 'testVideoInput',
  },
} as const;

export { TARCHPEEK_CONSTANTS };
