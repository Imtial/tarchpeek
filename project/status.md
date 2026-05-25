# Project Status

Status: `in_progress`
Current phase: `Phase 04 - Playback MVP`
Last updated: `2026-05-26`

## Product Summary

Build a React Native client for TubeArchivist with its own identity and design language.
The MVP targets `Android` and `Android TV`, prioritizes `Continue Watching`, hides `Shorts`, and favors intentional browsing over engagement-driven discovery.

## Current Focus

- Validate the core Android viewing loop end-to-end against the seeded local TubeArchivist fixture
- Prove resume, progress sync, and queue continuity behaviors that already exist in the product
- Capture remaining launch risks explicitly instead of expanding scope with new major features
- Defer Android TV reliability work until emulator/device validation is practical again

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
- Local TubeArchivist resume/progress read paths are inconsistent for automation: `POST /api/video/<video_id>/progress/` succeeds, but subsequent API reads do not provide one reliable cross-endpoint readback path, so the local resume E2E verifies persisted state from the Redis-backed fixture instead.
- `react-native-video` v7 remains the baseline playback integration direction for this repository/runtime.
- App root orchestration was reduced and playback/connection concerns were extracted into focused modules.

## Immediate Next Steps

1. Bundle E (active): Android validation + local E2E bootstrap with persistent seeded TubeArchivist
   - Treat feature scope as ready for an initial launch; focus remaining work on validation and risk capture
   - Use Maestro as the primary Android E2E lane; avoid test-only product hooks
   - Use local persistent TubeArchivist volume with seed list from `project/fixtures/tubearchivist-seed-videos.txt`
   - Lock deterministic restart state by snapshotting seed volumes and restoring before each run
   - Validate one-command bootstrap path and keep the deterministic local fixture healthy
   - Defer Android TV focus/remote validation until emulator/device is reliable again
   - Capture concrete regressions/risks and classify as Blocker/High/Medium
   - Treat additional Android playback E2E expansions as deferred backlog work unless reprioritized

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
  - Implemented: dedicated emulator-network verifier now checks the exact emulator-targeted host-header path before Maestro runs
  - Implemented: connect flow now requires authenticated TubeArchivist validation before entering browse surfaces
  - Implemented: invalid-token handling now keeps the connect screen visible and shows an explicit error banner
  - Implemented: Maestro Android lane covering bootstrap connect, home-feed render, invalid-token error, and browse-to-player-back
  - Implemented: resume E2E setup now seeds deterministic local progress, verifies persisted position directly from the local Redis-backed TubeArchivist state, and resolves the actual Home card selector used by Maestro
  - Implemented: screen-level browsing test anchors plus a dedicated player-back lane covering return to `Home` and `Search`
  - Implemented: search submit now dismisses the keyboard so Android result taps reliably open player after querying
  - Validation note: Maestro is now the mainline Android E2E framework for launch-critical flows
  - Validation note: `npm run e2e:test:android:resume` now passes against the local seeded fixture
  - Validation note: `node scripts/run-maestro-android.mjs maestro/scenarios/player-back-origin-surfaces.yaml` now passes
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
