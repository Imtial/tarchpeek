# Project Status

Status: `in_progress`
Current phase: `Phase 04 - Playback MVP`
Last updated: `2026-05-24`

## Product Summary

Build a React Native client for TubeArchivist with its own identity and design language.
The MVP targets `Android` and `Android TV`, prioritizes `Continue Watching`, hides `Shorts`, and favors intentional browsing over engagement-driven discovery.

## Current Focus

- Deliver dependable browse-to-play flow on Android and Android TV
- Stabilize playback runtime quality and list-to-player continuity on Android + Android TV
- Make playlist browsing surfaces fully functional and layout-correct (playlist list + playlist detail)
- Preserve Bundle C behavior through regression checks while playlist work lands

## Active Constraints

- App code must live in `/app`
- Tracking must live at repo root
- Primary deployment context is self-hosted, usually local network
- MVP auth is manual `API token` entry
- One saved server is the default assumption

## Known Risks

- TubeArchivist media playback may behave differently from JSON API auth
- Local-network HTTP/self-signed setups may introduce Android networking issues
- Android TV focus quality can regress if not validated continuously
- TubeArchivist API is usable but not a stable third-party contract
- Android TV emulator is currently unreliable on local macOS environment, reducing near-term TV validation confidence

## Foundation Outcomes (Phase 02)

- Resume source in-app is read from `/api/video/<video_id>/` metadata, not from `GET /api/video/<video_id>/progress/` in the current environment.
- Progress persistence is validated via `POST /api/video/<video_id>/progress/` and confirmed visible in the TubeArchivist UI.
- `react-native-video` v7 remains the baseline playback integration direction for this repository/runtime.
- App root orchestration was reduced and playback/connection concerns were extracted into focused modules.

## Immediate Next Steps

1. Bundle E (active): Android validation + local E2E bootstrap with persistent seeded TubeArchivist
   - Validate resume start behavior on partially watched videos
   - Validate progress checkpoint persistence for pause, back-exit, and playback end
   - Validate autoplay next-in-queue behavior from Home, Continue Watching, Playlist detail, and Search
   - Validate end-of-queue no-op behavior
   - Use local persistent TubeArchivist volume with seed list from `project/fixtures/tubearchivist-seed-videos.txt`
   - Lock deterministic restart state by snapshotting seed volumes and restoring before each run
   - Add Android E2E baseline for connect -> open -> play -> end behavior (local-only, no CI)
   - Defer Android TV focus/remote validation until emulator/device is reliable again
   - Capture concrete regressions/risks and classify as Blocker/High/Medium

## Bundle Progress Notes

- Bundle A: implemented and approved
- Bundle B: implemented and approved
- Bundle C: implemented and approved
  - Implemented: in-player watched toggle with outlined/filled check-circle state
  - Implemented: watched-last ordering for Home/Continue browse lists (search ordering untouched)
  - Implemented: conditional refetch-based reflection path on player close (single source of truth)
  - Implemented: unified video-list/card container shared by Home/Continue/Search
  - Implemented: browse-card metadata upgrade (channel logo + channel name + human-friendly view count)
- Bundle D: implemented and approved
  - Implemented: playlist list + playlist detail layout correction pass
  - Implemented: preserve browsing tab/stack state when exiting player
  - Implemented: responsive single-press player back exit (non-blocking final progress sync)
  - Implemented: centralized app constants in single namespaced module (`TARCHPEEK_CONSTANTS`)
  - Implemented: autoplay next-in-queue on playback end when queue context exists (end-of-queue is no-op)
- Bundle E: local Android emulator home-feed fetch path unblocked
  - Implemented: local TubeArchivist fixture now accepts both `localhost` and `10.0.2.2` host headers via `TA_HOST`
  - Implemented: dedicated emulator-network verifier now checks the exact emulator-targeted host-header path before Detox runs
  - Implemented: confirmed Detox `connects and loads first home video card` path renders Home items on emulator
- Image caching: no dedicated app-level LRU cache planned; continue with platform-native `Image` caching behavior

## Phase Summary

| Phase | Name | Status | Outcome |
| --- | --- | --- | --- |
| 00 | Product Definition | done | Lock scope, UX principles, and repo conventions |
| 01 | Feasibility Spike | done | Proved auth, protected playback, and progress sync |
| 02 | Foundation | done | App shell extraction, playback isolation, and architecture conventions baseline complete |
| 03 | Browsing MVP | done | Delivered Home, Channels, Playlists, and Search browsing surfaces with explicit interaction and TV focus affordance baseline |
| 04 | Playback MVP | in_progress | Deliver dependable end-to-end viewing |
| 05 | Hardening | planned | Raise quality to repeat-use stability |
| 06 | Beta | planned | Dogfood, triage, and prepare first beta |
