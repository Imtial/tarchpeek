# Project Status

Status: `in_progress`
Current phase: `Phase 02 - Foundation`
Last updated: `2026-04-29`

## Product Summary

Build a React Native client for TubeArchivist with its own identity and design language.
The MVP targets `Android` and `Android TV`, prioritizes `Continue Watching`, hides `Shorts`, and favors intentional browsing over engagement-driven discovery.

## Current Focus

- Formalize app structure beyond spike code in `/app`
- Preserve verified auth, playback, and progress-sync behavior from Phase 01
- Prepare clean baseline for browsing and playback MVP phases
- Establish token-first design system baseline per `project/decisions/0007-design-system-foundation.md`

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

## Phase 02 Kickoff Assumptions

- Resume source in-app is read from `/api/video/<video_id>/` metadata, not from `GET /api/video/<video_id>/progress/` in the current environment.
- Progress persistence is validated via `POST /api/video/<video_id>/progress/` and confirmed visible in the TubeArchivist UI.
- `react-native-video` v7 remains the baseline playback integration direction for this repository/runtime.

## Immediate Next Steps

1. Execute Phase 02 Bundle B in `project/roadmap/phase-02-foundation.md` (playback extraction + parity verification)
2. Execute Phase 02 Bundle C in `project/roadmap/phase-02-foundation.md` (root orchestration cleanup + conventions)
3. Apply design tokens progressively as modules are extracted to maintain visual consistency
4. Keep subtitle verification deferred in `project/backlog.md` (`BL-001`)

## Phase Summary

| Phase | Name | Status | Outcome |
| --- | --- | --- | --- |
| 00 | Product Definition | done | Lock scope, UX principles, and repo conventions |
| 01 | Feasibility Spike | done | Proved auth, protected playback, and progress sync; subtitle moved to backlog (`BL-001`) |
| 02 | Foundation | in_progress | Establish app shell and engineering baseline |
| 03 | Browsing MVP | planned | Deliver intentional discovery and browsing |
| 04 | Playback MVP | planned | Deliver dependable end-to-end viewing |
| 05 | Hardening | planned | Raise quality to repeat-use stability |
| 06 | Beta | planned | Dogfood, triage, and prepare first beta |
