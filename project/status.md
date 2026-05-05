# Project Status

Status: `in_progress`
Current phase: `Phase 03 - Browsing MVP`
Last updated: `2026-05-05`

## Product Summary

Build a React Native client for TubeArchivist with its own identity and design language.
The MVP targets `Android` and `Android TV`, prioritizes `Continue Watching`, hides `Shorts`, and favors intentional browsing over engagement-driven discovery.

## Current Focus

- Stabilize Home feed runtime behavior (`FlashList`, page-window memory bounds, and pagination reliability)
- Keep mobile browsing compact and sectionless while preserving `Continue Watching` priority
- Complete remaining Phase 03 surfaces: Playlists and Search
- Validate Android TV focus behavior across implemented browsing surfaces

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

## Foundation Outcomes (Phase 02)

- Resume source in-app is read from `/api/video/<video_id>/` metadata, not from `GET /api/video/<video_id>/progress/` in the current environment.
- Progress persistence is validated via `POST /api/video/<video_id>/progress/` and confirmed visible in the TubeArchivist UI.
- `react-native-video` v7 remains the baseline playback integration direction for this repository/runtime.
- App root orchestration was reduced and playback/connection concerns were extracted into focused modules.

## Immediate Next Steps

1. Stabilize Home growable list behavior on device (20-item pages, manual load-more, smooth scroll, and bounded-memory retention)
2. Implement Playlists list + detail flow with the same finite, explicit pagination model
3. Implement Search explicit submit/results flow (no ambient or infinite discovery)
4. Run Android TV focus checks across Home, Channels, Playlists, and Search surfaces

## Phase Summary

| Phase | Name | Status | Outcome |
| --- | --- | --- | --- |
| 00 | Product Definition | done | Lock scope, UX principles, and repo conventions |
| 01 | Feasibility Spike | done | Proved auth, protected playback, and progress sync |
| 02 | Foundation | done | App shell extraction, playback isolation, and architecture conventions baseline complete |
| 03 | Browsing MVP | in_progress | Deliver intentional discovery and browsing |
| 04 | Playback MVP | planned | Deliver dependable end-to-end viewing |
| 05 | Hardening | planned | Raise quality to repeat-use stability |
| 06 | Beta | planned | Dogfood, triage, and prepare first beta |
