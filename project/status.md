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

## Immediate Next Steps

1. Define and document Phase 02 app module boundaries (UI, playback, API, storage)
2. Split current spike-heavy `App.tsx` into foundational modules without changing verified behavior
3. Keep subtitle verification deferred in `project/backlog.md` (`BL-001`)

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
