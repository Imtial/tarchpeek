# Project Status

Status: `in_progress`
Current phase: `Phase 03 - Browsing MVP`
Last updated: `2026-05-04`

## Product Summary

Build a React Native client for TubeArchivist with its own identity and design language.
The MVP targets `Android` and `Android TV`, prioritizes `Continue Watching`, hides `Shorts`, and favors intentional browsing over engagement-driven discovery.

## Current Focus

- Start Phase 03 browsing implementation on top of completed Phase 02 foundation work
- Build home rails and browsing surfaces with `Continue Watching` as top priority
- Define and implement mobile-targeted browsing specs alongside Android TV parity
- Add mobile card affordances for intentional retrieval (`progress-on-thumbnail` and `New` chips)

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

1. Execute Phase 03 initial browsing unit in `project/roadmap/phase-03-browsing-mvp.md` (home rails scaffold + route wiring + bottom-tab mobile routes)
2. Implement `Continue Watching` as the first-priority home surface
3. Add thumbnail progress indicators and `New` chips on mobile browsing cards
4. Add channels/playlists/search browsing surfaces incrementally with Android phone fluency checks and Android TV focus checks

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
