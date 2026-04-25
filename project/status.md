# Project Status

Status: `in_progress`
Current phase: `Phase 01 - Feasibility Spike`
Last updated: `2026-04-26`

## Product Summary

Build a React Native client for TubeArchivist with its own identity and design language.
The MVP targets `Android` and `Android TV`, prioritizes `Continue Watching`, hides `Shorts`, and favors intentional browsing over engagement-driven discovery.

## Current Focus

- Bootstrap the minimal app shell in `/app`
- Prove API-token auth and protected media playback
- Validate progress sync, subtitles, and Android TV playback-path interaction

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

1. Bootstrap the minimal React Native app shell in `/app`
2. Implement `Server URL + API token` input and persistence
3. Fetch one known-good video and attempt authenticated playback
4. Document playback, subtitle, and progress-sync findings

## Phase Summary

| Phase | Name | Status | Outcome |
| --- | --- | --- | --- |
| 00 | Product Definition | done | Lock scope, UX principles, and repo conventions |
| 01 | Feasibility Spike | in_progress | Prove playback, auth, and progress sync |
| 02 | Foundation | planned | Establish app shell and engineering baseline |
| 03 | Browsing MVP | planned | Deliver intentional discovery and browsing |
| 04 | Playback MVP | planned | Deliver dependable end-to-end viewing |
| 05 | Hardening | planned | Raise quality to repeat-use stability |
| 06 | Beta | planned | Dogfood, triage, and prepare first beta |
