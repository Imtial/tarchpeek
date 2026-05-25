# Backlog

Last updated: `2026-05-26`

## Items

- `BL-001` Subtitle verification on real TubeArchivist subtitle tracks
  - Source: deferred from `Phase 01 - Feasibility Spike`
  - Reason deferred: not critical for current feasibility gate after auth, playback, and progress sync validation
  - Desired validation: verify subtitle track discovery and rendering on Android and Android TV using a video that includes subtitles
  - Target phase: `Phase 04 - Playback MVP` (or earlier if needed)

- `BL-002` Android E2E for progress checkpoint persistence
  - Source: deferred from `Phase 04 - Playback MVP / Bundle E`
  - Reason deferred: skipped for now in favor of closing the current validation bundle without more playback-timing automation
  - Desired validation: cover pause, back-exit, and playback-end persistence against the deterministic local fixture
  - Target phase: `Phase 05 - Hardening`

- `BL-003` Android E2E for autoplay-next and end-of-queue behavior
  - Source: deferred from `Phase 04 - Playback MVP / Bundle E`
  - Reason deferred: skipped for now because it depends on more deterministic queue-oriented fixture coverage than the current bundle needs
  - Desired validation: verify autoplay-next from Home, Continue Watching, Playlist detail, and Search, plus end-of-queue no-op behavior
  - Target phase: `Phase 05 - Hardening`

- `BL-004` Android E2E for deterministic play-to-end transitions
  - Source: deferred from `Phase 04 - Playback MVP / Bundle E`
  - Reason deferred: skipped for now to avoid expanding timing-sensitive playback automation inside the current bundle
  - Desired validation: cover connect -> open -> play -> end behavior using deterministic short media in the local seeded fixture
  - Target phase: `Phase 05 - Hardening`
