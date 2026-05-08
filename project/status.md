# Project Status

Status: `in_progress`
Current phase: `Phase 04 - Playback MVP`
Last updated: `2026-05-08`

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

## Foundation Outcomes (Phase 02)

- Resume source in-app is read from `/api/video/<video_id>/` metadata, not from `GET /api/video/<video_id>/progress/` in the current environment.
- Progress persistence is validated via `POST /api/video/<video_id>/progress/` and confirmed visible in the TubeArchivist UI.
- `react-native-video` v7 remains the baseline playback integration direction for this repository/runtime.
- App root orchestration was reduced and playback/connection concerns were extracted into focused modules.

## Immediate Next Steps

1. Bundle D (active): Playlist surfaces functional pass
   - Remove `Subscribed/Not subscribed` text from playlist list and playlist detail
   - Prevent destructive channel-name truncation on playlist list cards
   - Rebuild playlist detail layout:
     - top edge-to-edge playlist banner (no rounded corners)
     - channel logo + channel name
     - video count
     - playlist title
     - playlist video list container in server-provided order
2. Bundle D (next): In-player playlist previous/next navigation when playlist context exists
3. Bundle E: Android + Android TV playback validation pass and risk notes

## Bundle Progress Notes

- Bundle A: implemented and approved
- Bundle B: implemented and approved
- Bundle C: implemented and approved
  - Implemented: in-player watched toggle with outlined/filled check-circle state
  - Implemented: watched-last ordering for Home/Continue browse lists (search ordering untouched)
  - Implemented: conditional refetch-based reflection path on player close (single source of truth)
  - Implemented: unified video-list/card container shared by Home/Continue/Search
  - Implemented: browse-card metadata upgrade (channel logo + channel name + human-friendly view count)
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
