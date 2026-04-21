# Project Status

Status: `in_progress`
Current phase: `Phase 00 - Product Definition`
Last updated: `2026-04-22`

## Product Summary

Build a React Native client for TubeArchivist with its own identity and design language.
The MVP targets `Android` and `Android TV`, prioritizes `Continue Watching`, hides `Shorts`, and favors intentional browsing over engagement-driven discovery.

## Current Focus

- Lock product boundaries and delivery sequence
- Keep the repository layout stable before app implementation begins
- De-risk playback/auth assumptions before UI-heavy work starts

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

1. Start `Phase 01 - Feasibility Spike`
2. Prove authenticated playback on Android phone and Android TV
3. Confirm progress sync and subtitle behavior
4. Decide whether any backend adaptation is required for reliable playback

## Phase Summary

| Phase | Name | Status | Outcome |
| --- | --- | --- | --- |
| 00 | Product Definition | in_progress | Lock scope, UX principles, and repo conventions |
| 01 | Feasibility Spike | planned | Prove playback, auth, and progress sync |
| 02 | Foundation | planned | Establish app shell and engineering baseline |
| 03 | Browsing MVP | planned | Deliver intentional discovery and browsing |
| 04 | Playback MVP | planned | Deliver dependable end-to-end viewing |
| 05 | Hardening | planned | Raise quality to repeat-use stability |
| 06 | Beta | planned | Dogfood, triage, and prepare first beta |
